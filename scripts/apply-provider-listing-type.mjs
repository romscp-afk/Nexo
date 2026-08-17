#!/usr/bin/env node
/** Apply supabase/add-provider-listing-type.sql — Usage: npm run setup:provider-listing-type */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'add-provider-listing-type.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying provider listing type migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Provider listing type migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
