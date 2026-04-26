#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED=0
COMPOSE_ARGS=()
LOG_SERVICES=(postgres app)
LOG_DIR="$ROOT_DIR/logs"
BUILD_LOG="$LOG_DIR/logs-build-app.log"
UP_LOG="$LOG_DIR/logs-up.log"
MIGRATE_LOG="$LOG_DIR/logs-migrate.log"
SEED_LOG="$LOG_DIR/logs-seed.log"
STATUS_LOG="$LOG_DIR/logs-status.log"
RUNTIME_LOG="$LOG_DIR/logs-runtime.log"

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

on_error() {
  local exit_code=$?

  if [[ "$FAILED" -eq 1 ]]; then
    exit "$exit_code"
  fi

  FAILED=1
  warn "Deployment failed. Check logs in ./logs"
  exit "$exit_code"
}

trap on_error ERR

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

ensure_docker_access() {
  if docker info >/dev/null 2>&1; then
    log "Docker access available for current user"
    return
  fi

  if [[ "${EUID}" -ne 0 ]]; then
    fail "No access to Docker. Run with sudo or add the user to the docker group."
  fi
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed: $(docker --version)"
    return
  fi

  if [[ "${EUID}" -ne 0 ]]; then
    fail "Docker is not installed. Re-run deploy.sh with sudo."
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

  if [[ "${EUID}" -ne 0 ]]; then
    fail "Docker Compose plugin is missing. Re-run deploy.sh with sudo."
  fi

  info "Installing Docker Compose plugin..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
  log "Docker Compose plugin installed"
}

ensure_ufw() {
  if command -v ufw >/dev/null 2>&1; then
    log "UFW already installed"
    return
  fi

  if [[ "${EUID}" -ne 0 ]]; then
    warn "UFW is not installed and deploy.sh is not running as root. Firewall setup will be skipped."
    return
  fi

  info "Installing UFW..."
  apt-get update -qq
  apt-get install -y ufw
  log "UFW installed"
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
    NEXTAUTH_URL
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

  if [[ -z "${APP_DOMAIN:-}" ]]; then
    APP_DOMAIN="${NEXT_PUBLIC_SITE_URL#https://}"
    APP_DOMAIN="${APP_DOMAIN#http://}"
    APP_DOMAIN="${APP_DOMAIN%%/*}"
    export APP_DOMAIN
    info "APP_DOMAIN was not set explicitly. Using ${APP_DOMAIN}."
  fi

  if [[ -z "${APP_NETWORK_SUBNET:-}" ]]; then
    APP_NETWORK_SUBNET="172.31.250.0/24"
    export APP_NETWORK_SUBNET
    info "APP_NETWORK_SUBNET was not set explicitly. Using ${APP_NETWORK_SUBNET}."
  fi

  if [[ -z "${APP_UPSTREAM_IP:-}" ]]; then
    APP_UPSTREAM_IP="172.31.250.10"
    export APP_UPSTREAM_IP
    info "APP_UPSTREAM_IP was not set explicitly. Using ${APP_UPSTREAM_IP}."
  fi

  if [[ -z "${POSTGRES_UPSTREAM_IP:-}" ]]; then
    POSTGRES_UPSTREAM_IP="172.31.250.11"
    export POSTGRES_UPSTREAM_IP
    info "POSTGRES_UPSTREAM_IP was not set explicitly. Using ${POSTGRES_UPSTREAM_IP}."
  fi

  if [[ "${NEXTAUTH_URL}" != https://* ]]; then
    fail "NEXTAUTH_URL must start with https:// for direct secure deployment."
  fi

  if [[ "${NEXT_PUBLIC_SITE_URL}" != https://* ]]; then
    fail "NEXT_PUBLIC_SITE_URL must start with https:// for direct secure deployment."
  fi

  local nextauth_host="${NEXTAUTH_URL#https://}"
  nextauth_host="${nextauth_host%%/*}"
  local public_host="${NEXT_PUBLIC_SITE_URL#https://}"
  public_host="${public_host%%/*}"

  if [[ "$nextauth_host" != "$APP_DOMAIN" ]]; then
    fail "NEXTAUTH_URL host ($nextauth_host) must match APP_DOMAIN ($APP_DOMAIN)."
  fi

  if [[ "$public_host" != "$APP_DOMAIN" ]]; then
    fail "NEXT_PUBLIC_SITE_URL host ($public_host) must match APP_DOMAIN ($APP_DOMAIN)."
  fi

  if [[ "${APP_UPSTREAM_IP}" == "${POSTGRES_UPSTREAM_IP}" ]]; then
    fail "APP_UPSTREAM_IP and POSTGRES_UPSTREAM_IP must be different."
  fi

  log ".env validated"
}

configure_firewall() {
  if ! command -v ufw >/dev/null 2>&1; then
    warn "UFW is unavailable. Skipping firewall configuration."
    return
  fi

  if [[ "${EUID}" -ne 0 ]]; then
    warn "Not running as root. Skipping firewall configuration."
    return
  fi

  info "Configuring UFW firewall..."
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force default deny incoming >/dev/null
  ufw --force default allow outgoing >/dev/null
  ufw --force enable >/dev/null 2>&1 || true
  log "Firewall configured: OpenSSH, 80/tcp, 443/tcp allowed"
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

  info "Building app image with plain progress output..."
  run_logged "$BUILD_LOG" docker compose "${COMPOSE_ARGS[@]}" --progress=plain build --no-cache app

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

has_prisma_migrations() {
  local migrations_dir="$ROOT_DIR/app/prisma/migrations"

  if [[ ! -d "$migrations_dir" ]]; then
    return 1
  fi

  find "$migrations_dir" -mindepth 1 -maxdepth 1 | grep -q .
}

run_migrations() {
  if has_prisma_migrations; then
    info "Running Prisma migrations..."
    run_logged "$MIGRATE_LOG" docker compose "${COMPOSE_ARGS[@]}" exec -T app ./node_modules/.bin/prisma migrate deploy
    log "Prisma migrations applied"
    return
  fi

  warn "Prisma migrations are missing or empty. Applying schema with prisma db push for first-run setup."
  run_logged "$MIGRATE_LOG" docker compose "${COMPOSE_ARGS[@]}" exec -T app ./node_modules/.bin/prisma db push
  log "Prisma schema pushed to database"
}

run_seed() {
  info "Running seed..."
  run_logged "$SEED_LOG" docker compose "${COMPOSE_ARGS[@]}" exec -T app node prisma/seed-runtime.js
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
  echo "Static upstream for host reverse proxy: ${APP_UPSTREAM_IP}:3000"
  echo
  echo "Useful commands:"
  echo "  docker compose --progress=plain build --no-cache app 2>&1 | tee logs/logs-build-app.log"
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
  ensure_env_file
  ensure_docker
  ensure_compose
  ensure_ufw
  ensure_docker_access
  load_env
  validate_env
  configure_firewall
  compose_config_check
  prepare_dirs
  rebuild_stack
  wait_for_postgres
  run_migrations
  run_seed
  show_status
  show_summary
  stream_logs
}

main "$@"
