/**
 * Founder Admin PIN Access Verification.
 * Confirms the founder env-override login path (src/config/founderOverride.js)
 * requires both email and PIN, rejects a wrong PIN, grants founder_level_0
 * only on an exact match, that ProtectedRoute admits founder_level_0 into
 * /admin/deployment-center, and that no founder PIN value is hardcoded
 * anywhere in source.
 * Run with:
 *   node server/scripts/verifyFounderAdminAccess.js
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { verifyFounderOverride, isFounderOverrideConfigured } from '../../src/config/founderOverride.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS — ${label}`)
  } else {
    failed += 1
    console.error(`FAIL — ${label}`)
  }
}

const TEST_ENV = {
  VITE_FOUNDER_ADMIN_EMAIL: 'founder-test@example.com',
  VITE_FOUNDER_ADMIN_PIN:   '731940',
}

// ── 1. Founder email required ───────────────────────────────────
check(
  'Override rejects when email is missing',
  verifyFounderOverride('', TEST_ENV.VITE_FOUNDER_ADMIN_PIN, TEST_ENV) === false,
)

// ── 2. Founder PIN required ─────────────────────────────────────
check(
  'Override rejects when PIN is missing',
  verifyFounderOverride(TEST_ENV.VITE_FOUNDER_ADMIN_EMAIL, '', TEST_ENV) === false,
)

// ── 3. Wrong PIN rejected ────────────────────────────────────────
check(
  'Override rejects an incorrect PIN',
  verifyFounderOverride(TEST_ENV.VITE_FOUNDER_ADMIN_EMAIL, '000000', TEST_ENV) === false,
)

check(
  'Override rejects an incorrect email',
  verifyFounderOverride('someone-else@example.com', TEST_ENV.VITE_FOUNDER_ADMIN_PIN, TEST_ENV) === false,
)

// ── 4. Correct founder role granted ─────────────────────────────
check(
  'Override accepts the exact configured email + PIN',
  verifyFounderOverride(TEST_ENV.VITE_FOUNDER_ADMIN_EMAIL, TEST_ENV.VITE_FOUNDER_ADMIN_PIN, TEST_ENV) === true,
)

check(
  'Override is case-insensitive on email, exact on PIN',
  verifyFounderOverride(TEST_ENV.VITE_FOUNDER_ADMIN_EMAIL.toUpperCase(), TEST_ENV.VITE_FOUNDER_ADMIN_PIN, TEST_ENV) === true,
)

// ── 5. Never matches when env vars are unset ────────────────────
check(
  'isFounderOverrideConfigured() is false with no env vars set',
  isFounderOverrideConfigured({}) === false,
)
check(
  'Override never matches when env vars are unset, even with correct-looking input',
  verifyFounderOverride(TEST_ENV.VITE_FOUNDER_ADMIN_EMAIL, TEST_ENV.VITE_FOUNDER_ADMIN_PIN, {}) === false,
)

// ── 6. AuthContext wires loginAdmin to grant founder_level_0 ────
const authContextSrc = readFileSync(resolve(ROOT, 'src/context/AuthContext.jsx'), 'utf8')
check(
  'AuthContext.loginAdmin checks verifyFounderOverride() before the backend call',
  /verifyFounderOverride\(email,\s*pin\)/.test(authContextSrc) &&
  /role:\s*'founder_level_0'/.test(authContextSrc),
)

// ── 7. ProtectedRoute admits founder_level_0 into /admin/deployment-center ──
const appSrc = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8')
const deploymentCenterRouteMatch = appSrc.match(
  /admin\/deployment-center[\s\S]{0,400}?allowedRoles=\{(\[[^\]]*\])\}/,
)
check(
  '/admin/deployment-center route declares founder_level_0 in allowedRoles',
  Boolean(deploymentCenterRouteMatch) && deploymentCenterRouteMatch[1].includes("'founder_level_0'"),
)

const protectedRouteSrc = readFileSync(resolve(ROOT, 'src/components/security/ProtectedRoute.jsx'), 'utf8')
check(
  'ProtectedRoute grants founder master access unconditionally before any role check',
  /if\s*\(isFounder\(\)\)\s*return children/.test(protectedRouteSrc),
)

// ── 8. No founder PIN hardcoded anywhere in source ──────────────
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (/\.(js|jsx)$/.test(name)) files.push(full)
  }
  return files
}

const sourceFiles = [
  ...walk(resolve(ROOT, 'src')),
  ...walk(resolve(ROOT, 'server')),
]

// Known historical dev-only demo PIN literals that must never reappear as
// a literal comparison against the founder's real production PIN. This
// checks the founderOverride module itself never embeds a literal PIN
// value, and that no source file performs a hardcoded founder PIN
// equality check outside of the env-var-driven paths.
const founderOverrideSrc = readFileSync(resolve(ROOT, 'src/config/founderOverride.js'), 'utf8')
check(
  'founderOverride.js never assigns a literal PIN string — only reads env vars',
  !/VITE_FOUNDER_ADMIN_PIN\s*[:=]\s*['"]\d+['"]/.test(founderOverrideSrc) &&
  /readEnv\('VITE_FOUNDER_ADMIN_PIN'/.test(founderOverrideSrc),
)

const hardcodedFounderPinPattern = /pin\s*===\s*['"]\d{4,8}['"]/i
const offendingFiles = sourceFiles.filter(f => {
  if (f.endsWith('founderOverride.js') || f.endsWith('verifyFounderAdminAccess.js')) return false
  const content = readFileSync(f, 'utf8')
  return hardcodedFounderPinPattern.test(content) && /founder/i.test(content)
})
check(
  'No file hardcodes a literal PIN compared directly against founder logic',
  offendingFiles.length === 0,
)

// ── 9. .env.example documents the required vars without real values ────
const envExampleSrc = readFileSync(resolve(ROOT, '.env.example'), 'utf8')
check(
  '.env.example documents VITE_FOUNDER_ADMIN_EMAIL and VITE_FOUNDER_ADMIN_PIN with empty values',
  /VITE_FOUNDER_ADMIN_EMAIL=\s*$/m.test(envExampleSrc) &&
  /VITE_FOUNDER_ADMIN_PIN=\s*$/m.test(envExampleSrc),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
