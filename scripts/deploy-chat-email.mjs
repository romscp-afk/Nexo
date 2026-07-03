#!/usr/bin/env node
/**
 * Deploy send-chat-email edge function + secrets.
 * Requires SUPABASE_ACCESS_TOKEN and CHAT_EMAIL_WEBHOOK_SECRET in .env
 * Optional: RESEND_API_KEY, CHAT_EMAIL_FROM, SITE_URL
 *
 * Usage: npm run deploy:chat-email
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const projectRef = 'zitofnocwbpoczqdrdbr'
const functionSlug = 'send-chat-email'

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
const webhookSecret = process.env.CHAT_EMAIL_WEBHOOK_SECRET ?? fileEnv.CHAT_EMAIL_WEBHOOK_SECRET

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN in .env')
  process.exit(1)
}
if (!webhookSecret) {
  console.error('Missing CHAT_EMAIL_WEBHOOK_SECRET — run: npm run setup:admin-chat-email')
  process.exit(1)
}

const source = readFileSync(
  join(root, '..', 'supabase', 'functions', functionSlug, 'index.ts'),
  'utf8',
)

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
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

console.log('Deploying send-chat-email…')

const form = new FormData()
form.append(
  'metadata',
  JSON.stringify({
    entrypoint_path: 'index.ts',
    name: functionSlug,
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

if (!deployRes.ok) {
  console.error('Deploy failed:', await deployRes.text())
  process.exit(1)
}

console.log('Function deployed. Setting secrets…')

const secrets = [
  { name: 'CHAT_EMAIL_WEBHOOK_SECRET', value: webhookSecret },
  { name: 'SITE_URL', value: fileEnv.SITE_URL ?? process.env.SITE_URL ?? 'https://nexo-service-sepia.vercel.app' },
]

const resendKey = fileEnv.RESEND_API_KEY ?? process.env.RESEND_API_KEY
if (resendKey) secrets.push({ name: 'RESEND_API_KEY', value: resendKey })
if (fileEnv.CHAT_EMAIL_FROM ?? process.env.CHAT_EMAIL_FROM) {
  secrets.push({ name: 'CHAT_EMAIL_FROM', value: fileEnv.CHAT_EMAIL_FROM ?? process.env.CHAT_EMAIL_FROM })
}

await api('/secrets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(secrets),
})

console.log('')
console.log('Done.')
console.log(`Function: https://${projectRef}.supabase.co/functions/v1/${functionSlug}`)
if (!resendKey) {
  console.log('')
  console.log('Note: RESEND_API_KEY not in .env — emails will skip until you add it and re-run deploy:chat-email')
}
