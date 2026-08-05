/**
 * Audit all server .js imports for:
 *   1. invalid exports from db/connection.js
 *   2. missing local import targets
 *   3. imports resolving OUTSIDE what the production Docker image's
 *      runtime stage actually copies (server/, node_modules/, dist/,
 *      package.json, and a fixed whitelist of shared src/ subdirectories)
 *
 * Check 3 exists because of a real production incident: server/services/
 * smokecraft/playerStateService.js (and 40+ other server files) import
 * plain data/logic modules from src/data, src/constants, src/modules,
 * src/services, src/utils, src/config, src/locales — real at dev/build
 * time (full repo checkout), but the Docker runtime stage's `COPY server
 * ./server` never included any of src/, so the container crashed at
 * startup with ERR_MODULE_NOT_FOUND the moment such a file was first
 * imported. This never surfaced in local `node server/index.js` runs
 * (full src/ tree always present there) or in `npm run build` (a build-
 * time-only check, not a container boot) — only in an actual built
 * container. This check makes that class of gap build-blocking instead.
 *
 * Keep SRC_RUNTIME_WHITELIST in sync with the Dockerfile runtime stage's
 * `COPY src/<dir> ./src/<dir>` lines — this script and the Dockerfile are
 * two independent, cross-checking descriptions of the same contract.
 *
 * Exits 1 if any invalid imports are found.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
const SERVER_DIR = resolve(ROOT, 'server')

const VALID_DB_EXPORTS = new Set(['getDb', 'isDbAvailable', 'query'])

// Must match the Dockerfile runtime stage's COPY src/<dir> ./src/<dir> lines.
const SRC_RUNTIME_WHITELIST = ['config', 'constants', 'data', 'locales', 'modules', 'services', 'utils']
let runtimeImportFailures = []

// Resolve a relative import spec to a real file on disk, the way Node's ESM
// loader would (exact spec, then + .js, then + /index.js). Returns the
// resolved absolute path if found, else null.
function resolveOnDisk(fileDir, spec) {
  const candidates = [
    resolve(fileDir, spec),
    resolve(fileDir, spec + '.js'),
    resolve(fileDir, spec, 'index.js'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

// Case-sensitive check: does the resolved path's actual on-disk casing match
// the requested casing? macOS/most dev filesystems are case-insensitive, so
// an import like './Foo.js' can silently resolve to './foo.js' locally and
// then hard-fail with ERR_MODULE_NOT_FOUND on Linux/Docker.
function caseMismatch(resolvedPath) {
  let dir = dirname(resolvedPath)
  let name = resolvedPath.slice(dir.length + 1)
  try {
    const entries = readdirSync(dir)
    if (entries.includes(name)) return null // exact case present, fine
    const ciMatch = entries.find(e => e.toLowerCase() === name.toLowerCase())
    if (ciMatch) return ciMatch
    return null
  } catch {
    return null
  }
}

function checkRuntimeImportTargets(filePath, src) {
  const relPath = relative(ROOT, filePath)
  const fileDir = dirname(filePath)
  const importRe = /^import\s+.+?\s+from\s+['"](\.[^'"]*)['"]\s*;?\s*$/gm
  let m
  while ((m = importRe.exec(src))) {
    const spec = m[1]
    const lineNum = src.slice(0, m.index).split('\n').length
    const resolved = resolve(fileDir, spec)
    const relToRoot = relative(ROOT, resolved)

    if (relToRoot.endsWith('.jsx')) {
      runtimeImportFailures.push({ file: relPath, line: lineNum, issue: `imports a .jsx file ('${spec}') — Node cannot load JSX at runtime, regardless of Docker copy scope`, raw: m[0].trim() })
      continue
    }
    if (relToRoot.startsWith('src' + sep)) {
      const topDir = relToRoot.split(sep)[1]
      if (!SRC_RUNTIME_WHITELIST.includes(topDir)) {
        runtimeImportFailures.push({ file: relPath, line: lineNum, issue: `imports from src/${topDir}/, which is NOT in the Dockerfile runtime stage's src/ whitelist (${SRC_RUNTIME_WHITELIST.join(', ')}) — will crash a built container with ERR_MODULE_NOT_FOUND`, raw: m[0].trim() })
        continue
      }
    }

    // JSON imports: confirm the literal file exists (with assert/with json
    // clauses stripped off by the regex already, spec is just the path).
    const isJson = spec.endsWith('.json')

    const resolvedOnDisk = resolveOnDisk(fileDir, spec)
    if (!resolvedOnDisk) {
      runtimeImportFailures.push({ file: relPath, line: lineNum, issue: `resolved import target does not exist on disk: '${spec}' -> ${relToRoot} (typo, deleted file, or case mismatch)`, raw: m[0].trim() })
      continue
    }

    const mismatch = caseMismatch(resolvedOnDisk)
    if (mismatch) {
      runtimeImportFailures.push({ file: relPath, line: lineNum, issue: `case-sensitive filename mismatch: import spec resolves to a name that only matches case-insensitively — real on-disk entry is '${mismatch}'. Works on case-insensitive dev filesystems (macOS/Windows), fails with ERR_MODULE_NOT_FOUND on Linux/Docker.`, raw: m[0].trim() })
    }

    if (isJson && !resolvedOnDisk.endsWith('.json')) {
      // resolveOnDisk found a .js/index.js fallback for something spec'd as .json — inconsistent, flag it.
      runtimeImportFailures.push({ file: relPath, line: lineNum, issue: `imports '${spec}' as JSON but the resolved on-disk file is not a literal .json file`, raw: m[0].trim() })
    }
  }

  // Dynamic import() calls whose path is built from a template literal or
  // string concatenation can't always be statically resolved — flag for
  // manual review rather than silently skipping them.
  const dynImportRe = /import\(\s*(`[^`]*\$\{[^}]*\}[^`]*`|[a-zA-Z_$][\w$]*\s*\+|[^)]*\+\s*[a-zA-Z_$])/g
  let dm
  while ((dm = dynImportRe.exec(src))) {
    const lineNum = src.slice(0, dm.index).split('\n').length
    dynamicImportWarnings.push({ file: relPath, line: lineNum, issue: `dynamic import() with a string-built/template-literal path — cannot be statically resolved, manual review required to confirm the target exists in the Docker runtime image`, raw: src.split('\n')[lineNum - 1].trim() })
  }
}

let dynamicImportWarnings = []


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

const SCRIPTS_DIR = resolve(SERVER_DIR, 'scripts')

function checkFile(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const relPath = filePath.replace(ROOT + '/', '')
  const lines = src.split('\n')

  // server/scripts/* are standalone CLI/verify tools invoked manually via
  // `npm run verify:*` — never imported by server/index.js, so they never
  // execute inside the running container and are exempt from the runtime
  // Docker-copy-scope check (though still copied harmlessly along with the
  // rest of server/, they're just never loaded/executed there).
  if (!filePath.startsWith(SCRIPTS_DIR + sep)) {
    checkRuntimeImportTargets(filePath, src)
  }

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
console.log(`Invalid db/connection.js imports found: ${failures.length}`)
console.log(`Docker-runtime-scope import violations found (whitelist + on-disk existence + case-sensitivity + JSON): ${runtimeImportFailures.length}`)
console.log(`Dynamic import() calls with non-static paths (manual-review warnings, non-blocking): ${dynamicImportWarnings.length}`)

if (dynamicImportWarnings.length > 0) {
  console.log('')
  for (const w of dynamicImportWarnings) {
    console.log(`  ⚠️  ${w.file}:${w.line}`)
    console.log(`     ${w.issue}`)
    console.log(`     Line: ${w.raw}`)
  }
}

const allFailures = [...failures, ...runtimeImportFailures]

if (allFailures.length === 0) {
  console.log('\n✅ All server imports valid — no bad db/connection.js imports, no imports outside the Docker runtime copy scope, no missing on-disk targets, no case mismatches.')
  process.exit(0)
} else {
  console.log('')
  for (const f of allFailures) {
    console.log(`  ❌ ${f.file}:${f.line}`)
    console.log(`     Issue: ${f.issue}`)
    console.log(`     Line:  ${f.raw}`)
    console.log('')
  }
  console.log('❌ Audit FAILED — fix the imports above before Railway deploy.')
  process.exit(1)
}
