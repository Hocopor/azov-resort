import Link from 'next/link'
import { Waves } from 'lucide-react'
import { getSettings } from '@/lib/settings'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings(['site_name'])
  const siteName = settings.site_name || 'Отдых на Азове'

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-900 via-sea-800 to-deep-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-white">{siteName}</span>
          </Link>
        </div>
        <div className="glass rounded-3xl p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
