import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(reviews)
}
