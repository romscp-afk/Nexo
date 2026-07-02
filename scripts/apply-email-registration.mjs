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
import { loadEnv, projectRef, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

dns.setDefaultResultOrder('ipv6first')

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')
const envText = readFileSync(envPath, 'utf8')

function env(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match?.[1]?.trim() ?? process.env[name]
}

const password = env('SUPABASE_DB_PASSWORD') ?? process.env.SUPABASE_DB_PASSWORD
const sql = readFileSync(join(root, '..', 'supabase', 'restore-email-registration.sql'), 'utf8')

async function applyViaManagementApi() {
  const fileEnv = loadEnv()
  const token = requireAccessToken(fileEnv)
  console.log('Applying via Supabase Management API…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Email registration trigger restored.')
}

async function applyViaPg() {
  if (!password) throw new Error('Missing SUPABASE_DB_PASSWORD')

  const connectionString =
    env('SUPABASE_DB_URL') ??
    process.env.SUPABASE_DB_URL ??
    `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`

  const candidates = [connectionString]
  for (const aws of ['aws-0', 'aws-1']) {
    for (const region of ['ap-southeast-1', 'ap-southeast-2', 'us-east-1', 'eu-west-1']) {
      for (const port of [6543, 5432]) {
        candidates.push(
          `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${aws}-${region}.pooler.supabase.com:${port}/postgres`,
        )
      }
    }
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
      console.log('Connected. Restoring email-only registration trigger…')
      await client.query(sql)
      await client.end()
      console.log('Done.')
      return
    } catch (err) {
      lastError = err
      try {
        await client.end()
      } catch {}
    }
  }
  throw lastError ?? new Error('Could not connect to Postgres')
}

try {
  const fileEnv = loadEnv()
  if (fileEnv.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN) {
    await applyViaManagementApi()
  } else {
    await applyViaPg()
  }
} catch (err) {
  console.error('Failed:', err.message)
  console.error('Paste supabase/restore-email-registration.sql into Supabase SQL Editor.')
  process.exit(1)
}
