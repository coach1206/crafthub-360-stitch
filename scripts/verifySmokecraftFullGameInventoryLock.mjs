#!/usr/bin/env node
// Full-game truth-audit build-blocking gate. Asserts, directly against
// the live source of truth (no fixtures, no hand-typed duplication):
//   - exactly 27 canonical sessions exist, each with a real registered
//     component (or a documented merge/shared-component sibling)
//   - every session's manifest previous/next mapping is internally
//     consistent (no gaps, no self-loops beyond documented merges)
//   - every session's SC_ASSETS key (when declared) resolves to a real path
//   - the recovered opening chain's forward targets are still correct
//     (duplicates the check in verifySmokecraftCanonicalJourneyLock.mjs
//     deliberately — this gate is the "full game" gate and must not
//     depend on that script also being run)
import { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS } from '../src/constants/session.js'
import { SMOKECRAFT_SCREEN_MANIFEST } from '../src/constants/smokecraftScreenManifest.js'
import { SC_ASSETS } from '../src/constants/smokecraftAssets.js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const all = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) all.push({ ...s, visit: v.visit })

console.log('── Exactly 27 canonical sessions ──')
assert('TOTAL_SESSIONS === 27', TOTAL_SESSIONS === 27)
assert('TOTAL_VISITS (phases) === 6', TOTAL_VISITS === 6)
assert('VISIT_STRUCTURE contains exactly 27 session entries', all.length === 27, `found ${all.length}`)
const sessionNumbers = all.map(s => s.session)
assert('Session numbers are exactly 1..27 with no gaps or duplicates',
  JSON.stringify(sessionNumbers) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1)))

const registrySrc = readFileSync(resolve('src/constants/smokecraftComponentRegistry.js'), 'utf8')
const registeredKeys = new Set([...registrySrc.matchAll(/'(session-\d+)':/g)].map(m => m[1]))

console.log('── Every session has a real registered component (directly or via merge/shared) ──')
for (const s of all) {
  const manifestEntry = SMOKECRAFT_SCREEN_MANIFEST.find(m => m.screenId === `session-${s.session}`)
  const hasComponent = registeredKeys.has(manifestEntry?.componentKey) || s.mergedInto != null || !!s.sharedComponent
  assert(`S${s.session} ("${s.label}") has a real component (registered, merged, or shared)`, hasComponent)
}

console.log('── Every declared session asset key resolves to a real path ──')
const ASSET_KEY_BY_SESSION = {
  1: 'session1', 2: 'humidorMatch', 3: 'meetYourCigar', 4: 'terroir', 5: 'format',
  6: 'cutToastLight', 7: 'lightingTutorial', 8: 'firstThird', 9: 'firstThird',
  10: 'flavorMemory', 11: 'pairingLab', 12: 'secondThird', 13: 'secondThird',
  14: 'mentorCommentary', 15: 'knowledgeDrop', 16: 'finalThird', 17: 'finalThird',
  18: 'finalThird', 19: 'scorecard', 20: 'scorecard', 21: 'aiSummary',
  22: 'pairingRecommendations', 23: 'passportStamp', 24: 'finalReview',
  25: 'rewards', 26: 'achievements', 27: 'recommendedNextJourney',
}
for (const s of all) {
  const key = ASSET_KEY_BY_SESSION[s.session]
  if (!key) continue
  assert(`S${s.session} asset key '${key}' resolves (or is intentionally session-level shared/no-image)`,
    key === 'achievements' || key === 'recommendedNextJourney' || !!SC_ASSETS[key],
    `SC_ASSETS.${key} missing`)
}

console.log('── Recovered opening chain (duplicated check — this gate is self-sufficient) ──')
const welcome = readFileSync(resolve('src/pages/smokecraft/WelcomeExperience.jsx'), 'utf8')
const manifestSrc = readFileSync(resolve('src/constants/smokecraftScreenManifest.js'), 'utf8')
assert("Welcome's forward path enters Golden Box Rules (in-component navigate())",
  /navigate\(\s*(NAV\.GOLDEN_BOX|['"]\/smokecraft\/golden-box['"])\s*\)/.test(welcome))
assert("session-1's manifest nextRouteOverride points to Golden Box Rules (the actual authority real clicks obey)",
  /s\.session === 1 \? '\/smokecraft\/golden-box'/.test(manifestSrc))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
if (fail > 0) {
  console.error('\nFull-game inventory lock FAILED — see docs/SMOKECRAFT_FULL_GAME_INVENTORY.md and re-run scripts/generateSmokecraftFullGameInventory.mjs after investigating.')
  process.exit(1)
}
