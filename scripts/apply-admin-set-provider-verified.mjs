#!/usr/bin/env node
/** Apply supabase/add-admin-set-provider-verified.sql — Usage: npm run setup:admin-set-provider-verified */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'add-admin-set-provider-verified.sql'), 'utf8')

try {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying admin set provider verified migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Admin set provider verified migration applied.')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
