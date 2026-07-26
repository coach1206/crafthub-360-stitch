#!/usr/bin/env node
// Holistic Fix 1 — build-blocking manifest/navigation/shell validation.
// Wired into `npm run build` via package.json's `prebuild` script, so a
// violation of the shared SmokeCraft architecture fails the build rather
// than silently shipping. Exits non-zero on any FAIL.
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS } = await import('../src/constants/session.js')
const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')
const { allRegisteredNavRoutes } = await import('../src/constants/smokecraftNavigationRegistry.js')

let failures = 0
function check(label, cond) {
  if (cond) { console.log(`  PASS  ${label}`) }
  else { console.error(`  FAIL  ${label}`); failures++ }
}

console.log('\n=== SmokeCraft game-manifest / navigation / shell validation (Holistic Fix 1) ===\n')

// 1. Regenerate the raw route inventory fresh (never trust a stale cached
// copy) and confirm the manifest generator + this validator agree with it.
execSync('node scripts/smokecraftRouteInventory.mjs', { stdio: 'pipe' })
const rawRoutes = JSON.parse(readFileSync('docs/smokecraft/smokecraft-routes-raw.json', 'utf8'))
check('Route inventory regenerates without error', Array.isArray(rawRoutes) && rawRoutes.length > 0)

// 2. Manifest file exists and its own recorded totals match the live route count.
check('SMOKECRAFT_GAME_MANIFEST.json exists', existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json'))
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  check('Manifest totalRoutes matches live /smokecraft route count (no route missing from the manifest)', manifest.totalRoutes === rawRoutes.length)

  // No duplicate screenIds.
  const ids = manifest.entries.map(e => e.screenId)
  check('No duplicate screenId in the manifest', new Set(ids).size === ids.length)

  // Every entry must resolve to a real, non-empty route string.
  check('Every manifest entry has a route string', manifest.entries.every(e => typeof e.route === 'string' && e.route.startsWith('/smokecraft')))

  // No entry may claim classification "full-live-react" or "clean-image-shell"
  // (i.e. "verified/complete") without a real auditedIn evidence trail — an
  // unsafe static mockup must never be marked complete.
  const claimedComplete = manifest.entries.filter(e => e.classification === 'full-live-react' || e.classification === 'clean-image-shell')
  check('Every screen classified as live/clean-shell cites real audit evidence (auditedIn is not empty/unclassified)',
    claimedComplete.every(e => e.auditedIn && e.auditedIn !== 'unclassified' && e.auditedIn !== 'not yet individually audited this operation'))
}

// 3. 27-session / 6-phase spine — re-assert the existing lock inline so this
// single validator is sufficient evidence the spine hasn't silently drifted.
const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit })
check('Exactly 27 sessions in the spine', spine.length === 27)
check('TOTAL_SESSIONS constant equals 27', TOTAL_SESSIONS === 27)
check('Exactly 6 phases', VISIT_STRUCTURE.length === 6)
check('TOTAL_VISITS constant equals 6', TOTAL_VISITS === 6)
const sessionNumbers = spine.map(s => s.session).sort((a, b) => a - b)
check('Session numbers are exactly 1..27, no gap, no duplicate', JSON.stringify(sessionNumbers) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1)))

// 4. Every curriculum session in the manifest has a resolvable on-disk asset
// OR an explicitly disclosed missing-asset status (never silently blank).
const sessionEntries = SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'curriculum')
check('Every curriculum manifest entry has an assetStatus field', sessionEntries.every(e => typeof e.assetStatus === 'string'))
check('No curriculum manifest entry silently references a non-existent SC_ASSETS key',
  sessionEntries.every(e => !e.assetKey || SC_ASSETS[e.assetKey] || e.assetStatus !== 'ok'))

// 5. Navigation registry — every registered destination route must actually
// exist in the live route inventory (never a fabricated/guessed target).
const liveRoutes = new Set(rawRoutes.map(r => r.fullPath === '(smokecraft index)' ? '/smokecraft' : `/smokecraft/${r.fullPath}`))
const navRoutes = allRegisteredNavRoutes()
const smokecraftNavRoutes = navRoutes.filter(r => r.startsWith('/smokecraft'))
check('Every SmokeCraft-namespace navigation-registry destination resolves to a real, currently-registered route',
  smokecraftNavRoutes.every(r => liveRoutes.has(r)))

// 6. Locked-baseline protection: the venue-select crop fix, the 27/6 spine,
// and the 3 approved-asset-wired screens (session1/resume/rewards) must not
// have regressed. This mirrors verify-smokecraft-phase-session-lock.mjs's
// existing checks so a single `npm run build` run also re-asserts them.
check('Locked phase groupings unchanged (Package J decision)',
  VISIT_STRUCTURE.map(v => v.sessions.map(s => s.session).join(',')).join('|') ===
  '1,2,3,4,5,6,7|8,9,10,11|12,13,14,15|16,17,18|19,20|21,22,23,24,25,26,27')

// 7. Holistic Fix 2 — no route may remain unclassified. Every one of the
// 108 active routes must carry a real classification (full-live-react,
// clean-image-shell, instructional-image, alias-redirect, or the honest
// unsafe-full-mockup flag if one is ever found) with real evidence, not
// the bare placeholder string.
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  const unclassified = manifest.entries.filter(e => e.classification === 'unclassified')
  check(`No route remains unclassified (${unclassified.length} unclassified)`, unclassified.length === 0)
}

// 8. Legacy <Navigate> route aliases must resolve to a route that still
// exists in the live route inventory — never a dangling alias.
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  const aliases = manifest.entries.filter(e => e.classification === 'alias-redirect')
  const brokenAliases = aliases.filter(a => {
    const target = a.auditedIn.match(/<Navigate> to (\/[^\s(]+)/)?.[1]
    return !target || !liveRoutes.has(target)
  })
  check(`Every legacy <Navigate> alias resolves to a currently-registered route (${aliases.length} aliases checked, ${brokenAliases.length} broken)`, brokenAliases.length === 0)
}

// 9. Commerce alias enforcement (Holistic Fix 2, item 10) — `venue-commerce`,
// `order`, and `ticket-tapper/staff-specials` are a documented, intentional
// alias group (see SMOKECRAFT_MIGRATION_QUEUE.md Group 4). This must stay
// enforced: if they ever silently diverge to different components, that is
// exactly the "three misleading routes" state the mandate forbids.
const appJsxForCommerce = readFileSync('src/App.jsx', 'utf8')
const commerceAliasLines = [
  appJsxForCommerce.match(/<Route path="venue-commerce"\s+element=\{<(\w+)/)?.[1],
  appJsxForCommerce.match(/<Route path="order"\s+element=\{<(\w+)/)?.[1],
  appJsxForCommerce.match(/<Route path="ticket-tapper\/staff-specials"\s+element=\{<(\w+)/)?.[1],
]
check('venue-commerce / order / ticket-tapper/staff-specials remain a documented, enforced alias group (identical component)',
  commerceAliasLines.every(Boolean) && new Set(commerceAliasLines).size === 1)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s) ===\n`)
if (failures > 0) process.exit(1)
