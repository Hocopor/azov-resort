import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle,
  Maximize2,
  Refrigerator,
  Tv,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { getRoomPriceRange, normalizeRoomPricePeriods } from '@/lib/pricing'
import { formatMoney, getRoomCapacityBreakdown } from '@/lib/utils'
import { BookingForm } from '@/components/rooms/BookingForm'
import { RoomGallery } from '@/components/rooms/RoomGallery'

interface Props {
  params: { id: string }
}

function normalizeAmenities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (value && typeof value === 'object') {
    const amenityLabels: Record<string, string> = {
      shower: 'Душ',
      toilet: 'Туалет',
      ac: 'Кондиционер',
      tv: 'Телевизор',
      fridge: 'Холодильник',
      wifi: 'Wi-Fi',
      privateKitchen: 'Своя кухня',
      sharedKitchen: 'Общая кухня',
      veranda: 'Веранда',
      sofa: 'Диван',
    }

    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => amenityLabels[key] || key)
  }

  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await prisma.room.findUnique({ where: { slug: params.id } })
  if (!room) return {}

  return {
    title: room.name,
    description: room.shortDescription,
  }
}

async function getRoomData(slug: string) {
  const [room, settings] = await Promise.all([
    prisma.room.findUnique({
      where: { slug, isActive: true },
      include: {
        pricePeriods: {
          orderBy: { dateFrom: 'asc' },
        },
        blockedDates: { where: { dateTo: { gte: new Date() } } },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
            checkOut: { gte: new Date() },
          },
          select: { checkIn: true, checkOut: true, status: true },
        },
      },
    }),
    getSettings([
      'deposit_type',
      'deposit_percent',
      'deposit_fixed',
      'check_in_time',
      'check_out_time',
      'min_booking_days',
    ]),
  ])

  return { room, settings }
}

export const revalidate = 300

export default async function RoomDetailPage({ params }: Props) {
  const { room, settings } = await getRoomData(params.id)
  if (!room) notFound()

  const occupiedRanges = [
    ...room.bookings.map((booking) => ({
      from: new Date(booking.checkIn),
      to: new Date(booking.checkOut),
    })),
    ...room.blockedDates.map((item) => ({
      from: new Date(item.dateFrom),
      to: new Date(item.dateTo),
    })),
  ]

  const normalizedPricePeriods = normalizeRoomPricePeriods(room.pricePeriods || [])
  const priceRange = getRoomPriceRange(room.pricePerDay, normalizedPricePeriods)

  const amenitiesList = [
    { icon: Wifi, label: 'Wi-Fi бесплатно', always: true },
    { icon: Wind, label: 'Кондиционер', condition: room.hasAC },
    { icon: Tv, label: 'Телевизор', condition: room.hasTV },
    { icon: Refrigerator, label: 'Холодильник', condition: room.hasFridge },
    {
      icon: UtensilsCrossed,
      label: room.hasPrivateKitchen ? 'Своя кухня' : 'Общая кухня',
      always: true,
    },
    { icon: CheckCircle, label: 'Душ и туалет', always: true },
    { icon: CheckCircle, label: 'Мангальная зона', always: true },
    { icon: Car, label: 'Парковка бесплатно', always: true },
    { icon: Bike, label: 'Велосипеды бесплатно', always: true },
    { icon: Waves, label: 'Сапборды бесплатно', always: true },
    { icon: CheckCircle, label: 'Беседки', always: true },
    { icon: CheckCircle, label: 'Уборка номера', always: true },
  ].filter((item) => item.always || item.condition)

  const customAmenities = normalizeAmenities(room.amenities)
  const capacityLabel = getRoomCapacityBreakdown(
    room.baseCapacity ?? room.capacity,
    room.extraCapacity ?? 0,
  )

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Back link */}
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-28 sm:px-6 lg:px-8">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 font-medium text-sea-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Все номера
        </Link>
      </div>

      {/* Gallery — full page width with small edge padding */}
      <div className="px-3 sm:px-4">
        <RoomGallery images={room.images} name={room.name} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <div className="card p-8">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 font-display text-3xl font-bold text-gray-900 md:text-4xl">
                    {room.name}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <span className="badge-sea">
                      <Users className="h-3.5 w-3.5" /> {capacityLabel}
                    </span>
                    {room.area ? (
                      <span className="badge-sea">
                        <Maximize2 className="h-3.5 w-3.5" /> {room.area} м²
                      </span>
                    ) : null}
                    {room.floor !== null && room.floor !== undefined ? (
                      <span className="badge-sea">Этаж {room.floor}</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-sea-700">
                    {priceRange.hasRange
                      ? `${formatMoney(priceRange.minPrice)}-${formatMoney(priceRange.maxPrice)}`
                      : formatMoney(priceRange.minPrice)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {priceRange.hasRange ? 'актуальная цена зависит от периода' : 'за сутки'}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-lg leading-relaxed text-gray-700">{room.description}</p>

              <h2 className="mb-5 font-display text-2xl font-semibold">Удобства</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {customAmenities.length > 0
                  ? customAmenities.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 rounded-xl bg-sand-50 p-3"
                      >
                        <CheckCircle className="h-5 w-5 flex-shrink-0 text-sea-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))
                  : amenitiesList.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2.5 rounded-xl bg-sand-50 p-3"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-sea-600" />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          <div id="booking" className="mt-8 lg:mt-0">
            <div className="card sticky top-28 p-6">
              <h2 className="mb-2 font-display text-2xl font-semibold text-gray-900">
                Забронировать
              </h2>
              <BookingForm
                roomId={room.id}
                roomSlug={room.slug}
                roomName={room.name}
                basePricePerDay={room.pricePerDay}
                pricePeriods={room.pricePeriods}
                maxGuests={room.capacity}
                occupiedRanges={occupiedRanges}
                depositSettings={{
                  type: (settings.deposit_type as 'PERCENT' | 'FIXED') || 'PERCENT',
                  percent: parseInt(settings.deposit_percent || '30', 10),
                  fixed: parseInt(settings.deposit_fixed || '200000', 10),
                }}
                minNights={parseInt(settings.min_booking_days || '1', 10)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
