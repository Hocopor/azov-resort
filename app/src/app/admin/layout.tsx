import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import {

export const dynamic = 'force-dynamic'
  LayoutDashboard, Calendar, BedDouble, FileText,
  Settings, Users, BarChart3, Waves, ArrowLeft, LogOut
} from 'lucide-react'

const navLinks = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', label: 'Бронирования', icon: Calendar },
  { href: '/admin/rooms', label: 'Номера', icon: BedDouble },
  { href: '/admin/blog', label: 'Обстановка / Блог', icon: FileText },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-deep-800 text-white flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-40 overflow-y-auto">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sea-500 rounded-xl flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-sm">Панель управления</div>
              <div className="text-white/50 text-xs">Администратор</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="admin-sidebar-link text-white/70 hover:text-white hover:bg-white/10"
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-0.5">
          <Link href="/" className="admin-sidebar-link text-white/60 hover:text-white hover:bg-white/10 text-sm">
            <ArrowLeft className="w-4 h-4" /> На сайт
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button className="admin-sidebar-link w-full text-white/60 hover:text-red-400 hover:bg-red-500/10 text-sm">
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-60">
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
