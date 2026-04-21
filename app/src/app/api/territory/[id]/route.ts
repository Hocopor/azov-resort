import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.territoryEntry.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
