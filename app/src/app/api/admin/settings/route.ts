import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function PATCH(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  )

  revalidatePath('/')
  revalidatePath('/services')
  revalidatePath('/admin/settings')

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const settings = await prisma.setting.findMany()
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])))
}
