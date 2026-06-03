import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayment } from '@/lib/yookassa'

// Official YooKassa notification IP ranges (https://yookassa.ru/developers/using-api/webhooks)
const YOOKASSA_IP_RANGES = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '3.220.24.244',
  '84.252.153.120',
  '91.108.4.0/22',
]

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0
}

function isIpInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr
  const [range, bits] = cidr.split('/')
  const mask = ~((1 << (32 - parseInt(bits, 10))) - 1) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask)
}

function isYookassaIp(ip: string): boolean {
  return YOOKASSA_IP_RANGES.some((range) => isIpInCidr(ip, range))
}

export async function POST(req: NextRequest) {
  try {
    // Verify request comes from YooKassa IP ranges
    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      ''

    if (ip && !isYookassaIp(ip)) {
      console.warn('[webhook] Rejected request from unknown IP:', ip)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    if (!body.event || !body.object?.id) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Always re-fetch payment from YooKassa — never trust body fields for status
    let payment
    try {
      payment = await getPayment(body.object.id)
    } catch {
      console.error('[webhook] Failed to verify payment:', body.object.id)
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const bookingId = payment.metadata?.booking_id
    if (!bookingId) {
      return NextResponse.json({ ok: true })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    })

    if (!booking) {
      return NextResponse.json({ ok: true })
    }

    // Use the authoritative status from YooKassa API, not the body event field
    const paymentStatus = payment.status // 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'

    if (paymentStatus === 'succeeded') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
          paidAt: new Date(),
          paymentId: payment.id,
        },
      })

      // Idempotent conversion tracking — skip if already recorded
      const existing = await prisma.conversionEvent.findFirst({
        where: { bookingId, event: 'payment_completed' },
      })
      if (!existing) {
        await prisma.conversionEvent.create({
          data: {
            event: 'payment_completed',
            roomId: booking.roomId,
            bookingId,
            userId: booking.userId ?? undefined,
            metadata: { amount: payment.amount.value },
          },
        })
      }

    } else if (paymentStatus === 'canceled' && booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'FAILED' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
