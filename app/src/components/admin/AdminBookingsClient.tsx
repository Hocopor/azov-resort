'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatMoney, formatDate, getBookingStatusLabel, getBookingStatusColor, formatPhone } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, Phone, Mail, Car, Edit3, Loader2 } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает оплаты' },
  { value: 'CONFIRMED', label: 'Подтверждено' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELLED', label: 'Отменено' },
]

interface Booking {
  id: string
  bookingNumber: string
  checkIn: Date
  checkOut: Date
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
  comment?: string | null
  adminNotes?: string | null
  source: string
  room: { name: string }
  user?: { email: string } | null
}

interface Props {
  bookings: Booking[]
  rooms: { id: string; name: string }[]
  total: number
  page: number
  perPage: number
}

export function AdminBookingsClient({ bookings, rooms, total, page, perPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`/admin/bookings?${params.toString()}`))
  }

  const startEdit = (b: Booking) => {
    setEditingId(b.id)
    setEditStatus(b.status)
    setEditNotes(b.adminNotes || '')
  }

  const saveEdit = async (id: string) => {
    setSavingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, adminNotes: editNotes }),
      })
      if (!res.ok) throw new Error()
      success('Бронь обновлена')
      setEditingId(null)
      router.refresh()
    } catch {
      showError('Ошибка обновления')
    } finally {
      setSavingId(null)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="admin-card flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Поиск по имени, телефону, номеру..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={searchParams.get('status') || ''}
          onChange={(e) => setParam('status', e.target.value)}
          className="input-field w-44 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={searchParams.get('room') || ''}
          onChange={(e) => setParam('room', e.target.value)}
          className="input-field w-44 text-sm"
        >
          <option value="">Все номера</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Номер', 'Гость', 'Даты', 'Сумма / Депозит', 'Статус', 'Источник', ''].map((h) => (
                <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <>
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {b.bookingNumber.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{b.room.name}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{b.guestName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${b.guestPhone}`} className="hover:text-sea-700">{b.guestPhone}</a>
                    </div>
                    {b.guestEmail && (
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{b.guestEmail}
                      </div>
                    )}
                    {b.transferNeeded && (
                      <div className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                        <Car className="w-3 h-3" /> Нужен трансфер
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    <div>{formatDate(b.checkIn, 'd MMM')} → {formatDate(b.checkOut, 'd MMM')}</div>
                    <div className="text-xs text-gray-400">{b.nights} н. · {b.guests} чел.</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{formatMoney(b.totalPrice)}</div>
                    <div className="text-xs text-green-600">деп. {formatMoney(b.depositAmount)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getBookingStatusColor(b.status)}`}>{getBookingStatusLabel(b.status)}</span>
                    <div className="text-xs text-gray-400 mt-0.5">{b.paymentStatus}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.source === 'PHONE' || b.source === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.source === 'WEBSITE' ? 'Сайт' : b.source === 'PHONE' ? 'Телефон' : 'Админ'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)} className="btn-ghost text-xs py-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                {/* Edit row */}
                {editingId === b.id && (
                  <tr key={`edit-${b.id}`} className="bg-sea-50">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Статус</label>
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input-field text-sm w-44">
                            {STATUS_OPTIONS.slice(1).map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                            <option value="BLOCKED">Заблокировано</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-xs text-gray-500 block mb-1">Заметки администратора</label>
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Внутренние заметки..."
                            className="input-field text-sm"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(b.id)}
                          disabled={savingId === b.id}
                          className="btn-secondary text-sm py-2 disabled:opacity-60"
                        >
                          {savingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
                        </button>
                      </div>
                      {b.comment && (
                        <div className="mt-3 p-3 bg-white rounded-xl text-sm text-gray-600">
                          <span className="font-medium text-gray-500 text-xs">Комментарий гостя:</span> {b.comment}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="text-center py-12 text-gray-400">Брони не найдены</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} из {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setParam('page', String(page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setParam('page', String(page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
