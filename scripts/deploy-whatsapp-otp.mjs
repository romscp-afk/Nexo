#!/usr/bin/env node
/**
 * Deploy whatsapp-otp via Supabase Management API + set dev secrets.
 * Requires SUPABASE_ACCESS_TOKEN in .env (Dashboard → Account → Access Tokens).
 *
 * Usage: npm run deploy:whatsapp-otp
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const root = dirname(fileURLToPath(import.meta.url))
const projectRef = 'zitofnocwbpoczqdrdbr'
const functionSlug = 'whatsapp-otp'

function loadEnv() {
  const envPath = join(root, '..', '.env')
  if (!existsSync(envPath)) return {}
  const text = readFileSync(envPath, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

const fileEnv = loadEnv()
const token = process.env.SUPABASE_ACCESS_TOKEN ?? fileEnv.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.\n')
  console.error('1. Open https://supabase.com/dashboard/account/tokens')
  console.error('2. Generate token → add to .env: SUPABASE_ACCESS_TOKEN=sbp_...')
  console.error('3. Re-run: npm run deploy:whatsapp-otp\n')
  console.error('Or: npx supabase login && npm run deploy:whatsapp-otp')
  process.exit(1)
}

const pepper = fileEnv.WHATSAPP_OTP_PEPPER ?? process.env.WHATSAPP_OTP_PEPPER ?? randomBytes(32).toString('hex')
const functionPath = join(root, '..', 'supabase', 'functions', functionSlug, 'index.ts')
const source = readFileSync(functionPath, 'utf8')

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(typeof body === 'object' && body?.message ? body.message : text || res.statusText)
  }
  return body
}

console.log('Deploying whatsapp-otp…')

const form = new FormData()
form.append(
  'metadata',
  JSON.stringify({
    entrypoint_path: 'index.ts',
    name: 'whatsapp-otp',
    verify_jwt: false,
  }),
)
form.append('file', new Blob([source], { type: 'application/typescript' }), 'index.ts')

const deployRes = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${functionSlug}`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  },
)

const deployText = await deployRes.text()
if (!deployRes.ok) {
  console.error('Deploy failed:', deployText)
  process.exit(1)
}

console.log('Function deployed.')

console.log('Setting dev secrets…')
await api('/secrets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    { name: 'WHATSAPP_OTP_DEV', value: 'true' },
    { name: 'WHATSAPP_OTP_PEPPER', value: pepper },
  ]),
})

console.log('')
console.log('Done. Test at /register — OTP appears on screen in dev mode.')
console.log(`Function URL: https://${projectRef}.supabase.co/functions/v1/${functionSlug}`)
