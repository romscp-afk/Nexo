#!/usr/bin/env node
/**
 * Apply supabase/schema.sql to a remote Supabase project.
 * Requires SUPABASE_DB_PASSWORD in .env or environment.
 *
 * Usage: node scripts/apply-schema.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')
const envText = readFileSync(envPath, 'utf8')

function env(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match?.[1]?.trim() ?? process.env[name]
}

const projectRef = env('VITE_SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const password = env('SUPABASE_DB_PASSWORD') ?? process.env.SUPABASE_DB_PASSWORD

if (!projectRef) {
  console.error('Missing VITE_SUPABASE_URL in .env')
  process.exit(1)
}

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD. Add your database password to .env')
  console.error('Find it in Supabase Dashboard → Project Settings → Database')
  process.exit(1)
}

const connectionString =
  env('SUPABASE_DB_URL') ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`

const sql = readFileSync(join(root, '..', 'supabase', 'schema.sql'), 'utf8')
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log('Connected. Applying schema…')
  await client.query(sql)
  console.log('Schema applied successfully.')
} catch (err) {
  console.error('Schema apply failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
