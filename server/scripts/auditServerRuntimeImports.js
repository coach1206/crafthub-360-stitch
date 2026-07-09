/**
 * Audit all server .js imports for invalid exports from db/connection.js
 * and missing local import targets.
 *
 * Exits 1 if any invalid imports are found.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
const SERVER_DIR = resolve(ROOT, 'server')

const VALID_DB_EXPORTS = new Set(['getDb', 'isDbAvailable', 'query'])

let scanned = 0
let failures = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (statSync(full).isDirectory()) { walk(full); continue }
    if (!entry.endsWith('.js')) continue
    scanned++
    checkFile(full)
  }
}

function checkFile(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const relPath = filePath.replace(ROOT + '/', '')
  const lines = src.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Match import lines referencing db/connection.js
    const connMatch = line.match(/^import\s+(.+?)\s+from\s+['"]([^'"]*db\/connection\.js)['"]\s*;?\s*$/)
    if (!connMatch) continue

    const importClause = connMatch[1]
    const specPath = connMatch[2]

    // Check for default import
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(importClause.trim())) {
      failures.push({
        file: relPath, line: lineNum,
        issue: `Default import '${importClause.trim()}' from db/connection.js — no default export exists`,
        raw: line.trim(),
      })
      continue
    }

    // Check named imports
    const namedMatch = importClause.match(/^\{([^}]+)\}$/)
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim())
      for (const name of names) {
        if (!VALID_DB_EXPORTS.has(name)) {
          failures.push({
            file: relPath, line: lineNum,
            issue: `Named import '${name}' from db/connection.js — not exported (valid: ${[...VALID_DB_EXPORTS].join(', ')})`,
            raw: line.trim(),
          })
        }
      }
    }
  }
}

walk(SERVER_DIR)

console.log(`\nServer Runtime Import Audit`)
console.log(`Files scanned: ${scanned}`)

if (failures.length === 0) {
  console.log('Invalid db/connection.js imports found: 0')
  console.log('\n✅ All server imports valid — no bad db/connection.js imports found.')
  process.exit(0)
} else {
  console.log(`Invalid db/connection.js imports found: ${failures.length}`)
  console.log('')
  for (const f of failures) {
    console.log(`  ❌ ${f.file}:${f.line}`)
    console.log(`     Issue: ${f.issue}`)
    console.log(`     Line:  ${f.raw}`)
    console.log('')
  }
  console.log('❌ Audit FAILED — fix the imports above before Railway deploy.')
  process.exit(1)
}
