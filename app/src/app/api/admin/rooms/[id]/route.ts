import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
      ...(body.name !== undefined && { name: body.name }),
      ...(body.pricePerDay !== undefined && { pricePerDay: body.pricePerDay }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.images !== undefined && { images: body.images }),
    },
  })

  revalidatePath('/rooms')
  revalidatePath(`/rooms/${room.slug}`)
  revalidatePath('/admin/rooms')

  return NextResponse.json(room)
}
