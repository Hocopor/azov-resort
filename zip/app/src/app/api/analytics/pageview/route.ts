import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') || 'unknown'

    await prisma.pageView.create({
      data: {
        path: body.path || '/',
        referrer: body.referrer || null,
        userAgent: req.headers.get('user-agent') || null,
        ip: ip.slice(0, 45),
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
