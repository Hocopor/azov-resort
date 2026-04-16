import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

type SessionToken = {
  role?: string
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = (await getToken({ req })) as SessionToken | null

  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?callbackUrl=/admin', req.url))
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (pathname.startsWith('/account') && !token) {
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
