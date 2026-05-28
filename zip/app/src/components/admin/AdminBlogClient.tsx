'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2, Eye, EyeOff, Loader2, Image as ImageIcon, Video, Type, Upload, X } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

interface MediaItem {
  type: 'image' | 'video' | 'gallery'
  url?: string
  caption?: string
  items?: string[]
}

interface Post {
  id: string
  title?: string | null
  content?: string | null
  mediaItems: MediaItem[]
  published: boolean
  createdAt: Date
}

export function AdminBlogClient({ posts: initialPosts }: { posts: Post[] }) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [posts, setPosts] = useState(initialPosts)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    content: '',
    published: true,
    mediaItems: [] as MediaItem[],
  })

  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setForm({ title: '', content: '', published: true, mediaItems: [] })
    setShowForm(false)
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Ошибка загрузки')
    const data = await res.json()
    return data.url
  }

  const handleMediaUpload = async (files: FileList, type: 'image' | 'video' | 'gallery') => {
    setUploading(true)
    try {
      if (type === 'gallery') {
        const urls = await Promise.all(Array.from(files).map(uploadFile))
        setForm((f) => ({ ...f, mediaItems: [...f.mediaItems, { type: 'gallery', items: urls }] }))
      } else {
        const url = await uploadFile(files[0])
        setForm((f) => ({ ...f, mediaItems: [...f.mediaItems, { type, url, caption: '' }] }))
      }
    } catch (e: any) {
      showError(e.message || 'Ошибка загрузки файла')
    } finally {
      setUploading(false)
    }
  }

  const updateCaption = (idx: number, caption: string) => {
    setForm((f) => {
      const items = [...f.mediaItems]
      items[idx] = { ...items[idx], caption }
      return { ...f, mediaItems: items }
    })
  }

  const removeMedia = (idx: number) => {
    setForm((f) => ({ ...f, mediaItems: f.mediaItems.filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    if (!form.content && form.mediaItems.length === 0) {
      showError('Добавьте текст или медиафайлы')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const newPost = await res.json()
      setPosts((p) => [newPost, ...p])
      success('Публикация создана')
      reset()
    } catch {
      showError('Ошибка создания публикации')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (post: Post) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      })
      if (!res.ok) throw new Error()
      setPosts((p) => p.map((pp) => pp.id === post.id ? { ...pp, published: !pp.published } : pp))
    } catch {
      showError('Ошибка обновления')
    }
  }

  const deletePost = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPosts((p) => p.filter((pp) => pp.id !== id))
      success('Публикация удалена')
    } catch {
      showError('Ошибка удаления')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Новая публикация
        </button>
      )}

      {/* Editor */}
      {showForm && (
        <div className="admin-card space-y-5">
          <h2 className="font-semibold text-gray-800">Новая публикация</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Заголовок (необязательно)</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Заголовок публикации" className="input-field" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Текст</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={4}
              placeholder="Расскажите об обстановке, поделитесь новостями..."
              className="input-field resize-none"
            />
          </div>

          {/* Media list */}
          {form.mediaItems.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs text-gray-500 block">Прикреплённые медиафайлы</label>
              {form.mediaItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-1 capitalize">
                      {item.type === 'image' ? '🖼 Изображение' : item.type === 'video' ? '🎥 Видео' : `🖼 Галерея (${item.items?.length} фото)`}
                    </div>
                    {(item.type === 'image' || item.type === 'video') && (
                      <input
                        value={item.caption || ''}
                        onChange={(e) => updateCaption(idx, e.target.value)}
                        placeholder="Подпись (необязательно)"
                        className="input-field text-sm"
                      />
                    )}
                  </div>
                  <button onClick={() => removeMedia(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload buttons */}
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => {
              if (!e.target.files) return
              const hasVideo = Array.from(e.target.files).some((f) => f.type.startsWith('video/'))
              const count = e.target.files.length
              if (hasVideo) handleMediaUpload(e.target.files, 'video')
              else if (count > 1) handleMediaUpload(e.target.files, 'gallery')
              else handleMediaUpload(e.target.files, 'image')
              e.target.value = ''
            }} />
            <button
              type="button"
              onClick={() => { if (fileRef.current) { fileRef.current.accept = 'image/*'; fileRef.current.multiple = false; fileRef.current.click() } }}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Фото
            </button>
            <button
              type="button"
              onClick={() => { if (fileRef.current) { fileRef.current.accept = 'image/*'; fileRef.current.multiple = true; fileRef.current.click() } }}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              <ImageIcon className="w-4 h-4" /> Галерея
            </button>
            <button
              type="button"
              onClick={() => { if (fileRef.current) { fileRef.current.accept = 'video/*'; fileRef.current.multiple = false; fileRef.current.click() } }}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              <Video className="w-4 h-4" /> Видео
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="accent-sea-700 w-4 h-4" />
              <span className="text-sm text-gray-700">Опубликовать сразу</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Опубликовать'}
            </button>
            <button onClick={reset} className="btn-outline">Отмена</button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className={`admin-card ${!post.published ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {post.title && <h3 className="font-semibold text-gray-800 mb-1">{post.title}</h3>}
                {post.content && <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{formatDate(post.createdAt, 'd MMMM yyyy, HH:mm')}</span>
                  {(post.mediaItems as MediaItem[]).length > 0 && (
                    <span>{(post.mediaItems as MediaItem[]).length} медиа</span>
                  )}
                  <span className={post.published ? 'text-green-600' : 'text-gray-400'}>
                    {post.published ? 'Опубликовано' : 'Скрыто'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(post)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title={post.published ? 'Скрыть' : 'Опубликовать'}>
                  {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deletingId === post.id}
                  className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                >
                  {deletingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="admin-card text-center py-8 text-gray-400">Публикаций пока нет</div>
        )}
      </div>
    </div>
  )
}
