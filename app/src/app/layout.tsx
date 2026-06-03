import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Nunito } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { getSettings, normalizeSiteAddress } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const displayFont = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

const bodyFont = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(['site_name', 'site_address', 'hero_subtitle', 'og_image'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const siteAddress = normalizeSiteAddress(settings.site_address)
  const ogImage = settings.og_image || '/images/general/og-image.jpg'
  const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  return {
    metadataBase,
    title: {
      default: `${siteName} - Гостевой дом у Азовского моря`,
      template: `%s | ${siteName}`,
    },
    description:
      settings.hero_subtitle ||
      'Уютные номера у Азовского моря. Бронируйте онлайн - лучшие цены, трансфер, сапборды, велосипеды.',
    keywords: [
      'отдых азовское море',
      'гостевой дом азов',
      'снять номер азовское море',
      'отдых у моря',
      siteAddress,
    ],
    openGraph: {
      type: 'website',
      siteName,
      locale: 'ru_RU',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: '/images/icons/favicon.ico',
      apple: '/images/icons/apple-touch-icon.png',
    },
    manifest: '/images/icons/site.webmanifest',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a6b8a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/icons/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/icons/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/images/icons/site.webmanifest" />
      </head>
      <body>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
