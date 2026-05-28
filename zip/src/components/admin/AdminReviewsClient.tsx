'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star, Trash2 } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { MediaRenderer, type MediaItem } from '@/components/ui/MediaRenderer'

interface ReviewItem {
  id: string
  rating: number
  content: string
  published: boolean
  createdAt: Date
  mediaItems: MediaItem[]
  user: {
    name: string | null
    email: string
  }
}

export function AdminReviewsClient({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const router = useRouter()
  const { success, error } = useToast()
  const [reviews, setReviews] = useState(initialReviews)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteReview = async (id: string) => {
    if (!window.confirm('Удалить этот отзыв?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setReviews((current) => current.filter((review) => review.id !== id))
      success('Отзыв удалён')
      router.refresh()
    } catch {
      error('Не удалось удалить отзыв')
    } finally {
      setDeletingId(null)
    }
  }

  if (reviews.length === 0) {
    return <div className="admin-card text-center py-10 text-gray-400">Отзывов пока нет</div>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="admin-card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-4 h-4 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <div className="font-semibold text-gray-900">{review.user.name || 'Гость'}</div>
              <div className="text-sm text-gray-500">{review.user.email}</div>
            </div>
            <button
              onClick={() => deleteReview(review.id)}
              disabled={deletingId === review.id}
              className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
            >
              {deletingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Удалить
            </button>
          </div>

          <p className="text-gray-700 whitespace-pre-line">{review.content}</p>

          {review.mediaItems.length > 0 && <MediaRenderer mediaItems={review.mediaItems} />}
        </div>
      ))}
    </div>
  )
}
