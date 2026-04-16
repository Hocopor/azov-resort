'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: 'Р­С‚РѕС‚ email СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ СЃ РґСЂСѓРіРёРј СЃРїРѕСЃРѕР±РѕРј РІС…РѕРґР°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РІРѕР№С‚Рё С‡РµСЂРµР· email РёР»Рё РґСЂСѓРіРѕР№ СЃРµСЂРІРёСЃ.',
  OAuthSignin: 'РћС€РёР±РєР° Р°РІС‚РѕСЂРёР·Р°С†РёРё С‡РµСЂРµР· OAuth. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
  OAuthCallback: 'РћС€РёР±РєР° РїСЂРё РѕР±СЂР°Р±РѕС‚РєРµ РѕС‚РІРµС‚Р° OAuth. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
  OAuthCreateAccount: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚. Р’РѕР·РјРѕР¶РЅРѕ, email СѓР¶Рµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ.',
  EmailCreateAccount: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚ СЃ СЌС‚РёРј email.',
  Callback: 'РћС€РёР±РєР° РїСЂРё Р°РІС‚РѕСЂРёР·Р°С†РёРё. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
  Default: 'РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё РІС…РѕРґРµ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
  CredentialsSignin: 'РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ.',
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
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">РћС€РёР±РєР° РІС…РѕРґР°</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex flex-col gap-3">
        <Link href="/auth/login" className="btn-primary justify-center">РџРѕРїСЂРѕР±РѕРІР°С‚СЊ СЃРЅРѕРІР°</Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">РќР° РіР»Р°РІРЅСѓСЋ</Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
