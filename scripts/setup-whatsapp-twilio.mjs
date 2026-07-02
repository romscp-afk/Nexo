#!/usr/bin/env node
/**
 * Configure Twilio WhatsApp for registration OTP (sandbox or production).
 * Requires in .env: SUPABASE_ACCESS_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * Optional: TWILIO_WHATSAPP_FROM (default sandbox), WHATSAPP_OTP_PEPPER
 *
 * Usage: npm run setup:whatsapp-twilio
 */
import { randomBytes } from 'node:crypto'
import {
  deleteSecrets,
  loadEnv,
  projectRef,
  requireAccessToken,
  setSecrets,
} from './lib/supabase-management.mjs'

const fileEnv = loadEnv()
const token = requireAccessToken(fileEnv)

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? fileEnv.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN ?? fileEnv.TWILIO_AUTH_TOKEN
const from = process.env.TWILIO_WHATSAPP_FROM ?? fileEnv.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'
const pepper = process.env.WHATSAPP_OTP_PEPPER ?? fileEnv.WHATSAPP_OTP_PEPPER ?? randomBytes(32).toString('hex')

if (!accountSid || !authToken) {
  console.error('Missing Twilio credentials in .env:\n')
  console.error('  TWILIO_ACCOUNT_SID=ACxxxxxxxx')
  console.error('  TWILIO_AUTH_TOKEN=your_auth_token')
  console.error('  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # optional, sandbox default\n')
  console.error('Get these from https://console.twilio.com/')
  console.error('WhatsApp Sandbox: Messaging → Try it out → Send a WhatsApp message')
  process.exit(1)
}

const whatsappFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`

console.log('Configuring Twilio WhatsApp secrets on Supabase…')

await setSecrets(token, [
  { name: 'TWILIO_ACCOUNT_SID', value: accountSid },
  { name: 'TWILIO_AUTH_TOKEN', value: authToken },
  { name: 'TWILIO_WHATSAPP_FROM', value: whatsappFrom },
  { name: 'WHATSAPP_OTP_PEPPER', value: pepper },
])

try {
  await deleteSecrets(token, ['WHATSAPP_OTP_DEV'])
  console.log('Disabled dev mode (WHATSAPP_OTP_DEV removed).')
} catch {
  console.log('Dev mode was not set (OK).')
}

console.log('')
console.log('Twilio WhatsApp OTP is configured.')
console.log('')
console.log('Sandbox checklist:')
console.log('  1. Twilio Console → Messaging → Try WhatsApp → note join phrase')
console.log('  2. From YOUR WhatsApp, message the sandbox number: join <phrase>')
console.log('  3. Each test user must also join the sandbox before receiving OTPs')
console.log('')
console.log(`Test: ${process.env.VITE_SITE_URL?.replace(/\/$/, '') || 'https://nexo-service-sepia.vercel.app'}/register`)
console.log(`Function: https://${projectRef}.supabase.co/functions/v1/whatsapp-otp`)
