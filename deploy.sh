#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  printf "%b[ok]%b %s\n" "$GREEN" "$NC" "$1"
}

warn() {
  printf "%b[warn]%b %s\n" "$YELLOW" "$NC" "$1"
}

info() {
  printf "%b[..]%b %s\n" "$BLUE" "$NC" "$1"
}

fail() {
  printf "%b[err]%b %s\n" "$RED" "$NC" "$1" >&2
  exit 1
}

trap 'warn "Deployment failed. Check logs in ./logs"; exit 1' ERR

COMPOSE_ARGS=()
LOG_SERVICES=(postgres app)
LOG_DIR="$ROOT_DIR/logs"
BUILD_LOG="$LOG_DIR/logs-build-app.log"
UP_LOG="$LOG_DIR/logs-up.log"
MIGRATE_LOG="$LOG_DIR/logs-migrate.log"
SEED_LOG="$LOG_DIR/logs-seed.log"
STATUS_LOG="$LOG_DIR/logs-status.log"
RUNTIME_LOG="$LOG_DIR/logs-runtime.log"

print_banner() {
  echo "Azov Resort deployment"
  echo "======================"
}

ensure_log_dir() {
  mkdir -p "$LOG_DIR"
  log "Logs directory: $LOG_DIR"
}

run_logged() {
  local log_file="$1"
  shift

  info "Running: $*"
  (
    set -o pipefail
    "$@" 2>&1 | tee "$log_file"
  )
}

ensure_env_file() {
  if [[ -f .env ]]; then
    return
  fi

  cp .env.example .env
  fail ".env was missing. A fresh .env has been created from .env.example. Fill it in and run deploy.sh again."
}

ensure_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    fail "Run deploy.sh as root on the VPS."
  fi
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed: $(docker --version)"
    return
  fi

  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  log "Docker installed"
}

ensure_compose() {
  if docker compose version >/dev/null 2>&1; then
    log "Docker Compose already installed: $(docker compose version)"
    return
  fi

  info "Installing Docker Compose plugin..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
  log "Docker Compose plugin installed"
}

load_env() {
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
}

validate_env() {
  local required_vars=(
    POSTGRES_PASSWORD
    NEXTAUTH_SECRET
    NEXT_PUBLIC_SITE_URL
    ADMIN_EMAIL
  )

  local optional_warn_vars=(
    YOOKASSA_SHOP_ID
    YOOKASSA_SECRET_KEY
    SMTP_HOST
    SMTP_USER
    SMTP_PASSWORD
  )

  local missing=()
  local var_name

  for var_name in "${required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      missing+=("$var_name")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    fail "Missing required values in .env: ${missing[*]}"
  fi

  for var_name in "${optional_warn_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      warn "Optional variable $var_name is empty"
    fi
  done

  if [[ -z "${DATABASE_URL:-}" ]]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER:-azov_user}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-azov_resort}"
    info "DATABASE_URL was not set explicitly. Using compose internal URL."
  fi

  if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
    COMPOSE_ARGS+=(--profile tunnel)
    LOG_SERVICES+=(cloudflared)
    log "Cloudflare tunnel profile enabled"
  else
    warn "CLOUDFLARE_TUNNEL_TOKEN is empty, deploy will start without cloudflared"
  fi

  log ".env validated"
}

compose_config_check() {
  docker compose "${COMPOSE_ARGS[@]}" config >/dev/null
  log "docker compose config is valid"
}

prepare_dirs() {
  mkdir -p postgres/init
  log "Required directories are ready"
}

rebuild_stack() {
  info "Stopping previous containers..."
  docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans || true

  info "Pulling external images..."
  if [[ " ${COMPOSE_ARGS[*]} " == *" --profile tunnel "* ]]; then
    docker compose "${COMPOSE_ARGS[@]}" pull cloudflared || true
  fi

  info "Building app image with plain progress output..."
  run_logged "$BUILD_LOG" docker compose "${COMPOSE_ARGS[@]}" build --no-cache --progress=plain app

  info "Starting containers..."
  run_logged "$UP_LOG" docker compose "${COMPOSE_ARGS[@]}" up -d --remove-orphans

  log "Containers started"
}

