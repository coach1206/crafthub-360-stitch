/**
 * Production-bundle cleanliness gate (SC-D068).
 *
 * Scans the built dist/assets/*.js for dev-only markers that must never
 * ship — the exact class of defect found in this pass, where a plain
 * `vite build` shipped the DevRoleSwitcher toolbar (import.meta.env.DEV
 * -gated, meant to be dead-code-eliminated in a real production build)
 * live in the production bundle. Fails the build (exit 1) if any marker
 * is found, so this can never regress silently again.
 *
 * Run automatically as the last step of scripts/buildProduction.mjs
 * (npm run build / npm run build:production). Also runnable standalone:
 *   node scripts/verifyProductionBundleIsClean.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const DIST_ASSETS = resolve('dist/assets')

const DEV_ONLY_MARKERS = [
  { marker: 'DEV MODE ONLY — NOT REAL AUTH', label: 'DevRoleSwitcher dev-only role-switch toolbar' },
  { marker: 'REAL SESSION ACTIVE', label: 'DevRoleSwitcher session-state panel text (secondary signal — only flagged alongside the primary marker above)' , secondary: true },
]

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── Production bundle cleanliness gate (SC-D068)\n')

if (!existsSync(DIST_ASSETS)) {
  console.log(`  FAIL  dist/assets does not exist — run the build first`)
  process.exit(1)
}

const jsFiles = readdirSync(DIST_ASSETS).filter(f => f.endsWith('.js'))
check('dist/assets contains built JS bundles', jsFiles.length > 0, `found ${jsFiles.length}`)

let foundIn = []
for (const f of jsFiles) {
  const text = readFileSync(resolve(DIST_ASSETS, f), 'utf8')
  for (const { marker, label, secondary } of DEV_ONLY_MARKERS) {
    if (secondary) continue // only used as corroborating evidence, not a standalone fail condition
    if (text.includes(marker)) foundIn.push({ file: f, marker, label })
  }
}

check(
  'No dev-only markers (DevRoleSwitcher, etc.) present in any built JS bundle',
  foundIn.length === 0,
  foundIn.map(f => `${f.label} found in ${f.file}`).join('; ')
)

// Sanity-check bundle size isn't drastically inflated the way the bad
// build was (5.4MB vs the correct ~3.1MB main chunk) — a coarse, cheap
// second signal alongside the marker scan, not a replacement for it.
const mainChunk = jsFiles.find(f => f.startsWith('index-'))
if (mainChunk) {
  const sizeMB = readFileSync(resolve(DIST_ASSETS, mainChunk)).length / (1024 * 1024)
  check(`Main chunk (${mainChunk}) is not abnormally large for a production build`, sizeMB < 4.5, `${sizeMB.toFixed(2)}MB (dev-mode-leaking build measured 5.4MB; clean production build measured ~3.1MB)`)
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) {
  console.log('\nThis build must NOT be deployed. Re-run the production build via `npm run build` (now routed through scripts/buildProduction.mjs).')
  process.exit(1)
}
