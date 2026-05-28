import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { MediaRenderer, type MediaItem } from '@/components/ui/MediaRenderer'
import { Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Отзывы гостей — честные оценки, фото и видео',
}

export const revalidate = 60

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    include: { user: { select: { name: true } } },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="min-h-screen bg-sand-50">
      <section className="bg-gradient-to-br from-deep-900 to-sea-700 text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Отзывы гостей</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Здесь публикуются настоящие отзывы зарегистрированных гостей с оценками, фото и видео.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <ReviewForm />

          <div className="space-y-6">
            {reviews.length === 0 && (
              <div className="card p-8 text-center text-gray-500">Пока нет опубликованных отзывов. Будьте первым.</div>
            )}

            {reviews.map((review) => (
              <article key={review.id} className="card p-7 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="font-semibold text-gray-900">{review.user.name || 'Гость'}</div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{review.content}</p>

                <MediaRenderer mediaItems={(review.mediaItems as unknown as MediaItem[]) || []} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
