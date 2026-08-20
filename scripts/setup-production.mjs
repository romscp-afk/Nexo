#!/usr/bin/env node
/**
 * Apply all Nexo marketplace SQL migrations in order.
 * Safe to re-run — migrations use IF NOT EXISTS / OR REPLACE.
 *
 * Usage: npm run setup:production
 * Requires SUPABASE_ACCESS_TOKEN in .env
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const steps = [
  ['setup:pricing', 'Pricing units + platform fee'],
  ['setup:open-bookings', 'Open booking requests (nullable provider_id)'],
  ['setup:customer-platform-fee', 'Customer PayNow includes platform fee'],
  ['setup:provider-platform-fee-10', 'Provider 10% platform fee; hide customer fee'],
  ['setup:customer-flow', 'Customer flow + chat messages'],
  ['setup:booking-chat', 'Chat access rules'],
  ['setup:booking-lifecycle', 'Job start/complete notifications + chat cash fix'],
  ['setup:booking-chat-inbox', 'Chat inbox + read receipts'],
  ['setup:booking-chat-realtime', 'Realtime chat'],
  ['setup:admin-chat-email', 'Admin chat + email dispatch'],
  ['setup:provider-availability', 'Provider weekly hours'],
  ['setup:provider-time-off', 'Provider blocked dates'],
  ['setup:booking-whatsapp', 'WhatsApp booking alerts'],
]

console.log('Nexo production setup — applying migrations…\n')

for (const [script, label] of steps) {
  console.log(`→ ${label} (${script})`)
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', env: process.env })
  if (result.status !== 0) {
    console.error(`\nFailed at: ${script}`)
    process.exit(result.status ?? 1)
  }
  console.log('')
}

console.log('Migrations complete.')
console.log('')
console.log('Next (optional — requires secrets in .env):')
console.log('  npm run deploy:chat-email')
console.log('  npm run deploy:booking-whatsapp')
console.log('  npm run deploy:whatsapp-otp')
console.log('  npm run setup:chat-email-resend   # if RESEND_API_KEY set')
