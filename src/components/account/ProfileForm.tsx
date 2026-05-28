'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Phone, Lock, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { signOut } from 'next-auth/react'

const profileSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Пароли не совпадают', path: ['confirmPassword'],
})

interface Props {
  user: { id: string; name: string | null; email: string; phone: string | null }
  hasPassword: boolean
}

export function ProfileForm({ user, hasPassword }: Props) {
  const router = useRouter()
  const { update } = useSession()
  const { success, error: showError } = useToast()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name || '', phone: user.phone || '' },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onProfileSubmit = async (data: any) => {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await update({ name: data.name })
      success('Профиль обновлён')
      router.refresh()
    } catch (e: any) {
      showError(e.message || 'Ошибка сохранения')
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data: any) => {
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.newPassword, currentPassword: data.currentPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      success('Пароль изменён')
      passwordForm.reset()
    } catch (e: any) {
      showError(e.message || 'Ошибка смены пароля')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/account/profile', { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      await signOut({ callbackUrl: '/' })
    } catch (e: any) {
      showError(e.message || 'Ошибка удаления аккаунта')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-sea-600" /> Личные данные
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Имя</label>
            <input {...profileForm.register('name')} className="input-field" />
            {profileForm.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message as string}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email (нельзя изменить)</label>
            <input value={user.email} disabled className="input-field opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              <Phone className="w-3 h-3 inline mr-1" />Телефон
            </label>
            <input {...profileForm.register('phone')} placeholder="+7 (XXX) XXX-XX-XX" className="input-field" />
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary disabled:opacity-60">
            {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Password */}
      {hasPassword && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-sea-600" /> Изменить пароль
          </h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
              const labels = { currentPassword: 'Текущий пароль', newPassword: 'Новый пароль', confirmPassword: 'Подтвердите новый пароль' }
              return (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block">{labels[field]}</label>
                  <input {...passwordForm.register(field)} type="password" className="input-field" />
                  {passwordForm.formState.errors[field] && (
                    <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors[field]?.message as string}</p>
                  )}
                </div>
              )
            })}
            <button type="submit" disabled={passwordLoading} className="btn-secondary disabled:opacity-60">
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Изменить пароль'}
            </button>
          </form>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
        <h2 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5" /> Удалить аккаунт
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Аккаунт будет деактивирован. Ваши данные и история броней сохранятся в системе.
        </p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
            Удалить аккаунт
          </button>
        ) : (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">Вы уверены? Это действие нельзя отменить.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Да, удалить'}
              </button>
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
