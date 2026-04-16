import { prisma } from '@/lib/db'
import { formatMoney, getBookingStatusLabel, getBookingStatusColor, formatDate } from '@/lib/utils'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import {
  TrendingUp, Calendar, Users, CreditCard, BedDouble,
  ArrowRight, AlertCircle, CheckCircle, Clock
} from 'lucide-react'

export const metadata = { title: 'Дашборд' }
export const revalidate = 60

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sevenDaysAgo = subDays(now, 7)

  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    revenue,
    recentBookings,
    todayCheckIns,
    todayCheckOuts,
    pageViews30d,
    conversionEvents,
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
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.conversionEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { event: true },
    }),
    prisma.room.findMany({ where: { isActive: true }, select: { id: true, name: true, bookings: { where: { status: { in: ['CONFIRMED'] }, checkOut: { gte: now } }, select: { checkIn: true, checkOut: true } } } }),
  ])

  const funnelData = {
    views: pageViews30d,
    started: conversionEvents.find((e) => e.event === 'booking_started')?._count.event || 0,
    completed: conversionEvents.find((e) => e.event === 'payment_completed')?._count.event || 0,
  }

  return {
    metrics: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      revenue: revenue._sum.depositAmount || 0,
      pageViews30d,
    },
    recentBookings,
    todayCheckIns,
    todayCheckOuts,
    funnelData,
    rooms,
  }
}

export default async function AdminDashboard() {
  const { metrics, recentBookings, todayCheckIns, todayCheckOuts, funnelData, rooms } = await getDashboardData()

  const statCards = [
    { label: 'Броней за 30 дней', value: String(metrics.totalBookings), sub: `${metrics.confirmedBookings} подтверждено`, icon: Calendar, color: 'text-sea-600 bg-sea-50' },
    { label: 'Ожидают оплаты', value: String(metrics.pendingBookings), sub: 'требуют внимания', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', urgent: metrics.pendingBookings > 0 },
    { label: 'Выручка (депозиты)', value: formatMoney(metrics.revenue), sub: 'за 30 дней', icon: CreditCard, color: 'text-green-600 bg-green-50' },
    { label: 'Посетителей', value: String(metrics.pageViews30d), sub: 'за 30 дней', icon: Users, color: 'text-purple-600 bg-purple-50' },
  ]

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

      {/* Charts + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion funnel */}
        <div className="admin-card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sea-600" /> Воронка конверсии (30 дн.)
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Просмотры страниц', value: funnelData.views, color: 'bg-sea-200', pct: 100 },
              { label: 'Начали бронирование', value: funnelData.started, color: 'bg-sea-400', pct: funnelData.views > 0 ? Math.round(funnelData.started / funnelData.views * 100) : 0 },
              { label: 'Оплатили', value: funnelData.completed, color: 'bg-green-400', pct: funnelData.started > 0 ? Math.round(funnelData.completed / funnelData.started * 100) : 0 },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{step.label}</span>
                  <span className="font-semibold text-gray-900">{step.value} <span className="text-gray-400 font-normal text-xs">({step.pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room occupancy */}
        <div className="admin-card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-sea-600" /> Занятость номеров
          </h3>
          <div className="space-y-2">
            {rooms.map((room) => {
              const isOccupied = room.bookings.length > 0
              return (
                <div key={room.id} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOccupied ? 'bg-coral-500' : 'bg-green-400'}`} />
                  <span className="text-sm text-gray-700 flex-1">{room.name}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${isOccupied ? 'bg-coral-100 text-coral-700' : 'bg-green-100 text-green-700'}`}>
                    {isOccupied ? 'Занят' : 'Свободен'}
                  </span>
                </div>
              )
            })}
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
                {['Номер', 'Номер', 'Гость', 'Телефон', 'Заезд', 'Выезд', 'Сумма', 'Статус'].map((h) => (
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
