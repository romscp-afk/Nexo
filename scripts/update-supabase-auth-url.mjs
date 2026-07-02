#!/usr/bin/env node
/**
 * Set Supabase Auth site URL + redirect allow list for Vercel production.
 * Usage: npm run setup:site-url
 */
import { loadEnv, projectRef, requireAccessToken, supabaseApi } from './lib/supabase-management.mjs'

const fileEnv = loadEnv()
const token = requireAccessToken(fileEnv)

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

console.log(`Updating Supabase Auth site URL → ${siteUrl}`)

await supabaseApi(token, '/config/auth', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: uriAllowList,
  }),
})

console.log('Done. Redirect URLs:', uriAllowList.split(',').join('\n  '))
