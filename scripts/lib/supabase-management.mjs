import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRef = 'zitofnocwbpoczqdrdbr'

const root = dirname(fileURLToPath(import.meta.url))

export function loadEnv() {
  const envPath = join(root, '..', '..', '.env')
  if (!existsSync(envPath)) return {}
  const text = readFileSync(envPath, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

export function requireAccessToken(fileEnv) {
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? fileEnv.SUPABASE_ACCESS_TOKEN
  if (!token) {
    console.error('Missing SUPABASE_ACCESS_TOKEN in .env')
    console.error('Generate at https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }
  return token
}

export async function supabaseApi(token, path, init = {}) {
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

export async function setSecrets(token, entries) {
  await supabaseApi(token, '/secrets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries.map(({ name, value }) => ({ name, value }))),
  })
}

export async function deleteSecrets(token, names) {
  await supabaseApi(token, '/secrets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(names),
  })
}
