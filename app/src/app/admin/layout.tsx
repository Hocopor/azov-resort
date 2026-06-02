import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  LayoutDashboard, Calendar, BedDouble, FileText,
  Settings, Users, Map, Star,
} from 'lucide-react'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  )
}
