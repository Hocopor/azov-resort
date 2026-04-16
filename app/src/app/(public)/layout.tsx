import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getSettings } from '@/lib/settings'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings(['site_name', 'site_phone', 'site_address'])
  return (
    <>
      <Header
        siteName={settings.site_name || 'Отдых на Азове'}
        sitePhone={settings.site_phone || '+7 (XXX) XXX-XX-XX'}
      />
      <main>{children}</main>
      <Footer
        siteName={settings.site_name || 'Отдых на Азове'}
        sitePhone={settings.site_phone || '+7 (XXX) XXX-XX-XX'}
        siteAddress={settings.site_address || 'Азовское море, Краснодарский край'}
      />
    </>
  )
}
