import { Metadata } from 'next'
import { Waves } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getRoomPriceRange, normalizeRoomPricePeriods } from '@/lib/pricing'
import { RoomCard } from '@/components/rooms/RoomCard'

export const metadata: Metadata = {
  title: 'Номера на Азовском море — цены, фото, удобства',
}

export const revalidate = 60

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

async function getRooms() {
  return prisma.room.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      pricePeriods: {
        orderBy: { dateFrom: 'asc' },
      },
    },
  })
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="min-h-screen">
      <section className="bg-deep-900 page-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-sea-600 rounded-full blur-3xl opacity-15" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-deep-700 rounded-full blur-2xl opacity-30" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 className="mb-4 font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Наши номера
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-xl mx-auto">
            Фото, цены и удобства. Выберите вариант, который подходит именно вам.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-gray-100 bg-white md:top-20">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Доступно {rooms.length} номеров</span>
            <span className="text-gray-300">|</span>
            <span>Заезд с 14:00 · Выезд до 12:00</span>
          </div>
        </div>
      </section>

      <section className="bg-sand-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {rooms.map((room) => {
              const customAmenities = normalizeAmenities(room.amenities)
              const priceRange = getRoomPriceRange(
                room.pricePerDay,
                normalizeRoomPricePeriods(room.pricePeriods || []),
              )
              const previewAmenities =
                customAmenities.length > 0
                  ? customAmenities.slice(0, 7)
                  : [
                      'Душ',
                      'Туалет',
                      'Wi-Fi',
                      'Мангальная зона',
                      'Парковка',
                      'Сапборды',
                      'Велосипеды',
                    ]

              return (
                <RoomCard
                  key={room.id}
                  href={`/rooms/${room.slug}`}
                  bookingHref={`/rooms/${room.slug}#booking`}
                  name={room.name}
                  shortDescription={room.shortDescription}
                  description={room.description}
                  images={room.images}
                  capacity={room.capacity}
                  baseCapacity={room.baseCapacity ?? room.capacity}
                  extraCapacity={room.extraCapacity ?? 0}
                  area={room.area}
                  floor={room.floor}
                  hasAC={room.hasAC}
                  hasPrivateKitchen={room.hasPrivateKitchen}
                  hasTV={room.hasTV}
                  hasFridge={room.hasFridge}
                  previewAmenities={previewAmenities}
                  minPrice={priceRange.minPrice}
                  maxPrice={priceRange.maxPrice}
                  hasPriceRange={priceRange.hasRange}
                />
              )
            })}
          </div>

          {rooms.length === 0 && (
            <div className="py-20 text-center">
              <Waves className="mx-auto mb-4 h-16 w-16 text-sea-200" />
              <p className="text-gray-500">
                Номера временно недоступны. Пожалуйста, свяжитесь с нами напрямую.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
