import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { timingSafeEqual, createHmac } from 'crypto'
import { createAdminToken, ADMIN_COOKIE, COOKIE_MAX_AGE } from '@/lib/admin-auth'

export const runtime = 'nodejs'

function safeStringEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'cmp').update(a).digest()
  const hb = createHmac('sha256', 'cmp').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const login = String(body.login ?? '')
    const password = String(body.password ?? '')

    const expectedLogin = process.env.ADMIN_LOGIN
    const passwordHash = process.env.ADMIN_PASSWORD_HASH

    if (!expectedLogin || !passwordHash) {
      return NextResponse.json({ error: 'Администратор не настроен' }, { status: 500 })
    }

    const [loginOk, passwordOk] = await Promise.all([
      Promise.resolve(safeStringEqual(login, expectedLogin)),
      bcrypt.compare(password, passwordHash),
    ])

    if (!loginOk || !passwordOk) {
      await new Promise((r) => setTimeout(r, 1000))
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
    }

    const token = await createAdminToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
