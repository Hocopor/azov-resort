import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDepositSettings, calculateDeposit } from '@/lib/settings'
import { parseISO, differenceInCalendarDays } from 'date-fns'
import { z } from 'zod'

const schema = z.object({
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(7),
  guestEmail: z.string().email().optional().or(z.literal('')),
  guests: z.number().min(1),
  hasPets: z.boolean().default(false),
  smoking: z.boolean().default(false),
  transferNeeded: z.boolean().default(false),
  transferFrom: z.string().optional(),
  comment: z.string().optional(),
  source: z.enum(['PHONE', 'ADMIN', 'OTHER']),
  status: z.enum(['PENDING', 'CONFIRMED', 'BLOCKED']),
  paymentStatus: z.enum(['UNPAID', 'DEPOSIT_PAID', 'FULLY_PAID']),
  adminNotes: z.string().optional(),
  totalPrice: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некорректные данные', details: parsed.error.errors }, { status: 400 })
  }

  const data = parsed.data
  const checkIn = parseISO(data.checkIn)
  const checkOut = parseISO(data.checkOut)
  const nights = differenceInCalendarDays(checkOut, checkIn)

  const room = await prisma.room.findUnique({ where: { id: data.roomId } })
  if (!room) return NextResponse.json({ error: 'Номер не найден' }, { status: 404 })

  const totalPrice = data.totalPrice ?? room.pricePerDay * nights
  const depositSettings = await getDepositSettings()
  const depositAmount = calculateDeposit(totalPrice, depositSettings)

  const booking = await prisma.booking.create({
    data: {
      roomId: data.roomId,
      checkIn,
      checkOut,
      nights,
      guests: data.guests,
      hasPets: data.hasPets,
      smoking: data.smoking,
      transferNeeded: data.transferNeeded,
      transferFrom: data.transferFrom,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail || null,
      comment: data.comment,
      totalPrice,
      depositAmount,
      depositType: depositSettings.type,
      depositValue: depositSettings.type === 'PERCENT' ? depositSettings.percent : depositSettings.fixed,
      status: data.status,
      paymentStatus: data.paymentStatus,
      source: data.source,
      adminNotes: data.adminNotes,
      paidAt: data.paymentStatus !== 'UNPAID' ? new Date() : null,
    },
  })

  return NextResponse.json(booking)
}
