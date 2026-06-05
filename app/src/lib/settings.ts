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

export type SocialKind = 'vk' | 'whatsapp' | 'instagram'
export interface FooterSocial {
  kind: SocialKind
  url: string
}

export const SOCIAL_SETTING_KEYS = [
  'social_vk_enabled', 'social_vk_url',
  'social_whatsapp_enabled', 'social_whatsapp_url',
  'social_instagram_enabled', 'social_instagram_url',
]

function normalizeSocialUrl(kind: SocialKind, value: string): string {
  const trimmed = value.trim()
  if (kind === 'whatsapp') {
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    const digits = trimmed.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : trimmed
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// Собирает список соцсетей для подвола: только включённые и с непустой ссылкой.
export function buildFooterSocials(settings: Record<string, string>): FooterSocial[] {
  const kinds: SocialKind[] = ['vk', 'whatsapp', 'instagram']
  const result: FooterSocial[] = []
  for (const kind of kinds) {
    if (settings[`social_${kind}_enabled`] !== 'true') continue
    const raw = (settings[`social_${kind}_url`] || '').trim()
    if (!raw) continue
    result.push({ kind, url: normalizeSocialUrl(kind, raw) })
  }
  return result
}

export const LEGAL_SETTING_KEYS = [
  'legal_operator_name', 'legal_operator_inn', 'legal_email', 'legal_data_location',
]

export interface LegalInfo {
  operatorName: string
  inn: string
  email: string
  dataLocation: string
}

// Юр-реквизиты для правовых документов (с разумными фоллбэками).
export function resolveLegalInfo(settings: Record<string, string>): LegalInfo {
  return {
    operatorName: settings.legal_operator_name?.trim() || 'Макашенец О.В.',
    inn: settings.legal_operator_inn?.trim() || '',
    email: settings.legal_email?.trim() || '',
    dataLocation: settings.legal_data_location?.trim() || 'на территории Российской Федерации',
  }
}

export function normalizeSiteAddress(value?: string) {
  const normalized = value?.trim() || ''
  if (!normalized || LEGACY_SITE_ADDRESSES.has(normalized)) {
    return DEFAULT_SITE_ADDRESS
  }

  return normalized
}

export { DEFAULT_SITE_ADDRESS }
