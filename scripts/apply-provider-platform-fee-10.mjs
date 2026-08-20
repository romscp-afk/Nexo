#!/usr/bin/env node
/** Apply supabase/fix-provider-platform-fee-10.sql — Usage: npm run setup:provider-platform-fee-10 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'fix-provider-platform-fee-10.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying provider platform fee (10% per job)…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Provider platform fee migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
