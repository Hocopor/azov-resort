import type { ComponentProps } from 'react'
import { prisma } from '@/lib/db'
import { AdminBlogClient } from '@/components/admin/AdminBlogClient'

export const metadata = { title: 'Блог / Обстановка' }
export const revalidate = 0

type AdminBlogPosts = ComponentProps<typeof AdminBlogClient>['posts']

export default async function AdminBlogPage() {
  const rawPosts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })

  const posts: AdminBlogPosts = rawPosts.map((post) => ({
    ...post,
    mediaItems: Array.isArray(post.mediaItems) ? post.mediaItems : [],
  })) as AdminBlogPosts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Блог / Обстановка</h1>
        <p className="text-gray-500 text-sm mt-1">Публикуйте фото, видео и текст о текущей обстановке</p>
      </div>
      <AdminBlogClient posts={posts} />
    </div>
  )
}
