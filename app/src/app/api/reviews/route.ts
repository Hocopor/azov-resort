import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { mkdir, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { randomBytes } from 'crypto'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]
const MAX_SIZE = 100 * 1024 * 1024
const UPLOAD_ROOT = join(process.cwd(), 'uploads')

type ReviewMediaItem = {
  type: 'image' | 'video'
  url: string
  caption?: string
}

async function saveReviewFile(file: File, userId: string) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Неподдерживаемый формат файла')
  }

  if (file.size > MAX_SIZE) {
    throw new Error('Файл слишком большой')
  }

  const ext = extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg')
  const filename = `${Date.now()}-${randomBytes(10).toString('hex')}${ext}`
  const uploadDir = join(UPLOAD_ROOT, 'reviews', userId)

  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))

  return {
    type: file.type.startsWith('video/') ? 'video' : 'image',
    url: `/uploads/reviews/${userId}/${filename}`,
  } as ReviewMediaItem
}

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const rating = Number(formData.get('rating') || 0)
  const content = String(formData.get('content') || '').trim()
  const files = formData.getAll('files').filter((item): item is File => item instanceof File)

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Укажите оценку от 1 до 5' }, { status: 400 })
  }

  if (content.length < 10) {
    return NextResponse.json({ error: 'Опишите впечатления чуть подробнее' }, { status: 400 })
  }

  try {
    const mediaItems = await Promise.all(files.map((file) => saveReviewFile(file, session.user.id as string)))

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        rating,
        content,
        mediaItems,
        published: true,
      },
      include: { user: { select: { name: true, image: true } } },
    })

    return NextResponse.json(review)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка публикации отзыва' },
      { status: 400 }
    )
  }
}
