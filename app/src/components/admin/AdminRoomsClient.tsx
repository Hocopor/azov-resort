'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { DayPicker, DateRange } from 'react-day-picker'
import {
  Waves, Edit3, Ban, CheckCircle, Calendar, Users, Loader2,
  ChevronDown, ChevronUp, Eye, EyeOff, Trash2, Plus, X
} from 'lucide-react'
import { formatMoney, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'
import 'react-day-picker/style.css'

interface Booking {
  checkIn: Date
  checkOut: Date
  guestName: string
  status: string
}

interface BlockedDate {
  id: string
  dateFrom: Date
  dateTo: Date
  reason?: string | null
}

interface Room {
  id: string
  name: string
  slug: string
  pricePerDay: number
  capacity: number
  isActive: boolean
  images: string[]
  _count: { bookings: number }
  blockedDates: BlockedDate[]
  bookings: Booking[]
}

export function AdminRoomsClient({ rooms: initialRooms }: { rooms: Room[] }) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [rooms, setRooms] = useState(initialRooms)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [blockRange, setBlockRange] = useState<DateRange | undefined>()
  const [blockReason, setBlockReason] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const toggleActive = async (room: Room) => {
    setSavingId(room.id)
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !room.isActive }),
      })
      if (!res.ok) throw new Error()
      setRooms((r) => r.map((rr) => rr.id === room.id ? { ...rr, isActive: !rr.isActive } : rr))
      success(room.isActive ? 'Номер скрыт с сайта' : 'Номер активирован')
    } catch {
      showError('Ошибка обновления')
    } finally {
      setSavingId(null)
    }
  }

  const saveBlockedDate = async (roomId: string) => {
    if (!blockRange?.from || !blockRange?.to) {
      showError('Выберите период блокировки')
      return
    }
    setSavingId(`block-${roomId}`)
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/blocked-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: blockRange.from.toISOString(),
          dateTo: blockRange.to.toISOString(),
          reason: blockReason || null,
        }),
      })
      if (!res.ok) throw new Error()
      success('Период заблокирован')
      setBlockingId(null)
      setBlockRange(undefined)
      setBlockReason('')
      router.refresh()
    } catch {
      showError('Ошибка блокировки')
    } finally {
      setSavingId(null)
    }
  }

  const removeBlockedDate = async (roomId: string, blockId: string) => {
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/blocked-dates/${blockId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Блокировка снята')
      router.refresh()
    } catch {
      showError('Ошибка удаления блокировки')
    }
  }

  const startEdit = (room: Room) => {
    setEditingRoom(room)
    setEditForm({
      name: room.name,
      pricePerDay: Math.round(room.pricePerDay / 100),
      capacity: room.capacity,
    })
  }

  const saveEdit = async () => {
    if (!editingRoom) return
    setSavingId(`edit-${editingRoom.id}`)
    try {
      const res = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          pricePerDay: parseInt(editForm.pricePerDay) * 100,
          capacity: parseInt(editForm.capacity),
        }),
      })
      if (!res.ok) throw new Error()
      setRooms((r) => r.map((rr) => rr.id === editingRoom.id
        ? { ...rr, name: editForm.name, pricePerDay: parseInt(editForm.pricePerDay) * 100, capacity: parseInt(editForm.capacity) }
        : rr))
      success('Номер обновлён')
      setEditingRoom(null)
    } catch {
      showError('Ошибка сохранения')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      {/* Edit modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Редактировать номер</h3>
              <button onClick={() => setEditingRoom(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Название</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена за ночь (₽)</label>
                <input type="number" value={editForm.pricePerDay} onChange={(e) => setEditForm((f: any) => ({ ...f, pricePerDay: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Вместимость (чел.)</label>
                <input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm((f: any) => ({ ...f, capacity: e.target.value }))} className="input-field" />
              </div>
              <div className="flex gap-3">
                <button onClick={saveEdit} disabled={savingId?.startsWith('edit')} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {savingId?.startsWith('edit') ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
                </button>
                <button onClick={() => setEditingRoom(null)} className="btn-outline">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rooms.map((room) => {
          const isExpanded = expandedId === room.id
          const isBlocking = blockingId === room.id
          const upcomingBookings = room.bookings.filter((b) => new Date(b.checkIn) >= new Date())

          return (
            <div key={room.id} className={`admin-card overflow-hidden ${!room.isActive ? 'opacity-70' : ''}`}>
              {/* Room header */}
              <div className="flex items-start gap-4">
                {/* Thumb */}
                <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-sea-100 flex-shrink-0">
                  {room.images[0] ? (
                    <Image src={room.images[0]} alt={room.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Waves className="w-8 h-8 text-sea-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="badge-sea">
                          <Users className="w-3 h-3" /> до {room.capacity} чел.
                        </span>
                        <span className="badge bg-sand-200 text-sand-800">
                          {formatMoney(room.pricePerDay)} / ночь
                        </span>
                        <span className={`badge ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {room.isActive ? '● Активен' : '● Скрыт'}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600">
                          {room._count.bookings} броней всего
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(room)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Редактировать">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(room)}
                        disabled={savingId === room.id}
                        className={`p-2 rounded-xl transition-colors ${room.isActive ? 'hover:bg-red-50 text-orange-500' : 'hover:bg-green-50 text-green-500'}`}
                        title={room.isActive ? 'Скрыть' : 'Показать'}
                      >
                        {savingId === room.id ? <Loader2 className="w-4 h-4 animate-spin" /> : room.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : room.id)}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-6">
                  {/* Upcoming bookings */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sea-600" /> Предстоящие брони
                    </h4>
                    {upcomingBookings.length === 0 ? (
                      <p className="text-sm text-gray-400">Нет предстоящих броней</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingBookings.map((b, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                            <span className="font-medium text-gray-800">{b.guestName}</span>
                            <span className="text-gray-500">
                              {formatDate(b.checkIn, 'd MMM')} — {formatDate(b.checkOut, 'd MMM')}
                            </span>
                            <span className={`badge ${getBookingStatusColor(b.status)}`}>{getBookingStatusLabel(b.status)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blocked dates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Ban className="w-4 h-4 text-coral-600" /> Заблокированные периоды
                      </h4>
                      <button
                        onClick={() => setBlockingId(isBlocking ? null : room.id)}
                        className="flex items-center gap-1 text-xs font-medium text-sea-700 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Заблокировать период
                      </button>
                    </div>

                    {room.blockedDates.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {room.blockedDates.map((bd) => (
                          <div key={bd.id} className="flex items-center justify-between p-3 bg-coral-50 rounded-xl text-sm border border-coral-100">
                            <div>
                              <span className="font-medium text-coral-800">
                                {formatDate(bd.dateFrom, 'd MMM')} — {formatDate(bd.dateTo, 'd MMM')}
                              </span>
                              {bd.reason && <span className="text-coral-600 ml-2 text-xs">{bd.reason}</span>}
                            </div>
                            <button
                              onClick={() => removeBlockedDate(room.id, bd.id)}
                              className="text-coral-400 hover:text-coral-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isBlocking && (
                      <div className="p-4 bg-sea-50 rounded-2xl border border-sea-100 space-y-4">
                        <p className="text-sm text-gray-600">Выберите период для блокировки:</p>
                        <div className="flex justify-center">
                          <DayPicker
                            mode="range"
                            selected={blockRange}
                            onSelect={setBlockRange}
                            locale={ru}
                            fromDate={new Date()}
                            styles={{ root: { margin: 0, fontFamily: 'Nunito, sans-serif', fontSize: '13px' } }}
                          />
                        </div>
                        <input
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Причина блокировки (необязательно)"
                          className="input-field text-sm"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => saveBlockedDate(room.id)}
                            disabled={!blockRange?.from || !blockRange?.to || savingId === `block-${room.id}`}
                            className="btn-primary text-sm py-2 disabled:opacity-60"
                          >
                            {savingId === `block-${room.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Заблокировать'}
                          </button>
                          <button onClick={() => { setBlockingId(null); setBlockRange(undefined); setBlockReason('') }} className="btn-outline text-sm py-2">
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
