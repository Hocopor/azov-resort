import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/utils'
import { getSettings } from '@/lib/settings'
import { BookingForm } from '@/components/rooms/BookingForm'
import { RoomGallery } from '@/components/rooms/RoomGallery'
import {
  Users, Maximize2, Wind, Tv, Refrigerator, UtensilsCrossed,
  Wifi, Car, Bike, Waves, CheckCircle, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

function isUploadedImage(url: string) {
  return url.startsWith('/uploads/')
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
    getSettings(['deposit_type', 'deposit_percent', 'deposit_fixed', 'check_in_time', 'check_out_time', 'min_booking_days']),
  ])
  return { room, settings }
}

export const revalidate = 30

export default async function RoomDetailPage({ params }: Props) {
  const { room, settings } = await getRoomData(params.id)
  if (!room) notFound()

  // Compute occupied date ranges
  const occupiedRanges = [
    ...room.bookings.map((b) => ({
      from: new Date(b.checkIn),
      to: new Date(b.checkOut),
    })),
    ...room.blockedDates.map((d) => ({
      from: new Date(d.dateFrom),
      to: new Date(d.dateTo),
    })),
  ]

  const amenitiesList = [
    { icon: Wifi, label: 'Wi-Fi бесплатно', always: true },
    { icon: Wind, label: 'Кондиционер', condition: room.hasAC },
    { icon: Tv, label: 'Телевизор', condition: room.hasTV },
    { icon: Refrigerator, label: 'Холодильник', condition: room.hasFridge },
    { icon: UtensilsCrossed, label: room.hasPrivateKitchen ? 'Своя кухня' : 'Общая кухня', always: true },
    { icon: CheckCircle, label: 'Душ и туалет', always: true },
    { icon: CheckCircle, label: 'Мангальная зона', always: true },
    { icon: Car, label: 'Парковка бесплатно', always: true },
    { icon: Bike, label: 'Велосипеды бесплатно', always: true },
    { icon: Waves, label: 'Сапборды бесплатно', always: true },
    { icon: CheckCircle, label: 'Беседки', always: true },
    { icon: CheckCircle, label: 'Уборка номера', always: true },
  ].filter((a) => a.always || a.condition)

  const customAmenities = normalizeAmenities(room.amenities)

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Back */}
        <Link href="/rooms" className="inline-flex items-center gap-2 text-sea-700 font-medium mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Все номера
        </Link>

        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <RoomGallery images={room.images} name={room.name} />

            {/* Info */}
            <div className="card p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {room.name}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <span className="badge-sea">
                      <Users className="w-3.5 h-3.5" /> До {room.capacity} гостей
                    </span>
                    {room.area && (
                      <span className="badge-sea">
                        <Maximize2 className="w-3.5 h-3.5" /> {room.area} м²
                      </span>
                    )}
                    {room.floor !== null && room.floor !== undefined && (
                      <span className="badge-sea">Этаж {room.floor}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-sea-700">{formatMoney(room.pricePerDay)}</div>
                  <div className="text-sm text-gray-400">за ночь</div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg mb-8">{room.description}</p>

              <h2 className="font-display text-2xl font-semibold mb-5">Удобства</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {customAmenities.length > 0
                  ? customAmenities.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 p-3 bg-sand-50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-sea-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))
                  : amenitiesList.map((a) => (
                      <div key={a.label} className="flex items-center gap-2.5 p-3 bg-sand-50 rounded-xl">
                        <a.icon className="w-5 h-5 text-sea-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{a.label}</span>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Right column — Booking */}
          <div className="mt-8 lg:mt-0" id="booking">
            <div className="card p-6 sticky top-28">
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Забронировать</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-bold text-sea-700">{formatMoney(room.pricePerDay)}</span>
                <span className="text-gray-400 text-sm">/ ночь</span>
              </div>
              <BookingForm
                roomId={room.id}
                roomSlug={room.slug}
                roomName={room.name}
                pricePerDay={room.pricePerDay}
                maxGuests={room.capacity}
                occupiedRanges={occupiedRanges}
                depositSettings={{
                  type: settings.deposit_type as 'PERCENT' | 'FIXED' || 'PERCENT',
                  percent: parseInt(settings.deposit_percent || '30'),
                  fixed: parseInt(settings.deposit_fixed || '200000'),
                }}
                minNights={parseInt(settings.min_booking_days || '1')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
