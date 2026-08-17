#!/usr/bin/env node
/**
 * Apply supabase/add-contact-messages.sql
 * Usage: npm run setup:contact-messages
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'add-contact-messages.sql'), 'utf8')

async function main() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)

  console.log('Applying contact messages migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Done. Public contact form can store messages; admins can read in portal.')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  console.error('Or paste supabase/add-contact-messages.sql into Supabase SQL Editor.')
  process.exit(1)
})
