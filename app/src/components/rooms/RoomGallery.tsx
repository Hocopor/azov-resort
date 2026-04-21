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

  const prev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
  const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null))

  if (images.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center bg-gradient-to-br from-sea-100 to-sea-200">
        <Waves className="w-24 h-24 text-sea-300" />
      </div>
    )
  }

  return (
    <>
      {/* Gallery grid */}
      <div className={`grid gap-2 rounded-3xl overflow-hidden ${
        images.length === 1 ? 'grid-cols-1' :
        images.length === 2 ? 'grid-cols-2' :
        images.length === 3 ? 'grid-cols-3' :
        'grid-cols-4'
      }`}>
        {/* Main image */}
        <div
          className={`relative cursor-pointer group ${
            images.length >= 3 ? 'col-span-2' : ''
          } h-72 md:h-96`}
          onClick={() => setLightboxIdx(0)}
        >
          <AppImage src={images[0]} alt={name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>

        {/* Thumbnails */}
        {images.slice(1, images.length >= 3 ? 4 : undefined).map((img, i) => (
          <div
            key={i}
            className="relative cursor-pointer group h-48 md:h-48"
            onClick={() => setLightboxIdx(i + 1)}
          >
            <AppImage src={img} alt={`${name} ${i + 2}`} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
            {i === 2 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <span className="text-xl font-bold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
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
              className="object-contain"
            />
          </div>

          {/* Thumbnails strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i) }}
                className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                  i === lightboxIdx ? 'border-white scale-110' : 'border-white/30'
                }`}
              >
                <AppImage src={img} alt="" width={48} height={32} className="object-cover w-full h-full" />
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
