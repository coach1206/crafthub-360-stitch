#!/usr/bin/env node
/**
 * SmokeCraft Canonical Journey Recovery — build-blocking sequence lock.
 *
 * Forensically recovered from repository evidence (see
 * docs/SMOKECRAFT_CANONICAL_JOURNEY.md,
 * docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md,
 * docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md): three real, fully-built
 * screens — Golden Box Rules, Mentor Selection, Seed & Soil — already
 * exist and already connect to each other and to Humidor Match
 * (S2), but were only ever reachable via optional side-navigation, never
 * from the primary "Begin Experience" path a real player actually takes.
 * WelcomeExperience.jsx's own Begin Experience button jumped straight to
 * Humidor Match, silently skipping all three. This is the exact "designed
 * screens now being skipped" defect the owner reported (SC-D077).
 *
 * This is a pure static-source lock — no server/browser required, safe to
 * run in `prebuild` on every build — that fails loudly the moment any of
 * these forward-navigation targets silently drifts again:
 *
 *   Welcome            -> Golden Box Rules   (primary path, NOT Humidor Match directly)
 *   Golden Box Rules   -> Mentor Selection
 *   Mentor Selection   -> Seed & Soil
 *   Seed & Soil        -> Humidor Match (S2)
 *   Humidor Match      -> Meet Your Cigar (S3)
 *
 * It also asserts HumidorMatch.jsx never again renders the baked mockup
 * (SC-D076) and that TOTAL_SESSIONS/TOTAL_VISITS numbering was not
 * silently changed by this recovery pass (stable IDs, no renumbering,
 * per the authoritative route graph's own explicit approach).
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function src(relPath) {
  return readFileSync(resolve(relPath), 'utf8')
}

const welcome    = src('src/pages/smokecraft/WelcomeExperience.jsx')
const goldenBox  = src('src/pages/smokecraft/GoldenBox.jsx')
const mentor     = src('src/pages/smokecraft/Mentor.jsx')
const seedSoil   = src('src/pages/smokecraft/SeedSoil.jsx')
const humidor    = src('src/pages/smokecraft/HumidorMatch.jsx')
const meetCigar  = src('src/pages/smokecraft/MeetYourCigar.jsx')
const sessionDef = src('src/constants/session.js')
const manifest   = src('src/constants/smokecraftScreenManifest.js')

console.log('── Manifest-level completion route (the ACTUAL authority — SmokeCraftScreenRenderer\'s onComplete short-circuits any in-component navigate() call) ──')
assert("session-1's nextRouteOverride points to Golden Box Rules, not the auto-derived session-2 (Humidor Match)",
  /s\.session === 1 \? '\/smokecraft\/golden-box'/.test(manifest))

console.log('── Canonical opening sequence (recovered, locked) ──')

assert("Welcome's primary forward path enters Golden Box Rules (not a direct jump to Humidor Match)",
  /navigate\(\s*(NAV\.GOLDEN_BOX|['"]\/smokecraft\/golden-box['"])\s*\)/.test(welcome))
assert("Welcome's primary forward path does NOT jump directly to Humidor Match (the recovered defect)",
  !/navigate\(\s*['"]\/smokecraft\/humidor-match['"]\s*\)/.test(welcome))

assert('Golden Box Rules forward path leads to Mentor Selection',
  /navigate\(\s*NAV\.MENTOR\s*\)/.test(goldenBox) || /navigate\(\s*['"]\/smokecraft\/mentor-selection['"]\s*\)/.test(goldenBox))

assert('Mentor Selection forward path leads to Seed & Soil',
  /navigate\(\s*['"]\/smokecraft\/seed-soil['"]\s*\)/.test(mentor))

assert('Seed & Soil forward path leads to Humidor Match (S2)',
  /navigate\(\s*['"]\/smokecraft\/humidor-match['"]\s*\)/.test(seedSoil))

assert('Humidor Match forward path leads to Meet Your Cigar (S3) — unchanged, already correct',
  /navigate\(\s*['"]\/smokecraft\/meet-your-cigar['"]\s*\)/.test(humidor))

assert('Meet Your Cigar forward path leads to Terroir (S4) — unchanged, already correct',
  /navigate\(\s*['"]\/smokecraft\/terroir['"]\s*\)/.test(meetCigar))

console.log('── No regression to baked/static gameplay (SC-D076) ──')
assert('HumidorMatch.jsx never re-imports the image-shell/overlay baked-mockup pattern',
  !/SmokeCraftImageBoundsOverlay|mode="image-shell"/.test(humidor))
assert('HumidorMatch.jsx still uses the real live-DOM environment radiogroup',
  /role="radiogroup"/.test(humidor) && /pickEnv\(/.test(humidor))

console.log('── Session numbering not silently renumbered by this recovery pass ──')
assert('TOTAL_SESSIONS remains 27', /TOTAL_SESSIONS\s*=\s*27/.test(sessionDef))
assert('TOTAL_VISITS remains 6', /TOTAL_VISITS\s*=\s*6/.test(sessionDef))
assert("Humidor Match remains session 2 (id: 'humidor-match')",
  /session:\s*2,\s*id:\s*'humidor-match'/.test(sessionDef))
assert("Welcome remains session 1 (id: 'entry')",
  /session:\s*1,\s*id:\s*'entry'/.test(sessionDef))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
if (fail > 0) {
  console.error('\nCanonical journey lock FAILED — a forward-navigation target or session number drifted. This is a build-blocking gate (see docs/SMOKECRAFT_CANONICAL_JOURNEY.md).')
  process.exit(1)
}
