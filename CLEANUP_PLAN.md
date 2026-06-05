# CLEANUP_PLAN — удаление мёртвого кода (ЮKassa, аккаунты, OAuth)

> **Статус: НЕ начато.** Активный план. Исполнять по фазам, строго по порядку.
> Контекст мог быть очищен — сначала прочитай `ARCHITECTURE.md`, затем этот файл.
> Локально нет БД и `node_modules` → собрать/мигрировать локально нельзя. Проверка — ручной сверкой + грепом. Деплой и `prisma db push` — только на сервере (`docker compose ...`), см. `SEO.md`.

## Цель
Убрать неиспользуемый функционал, аккуратно, не сломав рабочее (бронирование-заявка, админка, письма, VK-уведомления). По итогам — обновить `ARCHITECTURE.md`.

## Что УДАЛЯЕМ (это мёртвый код)
- **ЮKassa** — в коде НЕ интегрирована. Только env-переменные `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` + мёртвая ветка `paymentUrl` в форме (`/api/bookings` его не возвращает → всегда `null`).
- **Аккаунты гостей и вход** (next-auth): страницы `app/auth/*`, `app/account/*`, OAuth VK/Yandex. Публичные пользователи их НЕ видят (в меню ссылок на вход нет). Бронь — это заявка без аккаунта.
- **OAuth-переменные** `VK_CLIENT_ID/SECRET`, `YANDEX_CLIENT_ID/SECRET`.

## Что ОБЯЗАТЕЛЬНО СОХРАНЯЕМ (не путать!)
- **Админ-авторизация** — отдельная, на своём JWT (`lib/admin-auth.ts`, cookie `admin_session`, `ADMIN_*` env). НЕ next-auth. Не трогать.
- **VK-уведомления админу** — `lib/vk.ts` (`sendVKNotification`, env `VK_GROUP_TOKEN`, `VK_ADMIN_ID`). Это НЕ вход через VK. Сохранить.
- **Письма** — `lib/email.ts`, SMTP. Сохранить.
- **`paymentStatus` у Booking** — админ вручную отмечает оплату депозита (UNPAID/PAID). Поле полезно офлайн → СОХРАНИТЬ. Удаляем только ЮKassa-специфичное (`paymentUrl`, `paymentId`) — и то в Фазе 3 с подтверждением.

---

## ФАЗА 0 — Re-verify (перед началом)
1. Прочитать `ARCHITECTURE.md`.
2. Подтвердить, что находки в силе:
   - `grep -rniE "yookassa" src .env.example docker-compose.yml` — должны быть только env + текст, без SDK.
   - `grep -rn "result.paymentUrl|successData" src/components/rooms/BookingForm.tsx` — ветка оплаты мёртвая.
   - `grep -rniE "useSession|next-auth|getServerSession" src` — где реально используется auth.
   - Проверить `Header.tsx`/`Footer.tsx`/меню — НЕТ ли ссылок на `/auth` или `/account` (ожидается, что нет).

## ФАЗА 1 — Безопасное (БЕЗ изменения схемы БД, без изменения поведения)
Можно деплоить обычным `build + up` без `db push`.
1. **ЮKassa env:** удалить `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` из: `docker-compose.yml` (env сервиса `app`), `.env.example`. (Из боевого `.env` владелец уберёт сам.)
2. **BookingForm:** убрать мёртвую ветку оплаты — `successData.paymentUrl` всегда `null`. Упростить успешный экран до одного состояния «заявка отправлена» (кнопка «Оплатить депозит» никогда не показывается). Состояние `successData` свести к флагу успеха.
3. Проверить `AdminSettingsForm` на наличие блоков/полей ЮKassa — если есть, удалить.
4. Проверить `lib/utils.ts` — `getPaymentStatusLabel` и т.п. оставить (используются для `paymentStatus`).
5. **Verify:** `grep -rni "yookassa|юкасса"` по `src` — пусто. Документы `legal/*` уже очищены ранее.

