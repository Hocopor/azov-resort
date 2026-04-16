import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BookingsList } from '@/components/account/BookingsList'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Мои брони' }

export default async function BookingsPage() {
  const session = await auth()
  const bookings = await prisma.booking.findMany({
    where: { userId: session!.user.id },
    include: { room: { select: { name: true, slug: true, images: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gray-900">Мои брони</h1>
        <p className="text-gray-500 text-sm mt-1">{bookings.length > 0 ? `Всего броней: ${bookings.length}` : 'У вас пока нет броней'}</p>
      </div>
      <BookingsList bookings={bookings} />
    </div>
  )
}
