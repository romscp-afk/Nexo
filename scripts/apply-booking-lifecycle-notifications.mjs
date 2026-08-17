#!/usr/bin/env node
/** Apply supabase/fix-booking-lifecycle-notifications.sql — Usage: npm run setup:booking-lifecycle */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'fix-booking-lifecycle-notifications.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying booking lifecycle notifications migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Booking lifecycle notifications migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
