'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

const METRIKA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '109741998')

export function Tracker() {
  const pathname = usePathname()
  const firstRun = useRef(true)

  useEffect(() => {
    if (!pathname) return

    // Хит Яндекс.Метрики при клиентской навигации (первую загрузку считает сам счётчик).
    if (firstRun.current) {
      firstRun.current = false
    } else if (typeof window !== 'undefined' && window.ym && METRIKA_ID) {
      window.ym(METRIKA_ID, 'hit', window.location.href)
    }

    // Track page views
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      }),
    }).catch(() => {})

    // Check if visiting a specific room page, e.g. "/rooms/[slug]"
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 2 && parts[0] === 'rooms') {
      const slug = parts[1]
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'room_view', slug }),
      }).catch(() => {})
    }
  }, [pathname])

  return null
}
