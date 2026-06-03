import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const entry = await prisma.territoryEntry.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      content: body.content ?? undefined,
      mediaItems: body.mediaItems ?? undefined,
      published: body.published ?? undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : undefined,
    },
  })

  return NextResponse.json(entry)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.territoryEntry.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
