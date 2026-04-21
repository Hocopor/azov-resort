import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const includeDrafts = searchParams.get('drafts') === '1'

  const where = includeDrafts ? undefined : { published: true }
  const entries = await prisma.territoryEntry.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const entry = await prisma.territoryEntry.create({
    data: {
      title: body.title || null,
      content: body.content || null,
      mediaItems: body.mediaItems || [],
      published: body.published ?? true,
      sortOrder: Number(body.sortOrder) || 0,
    },
  })

  return NextResponse.json(entry)
}
