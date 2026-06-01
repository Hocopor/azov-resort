'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  formatMoney, 
  formatDate, 
  getUnifiedStatusLabel, 
  getUnifiedStatusColor 
} from '@/lib/utils'
import { 
  X, 
  Phone, 
  Mail, 
  Car, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  Calendar,
  Info,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

interface Booking {
  id: string
  bookingNumber: string
  roomId: string
  checkIn: string | Date
  checkOut: string | Date
  nights: number
  guests: number
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  totalPrice: number
  depositAmount: number
  status: string
  paymentStatus: string
  transferNeeded: boolean
  transferFrom?: string | null
  transferDate?: string | Date | null
  transferUnknown?: boolean | null
  comment?: string | null
  adminNotes?: string | null
  source: string
  hasPets: boolean
  petsDescription?: string | null
  smoking?: boolean
  room: {
    name: string
  }
}

interface Props {
  bookings: any[] // we receive standard serializable bookings from server
}

export function RecentBookingsClient({ bookings }: Props) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  
  // Edit states for dashboard modal
  const [editStatus, setEditStatus] = useState('')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const openDetails = (b: any) => {
    setSelectedBooking(b)
    setEditAdminNotes(b.adminNotes || '')

    // Resolve unified status mapping
    // We can allow admin to edit status keys:
    // PENDING (На согласовании), CONFIRMED + UNPAID (Согласован), CONFIRMED + DEPOSIT_PAID (Внесена предоплата), CONFIRMED + FULLY_PAID (Оплачено), COMPLETED (Завершено)
    // We determine current selected edit values based on db status and paymentStatus
    if (b.status === 'PENDING') {
      setEditStatus('PENDING_UNPAID')
    } else if (b.status === 'CONFIRMED') {
      if (b.paymentStatus === 'FULLY_PAID') {
        setEditStatus('CONFIRMED_FULLY')
      } else if (b.paymentStatus === 'DEPOSIT_PAID') {
        setEditStatus('CONFIRMED_DEPOSIT')
      } else {
        setEditStatus('CONFIRMED_UNPAID')
      }
    } else if (b.status === 'COMPLETED') {
      setEditStatus('COMPLETED_FULLY')
    } else {
      setEditStatus(`${b.status}_${b.paymentStatus}`)
    }
  }

  const saveDetails = async (id: string) => {
    setSavingId(id)
    try {
      let status = 'CONFIRMED'
      let paymentStatus = 'UNPAID'

      if (editStatus === 'PENDING_UNPAID') {
        status = 'PENDING'
        paymentStatus = 'UNPAID'
      } else if (editStatus === 'CONFIRMED_UNPAID') {
        status = 'CONFIRMED'
        paymentStatus = 'UNPAID'
      } else if (editStatus === 'CONFIRMED_DEPOSIT') {
        status = 'CONFIRMED'
        paymentStatus = 'DEPOSIT_PAID'
      } else if (editStatus === 'CONFIRMED_FULLY') {
        status = 'CONFIRMED'
        paymentStatus = 'FULLY_PAID'
      } else if (editStatus === 'COMPLETED_FULLY') {
        status = 'COMPLETED'
        paymentStatus = 'FULLY_PAID'
      } else {
        // Fallback or custom (CANCELLED or BLOCKED)
        const [st, pay] = editStatus.split('_')
        status = st || 'CONFIRMED'
        paymentStatus = pay || 'UNPAID'
      }

      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          adminNotes: editAdminNotes,
        }),
      })

      if (!res.ok) throw new Error()

      success('Бронирование обновлено!')
      setSelectedBooking(null)
      router.refresh()
    } catch {
      showError('Ошибка при сохранении изменений')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">Последние бронирования</h3>
          <p className="text-xs text-gray-400 mt-0.5">Нажмите на строку бронирования для деталей и управления</p>
        </div>
        <Link href="/admin/bookings" className="text-xs sm:text-sm text-sea-700 font-medium hover:underline flex items-center gap-1 bg-sea-50 hover:bg-sea-100 rounded-lg px-2.5 py-1.5 transition-colors">
          Все брони <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold">
              <th className="text-left pb-3 pr-4 font-normal">ID</th>
              <th className="text-left pb-3 pr-4 font-normal">Номер</th>
              <th className="text-left pb-3 pr-4 font-normal">Гость</th>
              <th className="text-left pb-3 pr-4 font-normal">Телефон</th>
              <th className="text-left pb-3 pr-4 font-normal">Заезд</th>
              <th className="text-left pb-3 pr-4 font-normal">Выезд</th>
              <th className="text-left pb-3 pr-4 font-normal">Сумма депозита</th>
              <th className="text-left pb-3 font-normal">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-400 text-sm">
                  Нет недавних бронирований
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const displayLabel = getUnifiedStatusLabel(b.status, b.paymentStatus, b.checkOut)
                const displayColor = getUnifiedStatusColor(b.status, b.paymentStatus, b.checkOut)
                return (
                  <tr 
                    key={b.id} 
                    onClick={() => openDetails(b)}
                    className="hover:bg-sea-50/40 transition-all cursor-pointer active:bg-sea-50"
                  >
                    <td className="py-3.5 pr-4 text-gray-400 font-mono text-xs font-semibold">
                      #{b.bookingNumber.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-gray-800">
                      {b.room.name}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-700">
                      {b.guestName}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-500 font-mono text-xs">
                      {b.guestPhone}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600">
                      {formatDate(b.checkIn, 'd MMM')}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600">
                      {formatDate(b.checkOut, 'd MMM')}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-gray-950">
                      {formatMoney(b.depositAmount)}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] border ${displayColor}`}>
                        {displayLabel}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details & Administration Dialog Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-sea-700 to-sea-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-base tracking-tight uppercase">
                  Бронь #{selectedBooking.bookingNumber.toUpperCase()}
                </h3>
                <p className="text-xs text-sea-150 mt-0.5">
                  Параметры проживания и управление статусом
                </p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto max-h-[72vh] space-y-5">
              
              {/* Guest & Room Grid info */}
              <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                <table className="w-full text-xs sm:text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">Категория номера:</td>
                      <td className="py-2.5 text-gray-900 font-extrabold">{selectedBooking.room.name}</td>
                    </tr>
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">Период:</td>
                      <td className="py-2.5 text-gray-900 font-semibold font-mono">
                        {formatDate(selectedBooking.checkIn, 'd MMMM yyyy')} — {formatDate(selectedBooking.checkOut, 'd MMMM yyyy')}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">Количество ночей:</td>
                      <td className="py-2.5 text-gray-900 font-mono font-bold">{selectedBooking.nights} н.</td>
                    </tr>
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">ФИО Гостя:</td>
                      <td className="py-2.5 text-gray-950 font-bold">{selectedBooking.guestName}</td>
                    </tr>
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">Телефон для связи:</td>
                      <td className="py-2.5">
                        <a href={`tel:${selectedBooking.guestPhone}`} className="text-sea-600 hover:underline inline-flex items-center gap-1 font-mono text-xs font-bold">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedBooking.guestPhone}
                        </a>
                      </td>
                    </tr>
                    {selectedBooking.guestEmail && (
                      <tr className="border-b border-gray-100/50">
                        <td className="py-2.5 pr-4 text-gray-400 font-medium">Email:</td>
                        <td className="py-2.5 text-gray-800 font-mono text-xs">{selectedBooking.guestEmail}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium font-sans">Гости:</td>
                      <td className="py-2.5 text-gray-900 font-bold">
                        {selectedBooking.guests} чел.
                        {selectedBooking.hasPets && (
                          <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            🐾 С питомцами: {selectedBooking.petsDescription || 'да'}
                          </span>
                        )}
                        {selectedBooking.smoking && (
                          <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-250">
                            🚭 Курящий
                          </span>
                        )}
                      </td>
                    </tr>
                    {selectedBooking.transferNeeded && (
                      <tr className="border-b border-gray-100/50">
                        <td className="py-2.5 pr-4 text-gray-400 font-medium">Нужен Трансфер:</td>
                        <td className="py-2.5 text-orange-800 font-bold text-xs inline-flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-orange-500" />
                          Из: {selectedBooking.transferUnknown ? 'Пока неизвестно' : (selectedBooking.transferFrom || 'Ж/Д вокзал')} 
                          {selectedBooking.transferDate && ` в ${formatDate(selectedBooking.transferDate, 'd MMM, HH:mm')}`}
                        </td>
                      </tr>
                    )}
                    {selectedBooking.comment && (
                      <tr className="border-b border-gray-100/50">
                        <td className="py-2.5 pr-4 text-gray-400 font-medium">Комментарий гостя:</td>
                        <td className="py-2.5 text-gray-650 italic text-xs bg-white rounded border border-gray-100 p-2.5 whitespace-pre-wrap block">
                          &ldquo;{selectedBooking.comment}&rdquo;
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100/50">
                      <td className="py-2.5 pr-4 text-gray-400 font-medium">Стоимость:</td>
                      <td className="py-2.5 text-gray-900 font-bold font-mono">{formatMoney(selectedBooking.totalPrice)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-gray-500 font-bold">Сумма предоплаты / депозита:</td>
                      <td className="py-2.5">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-xs font-mono px-2 py-0.5 inline-block">
                          {formatMoney(selectedBooking.depositAmount)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status control */}
              <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-3.5">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Calendar className="w-4 h-4 text-sea-600" />
                  Управление бронированием
                </h4>

                <div>
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Установить текущий статус
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-sea-300 cursor-pointer"
                  >
                    <option value="PENDING_UNPAID">На согласовании (Ожидает подтверждения и предоплаты)</option>
                    <option value="CONFIRMED_UNPAID">Согласован (Бронь подтверждена, предоплата не внесена)</option>
                    <option value="CONFIRMED_DEPOSIT">Внесена предоплата (Частичная предоплата внесена)</option>
                    <option value="CONFIRMED_FULLY">Оплачено (Бронь оплачена полностью)</option>
                    <option value="COMPLETED_FULLY">Завершено (Гость выехал, всё оплачено)</option>
                    <option value="CANCELLED_UNPAID">Отменено</option>
                    <option value="BLOCKED_UNPAID">Заблокировано (Служебная блокировка)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    Заметки и комментарии администратора
                  </label>
                  <textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Примечания по созваниванию, изменению дат, оплате депозита..."
                    rows={3}
                    className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800"
                  />
                  {selectedBooking.adminNotes && (
                    <div className="mt-1 text-[11px] text-gray-400 px-1 font-medium">
                      * Текущие заметки: <span className="italic text-gray-600">{selectedBooking.adminNotes}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer commands */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 justify-end items-center">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
              >
                Закрыть
              </button>
              <button
                onClick={() => saveDetails(selectedBooking.id)}
                disabled={savingId === selectedBooking.id}
                className="px-5 py-2 text-xs font-bold bg-sea-600 hover:bg-sea-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {savingId === selectedBooking.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : null}
                Сохранить статус
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
