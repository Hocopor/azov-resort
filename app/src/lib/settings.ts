import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

const DEFAULT_SITE_ADDRESS = 'Краснодарский край, Темрюкский район, посёлок Кучугуры, ул. Зелёная 26.'
const LEGACY_SITE_ADDRESSES = new Set([
  '',
  'Азовское море',
  'Азовское море, Краснодарский край',
  'Краснодарский край',
])

function shouldSkipDatabaseAccess() {
  return !process.env.DATABASE_URL || process.env.SKIP_DB_DURING_BUILD === '1'
}

const getAllSettingsCache = unstable_cache(
  async () => {
    if (shouldSkipDatabaseAccess()) return {} as Record<string, string>
    try {
      const settings = await prisma.setting.findMany()
      return Object.fromEntries(settings.map((s) => [s.key, s.value]))
    } catch {
      return {} as Record<string, string>
    }
  },
  ['all-settings'],
  { revalidate: 60, tags: ['settings'] }
)

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const all = await getAllSettingsCache()
  return Object.fromEntries(keys.map((k) => [k, all[k] ?? '']).filter(([, v]) => v !== ''))
}

export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
  if (shouldSkipDatabaseAccess()) {
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

export function normalizeSiteAddress(value?: string) {
  const normalized = value?.trim() || ''
  if (!normalized || LEGACY_SITE_ADDRESSES.has(normalized)) {
    return DEFAULT_SITE_ADDRESS
  }

  return normalized
}

export { DEFAULT_SITE_ADDRESS }
