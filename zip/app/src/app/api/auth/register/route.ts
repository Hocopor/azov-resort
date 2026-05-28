import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { getSettings } from '@/lib/settings'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Аккаунт с таким email уже существует' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    // Create verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

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
          <h2 style="color:#1a6b8a;">Привет, ${name}!</h2>
          <p>Для завершения регистрации подтвердите ваш email:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1a6b8a;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Подтвердить email
          </a>
          <p style="color:#888;font-size:12px;">Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
        </div>
      `,
    }).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
