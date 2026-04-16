import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { token?: string; email?: string }
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token, email } = searchParams

  if (!token || !email) {
    return (
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Недействительная ссылка</h2>
        <p className="text-gray-500 text-sm mb-6">Ссылка для подтверждения некорректна.</p>
        <Link href="/auth/register" className="btn-secondary">Зарегистрироваться снова</Link>
      </div>
    )
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    return (
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Ссылка устарела</h2>
        <p className="text-gray-500 text-sm mb-6">Ссылка для подтверждения истекла. Зарегистрируйтесь снова.</p>
        <Link href="/auth/register" className="btn-secondary">Зарегистрироваться</Link>
      </div>
    )
  }

  // Verify user
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  })

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Email подтверждён!</h2>
      <p className="text-gray-500 text-sm mb-6">
        Ваш аккаунт активирован. Теперь вы можете войти и пользоваться всеми возможностями сайта.
      </p>
      <Link href="/auth/login" className="btn-primary">Войти в аккаунт</Link>
    </div>
  )
}
