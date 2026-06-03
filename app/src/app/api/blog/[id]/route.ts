import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      title: body.title,
      content: body.content,
      mediaItems: body.mediaItems,
      published: body.published,
    },
  })

  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.blogPost.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
