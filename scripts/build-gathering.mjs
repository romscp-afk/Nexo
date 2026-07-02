import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'deploy/silver-legacy-site')
const faviconSrc = path.join(root, 'src/assets/silver-legacy-logo.png')
const faviconDest = path.join(root, 'gathering-public/favicon.png')

if (!fs.existsSync(faviconSrc)) {
  console.error('[build-gathering] missing', faviconSrc)
  process.exit(1)
}

fs.copyFileSync(faviconSrc, faviconDest)

execSync('vite build --config vite.gathering.config.ts', { cwd: root, stdio: 'inherit' })

if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  const nestedIndex = path.join(outDir, 'gathering/index.html')
  if (fs.existsSync(nestedIndex)) {
    fs.renameSync(nestedIndex, path.join(outDir, 'index.html'))
    fs.rmSync(path.join(outDir, 'gathering'), { recursive: true })
  }
}

if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  console.error('[build-gathering] index.html missing in', outDir)
  process.exit(1)
}

console.log('[build-gathering] ready:', outDir)
