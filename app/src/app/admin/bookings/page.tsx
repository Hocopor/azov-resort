import { prisma } from '@/lib/db'
import { formatMoney, formatDate, getBookingStatusLabel, getBookingStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { AdminBookingsClient } from '@/components/admin/AdminBookingsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Бронирования — Панель управления' }
export const revalidate = 0

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; room?: string; q?: string; page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const perPage = 20

  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.room) where.roomId = searchParams.room
  if (searchParams.q) {
    where.OR = [
      { guestName: { contains: searchParams.q, mode: 'insensitive' } },
      { guestPhone: { contains: searchParams.q } },
      { bookingNumber: { contains: searchParams.q, mode: 'insensitive' } },
    ]
  }

  const [bookings, total, rooms] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { room: { select: { name: true } }, user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
    prisma.room.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Бронирования</h1>
          <p className="text-gray-500 text-sm mt-1">Всего: {total}</p>
        </div>
        <Link href="/admin/bookings/new" className="btn-primary text-sm">
          + Добавить вручную
        </Link>
      </div>

      <AdminBookingsClient
        bookings={bookings}
        rooms={rooms}
        total={total}
        page={page}
        perPage={perPage}
      />
    </div>
  )
}
