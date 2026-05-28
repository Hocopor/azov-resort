import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { MediaRenderer, type MediaItem } from '@/components/ui/MediaRenderer'
import { Map } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Территория гостевого дома — фото, видео и описание',
}

export const revalidate = 60

export default async function TerritoryPage() {
  const entries = await prisma.territoryEntry.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="min-h-screen bg-sand-50">
      <section className="bg-gradient-to-br from-deep-900 to-sea-700 text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full text-sm mb-5">
            <Map className="w-4 h-4" /> Территория гостевого дома
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Территория</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Фото, видео и описание двора, зон отдыха и общей атмосферы гостевого дома.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          {entries.length === 0 && (
            <div className="card p-10 text-center text-gray-500">
              Раздел скоро наполнится фотографиями, видео и описанием территории.
            </div>
          )}

          {entries.map((entry) => (
            <article key={entry.id} className="card p-7 space-y-5">
              {entry.title && <h2 className="font-display text-3xl font-semibold text-gray-900">{entry.title}</h2>}
              {entry.content && <p className="text-gray-700 whitespace-pre-line leading-relaxed">{entry.content}</p>}
              <MediaRenderer mediaItems={(entry.mediaItems as unknown as MediaItem[]) || []} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
