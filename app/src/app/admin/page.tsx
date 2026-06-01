import { prisma } from '@/lib/db'
import { formatMoney, getBookingStatusLabel, getBookingStatusColor, formatDate } from '@/lib/utils'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import {
  Calendar, Users, CreditCard, BedDouble,
  ArrowRight, AlertCircle, CheckCircle, Clock,
  Eye, MousePointerClick, Sparkles
} from 'lucide-react'

export const metadata = { title: 'Дашборд' }
export const revalidate = 10 // Refresh quite frequently in admin panel

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  // Fetch metrics and records
  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    revenue,
    recentBookings,
    todayCheckIns,
    todayCheckOuts,
    rooms,
  ] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { status: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { depositAmount: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { room: { select: { name: true } } },
    }),
    prisma.booking.findMany({
      where: {
        checkIn: { gte: startOfDay(now), lte: endOfDay(now) },
        status: 'CONFIRMED',
      },
      include: { room: { select: { name: true } } },
    }),
    prisma.booking.findMany({
      where: {
        checkOut: { gte: startOfDay(now), lte: endOfDay(now) },
        status: 'CONFIRMED',
      },
      include: { room: { select: { name: true } } },
    }),
    prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    }),
  ])

  // Calculate unique visitors
  const uniqueIPsResult = await prisma.pageView.groupBy({
    by: ['ip'],
    where: { createdAt: { gte: thirtyDaysAgo } }
  })
  const uniqueVisitors = uniqueIPsResult.length

  // Visitors who entered the rooms page details
  const visitedRoomsResult = await prisma.pageView.groupBy({
    by: ['ip'],
    where: {
      path: { startsWith: '/rooms/' },
      createdAt: { gte: thirtyDaysAgo }
    }
  })
  const roomVisitors = visitedRoomsResult.filter(n => n.ip !== null && n.ip !== 'unknown').length

  // Attempted to book tracking
  const bookingAttemptsCount = await prisma.conversionEvent.count({
    where: {
      event: { in: ['booking_attempt', 'booking_started'] },
      createdAt: { gte: thirtyDaysAgo }
    }
  })

  // Populating detailed stats per room
  const roomStats = await Promise.all(
    rooms.map(async (room) => {
      const [pvCount, attemptCount, bookingCount] = await Promise.all([
        // заходов на страницу номера
        prisma.conversionEvent.count({
          where: {
            roomId: room.id,
            event: 'room_view',
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        // попытался забронировать
        prisma.conversionEvent.count({
          where: {
            roomId: room.id,
            event: { in: ['booking_attempt', 'booking_started'] },
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        // забронировано
        prisma.booking.count({
          where: {
            roomId: room.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      ])

      return {
        id: room.id,
        name: room.name,
        views: pvCount,
        attempts: attemptCount,
        bookings: bookingCount
      }
    })
  )

  // Sort by popularity (highest bookings then highest attempts)
  roomStats.sort((a, b) => b.bookings - a.bookings || b.attempts - a.attempts || b.views - a.views)

  return {
    metrics: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      revenue: revenue._sum.depositAmount || 0,
      uniqueVisitors,
      roomVisitors,
      bookingAttempts: bookingAttemptsCount
    },
    recentBookings,
    todayCheckIns,
    todayCheckOuts,
    roomStats
  }
}

export default async function AdminDashboard() {
  const { metrics, recentBookings, todayCheckIns, todayCheckOuts, roomStats } = await getDashboardData()

  const statCards = [
    { label: 'Броней за 30 дней', value: String(metrics.totalBookings), sub: `${metrics.confirmedBookings} подтверждено`, icon: Calendar, color: 'text-sea-600 bg-sea-50' },
    { label: 'Ожидают оплаты', value: String(metrics.pendingBookings), sub: 'требуют внимания', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', urgent: metrics.pendingBookings > 0 },
    { label: 'Выручка (депозиты)', value: formatMoney(metrics.revenue), sub: 'за 30 дней', icon: CreditCard, color: 'text-green-600 bg-green-50' },
    { label: 'Уникальных посетителей', value: String(metrics.uniqueVisitors), sub: 'за 30 дней', icon: Users, color: 'text-purple-600 bg-purple-50' },
  ]

  // Calculated conversion percentages
  const pctOpenedRooms = metrics.uniqueVisitors > 0 ? Math.round((metrics.roomVisitors / metrics.uniqueVisitors) * 100) : 0
  const pctAttemptedBooking = metrics.roomVisitors > 0 ? Math.round((metrics.bookingAttempts / metrics.roomVisitors) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'd MMMM yyyy', { locale: ru })}</p>
      </div>

      {/* Today alerts */}
      {(todayCheckIns.length > 0 || todayCheckOuts.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {todayCheckIns.length > 0 && (
            <div className="admin-card border-l-4 border-green-400">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-800">Заезжают сегодня ({todayCheckIns.length})</h3>
              </div>
              {todayCheckIns.map((b) => (
                <div key={b.id} className="text-sm text-gray-600">• {b.room.name} — {b.guestName}</div>
              ))}
            </div>
          )}
          {todayCheckOuts.length > 0 && (
            <div className="admin-card border-l-4 border-blue-400">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Выезжают сегодня ({todayCheckOuts.length})</h3>
              </div>
              {todayCheckOuts.map((b) => (
                <div key={b.id} className="text-sm text-gray-600">• {b.room.name} — {b.guestName}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`admin-card ${card.urgent ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Analytics: Monitoring & Room popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visitors Monitoring block */}
        <div className="admin-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sea-600" /> Активность посетителей (30 дн.)
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Step 1: Unique Visitors */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Всего на сайте</div>
                  <div className="text-sm font-medium text-gray-700">Уникальные посетители</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{metrics.uniqueVisitors}</div>
                <div className="text-xs text-gray-400">100%</div>
              </div>
            </div>

            {/* Step 2: Visited Rooms */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Интерес к номерам</div>
                  <div className="text-sm font-medium text-gray-700">Зашли в карточки номеров</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{metrics.roomVisitors}</div>
                <div className="text-xs text-blue-600 font-semibold">{pctOpenedRooms}% от всех</div>
              </div>
            </div>

            {/* Step 3: Booking Attempts */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-coral-500 uppercase font-bold tracking-wider">Попытка забронировать</div>
                  <div className="text-sm font-medium text-gray-700">Потыкали календарь/форму</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{metrics.bookingAttempts}</div>
                <div className="text-xs text-coral-600 font-semibold">{pctAttemptedBooking}% из номеров</div>
              </div>
            </div>
          </div>
        </div>

        {/* Room popularity block */}
        <div className="admin-card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-sea-600" /> Популярность номеров
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-normal text-left">Категория номера</th>
                  <th className="pb-3 pr-4 font-normal text-center">Заходов</th>
                  <th className="pb-3 pr-4 font-normal text-center">Попыток</th>
                  <th className="pb-3 font-normal text-center">Забронировано</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roomStats.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 pr-4 font-medium text-gray-800 text-left">{room.name}</td>
                    <td className="py-3.5 pr-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {room.views}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
                        {room.attempts}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        {room.bookings}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">Последние бронирования</h3>
          <Link href="/admin/bookings" className="text-sm text-sea-700 font-medium hover:underline flex items-center gap-1">
            Все брони <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['ID', 'Номер', 'Гость', 'Телефон', 'Заезд', 'Выезд', 'Сумма', 'Статус'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 text-gray-400 text-xs">#{b.bookingNumber.slice(-6).toUpperCase()}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{b.room.name}</td>
                  <td className="py-3 pr-4 text-gray-700">{b.guestName}</td>
                  <td className="py-3 pr-4 text-gray-500">{b.guestPhone}</td>
                  <td className="py-3 pr-4 text-gray-600">{formatDate(b.checkIn, 'd MMM')}</td>
                  <td className="py-3 pr-4 text-gray-600">{formatDate(b.checkOut, 'd MMM')}</td>
                  <td className="py-3 pr-4 font-semibold text-gray-900">{formatMoney(b.depositAmount)}</td>
                  <td className="py-3">
                    <span className={`badge ${getBookingStatusColor(b.status)}`}>{getBookingStatusLabel(b.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
