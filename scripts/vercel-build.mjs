import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'dist')

console.log('[vercel-build] cwd:', root)
console.log('[vercel-build] node:', process.version)

execSync('vite build', { stdio: 'inherit' })

if (!fs.existsSync(distDir)) {
  console.error('[vercel-build] dist folder missing at', distDir)
  process.exit(1)
}

const files = fs.readdirSync(distDir)
console.log('[vercel-build] dist contents:', files.join(', '))

if (!files.includes('index.html')) {
  console.error('[vercel-build] dist/index.html missing')
  process.exit(1)
}
