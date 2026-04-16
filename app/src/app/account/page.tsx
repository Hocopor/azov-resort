import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProfileForm } from '@/components/account/ProfileForm'

export const metadata = { title: 'Мой профиль' }

export default async function AccountPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true, passwordHash: true, createdAt: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gray-900">Мой профиль</h1>
        <p className="text-gray-500 text-sm mt-1">Управляйте данными аккаунта</p>
      </div>
      <ProfileForm user={user!} hasPassword={!!user?.passwordHash} />
    </div>
  )
}
