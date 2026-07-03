#!/usr/bin/env node
/**
 * Brand Supabase Auth emails as "Nexo Authentication".
 *
 * Supabase's built-in email provider always sends as "Supabase Auth" on free tier.
 * To use a custom sender name and templates, configure custom SMTP (Resend recommended).
 *
 * Usage:
 *   1. Create a Resend account + API key: https://resend.com
 *   2. Add to .env (gitignored):
 *        SMTP_HOST=smtp.resend.com
 *        SMTP_PORT=465
 *        SMTP_USER=resend
 *        SMTP_PASS=re_your_api_key
 *        SMTP_ADMIN_EMAIL=onboarding@resend.dev
 *        SMTP_SENDER_NAME=Nexo Authentication
 *      For production, verify a domain in Resend and use e.g. noreply@yourdomain.com
 *   3. npm run setup:auth-email
 *
 * Manual alternative: Supabase Dashboard → Project Settings → Authentication
 *   → SMTP Settings → enable custom SMTP, set sender name to "Nexo Authentication"
 *   → Email Templates → customize subjects/body with Nexo branding
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const envPath = join(root, '..', '.env')

function readEnvFile() {
  if (!existsSync(envPath)) return {}
  const text = readFileSync(envPath, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) out[match[1]] = match[2].trim()
  }
  return out
}

const fileEnv = { ...readEnvFile(), ...loadEnv() }
const token = requireAccessToken(fileEnv)

const smtpHost = process.env.SMTP_HOST ?? fileEnv.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT ?? fileEnv.SMTP_PORT ?? 465)
const smtpUser = process.env.SMTP_USER ?? fileEnv.SMTP_USER ?? 'resend'
const smtpPass = process.env.SMTP_PASS ?? fileEnv.SMTP_PASS
const smtpAdminEmail = process.env.SMTP_ADMIN_EMAIL ?? fileEnv.SMTP_ADMIN_EMAIL
const smtpSenderName = process.env.SMTP_SENDER_NAME ?? fileEnv.SMTP_SENDER_NAME ?? 'Nexo Authentication'

const siteUrl =
  process.env.VITE_SITE_URL?.replace(/\/$/, '') ||
  fileEnv.VITE_SITE_URL?.replace(/\/$/, '') ||
  'https://nexo-service-sepia.vercel.app'

const uriAllowList = [
  siteUrl,
  `${siteUrl}/login`,
  `${siteUrl}/register`,
  'http://localhost:5173',
  'http://localhost:5173/login',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5173/login',
].join(',')

const nexoTemplates = {
  mailer_subjects_confirmation: 'Confirm your Nexo account',
  mailer_subjects_magic_link: 'Your Nexo sign-in link',
  mailer_subjects_recovery: 'Reset your Nexo password',
  mailer_subjects_email_change: 'Confirm your new Nexo email',
  mailer_subjects_invite: 'You have been invited to Nexo',
  mailer_templates_confirmation_content:
    '<h2>Confirm your Nexo account</h2><p>Follow the link below to confirm your email and finish signing up for Nexo.</p><p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p><p>If you did not request this, you can ignore this email.</p>',
  mailer_templates_magic_link_content:
    '<h2>Sign in to Nexo</h2><p>Follow the link below to sign in. This link expires shortly and can only be used once.</p><p><a href="{{ .ConfirmationURL }}">Sign in to Nexo</a></p>',
  mailer_templates_recovery_content:
    '<h2>Reset your Nexo password</h2><p>We received a request to reset your password. Follow the link below to choose a new one.</p><p><a href="{{ .ConfirmationURL }}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>',
  mailer_templates_email_change_content:
    '<h2>Confirm your new Nexo email</h2><p>Follow the link below to confirm {{ .NewEmail }} as your new email address.</p><p><a href="{{ .ConfirmationURL }}">Confirm email change</a></p>',
  mailer_templates_invite_content:
    '<h2>You have been invited to Nexo</h2><p>You have been invited to create a Nexo account. Follow the link below to accept.</p><p><a href="{{ .ConfirmationURL }}">Accept invite</a></p>',
}

if (!smtpHost || !smtpPass || !smtpAdminEmail) {
  console.error(`
Cannot change "Supabase Auth" sender on the default email provider (free tier).

To show "Nexo Authentication" instead, add custom SMTP to .env:

  SMTP_HOST=smtp.resend.com
  SMTP_PORT=465
  SMTP_USER=resend
  SMTP_PASS=re_xxxxxxxx
  SMTP_ADMIN_EMAIL=onboarding@resend.dev
  SMTP_SENDER_NAME=Nexo Authentication

Then run: npm run setup:auth-email

Or configure manually:
  Supabase Dashboard → Authentication → SMTP Settings
  → Enable custom SMTP, Sender name: "Nexo Authentication"
  → Email Templates → update subjects/body with Nexo branding
`)
  process.exit(1)
}

console.log(`Configuring Nexo auth email branding → "${smtpSenderName}" <${smtpAdminEmail}>`)

await supabaseApi(token, '/config/auth', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: uriAllowList,
    external_email_enabled: true,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_user: smtpUser,
    smtp_pass: smtpPass,
    smtp_admin_email: smtpAdminEmail,
    smtp_sender_name: smtpSenderName,
    ...nexoTemplates,
  }),
})

console.log('Done. New sign-up and password emails will show as:', smtpSenderName)
console.log('Site URL:', siteUrl)
