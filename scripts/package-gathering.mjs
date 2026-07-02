import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'deploy/silver-legacy-site')
const zipPath = path.join(root, 'deploy/silver-legacy-site.zip')

execSync('node scripts/build-gathering.mjs', { cwd: root, stdio: 'inherit' })

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

execSync(`zip -r "${zipPath}" . -x "*.DS_Store"`, { cwd: outDir, stdio: 'inherit' })

const { size } = fs.statSync(zipPath)
console.log(`[package-gathering] ready: ${zipPath} (${(size / 1024 / 1024).toFixed(2)} MB)`)
