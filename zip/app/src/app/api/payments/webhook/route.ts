import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayment } from '@/lib/yookassa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // YooKassa sends notification with event type
    if (!body.event || !body.object) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const paymentObject = body.object
    const event: string = body.event

    // Verify payment with YooKassa API
    let payment
    try {
      payment = await getPayment(paymentObject.id)
    } catch {
      console.error('Failed to verify payment:', paymentObject.id)
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const bookingId = payment.metadata?.booking_id
    if (!bookingId) {
      console.error('No booking_id in payment metadata:', payment.id)
      return NextResponse.json({ ok: true }) // Acknowledge but ignore
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    })

    if (!booking) {
      console.error('Booking not found:', bookingId)
      return NextResponse.json({ ok: true })
    }

    if (event === 'payment.succeeded') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
          paidAt: new Date(),
          paymentId: payment.id,
        },
      })

      // Track conversion
      await prisma.conversionEvent.create({
        data: {
          event: 'payment_completed',
          roomId: booking.roomId,
          bookingId: bookingId,
          userId: booking.userId ?? undefined,
          metadata: { amount: payment.amount.value },
        },
      })

    } else if (event === 'payment.canceled') {
      // Only update if still pending
      if (booking.status === 'PENDING') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'FAILED',
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
