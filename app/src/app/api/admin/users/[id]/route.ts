import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Нельзя изменить свою роль' }, { status: 400 })
  }

  const { role } = await req.json()
  if (!['ADMIN', 'USER'].includes(role)) {
    return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: { role } })
  return NextResponse.json({ ok: true, role: user.role })
}
