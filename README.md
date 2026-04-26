# Azov Resort

Production deployment for the Azov Resort site on Ubuntu 24 with Docker Compose.

## Shared reverse proxy branch

This branch is intended for direct public deployment without Cloudflare Tunnel and without grabbing `80/443` inside its own Compose stack.

Traffic flow:

`Internet -> host Caddy/Nginx on VPS -> VPS:APP_PORT -> Next.js app container -> PostgreSQL container`

This avoids conflicts with neighbor sites on the same VPS, because this project does not occupy `80/443` and uses its own dedicated upstream port such as `4181`.

## Security model

- Docker exposes the app on its own dedicated host port `${APP_PORT}`
- PostgreSQL stays on an internal-only Docker network
- the Next.js app is never published directly to the internet
- the host reverse proxy handles HTTPS certificates and domain routing
- deploy script can configure UFW to allow only `OpenSSH`, `80/tcp`, `443/tcp`
- external access to `${APP_PORT}` is blocked by UFW defaults

## Required DNS

Point your domain to the VPS:

- `A` record for `your-domain.ru` -> your VPS IPv4
- optionally `AAAA` record -> your VPS IPv6

## Environment

Copy and fill the env file:

```bash
cp .env.example .env
```

Important variables:

- `APP_DOMAIN=your-domain.ru`
- `APP_PORT=4181`
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

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

What the script does:

- installs Docker if needed
- installs Docker Compose plugin if needed
- installs UFW if needed
- validates domain and port environment variables
- configures firewall rules for `OpenSSH`, `80/tcp`, `443/tcp`
- builds the app with plain logs
- starts `postgres` and `app`
- waits for PostgreSQL
- runs Prisma migrations
- runs seed
- streams logs to console and files

## Reverse proxy on the host

This branch expects an existing host-level Caddy or Nginx.

Ready-made examples:

- Caddy: `ops/caddy/azov-resort.Caddyfile.example`
- Nginx: `ops/nginx/azov-resort.conf.example`

For Caddy, point the domain to the app:

```caddyfile
your-domain.ru {
  reverse_proxy 127.0.0.1:4181
}
```

If another project already uses `4180`, keep this one on `4181` or choose another free host port.

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

Apply Prisma schema if needed:

```bash
docker compose exec -T app ./node_modules/.bin/prisma db push
```

## Docker services

- `postgres` - PostgreSQL 16
- `app` - Next.js application bound to its own host port

## Notes

- Uploaded media is stored in the `uploads` Docker volume.
- If you change the domain, also update OAuth redirect URLs and payment webhooks.
- If you change `APP_PORT`, update the host Caddy/Nginx upstream too.
