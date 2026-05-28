import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        refundAmount: 0,
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
        refundAmount: 0,
      }).catch(console.error)
    }

    return NextResponse.json({
      cancelled: true,
      refundAmount: 0,
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
