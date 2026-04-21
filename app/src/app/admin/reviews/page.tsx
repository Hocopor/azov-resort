import { prisma } from '@/lib/db'
import { AdminReviewsClient } from '@/components/admin/AdminReviewsClient'
import type { Prisma } from '@prisma/client'

export const metadata = { title: 'Отзывы — Панель управления' }
export const revalidate = 0

function normalizeMediaItems(value: Prisma.JsonValue) {
  return Array.isArray(value) ? (value as unknown as { type: 'image' | 'video'; url?: string; caption?: string; items?: string[] }[]) : []
}

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Отзывы</h1>
        <p className="text-gray-500 text-sm mt-1">Управляйте отзывами гостей и удаляйте неподходящие публикации.</p>
      </div>
      <AdminReviewsClient
        initialReviews={reviews.map((review) => ({
          ...review,
          mediaItems: normalizeMediaItems(review.mediaItems),
        }))}
      />
    </div>
  )
}
