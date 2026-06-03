import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
