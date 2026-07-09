/**
 * Verify that all critical server modules can be loaded without error.
 * Catches ESM import failures, missing exports, and syntax errors
 * before Railway deploy.
 *
 * Skips server/index.js to avoid binding ports.
 */

import { readdirSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
const SERVER_DIR = resolve(ROOT, 'server')

const SKIP_DIRS = new Set([
  resolve(SERVER_DIR, 'scripts'),
  resolve(SERVER_DIR, 'db'),
])

const SKIP_FILES = new Set([
  resolve(SERVER_DIR, 'index.js'),
])

let passed = 0
let failed = 0
const failures = []

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(full)) walk(full, files)
      continue
    }
    if (entry.endsWith('.js') && !SKIP_FILES.has(full)) files.push(full)
  }
  return files
}

const files = walk(SERVER_DIR)

console.log(`\nServer Module Load Verification`)
console.log(`Modules to check: ${files.length}`)
console.log('')

for (const f of files) {
  const relPath = f.replace(ROOT + '/', '')
  try {
    await import(pathToFileURL(f).href)
    passed++
  } catch (e) {
    failed++
    failures.push({ file: relPath, error: e.message })
    console.log(`  ❌ ${relPath}`)
    console.log(`     ${e.message}`)
    console.log('')
  }
}

console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('')

if (failed === 0) {
  console.log('✅ All server modules load successfully.')
  process.exit(0)
} else {
  console.log(`❌ ${failed} module(s) failed to load — fix before Railway deploy.`)
  process.exit(1)
}
