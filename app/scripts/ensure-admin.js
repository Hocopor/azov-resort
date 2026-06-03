#!/usr/bin/env node
// Runs on startup: upserts a single ADMIN user from env vars into the database.

const { PrismaClient } = require('@prisma/client')

async function main() {
  const login = process.env.ADMIN_LOGIN
  const passwordHash = process.env.ADMIN_PASSWORD_HASH

  if (!login || !passwordHash) {
    console.log('[ensure-admin] ADMIN_LOGIN or ADMIN_PASSWORD_HASH not set — skipping')
    return
  }

  // Use ADMIN_LOGIN as email if it looks like one, otherwise fall back to ADMIN_EMAIL
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const email = emailRegex.test(login) ? login : (process.env.ADMIN_EMAIL || login)

  const prisma = new PrismaClient()
  try {
    await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
        name: 'Администратор',
      },
      create: {
        email,
        name: 'Администратор',
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log('[ensure-admin] Admin user synced:', email)
  } catch (err) {
    console.error('[ensure-admin] Failed to sync admin user:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
