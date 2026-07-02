import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

execSync('node scripts/build-gathering.mjs', { cwd: root, stdio: 'inherit' })

const outDir = path.join(root, 'deploy/silver-legacy-site')
const distVercelConfig = {
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
}
fs.writeFileSync(
  path.join(outDir, 'vercel.json'),
  `${JSON.stringify(distVercelConfig, null, 2)}\n`,
)
console.log('[vercel-gathering-build] wrote deploy/silver-legacy-site/vercel.json')
