import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { prisma as db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Number(searchParams.get('page') || '1')
  const perPage = Number(searchParams.get('per_page') || '12')

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blogPost.count({ where: { published: true } }),
  ])

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / perPage) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const post = await prisma.blogPost.create({
    data: {
      title: body.title || null,
      content: body.content || null,
      mediaItems: body.mediaItems || [],
      published: body.published ?? true,
    },
  })

  return NextResponse.json(post)
}
