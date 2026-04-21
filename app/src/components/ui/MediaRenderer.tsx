'use client'

import { AppImage } from '@/components/ui/AppImage'

export interface MediaItem {
  type: 'image' | 'video' | 'gallery'
  url?: string
  caption?: string
  items?: string[]
}

export function MediaRenderer({ mediaItems }: { mediaItems: MediaItem[] }) {
  if (mediaItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {mediaItems.map((item, idx) => (
        <div key={idx}>
          {item.type === 'image' && item.url && (
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <AppImage src={item.url} alt={item.caption || ''} fill className="object-cover" />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-sm text-white">{item.caption}</p>
                </div>
              )}
            </div>
          )}

          {item.type === 'video' && item.url && (
            <div className="overflow-hidden rounded-2xl bg-black">
              <video src={item.url} controls className="w-full max-h-[520px] object-contain" playsInline />
              {item.caption && <p className="px-4 py-3 text-sm text-gray-500">{item.caption}</p>}
            </div>
          )}

          {item.type === 'gallery' && item.items && item.items.length > 0 && (
            <div className={`grid gap-2 ${item.items.length === 1 ? 'grid-cols-1' : item.items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
              {item.items.map((src, index) => (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: '1/1' }}>
                  <AppImage src={src} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
