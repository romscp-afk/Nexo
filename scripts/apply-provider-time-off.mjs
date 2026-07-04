#!/usr/bin/env node
/** Apply supabase/add-provider-time-off.sql — Usage: npm run setup:provider-time-off */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'add-provider-time-off.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying provider time-off migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Provider time-off migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
