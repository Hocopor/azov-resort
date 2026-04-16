import type { ComponentProps } from 'react'
import { prisma } from '@/lib/db'
import { AdminBlogClient } from '@/components/admin/AdminBlogClient'

export const metadata = { title: 'Блог / Обстановка' }
export const revalidate = 0

type AdminBlogPosts = ComponentProps<typeof AdminBlogClient>['posts']
type AdminBlogPost = AdminBlogPosts[number]
type MediaItem = AdminBlogPost['mediaItems'][number]

function isMediaItem(value: unknown): value is MediaItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string'
  )
}

export default async function AdminBlogPage() {
  const rawPosts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const posts: AdminBlogPosts = rawPosts.map((post) => ({
    ...post,
    mediaItems: Array.isArray(post.mediaItems)
      ? post.mediaItems.filter(isMediaItem)
      : [],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Блог / Обстановка
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Публикуйте фото, видео и текст о текущей обстановке
        </p>
      </div>

      <AdminBlogClient posts={posts} />
    </div>
  )
}