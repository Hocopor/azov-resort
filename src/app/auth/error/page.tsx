'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked:
    'Этот email уже используется с другим способом входа. Попробуйте войти через email или другой сервис.',
  OAuthSignin: 'Ошибка авторизации через OAuth. Попробуйте ещё раз.',
  OAuthCallback: 'Ошибка при обработке ответа OAuth. Попробуйте ещё раз.',
  OAuthCreateAccount: 'Не удалось создать аккаунт. Возможно, email уже зарегистрирован.',
  EmailCreateAccount: 'Не удалось создать аккаунт с этим email.',
  Callback: 'Ошибка при авторизации. Попробуйте ещё раз.',
  Default: 'Произошла ошибка при входе. Попробуйте ещё раз.',
  CredentialsSignin: 'Неверный email или пароль.',
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') || 'Default'
  const message = errorMessages[errorCode] || errorMessages.Default

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Ошибка входа</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex flex-col gap-3">
        <Link href="/auth/login" className="btn-primary justify-center">
          Попробовать снова
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
          На главную
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Загрузка...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
