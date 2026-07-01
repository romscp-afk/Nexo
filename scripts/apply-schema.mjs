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
  process.env.SUPABASE_DB_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`

const poolerUrl =
  env('SUPABASE_POOLER_URL') ??
  process.env.SUPABASE_POOLER_URL

const candidates = [connectionString, poolerUrl].filter(Boolean)

const sql = readFileSync(join(root, '..', 'supabase', 'schema.sql'), 'utf8')

let lastError = null
for (const url of candidates) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    console.log('Connected. Applying schema…')
    await client.query(sql)
    console.log('Schema applied successfully.')
    await client.end()
    process.exit(0)
  } catch (err) {
    lastError = err
    console.error(`Connection failed (${url.split('@')[1] ?? url}):`, err.message)
    try {
      await client.end()
    } catch {}
  }
}

console.error('\nCould not connect to Postgres.')
console.error('Copy the URI from Supabase Dashboard → Project Settings → Database')
console.error('and set SUPABASE_DB_URL in .env, then rerun this script.')
console.error('Or paste supabase/schema.sql into the SQL Editor and run it there.')
if (lastError) process.exit(1)
