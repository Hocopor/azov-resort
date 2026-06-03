'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/rooms', label: 'Номера' },
  { href: '/services', label: 'Услуги' },
  { href: '/territory', label: 'Территория' },
  { href: '/blog', label: 'Обстановка' },
  { href: '/reviews', label: 'Отзывы' },
]

export function Header({ siteName, sitePhone }: { siteName: string; sitePhone: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const isHomePage = pathname === '/'
  const isTransparent = isHomePage && !isScrolled && !isMenuOpen

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isTransparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300',
                isTransparent ? 'bg-white/20' : 'bg-sea-700'
              )}
            >
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span
              className={cn(
                'font-display font-semibold text-sm sm:text-base leading-tight transition-colors duration-300 flex flex-col',
                isTransparent ? 'text-white' : 'text-deep-700'
              )}
            >
              <span>Гостевой дом</span>
              <span className="text-xs sm:text-sm font-normal opacity-90">на Зелёной 26</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  isTransparent
                    ? 'text-white/90 hover:text-white hover:bg-white/15'
                    : 'text-gray-700 hover:text-sea-700 hover:bg-sea-50',
                  pathname.startsWith(link.href) && !isTransparent && 'text-sea-700 bg-sea-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href={`tel:${sitePhone}`}
              className={cn(
                'text-sm font-semibold transition-colors duration-200',
                isTransparent ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-sea-700'
              )}
            >
              {sitePhone}
            </a>
            <Link href="/rooms" className="btn-primary text-sm py-2.5 px-5">
              Забронировать
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className={cn(
              'md:hidden p-2 rounded-xl transition-colors',
              isTransparent ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-3 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-sea-50 text-sea-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-sea-700'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="px-3 pb-4 pt-1 border-t border-gray-100 flex gap-2">
            <Link
              href="/rooms"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-coral-500 text-white rounded-xl text-sm font-semibold hover:bg-coral-600 transition-colors"
            >
              Забронировать
            </Link>
            <a
              href={`tel:${sitePhone}`}
              className="flex items-center justify-center px-3 py-2.5 bg-sea-700 text-white rounded-xl text-sm font-semibold hover:bg-sea-800 transition-colors"
            >
              Звонок
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
