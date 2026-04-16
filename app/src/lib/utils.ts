import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('ru-RU')} ₽`
}

export function formatDate(date: Date | string, pattern = 'd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, pattern, { locale: ru })
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, 'd MMM')
}

export function countNights(checkIn: Date, checkOut: Date): number {
  return differenceInCalendarDays(checkOut, checkIn)
}

export function calculateTotalPrice(pricePerDay: number, nights: number): number {
  return pricePerDay * nights
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '…'
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Ожидает оплаты',
    CONFIRMED: 'Подтверждено',
    CANCELLED: 'Отменено',
    COMPLETED: 'Завершено',
    BLOCKED: 'Заблокировано',
  }
  return labels[status] || status
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: 'Не оплачено',
    DEPOSIT_PAID: 'Депозит оплачен',
    FULLY_PAID: 'Полностью оплачено',
    REFUNDED: 'Возврат',
    PARTIAL_REFUND: 'Частичный возврат',
    FAILED: 'Ошибка оплаты',
  }
  return labels[status] || status
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    BLOCKED: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

// e.g. pluralize(5, ['ночь', 'ночи', 'ночей']) => 'ночей'
export function nightsLabel(n: number): string {
  return `${n} ${pluralize(n, ['ночь', 'ночи', 'ночей'])}`
}

export function guestsLabel(n: number): string {
  return `${n} ${pluralize(n, ['гость', 'гостя', 'гостей'])}`
}

export function isAdmin(role?: string | null): boolean {
  return role === 'ADMIN'
}

export function generateBookingNumber(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const PHONE_REGEX = /^(\+7|8)[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})$/

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }
  return phone
}

export function getDaysUntilCheckIn(checkIn: Date): number {
  return differenceInCalendarDays(checkIn, new Date())
}
