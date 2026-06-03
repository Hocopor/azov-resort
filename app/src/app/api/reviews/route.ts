import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 50 * 1024 * 1024
const UPLOAD_ROOT = join(process.cwd(), 'uploads')

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    include: { user: { select: { name: true } } },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const guestName = formData.get('guestName')?.toString().trim()
    const rating = Number(formData.get('rating'))
    const content = formData.get('content')?.toString().trim()

    if (!guestName || guestName.length < 2) {
      return NextResponse.json({ error: 'Укажите ваше имя' }, { status: 400 })
    }
    if (!content || content.length < 10) {
      return NextResponse.json({ error: 'Напишите отзыв подробнее (минимум 10 символов)' }, { status: 400 })
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Некорректная оценка' }, { status: 400 })
    }

    const files = formData.getAll('files') as File[]
    const mediaItems: Array<{ type: string; url: string }> = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) continue
      if (file.size > MAX_FILE_SIZE) continue

      const ext = extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg')
      const filename = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
      const uploadDir = join(UPLOAD_ROOT, 'reviews')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
      mediaItems.push({
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: `/uploads/reviews/${filename}`,
      })
    }

    await prisma.review.create({
      data: {
        guestName,
        rating,
        content,
        mediaItems,
        published: false,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
