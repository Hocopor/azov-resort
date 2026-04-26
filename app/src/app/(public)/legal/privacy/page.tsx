import { Metadata } from 'next'
import Link from 'next/link'
import { getSettings, normalizeSiteAddress } from '@/lib/settings'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Политика конфиденциальности' }

export default async function PrivacyPage() {
  const settings = await getSettings(['site_name', 'site_phone', 'site_address', 'admin_email'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const phone = settings.site_phone || '+7 (XXX) XXX-XX-XX'
  const address = normalizeSiteAddress(settings.site_address)

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sea-700 text-sm mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Политика конфиденциальности</h1>
          <p className="text-gray-400 text-sm mb-8">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">1. Общие положения</h2>
              <p>Настоящая Политика конфиденциальности регулирует порядок обработки и защиты персональных данных пользователей сайта <strong>{siteName}</strong>, расположенного по адресу {process.env.NEXT_PUBLIC_SITE_URL}.</p>
              <p>Использование сервисов сайта означает безоговорочное согласие пользователя с настоящей Политикой и указанными в ней условиями обработки его персональной информации.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">2. Персональные данные, которые мы обрабатываем</h2>
              <p>В рамках оказания услуг мы можем обрабатывать следующие персональные данные:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Имя и фамилия</li>
                <li>Номер мобильного телефона</li>
                <li>Адрес электронной почты</li>
                <li>Информация об устройстве и браузере (для улучшения работы сайта)</li>
                <li>IP-адрес</li>
                <li>Данные об аккаунтах в социальных сетях ВКонтакте и Яндекс (при авторизации через них)</li>
                <li>Информация о бронированиях (даты, предпочтения, особые пожелания)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">3. Цели обработки персональных данных</h2>
              <p>Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Создание и управление учётными записями пользователей</li>
                <li>Обработка и подтверждение бронирований номеров</li>
                <li>Приём платежей и осуществление возвратов</li>
                <li>Связь с пользователями по вопросам бронирования</li>
                <li>Направление уведомлений об изменении статуса бронирования</li>
                <li>Улучшение качества предоставляемых услуг</li>
                <li>Соблюдение требований законодательства Российской Федерации</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">4. Основания обработки</h2>
              <p>Обработка персональных данных осуществляется на основании:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Согласия субъекта персональных данных (ст. 6 Федерального закона № 152-ФЗ)</li>
                <li>Исполнения договора, стороной которого является субъект персональных данных</li>
                <li>Законных интересов оператора</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">5. Хранение и защита данных</h2>
              <p>Мы применяем технические и организационные меры для защиты персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищённых серверах с шифрованием. Пароли хранятся в зашифрованном виде (bcrypt).</p>
              <p>Персональные данные хранятся не дольше, чем этого требуют цели их обработки, либо в течение срока, установленного законодательством РФ.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">6. Передача данных третьим лицам</h2>
              <p>Персональные данные могут передаваться следующим третьим лицам:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>ООО «ЮКасса»</strong> — для обработки платежей</li>
                <li><strong>ВКонтакте</strong> / <strong>Яндекс</strong> — при авторизации через соответствующие сервисы</li>
              </ul>
              <p>Передача данных иным третьим лицам без согласия пользователя не осуществляется, за исключением случаев, предусмотренных законодательством РФ.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">7. Права пользователей</h2>
              <p>В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» вы вправе:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Получить информацию об обработке ваших персональных данных</li>
                <li>Потребовать исправления неточных данных</li>
                <li>Потребовать удаления данных («право на забвение»)</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обратиться в уполномоченный орган по защите прав субъектов персональных данных — Роскомнадзор</li>
              </ul>
              <p>Для реализации указанных прав направьте запрос по адресу: <strong>{phone}</strong></p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
              <p>Сайт использует файлы cookies для обеспечения корректной работы, хранения сессий и аналитики. Вы можете отключить cookies в настройках браузера, однако это может повлиять на функциональность сайта.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">9. Контактная информация</h2>
              <p>По всем вопросам, связанным с обработкой персональных данных, обращайтесь:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Телефон: {phone}</li>
                <li>Адрес: {address}</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">10. Изменения политики</h2>
              <p>Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна на данной странице. Продолжение использования сайта после внесения изменений означает принятие обновлённой Политики.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
