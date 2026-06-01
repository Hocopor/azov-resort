'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Tracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

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
