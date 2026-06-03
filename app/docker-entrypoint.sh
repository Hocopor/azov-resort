#!/bin/sh
set -e

echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Syncing admin user..."
node scripts/ensure-admin.js

echo "Starting Next.js..."
exec node server.js
