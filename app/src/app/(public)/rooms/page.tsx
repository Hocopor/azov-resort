import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/utils'
import { Waves, Wind, Tv, Refrigerator, UtensilsCrossed, Users, Maximize2, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Номера — выберите подходящий вариант' }
export const revalidate = 60

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

async function getRooms() {
  return prisma.room.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-deep-900 to-sea-700 text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Наши номера</h1>
          <p className="text-white/80 text-lg">
            7 уютных номеров — от экономичных до просторных люксов. Выберите то, что подходит именно вам.
          </p>
        </div>
      </section>

      {/* Filters hint */}
      <section className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Доступно {rooms.length} номеров</span>
            <span className="text-gray-300">|</span>
            <span>Заезд с 14:00 · Выезд до 12:00</span>
          </div>
        </div>
      </section>

      {/* Rooms grid */}
      <section className="bg-sand-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="card overflow-hidden lg:flex group hover:shadow-card-hover transition-shadow duration-300"
              >
                {(() => {
                  const customAmenities = normalizeAmenities(room.amenities)
                  const previewAmenities = customAmenities.length > 0
                    ? customAmenities.slice(0, 7)
                    : ['Душ', 'Туалет', 'Wi-Fi', 'Мангальная зона', 'Парковка', 'Сапборды', 'Велосипеды']

                  return (
                    <>
                {/* Image */}
                <div className="relative lg:w-80 xl:w-96 h-60 lg:h-auto flex-shrink-0 bg-gradient-to-br from-sea-100 to-sea-200">
                  {room.images[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized={isUploadedImage(room.images[0])}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Waves className="w-20 h-20 text-sea-300" />
                    </div>
                  )}
                  {/* Gallery thumbnails */}
                  {room.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {room.images.slice(1, 4).map((img, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white">
                          <Image src={img} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized={isUploadedImage(img)} />
                        </div>
                      ))}
                      {room.images.length > 4 && (
                        <div className="w-10 h-10 rounded-lg bg-black/60 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          +{room.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-7 lg:flex lg:flex-col lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <h2 className="font-display text-2xl font-semibold text-gray-900">{room.name}</h2>
                        <p className="text-gray-500 mt-1">{room.shortDescription}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-sea-700">{formatMoney(room.pricePerDay)}</div>
                        <div className="text-xs text-gray-400">за ночь</div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-5">{room.description}</p>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="badge-sea">
                        <Users className="w-3 h-3" /> До {room.capacity} гостей
                      </span>
                      {room.area && (
                        <span className="badge-sea">
                          <Maximize2 className="w-3 h-3" /> {room.area} м²
                        </span>
                      )}
                      {room.floor !== null && room.floor !== undefined && (
                        <span className="badge-sea">Этаж {room.floor}</span>
                      )}
                      {room.hasAC && (
                        <span className="badge bg-blue-100 text-blue-700">
                          <Wind className="w-3 h-3" /> Кондиционер
                        </span>
                      )}
                      {room.hasTV && (
                        <span className="badge-sand">
                          <Tv className="w-3 h-3" /> Телевизор
                        </span>
                      )}
                      {room.hasFridge && (
                        <span className="badge-sand">
                          <Refrigerator className="w-3 h-3" /> Холодильник
                        </span>
                      )}
                      {room.hasPrivateKitchen ? (
                        <span className="badge bg-green-100 text-green-700">
                          <UtensilsCrossed className="w-3 h-3" /> Своя кухня
                        </span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-700">
                          <UtensilsCrossed className="w-3 h-3" /> Общая кухня
                        </span>
                      )}
                    </div>

                    {/* Common amenities */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {previewAmenities.map((a) => (
                        <span key={a} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" /> {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Link href={`/rooms/${room.slug}`} className="btn-outline flex-1 justify-center">
                      Подробнее и фото
                    </Link>
                    <Link href={`/rooms/${room.slug}#booking`} className="btn-primary flex-1 justify-center">
                      Забронировать
                    </Link>
                  </div>
                </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="text-center py-20">
              <Waves className="w-16 h-16 text-sea-200 mx-auto mb-4" />
              <p className="text-gray-500">Номера временно недоступны. Пожалуйста, свяжитесь с нами напрямую.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
