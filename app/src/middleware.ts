import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?callbackUrl=/admin', req.url))
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Account routes protection
  if (pathname.startsWith('/account')) {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
