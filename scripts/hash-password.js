#!/usr/bin/env node
// Usage: node scripts/hash-password.js YOUR_PASSWORD
// Outputs a bcrypt hash to paste into ADMIN_PASSWORD_HASH in .env

const path = require('path')

// bcryptjs lives inside app/node_modules (Docker build) or app/node_modules on host
let bcrypt
try {
  bcrypt = require('bcryptjs')
} catch {
  try {
    bcrypt = require(path.resolve(__dirname, '../app/node_modules/bcryptjs'))
  } catch {
    console.error('bcryptjs not found. Run this from inside the app container:')
    console.error("  docker exec azov_app node -e \"require('bcryptjs').hash(process.argv[1], 12).then(h => console.log('ADMIN_PASSWORD_HASH=' + h))\" -- YOUR_PASSWORD")
    process.exit(1)
  }
}

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.js YOUR_PASSWORD')
  process.exit(1)
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n')
  console.log('Paste the line above into your .env file, then restart the container.')
})
