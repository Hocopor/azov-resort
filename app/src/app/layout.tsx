import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { getSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(['site_name', 'site_address', 'hero_subtitle', 'og_image'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const siteAddress = settings.site_address || 'Азовское море'
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
      icon: '/icons/favicon.ico',
      apple: '/icons/apple-touch-icon.png',
    },
    manifest: '/icons/site.webmanifest',
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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Nunito:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
