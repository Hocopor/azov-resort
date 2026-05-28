import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Change password
  if (body.password) {
    const schema = z.object({ currentPassword: z.string(), password: z.string().min(8) })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.passwordHash) return NextResponse.json({ error: 'Нет пароля' }, { status: 400 })

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
    })
    return NextResponse.json({ ok: true })
  }

  // Update profile
  const schema = z.object({ name: z.string().min(2).optional(), phone: z.string().optional() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })
  return NextResponse.json({ ok: true, name: updated.name })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Soft delete
  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
