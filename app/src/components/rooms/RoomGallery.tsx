'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Waves, ZoomIn, Loader2 } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'

interface Props {
  images: string[]
  name: string
}

export function RoomGallery({ images, name }: Props) {
  const [startIndex, setStartIndex] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track loaded image URLs to show/hide spinner
  const loadedRef = useRef(new Set<string>())
  const [loadedTick, setLoadedTick] = useState(0)

  const markLoaded = useCallback((url: string) => {
    if (loadedRef.current.has(url)) return
    loadedRef.current.add(url)
    setLoadedTick((n) => n + 1)
  }, [])

  const isLoaded = (url: string) => loadedRef.current.has(url)

  const count = images.length
  const visibleCount = Math.min(isMobile ? 1 : 3, count)
  const needsNav = count > visibleCount

  const shiftLeft = () => setStartIndex((i) => (i - 1 + count) % count)
  const shiftRight = () => setStartIndex((i) => (i + 1) % count)
  const lightboxPrev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + count) % count : null))
  const lightboxNext = () => setLightboxIdx((i) => (i !== null ? (i + 1) % count : null))

  // Preload adjacent images when slide changes
  useEffect(() => {
    if (!needsNav) return
    const toPreload = [
      images[(startIndex - 1 + count) % count],
      images[(startIndex + visibleCount) % count],
    ]
    toPreload.forEach((src) => {
      if (isLoaded(src)) return
      const img = new window.Image()
      img.src = src.startsWith('/uploads/') ? `${src}?w=960&q=76&fm=webp` : src
      img.onload = () => markLoaded(src)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, count])

  if (count === 0) {
    return (
      <div className="card flex h-80 items-center justify-center bg-gradient-to-br from-sea-100 to-sea-200">
        <Waves className="h-24 w-24 text-sea-300" />
      </div>
    )
  }

  const slots = Array.from({ length: visibleCount }, (_, i) => {
    const idx = (startIndex + i) % count
    return { src: images[idx], idx, slot: i }
  })

  const gridCols =
    visibleCount === 1 ? 'grid-cols-1' : visibleCount === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <>
      {/* Carousel */}
      <div className={needsNav ? 'relative px-14' : 'relative'}>
        {needsNav && (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={shiftLeft}
              className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sea-700 shadow-lg transition-colors hover:bg-sea-50"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={shiftRight}
              className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sea-700 shadow-lg transition-colors hover:bg-sea-50"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </>
        )}

        <div className={`grid gap-2 overflow-hidden rounded-2xl ${gridCols}`}>
          {slots.map(({ src, idx, slot }) => (
            <div
              key={src}
              className="group relative h-64 cursor-pointer overflow-hidden bg-sand-100 sm:h-72 md:h-80"
              onClick={() => setLightboxIdx(idx)}
            >
              {!isLoaded(src) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-sand-100">
                  <Loader2 className="h-8 w-8 animate-spin text-sea-300" />
                </div>
              )}
              <AppImage
                src={src}
                alt={`${name} — фото ${idx + 1}`}
                fill
                variant="gallery"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 34vw, 420px"
                className="object-cover"
                priority={startIndex === 0 && slot === 0}
                onLoad={() => markLoaded(src)}
              />
              {isLoaded(src) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/15">
                  <ZoomIn className="h-7 w-7 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dot navigation */}
      {needsNav && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Фото ${i + 1}`}
              onClick={() => setStartIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === startIndex ? 'w-5 bg-sea-600' : 'w-2 bg-sea-200 hover:bg-sea-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 transition-colors hover:bg-white/20"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {count > 1 && (
            <>
              <button
                className="absolute left-4 z-10 rounded-xl bg-white/10 p-2 transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxPrev()
                }}
              >
                <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
              </button>
              <button
                className="absolute right-4 z-10 rounded-xl bg-white/10 p-2 transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxNext()
                }}
              >
                <ChevronRight className="h-6 w-6 text-white" strokeWidth={2.5} />
              </button>
            </>
          )}

          <div
            className="relative h-[80vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AppImage
              src={images[lightboxIdx]}
              alt={`${name} ${lightboxIdx + 1}`}
              fill
              variant="lightbox"
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIdx(i)
                }}
                className={`h-8 w-12 overflow-hidden rounded-lg border-2 transition-all ${
                  i === lightboxIdx ? 'scale-110 border-white' : 'border-white/30'
                }`}
              >
                <AppImage
                  src={img}
                  alt=""
                  variant="thumb"
                  width={48}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="absolute left-1/2 top-4 -translate-x-1/2 text-sm text-white/60">
            {lightboxIdx + 1} / {count}
          </div>
        </div>
      )}
    </>
  )
}
