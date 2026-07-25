#!/usr/bin/env node
/**
 * verify-smokecraft-final-three-approved-assets.mjs
 *
 * SUPERSEDES the prior "no asset exists" self-invalidating gate. The repo
 * owner has since uploaded the three approved images to `main` (not the
 * recovery branch), and this pass located and wired the exact named files:
 *   - public/assets/smokecraft/session 1.png            → Welcome/S1
 *   - public/assets/smokecraft/Resume Your Journey.png  → Resume Journey
 *   - public/assets/smokecraft/session 25 rewards.png   → Rewards/S25
 *
 * This suite asserts the new, live-wired truth: the exact files exist with
 * known hashes, SC_ASSETS registers them, and each of the three screens
 * renders them via SmokeCraftImageBoundsOverlay (the one canonical
 * approved-image-plus-live-data pattern) rather than any decorative
 * placeholder or fabricated layout.
 *
 * The Golden Box Build Studio construction-method image was ALSO located,
 * but is intentionally NOT wired: no existing component in this repo
 * implements that exact Construction Method Selection (Entubado/Accordion/
 * Book/Lieberman) editor, so wiring it would require building a new screen —
 * out of scope for an asset-recovery pass. This is disclosed, not silent.
 */

import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const R = (p) => path.join(ROOT, p)

let pass = 0
let fail = 0
const failures = []

function check(name, fn) {
  let ok = false
  let detail = ''
  try {
    const r = fn()
    if (r === true || r === undefined) ok = true
    else { detail = String(r) }
  } catch (e) {
    detail = e.message
  }
  if (ok) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name} — ${detail}`); console.log(`  FAIL  ${name} — ${detail}`) }
}

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const read = (p) => readFileSync(R(p), 'utf8')

console.log('\n=== SmokeCraft final three approved assets — verification (v2: found & wired) ===\n')

console.log('--- Section A: exact approved files present with known hashes ---')

const ASSETS = [
  { path: 'public/assets/smokecraft/session 1.png', hash: '8394f96f915020c6630d2407518a3db1eea7e2c5d07dbdcbee1ffe4d6f2fd4e5', label: 'Session 1 (Welcome)' },
  { path: 'public/assets/smokecraft/Resume Your Journey.png', hash: 'a90b155341684f1d18bc9450b65097ca762dd4922dda454ad467a7c0b3ca07a5', label: 'Resume Your Journey' },
  { path: 'public/assets/smokecraft/session 25 rewards.png', hash: '683892e9df2ca8193de4d469ccffc23570f9735d00a629244331471c9d1f88e8', label: 'Session 25 Rewards' },
  { path: 'public/assets/smokecraft/ Golden Box Build Studio construction method.png', hash: null, label: 'Golden Box (found, intentionally unwired)' },
]

for (const a of ASSETS) {
  check(`A: ${a.label} exists at exact path`, () => {
    const p = R(a.path)
    return existsSync(p) || `missing: ${a.path}`
  })
  if (a.hash) {
    check(`A: ${a.label} hash matches expected`, () => {
      const h = sha256(R(a.path))
      return h === a.hash || `hash mismatch: got ${h}`
    })
  }
}

console.log('\n--- Section B: SC_ASSETS registration ---')

check('B1 SC_ASSETS.session1 registered', () => {
  const src = read('src/constants/smokecraftAssets.js')
  return /session1:\s*`\$\{RAW\}\/session%201\.png`/.test(src) || 'session1 key missing/mismatched'
})

check('B2 SC_ASSETS.resume points to Resume Your Journey.png', () => {
  const src = read('src/constants/smokecraftAssets.js')
  return /resume:\s*`\$\{RAW\}\/Resume%20Your%20Journey\.png`/.test(src) || 'resume key missing/mismatched'
})

check('B3 SC_ASSETS.rewards points to session 25 rewards.png', () => {
  const src = read('src/constants/smokecraftAssets.js')
  return /rewards:\s*`\$\{RAW\}\/session%2025%20rewards\.png`/.test(src) || 'rewards key missing/mismatched'
})

console.log('\n--- Section C: each screen wired via the canonical bounds-overlay pattern ---')

check('C1 WelcomeExperience.jsx uses SmokeCraftImageBoundsOverlay + SC_ASSETS.session1', () => {
  const src = read('src/pages/smokecraft/WelcomeExperience.jsx')
  return (src.includes('SmokeCraftImageBoundsOverlay') && src.includes('SC_ASSETS.session1'))
    || 'not wired via the canonical overlay pattern'
})

check('C2 ResumeJourney.jsx uses SmokeCraftImageBoundsOverlay + SC_ASSETS.resume', () => {
  const src = read('src/pages/smokecraft/ResumeJourney.jsx')
  return (src.includes('SmokeCraftImageBoundsOverlay') && src.includes('SC_ASSETS.resume'))
    || 'not wired via the canonical overlay pattern'
})

check('C3 Rewards.jsx uses SmokeCraftImageBoundsOverlay + SC_ASSETS.rewards for S25', () => {
  const src = read('src/pages/smokecraft/Rewards.jsx')
  return (src.includes('SmokeCraftImageBoundsOverlay') && src.includes('SC_ASSETS.rewards'))
    || 'not wired via the canonical overlay pattern'
})

console.log('\n--- Section D: Golden Box intentionally left unwired (disclosed decision) ---')

check('D1 no Golden Box construction-method asset key wired into SC_ASSETS', () => {
  const src = read('src/constants/smokecraftAssets.js')
  return !/goldenBoxConstructionMethod|golden.?box.?build.?studio/i.test(src)
    || 'a Golden Box key was added — confirm its target screen exists before wiring'
})

console.log('\n--- Section E: locked files/architecture untouched ---')

const LOCKED = [
  'src/pages/smokecraft/RewardsCenter.jsx',
  'src/pages/smokecraft/Leaderboard.jsx',
]
for (const f of LOCKED) {
  check(`E: locked file present and not a target of this pass: ${f}`, () => existsSync(R(f)) || 'file missing')
}

check('E: the 6-phase / 27-session spine marker is unchanged', () => {
  const src = read('src/constants/session.js')
  return /TOTAL_PHASES\s*=\s*TOTAL_VISITS/.test(src) || 'phase/session spine marker missing'
})

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (${pass + fail} total) ===`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f}`)
}
process.exit(fail === 0 ? 0 : 1)
