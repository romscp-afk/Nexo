#!/usr/bin/env node
/**
 * Apply supabase/update-cleaning-price.sql — set cleaning catalog rate to SGD 15/hr.
 * Usage: npm run setup:cleaning-price
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(root, '..', 'supabase', 'update-cleaning-price.sql'), 'utf8')

async function main() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)

  console.log('Updating cleaning catalog price to SGD 15/hr…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Done. services.base_price and provider_services.price_from set to 15 for cleaning-standard.')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  console.error('Or paste supabase/update-cleaning-price.sql into Supabase SQL Editor.')
  process.exit(1)
})
