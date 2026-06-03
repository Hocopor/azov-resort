#!/usr/bin/env node
// Usage: node scripts/hash-password.js YOUR_PASSWORD
// Outputs a bcrypt hash to paste into ADMIN_PASSWORD_HASH in .env

const bcrypt = require('bcryptjs')

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.js YOUR_PASSWORD')
  process.exit(1)
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n')
  console.log('Copy the line above into your .env file.')
})
