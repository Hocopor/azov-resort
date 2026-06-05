import type { ReactNode } from 'react'
import Link from 'next/link'
import { Waves, Phone, MapPin, Instagram } from 'lucide-react'
import type { FooterSocial } from '@/lib/settings'

interface FooterProps {
  siteName: string
  sitePhone: string
  siteAddress: string
  socials?: FooterSocial[]
}

const SOCIAL_META: Record<FooterSocial['kind'], { label: string; icon: ReactNode }> = {
  vk: {
    label: 'ВКонтакте',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.33h-1.61c-.61 0-.8-.49-1.89-1.6-.95-.92-1.36-.92-1.6-.92-.32 0-.41.09-.41.54v1.46c0 .39-.12.62-1.16.62-1.71 0-3.6-1.03-4.93-2.96C5.1 10.53 4.6 8.7 4.6 8.33c0-.24.09-.46.54-.46h1.61c.4 0 .55.18.71.61.78 2.24 2.08 4.2 2.62 4.2.2 0 .29-.09.29-.59V9.53c-.07-1.07-.62-1.16-.62-1.54 0-.19.16-.38.41-.38h2.53c.34 0 .46.18.46.57v3.09c0 .34.15.46.25.46.2 0 .37-.12.74-.49 1.15-1.29 1.97-3.27 1.97-3.27.11-.24.31-.46.71-.46h1.61c.48 0 .59.25.48.57-.2.93-2.15 3.68-2.15 3.68-.17.28-.23.41 0 .71.17.23.73.71 1.1 1.14.68.77 1.2 1.41 1.34 1.86.14.45-.09.68-.54.68z" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.5l-.56-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.45 0 1.44 1.05 2.84 1.2 3.04.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.09 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01c-1.67 0-3.31-.45-4.74-1.3l-.34-.2-3.52.92.94-3.43-.22-.35a9.46 9.46 0 01-1.45-5.04c0-5.23 4.26-9.49 9.5-9.49 2.54 0 4.92.99 6.71 2.79a9.42 9.42 0 012.78 6.71c-.01 5.23-4.27 9.49-9.5 9.49zm8.08-17.57A11.4 11.4 0 0012.04.5C5.74.5.62 5.62.62 11.91c0 2.08.55 4.11 1.58 5.91L.5 23.5l5.82-1.53a11.36 11.36 0 005.71 1.46h.01c6.29 0 11.41-5.12 11.41-11.41 0-3.05-1.19-5.91-3.34-8.06z" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    icon: <Instagram className="w-4 h-4" aria-hidden="true" />,
  },
}

export function Footer({ siteName, sitePhone, siteAddress, socials = [] }: FooterProps) {
  return (
    <footer className="bg-deep-900 text-white">
      <div className="bg-sand-50 h-12 sm:h-16 relative overflow-hidden">
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z" fill="#0a2d40" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-sea-600 rounded-xl flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-semibold">Гостевой дом на Зелёной 26</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              Уют и спокойствие у Азовского моря, вдали от городской суеты.
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3">
                {socials.map((social) => {
                  const meta = SOCIAL_META[social.kind]
                  return (
                    <a
                      key={social.kind}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                      aria-label={meta.label}
                    >
                      {meta.icon}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Навигация</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Главная' },
                { href: '/rooms', label: 'Номера' },
                { href: '/services', label: 'Услуги' },
                { href: '/territory', label: 'Территория' },
                { href: '/blog', label: 'Обстановка' },
                { href: '/reviews', label: 'Отзывы' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {new Date().getFullYear()} Гостевой дом на Зелёной 26. Самозанятая Макашенец О.В.
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
            <Link href="/legal/consent" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Согласие на обработку ПДн
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
