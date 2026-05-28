import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { AdminTerritoryClient } from '@/components/admin/AdminTerritoryClient'

export const metadata = { title: 'Территория — Панель управления' }
export const revalidate = 0

function normalizeMediaItems(value: Prisma.JsonValue) {
  return Array.isArray(value) ? (value as unknown as { type: 'image' | 'video'; url?: string; caption?: string; items?: string[] }[]) : []
}

export default async function AdminTerritoryPage() {
  const entries = await prisma.territoryEntry.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Территория</h1>
        <p className="text-gray-500 text-sm mt-1">Здесь можно загрузить фото, видео и описание территории гостевого дома.</p>
      </div>
      <AdminTerritoryClient
        initialEntries={entries.map((entry) => ({
          ...entry,
          mediaItems: normalizeMediaItems(entry.mediaItems),
        }))}
      />
    </div>
  )
}
