# ARCHITECTURE — карта проекта (для быстрого онбординга)

> Цель файла: зайти сюда и понять проект целиком, не перелопачивая код.
> Если что-то здесь расходится с кодом — код главнее (файл мог устареть); поправь файл.
> Смежные доки: `SEO.md` (SEO + деплой-команды), `logs.md` (готовые тексты номеров/SEO), `README.md`, `LIVE_PLAN.md`.

---

## 1. Что это
Сайт гостевого дома **«Гостевой дом на Зелёной, 26»**, п. **Кучугуры**, Азовское море. Бронирование номеров онлайн, публичные страницы (номера/услуги/территория/блог/отзывы), админ-панель, оплата депозита через ЮKassa, уведомления на почту и в VK.

Язык интерфейса и контента — **русский**. Цена везде в **копейках** (рубли × 100).

---

## 2. Стек
- **Next.js 14.2** (App Router), **React 18**, **TypeScript**, вывод `output: 'standalone'`.
- **Prisma 5** + **PostgreSQL 16**.
- **Tailwind CSS** (+ кастомные цвета `sea-*`, `sand-*`, `deep-*`, `coral-*`).
- **next-auth v5 (beta)** — аккаунты гостей (VK/Yandex OAuth + credentials).
- **Отдельная JWT-авторизация админа** (не через next-auth) — см. §8.
- Иконки `lucide-react`, анимации `framer-motion`, графики `recharts` (админ), редактор `@tiptap` (админ блог/территория).
- Почта `nodemailer` (SMTP), изображения `sharp`.
- Деплой: **Docker Compose** (сервисы `postgres` + `app`), оркестрация `deploy.sh`.

---

## 3. Запуск и деплой
⚠️ **Локально НЕТ базы и `node_modules`** — проект собирается/работает только на сервере (Docker). Локально `prisma generate`/`tsc`/`next build` не запустить. Проверять правки ручной сверкой.

- Боевой URL: `https://azov.mak-o.ru` (env `NEXT_PUBLIC_SITE_URL`).
- Корневой `.env` — переменные docker-compose (POSTGRES_*, NEXTAUTH_*, YOOKASSA_*, SMTP_*, ADMIN_*, VK_*, YANDEX_*). `DATABASE_URL` собирается в compose из POSTGRES_* и указывает на сервис `postgres`.
- **Ручной деплой** (как делает владелец):
  ```bash
  git pull
  docker compose build --no-cache
  docker compose up -d
  # ТОЛЬКО если менялась schema.prisma (новые поля/модели):
  docker compose exec app ./node_modules/.bin/prisma db push
  docker compose restart app
  ```
- Миграций нет (папка `app/prisma/migrations` отсутствует) → синхронизация схемы через **`prisma db push`**. `deploy.sh` делает это автоматически; ручной флоу `build+up` — НЕТ, поэтому `db push` после изменения схемы запускать вручную.
- `docker-entrypoint.sh` на старте контейнера запускает `prisma migrate deploy` (при отсутствии миграций — no-op) + `scripts/ensure-admin.js` + `node server.js`.
- Билд использует `SKIP_DB_DURING_BUILD=1` и фейковый `DATABASE_URL` — поэтому код, читающий БД на этапе билда, должен это переживать (см. §13 про `force-dynamic`).

---

## 4. Структура каталогов
```
app/
  prisma/schema.prisma        # модели БД (§5)
  src/
    app/                      # Next App Router
      layout.tsx              # корневой layout (шрифты, generateMetadata, SessionProvider) — force-dynamic
      sitemap.ts, robots.ts   # SEO (динамические)
      (public)/               # ПУБЛИЧНЫЙ САЙТ (route group), свой layout с Header/Footer — force-dynamic
        page.tsx              # главная
        rooms/page.tsx        # каталог номеров
        rooms/[id]/page.tsx   # страница номера (slug в [id]) + бронирование
        services|territory|blog|reviews/page.tsx
        legal/{privacy,terms,booking-terms}/page.tsx
      admin/                  # АДМИН-ПАНЕЛЬ, свой layout (JWT-гард) — force-dynamic
        page.tsx (дашборд), rooms, bookings, bookings/new, reviews, blog, territory, users, settings, login
      account/                # ЛК гостя (next-auth) — force-dynamic
      auth/                   # вход/регистрация гостя (next-auth) — force-dynamic
      api/                    # REST-роуты (§6)
    components/
      layout/                 # Header, Footer
      rooms/                  # RoomCard, RoomGallery, RoomImageCarousel, BookingForm
      admin/                  # все админские клиентские формы (AdminRoomsClient, AdminSettingsForm, ...)
      account/ auth/ reviews/ analytics/ providers/ ui/ seo/
      seo/                    # JsonLd, FaqSection (добавлено для SEO)
      ui/                     # AppImage (обёртка next/image), MediaRenderer
    lib/                      # бизнес-логика и утилиты (§7)
  next.config.js              # images, headers(cache), optimizePackageImports, compress
  Dockerfile                  # multi-stage (deps→builder→runner, standalone)
docker-compose.yml            # postgres + app
deploy.sh                     # деплой-скрипт (миграции/seed/статус)
```

