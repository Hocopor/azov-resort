'use client'

import { type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Maximize2,
  Refrigerator,
  Tv,
  Users,
  UtensilsCrossed,
  Wind,
} from 'lucide-react'
import { formatMoney, getRoomCapacityBreakdown } from '@/lib/utils'
import { RoomImageCarousel } from '@/components/rooms/RoomImageCarousel'

interface Props {
  href: string
  bookingHref: string
  name: string
  shortDescription: string
  images: string[]
  capacity: number
  baseCapacity: number
  extraCapacity: number
  area?: number | null
  floor?: number | null
  hasAC: boolean
  hasPrivateKitchen: boolean
  hasTV: boolean
  hasFridge: boolean
  previewAmenities: string[]
  minPrice: number
  maxPrice: number
  hasPriceRange: boolean
}

export function RoomCard({
  href,
  bookingHref,
  name,
  shortDescription,
  images,
  capacity,
  baseCapacity,
  extraCapacity,
  area,
  floor,
  hasAC,
  hasPrivateKitchen,
  hasTV,
  hasFridge,
  previewAmenities,
  minPrice,
  maxPrice,
  hasPriceRange,
}: Props) {
  const router = useRouter()

  const openRoom = () => {
    router.push(href)
  }

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    openRoom()
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openRoom}
      onKeyDown={onCardKeyDown}
      className="card group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-px lg:flex"
    >
      <div className="lg:w-72 lg:flex-shrink-0 xl:w-88">
        <RoomImageCarousel images={images} name={name} className="h-52 sm:h-60 lg:h-full" />
      </div>

      <div className="flex-1 p-5 sm:p-6 lg:p-7 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">{name}</h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{shortDescription}</p>
            </div>
            <div className="sm:flex-shrink-0 sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-sea-700">
                {hasPriceRange
                  ? `${formatMoney(minPrice)}-${formatMoney(maxPrice)}`
                  : formatMoney(minPrice)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {hasPriceRange
                  ? 'выберите период для точной цены'
                  : 'за сутки'}
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5 sm:gap-2">
            <span className="badge-sea">
              <Users className="h-3 w-3" />{' '}
              {getRoomCapacityBreakdown(
                baseCapacity,
                extraCapacity || Math.max(0, capacity - baseCapacity),
              )}
            </span>
            {area ? (
              <span className="badge-sea">
                <Maximize2 className="h-3 w-3" /> {area} м²
              </span>
            ) : null}
            {floor !== null && floor !== undefined ? (
              <span className="badge-sea">Этаж {floor}</span>
            ) : null}
            {hasAC ? (
              <span className="badge bg-blue-100 text-blue-700">
                <Wind className="h-3 w-3" /> Кондиционер
              </span>
            ) : null}
            {hasTV ? (
              <span className="badge-sand">
                <Tv className="h-3 w-3" /> Телевизор
              </span>
            ) : null}
            {hasFridge ? (
              <span className="badge-sand">
                <Refrigerator className="h-3 w-3" /> Холодильник
              </span>
            ) : null}
            <span
              className={
                hasPrivateKitchen
                  ? 'badge bg-green-100 text-green-700'
                  : 'badge bg-yellow-100 text-yellow-700'
              }
            >
              <UtensilsCrossed className="h-3 w-3" />{' '}
              {hasPrivateKitchen ? 'Своя кухня' : 'Общая кухня'}
            </span>
          </div>

          <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {previewAmenities.map((item) => (
              <span key={item} className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link
            href={href}
            onClick={(event) => event.stopPropagation()}
            className="btn-outline flex-1 justify-center"
          >
            Подробнее
          </Link>
          <Link
            href={bookingHref}
            onClick={(event) => event.stopPropagation()}
            className="btn-primary flex-1 justify-center"
          >
            Забронировать
          </Link>
        </div>
      </div>
    </article>
  )
}
