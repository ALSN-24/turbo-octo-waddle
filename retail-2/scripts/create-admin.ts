#!/usr/bin/env tsx
/**
 * scripts/create-admin.ts
 *
 * One-time setup script to create the first admin account.
 * Replaces the hardcoded INSERT in the SQL migration.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 *
 * The script reads credentials from env vars (or prompts interactively):
 *   ADMIN_EMAIL=admin@example.com
 *   ADMIN_PASSWORD=YourStrongPassword
 *   ADMIN_NAME="Admin User"
 *
 * Exits with code 1 if the email already exists.
 */

import '@/lib/env'
import { createUser } from '@/lib/auth'
import * as readline from 'readline'

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    if (hidden && process.stdout.isTTY) {
      process.stdout.write(question)
      process.stdin.setRawMode(true)
      let input = ''
      process.stdin.on('data', (char) => {
        const c = char.toString()
        if (c === '\n' || c === '\r') {
          process.stdin.setRawMode(false)
          process.stdout.write('\n')
          rl.close()
          resolve(input)
        } else if (c === '\u0003') {
          process.exit()
        } else if (c === '\u007f') {
          input = input.slice(0, -1)
        } else {
          input += c
        }
      })
    } else {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer)
      })
    }
  })
}

async function main() {
  console.log('\n🔧  Retail CRM — Admin Account Setup\n')

  const email    = process.env.ADMIN_EMAIL    ?? await prompt('Email:    ')
  const password = process.env.ADMIN_PASSWORD ?? await prompt('Password: ', true)
  const name     = process.env.ADMIN_NAME     ?? await prompt('Name:     ')

  if (!email || !password) {
    console.error('❌  Email and password are required.')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('❌  Password must be at least 8 characters.')
    process.exit(1)
  }

  try {
    const user = await createUser(email, password, name || undefined)
    console.log(`\n✅  Admin account created successfully.`)
    console.log(`    ID:    ${user.id}`)
    console.log(`    Email: ${user.email}`)
    console.log(`    Name:  ${user.name ?? '(none)'}`)
    console.log('\n    You can now log in at /auth/login\n')
    process.exit(0)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`\n❌  Failed to create admin: ${msg}\n`)
    process.exit(1)
  }
}

main()
