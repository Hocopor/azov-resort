import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  LayoutDashboard, Calendar, BedDouble, FileText,
  Settings, Users, Map, Star,
} from 'lucide-react'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export const dynamic = 'force-dynamic'

const navLinks = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', label: 'Бронирования', icon: Calendar },
  { href: '/admin/rooms', label: 'Номера', icon: BedDouble },
  { href: '/admin/territory', label: 'Территория', icon: Map },
  { href: '/admin/blog', label: 'Обстановка / Блог', icon: FileText },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <AdminLayoutClient navLinks={navLinks}>
      {children}
    </AdminLayoutClient>
  )
}
