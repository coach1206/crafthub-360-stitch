#!/usr/bin/env node
// Build-blocking gate for SC-D078: every distinct completion key used by
// the 27-session canonical spine (VISIT_STRUCTURE) must have a real
// SESSION_REWARDS entry. awardSessionRewards() hard-returns when
// getSessionRewards(sessionId) is null — a missing entry means that
// session's real-UI completion is a silent no-op: no XP, no
// completedSteps record, and every session after it permanently locked
// for a real player, even though a server-authoritative test suite that
// completes sessions via a different, direct endpoint would never catch
// it (exactly what happened here — found only by a real, fresh, full
// browser click-through, not by the backend fresh-player suite).
import { VISIT_STRUCTURE } from '../src/constants/session.js'
import { SESSION_REWARDS } from '../src/constants/smokecraftRewards.js'

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const all = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) all.push(s)
const distinctIds = [...new Set(all.map(s => s.id))]

console.log(`── ${distinctIds.length} distinct canonical completion keys — every one must have a real SESSION_REWARDS entry ──`)
for (const id of distinctIds) {
  assert(`'${id}' has a real SESSION_REWARDS entry (awardSessionRewards('${id}') will not silently no-op)`,
    !!SESSION_REWARDS[id], `SESSION_REWARDS['${id}'] is missing`)
}

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
if (fail > 0) {
  console.error('\nSession rewards completeness gate FAILED (SC-D078 regression) — see docs/smokecraft/SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md.')
  process.exit(1)
}
