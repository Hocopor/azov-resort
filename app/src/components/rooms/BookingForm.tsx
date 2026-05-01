'use client'

import { useMemo, useState } from 'react'
import { addDays, isBefore, isWithinInterval } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DayPicker, DateRange } from 'react-day-picker'
import {
  calculateDeposit,
  cn,
  formatDate,
  formatMoney,
  guestsLabel,
  nightsLabel,
  countNights,
} from '@/lib/utils'
import {
  buildNightlyPriceBreakdown,
  calculateNightlyBreakdownTotal,
  getNightlyPrice,
  normalizeRoomPricePeriods,
} from '@/lib/pricing'
import { useToast } from '@/components/providers/ToastProvider'
import { AlertCircle, Calendar, Car, Loader2, MessageSquare, PawPrint, User, Users } from 'lucide-react'
import 'react-day-picker/style.css'

const schema = z.object({
  guestName: z.string().min(2, 'Введите имя'),
  guestPhone: z.string().min(10, 'Введите корректный номер телефона'),
  guestEmail: z.string().email('Некорректный email').optional().or(z.literal('')),
  guests: z.number().min(1).max(20),
  hasPets: z.boolean(),
  petsDescription: z.string().optional(),
  smoking: z.boolean(),
  transferNeeded: z.boolean(),
  transferFrom: z.string().optional(),
  transferDate: z.string().optional(),
  transferUnknown: z.boolean(),
  comment: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface OccupiedRange {
  from: Date
  to: Date
}

interface DepositSettings {
  type: 'PERCENT' | 'FIXED'
  percent: number
  fixed: number
}

interface RoomPricePeriod {
  pricePerDay: number
  dateFrom: string | Date
  dateTo: string | Date
}

interface Props {
  roomId: string
  roomSlug: string
  roomName: string
  basePricePerDay: number
  pricePeriods: RoomPricePeriod[]
  maxGuests: number
  occupiedRanges: OccupiedRange[]
  depositSettings: DepositSettings
  minNights: number
}

function stayDaysLabel(days: number): string {
  const mod10 = days % 10
  const mod100 = days % 100

  if (mod100 >= 11 && mod100 <= 19) return `${days} дней`
  if (mod10 === 1) return `${days} день`
  if (mod10 >= 2 && mod10 <= 4) return `${days} дня`
  return `${days} дней`
}

function groupPriceBreakdown(items: Array<{ date: string; pricePerDay: number }>) {
  return items.reduce<Array<{ startDate: string; endDate: string; pricePerDay: number; days: number }>>((groups, item) => {
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.pricePerDay === item.pricePerDay) {
      lastGroup.endDate = item.date
      lastGroup.days += 1
      return groups
    }

    groups.push({
      startDate: item.date,
      endDate: item.date,
      pricePerDay: item.pricePerDay,
      days: 1,
    })

    return groups
  }, [])
}

export function BookingForm({
  roomId,
  roomSlug,
  roomName,
  basePricePerDay,
  pricePeriods,
  maxGuests,
  occupiedRanges,
  depositSettings,
  minNights,
}: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [range, setRange] = useState<DateRange | undefined>()
  const [step, setStep] = useState<'calendar' | 'form'>('calendar')
  const [loading, setLoading] = useState(false)

  const normalizedPricePeriods = useMemo(
    () => normalizeRoomPricePeriods(pricePeriods || []),
    [pricePeriods],
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: 1,
      hasPets: false,
      smoking: false,
      transferNeeded: false,
      transferUnknown: false,
      guestName: session?.user?.name || '',
      guestEmail: session?.user?.email || '',
    },
  })

  const transferNeeded = watch('transferNeeded')
  const transferUnknown = watch('transferUnknown')
  const hasPets = watch('hasPets')

  const disabledDays = useMemo(() => {
    const disabled: Date[] = []
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    disabled.push({ before: yesterday } as any)

    occupiedRanges.forEach((occupiedRange) => {
      let currentDay = new Date(occupiedRange.from)
      while (isBefore(currentDay, occupiedRange.to)) {
        disabled.push(new Date(currentDay))
        currentDay = addDays(currentDay, 1)
      }
    })

    return disabled
  }, [occupiedRanges])

  const isRangeOccupied = (from: Date, to: Date): boolean => {
    return occupiedRanges.some((occupiedRange) => (
      isWithinInterval(from, { start: occupiedRange.from, end: addDays(occupiedRange.to, -1) }) ||
      isWithinInterval(to, { start: addDays(occupiedRange.from, 1), end: occupiedRange.to }) ||
      (isBefore(from, occupiedRange.from) && isBefore(occupiedRange.to, to))
    ))
  }

  const nights = range?.from && range?.to ? countNights(range.from, range.to) : 0
  const priceBreakdown = useMemo(() => {
    if (!range?.from || !range?.to || nights < 1) {
      return []
    }

    return buildNightlyPriceBreakdown(range.from, range.to, basePricePerDay, normalizedPricePeriods)
  }, [basePricePerDay, nights, normalizedPricePeriods, range?.from, range?.to])
  const groupedPriceBreakdown = useMemo(() => groupPriceBreakdown(priceBreakdown), [priceBreakdown])
  const totalPrice = priceBreakdown.length > 0 ? calculateNightlyBreakdownTotal(priceBreakdown) : 0
  const depositAmount = calculateDeposit(totalPrice, depositSettings)

  const handleDayClick = (date: Date, modifiers: Record<string, boolean>) => {
    if (modifiers.disabled) {
      return
    }

    if (!range?.from) {
      setRange({ from: date, to: undefined })
      return
    }

    if (range.from && range.to) {
      setRange(undefined)
      return
    }

    const nextRange = date < range.from ? { from: date, to: range.from } : { from: range.from, to: date }

    if (nextRange.from && nextRange.to && isRangeOccupied(nextRange.from, nextRange.to)) {
      showError('Выбранный период недоступен — часть дат занята')
      setRange(undefined)
      return
    }

    if (nextRange.from && nextRange.to) {
      const selectedNights = countNights(nextRange.from, nextRange.to)
      if (selectedNights < minNights) {
        showError(`Минимальное бронирование — ${minNights} ${nightsLabel(minNights)}`)
      }
    }

    setRange(nextRange)
  }

  const onSubmit = async (data: FormData) => {
    if (!range?.from || !range?.to) {
      showError('Выберите даты заезда и выезда')
      return
    }

    if (nights < minNights) {
      showError(`Минимальный срок — ${minNights} ${nightsLabel(minNights)}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn: range.from.toISOString(),
          checkOut: range.to.toISOString(),
          ...data,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Ошибка при создании брони')

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else {
        success('Бронь создана! Перенаправляем...')
        router.push(`/account/bookings?new=${result.bookingId}`)
      }
    } catch (error: any) {
      showError(error.message || 'Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {step === 'calendar' && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 text-sea-600" />
            Выберите даты заезда и выезда
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <DayPicker
              mode="range"
              selected={range}
              onDayClick={handleDayClick}
              locale={ru}
              disabled={disabledDays}
              fromDate={new Date()}
              numberOfMonths={1}
              modifiersClassNames={{
                selected: 'rdp-day_selected',
                range_middle: 'rdp-day_range_middle',
                range_start: 'rdp-day_range_start',
                range_end: 'rdp-day_range_end',
              }}
              components={{
                DayButton: ({ day, modifiers, children, ...buttonProps }: any) => {
                  const date = day.date as Date
                  const disabled = Boolean(modifiers?.disabled)
                  const dailyPrice = getNightlyPrice(basePricePerDay, normalizedPricePeriods, date)
                  const isBoundary = Boolean(modifiers?.range_start || modifiers?.range_end || (modifiers?.selected && !modifiers?.range_middle))

                  return (
                    <button
                      {...buttonProps}
                      className={cn(
                        buttonProps.className,
                        'relative z-10 flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors',
                        isBoundary ? 'bg-[#f5dc84] text-[#5b4a16] shadow-[0_4px_12px_rgba(189,158,62,0.25)]' : 'text-gray-700',
                        modifiers?.range_middle && !isBoundary ? 'text-[#285b6a]' : '',
                      )}
                    >
                      <div className="flex min-h-[42px] w-full flex-col items-center justify-center leading-none">
                        <span className="text-[12px]">{children}</span>
                        {!disabled && (
                          <span className={cn('mt-1 text-[9px]', isBoundary ? 'text-[#6b5720]' : 'text-gray-500')}>
                            {Math.round(dailyPrice / 100)}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                },
              }}
              styles={{
                root: { margin: '0 auto', fontFamily: 'Nunito, sans-serif' },
                range_middle: { backgroundColor: '#dceff8', color: '#285b6a' },
                range_start: { background: 'linear-gradient(to right, transparent 50%, #dceff8 50%)' },
                range_end: { background: 'linear-gradient(to right, #dceff8 50%, transparent 50%)' },
              }}
            />
          </div>

          {range?.from && range?.to && (
            <div className="mt-4 rounded-2xl border border-sea-100 bg-sea-50 p-4">
              <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Заезд</div>
                  <div className="font-semibold text-gray-900">{formatDate(range.from)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Выезд</div>
                  <div className="font-semibold text-gray-900">{formatDate(range.to)}</div>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-sea-200 pt-3">
                {groupedPriceBreakdown.map((item) => (
                  <div key={`${item.startDate}-${item.endDate}-${item.pricePerDay}`} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      {item.startDate}{item.startDate !== item.endDate ? `-${item.endDate}` : ''} — по {formatMoney(item.pricePerDay)}/сутки
                    </span>
                    <span className="font-medium whitespace-nowrap">{stayDaysLabel(item.days)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-500">{stayDaysLabel(nights)}</span>
                  <span className="font-semibold">{formatMoney(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Депозит ({depositSettings.type === 'PERCENT' ? `${depositSettings.percent}%` : 'фиксированный'})
                  </span>
                  <span className="font-semibold text-coral-600">{formatMoney(depositAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {nights >= minNights && (
            <button
              type="button"
              onClick={() => setStep('form')}
              className="btn-primary w-full mt-4 justify-center"
            >
              Продолжить оформление
            </button>
          )}
        </div>
      )}

      {step === 'form' && (
        <div className="space-y-5">
          <div className="p-4 bg-sea-50 rounded-2xl border border-sea-100">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setStep('calendar')} className="text-sea-700 text-sm font-medium hover:underline">
                ← Изменить даты
              </button>
              <span className="text-sm font-semibold text-sea-700">{formatMoney(depositAmount)} депозит</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(range!.from!)} — {formatDate(range!.to!)} · {stayDaysLabel(nights)} · итого {formatMoney(totalPrice)}
            </div>
          </div>

          {!session && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Вы не авторизованы. <a href="/auth/login" className="underline font-medium">Войдите</a>, чтобы управлять бронью в личном кабинете.
              </span>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-sea-600" /> Данные гостя
            </h3>
            <div>
              <input {...register('guestName')} placeholder="Имя и фамилия *" className="input-field" />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>
            <div>
              <input {...register('guestPhone')} placeholder="Номер телефона *" type="tel" className="input-field" />
              {errors.guestPhone && <p className="text-red-500 text-xs mt-1">{errors.guestPhone.message}</p>}
            </div>
            <div>
              <input {...register('guestEmail')} placeholder="Email (необязательно)" type="email" className="input-field" />
              {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-sea-600" /> О проживании
            </h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Количество гостей *</label>
              <select {...register('guests', { valueAsNumber: true })} className="input-field">
                {Array.from({ length: maxGuests }, (_, index) => index + 1).map((guestCount) => (
                  <option key={guestCount} value={guestCount}>{guestsLabel(guestCount)}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" {...register('hasPets')} className="w-4 h-4 rounded accent-sea-700" />
              <span className="text-sm flex items-center gap-1.5">
                <PawPrint className="w-4 h-4 text-gray-400" /> Есть домашние животные
              </span>
            </label>

            {hasPets && (
              <input
                {...register('petsDescription')}
                placeholder="Опишите питомца (порода, размер)"
                className="input-field"
              />
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" {...register('smoking')} className="w-4 h-4 rounded accent-sea-700" />
              <span className="text-sm text-gray-700">Есть курящие среди гостей</span>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-sea-600" /> Трансфер
            </h3>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" {...register('transferNeeded')} className="w-4 h-4 rounded accent-sea-700" />
              <span className="text-sm text-gray-700">Нужен трансфер (платно, стоимость уточняется)</span>
            </label>

            {transferNeeded && (
              <div className="space-y-3 pl-7">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" {...register('transferUnknown')} className="w-4 h-4 rounded accent-sea-700" />
                  <span className="text-sm text-gray-600">Пока не знаю откуда</span>
                </label>

                {!transferUnknown && (
                  <>
                    <input
                      {...register('transferFrom')}
                      placeholder="Откуда забрать (город, адрес, вокзал)"
                      className="input-field"
                    />
                    <input
                      {...register('transferDate')}
                      type="datetime-local"
                      className="input-field"
                      min={range?.from?.toISOString().slice(0, 16)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-sea-600" /> Комментарий
            </h3>
            <textarea
              {...register('comment')}
              placeholder="Пожелания, вопросы, особые требования..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="p-4 bg-sand-100 rounded-2xl border border-sand-200 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Условия оплаты</p>
            <p>Сейчас оплачивается депозит <strong>{formatMoney(depositAmount)}</strong>. Оставшаяся сумма <strong>{formatMoney(totalPrice - depositAmount)}</strong> оплачивается при заезде.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Создаём бронь...
              </>
            ) : (
              `Перейти к оплате — ${formatMoney(depositAmount)}`
            )}
          </button>
        </div>
      )}
    </form>
  )
}
