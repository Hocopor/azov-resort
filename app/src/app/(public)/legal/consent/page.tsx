import { Metadata } from 'next'
import Link from 'next/link'
import { getSettings, normalizeSiteAddress, resolveLegalInfo, LEGAL_SETTING_KEYS } from '@/lib/settings'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Согласие на обработку персональных данных' }

export default async function ConsentPage() {
  const settings = await getSettings(['site_name', 'site_phone', 'site_address', ...LEGAL_SETTING_KEYS])
  const siteName = settings.site_name || 'Отдых на Азове'
  const address = normalizeSiteAddress(settings.site_address)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const legal = resolveLegalInfo(settings)

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sea-700 text-sm mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Согласие на обработку персональных данных</h1>
          <p className="text-gray-400 text-sm mb-8">Редакция от 05 июня 2026 г.</p>

          <div className="space-y-6 text-gray-700 leading-relaxed">

            <p>
              Отправляя заявку на бронирование через сайт <strong>{siteUrl}</strong> (далее — Сайт) и проставляя
              отметку о согласии, я, действуя свободно, своей волей и в своём интересе, в соответствии с
              Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» даю согласие на обработку
              моих персональных данных оператору — самозанятому <strong>{legal.operatorName}</strong>
              {legal.inn ? <> (ИНН {legal.inn})</> : null}, осуществляющему деятельность под наименованием
              <strong> «{siteName}»</strong>, адрес: {address} (далее — Оператор).
            </p>

            <section>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">1. Перечень персональных данных</h2>
              <p>Согласие даётся на обработку следующих персональных данных, которые я предоставляю
                самостоятельно: фамилия, имя (как указано мной); номер телефона; адрес электронной почты
                (при указании); сведения о бронировании (даты, число гостей, пожелания, комментарий).</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">2. Цели обработки</h2>
              <p>Приём, рассмотрение, подтверждение и исполнение заявки на бронирование; связь со мной по
                вопросам бронирования и проживания; рассмотрение моих обращений и отзывов.</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">3. Перечень действий и способы обработки</h2>
              <p>Согласие даётся на совершение следующих действий: сбор, запись, систематизация, накопление,
                хранение, уточнение (обновление, изменение), извлечение, использование, блокирование,
                удаление и уничтожение персональных данных. Обработка осуществляется как с использованием
                средств автоматизации, так и без таковых. Базы данных, используемые для хранения,
                располагаются <strong>{legal.dataLocation}</strong>.</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">4. Передача третьим лицам</h2>
              <p>Оператор не передаёт персональные данные третьим лицам, за исключением передачи лицу,
                обеспечивающему хостинг Сайта и хранение данных по поручению Оператора (в объёме,
                необходимом для технической работы Сайта), а также случаев, прямо предусмотренных
                законодательством РФ.</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">5. Срок действия и отзыв согласия</h2>
              <p>Согласие действует с момента его предоставления до достижения целей обработки либо до его
                отзыва. Я вправе отозвать согласие в любой момент, направив Оператору письменное уведомление
                по контактам, указанным на Сайте. После отзыва Оператор прекращает обработку и уничтожает
                данные, если их дальнейшая обработка не требуется для исполнения принятых обязательств,
                защиты прав Оператора или не предусмотрена законодательством РФ.</p>
            </section>

            <p className="text-sm text-gray-500">
              Порядок обработки данных подробно изложен в{' '}
              <Link href="/legal/privacy" className="text-sea-700 underline">Политике конфиденциальности</Link>.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
