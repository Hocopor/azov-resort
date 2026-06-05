import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, slug, roomId: directRoomId } = body

    if (!event) {
      return NextResponse.json({ error: 'Missing event field' }, { status: 400 })
    }

    let roomId = directRoomId || null

    if (slug && !roomId) {
      const room = await prisma.room.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (room) {
        roomId = room.id
      }
    }

    await prisma.conversionEvent.create({
      data: {
        event,
        roomId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error tracking custom event:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
