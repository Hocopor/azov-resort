import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { getSettings } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email уже подтвержден' }, { status: 400 })
    }

    // Cooldown check for verification
    const existingTokens = await prisma.verificationToken.findMany({
      where: { identifier: email },
      orderBy: { expires: 'desc' },
    })

    if (existingTokens.length > 0) {
      const lastToken = existingTokens[0]
      const lastCreated = new Date(lastToken.expires.getTime() - 24 * 60 * 60 * 1000)
      const diffMs = Date.now() - lastCreated.getTime()
      const minIntervalMs = 3 * 60 * 1000 // 3 minutes

      if (diffMs < minIntervalMs) {
        const secondsLeft = Math.ceil((minIntervalMs - diffMs) / 1000)
        return NextResponse.json({ error: `Пожалуйста, подождите ${secondsLeft} сек. перед повторной отправкой.` }, { status: 429 })
      }
    }

    // Create verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    // Delete existing tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // Send verification email
    const settings = await getSettings(['site_name'])
    const siteName = settings.site_name || 'Отдых на Азове'
    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Подтверждение email — ${siteName}`,
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
          <h2 style="color:#1a6b8a;">Привет, ${user.name || 'гость'}!</h2>
          <p>Подтвердите ваш адрес электронной почты для доступа ко всем возможностям:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1a6b8a;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Подтвердить email
          </a>
          <p style="color:#888;font-size:12px;">Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend verification error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