## ФАЗА 2 — Удаление аккаунтов и next-auth (КОД, без схемы БД)
1. **Сначала проверить зависимости:**
   - `grep -rn "useSession|SessionProvider|signIn|signOut|getServerSession|auth()" src` — собрать полный список.
   - Особо: `ReviewForm.tsx`, `BookingForm.tsx` — используют ли сессию (имя пользователя)? Если да — заменить на обычные поля ввода (гость вводит имя сам). Бронь уже работает без сессии (`/api/bookings` сессию не требует).
2. **Удалить файлы:** `app/auth/**`, `app/account/**`, `components/auth/**`, `components/account/**`, `app/api/auth/**`, `app/api/account/**`, `components/providers/SessionProvider.tsx`, `lib/auth.ts`, `lib/auth.config.ts`.
3. **Корневой layout** (`app/layout.tsx`): убрать `SessionProvider` (оставить `ToastProvider`).
4. **package.json:** убрать `next-auth`, `@auth/prisma-adapter` (после того как ни один импорт их не использует).
5. **OAuth env:** убрать `VK_CLIENT_ID/SECRET`, `YANDEX_CLIENT_ID/SECRET` из `docker-compose.yml`, `.env.example`. (НЕ трогать `VK_GROUP_TOKEN`, `VK_ADMIN_ID`.)
6. **Verify:** `grep -rniE "next-auth|useSession|@auth/prisma-adapter"` по `src` — пусто. Мысленно пройти сборку: не осталось битых импортов. Проверить, что админка (свой JWT) не задета.
7. Деплой обычным `build + up` (схему ещё НЕ меняли) — на этом этапе БД ещё содержит таблицы User/Account/Session, но код их не использует. Это нормально и безопасно.

## ФАЗА 3 — Схема БД (ДЕСТРУКТИВНО — только после явного подтверждения пользователя)
⚠️ Здесь `prisma db push` **УДАЛИТ таблицы** — операция необратима.
1. **СТОП. Спросить пользователя явно** и попросить сделать бэкап: `docker compose exec postgres pg_dump -U <user> <db> > backup.sql`.
2. Решить с пользователем судьбу `Booking.paymentId` / `paymentUrl` (ЮKassa-поля). `paymentStatus`/`paidAt` рекомендуется ОСТАВИТЬ.
3. В `schema.prisma`: удалить модели `User`, `Account`, `Session`, `VerificationToken`. Убрать связи `Booking.userId/user` и `Review.userId/user` (или сделать поля автономными — у Booking есть `guestName/guestPhone`, у Review есть `guestName`).
4. Поправить все запросы, где было `include: { user }` / `userId` — в `app/api/admin/bookings/*`, `app/admin/*`, `components/admin/*`, reviews. Грепнуть `userId|include: { user` и почистить.
5. `Enum Role` и `BookingSource`/прочее — `Role` можно удалить (был для User). `BookingSource` оставить.
6. **Деплой + `prisma db push`** на сервере (см. `SEO.md`). Подтвердить применение (db push спросит про удаление таблиц — это ожидаемо).
7. **Verify:** сайт открывается, бронь создаётся, админ-брони/отзывы открываются без ошибок про `user`.

## ФАЗА 4 — Финал
1. Обновить `ARCHITECTURE.md`: убрать упоминания next-auth/аккаунтов/OAuth/ЮKassa; зафиксировать «бронь = заявка без аккаунта, оплата офлайн, авторизация только админская».
2. Обновить этот файл: статус → «Выполнено».
3. Снять отметку активного плана в `CLAUDE.md`.

## Правила исполнения
- По фазам, по порядку. Между фазами — деплой/проверка, не копить.
- Деструктив (Фаза 3) — только с явного «да» пользователя и после бэкапа.
- Каждую фазу заканчивать грепом-верификацией из её пунктов.
