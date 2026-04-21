'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Star, Upload, X } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

const MAX_FILES = 10

export function ReviewForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { success, error } = useToast()
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '',
      })),
    [files]
  )

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || [])
    if (nextFiles.length === 0) return

    setFiles((current) => [...current, ...nextFiles].slice(0, MAX_FILES))
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const submitReview = async () => {
    if (content.trim().length < 10) {
      error('Опишите впечатления чуть подробнее')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('rating', String(rating))
      formData.append('content', content.trim())
      files.forEach((file) => formData.append('files', file))

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Не удалось отправить отзыв')
      }

      setRating(5)
      setContent('')
      setFiles([])
      success('Отзыв опубликован')
      router.refresh()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Не удалось отправить отзыв')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="card p-6 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Проверяем вход...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="card p-6 text-center">
        <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Оставить отзыв</h3>
        <p className="text-gray-500 mb-4">Чтобы опубликовать отзыв, нужно войти в аккаунт.</p>
        <Link href="/auth/login" className="btn-primary">
          Войти
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Добавить отзыв</h3>
        <p className="text-gray-500">Поставьте оценку, расскажите о своём отдыхе и при желании добавьте фото или видео.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Оценка</label>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1
            const active = starValue <= rating

            return (
              <button
                key={starValue}
                type="button"
                onClick={() => setRating(starValue)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Поставить ${starValue} звёзд`}
              >
                <Star className={`w-7 h-7 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Текст отзыва</label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          className="input-field resize-none"
          placeholder="Напишите, как прошёл ваш отдых..."
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Фото и видео</label>
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 cursor-pointer hover:border-sea-400 hover:bg-sea-50 transition-colors">
          <Upload className="w-5 h-5 text-sea-600" />
          <span className="text-sm text-gray-600">Перетащите файлы сюда или нажмите, чтобы выбрать</span>
          <span className="text-xs text-gray-400">До {MAX_FILES} файлов. Поддерживаются изображения и видео.</span>
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFilesChange} />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {previews.map((preview, index) => (
            <div key={`${preview.file.name}-${index}`} className="relative rounded-2xl overflow-hidden border border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              {preview.file.type.startsWith('image/') ? (
                <img src={preview.url} alt={preview.file.name} className="w-full h-48 object-cover" />
              ) : (
                <video src={preview.url} className="w-full h-48 object-cover" controls />
              )}
              <div className="p-3 text-xs text-gray-500 break-all">{preview.file.name}</div>
            </div>
          ))}
        </div>
      )}

      <button onClick={submitReview} disabled={isSubmitting} className="btn-primary disabled:opacity-60">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Отправить отзыв'}
      </button>
    </div>
  )
}
