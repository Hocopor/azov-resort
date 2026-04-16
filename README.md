# 🌊 Гостевой дом на Азовском море — Сайт

Полнофункциональный сайт для гостевого дома с онлайн-бронированием, оплатой через ЮКассу, личными кабинетами и панелью администратора.

---

## 🚀 Быстрый старт

### 1. Клонируйте и настройте переменные окружения

```bash
cp .env.example .env
nano .env   # Заполните все переменные
```

### 2. Запустите деплой (на VPS Ubuntu 24)

```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- Установит Docker (если не установлен)
- Соберёт приложение
- Запустит все контейнеры
- Применит миграции БД
- Создаст начальные данные

---

## ⚙️ Настройка переменных окружения `.env`

| Переменная | Описание |
|---|---|
| `POSTGRES_PASSWORD` | Пароль БД (сгенерируйте случайный) |
| `NEXTAUTH_SECRET` | Секрет для сессий (`openssl rand -base64 32`) |
| `CLOUDFLARE_TUNNEL_TOKEN` | Токен из Cloudflare Zero Trust → Tunnels |
| `NEXT_PUBLIC_SITE_URL` | Полный URL сайта (https://ваш-домен.ru) |
| `VK_CLIENT_ID` / `VK_CLIENT_SECRET` | OAuth ВКонтакте |
| `YANDEX_CLIENT_ID` / `YANDEX_CLIENT_SECRET` | OAuth Яндекс |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | ЮКасса |
| `SMTP_*` | SMTP для email-уведомлений |
| `ADMIN_EMAIL` | Email первого администратора |

---

## 🔧 Настройка внешних сервисов

### Cloudflare Tunnel
1. Зайдите в [Cloudflare Zero Trust](https://one.dash.cloudflare.com)
2. Перейдите в **Access → Tunnels → Create Tunnel**
3. Скопируйте токен в `.env` → `CLOUDFLARE_TUNNEL_TOKEN`
4. В конфигурации туннеля добавьте роут:
   - **Service**: `http://app:3002`
   - **Domain**: ваш домен

### ЮКасса
1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Получите `shopId` и `secretKey`
3. В настройках ЮКассы укажите Webhook URL: `https://ваш-домен/api/payments/webhook`
4. Выберите события: `payment.succeeded`, `payment.canceled`

### OAuth ВКонтакте
1. Создайте приложение на [vk.com/editapp](https://vk.com/editapp?act=create) (тип: Веб-сайт)
2. Redirect URI: `https://ваш-домен/api/auth/callback/vk`

### OAuth Яндекс
1. Создайте приложение на [oauth.yandex.ru](https://oauth.yandex.ru)
2. Redirect URI: `https://ваш-домен/api/auth/callback/yandex`
3. Права: `login:email`, `login:info`, `login:avatar`

### SMTP (email)
Для Яндекс.Почты:
- Включите «Пароли приложений» в настройках аккаунта
- `SMTP_HOST=smtp.yandex.ru`, `SMTP_PORT=587`

---

## 📁 Структура проекта

```
azov-resort/
├── docker-compose.yml       # Оркестрация контейнеров
├── .env.example             # Шаблон переменных окружения
├── deploy.sh                # Скрипт деплоя
└── app/
    ├── Dockerfile
    ├── prisma/
    │   ├── schema.prisma    # Схема БД
    │   └── seed.ts          # Начальные данные
    └── src/
        ├── app/             # Next.js App Router
        │   ├── (public)/    # Публичные страницы
        │   ├── admin/       # Панель управления
        │   ├── account/     # Личный кабинет
        │   ├── auth/        # Авторизация
        │   └── api/         # API роуты
        ├── components/      # React-компоненты
        └── lib/             # Утилиты (DB, auth, email, payment)
```

---

## 🗂️ Страницы сайта

| URL | Описание |
|---|---|
| `/` | Главная |
| `/rooms` | Список номеров |
| `/rooms/[slug]` | Карточка номера + бронирование |
| `/blog` | Лента «Обстановка» |
| `/services` | Услуги (включается в админке) |
| `/account` | Личный кабинет |
| `/account/bookings` | Мои брони |
| `/admin` | Дашборд администратора |
| `/admin/bookings` | Управление бронями |
| `/admin/rooms` | Управление номерами |
| `/admin/blog` | Редактор блога |
| `/admin/users` | Пользователи |
| `/admin/settings` | Настройки сайта |
| `/legal/privacy` | Политика конфиденциальности |
| `/legal/terms` | Пользовательское соглашение |
| `/legal/booking-terms` | Условия бронирования |

---

## 🛠️ Управление

### Просмотр логов
```bash
docker compose logs -f          # Все логи
docker compose logs -f app      # Только приложение
docker compose logs -f postgres # Только БД
```

### Перезапуск
```bash
docker compose restart app
```

### Обновление приложения
```bash
git pull
docker compose build --no-cache app
docker compose up -d app
```

### Prisma Studio (GUI для БД)
```bash
docker compose exec app npx prisma studio
```

### Ручное создание резервной копии БД
```bash
docker compose exec postgres pg_dump -U azov_user azov_resort > backup_$(date +%Y%m%d).sql
```

---

## 📂 Загрузка изображений

После деплоя добавьте изображения в директорию `app/public/`:

```
public/
├── images/
│   ├── general/
│   │   ├── hero-bg.jpg        # Фото для главного экрана (1920×1080)
│   │   ├── og-image.jpg       # Open Graph (1200×630)
│   │   ├── about-1.jpg        # Фото для раздела "О нас" (4 шт.)
│   │   ├── about-2.jpg
│   │   ├── about-3.jpg
│   │   └── about-4.jpg
│   └── rooms/
│       ├── room-1-1.jpg       # Номер 1, фото 1
│       ├── room-1-2.jpg       # Номер 1, фото 2
│       └── ...                # Аналогично для номеров 2–7
└── icons/
    ├── favicon.ico
    └── apple-touch-icon.png
```

Изображения номеров можно также управлять через интерфейс (в будущем).

---

## 🔐 Безопасность

- Пароли хранятся в зашифрованном виде (bcrypt, 12 rounds)
- JWT токены для сессий с проверкой роли при каждом запросе
- Все admin-роуты защищены middleware
- Soft delete пользователей
- CSRF защита через NextAuth
- Webhook ЮКассы верифицируется через API
- Rate limiting на загрузку файлов

---

## 📊 Метрики и аналитика

В панели администратора (`/admin`) доступны:
- Воронка конверсии: просмотры → начало брони → оплата
- Статистика броней за 30 дней
- Занятость номеров
- Сегодняшние заезды и выезды
- Выручка (депозиты) за период

---

## 🤝 Техническая поддержка

При возникновении проблем проверьте логи:
```bash
docker compose logs --tail=100 app
```
