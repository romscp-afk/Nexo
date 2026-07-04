#!/usr/bin/env node
/**
 * Apply supabase/add-booking-whatsapp-alerts.sql and sync webhook secret.
 * Usage: npm run setup:booking-whatsapp
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

function writeEnvSecret(key, secret) {
  let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(text)) {
    text = text.replace(re, `${key}=${secret}`)
  } else {
    text = `${text.trim()}\n${key}=${secret}\n`
  }
  writeFileSync(envPath, text)
}

const fileEnv = { ...readEnvFile(), ...loadEnv() }
const token = requireAccessToken(fileEnv)
let webhookSecret =
  process.env.BOOKING_WHATSAPP_WEBHOOK_SECRET ?? fileEnv.BOOKING_WHATSAPP_WEBHOOK_SECRET
if (!webhookSecret) {
  webhookSecret = randomBytes(24).toString('hex')
  writeEnvSecret('BOOKING_WHATSAPP_WEBHOOK_SECRET', webhookSecret)
  console.log('Generated BOOKING_WHATSAPP_WEBHOOK_SECRET in .env')
}

let sql = readFileSync(join(root, '..', 'supabase', 'add-booking-whatsapp-alerts.sql'), 'utf8')
sql += `\nUPDATE platform_settings SET value = '${webhookSecret}', updated_at = now() WHERE key = 'booking_whatsapp_webhook_secret';\n`

try {
  console.log('Applying booking WhatsApp alerts migration…')
  await supabaseApi(token, '/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  console.log('Migration applied.')
  console.log('Next: npm run deploy:booking-whatsapp')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
