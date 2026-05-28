import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { User, Calendar, LogOut, Settings, Waves, ArrowLeft } from 'lucide-react'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const navLinks = [
  { href: '/account', label: 'Профиль', icon: User, exact: true },
  { href: '/account/bookings', label: 'Мои брони', icon: Calendar },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/account')

  const settings = await getSettings(['site_name'])

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Top bar */}
      <div className="bg-deep-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> На сайт
            </Link>
            <span className="text-white/30">|</span>
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sea-500 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">{session.user.name || session.user.email}</span>
            </span>
          </div>
          {session.user.role === 'ADMIN' && (
            <Link href="/admin" className="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Панель управления
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-sea-50 hover:text-sea-700 transition-colors border-b border-gray-50 last:border-0"
                >
                  <link.icon className="w-4 h-4 text-gray-400" />
                  {link.label}
                </Link>
              ))}
              <form action="/api/auth/signout" method="POST">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </form>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
