#!/usr/bin/env node
/**
 * Remove demo/sample accounts and their bookings. Keeps real registered users.
 *
 * Usage: npm run clear:sample-data
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'clear-sample-data.sql'), 'utf8')

async function main() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)

  console.log('Removing demo/sample accounts and related data…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Done. Demo accounts removed; registered users and catalog unchanged.')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  console.error('Or paste supabase/clear-sample-data.sql into Supabase SQL Editor.')
  process.exit(1)
})
