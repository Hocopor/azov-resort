#!/bin/bash
set -e

echo "🌊 Деплой гостевого дома на Азовском море"
echo "========================================="

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Проверка .env
if [ ! -f ".env" ]; then
  warn ".env не найден. Копирую из .env.example..."
  cp .env.example .env
  err "Заполните .env файл и запустите скрипт снова"
fi

# Проверка Docker
if ! command -v docker &> /dev/null; then
  log "Устанавливаю Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  log "Устанавливаю Docker Compose..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
fi

log "Docker установлен: $(docker --version)"

# Проверка обязательных переменных
source .env
REQUIRED_VARS=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "CLOUDFLARE_TUNNEL_TOKEN" "NEXT_PUBLIC_SITE_URL")
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    err "Переменная $VAR не задана в .env"
  fi
done
log "Все обязательные переменные заданы"

# Создание директорий
mkdir -p postgres/init
log "Директории созданы"

# Сборка и запуск
log "Собираю и запускаю контейнеры..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose pull cloudflared 2>/dev/null || true
docker compose build --no-cache app
docker compose up -d

# Ждём базу данных
log "Жду запуска PostgreSQL..."
sleep 5
RETRIES=20
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-azov_user}" -d "${POSTGRES_DB:-azov_resort}" &>/dev/null || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES-1))
  sleep 2
done
[ $RETRIES -eq 0 ] && err "PostgreSQL не запустился"
log "PostgreSQL запущен"

# Запускаем миграции и seed
log "Запускаю миграции и seed..."
sleep 5
docker compose exec -T app npx prisma migrate deploy || warn "Миграции уже применены или произошла ошибка"

# Проверяем seed
ADMIN_EXISTS=$(docker compose exec -T postgres psql -U "${POSTGRES_USER:-azov_user}" -d "${POSTGRES_DB:-azov_resort}" -tAc "SELECT COUNT(*) FROM users WHERE role='ADMIN'" 2>/dev/null || echo "0")
if [ "$ADMIN_EXISTS" = "0" ]; then
  log "Создаю начальные данные (seed)..."
  docker compose exec -T app node -e "
    const { execSync } = require('child_process');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  " || warn "Seed выполнен с ошибками — возможно данные уже есть"
else
  log "Данные уже существуют, seed пропускается"
fi

echo ""
echo "========================================="
log "Деплой завершён успешно!"
echo ""
echo "  📊 Статус контейнеров:"
docker compose ps
echo ""
echo "  🔑 Данные для входа в админку:"
echo "  Email: ${ADMIN_EMAIL:-admin@example.com}"
echo "  URL:   ${NEXT_PUBLIC_SITE_URL}/admin"
echo ""
echo "  📋 Полезные команды:"
echo "  docker compose logs -f app     — логи приложения"
echo "  docker compose logs -f         — все логи"
echo "  docker compose restart app     — перезапуск приложения"
echo "  docker compose exec app npx prisma studio — Prisma Studio"
echo "========================================="
