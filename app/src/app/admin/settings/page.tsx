import { prisma } from '@/lib/db'
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm'

export const metadata = { title: 'Настройки' }

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany()
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Управление сайтом и условиями бронирования</p>
      </div>
      <AdminSettingsForm settings={settingsMap} />
    </div>
  )
}
