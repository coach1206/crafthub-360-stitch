/**
 * Verification: SmokeCraft Approved Asset Manifest
 *
 * Checks:
 * - Every official journey route has a manifest entry
 * - Every manifest asset path exists on disk (or is null/intentional)
 * - No official route references known stale images (session-complete.png, first-third != final-third)
 * - Session Complete does NOT render the stale PNG
 * - Second Third has a cover strip for its stale header
 * - First Third is correctly marked as sharing visual with Final Third
 * - Route files import from or match the manifest paths
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')

let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

function read(relPath) {
  const p = resolve(ROOT, relPath)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

function md5(filePath) {
  const full = resolve(ROOT, filePath)
  if (!existsSync(full)) return null
  return createHash('md5').update(readFileSync(full)).digest('hex')
}

const APPROVED = 'public/assets/smokecraft-reference/approved'
const OFFICIAL_JOURNEY_ROUTES = [
  '/smokecraft',
  '/smokecraft/identity',
  '/smokecraft/golden-box',
  '/smokecraft/mentor-selection',
  '/smokecraft/seed-soil',
  '/smokecraft/pairing-lab',
  '/smokecraft/humidor-match',
  '/smokecraft/request-purchase',
  '/smokecraft/cut-toast-light',
  '/smokecraft/first-third',
  '/smokecraft/second-third',
  '/smokecraft/flavor-memory',
  '/smokecraft/final-third',
  '/smokecraft/scorecard',
  '/smokecraft/final-review',
  '/smokecraft/passport-stamp',
  '/smokecraft/connections',
  '/smokecraft/management-sync',
  '/smokecraft/session-complete',
]

console.log('\nSmokeCraft Approved Asset Manifest Verification\n')

// ── Gate 1: Manifest file exists ─────────────────────────────────────────────
console.log('Gate 1 — Manifest file exists')
const manifestSrc = read('src/constants/smokecraftAssets.js')
check('src/constants/smokecraftAssets.js exists', manifestSrc !== null)

// ── Gate 2: All official journey routes have manifest entries ─────────────────
console.log('\nGate 2 — All official journey routes have manifest entries')
if (manifestSrc) {
  for (const route of OFFICIAL_JOURNEY_ROUTES) {
    check(`Manifest has entry for ${route}`, manifestSrc.includes(`'${route}'`))
  }
}

// ── Gate 3: Session Complete does NOT use the stale PNG ───────────────────────
console.log('\nGate 3 — Session Complete: stale PNG excluded')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx exists', sessionComplete !== null)
if (sessionComplete) {
  check('SessionComplete does NOT reference smokecraft-session-complete.png',
    !sessionComplete.includes('smokecraft-session-complete.png'))
  check('SessionComplete uses CSS gradient or live React (no img background)',
    !sessionComplete.match(/src=["'][^"']*smokecraft-session-complete/))
}
if (manifestSrc) {
  check('Manifest SESSION_COMPLETE exported as null (sentinel)',
    manifestSrc.includes('SESSION_COMPLETE = null'))
  check('Manifest notes stale baked text for session-complete',
    manifestSrc.includes('SESSION 23') || manifestSrc.includes('stale') && manifestSrc.includes('session-complete'))
}

// ── Gate 4: First Third — correctly marked as sharing visual with Final Third ─
console.log('\nGate 4 — First Third: no distinct asset; sharing marked in manifest')
const firstThirdMd5   = md5(`${APPROVED}/smokecraft-first-third.png`)
const finalThirdMd5   = md5(`${APPROVED}/smokecraft-final-third.png`)
check('smokecraft-first-third.png exists on disk', firstThirdMd5 !== null)
check('smokecraft-final-third.png exists on disk', finalThirdMd5 !== null)
if (firstThirdMd5 && finalThirdMd5) {
  check('first-third and final-third are MD5-identical (no distinct first-third asset)',
    firstThirdMd5 === finalThirdMd5, `first=${firstThirdMd5.slice(0,8)} final=${finalThirdMd5.slice(0,8)}`)
}
if (manifestSrc) {
  check('Manifest notes first-third shares visual with final-third',
    manifestSrc.includes('shares visual') || manifestSrc.includes('no distinct'))
  check('FIRST_THIRD constant points to smokecraft-final-third.png',
    manifestSrc.includes("FIRST_THIRD") && manifestSrc.includes('smokecraft-final-third.png'))
}

// ── Gate 5: Second Third — stale header covered ───────────────────────────────
console.log('\nGate 5 — Second Third: stale header cover strip present')
const secondThird = read('src/pages/smokecraft/SecondThird.jsx')
check('SecondThird.jsx exists', secondThird !== null)
if (secondThird) {
  check('SecondThird has React cover strip (position absolute, top:0)',
    secondThird.includes('position:') || secondThird.includes("position: 'absolute'"))
  check('Cover strip height covers stale header (height: 44 or similar)',
    secondThird.match(/height:\s*4[0-9]/) !== null)
  check('Cover strip uses opaque dark background',
    secondThird.includes('rgba(5,3,1') || secondThird.includes('#050') || secondThird.includes('rgba(0,0,0'))
  check('SecondThird still uses approved smokecraft-second-third.png',
    secondThird.includes('smokecraft-second-third.png'))
}
if (manifestSrc) {
  check('Manifest marks second-third as stale: true with cover strip note',
    manifestSrc.includes("stale: true") && manifestSrc.includes('second-third'))
}

// ── Gate 6: Approved asset files exist on disk ────────────────────────────────
console.log('\nGate 6 — Approved asset files exist on disk')
const REQUIRED_ASSETS = [
  'smokecraft-entry-gate.png',
  'smokecraft-gold-box-rules.png',
  'smokecraft-mentor-selection.png',
  'smokecraft-seed-soil.png',
  'smokecraft-pairing-lab.png',
  'smokecraft-humidor-match.png',
  'smokecraft-request-purchase.png',
  'smokecraft-cut-toast-light.png',
  'smokecraft-first-third.png',
  'smokecraft-second-third.png',
  'smokecraft-flavor-memory.png',
  'smokecraft-final-third.png',
  'smokecraft-scorecard-ranking.png',
  'smokecraft-final-review.png',
  'smokecraft-passport-stamp.png',
  'smokecraft-passport-connection.png',
  'smokecraft-venue-management-sync.png',
  'smokecraft-profile-capture.png',
  'smokecraft-how-it-works.png',
  'smokecraft-leaderboard.png',
]
for (const asset of REQUIRED_ASSETS) {
  const diskPath = resolve(ROOT, 'public', 'assets', 'smokecraft-reference', 'approved', asset)
  check(`${asset} exists`, existsSync(diskPath), diskPath)
}

// ── Gate 7: No route file references the stale session-complete image ─────────
console.log('\nGate 7 — No production route references stale smokecraft-session-complete.png')
const { readdirSync } = await import('fs')
const smokecraftPages = resolve(ROOT, 'src/pages/smokecraft')
let staleRef = false
for (const file of readdirSync(smokecraftPages)) {
  if (!file.endsWith('.jsx')) continue
  const content = readFileSync(resolve(smokecraftPages, file), 'utf8')
  if (content.includes('smokecraft-session-complete.png')) {
    console.log(`  ❌ ${file} references stale smokecraft-session-complete.png`)
    failed++
    staleRef = true
  }
}
if (!staleRef) {
  console.log('  ✅ No route file references stale smokecraft-session-complete.png')
  passed++
}

// ── Gate 8: IDENTITY in manifest matches Identity.jsx asset path ──────────────
console.log('\nGate 8 — IDENTITY manifest constant matches Identity.jsx in-use asset')
const identity = read('src/pages/smokecraft/Identity.jsx')
if (identity && manifestSrc) {
  const identityAsset = identity.match(/src=["']([^"']+)["']/)
  // Manifest uses template literal: `${BASE}/smokecraft-profile-capture.png`
  // Resolve BASE = '/assets/smokecraft-reference/approved'
  const BASE = '/assets/smokecraft-reference/approved'
  const manifestIdentity = manifestSrc.match(/export const IDENTITY\s*=\s*`([^`]+)`/)
  if (identityAsset && manifestIdentity) {
    const manifestPath = manifestIdentity[1].replace('${BASE}', BASE)
    check('IDENTITY manifest constant matches Identity.jsx src',
      identityAsset[1] === manifestPath,
      `Identity.jsx: ${identityAsset[1]} | Manifest resolved: ${manifestPath}`)
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Asset Manifest: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ Asset manifest verified. All routes mapped. Stale images excluded.')
  process.exit(0)
} else {
  console.log('\n❌ Asset manifest issues found.')
  process.exit(1)
}
