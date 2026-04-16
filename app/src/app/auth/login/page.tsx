'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'
  const { error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        showError('Email не подтверждён. Проверьте почту.')
      } else {
        showError('Неверный email или пароль')
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  const handleOAuth = async (provider: 'vk' | 'yandex') => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl })
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Войти</h1>
      <p className="text-gray-500 text-sm mb-8">
        Нет аккаунта?{' '}
        <Link href="/auth/register" className="text-sea-700 font-semibold hover:underline">
          Зарегистрироваться
        </Link>
      </p>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => handleOAuth('vk')}
          disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-60"
        >
          {oauthLoading === 'vk' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.33h-1.61c-.61 0-.8-.49-1.89-1.6-.95-.92-1.36-.92-1.6-.92-.32 0-.41.09-.41.54v1.46c0 .39-.12.62-1.16.62-1.71 0-3.6-1.03-4.93-2.96C5.1 10.53 4.6 8.7 4.6 8.33c0-.24.09-.46.54-.46h1.61c.4 0 .55.18.71.61.78 2.24 2.08 4.2 2.62 4.2.2 0 .29-.09.29-.59V9.53c-.07-1.07-.62-1.16-.62-1.54 0-.19.16-.38.41-.38h2.53c.34 0 .46.18.46.57v3.09c0 .34.15.46.25.46.2 0 .37-.12.74-.49 1.15-1.29 1.97-3.27 1.97-3.27.11-.24.31-.46.71-.46h1.61c.48 0 .59.25.48.57-.2.93-2.15 3.68-2.15 3.68-.17.28-.23.41 0 .71.17.23.73.71 1.1 1.14.68.77 1.2 1.41 1.34 1.86.14.45-.09.68-.54.68z"/>
            </svg>
          )}
          ВКонтакте
        </button>
        <button
          onClick={() => handleOAuth('yandex')}
          disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#FC3F1D] hover:bg-[#E53000] text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-60"
        >
          {oauthLoading === 'yandex' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.5 2C7.25 2 3 6.25 3 11.5S7.25 21 12.5 21 22 16.75 22 11.5 17.75 2 12.5 2zm1.25 14.5h-1.5v-6H11v-1.5h1.25V8.3c0-1.5.85-2.3 2.2-2.3.63 0 1.3.1 1.3.1v1.45h-.73c-.72 0-.97.45-.97.9v1.05h1.65l-.26 1.5h-1.39v6z"/>
            </svg>
          )}
          Яндекс
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">или через email</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="input-field pl-10"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              className="input-field pl-10 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти'}
        </button>
      </form>
    </>
  )
}
