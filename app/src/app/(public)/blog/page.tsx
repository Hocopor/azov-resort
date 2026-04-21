import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { Waves, Calendar } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'

export const metadata: Metadata = { title: 'Обстановка на Азовском море сегодня — погода, море, новости отдыха' }
export const revalidate = 60

interface MediaItem {
  type: 'image' | 'video' | 'gallery'
  url?: string
  caption?: string
  items?: string[]
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-sea-800 to-deep-900 text-white pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full text-sm mb-5">
            <Waves className="w-4 h-4" /> Обстановка на море онлайн
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Азовское море сегодня</h1>
          <p className="text-white/80 text-lg">
            Актуальная информация о погоде, море и жизни в Кучугурах
          </p>
        </div>
      </section>

      <section className="bg-sand-50 py-12">
        <div className="max-w-2xl mx-auto px-4 space-y-8">
          {posts.length === 0 && (
            <div className="text-center py-20">
              <Waves className="w-16 h-16 text-sea-200 mx-auto mb-4" />
              <p className="text-gray-500">Свежих публикаций пока нет. Скоро здесь появятся новости, фото и актуальная обстановка у моря.</p>
            </div>
          )}

          {posts.map((post) => {
            const mediaItems = (post.mediaItems as unknown as MediaItem[]) || []

            return (
              <article key={post.id} className="card overflow-hidden">
                {mediaItems.map((item, idx) => (
                  <div key={idx}>
                    {item.type === 'image' && item.url && (
                      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                        <AppImage src={item.url} alt={item.caption || ''} fill className="object-cover" />
                        {item.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <p className="text-white text-sm">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {item.type === 'video' && item.url && (
                      <div>
                        <video src={item.url} controls className="w-full max-h-[500px] object-cover" playsInline />
                        {item.caption && <p className="text-sm text-gray-500 px-5 pt-2">{item.caption}</p>}
                      </div>
                    )}

                    {item.type === 'gallery' && item.items && item.items.length > 0 && (
                      <div
                        className={`grid gap-1 ${
                          item.items.length === 1
                            ? ''
                            : item.items.length === 2
                              ? 'grid-cols-2'
                              : item.items.length === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2'
                        }`}
                      >
                        {item.items.slice(0, 4).map((src, index) => (
                          <div key={index} className="relative" style={{ aspectRatio: item.items!.length === 1 ? '16/9' : '1/1' }}>
                            <AppImage src={src} alt="" fill className="object-cover" />
                            {index === 3 && item.items!.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                                +{item.items!.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="p-5">
                  {post.title && <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>}
                  {post.content && <p className="text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>}
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.createdAt, 'd MMMM yyyy')}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
