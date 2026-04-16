import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { AdminBlogClient } from '@/components/admin/AdminBlogClient'

export const metadata = { title: 'Блог / Обстановка' }
export const revalidate = 0

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
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
