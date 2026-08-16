#!/usr/bin/env node
/**
 * Apply supabase/schema.sql to a remote Supabase project.
 * Prefers direct Postgres (SUPABASE_DB_PASSWORD or SUPABASE_DB_URL).
 * Falls back to Supabase Management API (SUPABASE_ACCESS_TOKEN).
 *
 * Usage: node scripts/apply-schema.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dns from 'node:dns'
import pg from 'pg'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

// Supabase direct DB host is IPv6-only; prefer IPv6 when resolving hostnames.
dns.setDefaultResultOrder('ipv6first')

const root = dirname(fileURLToPath(import.meta.url))
const fileEnv = loadEnv()

function env(name) {
  return fileEnv[name] ?? process.env[name]
}

const projectRef = env('VITE_SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const password = env('SUPABASE_DB_PASSWORD')

if (!projectRef) {
  console.error('Missing VITE_SUPABASE_URL in .env')
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

const poolerRegions = [
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-south-1',
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
]

for (const aws of ['aws-0', 'aws-1']) {
  for (const region of poolerRegions) {
    for (const port of [6543, 5432]) {
      candidates.push(
        `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${aws}-${region}.pooler.supabase.com:${port}/postgres`,
      )
    }
  }
}

const sql = readFileSync(join(root, '..', 'supabase', 'schema.sql'), 'utf8')

if (!password && !env('SUPABASE_DB_URL') && !env('SUPABASE_POOLER_URL')) {
  const accessToken = env('SUPABASE_ACCESS_TOKEN')
  if (accessToken) {
    try {
      console.log('Applying schema via Supabase Management API…')
      const token = requireAccessToken(fileEnv)
      await supabaseApi(token, '/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      })
      console.log('Schema applied successfully.')
      process.exit(0)
    } catch (err) {
      console.error('Failed:', err.message)
      process.exit(1)
    }
  }
  console.error('Missing SUPABASE_DB_PASSWORD. Add your database password to .env')
  console.error('Find it in Supabase Dashboard → Project Settings → Database')
  console.error('Or set SUPABASE_ACCESS_TOKEN to apply via the Management API.')
  process.exit(1)
}

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

const accessToken = env('SUPABASE_ACCESS_TOKEN')
if (accessToken) {
  try {
    console.log('Trying Supabase Management API…')
    const token = requireAccessToken(fileEnv)
    await supabaseApi(token, '/database/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    })
    console.log('Schema applied successfully via Management API.')
    process.exit(0)
  } catch (err) {
    console.error('Management API failed:', err.message)
  }
}

console.error('Copy the URI from Supabase Dashboard → Project Settings → Database')
console.error('and set SUPABASE_DB_URL in .env, then rerun this script.')
console.error('Or set SUPABASE_ACCESS_TOKEN and rerun, or paste supabase/schema.sql into the SQL Editor.')
if (lastError) process.exit(1)
