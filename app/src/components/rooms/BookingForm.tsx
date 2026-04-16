'use client'
import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DayPicker, DateRange } from 'react-day-picker'
import { ru } from 'date-fns/locale'
import { addDays, differenceInCalendarDays, isWithinInterval, isBefore } from 'date-fns'
import { formatMoney, formatDate, countNights, nightsLabel, guestsLabel, calculateDeposit } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'
import { Calendar, User, Phone, Mail, Users, PawPrint, Car, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
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

interface OccupiedRange { from: Date; to: Date }
interface DepositSettings { type: 'PERCENT' | 'FIXED'; percent: number; fixed: number }

interface Props {
  roomId: string
  roomSlug: string
  roomName: string
  pricePerDay: number
  maxGuests: number
  occupiedRanges: OccupiedRange[]
  depositSettings: DepositSettings
  minNights: number
}

export function BookingForm({
  roomId, roomSlug, roomName, pricePerDay, maxGuests, occupiedRanges, depositSettings, minNights
}: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [range, setRange] = useState<DateRange | undefined>()
  const [step, setStep] = useState<'calendar' | 'form'>('calendar')
  const [loading, setLoading] = useState(false)

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

  // Calculate disabled days
  const disabledDays = useMemo(() => {
    const disabled: Date[] = []
    // Past days
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    disabled.push({ before: yesterday } as any)

    // Occupied ranges
    occupiedRanges.forEach((r) => {
      let d = new Date(r.from)
      while (isBefore(d, r.to)) {
        disabled.push(new Date(d))
        d = addDays(d, 1)
      }
    })
    return disabled
  }, [occupiedRanges])

  const isRangeOccupied = (from: Date, to: Date): boolean => {
    return occupiedRanges.some((r) => {
      return (
        isWithinInterval(from, { start: r.from, end: addDays(r.to, -1) }) ||
        isWithinInterval(to, { start: addDays(r.from, 1), end: r.to }) ||
        (isBefore(from, r.from) && isBefore(r.to, to))
      )
    })
  }

  const nights = range?.from && range?.to ? countNights(range.from, range.to) : 0
  const totalPrice = pricePerDay * nights
  const depositAmount = calculateDeposit(totalPrice, depositSettings)

  const handleRangeSelect = (r: DateRange | undefined) => {
    if (r?.from && r?.to && isRangeOccupied(r.from, r.to)) {
      showError('Выбранный период недоступен — часть дат занята')
      setRange(undefined)
      return
    }
    if (r?.from && r?.to && nights < minNights) {
      showError(`Минимальное бронирование — ${minNights} ${nightsLabel(minNights)}`)
    }
    setRange(r)
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
    } catch (e: any) {
      showError(e.message || 'Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Step 1: Calendar */}
      {step === 'calendar' && (
        <div>
          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 text-sea-600" />
            Выберите даты заезда и выезда
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              locale={ru}
              disabled={disabledDays}
              fromDate={new Date()}
              numberOfMonths={1}
              modifiersClassNames={{
                selected: 'rdp-day_selected',
                range_middle: 'rdp-day_range_middle',
              }}
              styles={{
                root: { margin: '0 auto', fontFamily: 'Nunito, sans-serif' },
              }}
            />
          </div>

          {/* Selected dates summary */}
          {range?.from && range?.to && (
            <div className="mt-4 p-4 bg-sea-50 rounded-2xl border border-sea-100">
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Заезд</div>
                  <div className="font-semibold text-gray-900">{formatDate(range.from)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">Выезд</div>
                  <div className="font-semibold text-gray-900">{formatDate(range.to)}</div>
                </div>
              </div>
              <div className="border-t border-sea-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{formatMoney(pricePerDay)} × {nightsLabel(nights)}</span>
                  <span className="font-medium">{formatMoney(totalPrice)}</span>
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

      {/* Step 2: Form */}
      {step === 'form' && (
        <div className="space-y-5">
          {/* Back / Summary */}
          <div className="p-4 bg-sea-50 rounded-2xl border border-sea-100">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setStep('calendar')} className="text-sea-700 text-sm font-medium hover:underline">
                ← Изменить даты
              </button>
              <span className="text-sm font-semibold text-sea-700">{formatMoney(depositAmount)} депозит</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(range!.from!)} — {formatDate(range!.to!)} · {nightsLabel(nights)} · итого {formatMoney(totalPrice)}
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

          {/* Guest info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-sea-600" /> Данные гостя
            </h3>
            <div>
              <input
                {...register('guestName')}
                placeholder="Имя и фамилия *"
                className="input-field"
              />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>
            <div>
              <input
                {...register('guestPhone')}
                placeholder="Номер телефона *"
                type="tel"
                className="input-field"
              />
              {errors.guestPhone && <p className="text-red-500 text-xs mt-1">{errors.guestPhone.message}</p>}
            </div>
            <div>
              <input
                {...register('guestEmail')}
                placeholder="Email (необязательно)"
                type="email"
                className="input-field"
              />
              {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
            </div>
          </div>

          {/* Guests & preferences */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-sea-600" /> О проживании
            </h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Количество гостей *</label>
              <select {...register('guests', { valueAsNumber: true })} className="input-field">
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{guestsLabel(n)}</option>
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

          {/* Transfer */}
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

                {transferUnknown && (
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100">
                    {countNights(new Date(), range?.from || new Date()) >= 14
                      ? '📞 За 14 дней до заезда мы свяжемся с вами по телефону для уточнения деталей трансфера.'
                      : '📞 В ближайшее время мы свяжемся с вами для уточнения деталей трансфера.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment */}
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

          {/* Deposit note */}
          <div className="p-4 bg-sand-100 rounded-2xl border border-sand-200 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Условия оплаты</p>
            <p>Сейчас оплачивается депозит <strong>{formatMoney(depositAmount)}</strong>. Оставшаяся сумма <strong>{formatMoney(totalPrice - depositAmount)}</strong> оплачивается при заезде.</p>
          </div>

          <div className="text-xs text-gray-400 leading-relaxed">
            Нажимая «Перейти к оплате», вы соглашаетесь с{' '}
            <a href="/legal/booking-terms" target="_blank" className="underline hover:text-gray-600">условиями бронирования</a>{' '}
            и{' '}
            <a href="/legal/privacy" target="_blank" className="underline hover:text-gray-600">политикой конфиденциальности</a>.
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
