#!/usr/bin/env node
/** Apply supabase/fix-booking-broadcast-all-providers.sql — Usage: npm run setup:booking-broadcast */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'fix-booking-broadcast-all-providers.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying broadcast-all-providers booking migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Broadcast-all-providers booking migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
