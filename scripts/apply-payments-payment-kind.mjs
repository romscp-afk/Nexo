#!/usr/bin/env node
/** Apply supabase/fix-payments-payment-kind.sql — Usage: npm run setup:payments-payment-kind */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'fix-payments-payment-kind.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying payments payment_kind fix…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('payments payment_kind fix applied.')
} catch (err) {
  console.error('Failed:', err.message)
  console.error('Paste supabase/fix-payments-payment-kind.sql into Supabase SQL Editor.')
  process.exit(1)
}
