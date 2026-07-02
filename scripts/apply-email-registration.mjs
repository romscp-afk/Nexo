#!/usr/bin/env node
/**
 * Apply supabase/restore-email-registration.sql (remove WhatsApp signup gate).
 * Usage: npm run setup:email-registration
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dns from 'node:dns'
import pg from 'pg'

dns.setDefaultResultOrder('ipv6first')

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')
const envText = readFileSync(envPath, 'utf8')

function env(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match?.[1]?.trim() ?? process.env[name]
}

const projectRef = env('VITE_SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const password = env('SUPABASE_DB_PASSWORD') ?? process.env.SUPABASE_DB_PASSWORD

if (!projectRef || !password) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env')
  console.error('Or paste supabase/restore-email-registration.sql into the SQL Editor.')
  process.exit(1)
}

const connectionString =
  env('SUPABASE_DB_URL') ??
  process.env.SUPABASE_DB_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`

const sql = readFileSync(join(root, '..', 'supabase', 'restore-email-registration.sql'), 'utf8')
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

try {
  await client.connect()
  console.log('Connected. Restoring email-only registration trigger…')
  await client.query(sql)
  console.log('Done.')
  await client.end()
} catch (err) {
  console.error('Failed:', err.message)
  console.error('Paste supabase/restore-email-registration.sql into Supabase SQL Editor.')
  process.exit(1)
}
