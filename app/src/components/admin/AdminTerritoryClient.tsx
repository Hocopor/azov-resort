'use client'

import { ChangeEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { MediaRenderer, type MediaItem } from '@/components/ui/MediaRenderer'

interface TerritoryEntry {
  id: string
  title: string | null
  content: string | null
  mediaItems: MediaItem[]
  published: boolean
  sortOrder: number
}

interface TerritoryFormState {
  title: string
  content: string
  mediaItems: MediaItem[]
  published: boolean
  sortOrder: number
}

const initialFormState: TerritoryFormState = {
  title: '',
  content: '',
  mediaItems: [],
  published: true,
  sortOrder: 0,
}

export function AdminTerritoryClient({ initialEntries }: { initialEntries: TerritoryEntry[] }) {
  const router = useRouter()
  const { success, error } = useToast()
  const [entries, setEntries] = useState(initialEntries)
  const [form, setForm] = useState<TerritoryFormState>(initialFormState)
  const [isCreating, setIsCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'territory')

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(payload?.error || 'Ошибка загрузки файла')
    }

    const data = await res.json()
    return {
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: data.url,
    } as MediaItem
  }

  const uploadForForm = async (event: ChangeEvent<HTMLInputElement>, entryId?: string) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    try {
      const uploaded = await Promise.all(files.map(uploadFile))
      if (entryId) {
        setEntries((current) =>
          current.map((entry) =>
            entry.id === entryId ? { ...entry, mediaItems: [...entry.mediaItems, ...uploaded] } : entry
          )
        )
      } else {
        setForm((current) => ({ ...current, mediaItems: [...current.mediaItems, ...uploaded] }))
      }
      success('Файлы загружены')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Ошибка загрузки файлов')
    } finally {
      event.target.value = ''
    }
  }

  const createEntry = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/territory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setEntries((current) => [
        ...current,
        {
          ...created,
          mediaItems: Array.isArray(created.mediaItems) ? created.mediaItems : [],
        },
      ])
      setForm(initialFormState)
      success('Блок территории создан')
      router.refresh()
    } catch {
      error('Не удалось создать блок территории')
    } finally {
      setIsCreating(false)
    }
  }

  const saveEntry = async (entry: TerritoryEntry) => {
    setSavingId(entry.id)
    try {
      const res = await fetch(`/api/territory/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error()
      success('Блок территории сохранён')
      router.refresh()
    } catch {
      error('Не удалось сохранить блок территории')
    } finally {
      setSavingId(null)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Удалить этот блок территории?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/territory/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setEntries((current) => current.filter((entry) => entry.id !== id))
      success('Блок территории удалён')
      router.refresh()
    } catch {
      error('Не удалось удалить блок территории')
    } finally {
      setDeletingId(null)
    }
  }

  const updateEntry = (id: string, patch: Partial<TerritoryEntry>) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  const removeMedia = (entryId: string | null, index: number) => {
    if (entryId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, mediaItems: entry.mediaItems.filter((_, mediaIndex) => mediaIndex !== index) }
            : entry
        )
      )
      return
    }

    setForm((current) => ({
      ...current,
      mediaItems: current.mediaItems.filter((_, mediaIndex) => mediaIndex !== index),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="admin-card space-y-4">
        <h2 className="font-display text-2xl font-semibold text-gray-900">Новый блок территории</h2>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="input-field"
          placeholder="Заголовок"
        />
        <textarea
          value={form.content}
          onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          className="input-field min-h-[140px] resize-y"
          placeholder="Описание территории"
        />
        <div className="flex flex-wrap gap-3">
          <input
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))}
            className="input-field w-40"
            type="number"
            placeholder="Порядок"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
            />
            Опубликовано
          </label>
          <label className="btn-outline cursor-pointer">
            <Upload className="w-4 h-4" /> Загрузить фото / видео
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(event) => uploadForForm(event)} />
          </label>
        </div>

        {form.mediaItems.length > 0 && (
          <div className="space-y-4">
            <MediaRenderer mediaItems={form.mediaItems} />
            <div className="flex flex-wrap gap-2">
              {form.mediaItems.map((item, index) => (
                <button
                  key={`${item.url || item.caption || 'media'}-${index}`}
                  type="button"
                  onClick={() => removeMedia(null, index)}
                  className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Удалить медиа #{index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={createEntry} disabled={isCreating} className="btn-primary disabled:opacity-60">
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Создать блок
        </button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 && <div className="admin-card text-center py-10 text-gray-400">Блоков территории пока нет</div>}

        {entries.map((entry) => (
          <div key={entry.id} className="admin-card space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={entry.title || ''}
                onChange={(event) => updateEntry(entry.id, { title: event.target.value })}
                className="input-field flex-1 min-w-[220px]"
                placeholder="Заголовок"
              />
              <input
                value={entry.sortOrder}
                onChange={(event) => updateEntry(entry.id, { sortOrder: Number(event.target.value) || 0 })}
                className="input-field w-40"
                type="number"
                placeholder="Порядок"
              />
            </div>
            <textarea
              value={entry.content || ''}
              onChange={(event) => updateEntry(entry.id, { content: event.target.value })}
              className="input-field min-h-[140px] resize-y"
              placeholder="Описание территории"
            />

            {entry.mediaItems.length > 0 && (
              <div className="space-y-4">
                <MediaRenderer mediaItems={entry.mediaItems} />
                <div className="flex flex-wrap gap-2">
                  {entry.mediaItems.map((item, index) => (
                    <button
                      key={`${entry.id}-${item.url || item.caption || 'media'}-${index}`}
                      type="button"
                      onClick={() => removeMedia(entry.id, index)}
                      className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" /> Удалить медиа #{index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={entry.published}
                  onChange={(event) => updateEntry(entry.id, { published: event.target.checked })}
                />
                Опубликовано
              </label>
              <label className="btn-outline cursor-pointer">
                <Upload className="w-4 h-4" /> Добавить фото / видео
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => uploadForForm(event, entry.id)}
                />
              </label>
              <button onClick={() => saveEntry(entry)} disabled={savingId === entry.id} className="btn-primary disabled:opacity-60">
                {savingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
              </button>
              <button
                onClick={() => deleteEntry(entry.id)}
                disabled={deletingId === entry.id}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
              >
                {deletingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
