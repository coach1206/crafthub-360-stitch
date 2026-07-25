#!/usr/bin/env node
// verify-smokecraft-phase-session-lock.mjs
//
// SmokeCraft System Audit — Prompt 2, Part 2 locking test.
//
// Protects the CURRENT, real, already-implemented 27-session / 6-phase
// structure from silent drift. See docs/smokecraft/SMOKECRAFT_PHASE_RECONCILIATION.md
// for why this asserts 6 phases (the deliberate, tested, shipped "Package J"
// decision) rather than the original pre-implementation 7-phase plan, which
// was superseded before this recovery operation began and has no preserved
// session-to-phase breakdown to restore from.
import { VISIT_STRUCTURE, TOTAL_VISITS, TOTAL_SESSIONS } from './src/constants/session.js'

let pass = 0, fail = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit })

console.log('\n=== SmokeCraft phase/session lock ===\n')

check('Exactly 27 sessions in the spine', spine.length === 27, `got ${spine.length}`)
check('TOTAL_SESSIONS constant equals 27', TOTAL_SESSIONS === 27, `got ${TOTAL_SESSIONS}`)
check('Exactly 6 phases (VISIT_STRUCTURE.length)', VISIT_STRUCTURE.length === 6, `got ${VISIT_STRUCTURE.length}`)
check('TOTAL_VISITS constant equals 6', TOTAL_VISITS === 6, `got ${TOTAL_VISITS}`)

const sessionNumbers = spine.map(s => s.session)
const expected = Array.from({ length: 27 }, (_, i) => i + 1)
check('Session numbers are exactly 1..27, no gap, no duplicate, no extra',
  JSON.stringify([...sessionNumbers].sort((a, b) => a - b)) === JSON.stringify(expected))

const phaseNumbers = [...new Set(spine.map(s => s.visit))].sort((a, b) => a - b)
check('Phase numbers are exactly 1..6 contiguously', JSON.stringify(phaseNumbers) === JSON.stringify([1, 2, 3, 4, 5, 6]))

// No session appears in more than one phase, and no session is missing.
const seenSessions = new Set()
let noDuplicateAcrossPhases = true
for (const s of spine) {
  if (seenSessions.has(s.session)) noDuplicateAcrossPhases = false
  seenSessions.add(s.session)
}
check('No session appears in more than one phase', noDuplicateAcrossPhases)
check('No session missing from any phase (all 27 accounted for)', seenSessions.size === 27, `got ${seenSessions.size}`)

// Exact locked phase groupings from the Package J decision, protected against drift.
const EXPECTED_PHASE_RANGES = {
  1: [1, 7],   // Session Preparation
  2: [8, 11],  // First Third
  3: [12, 15], // Second Third
  4: [16, 18], // Final Third
  5: [19, 20], // Reflection
  6: [21, 27], // Results
}
let phaseRangesMatch = true
for (const [phase, [lo, hi]] of Object.entries(EXPECTED_PHASE_RANGES)) {
  const sessionsInPhase = spine.filter(s => s.visit === Number(phase)).map(s => s.session).sort((a, b) => a - b)
  const expectedRange = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  if (JSON.stringify(sessionsInPhase) !== JSON.stringify(expectedRange)) phaseRangesMatch = false
}
check('Locked phase groupings match the Package J decision exactly', phaseRangesMatch)

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (${pass + fail} total) ===`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f}`)
}
process.exit(fail === 0 ? 0 : 1)
