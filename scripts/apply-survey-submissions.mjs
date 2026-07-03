#!/usr/bin/env node
/**
 * Apply supabase/add-survey-submissions.sql to the Nexo Supabase project.
 * Requires SUPABASE_DB_PASSWORD in .env.
 *
 * Usage: node scripts/apply-survey-submissions.mjs
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

if (!projectRef) {
  console.error('Missing VITE_SUPABASE_URL in .env')
  process.exit(1)
}

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env')
  process.exit(1)
}

const connectionString =
  env('SUPABASE_DB_URL') ??
  process.env.SUPABASE_DB_URL ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`

const poolerUrl = env('SUPABASE_POOLER_URL') ?? process.env.SUPABASE_POOLER_URL

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

const sql = readFileSync(join(root, '..', 'supabase', 'add-survey-submissions.sql'), 'utf8')

let lastError = null
for (const url of candidates) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    console.log('Connected. Applying gathering survey schema…')
    await client.query(sql)

    const { rows } = await client.query(`
      SELECT split_part(setting, '=', 2) AS schemas
      FROM pg_db_role_setting s
      JOIN pg_roles r ON r.oid = s.setrole
      JOIN pg_database d ON d.oid = s.setdatabase
      WHERE r.rolname = 'authenticator'
        AND d.datname = current_database()
        AND setting LIKE 'pgrst.db_schemas=%'
      LIMIT 1
    `)

    let schemaList = rows[0]?.schemas ?? 'public, storage, graphql_public'
    if (!schemaList.split(',').map((s) => s.trim()).includes('gathering')) {
      schemaList = `${schemaList}, gathering`
    }

    await client.query(`ALTER ROLE authenticator SET pgrst.db_schemas = '${schemaList.replace(/'/g, "''")}'`)
    await client.query(`NOTIFY pgrst, 'reload config'`)
    await client.query(`NOTIFY pgrst, 'reload schema'`)

    const verify = await client.query(`
      SELECT to_regclass('gathering.survey_submissions') AS table_ref
    `)
    console.log('Table ready:', verify.rows[0]?.table_ref ?? 'missing')
    console.log('Exposed schemas:', schemaList)
    console.log('Survey database setup complete.')
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
if (lastError) console.error(lastError.message)
process.exit(1)
