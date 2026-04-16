'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, Shield, User, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

interface UserItem {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date
  _count: { bookings: number }
  accounts: { provider: string }[]
}

interface Props {
  users: UserItem[]
  total: number
  page: number
  perPage: number
}

export function AdminUsersClient({ users, total, page, perPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`/admin/users?${params.toString()}`))
  }

  const toggleRole = async (user: UserItem) => {
    setTogglingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }),
      })
      if (!res.ok) throw new Error()
      success(user.role === 'ADMIN' ? 'Права администратора сняты' : 'Назначен администратором')
      router.refresh()
    } catch {
      showError('Ошибка изменения роли')
    } finally {
      setTogglingId(null)
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const providerLabel = (p: string) => ({ credentials: '📧', vk: '🔵 VK', yandex: '🔴 Яндекс' }[p] || p)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="admin-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Поиск по имени, email, телефону..."
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Пользователь', 'Email', 'Телефон', 'Вход через', 'Брони', 'Регистрация', 'Роль', ''].map((h) => (
                <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-sea-100 text-sea-700'}`}>
                      {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{u.name || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{u.email}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5">
                    {u.emailVerified
                      ? <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-green-600">Подтверждён</span></>
                      : <><XCircle className="w-3 h-3 text-red-400" /><span className="text-red-500">Не подтверждён</span></>
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {u.accounts.length > 0
                    ? u.accounts.map((a) => providerLabel(a.provider)).join(', ')
                    : providerLabel('credentials')}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">{u._count.bookings}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(u.createdAt, 'd MMM yyyy')}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'ADMIN' ? <><Shield className="w-3 h-3" /> Admin</> : <><User className="w-3 h-3" /> User</>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={togglingId === u.id}
                    className="text-xs text-sea-700 hover:underline font-medium disabled:opacity-50"
                  >
                    {u.role === 'ADMIN' ? 'Снять admin' : 'Сделать admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="text-center py-10 text-gray-400">Пользователи не найдены</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} из {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages} className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