wait_for_postgres() {
  info "Waiting for PostgreSQL healthcheck..."
  local retries=60

  until docker compose "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER:-azov_user}" -d "${POSTGRES_DB:-azov_resort}" >/dev/null 2>&1; do
    retries=$((retries - 1))
    if (( retries == 0 )); then
      fail "PostgreSQL did not become ready in time"
    fi
    sleep 2
  done

  log "PostgreSQL is ready"
}

run_migrations() {
  info "Running Prisma migrations..."
  run_logged "$MIGRATE_LOG" docker compose "${COMPOSE_ARGS[@]}" exec -T app npx prisma migrate deploy
  log "Prisma migrations applied"
}

seed_if_needed() {
  info "Checking whether seed data is needed..."

  local has_users_table
  has_users_table="$(
    docker compose "${COMPOSE_ARGS[@]}" exec -T postgres psql \
      -U "${POSTGRES_USER:-azov_user}" \
      -d "${POSTGRES_DB:-azov_resort}" \
      -tAc "SELECT to_regclass('public.users') IS NOT NULL;" 2>/dev/null | tr -d '[:space:]'
  )"

  if [[ "$has_users_table" != "t" ]]; then
    warn "users table is not available yet, skipping seed"
    return
  fi

  local admin_count
  admin_count="$(
    docker compose "${COMPOSE_ARGS[@]}" exec -T postgres psql \
      -U "${POSTGRES_USER:-azov_user}" \
      -d "${POSTGRES_DB:-azov_resort}" \
      -tAc "SELECT COUNT(*) FROM users WHERE role = 'ADMIN';" 2>/dev/null | tr -d '[:space:]'
  )"

  if [[ "${admin_count:-0}" != "0" ]]; then
    log "Admin user already exists, seed skipped"
    return
  fi

  info "Running seed..."
  run_logged "$SEED_LOG" docker compose "${COMPOSE_ARGS[@]}" exec -T app npx tsx prisma/seed.ts
  log "Seed completed"
}

show_status() {
  run_logged "$STATUS_LOG" docker compose "${COMPOSE_ARGS[@]}" ps
}

show_summary() {
  echo
  echo "======================"
  log "Deployment completed"
  echo
  docker compose "${COMPOSE_ARGS[@]}" ps
  echo
  echo "Admin URL: ${NEXT_PUBLIC_SITE_URL}/admin"
  echo "Admin email: ${ADMIN_EMAIL}"
  echo
  echo "Useful commands:"
  echo "  docker compose build --no-cache --progress=plain app 2>&1 | tee logs/logs-build-app.log"
  echo "  docker compose up -d 2>&1 | tee logs/logs-up.log"
  echo "  docker compose logs -f app 2>&1 | tee logs/logs-runtime.log"
  echo
  echo "Log files:"
  echo "  $BUILD_LOG"
  echo "  $UP_LOG"
  echo "  $MIGRATE_LOG"
  echo "  $SEED_LOG"
  echo "  $STATUS_LOG"
  echo "  $RUNTIME_LOG"
}

stream_logs() {
  echo
  info "Streaming container logs. Press Ctrl+C to stop watching; containers will keep running."
  (
    set -o pipefail
    docker compose "${COMPOSE_ARGS[@]}" logs -f --tail=100 "${LOG_SERVICES[@]}" 2>&1 | tee "$RUNTIME_LOG"
  )
}

main() {
  print_banner
  ensure_log_dir
  ensure_root
  ensure_env_file
  ensure_docker
  ensure_compose
  load_env
  validate_env
  compose_config_check
  prepare_dirs
  rebuild_stack
  wait_for_postgres
  run_migrations
  seed_if_needed
  show_status
  show_summary
  stream_logs
}

main "$@"
