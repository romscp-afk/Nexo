#!/usr/bin/env node
/**
 * Switch WhatsApp OTP back to dev mode (OTP shown on screen, no Twilio).
 *
 * Usage: npm run setup:whatsapp-dev
 */
import { randomBytes } from 'node:crypto'
import {
  loadEnv,
  projectRef,
  requireAccessToken,
  setSecrets,
} from './lib/supabase-management.mjs'

const fileEnv = loadEnv()
const token = requireAccessToken(fileEnv)
const pepper = process.env.WHATSAPP_OTP_PEPPER ?? fileEnv.WHATSAPP_OTP_PEPPER ?? randomBytes(32).toString('hex')

console.log('Enabling WhatsApp OTP dev mode…')

await setSecrets(token, [
  { name: 'WHATSAPP_OTP_DEV', value: 'true' },
  { name: 'WHATSAPP_OTP_PEPPER', value: pepper },
])

console.log('Done. OTP will appear on screen at /register (no WhatsApp message sent).')
console.log(`Function: https://${projectRef}.supabase.co/functions/v1/whatsapp-otp`)
