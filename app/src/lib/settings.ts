import { prisma } from '@/lib/db'

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  if (!process.env.DATABASE_URL) {
    return {}
  }

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    })
    return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  } catch {
    return {}
  }
}

export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
  if (!process.env.DATABASE_URL) {
    return defaultValue
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting?.value ?? defaultValue
  } catch {
    return defaultValue
  }
}

export async function updateSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function getDepositSettings(): Promise<{
  type: 'PERCENT' | 'FIXED'
  percent: number
  fixed: number
}> {
  const settings = await getSettings(['deposit_type', 'deposit_percent', 'deposit_fixed'])
  return {
    type: (settings.deposit_type as 'PERCENT' | 'FIXED') || 'PERCENT',
    percent: parseInt(settings.deposit_percent || '30'),
    fixed: parseInt(settings.deposit_fixed || '200000'),
  }
}

export function calculateDeposit(
  totalPrice: number,
  settings: { type: 'PERCENT' | 'FIXED'; percent: number; fixed: number }
): number {
  if (settings.type === 'PERCENT') {
    return Math.round(totalPrice * (settings.percent / 100))
  }
  return Math.min(settings.fixed, totalPrice)
}

export async function formatMoney(kopecks: number): Promise<string> {
  return `${(kopecks / 100).toLocaleString('ru-RU')} ₽`
}
