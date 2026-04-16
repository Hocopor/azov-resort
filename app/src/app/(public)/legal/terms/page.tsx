import { Metadata } from 'next'
import Link from 'next/link'
import { getSettings } from '@/lib/settings'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Пользовательское соглашение' }

export default async function TermsPage() {
  const settings = await getSettings(['site_name', 'site_phone'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const phone = settings.site_phone || '+7 (XXX) XXX-XX-XX'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sea-700 text-sm mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Пользовательское соглашение</h1>
          <p className="text-gray-400 text-sm mb-8">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">1. Предмет соглашения</h2>
              <p>Настоящее Пользовательское соглашение регулирует отношения между гостевым домом <strong>«{siteName}»</strong> (далее — «Администрация») и пользователем сайта {siteUrl} (далее — «Пользователь»).</p>
              <p>Регистрируясь на сайте или бронируя номер, Пользователь принимает условия настоящего Соглашения в полном объёме.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">2. Регистрация и аккаунт</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Для бронирования номеров рекомендуется создать аккаунт. Бронирование возможно и без регистрации.</li>
                <li>Пользователь несёт ответственность за достоверность предоставляемых данных.</li>
                <li>Пользователь обязан обеспечить безопасность своего пароля и не передавать доступ третьим лицам.</li>
                <li>Администрация вправе заблокировать аккаунт при нарушении настоящего Соглашения.</li>
                <li>Пользователь вправе удалить аккаунт в любое время через личный кабинет.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">3. Использование сайта</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Сайт предназначен для ознакомления с услугами гостевого дома и онлайн-бронирования.</li>
                <li>Запрещается использование автоматических средств для парсинга данных сайта.</li>
                <li>Запрещается размещение ложной информации при бронировании.</li>
                <li>Администрация оставляет за собой право изменять содержимое сайта без предварительного уведомления.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">4. Ответственность сторон</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Администрация не несёт ответственности за технические сбои, находящиеся вне её контроля.</li>
                <li>Пользователь несёт ответственность за действия, совершённые с его аккаунта.</li>
                <li>В случае предоставления ложных данных при бронировании Администрация вправе отказать в заселении без возврата депозита.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">5. Интеллектуальная собственность</h2>
              <p>Все материалы, размещённые на сайте (тексты, фотографии, логотипы), являются собственностью Администрации и защищены законодательством РФ об интеллектуальной собственности. Копирование и использование без разрешения запрещены.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">6. Применимое право</h2>
              <p>Настоящее Соглашение регулируется законодательством Российской Федерации. Споры разрешаются в порядке досудебного урегулирования, а при недостижении согласия — в судебном порядке по месту нахождения Администрации.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">7. Изменения соглашения</h2>
              <p>Администрация вправе изменять условия Соглашения в одностороннем порядке. Уведомление об изменениях публикуется на данной странице. Продолжение использования сайта означает согласие с изменёнными условиями.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">8. Контакты</h2>
              <p>По всем вопросам, связанным с настоящим Соглашением: <strong>{phone}</strong></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