---

## 5. Модели БД (`prisma/schema.prisma`)
- **User / Account / Session / VerificationToken** — гости + next-auth (OAuth VK/Yandex, credentials, верификация email).
- **Room** — номер. Ключевое: `slug` (URL), `shortDescription` (кратко = meta description), `description` (полное), **`seoTitle`/`seoDescription`** (nullable, SEO-оверрайды), `baseCapacity`+`extraCapacity`=`capacity`, `pricePerDay` (копейки), `images String[]`, `amenities Json` (список строк ИЛИ объект-флаги), `hasAC/hasTV/hasFridge/hasPrivateKitchen`, `isActive`, `sortOrder`.
- **RoomPricePeriod** — сезонные цены на период дат (перекрывают базовую).
- **BlockedDate** — заблокированные владельцем даты номера.
- **Booking** — бронь: даты, гости, депозит (`depositType` PERCENT/FIXED), `totalPrice`/`depositAmount` (копейки), трансфер, `status` (BookingStatus), оплата ЮKassa (`paymentId/paymentUrl/paymentStatus/paidAt`), отмена/возврат, `source` (BookingSource).
- **BlogPost / TerritoryEntry / Review** — контент с `mediaItems Json` (массив {type,url,caption}). Review имеет `rating`, `published` (премодерация).
- **Service** — доп. услуги (цена в копейках или null=бесплатно, `category`).
- **Setting** — key/value (строки). Вся настройка сайта здесь (§9).
- **PageView / ConversionEvent** — аналитика (трекер шлёт из браузера).
- Enums: `Role`, `BookingStatus`, `PaymentStatus`, `DepositType`, `BookingSource`.

---

## 6. API-роуты (`src/app/api`)
- **Публичные/гость:** `bookings` (создание/гет брони), `reviews`, `blog`, `territory` (GET), `account/profile`, `analytics/{pageview,event}`, `auth/[...nextauth]`, `auth/register`, `auth/resend-verification`.
- **Админ (под `verifyAdminRequest`):** `admin/auth/{login,logout}`, `admin/rooms/[id]` (PATCH номера, в т.ч. `seoTitle/seoDescription`), `admin/rooms/[id]/blocked-dates[/...]`, `admin/bookings[/...]`, `admin/settings` (PATCH любых key/value, GET), `admin/upload` (POST/DELETE файлов), `admin/users/[id]`.
- Платёжный вебхук ЮKassa — искать при работе с оплатой (см. поля Booking.payment*).

---

## 7. Ключевые библиотеки (`src/lib`)
- **db.ts** — singleton PrismaClient (`prisma`).
- **settings.ts** — `getSettings(keys[])` (кеш `unstable_cache`, revalidate 60, tag `'settings'`; пропускает БД при билде), `getSetting`, `updateSetting`, `normalizeSiteAddress`, депозит-хелперы, **`buildFooterSocials`/`SOCIAL_SETTING_KEYS`** (соцсети подвала), `DEFAULT_SITE_ADDRESS` (Кучугуры). При смене настроек админ-API делает `revalidateTag('settings')`.
- **seo.ts** — `SITE_LOCALITY='Кучугуры'`, `SITE_REGION`, `SITE_STREET`, `getSiteUrl()`, `buildRoomImageAlt()`, `FAQ_ITEMS`, билдеры JSON-LD (`buildLodgingBusinessJsonLd`, `buildHotelRoomJsonLd`, `buildFaqJsonLd`, `buildBreadcrumbJsonLd`). **Менять локацию — здесь.**
- **pricing.ts** — нормализация/валидация ценовых периодов, расчёт цены за ночь, диапазон цен (`getRoomPriceRange`). Всё в копейках.
- **utils.ts** — `cn`, `formatMoney`/`formatMoneyRange` (копейки→«₽»), `formatDate` (date-fns, ru), статусы броней (label/color), `getRoomCapacityBreakdown`, `pluralize`, `isAdmin`, телефоны.
- **media.ts** — варианты изображений (`card/gallery/content/...`), srcset/sizes для загруженных файлов (`/uploads/...`).
- **auth.ts / auth.config.ts** — конфиг next-auth (гости).
- **admin-auth.ts** — JWT-авторизация админа (§8).
- **email.ts** — письма (welcome, подтверждение/отмена брони, уведомление админу) через SMTP.
- **vk.ts** — `sendVKNotification` (сообщение в VK через `VK_GROUP_TOKEN`).

---

## 8. Аутентификация — ДВЕ независимые системы
1. **Гости (next-auth v5):** OAuth VK/Yandex + credentials, модели User/Account/Session, страницы `/auth/*`, ЛК `/account/*`. Email-верификация.
2. **Админ (отдельно, без next-auth):** `lib/admin-auth.ts` — собственный JWT в cookie **`admin_session`** (12 ч). Логин `ADMIN_LOGIN` + `ADMIN_PASSWORD_HASH` (bcrypt) из env. Все админ-API проверяются `verifyAdminRequest(req)`. Вход — `/admin/login`. Это сделано, чтобы полностью отделить админку от пользовательской авторизации.

