import type { Prisma } from '@prisma/client'
import { AdminBlogClient } from '@/components/admin/AdminBlogClient'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Р‘Р»РѕРі / РћР±СЃС‚Р°РЅРѕРІРєР°' }
export const revalidate = 0

interface MediaItem {
  type: 'image' | 'video' | 'gallery'
  url?: string
  caption?: string
  items?: string[]
}

function normalizeMediaItems(value: Prisma.JsonValue): MediaItem[] {
  return Array.isArray(value) ? (value as unknown as MediaItem[]) : []
}

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  const normalizedPosts = posts.map((post) => ({
    ...post,
    mediaItems: normalizeMediaItems(post.mediaItems),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Р‘Р»РѕРі / РћР±СЃС‚Р°РЅРѕРІРєР°</h1>
        <p className="text-gray-500 text-sm mt-1">РџСѓР±Р»РёРєСѓР№С‚Рµ С„РѕС‚Рѕ, РІРёРґРµРѕ Рё С‚РµРєСЃС‚ Рѕ С‚РµРєСѓС‰РµР№ РѕР±СЃС‚Р°РЅРѕРІРєРµ</p>
      </div>
      <AdminBlogClient posts={normalizedPosts} />
    </div>
  )
}
