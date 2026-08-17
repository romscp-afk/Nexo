#!/usr/bin/env node
/** Apply supabase/fix-payment-on-booking-created.sql — Usage: npm run setup:payment-on-booking-created */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'fix-payment-on-booking-created.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying payment-on-booking-created migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Payment-on-booking-created migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  console.error('Paste supabase/fix-payment-on-booking-created.sql into Supabase SQL Editor.')
  process.exit(1)
}