> Историческая заметка: был рефактор «отделить админку от публичного сайта». Если встретишь противоречия про пользовательские аккаунты — сверяйся с актуальным кодом.

---

## 9. Настройки сайта (модель `Setting`, админка `/admin/settings`)
Редактируются в `AdminSettingsForm.tsx`, сохраняются через `PATCH /api/admin/settings` (принимает любые ключи). Чтение — `getSettings([...])`. Известные ключи:
- Общие: `site_name`, `site_phone`, `site_address`, `check_in_time`, `check_out_time`, `hero_title`, `hero_subtitle`, `about_text`.
- **SEO:** `seo_title`, `seo_description` (мета главной; если пусто — фоллбэк на стандарт/`hero_subtitle`).
- **Соцсети подвала:** `social_{vk,whatsapp,instagram}_enabled` ('true'/'false') и `social_{...}_url`.
- Изображения: `hero_bg_image`, `about_image_1..4`, `og_image`.
- Hero-оформление: множество `hero_*` (цвета/обводки/кнопки) — применяются только при загруженном `hero_bg_image`.
- Депозит/отмена: `deposit_type`, `deposit_percent`, `deposit_fixed`, `min_booking_days`, `cancellation_policy`, `cancellation_partial_days`.
- Фичефлаги: `services_page_active`, `cooking_service_active`.

---

## 10. Изображения и загрузки
- Загрузка — `POST /api/admin/upload` (папки `site`, `rooms/<slug>`), удаление — `DELETE`. Файлы в volume **`uploads`** (отдаются как `/uploads/...`).
- **`AppImage`** (`components/ui/AppImage.tsx`) — обёртка над `next/image`: для `/uploads/...` строит srcset/sizes по `media.ts`, для остального — обычный `next/image`.
- `next.config.js`: форматы avif/webp, кеш картинок год, заголовки `immutable` для `/uploads`, `/images`, `/_next/static`.
- Alt у фото номеров генерится автоматически: `buildRoomImageAlt(name, idx)` → «{название}, гостевой дом в Кучугурах — фото N».

---

## 11. Цены и бронирование
- Всё в **копейках**. На вход/вывод в админке — рубли (×100 / ÷100).
- Базовая цена `Room.pricePerDay` + сезонные `RoomPricePeriod` (перекрывают по датам). Диапазон для карточки — `getRoomPriceRange`.
- Доступность номера = брони (CONFIRMED/PENDING) + `BlockedDate`. Валидация дат — на сервере при создании брони (важно: календарь может быть слегка устаревшим из-за кеша, но submit перепроверяет).
- Депозит: процент или фикс (`Setting` deposit_*). Оплата — ЮKassa (`paymentUrl`).

---

## 12. SEO (подробно — в `SEO.md`)
Реализовано: отдельные SEO-поля главной (`seo_title/description`) и номеров (`seoTitle/seoDescription`, фоллбэк на обычный текст); мета `/rooms`; авто alt с локацией; FAQ-блок (`FaqSection`) + микроразметка (`JsonLd`: LodgingBusiness на главной, HotelRoom+Offer+Breadcrumb на номере, FAQPage на `/rooms`); `sitemap.ts` + `robots.ts`. Готовые тексты — `logs.md`.

---

## 13. Особенности и подводные камни
- **Нет локальной БД/депсов** — не пытайся собирать/мигрировать локально (§3).
- **Копейки везде** — частый источник ошибок (×100).
- **`force-dynamic`** в корневом и `(public)` layout — стоит НАМЕРЕННО: при билде БД недоступна (`SKIP_DB_DURING_BUILD=1`, фейковый DATABASE_URL), а публичные страницы дёргают `prisma` напрямую. Снять `force-dynamic` (ради ISR-скорости) можно только защитив все прямые `prisma`-вызовы публичных страниц от билд-времени; иначе билд упадёт. Это известный «резерв скорости», пока не активирован.
- **Кеш настроек** — `getSettings` кешируется (60с, tag `settings`); правки в админке инвалидируют тег. Если настройка «не подхватилась» — проверь `revalidateTag`.
- **Схема меняется → нужен `prisma db push`** на деплое (ручной флоу его не делает сам).
- **`amenities`** у Room бывает двух форматов (массив строк ИЛИ объект-флаги) — нормализуй (`normalizeAmenities`).
- Публичные страницы имеют `revalidate` (60–300), но `force-dynamic` его перекрывает.
- Даты в коде/доках держим абсолютными (не «сегодня»).

---

## 14. Соглашения
- Тексты для пользователя — по-русски, тёплый «голос хозяина» (см. `logs.md`).
- Новый клиентский компонент — `'use client'`; серверные по умолчанию.
- Деньги — копейки; форматирование только через `formatMoney`.
- Админские мутации — через `/api/admin/*` с `verifyAdminRequest` и `revalidatePath/Tag`.
- Иконки — `lucide-react` (именованный импорт; в т.ч. покрыт `optimizePackageImports`).
