'use client'

import { useState, useTransition, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { formatMoney, formatDate } from '@/lib/utils'
import { getNightlyPrice, normalizeRoomPricePeriods } from '@/lib/pricing'
import { 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Car, 
  Loader2, 
  Trash2, 
  X, 
  Calendar, 
  Search,
  MessageSquare
} from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

// Dynamic months configuration for Russian language
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

// Available years range
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

interface RoomPricePeriod {
  id: string
  pricePerDay: number
  dateFrom: string | Date
  dateTo: string | Date
}

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
  smoking: boolean
  room: { id: string; name: string; pricePerDay: number; pricePeriods: RoomPricePeriod[] }
}

interface Room {
  id: string
  name: string
  pricePerDay: number
  pricePeriods: RoomPricePeriod[]
}

interface Props {
  bookings: Booking[]
  rooms: Room[]
}

// 1. Structure the custom statuses mappings (Labels, DB status equivalence, colors)
export interface CustomStatusInfo {
  key: string
  label: string
  color: string // Tailwind classes for status badge
  dbStatus: string
  dbPaymentStatus: string
}

export const CUSTOM_STATUS_MAP: Record<string, CustomStatusInfo> = {
  PENDING: {
    key: 'PENDING',
    label: 'На согласовании',
    color: 'bg-yellow-100 text-yellow-900 border-yellow-250',
    dbStatus: 'PENDING',
    dbPaymentStatus: 'UNPAID',
  },
  CONFIRMED: {
    key: 'CONFIRMED',
    label: 'Согласован',
    color: 'bg-indigo-100 text-indigo-905 border-indigo-200',
    dbStatus: 'CONFIRMED',
    dbPaymentStatus: 'UNPAID',
  },
  DEPOSIT_PAID: {
    key: 'DEPOSIT_PAID',
    label: 'Внесена предоплата',
    color: 'bg-sky-100 text-sky-905 border-sky-200',
    dbStatus: 'CONFIRMED',
    dbPaymentStatus: 'DEPOSIT_PAID',
  },
  FULLY_PAID: {
    key: 'FULLY_PAID',
    label: 'Оплачено',
    color: 'bg-emerald-100 text-emerald-905 border-emerald-200',
    dbStatus: 'CONFIRMED',
    dbPaymentStatus: 'FULLY_PAID',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'Завершено',
    color: 'bg-blue-100 text-blue-900 border-blue-200',
    dbStatus: 'COMPLETED',
    dbPaymentStatus: 'FULLY_PAID',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Отменено',
    color: 'bg-red-100 text-red-900 border-red-200',
    dbStatus: 'CANCELLED',
    dbPaymentStatus: 'UNPAID',
  },
  BLOCKED: {
    key: 'BLOCKED',
    label: 'Заблокировано',
    color: 'bg-gray-100 text-gray-950 border-gray-250',
    dbStatus: 'BLOCKED',
    dbPaymentStatus: 'UNPAID',
  }
}

// Resolve custom UI status using dynamic conditions specified (e.g. "Завершено" condition, etc.)
export function getBookingCustomStatusKey(booking: { status: string; paymentStatus: string; checkOut: any }): string {
  if (booking.status === 'CANCELLED') return 'CANCELLED'
  if (booking.status === 'BLOCKED') return 'BLOCKED'
  if (booking.status === 'COMPLETED') return 'COMPLETED'
  if (booking.status === 'PENDING') return 'PENDING'
  
  if (booking.status === 'CONFIRMED') {
    // Check if period has ended and is fully paid -> automatically sets status to "Завершено"
    const checkOutDate = new Date(booking.checkOut)
    const now = new Date()
    // Compare dates considering checkout day end boundary
    const endOfCheckout = new Date(checkOutDate)
    endOfCheckout.setHours(23, 59, 59, 999)
    
    if (now > endOfCheckout && booking.paymentStatus === 'FULLY_PAID') {
      return 'COMPLETED'
    }
    
    if (booking.paymentStatus === 'FULLY_PAID') return 'FULLY_PAID'
    if (booking.paymentStatus === 'DEPOSIT_PAID') return 'DEPOSIT_PAID'
    return 'CONFIRMED'
  }
  
  return booking.status
}

function getMiddayDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
}

function getSourceLabel(source: string) {
  if (source === 'WEBSITE') return 'Сайт'
  if (source === 'PHONE') return 'Телефон'
  if (source === 'ADMIN') return 'Админ'
  return source
}

export function AdminBookingsClient({ bookings, rooms }: Props) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  
  // Choose initial year and month of the calendar (default to current year and month)
  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()) // 0-indexed
  
  // Client search term state to find bookings easily
  const [q, setQ] = useState('')
  
  // Managing selected booking in modal view
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  
  // Editing status states inside modal
  const [editStatusKey, setEditStatusKey] = useState<string>('')
  const [editAdminNotes, setEditAdminNotes] = useState<string>('')
  
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Calendar month day generation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate()
  }, [currentYear, currentMonth])

  const dayItems = useMemo(() => {
    const items = []
    const dayLabels = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d)
      const dayOfWeek = dateObj.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      items.push({
        dayNum: d,
        dayName: dayLabels[dayOfWeek],
        isWeekend,
        dateObj,
      })
    }
    return items
  }, [currentYear, currentMonth, daysInMonth])

  // Simple calendar navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  // Handle opening details modal
  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    const key = getBookingCustomStatusKey(booking)
    setEditStatusKey(key)
    setEditAdminNotes(booking.adminNotes || '')
  }

  // Handle saving modified booking status / admin comment
  const saveBookingEdit = async (id: string) => {
    const statusInfo = CUSTOM_STATUS_MAP[editStatusKey]
    if (!statusInfo) return

    setSavingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusInfo.dbStatus,
          paymentStatus: statusInfo.dbPaymentStatus,
          adminNotes: editAdminNotes,
        }),
      })

      if (!res.ok) throw new Error()

      success('Изменения сохранены!')
      setSelectedBooking(null)
      router.refresh()
    } catch {
      showError('Ошибка при сохранении')
    } finally {
      setSavingId(null)
    }
  }

  // Handle deletion of bookings
  const deleteBooking = async (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить это бронирование?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Бронирование успешно удалено!')
      setSelectedBooking(null)
      router.refresh()
    } catch {
      showError('Ошибка при удалении бронирования')
    } finally {
      setDeletingId(null)
    }
  }

  // Helper check if previous day of month is occupied by same booking
  const isSameBookingOnPrevDay = (booking: Booking, prevDay: number, roomId: string) => {
    if (prevDay < 1) return false
    const prevDate = new Date(currentYear, currentMonth, prevDay, 12, 0, 0)
    return bIdMatches(booking.id, roomId, prevDate)
  }

  const bIdMatches = (bId: string, roomId: string, date: Date) => {
    return bookings.some((b) => {
      if (b.id !== bId || b.roomId !== roomId || b.status === 'CANCELLED') return false
      const checkInMid = getMiddayDate(b.checkIn)
      const checkOutMid = getMiddayDate(b.checkOut)
      return date >= checkInMid && date < checkOutMid
    })
  }

  // Filtered bookings based on search input
  const filteredBookings = useMemo(() => {
    if (!q.trim()) return bookings
    const lower = q.toLowerCase()
    return bookings.filter((b) => 
      b.guestName.toLowerCase().includes(lower) ||
      b.guestPhone.includes(lower) ||
      b.bookingNumber.toLowerCase().includes(lower)
    )
  }, [bookings, q])

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4_5 h-4_5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени гостя, его телефону или номеру бронирования..."
            className="w-full text-sm bg-gray-50 border border-gray-150 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-sea-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Month Navigation Control Bar with Selectors in Center */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <button 
          onClick={goToPreviousMonth}
          className="p-2 sm:p-2_5 rounded-xl border border-gray-150 hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 select-none">
          <select 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="bg-transparent border-0 font-bold text-gray-800 focus:ring-0 cursor-pointer hover:text-sea-600 transition-colors focus:outline-hidden text-center"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          
          <select 
            value={currentYear} 
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="bg-transparent border-0 font-bold text-gray-800 focus:ring-0 cursor-pointer hover:text-sea-600 transition-colors focus:outline-hidden text-center"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={goToNextMonth}
          className="p-2 sm:p-2_5 rounded-xl border border-gray-150 hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Calendar Grid Container with Sticky Left Column */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 divide-x divide-gray-100">
                {/* Column for room header */}
                <th className="sticky left-0 bg-gray-50 font-semibold text-xs text-gray-500 uppercase tracking-wider px-4 py-3 Z-20 text-left w-56 min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-gray-100">
                  Номер / Даты
                </th>
                {/* Generated days headings */}
                {dayItems.map((day) => (
                  <th 
                    key={day.dayNum} 
                    className={`px-1 py-2 text-center min-w-[50px] font-medium text-xs select-none ${
                      day.isWeekend ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <div className={`font-semibold cursor-default ${day.isWeekend ? 'text-red-500 font-extrabold' : 'text-gray-400'}`}>
                      {day.dayName}
                    </div>
                    <div className={`text-sm mt-0.5 font-bold cursor-default ${day.isWeekend ? 'text-red-500 font-extrabold' : 'text-gray-800'}`}>
                      {day.dayNum}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => {
                const normalizedPeriods = normalizeRoomPricePeriods(room.pricePeriods || [])
                const cells: React.ReactNode[] = []

                for (let d = 1; d <= daysInMonth; d++) {
                  const currDate = new Date(currentYear, currentMonth, d, 12, 0, 0)
                  
                  // Find if there is a booking that covers this room on this date
                  const booking = filteredBookings.find((b) => {
                    if (b.roomId !== room.id) return false
                    if (b.status === 'CANCELLED') return false
                    
                    const checkInMid = getMiddayDate(b.checkIn)
                    const checkOutMid = getMiddayDate(b.checkOut)
                    return currDate >= checkInMid && currDate < checkOutMid
                  })

                  if (booking) {
                    // Check if is start of booking block inside this month view
                    const bCheckIn = getMiddayDate(booking.checkIn)
                    const isStart = d === 1 || currDate.getTime() === bCheckIn.getTime() || !isSameBookingOnPrevDay(booking, d - 1, room.id)

                    if (isStart) {
                      // Calculate the length for colSpan
                      let colSpan = 1
                      for (let next = d + 1; next <= daysInMonth; next++) {
                        const nextDate = new Date(currentYear, currentMonth, next, 12, 0, 0)
                        const isStillOccupied = bookings.some(
                          (b) => b.id === booking.id && nextDate >= getMiddayDate(b.checkIn) && nextDate < getMiddayDate(b.checkOut)
                        )
                        if (isStillOccupied) {
                          colSpan++
                        } else {
                          break
                        }
                      }

                      // Find booking index among active room bookings to alternate colors
                      const activeRoomBookings = bookings.filter((b) => b.roomId === room.id && b.status !== 'CANCELLED')
                      const bIndex = activeRoomBookings.findIndex((b) => b.id === booking.id)
                      
                      // Two premium eye-safe colors that coordinate with the nature/sea resort styles
                      const colorClass = bIndex % 2 === 0
                        ? 'bg-[#E6F4F1] hover:bg-[#D4ECE6] text-[#0A5C53] border-l-4 border-teal-500 shadow-xs'
                        : 'bg-[#FDF2E9] hover:bg-[#FBebd6] text-[#8C3F0D] border-l-4 border-amber-500 shadow-xs'

                      cells.push(
                        <td
                          key={d}
                          colSpan={colSpan}
                          onClick={() => openBookingDetails(booking)}
                          className={`p-1 border-r border-gray-100 align-middle ${colorClass} transition-all duration-150 cursor-pointer`}
                        >
                          <div className="flex flex-col h-full justify-between items-start p-1.5 min-w-[110px]">
                            <span className="font-bold text-xs truncate max-w-[150px]" title={booking.guestName}>
                              {booking.guestName}
                            </span>
                            <span className="text-[10px] font-mono opacity-90 mt-0.5 font-bold flex justify-between w-full">
                              <span>{formatMoney(booking.totalPrice).replace(',00', '')}</span>
                              <span className="opacity-75">{booking.nights}н / {booking.guests}ч</span>
                            </span>
                          </div>
                        </td>
                      )

                      d += colSpan - 1 // Increment index forward
                    }
                  } else {
                    // No booking: calculate daily price in Rubles
                    const dailyPrice = getNightlyPrice(room.pricePerDay, normalizedPeriods, currDate)
                    const isWeekend = currDate.getDay() === 0 || currDate.getDay() === 6
                    cells.push(
                      <td
                        key={d}
                        className={`p-2 border-r border-gray-100 text-center font-mono align-middle text-xs text-gray-400 select-none hover:bg-gray-50/80 transition-colors ${
                          isWeekend ? 'bg-red-50/10' : ''
                        }`}
                      >
                        {Math.round(dailyPrice / 100)}
                      </td>
                    )
                  }
                }

                return (
                  <tr key={room.id} className="hover:bg-gray-50/20 divide-x divide-gray-50">
                    {/* Room title cell sticky */}
                    <td className="sticky left-0 bg-white font-medium text-gray-800 px-4 py-4 text-sm z-10 w-56 min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-gray-150">
                      <div className="font-bold text-gray-900 leading-tight">{room.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider">
                        от {formatMoney(room.pricePerDay).split(',00')[0]} / сут
                      </div>
                    </td>
                    {cells}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Helper informational text explaining unbooked fields */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-[11px] text-gray-500 font-medium flex items-center gap-2 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
          <span>В пустых ячейках указана базовая стоимость одних суток проживания (в рублях) для соответствующего дня. Нажмите на забронированное поле для управления.</span>
        </div>
      </div>

      {/* Structured Details Modal Overlay with transitions */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Детали бронирования</h3>
                <p className="text-xs text-gray-400 mt-0.5">Номер заказа: #{selectedBooking.bookingNumber.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Detailed Booking Table */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30 p-4">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap w-1/3">Номер / категория:</td>
                      <td className="py-2 text-gray-900 font-bold">{selectedBooking.room.name}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Период дат:</td>
                      <td className="py-2 text-gray-900 font-bold text-xs sm:text-sm">
                        {formatDate(selectedBooking.checkIn, 'd MMMM yyyy')} — {formatDate(selectedBooking.checkOut, 'd MMMM yyyy')}
                        <span className="ml-2 font-normal text-gray-400">({selectedBooking.nights} ночей)</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">ФИО гостя:</td>
                      <td className="py-2 text-gray-900 font-bold">{selectedBooking.guestName}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Номер телефона:</td>
                      <td className="py-2 text-gray-900 font-semibold font-mono">
                        <a href={`tel:${selectedBooking.guestPhone}`} className="text-sea-600 hover:underline">
                          {selectedBooking.guestPhone}
                        </a>
                      </td>
                    </tr>
                    {selectedBooking.guestEmail && (
                      <tr>
                        <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Email почта:</td>
                        <td className="py-2 text-gray-900 font-mono text-xs">{selectedBooking.guestEmail}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Пакет гостей:</td>
                      <td className="py-2 text-gray-900 font-medium">
                        {selectedBooking.guests} чел.
                        {selectedBooking.hasPets && (
                          <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            🐾 С питомцами: {selectedBooking.petsDescription || 'да'}
                          </span>
                        )}
                        {selectedBooking.smoking && (
                          <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
                            🚭 Курящий
                          </span>
                        )}
                      </td>
                    </tr>
                    {selectedBooking.transferNeeded && (
                      <tr>
                        <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Трансфер:</td>
                        <td className="py-2 text-orange-850 font-bold">
                          <Car className="w-3.5 h-3.5 inline mr-1 text-orange-500" />
                          Из: {selectedBooking.transferFrom || 'Ж/Д вокзал'} 
                          {selectedBooking.transferDate && ` в ${formatDate(selectedBooking.transferDate, 'd MMM, HH:mm')}`}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Источник:</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-150">
                          {getSourceLabel(selectedBooking.source)}
                        </span>
                      </td>
                    </tr>
                    {selectedBooking.comment && (
                      <tr>
                        <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Пожелания гостя:</td>
                        <td className="py-2 text-gray-650 italic text-xs bg-white rounded border border-gray-50 p-2 my-1 whitespace-pre-wrap block">
                          &ldquo;{selectedBooking.comment}&rdquo;
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Общая сумма:</td>
                      <td className="py-2 text-gray-900 font-extrabold text-base">{formatMoney(selectedBooking.totalPrice)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-gray-500 font-semibold whitespace-nowrap">Сумма депозита:</td>
                      <td className="py-2 text-emerald-800 font-bold bg-emerald-50/50 rounded-md px-2 py-0.5 inline-block my-1 text-xs sm:text-sm">
                        {formatMoney(selectedBooking.depositAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Update & Administration Field Form */}
              <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-4">
                <h4 className="font-bold text-sm text-gray-850 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Calendar className="w-4 h-4 text-sea-600" />
                  Управление статусом проживания
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  {/* Custom selection dropdown */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Статус бронирования
                    </label>
                    <select
                      value={editStatusKey}
                      onChange={(e) => setEditStatusKey(e.target.value)}
                      className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-sea-300 focus:border-sea-500 cursor-pointer"
                    >
                      {Object.entries(CUSTOM_STATUS_MAP).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label} (Бронь: {getCustomStatusLabelEquivalent(info.dbStatus)}, Оплата: {getCustomPaymentLabelEquivalent(info.dbPaymentStatus)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Textarea for comments with persistence */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    Заметки и комментарий администратора
                  </label>
                  <textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Напишите здесь комментарии об оплате, деталях созвона, изменениях заезда..."
                    rows={3.5}
                    className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-sea-300 focus:border-sea-500"
                  />
                  {selectedBooking.adminNotes && (
                    <div className="mt-2 text-[11px] text-gray-400 font-medium px-1">
                      * Предыдущий комментарий: <span className="italic text-gray-600">&ldquo;{selectedBooking.adminNotes}&rdquo;</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 justify-between items-stretch">
              {/* Delete button layout left */}
              <button
                onClick={() => deleteBooking(selectedBooking.id)}
                disabled={deletingId === selectedBooking.id}
                className="text-xs font-semibold px-4 py-2 text-red-650 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {deletingId === selectedBooking.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Удалить броню
                  </>
                )}
              </button>

              {/* Close and Save layout right */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 text-xs font-semibold border border-gray-150 rounded-xl hover:bg-gray-50 text-gray-600 transition-all cursor-pointer"
                >
                  Вернуться в календарь
                </button>
                <button
                  onClick={() => saveBookingEdit(selectedBooking.id)}
                  disabled={savingId === selectedBooking.id}
                  className="px-5 py-2 text-xs font-bold bg-sea-600 text-white hover:bg-sea-750 transition-all rounded-xl cursor-pointer shadow-xs font-mono active:scale-95 disabled:opacity-50"
                >
                  {savingId === selectedBooking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    'Сохранить изменения'
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

function getCustomStatusLabelEquivalent(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'На согласовании',
    CONFIRMED: 'Подтверждена',
    CANCELLED: 'Отменена',
    COMPLETED: 'Завершена',
    BLOCKED: 'Заблокирована',
  }
  return labels[status] || status
}

function getCustomPaymentLabelEquivalent(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: 'Не оплачен',
    DEPOSIT_PAID: 'Депозит',
    FULLY_PAID: 'Оплачен полностью',
  }
  return labels[status] || status
}
