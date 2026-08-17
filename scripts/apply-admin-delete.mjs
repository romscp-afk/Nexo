#!/usr/bin/env node
/**
 * Apply supabase/add-admin-delete.sql (admin delete user / provider RPCs).
 * Usage: npm run setup:admin-delete
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'add-admin-delete.sql'), 'utf8')

async function main() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)

  console.log('Applying admin delete migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Done. Admins can remove users and providers from the dashboard.')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  console.error('Or paste supabase/add-admin-delete.sql into Supabase SQL Editor.')
  process.exit(1)
})
