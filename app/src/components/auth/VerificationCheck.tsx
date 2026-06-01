'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/providers/ToastProvider'
import { Loader2, ShieldAlert } from 'lucide-react'

export function VerificationCheck() {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    const { emailVerified, createdAt } = session.user
    if (emailVerified) {
      setShowModal(false)
      return
    }

    const regDate = createdAt ? new Date(createdAt) : new Date()
    const threeDays = 3 * 24 * 60 * 60 * 1000 // 3 days in ms
    const diff = Date.now() - regDate.getTime()

    if (diff > threeDays) {
      setShowModal(true)
    }
  }, [session])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  if (!showModal || !session?.user?.email) return null

  const handleResend = async () => {
    if (cooldown > 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при отправке письма')
      }

      success('Ссылка для подтверждения отправлена на почту!')
      setCooldown(180) // 3 minutes cooldown
    } catch (err: any) {
      showError(err.message || 'Не удалось отправить письмо')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Подтвердите ваш аккаунт</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Прошло более 3 дней с момента регистрации. Для продолжения пользования всеми возможностями сайта, пожалуйста, подтвердите ваш адрес электронной почты <strong>{session.user.email}</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={handleResend}
            className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : cooldown > 0 ? (
              `Отправить снова (${cooldown} сек)`
            ) : (
              'Отправить письмо для верификации'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
