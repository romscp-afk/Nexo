#!/usr/bin/env node
/**
 * Configure Resend for Nexo chat email alerts and deploy the edge function.
 *
 * 1. Sign up at https://resend.com and create an API key (Sending access).
 * 2. Add RESEND_API_KEY to .env OR pass it when running:
 *      RESEND_API_KEY=re_xxx npm run setup:chat-email-resend
 * 3. Optional test email:
 *      RESEND_API_KEY=re_xxx TEST_CHAT_EMAIL=you@example.com npm run setup:chat-email-resend
 *
 * Sandbox: onboarding@resend.dev only delivers to your Resend account email.
 * Production: verify a domain in Resend, then set CHAT_EMAIL_FROM=Nexo <noreply@yourdomain.com>
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')
const defaultSiteUrl = 'https://nexo-service-sepia.vercel.app'
const defaultFrom = 'Nexo <onboarding@resend.dev>'

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

function upsertEnv(key, value) {
  let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(text)) {
    text = text.replace(re, `${key}=${value}`)
  } else {
    text = `${text.trim()}\n${key}=${value}\n`
  }
  writeFileSync(envPath, text)
}

async function resendFetch(apiKey, path, init = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
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
  return { ok: res.ok, status: res.status, body }
}

const fileEnv = { ...readEnvFile(), ...loadEnv() }
const apiKey =
  process.env.RESEND_API_KEY ??
  fileEnv.RESEND_API_KEY ??
  (fileEnv.SMTP_PASS?.startsWith('re_') ? fileEnv.SMTP_PASS : null)

if (!apiKey) {
  console.error(`
Missing RESEND_API_KEY.

Steps:
  1. Open https://resend.com/api-keys
  2. Create an API key with "Sending access"
  3. Add to .env:
       RESEND_API_KEY=re_your_key_here
     Or run once:
       RESEND_API_KEY=re_your_key_here npm run setup:chat-email-resend

Sandbox note: with onboarding@resend.dev, emails only reach the address on your Resend account.
For production, verify a domain and set CHAT_EMAIL_FROM=Nexo <noreply@yourdomain.com>
`)
  process.exit(1)
}

console.log('Validating Resend API key…')
const domains = await resendFetch(apiKey, '/domains')
let verifiedDomains = []
let sendingOnlyKey = false

if (domains.ok) {
  verifiedDomains = (domains.body?.data ?? []).filter((d) => d.status === 'verified')
  console.log(`Resend OK (${verifiedDomains.length} verified domain${verifiedDomains.length === 1 ? '' : 's'})`)
} else {
  const msg = typeof domains.body === 'object' ? domains.body?.message : String(domains.body)
  if (msg?.includes('restricted to only send')) {
    sendingOnlyKey = true
    console.log('Resend OK (sending-only API key)')
  } else {
    console.error('Invalid Resend API key:', msg)
    process.exit(1)
  }
}

const fromAddress = process.env.CHAT_EMAIL_FROM ?? fileEnv.CHAT_EMAIL_FROM ?? defaultFrom
const siteUrl = (process.env.SITE_URL ?? fileEnv.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '')

if (fromAddress.includes('onboarding@resend.dev')) {
  console.log('')
  console.log('Using sandbox sender onboarding@resend.dev')
  console.log('→ Recipients must be the email on your Resend account until you verify a domain.')
} else if (!fromAddress.match(/@[^>]+\.[^>]+/)) {
  console.warn('CHAT_EMAIL_FROM looks unusual:', fromAddress)
}

upsertEnv('RESEND_API_KEY', apiKey)
upsertEnv('CHAT_EMAIL_FROM', fromAddress)
upsertEnv('SITE_URL', siteUrl)
console.log('Updated .env (RESEND_API_KEY, CHAT_EMAIL_FROM, SITE_URL)')

const testTo = process.env.TEST_CHAT_EMAIL ?? fileEnv.TEST_CHAT_EMAIL
if (testTo) {
  console.log(`Sending test email to ${testTo}…`)
  const testRes = await resendFetch(apiKey, '/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: fromAddress,
      to: [testTo],
      subject: 'Nexo chat email test',
      html: `<p>If you received this, Resend is configured for Nexo chat alerts.</p><p><a href="${siteUrl}/dashboard/messages">Open Nexo</a></p>`,
    }),
  })
  if (!testRes.ok) {
    console.error('Test email failed:', typeof testRes.body === 'object' ? testRes.body?.message : testRes.body)
    console.error('Common fix: use TEST_CHAT_EMAIL=<your Resend signup email> in sandbox mode.')
    process.exit(1)
  }
  console.log('Test email sent.')
}

console.log('')
console.log('Deploying edge function secrets…')
const deploy = spawnSync('npm', ['run', 'deploy:chat-email'], {
  cwd: join(root, '..'),
  stdio: 'inherit',
  env: { ...process.env, RESEND_API_KEY: apiKey, CHAT_EMAIL_FROM: fromAddress, SITE_URL: siteUrl },
})

if (deploy.status !== 0) {
  process.exit(deploy.status ?? 1)
}

console.log('')
console.log('Chat email alerts are live.')
console.log('Send a booking chat message to trigger a real notification.')
if (!testTo) {
  console.log(`Optional: TEST_CHAT_EMAIL=you@example.com npm run setup:chat-email-resend`)
}
