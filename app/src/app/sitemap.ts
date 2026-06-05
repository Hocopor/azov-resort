import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { getSiteUrl } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/rooms`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/territory`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/services`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/reviews`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  let roomRoutes: MetadataRoute.Sitemap = []
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    roomRoutes = rooms.map((room) => ({
      url: `${base}/rooms/${room.slug}`,
      lastModified: room.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    roomRoutes = []
  }

  return [...staticRoutes, ...roomRoutes]
}
