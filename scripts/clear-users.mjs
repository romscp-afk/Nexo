#!/usr/bin/env node
/**
 * Clear all Nexo users, profiles, providers, bookings, and reviews for E2E testing.
 * Keeps service categories and catalog data.
 *
 * Usage: npm run clear:users
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'clear-users.sql'), 'utf8')

async function main() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)

  console.log('Clearing all users and related data…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Done. All users, roles, bookings, and reviews removed.')
  console.log('Service categories and catalog are unchanged.')
  console.log('Register fresh accounts at /register to test end-to-end.')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  console.error('Or paste supabase/clear-users.sql into Supabase SQL Editor.')
  process.exit(1)
})
