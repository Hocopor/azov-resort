import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRefund, calculateRefundAmount } from '@/lib/yookassa'
import { getSettings } from '@/lib/settings'
import { sendBookingCancellation } from '@/lib/email'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true },
    })

    if (!booking) return NextResponse.json({ error: 'Бронь не найдена' }, { status: 404 })

    // Check ownership (or admin)
    if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Бронь уже отменена' }, { status: 400 })
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Нельзя отменить завершённую бронь' }, { status: 400 })
    }

    // Calculate refund
    const settings = await getSettings(['cancellation_policy', 'cancellation_partial_days'])
    const refundCalc = calculateRefundAmount({
      depositAmount: booking.depositAmount,
      checkIn: booking.checkIn,
      cancellationPolicyDays: parseInt(settings.cancellation_policy || '14'),
      cancellationPartialDays: parseInt(settings.cancellation_partial_days || '7'),
    })

    let refundId: string | undefined

    // Process refund if payment was made
    if (booking.paymentStatus === 'DEPOSIT_PAID' && booking.paymentId && refundCalc.amount > 0) {
      try {
        const refund = await createRefund({
          paymentId: booking.paymentId,
          amount: refundCalc.amount,
          bookingId: booking.id,
        })
        refundId = refund.id
      } catch (e) {
        console.error('Refund failed:', e)
        // Continue with cancellation even if refund fails — admin will handle manually
      }
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: refundCalc.amount > 0 ? 'REFUNDED' : booking.paymentStatus,
        cancelledAt: new Date(),
        refundAmount: refundCalc.amount,
        refundId,
      },
    })

    // Send cancellation email
    if (booking.guestEmail) {
      sendBookingCancellation({
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        bookingNumber: booking.bookingNumber,
        roomName: booking.room.name,
        checkIn: booking.checkIn,
        refundAmount: refundCalc.amount,
      }).catch(console.error)
    }

    return NextResponse.json({
      cancelled: true,
      refundAmount: refundCalc.amount,
      refundPolicy: refundCalc.policy,
    })
  } catch (err) {
    console.error('Cancel booking error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { room: { select: { name: true, slug: true, images: true } } },
  })

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(booking)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const booking = await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: body.status,
      adminNotes: body.adminNotes,
      paymentStatus: body.paymentStatus,
    },
  })

  return NextResponse.json(booking)
}
