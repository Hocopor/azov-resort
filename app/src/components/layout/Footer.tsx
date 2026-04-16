import Link from 'next/link'
import { Waves, Phone, Mail, MapPin, Instagram, MessageCircle } from 'lucide-react'

interface FooterProps {
  siteName: string
  sitePhone: string
  siteAddress: string
}

export function Footer({ siteName, sitePhone, siteAddress }: FooterProps) {
  return (
    <footer className="bg-deep-900 text-white">
      {/* Wave top */}
      <div className="bg-sand-50 h-16 relative overflow-hidden">
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z" fill="#0a2d40" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-sea-600 rounded-xl flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-semibold">{siteName}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              Уютный гостевой дом у Азовского моря. Отдыхайте с комфортом — мы позаботимся о каждой детали вашего отпуска.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                aria-label="ВКонтакте"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.33h-1.61c-.61 0-.8-.49-1.89-1.6-.95-.92-1.36-.92-1.6-.92-.32 0-.41.09-.41.54v1.46c0 .39-.12.62-1.16.62-1.71 0-3.6-1.03-4.93-2.96C5.1 10.53 4.6 8.7 4.6 8.33c0-.24.09-.46.54-.46h1.61c.4 0 .55.18.71.61.78 2.24 2.08 4.2 2.62 4.2.2 0 .29-.09.29-.59V9.53c-.07-1.07-.62-1.16-.62-1.54 0-.19.16-.38.41-.38h2.53c.34 0 .46.18.46.57v3.09c0 .34.15.46.25.46.2 0 .37-.12.74-.49 1.15-1.29 1.97-3.27 1.97-3.27.11-.24.31-.46.71-.46h1.61c.48 0 .59.25.48.57-.2.93-2.15 3.68-2.15 3.68-.17.28-.23.41 0 .71.17.23.73.71 1.1 1.14.68.77 1.2 1.41 1.34 1.86.14.45-.09.68-.54.68z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                aria-label="Telegram"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Навигация</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Главная' },
                { href: '/rooms', label: 'Номера' },
                { href: '/services', label: 'Услуги' },
                { href: '/blog', label: 'Обстановка' },
                { href: '/auth/login', label: 'Личный кабинет' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${sitePhone}`} className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-sea-400 flex-shrink-0" />
                  {sitePhone}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 text-sea-400 flex-shrink-0 mt-0.5" />
                  {siteAddress}
                </div>
              </li>
            </ul>
            <div className="mt-5 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Заезд / Выезд</p>
              <p className="text-sm font-medium">с 14:00 / до 12:00</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {siteName}. Все права защищены.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/legal/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/legal/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Пользовательское соглашение
            </Link>
            <Link href="/legal/booking-terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Условия бронирования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
