'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ru } from 'date-fns/locale'
import { DayPicker, DateRange } from 'react-day-picker'
import {
  Waves,
  Edit3,
  Ban,
  Calendar,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImageIcon,
} from 'lucide-react'
import { formatMoney, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'
import { AdminFileDropzone } from '@/components/admin/AdminFileDropzone'
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

function isUploadedImage(url: string) {
  return url.startsWith('/uploads/')
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
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([])

  const uploadFiles = async (files: File[], folder: string) => {
    const uploadedUrls: string[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка загрузки файла')
      }

      uploadedUrls.push(data.url)
    }

    return uploadedUrls
  }

  const deleteUploadedFile = async (url: string) => {
    if (!url.startsWith('/uploads/')) return

    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  }

  const toggleActive = async (room: Room) => {
    setSavingId(room.id)

    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !room.isActive }),
      })

      if (!res.ok) throw new Error()

      setRooms((prev) => prev.map((item) => (item.id === room.id ? { ...item, isActive: !item.isActive } : item)))
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
    setRemovedImageUrls([])
    setEditForm({
      name: room.name,
      pricePerDay: Math.round(room.pricePerDay / 100),
      capacity: room.capacity,
      images: [...room.images],
    })
  }

  const handleRoomImageUpload = async (files: File[]) => {
    if (!editingRoom) return

    setSavingId(`images-${editingRoom.id}`)

    try {
      const uploaded = await uploadFiles(files, `rooms/${editingRoom.slug}`)
      setEditForm((prev: any) => ({
        ...prev,
        images: [...(prev.images || []), ...uploaded],
      }))
      success(`Загружено файлов: ${uploaded.length}`)
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Ошибка загрузки изображений')
    } finally {
      setSavingId(null)
    }
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    setEditForm((prev: any) => {
      const images = [...(prev.images || [])]
      const nextIndex = index + direction

      if (nextIndex < 0 || nextIndex >= images.length) {
        return prev
      }

      const [item] = images.splice(index, 1)
      images.splice(nextIndex, 0, item)

      return { ...prev, images }
    })
  }

  const removeImage = (index: number) => {
    setEditForm((prev: any) => {
      const images = [...(prev.images || [])]
      const [removed] = images.splice(index, 1)

      if (removed?.startsWith('/uploads/')) {
        setRemovedImageUrls((current) => [...current, removed])
      }

      return { ...prev, images }
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
          pricePerDay: parseInt(editForm.pricePerDay || '0', 10) * 100,
          capacity: parseInt(editForm.capacity || '1', 10),
          images: editForm.images || [],
        }),
      })

      if (!res.ok) throw new Error()

      await Promise.all(removedImageUrls.map((url) => deleteUploadedFile(url)))

      setRooms((prev) =>
        prev.map((room) =>
          room.id === editingRoom.id
            ? {
                ...room,
                name: editForm.name,
                pricePerDay: parseInt(editForm.pricePerDay || '0', 10) * 100,
                capacity: parseInt(editForm.capacity || '1', 10),
                images: editForm.images || [],
              }
            : room
        )
      )

      success('Номер обновлён')
      setEditingRoom(null)
      setRemovedImageUrls([])
      router.refresh()
    } catch {
      showError('Ошибка сохранения')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Редактировать номер</h3>
              <button onClick={() => setEditingRoom(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Название</label>
                  <input value={editForm.name} onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Цена за ночь (₽)</label>
                  <input type="number" value={editForm.pricePerDay} onChange={(e) => setEditForm((prev: any) => ({ ...prev, pricePerDay: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Вместимость (чел.)</label>
                  <input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm((prev: any) => ({ ...prev, capacity: e.target.value }))} className="input-field" />
                </div>
                <div className="rounded-2xl border border-sea-100 bg-sea-50 p-4 text-sm text-gray-600">
                  Первое изображение в списке станет главным на карточке номера и на странице бронирования.
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ImageIcon className="h-4 w-4 text-sea-600" /> Галерея номера
                </div>

                <AdminFileDropzone
                  title={savingId === `images-${editingRoom.id}` ? 'Загрузка...' : 'Перетащите фото номера сюда'}
                  hint="Можно загружать сколько угодно изображений. Новые фото автоматически добавятся в конец галереи"
                  multiple
                  disabled={savingId === `images-${editingRoom.id}`}
                  onFilesSelected={handleRoomImageUpload}
                />

                {(editForm.images || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400">
                    Фотографий пока нет
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {(editForm.images || []).map((image: string, index: number) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="relative h-44 w-full bg-gray-100">
                          <Image src={image} alt={`Фото ${index + 1}`} fill className="object-cover" unoptimized={isUploadedImage(image)} />
                          <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
                            {index === 0 ? 'Обложка' : `#${index + 1}`}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => moveImage(index, -1)}
                              disabled={index === 0}
                              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Поднять выше"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(index, 1)}
                              disabled={index === (editForm.images || []).length - 1}
                              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Опустить ниже"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50"
                            title="Удалить фото"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={!!savingId} className="btn-primary flex-1 justify-center disabled:opacity-60">
                    {savingId?.startsWith('edit-') ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
                  </button>
                  <button onClick={() => setEditingRoom(null)} className="btn-outline">
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rooms.map((room) => {
          const isExpanded = expandedId === room.id
          const isBlocking = blockingId === room.id
          const upcomingBookings = room.bookings.filter((booking) => new Date(booking.checkIn) >= new Date())

          return (
            <div key={room.id} className={`admin-card overflow-hidden ${!room.isActive ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-sea-100">
                  {room.images[0] ? (
                    <Image src={room.images[0]} alt={room.name} fill className="object-cover" unoptimized={isUploadedImage(room.images[0])} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Waves className="h-8 w-8 text-sea-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="badge-sea">
                          <Users className="h-3 w-3" /> до {room.capacity} чел.
                        </span>
                        <span className="badge bg-sand-200 text-sand-800">{formatMoney(room.pricePerDay)} / ночь</span>
                        <span className={`badge ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {room.isActive ? '● Активен' : '● Скрыт'}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600">{room._count.bookings} броней всего</span>
                        <span className="badge bg-blue-100 text-blue-700">{room.images.length} фото</span>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button onClick={() => startEdit(room)} className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100" title="Редактировать">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(room)}
                        disabled={savingId === room.id}
                        className={`rounded-xl p-2 transition-colors ${room.isActive ? 'text-orange-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={room.isActive ? 'Скрыть' : 'Показать'}
                      >
                        {savingId === room.id ? <Loader2 className="h-4 w-4 animate-spin" /> : room.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : room.id)} className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-5 space-y-6 border-t border-gray-100 pt-5">
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar className="h-4 w-4 text-sea-600" /> Предстоящие брони
                    </h4>
                    {upcomingBookings.length === 0 ? (
                      <p className="text-sm text-gray-400">Нет предстоящих броней</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingBookings.map((booking, index) => (
                          <div key={index} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm">
                            <span className="font-medium text-gray-800">{booking.guestName}</span>
                            <span className="text-gray-500">
                              {formatDate(booking.checkIn, 'd MMM')} — {formatDate(booking.checkOut, 'd MMM')}
                            </span>
                            <span className={`badge ${getBookingStatusColor(booking.status)}`}>{getBookingStatusLabel(booking.status)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Ban className="h-4 w-4 text-coral-600" /> Заблокированные периоды
                      </h4>
                      <button onClick={() => setBlockingId(isBlocking ? null : room.id)} className="flex items-center gap-1 text-xs font-medium text-sea-700 hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Заблокировать период
                      </button>
                    </div>

                    {room.blockedDates.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {room.blockedDates.map((blocked) => (
                          <div key={blocked.id} className="flex items-center justify-between rounded-xl border border-coral-100 bg-coral-50 p-3 text-sm">
                            <div>
                              <span className="font-medium text-coral-800">
                                {formatDate(blocked.dateFrom, 'd MMM')} — {formatDate(blocked.dateTo, 'd MMM')}
                              </span>
                              {blocked.reason && <span className="ml-2 text-xs text-coral-600">{blocked.reason}</span>}
                            </div>
                            <button onClick={() => removeBlockedDate(room.id, blocked.id)} className="text-coral-400 transition-colors hover:text-coral-600">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isBlocking && (
                      <div className="space-y-4 rounded-2xl border border-sea-100 bg-sea-50 p-4">
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
                          <button onClick={() => saveBlockedDate(room.id)} disabled={!blockRange?.from || !blockRange?.to || savingId === `block-${room.id}`} className="btn-primary py-2 text-sm disabled:opacity-60">
                            {savingId === `block-${room.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Заблокировать'}
                          </button>
                          <button onClick={() => { setBlockingId(null); setBlockRange(undefined); setBlockReason('') }} className="btn-outline py-2 text-sm">
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
