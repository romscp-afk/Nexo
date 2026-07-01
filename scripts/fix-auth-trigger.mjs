#!/usr/bin/env node
/**
 * Apply supabase/fix-auth-trigger.sql to fix signup "{}" errors.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dns from 'node:dns'
import pg from 'pg'

dns.setDefaultResultOrder('ipv6first')

const root = dirname(fileURLToPath(import.meta.url))
const envText = readFileSync(join(root, '..', '.env'), 'utf8')

function env(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match?.[1]?.trim() ?? process.env[name]
}

const projectRef = env('VITE_SUPABASE_URL')?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const password = env('SUPABASE_DB_PASSWORD') ?? process.env.SUPABASE_DB_PASSWORD

if (!projectRef || !password) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env')
  process.exit(1)
}

const sql = readFileSync(join(root, '..', 'supabase', 'fix-auth-trigger.sql'), 'utf8')
const candidates = [
  env('SUPABASE_DB_URL'),
  process.env.SUPABASE_DB_URL,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
].filter(Boolean)

for (const aws of ['aws-0', 'aws-1']) {
  for (const region of ['ap-southeast-1', 'us-east-1', 'eu-west-1']) {
    for (const port of [6543, 5432]) {
      candidates.push(
        `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${aws}-${region}.pooler.supabase.com:${port}/postgres`,
      )
    }
  }
}

for (const url of candidates) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Auth trigger fix applied successfully.')
    await client.end()
    process.exit(0)
  } catch (err) {
    try {
      await client.end()
    } catch {}
  }
}

console.error('Could not connect. Run supabase/fix-auth-trigger.sql in the Supabase SQL Editor.')
process.exit(1)
