'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { AlertTriangle, Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

export function VerificationPopup() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()
  
  useEffect(() => {
    if (!session || !session.user) return
    const { emailVerified, createdAt } = session.user
    if (emailVerified) {
      setShow(false)
      return
    }

    if (createdAt) {
      const createdDate = new Date(createdAt).getTime()
      const daysPassed = (Date.now() - createdDate) / (1000 * 60 * 60 * 24)
      if (daysPassed > 3) {
        setShow(true)
      }
    }
  }, [session])

  const resend = async () => {
    // Basic spam protection via local state/localStorage
    const lastSentStr = localStorage.getItem('last_verification_sent')
    if (lastSentStr) {
      const lastSent = Number(lastSentStr)
      const diffMins = (Date.now() - lastSent) / (1000 * 60)
      if (diffMins < 3) {
        showError(`Подождите еще ${Math.ceil(3 - diffMins)} мин. перед повторной отправкой.`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Ошибка при отправке')
      
      localStorage.setItem('last_verification_sent', String(Date.now()))
      success('Письмо отправлено! Проверьте вашу почту.')
    } catch (e: any) {
      showError(e.message || 'Ошибка отправки письма.')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Аккаунт не верифицирован</h2>
        <p className="mb-6 text-sm text-gray-600 leading-relaxed">
          Прошло более 3 дней с момента регистрации. Для продолжения использования сайта необходимо подтвердить ваш адрес электронной почты.
        </p>
        <button
          onClick={resend}
          disabled={loading}
          className="btn-primary w-full justify-center py-4 bg-sea-600 hover:bg-sea-700 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Отправляем...</>
          ) : (
            <><Mail className="h-5 w-5" /> Отправить письмо для верификации</>
          )}
        </button>
      </div>
    </div>
  )
}
