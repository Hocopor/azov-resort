import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseISO } from 'date-fns'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const blocked = await prisma.blockedDate.create({
    data: {
      roomId: params.id,
      dateFrom: parseISO(body.dateFrom),
      dateTo: parseISO(body.dateTo),
      reason: body.reason || null,
    },
  })
  return NextResponse.json(blocked)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const blocked = await prisma.blockedDate.findMany({
    where: { roomId: params.id, dateTo: { gte: new Date() } },
    orderBy: { dateFrom: 'asc' },
  })
  return NextResponse.json(blocked)
}
