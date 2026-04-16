import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.name && { name: body.name }),
      ...(body.pricePerDay !== undefined && { pricePerDay: body.pricePerDay }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.description && { description: body.description }),
    },
  })
  return NextResponse.json(room)
}
