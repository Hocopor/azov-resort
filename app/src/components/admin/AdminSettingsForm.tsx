'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, Globe, CreditCard, XCircle, ToggleRight, ImageIcon, Trash2 } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { AdminFileDropzone } from '@/components/admin/AdminFileDropzone'

interface Props {
  settings: Record<string, string>
}

const GENERAL_IMAGE_FALLBACKS: Record<string, string> = {
  hero_bg_image: '/images/general/hero-bg.jpg',
  about_image_1: '/images/general/about-1.jpg',
  about_image_2: '/images/general/about-2.jpg',
  about_image_3: '/images/general/about-3.jpg',
  about_image_4: '/images/general/about-4.jpg',
  og_image: '/images/general/og-image.jpg',
}

type HeroField =
  | { key: string; label: string; placeholder: string; type: 'color' | 'text' }
  | { key: string; label: string; placeholder: string; type: 'range'; min: number; max: number; step: number }

function isUploadedImage(url: string) {
  return url.startsWith('/uploads/')
}

export function AdminSettingsForm({ settings }: Props) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState<string | null>(null)
  const [vals, setVals] = useState(settings)

  const save = async (keys: string[]) => {
    setSaving(keys[0])
    const data: Record<string, string> = {}
    keys.forEach((key) => {
      data[key] = vals[key] ?? ''
    })

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

  const set = (key: string, value: string) => setVals((prev) => ({ ...prev, [key]: value }))
  const toggle = (key: string) => setVals((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))
  const isActive = (key: string) => vals[key] === 'true'

  const uploadFile = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data?.error || 'Ошибка загрузки файла')
    }

    return data.url as string
  }

  const deleteUploadedFile = async (url: string) => {
    if (!url.startsWith('/uploads/')) return

    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  }

  const updateSingleSetting = async (key: string, value: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })

    if (!res.ok) {
      throw new Error('Ошибка сохранения')
    }
  }

  const handleGeneralImageUpload = async (key: string, files: File[]) => {
    const file = files[0]
    if (!file) return

    const previousUrl = vals[key] || ''
    setSaving(key)

    try {
      const url = await uploadFile(file, 'site')
      await updateSingleSetting(key, url)
      set(key, url)

      if (previousUrl && previousUrl !== url) {
        await deleteUploadedFile(previousUrl)
      }

      success('Изображение обновлено')
      router.refresh()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Ошибка загрузки изображения')
    } finally {
      setSaving(null)
    }
  }

  const handleGeneralImageRemove = async (key: string) => {
    const currentUrl = vals[key] || ''
    setSaving(key)

    try {
      await updateSingleSetting(key, '')
      set(key, '')
      await deleteUploadedFile(currentUrl)
      success('Изображение удалено')
      router.refresh()
    } catch {
      showError('Ошибка удаления изображения')
    } finally {
      setSaving(null)
    }
  }

  const SaveBtn = ({ keys }: { keys: string[] }) => (
    <button
      onClick={() => save(keys)}
      disabled={!!saving}
      className="btn-secondary text-sm py-2 disabled:opacity-60"
    >
      {saving === keys[0] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
    </button>
  )

  const generalImageFields = [
    { key: 'hero_bg_image', label: 'Главный фон', hint: 'Фон первого экрана на главной' },
    { key: 'about_image_1', label: 'Фото "О нас" №1', hint: 'Большое изображение блока "О нас"' },
    { key: 'about_image_2', label: 'Фото "О нас" №2', hint: 'Малое изображение блока "О нас"' },
    { key: 'about_image_3', label: 'Фото "О нас" №3', hint: 'Малое изображение блока "О нас"' },
    { key: 'about_image_4', label: 'Фото "О нас" №4', hint: 'Малое изображение блока "О нас"' },
    { key: 'og_image', label: 'OG-изображение', hint: 'Картинка превью для соцсетей и мессенджеров' },
  ]

  const heroColorFields: HeroField[] = [
    { key: 'hero_badge_bg', label: 'Плашка сезона: фон', placeholder: 'rgba(58,69,34,0.48)', type: 'text' },
    { key: 'hero_badge_border', label: 'Плашка сезона: рамка', placeholder: 'rgba(255,248,231,0.24)', type: 'text' },
    { key: 'hero_badge_text', label: 'Плашка сезона: текст', placeholder: '#fff6e8', type: 'color' },
    { key: 'hero_title_color', label: 'Заголовок', placeholder: '#fff8ef', type: 'color' },
    { key: 'hero_title_stroke_color', label: 'Заголовок: обводка', placeholder: '#5f432d', type: 'color' },
    { key: 'hero_title_stroke_width', label: 'Заголовок: толщина обводки', placeholder: '1.5', type: 'text' },
    { key: 'hero_filter_color', label: 'Hero-изображение: цвет фильтра', placeholder: '#102131', type: 'color' },
    { key: 'hero_filter_opacity', label: 'Hero-изображение: прозрачность фильтра (%)', placeholder: '0', type: 'range', min: 0, max: 100, step: 1 },
    { key: 'hero_subtitle_color', label: 'Подзаголовок', placeholder: '#f8ead7', type: 'color' },
    { key: 'hero_stat_value_color', label: 'Цифры статистики', placeholder: '#fff7ec', type: 'color' },
    { key: 'hero_stat_label_color', label: 'Подписи статистики', placeholder: '#f3e3cb', type: 'color' },
    { key: 'hero_primary_button_bg', label: 'Кнопка 1: фон', placeholder: '#db7a4e', type: 'color' },
    { key: 'hero_primary_button_hover', label: 'Кнопка 1: hover', placeholder: '#cb6c42', type: 'color' },
    { key: 'hero_primary_button_text', label: 'Кнопка 1: текст', placeholder: '#fffaf3', type: 'color' },
    { key: 'hero_secondary_button_bg', label: 'Кнопка 2: фон', placeholder: 'rgba(70,49,31,0.56)', type: 'text' },
    { key: 'hero_secondary_button_hover', label: 'Кнопка 2: hover', placeholder: 'rgba(70,49,31,0.72)', type: 'text' },
    { key: 'hero_secondary_button_text', label: 'Кнопка 2: текст', placeholder: '#fff4e4', type: 'color' },
    { key: 'hero_secondary_button_border', label: 'Кнопка 2: рамка', placeholder: 'rgba(255,241,220,0.28)', type: 'text' },
  ]

  return (
    <div className="space-y-6">
      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <Globe className="h-5 w-5 text-sea-600" /> Информация о сайте
        </h2>
        <div className="space-y-4">
          {[
            { key: 'site_name', label: 'Название сайта' },
            { key: 'site_phone', label: 'Телефон' },
            { key: 'site_address', label: 'Адрес' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-gray-500">{label}</label>
              <input value={vals[key] || ''} onChange={(e) => set(key, e.target.value)} className="input-field" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Время заезда</label>
              <input value={vals.check_in_time || '14:00'} onChange={(e) => set('check_in_time', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Время выезда</label>
              <input value={vals.check_out_time || '12:00'} onChange={(e) => set('check_out_time', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Заголовок главной страницы</label>
            <input value={vals.hero_title || ''} onChange={(e) => set('hero_title', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Подзаголовок главной страницы</label>
            <input value={vals.hero_subtitle || ''} onChange={(e) => set('hero_subtitle', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">О нас (текст)</label>
            <textarea value={vals.about_text || ''} onChange={(e) => set('about_text', e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <SaveBtn keys={['site_name', 'site_phone', 'site_address', 'check_in_time', 'check_out_time', 'hero_title', 'hero_subtitle', 'about_text']} />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <ImageIcon className="h-5 w-5 text-sea-600" /> Оформление hero при загруженном фоне
        </h2>
        <div className="mb-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-gray-600">
          Эти цвета и фильтр работают только когда загружен главный фон. Если фон удалить, главная страница вернётся к стандартным цветам.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {heroColorFields.map((field) => (
            <div key={field.key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">{field.label}</label>

              {field.type === 'color' && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={vals[field.key] || field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                  />
                  <input
                    value={vals[field.key] || field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                </div>
              )}

              {field.type === 'text' && (
                <input
                  value={vals[field.key] || ''}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="input-field"
                  placeholder={field.placeholder}
                />
              )}

              {field.type === 'range' && (
                <div className="space-y-3">
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={vals[field.key] || field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="w-full accent-sea-700"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={vals[field.key] || field.placeholder}
                      onChange={(e) => set(field.key, e.target.value)}
                      className="input-field w-28"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-400">Оставь пустым, чтобы вернулся стандартный вариант.</div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <SaveBtn keys={heroColorFields.map((field) => field.key)} />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <ImageIcon className="h-5 w-5 text-sea-600" /> Изображения сайта
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {generalImageFields.map(({ key, label, hint }) => {
            const currentUrl = vals[key] || GENERAL_IMAGE_FALLBACKS[key]

            return (
              <div key={key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 text-sm font-semibold text-gray-800">{label}</div>
                <div className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="relative h-44 w-full">
                    <Image src={currentUrl} alt={label} fill className="object-cover" unoptimized={isUploadedImage(currentUrl)} />
                  </div>
                </div>
                <div className="mb-3 text-xs text-gray-500">{hint}</div>
                <div className="space-y-3">
                  <AdminFileDropzone
                    title={saving === key ? 'Загрузка...' : 'Перетащите новое изображение'}
                    hint="PNG, JPG, WebP, AVIF. Старая версия автоматически заменится"
                    disabled={saving === key}
                    onFilesSelected={(files) => handleGeneralImageUpload(key, files)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleGeneralImageRemove(key)}
                      disabled={saving === key || !vals[key]}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Удалить загруженное
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <CreditCard className="h-5 w-5 text-sea-600" /> Условия оплаты
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-gray-500">Тип депозита</label>
            <div className="flex gap-3">
              {['PERCENT', 'FIXED'].map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="deposit_type"
                    value={type}
                    checked={vals.deposit_type === type}
                    onChange={() => set('deposit_type', type)}
                    className="accent-sea-700"
                  />
                  <span className="text-sm">{type === 'PERCENT' ? 'Процент от стоимости' : 'Фиксированная сумма'}</span>
                </label>
              ))}
            </div>
          </div>
          {vals.deposit_type === 'PERCENT' && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Процент депозита (%)</label>
              <input type="number" min={1} max={100} value={vals.deposit_percent || '30'} onChange={(e) => set('deposit_percent', e.target.value)} className="input-field w-32" />
            </div>
          )}
          {vals.deposit_type === 'FIXED' && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Фиксированная сумма (руб.)</label>
              <input type="number" min={0} value={Math.round(parseInt(vals.deposit_fixed || '200000', 10) / 100)} onChange={(e) => set('deposit_fixed', String(parseInt(e.target.value || '0', 10) * 100))} className="input-field w-40" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-gray-500">Минимальный срок бронирования (ночей)</label>
            <input type="number" min={1} value={vals.min_booking_days || '1'} onChange={(e) => set('min_booking_days', e.target.value)} className="input-field w-24" />
          </div>
          <SaveBtn keys={['deposit_type', 'deposit_percent', 'deposit_fixed', 'min_booking_days']} />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <XCircle className="h-5 w-5 text-coral-600" /> Политика отмены
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Полный возврат — за сколько дней до заезда</label>
            <input type="number" min={1} value={vals.cancellation_policy || '14'} onChange={(e) => set('cancellation_policy', e.target.value)} className="input-field w-24" />
            <p className="mt-1 text-xs text-gray-400">Если до заезда ≥ N дней — возврат 100%</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Частичный возврат (50%) — за сколько дней</label>
            <input type="number" min={1} value={vals.cancellation_partial_days || '7'} onChange={(e) => set('cancellation_partial_days', e.target.value)} className="input-field w-24" />
            <p className="mt-1 text-xs text-gray-400">Если до заезда от N до {vals.cancellation_policy} дней — возврат 50%</p>
          </div>
          <div className="rounded-xl border border-sand-200 bg-sand-50 p-3 text-xs text-gray-600">
            <strong>Итоговая политика:</strong>
            <br />
            ≥ {vals.cancellation_policy || 14} дней — возврат 100%
            <br />
            {vals.cancellation_partial_days || 7}–{parseInt(vals.cancellation_policy || '14', 10) - 1} дней — возврат 50%
            <br />
            Менее {vals.cancellation_partial_days || 7} дней — без возврата
          </div>
          <SaveBtn keys={['cancellation_policy', 'cancellation_partial_days']} />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-800">
          <ToggleRight className="h-5 w-5 text-sea-600" /> Функции сайта
        </h2>
        <div className="space-y-4">
          {[
            { key: 'services_page_active', label: 'Страница "Услуги"', desc: 'Показывать ссылку на страницу доп. услуг в меню' },
            { key: 'cooking_service_active', label: 'Услуга "Блюда по предзаказу"', desc: 'Показывать предложение о приготовлении еды' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <div className="text-sm font-medium text-gray-800">{label}</div>
                <div className="mt-0.5 text-xs text-gray-400">{desc}</div>
              </div>
              <button
                onClick={async () => {
                  toggle(key)
                  const newValue = vals[key] === 'true' ? 'false' : 'true'
                  await fetch('/api/admin/settings', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [key]: newValue }),
                  })
                  router.refresh()
                }}
                className={`relative h-6 w-12 rounded-full transition-colors ${isActive(key) ? 'bg-sea-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive(key) ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
