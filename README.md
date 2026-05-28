# Отдых на Азове (azov-resort)

## Описание
Платформа для бронирования номеров в гостевом доме, с административной панелью, отзывами, уведомлениями в ВК и интеграцией электронной почты.

## Структура репозитория

```
azov-resort/
├── app/              ← Весь Next.js код (Dockerfile, src/, prisma/, etc.)
├── caddy/            ← Конфиг Caddy (reverse proxy)
├── ops/              ← Операционные скрипты
├── postgres/         ← Init-скрипты для PostgreSQL
├── docker-compose.yml
├── deploy.sh         ← Скрипт полного деплоя (первый запуск)
└── .env              ← Переменные окружения (не в git)
```

> **Важно:** Весь исходный код приложения живёт в папке `app/`. Docker собирает образ именно из неё (`context: ./app`). Не переносите файлы из `app/` в корень репозитория.

---

## Деплой на сервер

### Первый запуск (полный деплой)
```bash
cd /srv/domiki/azov-resort
cp .env.example .env
nano .env   # заполните все переменные
bash deploy.sh
```

### Обновление после `git pull` (стандартная процедура)

```bash
# 1. Переходим в корень репозитория
cd /srv/domiki/azov-resort

# 2. Подтягиваем новый код
git fetch origin
git reset --hard origin/deploy/direct-domain-secure

# 3. Пересобираем и перезапускаем контейнер приложения
docker compose --progress=plain build --no-cache app 2>&1 | tee logs/logs-build-app.log

# 4. Перезапускаем контейнеры
docker compose up -d --force-recreate --remove-orphans

# 5. Применяем миграции БД (если были изменения схемы)
docker compose exec -T app ./node_modules/.bin/prisma migrate deploy

# 6. Проверяем статус
docker compose ps
docker compose logs --tail=50 app
```

### Если в схеме Prisma новые поля (без файлов миграций)
```bash
docker compose exec -T app ./node_modules/.bin/prisma db push
```

### Перезагрузить Caddy после правки конфига
```bash
sudo caddy reload --config /home/devops-agent/caddy/Caddyfile
```

### Просмотр логов приложения
```bash
docker compose logs -f app
```

---

## Локальная разработка

```bash
cd app
npm install
npx prisma db push
npm run dev
```

---

## Настройка переменных окружения

Создайте `.env` на основе `.env.example` в **корне репозитория**:

### База данных
- `POSTGRES_USER` — пользователь БД
- `POSTGRES_PASSWORD` — пароль БД (**обязательно**)
- `POSTGRES_DB` — название БД PostgreSQL

### Аутентификация (NextAuth)
- `NEXTAUTH_SECRET` — секретный ключ для шифрования сессий (**обязательно**)
- `NEXTAUTH_URL` — базовый URL сайта с https:// (**обязательно**)
- `NEXT_PUBLIC_SITE_URL` — публичный URL сайта (**обязательно**)

### OAuth провайдеры (опционально)
- `VK_CLIENT_ID` и `VK_CLIENT_SECRET` — авторизация через ВКонтакте
- `YANDEX_CLIENT_ID` и `YANDEX_CLIENT_SECRET` — авторизация через Яндекс

### SMTP почта
- `SMTP_HOST` — адрес SMTP-сервера
- `SMTP_PORT` — порт (587, 465 или 2525)
- `SMTP_USER` — логин (email)
- `SMTP_PASSWORD` — пароль
- `SMTP_FROM` — адрес отправителя

### Уведомления администратору
- `ADMIN_EMAIL` — email для уведомлений о новых бронированиях (**обязательно**)
- `VK_GROUP_TOKEN` — токен группы ВКонтакте для уведомлений
- `VK_ADMIN_ID` — ID страницы ВКонтакте администратора

### ЮКасса (оплата, опционально)
- `YOOKASSA_SHOP_ID` — ID магазина
- `YOOKASSA_SECRET_KEY` — секретный ключ
