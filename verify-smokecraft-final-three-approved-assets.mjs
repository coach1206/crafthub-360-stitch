#!/usr/bin/env node
/**
 * verify-smokecraft-final-three-approved-assets.mjs
 *
 * Mandate: close (or honestly disclose) the three remaining SmokeCraft
 * `missing-approved-asset` screens — Welcome/Session 1, Rewards/Session 25,
 * and Resume Journey — by locating and wiring their EXACT approved GitHub
 * images, without changing sequence, backend logic, or the completed
 * touchscreen/haptic/tactile work.
 *
 * OUTCOME THIS PASS: no genuine approved asset exists for any of the three.
 * This suite therefore encodes the Phase-6 "missing-asset decision" as
 * executable, self-checking assertions so the conclusion cannot silently rot:
 * if the repo owner later uploads a real Welcome / Session-25 / Resume visual,
 * the corresponding assertion here FLIPS AND FAILS, which is the signal to
 * re-run the wiring pass.
 *
 * Scope note (honest): these are static/source-level assertions over the repo
 * and the asset files on disk. The runtime/browser conditions from the mandate
 * (entry-sequence guard, canonical navigation, touchscreen, haptic capability
 * safety, keyboard/focus, four-viewport rendering) are already proven by the
 * established Playwright suites and are NOT re-derived here:
 *   - verify-smokecraft-full-journey-sequence-and-assets.mjs
 *   - verify-smokecraft-full-touch-haptic-tactile.mjs
 *   - verify-smokecraft-entry-prerequisite-guard.mjs
 * Because this pass changed ZERO application source, those suites' behaviour
 * is unaffected by definition. See the final report for what was actually run.
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
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

// Files that this pass must NOT have touched.
const LOCKED = [
  'src/pages/smokecraft/RewardsCenter.jsx',
  'src/pages/smokecraft/Leaderboard.jsx',
  'src/constants/session.js',
  'src/pages/smokecraft/WelcomeExperience.jsx',
  'src/pages/smokecraft/Rewards.jsx',
  'src/pages/smokecraft/ResumeJourney.jsx',
  'src/constants/smokecraftAssets.js',
]

const BASE_COMMIT = 'bb2e52bd6d154b494171c4122732110acafa7278'

console.log('\n=== SmokeCraft final three approved assets — verification ===\n')

console.log('--- Section A: asset-existence truth (the Phase-6 decision) ---')

// A1-A3. No approved Welcome / Resume asset exists anywhere in the repo or in
// git history, under any capitalisation, spacing or punctuation variant.
const ALL_TRACKED = execFileSync(
  'git', ['log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
  { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 },
).toString().split('\n').map((s) => s.trim()).filter(Boolean)

const IMAGE_RE = /\.(png|jpe?g|webp)$/i
const everyImageEverAdded = [...new Set(ALL_TRACKED.filter((p) => IMAGE_RE.test(p)))]
// Design/proof scratch space and third-party tool exports are not owner-approved
// SmokeCraft production assets; approved uploads land under public/assets/**.
const approvedSpace = everyImageEverAdded.filter(
  (p) => p.startsWith('public/assets/') || p.startsWith('public/smokecraft/'),
)

check('A1 no approved asset named for Welcome / "Today\'s Experience" has ever existed', () => {
  const hits = approvedSpace.filter((p) => /welcome|today.?s?[ _-]?experience/i.test(p))
  return hits.length === 0 || `unexpected candidate(s) appeared: ${hits.join(', ')} — RE-RUN THE WIRING PASS`
})

check('A2 no approved asset named for Resume / Start-Resume Journey has ever existed', () => {
  const hits = approvedSpace.filter((p) => /resume/i.test(p))
  return hits.length === 0 || `unexpected candidate(s) appeared: ${hits.join(', ')} — RE-RUN THE WIRING PASS`
})

check('A3 the only approved rewards-space images remain REWARDS 222 and Reward Center', () => {
  const hits = approvedSpace.filter((p) => /reward/i.test(p) && IMAGE_RE.test(p))
  const names = [...new Set(hits.map((p) => path.basename(p)))].sort()
  const expected = ['REWARDS 222.png', 'Reward Center.png']
  return JSON.stringify(names) === JSON.stringify(expected)
    || `rewards-space images changed: ${names.join(', ')} — RE-EXAMINE FOR A NEW S25 ASSET`
})

// A4. "Badge Collection.png" is a 1-byte GitHub web-UI placeholder, not an
// image. It must never be wired as the Session-25 asset.
check('A4 "Badge Collection.png" is a 1-byte placeholder, not a real image', () => {
  const p = R('public/assets/smokecraft/Badge Collection.png')
  if (!existsSync(p)) return 'file vanished — re-audit'
  const size = statSync(p).size
  const buf = readFileSync(p)
  const isPng = buf.length >= 8 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG'
  if (isPng) return `it is NOW A REAL PNG (${size} bytes) — RE-RUN THE WIRING PASS FOR SESSION 25`
  return size <= 8 || `unexpected size ${size}`
})

check('A5 the owner\'s smokecraft/passport/ upload folder is still empty (no new asset)', () => {
  const dir = R('public/assets/smokecraft/passport')
  if (!existsSync(dir)) return true
  const entries = execFileSync('ls', ['-A', dir]).toString().split('\n').filter(Boolean)
  const nonKeep = entries.filter((e) => e !== '.gitkeep')
  return nonKeep.length === 0 || `new upload(s) present: ${nonKeep.join(', ')} — RE-AUDIT`
})

console.log('\n--- Section B: rejected-candidate integrity ---')

// B1. REWARDS 222.png is a fully-baked mock dashboard (baked "WELCOME GUEST"
// identity, 2,750 XP, 12 badges, 5 stamps, 9-of-11 progress). It is therefore
// only legitimate as a DECORATIVE header, never as a live visual foundation.
check('B1 REWARDS 222.png is unmodified (the rejected, fully-baked S25 candidate)', () => {
  const p = R('public/assets/smokecraft/REWARDS 222.png')
  const h = sha256(p)
  return h === '986196149e83c89562bf317763c5ba8eb7332546090189f441fec9fd01a99895'
    || `hash changed to ${h} — the asset was replaced; RE-INSPECT IT VISUALLY`
})

check('B2 Rewards.jsx uses REWARDS 222 only as a decorative CSS background, not a bounds overlay', () => {
  const src = read('src/pages/smokecraft/Rewards.jsx')
  const decorative = /backgroundImage:\s*`linear-gradient\([^`]*url\(\$\{[^`]*SC_ASSETS\.rewards/.test(src)
  const noOverlay = !src.includes('SmokeCraftImageBoundsOverlay')
  return (decorative && noOverlay) || `decorative=${decorative} noOverlay=${noOverlay}`
})

check('B3 Reward Center.png (RewardsCenter.jsx, a DIFFERENT screen) is untouched', () => {
  const h = sha256(R('public/assets/smokecraft/rewards/Reward Center.png'))
  return h === '489ad9ca433454358545e762d1f7718295cfed4fc0c4230791d096fd114ffc30'
    || `hash changed to ${h}`
})

check('B4 SC_ASSETS.rewards and SC_ASSETS.rewardCenter remain distinct screens', () => {
  const src = read('src/constants/smokecraftAssets.js')
  const rewards = /rewards:\s*`\$\{RAW\}\/REWARDS%20222\.png`/.test(src)
  const center = /rewardCenter:\s*`\$\{RAW\}\/rewards\/Reward%20Center\.png`/.test(src)
  return (rewards && center) || `rewards=${rewards} rewardCenter=${center}`
})

check('B5 SC_ASSETS.resume remains the honestly-disclosed decorative placeholder', () => {
  const src = read('src/constants/smokecraftAssets.js')
  const disclosed = /ResumeJourney\.jsx has no image of its own to date/.test(src)
  const placeholder = /resume:\s*`\$\{CROPPED\}\/golden-box-hero-v2\.jpg`/.test(src)
  return (disclosed && placeholder) || `disclosed=${disclosed} placeholder=${placeholder}`
})

console.log('\n--- Section C: the three screens remain live, un-degraded components ---')

check('C1 WelcomeExperience.jsx has NO image wiring at all (no false visual claim)', () => {
  const src = read('src/pages/smokecraft/WelcomeExperience.jsx')
  return (!src.includes('SC_ASSETS') && !src.includes('SmokeCraftImageBoundsOverlay'))
    || 'an image was wired — this pass must not have done that'
})

check('C2 WelcomeExperience.jsx keeps its real tactile/expandable preview controls', () => {
  const src = read('src/pages/smokecraft/WelcomeExperience.jsx')
  const needed = ['Cigar Preview', 'Mentor Preview', 'Golden Box']
  const missing = needed.filter((n) => !new RegExp(n.replace(/ /g, '\\s*'), 'i').test(src))
  return missing.length === 0 || `missing preview content: ${missing.join(', ')}`
})

check('C3 Welcome renders no baked identity — no hardcoded "Guest" standing in for a real learner', () => {
  const src = read('src/pages/smokecraft/WelcomeExperience.jsx')
  // A baked literal identity would look like  >Guest<  or  = 'Guest'
  return !/>\s*Guest\s*</.test(src) || 'a literal Guest identity is rendered'
})

check('C4 ResumeJourney.jsx delegates to the shared journey-status authority (no duplicated logic)', () => {
  const src = read('src/pages/smokecraft/ResumeJourney.jsx')
  return /computeJourneyStatus|resolveSmokeCraftEntryDestination/.test(src)
    || 'resume no longer derives from the canonical journey-status helpers'
})

check('C5 Rewards.jsx keeps its S25/S26 completion + mode-toggle logic intact', () => {
  const src = read('src/pages/smokecraft/Rewards.jsx')
  const a = src.includes("awardSessionRewards('rewards')") || src.includes('awardSessionRewards("rewards")')
  const b = src.includes("awardSessionRewards('achievements')") || src.includes('awardSessionRewards("achievements")')
  const toggle = /mode\s*===\s*'achievements'/.test(src)
  return (a && b && toggle) || `rewards=${a} achievements=${b} toggle=${toggle}`
})

console.log('\n--- Section D: architecture and locked-file safety gate ---')

check('D1 the 6-phase / 27-session spine is unchanged', () => {
  const src = read('src/constants/session.js')
  const phases = /TOTAL_PHASES\s*=\s*TOTAL_VISITS/.test(src)
  const marker = /27-session,?\s*6-phase/i.test(src)
  return (phases && marker) || `phases=${phases} marker=${marker}`
})

check('D2 no application source file was modified relative to the base commit', () => {
  const changed = execFileSync(
    'git', ['diff', '--name-only', BASE_COMMIT, '--'],
    { cwd: ROOT },
  ).toString().split('\n').filter(Boolean)
  const appChanges = changed.filter(
    (p) => p.startsWith('src/') || p.startsWith('server/') || p.startsWith('public/assets/'),
  )
  return appChanges.length === 0 || `application files changed: ${appChanges.join(', ')}`
})

for (const f of LOCKED) {
  check(`D3 locked file unchanged since base commit: ${f}`, () => {
    const out = execFileSync('git', ['diff', '--name-only', BASE_COMMIT, '--', f], { cwd: ROOT })
      .toString().trim()
    return out === '' || `modified: ${out}`
  })
}

check('D4 no approved asset was deleted, renamed or overwritten', () => {
  const out = execFileSync(
    'git', ['diff', '--name-status', '--diff-filter=DRM', BASE_COMMIT, '--', 'public/assets/'],
    { cwd: ROOT },
  ).toString().trim()
  return out === '' || `asset mutations: ${out}`
})

check('D5 no new artwork was created by this pass', () => {
  const out = execFileSync(
    'git', ['diff', '--name-only', '--diff-filter=A', BASE_COMMIT, '--', 'public/assets/'],
    { cwd: ROOT },
  ).toString().split('\n').filter(Boolean).filter((p) => IMAGE_RE.test(p))
  return out.length === 0 || `new images added: ${out.join(', ')}`
})

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (${pass + fail} total) ===`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f}`)
}
process.exit(fail === 0 ? 0 : 1)
