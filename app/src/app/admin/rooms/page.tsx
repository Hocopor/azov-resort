import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { AdminRoomsClient } from '@/components/admin/AdminRoomsClient'

export const metadata = { title: 'Номера — Панель управления' }
export const revalidate = 0

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { bookings: true } },
      blockedDates: { where: { dateTo: { gte: new Date() } } },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'PENDING'] }, checkOut: { gte: new Date() } },
        select: { checkIn: true, checkOut: true, guestName: true, status: true },
        orderBy: { checkIn: 'asc' },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Номера</h1>
          <p className="text-gray-500 text-sm mt-1">Управление номерами и доступностью</p>
        </div>
      </div>
      <AdminRoomsClient rooms={rooms} />
    </div>
  )
}
