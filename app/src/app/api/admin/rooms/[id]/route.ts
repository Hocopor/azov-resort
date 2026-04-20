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
  const existingRoom = await prisma.room.findUnique({
    where: { id: params.id },
    select: { slug: true },
  })

  if (!existingRoom) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.pricePerDay !== undefined && { pricePerDay: body.pricePerDay }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.area !== undefined && { area: body.area }),
      ...(body.floor !== undefined && { floor: body.floor }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.hasAC !== undefined && { hasAC: body.hasAC }),
      ...(body.hasPrivateKitchen !== undefined && { hasPrivateKitchen: body.hasPrivateKitchen }),
      ...(body.hasTV !== undefined && { hasTV: body.hasTV }),
      ...(body.hasFridge !== undefined && { hasFridge: body.hasFridge }),
      ...(body.amenities !== undefined && { amenities: body.amenities }),
      ...(body.images !== undefined && { images: body.images }),
    },
  })

  revalidatePath('/rooms')
  revalidatePath(`/rooms/${existingRoom.slug}`)
  revalidatePath(`/rooms/${room.slug}`)
  revalidatePath('/admin/rooms')

  return NextResponse.json(room)
}
