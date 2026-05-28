'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

const schema = z.object({
  name: z.string().min(2, 'Введите имя (минимум 2 символа)'),
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
    .regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v, 'Необходимо принять условия'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setDone(true)
    } catch (e: any) {
      showError(e.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Проверьте почту</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Мы отправили письмо со ссылкой для подтверждения аккаунта. Перейдите по ссылке, чтобы завершить регистрацию.
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Регистрация</h1>
      <p className="text-gray-500 text-sm mb-8">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="text-sea-700 font-semibold hover:underline">Войти</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('name')} placeholder="Имя" className="input-field pl-10" />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('email')} type="email" placeholder="Email" className="input-field pl-10" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Пароль"
              className="input-field pl-10 pr-10"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Повторите пароль"
              className="input-field pl-10 pr-10"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('agreeTerms')} className="mt-0.5 w-4 h-4 accent-sea-700" />
            <span className="text-xs text-gray-500 leading-relaxed">
              Я соглашаюсь с{' '}
              <Link href="/legal/terms" target="_blank" className="text-sea-700 underline">пользовательским соглашением</Link>
              {' '}и{' '}
              <Link href="/legal/privacy" target="_blank" className="text-sea-700 underline">политикой конфиденциальности</Link>
            </span>
          </label>
          {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Создать аккаунт'}
        </button>
      </form>
    </>
  )
}
