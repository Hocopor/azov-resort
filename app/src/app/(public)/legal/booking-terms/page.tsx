import { Metadata } from 'next'
import Link from 'next/link'
import { getSettings } from '@/lib/settings'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Условия бронирования' }

export default async function BookingTermsPage() {
  const settings = await getSettings([
    'site_name', 'site_phone', 'check_in_time', 'check_out_time',
    'cancellation_policy', 'cancellation_partial_days',
    'deposit_type', 'deposit_percent', 'deposit_fixed',
  ])

  const siteName = settings.site_name || 'Отдых на Азове'
  const phone = settings.site_phone || '+7 (XXX) XXX-XX-XX'
  const checkIn = settings.check_in_time || '14:00'
  const checkOut = settings.check_out_time || '12:00'
  const fullRefundDays = settings.cancellation_policy || '14'
  const partialDays = settings.cancellation_partial_days || '7'
  const depositStr = settings.deposit_type === 'FIXED'
    ? `${Math.round(parseInt(settings.deposit_fixed || '200000') / 100)} ₽`
    : `${settings.deposit_percent || '30'}% от стоимости проживания`

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sea-700 text-sm mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Условия бронирования</h1>
          <p className="text-gray-400 text-sm mb-8">Гостевой дом «{siteName}»</p>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">1. Бронирование</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Бронирование считается подтверждённым после оплаты депозита в размере <strong>{depositStr}</strong>.</li>
                <li>После оплаты депозита гость получает подтверждение на указанный email и/или телефон.</li>
                <li>Бронирование без оплаты депозита автоматически аннулируется через 24 часа.</li>
                <li>При бронировании по телефону условия те же — депозит согласовывается отдельно.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">2. Заезд и выезд</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Время заезда: с <strong>{checkIn}</strong>.</li>
                <li>Время выезда: до <strong>{checkOut}</strong>.</li>
                <li>Ранний заезд и поздний выезд — по возможности, по предварительному согласованию (бесплатно).</li>
                <li>При заезде гость предъявляет документ, удостоверяющий личность.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">3. Оплата</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Депозит оплачивается онлайн через платёжный сервис ЮКасса при бронировании.</li>
                <li>Оставшаяся сумма оплачивается при заезде наличными или переводом.</li>
                <li>Все цены указаны в рублях РФ и включают НДС (если применимо).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">4. Политика отмены и возврата</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-gray-100">
                  <thead>
                    <tr className="bg-sea-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Срок отмены до заезда</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Возврат депозита</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-3">{fullRefundDays} дней и более</td>
                      <td className="px-4 py-3 text-green-700 font-medium">100%</td>
                    </tr>
                    <tr className="border-t border-gray-100 bg-gray-50">
                      <td className="px-4 py-3">От {partialDays} до {parseInt(fullRefundDays) - 1} дней</td>
                      <td className="px-4 py-3 text-yellow-700 font-medium">50%</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-3">Менее {partialDays} дней</td>
                      <td className="px-4 py-3 text-red-700 font-medium">Без возврата</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-500">Возврат осуществляется на банковскую карту, использованную при оплате, в течение 3–10 рабочих дней.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">5. Правила проживания</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Курение разрешено только в специально отведённых местах.</li>
                <li>Домашние животные принимаются по предварительному уведомлению при бронировании.</li>
                <li>Соблюдение тишины с 23:00 до 07:00.</li>
                <li>Гости несут ответственность за сохранность имущества. Ущерб оплачивается дополнительно.</li>
                <li>Запрещено передавать ключи третьим лицам.</li>
                <li>Максимальное количество гостей в номере — согласно описанию номера.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">6. Трансфер</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Трансфер предоставляется платно. Стоимость зависит от точки отправления.</li>
                <li>Трансфер необходимо заказать не менее чем за 2 часа до прибытия.</li>
                <li>При неизвестном времени прибытия мы свяжемся с вами за 14 дней до заезда (или в ближайшее время, если до заезда менее 14 дней).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">7. Форс-мажор</h2>
              <p>В случае форс-мажорных обстоятельств (стихийные бедствия, карантин и т.д.) бронирование может быть перенесено или отменено с полным возвратом депозита по согласованию сторон.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">8. Контакты</h2>
              <p>По всем вопросам бронирования обращайтесь: <strong>{phone}</strong></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
