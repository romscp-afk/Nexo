import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const cwd = process.cwd()
const installRoot = fs.existsSync(path.join(cwd, 'package-lock.json')) ? cwd : appRoot

console.log('[vercel-install] cwd:', cwd)
console.log('[vercel-install] installing in:', installRoot)

execSync('npm install', { cwd: installRoot, stdio: 'inherit' })
