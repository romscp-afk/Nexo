import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const cwd = process.cwd()

// Vercel may still use rootDirectory "docs" from the old Vite repo settings.
const vercelRootIsDocs =
  path.basename(cwd) === 'docs' && !fs.existsSync(path.join(cwd, 'src'))
const distDir = vercelRootIsDocs ? path.join(cwd, 'dist') : path.join(appRoot, 'dist')
const viteOutDir = vercelRootIsDocs
  ? path.relative(appRoot, distDir)
  : 'dist'

console.log('[vercel-build] cwd:', cwd)
console.log('[vercel-build] appRoot:', appRoot)
console.log('[vercel-build] node:', process.version)
console.log('[vercel-build] vite outDir:', viteOutDir)

execSync(`vite build --outDir ${viteOutDir}`, { cwd: appRoot, stdio: 'inherit' })

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
