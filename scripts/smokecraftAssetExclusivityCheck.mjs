#!/usr/bin/env node
// SmokeCraft System Audit — Prompt 2, Part 9.
// Validation script: fails when an asset is used by unrelated routes outside
// its declared merged-session group, when a route references a missing
// asset, or when two SC_ASSETS keys resolve to conflicting/duplicate files
// in a way that isn't an intentional declared exception.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')
const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')

let pass = 0, fail = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

function decode(u) { return decodeURIComponent(String(u).split('?')[0]) }
function diskPath(assetKey) { return 'public' + decode(SC_ASSETS[assetKey]) }
function sha(p) { return createHash('sha256').update(readFileSync(p)).digest('hex') }

console.log('\n=== SmokeCraft asset exclusivity validation ===\n')

// 1. Every asset key referenced by the manifest resolves to a file on disk.
let missing = []
for (const m of SMOKECRAFT_SCREEN_MANIFEST) {
  if (!m.assetKey) continue
  if (!SC_ASSETS[m.assetKey]) { missing.push(`${m.screenId}: assetKey "${m.assetKey}" not in SC_ASSETS`); continue }
  if (!existsSync(diskPath(m.assetKey))) missing.push(`${m.screenId}: ${SC_ASSETS[m.assetKey]} missing on disk`)
}
check('Every session route with an asset key resolves to a real file on disk', missing.length === 0, missing.join('; '))

// 2. No session lacks an asset key entirely (curriculum sessions only).
const curriculum = SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'curriculum')
const noAsset = curriculum.filter(m => !m.assetKey)
check('No curriculum session lacks an asset key', noAsset.length === 0, noAsset.map(m => m.screenId).join(', '))

// 3. Session-1/Welcome image is not reused by CraftHub, and vice versa.
check('session1 and craftHubVenueTable resolve to different files',
  SC_ASSETS.session1 !== SC_ASSETS.craftHubVenueTable)
if (existsSync(diskPath('session1')) && existsSync(diskPath('craftHubVenueTable'))) {
  check('session1 and craftHubVenueTable are not byte-identical',
    sha(diskPath('session1')) !== sha(diskPath('craftHubVenueTable')))
}

// 4. Leaderboard uses its own distinct, non-stale asset (per disclosed history: LEADERBOARD 111.png supersedes the older NEW DEMO LOUNG RANKING.png).
check('SC_ASSETS.leaderboard points to LEADERBOARD 111.png (the disclosed newest approved asset)',
  /LEADERBOARD%20111\.png/.test(SC_ASSETS.leaderboard), SC_ASSETS.leaderboard)

// 5. Venue Selection asset is not used by any other screen.
const venueSelectUsers = Object.entries(SC_ASSETS).filter(([, v]) => v === SC_ASSETS.venueSelect).map(([k]) => k)
check('venueSelect asset key is used by exactly one SC_ASSETS entry (itself)', venueSelectUsers.length === 1, venueSelectUsers.join(', '))

// 6. Declared merged-session groups are the only legitimate asset-sharing case.
const declaredGroups = [['session-8', 'session-9'], ['session-12', 'session-13'],
  ['session-16', 'session-17', 'session-18'], ['session-19', 'session-20']]
const byHash = new Map()
for (const m of SMOKECRAFT_SCREEN_MANIFEST) {
  if (!m.assetKey || !existsSync(diskPath(m.assetKey))) continue
  const h = sha(diskPath(m.assetKey))
  if (!byHash.has(h)) byHash.set(h, [])
  byHash.get(h).push(m.screenId)
}
const sharedGroups = [...byHash.values()].filter(g => g.length > 1).map(g => g.sort().join(','))
const undeclaredSharing = sharedGroups.filter(g => !declaredGroups.some(d => d.sort().join(',') === g))
check('No approved asset is reused outside its declared merged-session group', undeclaredSharing.length === 0, undeclaredSharing.join(' | '))

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (${pass + fail} total) ===`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f}`)
}
process.exit(fail === 0 ? 0 : 1)
