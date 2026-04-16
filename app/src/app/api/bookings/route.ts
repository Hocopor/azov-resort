import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDepositSettings, calculateDeposit } from '@/lib/settings'
import { createPayment } from '@/lib/yookassa'
import { sendBookingConfirmation, sendAdminBookingNotification } from '@/lib/email'
import { countNights } from '@/lib/utils'
import { z } from 'zod'
import { isBefore, isAfter, parseISO } from 'date-fns'

const bookingSchema = z.object({
  roomId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1).max(30),
  hasPets: z.boolean().default(false),
  petsDescription: z.string().optional(),
  smoking: z.boolean().default(false),
  transferNeeded: z.boolean().default(false),
  transferFrom: z.string().optional(),
  transferDate: z.string().optional(),
  transferUnknown: z.boolean().default(false),
  guestName: z.string().min(2),
  guestPhone: z.string().min(7),
  guestEmail: z.string().email().optional().or(z.literal('')),
  comment: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные', details: parsed.error.errors }, { status: 400 })
    }

    const data = parsed.data
    const checkIn = parseISO(data.checkIn)
    const checkOut = parseISO(data.checkOut)

    if (!isAfter(checkOut, checkIn)) {
      return NextResponse.json({ error: 'Дата выезда должна быть позже даты заезда' }, { status: 400 })
    }

    if (isBefore(checkIn, new Date())) {
      return NextResponse.json({ error: 'Дата заезда не может быть в прошлом' }, { status: 400 })
    }

    const nights = countNights(checkIn, checkOut)
    if (nights < 1) {
      return NextResponse.json({ error: 'Минимальный срок бронирования — 1 ночь' }, { status: 400 })
    }

    // Check room exists
    const room = await prisma.room.findUnique({
      where: { id: data.roomId, isActive: true },
    })

    if (!room) {
      return NextResponse.json({ error: 'Номер не найден' }, { status: 404 })
    }

    if (data.guests > room.capacity) {
      return NextResponse.json({ error: `Максимум ${room.capacity} гостей в этом номере` }, { status: 400 })
    }

    // Check availability
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({ error: 'Выбранные даты уже заняты. Пожалуйста, выберите другие даты.' }, { status: 409 })
    }

    const blockedConflict = await prisma.blockedDate.findFirst({
      where: {
        roomId: data.roomId,
        dateFrom: { lt: checkOut },
        dateTo: { gt: checkIn },
      },
    })

    if (blockedConflict) {
      return NextResponse.json({ error: 'Выбранные даты недоступны.' }, { status: 409 })
    }

    // Calculate price
    const totalPrice = room.pricePerDay * nights
    const depositSettings = await getDepositSettings()
    const depositAmount = calculateDeposit(totalPrice, depositSettings)

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        userId: session?.user?.id,
        checkIn,
        checkOut,
        nights,
        guests: data.guests,
        hasPets: data.hasPets,
        petsDescription: data.petsDescription,
        smoking: data.smoking,
        transferNeeded: data.transferNeeded,
        transferFrom: data.transferFrom,
        transferDate: data.transferDate ? parseISO(data.transferDate) : null,
        transferUnknown: data.transferUnknown,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail || null,
        comment: data.comment,
        totalPrice,
        depositAmount,
        depositType: depositSettings.type,
        depositValue: depositSettings.type === 'PERCENT' ? depositSettings.percent : depositSettings.fixed,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        source: session ? 'WEBSITE' : 'WEBSITE',
      },
    })

    // Track conversion event
    await prisma.conversionEvent.create({
      data: {
        event: 'booking_started',
        roomId: data.roomId,
        bookingId: booking.id,
        userId: session?.user?.id,
      },
    })

    // Create YooKassa payment
    let paymentUrl: string | null = null
    try {
      const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/account/bookings?booking=${booking.id}&payment=success`
      const payment = await createPayment({
        amount: depositAmount,
        description: `Депозит за номер «${room.name}» с ${checkIn.toLocaleDateString('ru-RU')} по ${checkOut.toLocaleDateString('ru-RU')}`,
        bookingId: booking.id,
        returnUrl,
        email: data.guestEmail || undefined,
        phone: data.guestPhone,
      })

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentId: payment.id,
          paymentUrl: payment.confirmation.confirmation_url,
        },
      })

      paymentUrl = payment.confirmation.confirmation_url
    } catch (paymentError) {
      console.error('Payment creation failed:', paymentError)
      // Continue without payment URL — admin can handle manually
    }

    // Send emails (non-blocking)
    const emailData = {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      guestName: data.guestName,
      guestEmail: data.guestEmail || '',
      roomName: room.name,
      checkIn,
      checkOut,
      nights,
      guests: data.guests,
      depositAmount,
      totalPrice,
      paymentUrl: paymentUrl || undefined,
    }

    if (data.guestEmail) {
      sendBookingConfirmation(emailData).catch(console.error)
    }

    sendAdminBookingNotification({
      ...emailData,
      guestPhone: data.guestPhone,
      comment: data.comment,
    }).catch(console.error)

    return NextResponse.json({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      paymentUrl,
      totalPrice,
      depositAmount,
    })
  } catch (err) {
    console.error('Booking creation error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { room: { select: { name: true, slug: true, images: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bookings)
}
