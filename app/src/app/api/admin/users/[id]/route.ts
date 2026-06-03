import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { role } = await req.json()
  if (!['ADMIN', 'USER'].includes(role)) {
    return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: { role } })
  return NextResponse.json({ ok: true, role: user.role })
}
