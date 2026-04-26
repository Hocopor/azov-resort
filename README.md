# Azov Resort

Production deployment for the Azov Resort site on Ubuntu 24 with Docker Compose.

## Direct domain branch

This branch is intended for direct public deployment without Cloudflare Tunnel.

Traffic flow:

`Internet -> Caddy (80/443) -> Next.js app (internal Docker network) -> PostgreSQL (internal Docker network)`

Security defaults in this branch:

- only `80/tcp` and `443/tcp` are exposed by Docker
- PostgreSQL stays on an internal-only Docker network
- the Next.js container is not published directly to the internet
- HTTPS is terminated by Caddy with automatic certificates
- HTTP is redirected to HTTPS
- common security headers are enabled
- deploy script can configure UFW to allow only `OpenSSH`, `80/tcp`, `443/tcp`

## Required DNS

Point your domain to the VPS before deployment:

- `A` record for `your-domain.ru` -> your VPS IPv4
- optionally `AAAA` record -> your VPS IPv6

The DNS record must resolve directly to the server because this branch does not use Cloudflare Tunnel.

## Environment

Copy and fill the env file:

```bash
cp .env.example .env
```

Important variables:

- `APP_DOMAIN=your-domain.ru`
- `NEXTAUTH_URL=https://your-domain.ru`
- `NEXT_PUBLIC_SITE_URL=https://your-domain.ru`
- `POSTGRES_PASSWORD=...`
- `NEXTAUTH_SECRET=...`
- `ADMIN_EMAIL=...`

Generate a strong auth secret:

```bash
openssl rand -base64 32
```

## Deploy on Ubuntu 24

Run as root for the safest setup because the script can also configure the firewall:

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

What the script does:

- installs Docker if needed
- installs Docker Compose plugin if needed
- installs UFW if needed
- validates domain-related environment variables
- configures firewall rules for `OpenSSH`, `80/tcp`, `443/tcp`
- builds the app with plain logs
- starts `postgres`, `app`, `caddy`
- waits for PostgreSQL
- runs Prisma migrations
- runs seed
- streams logs to console and files

## Useful commands

Build logs:

```bash
docker compose --progress=plain build --no-cache app 2>&1 | tee logs/logs-build-app.log
```

Start stack:

```bash
docker compose up -d 2>&1 | tee logs/logs-up.log
```

App logs:

```bash
docker compose logs -f app 2>&1 | tee logs/logs-runtime.log
```

Proxy logs:

```bash
docker compose logs -f caddy
```

Apply Prisma schema if needed:

```bash
docker compose exec -T app ./node_modules/.bin/prisma db push
```

## Docker services

- `postgres` - PostgreSQL 16
- `app` - Next.js application
- `caddy` - reverse proxy with HTTPS

## Notes

- Uploaded media is stored in the `uploads` Docker volume.
- Caddy certificates are stored in `caddy_data`.
- If you change the domain, also update OAuth redirect URLs and payment webhooks.
