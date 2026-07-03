#!/usr/bin/env node
/**
 * Apply supabase/add-admin-chat-email.sql and sync webhook secret.
 * Usage: npm run setup:admin-chat-email
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')

function readEnvFile() {
  if (!existsSync(envPath)) return {}
  const text = readFileSync(envPath, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

function writeEnvSecret(secret) {
  let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  if (/^CHAT_EMAIL_WEBHOOK_SECRET=/m.test(text)) {
    text = text.replace(/^CHAT_EMAIL_WEBHOOK_SECRET=.*$/m, `CHAT_EMAIL_WEBHOOK_SECRET=${secret}`)
  } else {
    text = `${text.trim()}\nCHAT_EMAIL_WEBHOOK_SECRET=${secret}\n`
  }
  writeFileSync(envPath, text)
}

const fileEnv = { ...readEnvFile(), ...loadEnv() }
const token = requireAccessToken(fileEnv)
let webhookSecret = process.env.CHAT_EMAIL_WEBHOOK_SECRET ?? fileEnv.CHAT_EMAIL_WEBHOOK_SECRET
if (!webhookSecret) {
  webhookSecret = randomBytes(24).toString('hex')
  writeEnvSecret(webhookSecret)
  console.log('Generated CHAT_EMAIL_WEBHOOK_SECRET in .env')
}

let sql = readFileSync(join(root, '..', 'supabase', 'add-admin-chat-email.sql'), 'utf8')
sql += `\nUPDATE platform_settings SET value = '${webhookSecret}', updated_at = now() WHERE key = 'chat_email_webhook_secret';\n`

try {
  console.log('Applying admin chat + email migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Migration applied.')
  console.log('Next: npm run deploy:chat-email (sets edge function secret to match .env)')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
