'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Calendar, Users, MapPin, CreditCard, XCircle, CheckCircle,
  Clock, AlertCircle, Waves, ArrowRight, Loader2, Info
} from 'lucide-react'
import { formatDate, formatMoney, nightsLabel, getBookingStatusLabel, getBookingStatusColor, getDaysUntilCheckIn } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'

interface Booking {
  id: string
  bookingNumber: string
  checkIn: Date
  checkOut: Date
  nights: number
  guests: number
  totalPrice: number
  depositAmount: number
  status: string
  paymentStatus: string
  paymentUrl?: string | null
  cancelledAt?: Date | null
  refundAmount?: number | null
  room: { name: string; slug: string; images: string[] }
}

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const msg = data.refundAmount > 0
        ? `Бронь отменена. Возврат ${formatMoney(data.refundAmount)} в течение 3–5 дней.`
        : 'Бронь отменена. Возврат не предусмотрен по условиям.'
      success(msg)
      router.refresh()
    } catch (e: any) {
      showError(e.message || 'Не удалось отменить бронь')
    } finally {
      setCancellingId(null)
      setConfirmCancel(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <Waves className="w-16 h-16 text-sea-200 mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">Пока нет броней</h3>
        <p className="text-gray-400 text-sm mb-6">Забронируйте номер и отдохните у Азовского моря!</p>
        <Link href="/rooms" className="btn-primary">Выбрать номер →</Link>
      </div>
    )
  }

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    CONFIRMED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />,
    COMPLETED: <CheckCircle className="w-4 h-4" />,
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const daysLeft = getDaysUntilCheckIn(new Date(b.checkIn))
        const canCancel = b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && daysLeft > 0
        const isActive = b.status === 'CONFIRMED' && daysLeft > 0

        return (
          <div key={b.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${b.status === 'CANCELLED' ? 'opacity-70' : 'border-gray-100'}`}>
            <div className="flex flex-col sm:flex-row">
              {/* Room image */}
              <div className="relative sm:w-44 h-32 sm:h-auto bg-gradient-to-br from-sea-100 to-sea-200 flex-shrink-0">
                {b.room.images[0] ? (
                  <Image src={b.room.images[0]} alt={b.room.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Waves className="w-10 h-10 text-sea-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{b.room.name}</h3>
                      <span className={`badge ${getBookingStatusColor(b.status)} flex items-center gap-1`}>
                        {statusIcons[b.status]} {getBookingStatusLabel(b.status)}
                      </span>
                      {isActive && daysLeft <= 3 && (
                        <span className="badge bg-coral-100 text-coral-700">
                          Скоро заезд!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Бронь #{b.bookingNumber.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sea-700">{formatMoney(b.totalPrice)}</div>
                    <div className="text-xs text-gray-400">{nightsLabel(b.nights)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(b.checkIn, 'd MMM')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(b.checkOut, 'd MMM')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{b.guests} чел.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <span className={b.paymentStatus === 'DEPOSIT_PAID' ? 'text-green-600 font-medium' : 'text-orange-600'}>
                      {b.paymentStatus === 'DEPOSIT_PAID' ? 'Депозит оплачен' : 'Не оплачено'}
                    </span>
                  </div>
                </div>

                {/* Refund info */}
                {b.status === 'CANCELLED' && b.refundAmount !== null && b.refundAmount !== undefined && (
                  <div className={`flex items-center gap-2 text-xs mb-3 p-2.5 rounded-xl ${b.refundAmount > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    {b.refundAmount > 0
                      ? `Возврат ${formatMoney(b.refundAmount)} — в течение 3–5 рабочих дней`
                      : 'Возврат не предусмотрен по условиям бронирования'}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {b.paymentStatus === 'UNPAID' && b.paymentUrl && b.status !== 'CANCELLED' && (
                    <a href={b.paymentUrl} className="btn-primary text-sm py-2 px-4">
                      Оплатить депозит {formatMoney(b.depositAmount)}
                    </a>
                  )}
                  <Link href={`/rooms/${b.room.slug}`} className="btn-ghost text-sm py-2 px-3">
                    Смотреть номер <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {canCancel && (
                    <>
                      {confirmCancel === b.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 font-medium">Отменить бронь?</span>
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={cancellingId === b.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
                          >
                            {cancellingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Да'}
                          </button>
                          <button onClick={() => setConfirmCancel(null)} className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50">
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancel(b.id)}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium py-2 px-3 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Отменить
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
