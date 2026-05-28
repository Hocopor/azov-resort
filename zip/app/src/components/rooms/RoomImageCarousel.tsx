'use client'

import { type MouseEvent, useState } from 'react'
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'
import { cn } from '@/lib/utils'

interface Props {
  images: string[]
  name: string
  className?: string
  priority?: boolean
}

export function RoomImageCarousel({ images, name, className, priority = false }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const hasImages = images.length > 0
  const hasMultiple = images.length > 1
  const currentImage = hasImages ? images[activeIndex] : null

  const showPrevious = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveIndex((current) => (current - 1 + images.length) % images.length)
  }

  const showNext = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveIndex((current) => (current + 1) % images.length)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-sea-100 to-sea-200',
        className,
      )}
    >
      {currentImage ? (
        <AppImage
          src={currentImage}
          alt={`${name} — фото ${activeIndex + 1}`}
          fill
          variant="card"
          sizes="(max-width: 1024px) 100vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Waves className="h-20 w-20 text-sea-300" />
        </div>
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-sea-700 shadow-md transition-all duration-200 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={showNext}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-sea-700 shadow-md transition-all duration-200 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Показать фото ${index + 1}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setActiveIndex(index)
                }}
                className={cn(
                  'h-2.5 w-2.5 rounded-full border border-white/60 transition-all',
                  index === activeIndex ? 'bg-white' : 'bg-white/35 hover:bg-white/60',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
