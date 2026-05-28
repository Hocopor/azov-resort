import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export const metadata = { title: 'Пользователи' }
export const revalidate = 0

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const perPage = 25
  const where: any = { deletedAt: null }
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: 'insensitive' } },
      { email: { contains: searchParams.q, mode: 'insensitive' } },
      { phone: { contains: searchParams.q } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, emailVerified: true, createdAt: true,
        _count: { select: { bookings: true } },
        accounts: { select: { provider: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Пользователи</h1>
        <p className="text-gray-500 text-sm mt-1">Всего: {total}</p>
      </div>
      <AdminUsersClient users={users} total={total} page={page} perPage={perPage} />
    </div>
  )
}
