import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { getSettings } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, emailVerified } = session.user
    if (emailVerified) {
      return NextResponse.json({ error: 'Уже верифицирован' }, { status: 400 })
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Нет email' }, { status: 400 })
    }

    // Rate limiting: Check verification tokens created recently
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gt: new Date() } // Still valid
      },
      orderBy: { expires: 'desc' }
    })

    if (recentToken) {
       // Estimate when it was created (expires = 24h from creation)
       const createdAt = new Date(recentToken.expires.getTime() - 24 * 60 * 60 * 1000)
       const diffMins = (Date.now() - createdAt.getTime()) / (1000 * 60)
       if (diffMins < 3) {
         return NextResponse.json({ error: `Слишком часто. Повторите через ${Math.ceil(3 - diffMins)} мин.` }, { status: 429 })
       }
    }

    // Create verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    // Delete old tokens for this identifier
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
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
          <h2 style="color:#1a6b8a;">Привет, ${name || 'Гость'}!</h2>
          <p>Для завершения регистрации подтвердите ваш email:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1a6b8a;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Подтвердить email
          </a>
          <p style="color:#888;font-size:12px;">Ссылка действительна 24 часа. Если вы не запрашивали письмо — просто проигнорируйте его.</p>
        </div>
      `,
    }).catch((err: any) => {
      console.error('SMTP Error:', err)
      throw new Error('SMTP Error')
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend verification error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
