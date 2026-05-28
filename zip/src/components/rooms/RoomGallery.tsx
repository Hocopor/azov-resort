'use client'
import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Waves, ZoomIn } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'

interface Props {
  images: string[]
  name: string
}

export function RoomGallery({ images, name }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  const len = images.length

  const prev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + len) % len : null))
  const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % len : null))

  const prevGallery = () => setCurrentIdx((i) => (i - 1 + len) % len)
  const nextGallery = () => setCurrentIdx((i) => (i + 1) % len)

  if (len === 0) {
    return (
      <div className="card h-80 flex items-center justify-center bg-gradient-to-br from-sea-100 to-sea-200">
        <Waves className="w-24 h-24 text-sea-300" />
      </div>
    )
  }

  const getIndices = () => {
    if (len === 1) return [0]
    if (len === 2) return [(currentIdx - 1 + len) % len, currentIdx, (currentIdx + 1) % len] // Will repeat one
    return [
      (currentIdx - 1 + len) % len,
      currentIdx,
      (currentIdx + 1) % len,
    ]
  }

  const visibleIndices = getIndices()

  return (
    <>
      <div className="relative group w-full mb-8">
        {len > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevGallery()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 hover:bg-white text-sea-800 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextGallery()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 hover:bg-white text-sea-800 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="overflow-hidden rounded-3xl h-64 md:h-[400px]">
          <div className="flex h-full items-center justify-center gap-4 px-4">
            {len === 1 ? (
              <div
                className="relative w-full max-w-4xl h-full cursor-pointer rounded-2xl overflow-hidden group/item"
                onClick={() => setLightboxIdx(0)}
              >
                <AppImage
                  src={images[0]}
                  alt={name}
                  fill
                  variant="gallery"
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/item:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            ) : (
              visibleIndices.map((idx, pos) => {
                const isCenter = pos === 1
                return (
                  <div
                    key={`${pos}-${idx}`}
                    onClick={() => {
                      if (isCenter) setLightboxIdx(idx)
                      else if (pos === 0) prevGallery()
                      else nextGallery()
                    }}
                    className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${
                      isCenter
                        ? 'w-full md:w-3/5 h-full opacity-100 z-10 shadow-xl group/item'
                        : 'hidden md:block w-1/5 h-4/5 opacity-60 hover:opacity-80 scale-95'
                    }`}
                  >
                    <AppImage
                      src={images[idx]}
                      alt={`${name} ${idx + 1}`}
                      fill
                      variant="gallery"
                      sizes={isCenter ? "(max-width: 768px) 100vw, 60vw" : "20vw"}
                      className="object-cover"
                      priority={isCenter}
                    />
                    {isCenter && (
                      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/item:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {len > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIdx ? 'bg-sea-600 scale-125' : 'bg-sea-200 hover:bg-sea-300'
                }`}
                aria-label={`Перейти к фото ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); prev() }}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); next() }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-4xl h-[80vh]"
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

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex max-w-full overflow-x-auto gap-2 p-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i) }}
                className={`w-12 h-8 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === lightboxIdx ? 'border-white scale-110' : 'border-white/30'
                }`}
              >
                <AppImage src={img} alt="" variant="thumb" width={48} height={32} className="object-cover w-full h-full" />
              </button>
            ))}
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}

