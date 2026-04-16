'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Globe, CreditCard, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

interface Props { settings: Record<string, string> }

export function AdminSettingsForm({ settings }: Props) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState<string | null>(null)
  const [vals, setVals] = useState(settings)

  const save = async (keys: string[]) => {
    setSaving(keys[0])
    const data: Record<string, string> = {}
    keys.forEach((k) => { data[k] = vals[k] ?? '' })
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      success('Настройки сохранены')
      router.refresh()
    } catch {
      showError('Ошибка сохранения')
    } finally {
      setSaving(null)
    }
  }

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }))
  const toggle = (k: string) => setVals((p) => ({ ...p, [k]: p[k] === 'true' ? 'false' : 'true' }))

  const isActive = (k: string) => vals[k] === 'true'

  const SaveBtn = ({ keys }: { keys: string[] }) => (
    <button
      onClick={() => save(keys)}
      disabled={!!saving}
      className="btn-secondary text-sm py-2 disabled:opacity-60"
    >
      {saving === keys[0] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Site info */}
      <div className="admin-card">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-sea-600" /> Информация о сайте
        </h2>
        <div className="space-y-4">
          {[
            { key: 'site_name', label: 'Название сайта' },
            { key: 'site_phone', label: 'Телефон' },
            { key: 'site_address', label: 'Адрес' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input value={vals[key] || ''} onChange={(e) => set(key, e.target.value)} className="input-field" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Время заезда</label>
              <input value={vals.check_in_time || '14:00'} onChange={(e) => set('check_in_time', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Время выезда</label>
              <input value={vals.check_out_time || '12:00'} onChange={(e) => set('check_out_time', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Заголовок главной страницы</label>
            <input value={vals.hero_title || ''} onChange={(e) => set('hero_title', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Подзаголовок главной страницы</label>
            <input value={vals.hero_subtitle || ''} onChange={(e) => set('hero_subtitle', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">О нас (текст)</label>
            <textarea value={vals.about_text || ''} onChange={(e) => set('about_text', e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <SaveBtn keys={['site_name', 'site_phone', 'site_address', 'check_in_time', 'check_out_time', 'hero_title', 'hero_subtitle', 'about_text']} />
        </div>
      </div>

      {/* Deposit settings */}
      <div className="admin-card">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-sea-600" /> Условия оплаты
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Тип депозита</label>
            <div className="flex gap-3">
              {['PERCENT', 'FIXED'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deposit_type"
                    value={t}
                    checked={vals.deposit_type === t}
                    onChange={() => set('deposit_type', t)}
                    className="accent-sea-700"
                  />
                  <span className="text-sm">{t === 'PERCENT' ? 'Процент от стоимости' : 'Фиксированная сумма'}</span>
                </label>
              ))}
            </div>
          </div>
          {vals.deposit_type === 'PERCENT' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Процент депозита (%)</label>
              <input type="number" min={1} max={100} value={vals.deposit_percent || '30'} onChange={(e) => set('deposit_percent', e.target.value)} className="input-field w-32" />
            </div>
          )}
          {vals.deposit_type === 'FIXED' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Фиксированная сумма (руб.)</label>
              <input type="number" min={0} value={Math.round(parseInt(vals.deposit_fixed || '200000') / 100)} onChange={(e) => set('deposit_fixed', String(parseInt(e.target.value) * 100))} className="input-field w-40" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Минимальный срок бронирования (ночей)</label>
            <input type="number" min={1} value={vals.min_booking_days || '1'} onChange={(e) => set('min_booking_days', e.target.value)} className="input-field w-24" />
          </div>
          <SaveBtn keys={['deposit_type', 'deposit_percent', 'deposit_fixed', 'min_booking_days']} />
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="admin-card">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <XCircle className="w-5 h-5 text-coral-600" /> Политика отмены
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Полный возврат — за сколько дней до заезда</label>
            <input type="number" min={1} value={vals.cancellation_policy || '14'} onChange={(e) => set('cancellation_policy', e.target.value)} className="input-field w-24" />
            <p className="text-xs text-gray-400 mt-1">Если до заезда ≥ N дней — возврат 100%</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Частичный возврат (50%) — за сколько дней</label>
            <input type="number" min={1} value={vals.cancellation_partial_days || '7'} onChange={(e) => set('cancellation_partial_days', e.target.value)} className="input-field w-24" />
            <p className="text-xs text-gray-400 mt-1">Если до заезда от N до {vals.cancellation_policy} дней — возврат 50%</p>
          </div>
          <div className="p-3 bg-sand-50 rounded-xl text-xs text-gray-600 border border-sand-200">
            <strong>Итоговая политика:</strong><br/>
            ≥ {vals.cancellation_policy || 14} дней — возврат 100%<br/>
            {vals.cancellation_partial_days || 7}–{(parseInt(vals.cancellation_policy || '14') - 1)} дней — возврат 50%<br/>
            Менее {vals.cancellation_partial_days || 7} дней — без возврата
          </div>
          <SaveBtn keys={['cancellation_policy', 'cancellation_partial_days']} />
        </div>
      </div>

      {/* Feature toggles */}
      <div className="admin-card">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <ToggleRight className="w-5 h-5 text-sea-600" /> Функции сайта
        </h2>
        <div className="space-y-4">
          {[
            { key: 'services_page_active', label: 'Страница «Услуги»', desc: 'Показывать ссылку на страницу доп. услуг в меню' },
            { key: 'cooking_service_active', label: 'Услуга «Блюда по предзаказу»', desc: 'Показывать предложение о приготовлении еды' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800 text-sm">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <button
                onClick={async () => {
                  toggle(key)
                  // Auto-save toggle
                  const newVal = vals[key] === 'true' ? 'false' : 'true'
                  await fetch('/api/admin/settings', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [key]: newVal }),
                  })
                  router.refresh()
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${isActive(key) ? 'bg-sea-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive(key) ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
