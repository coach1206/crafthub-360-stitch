/**
 * Verification script for SmokeCraft XP + badge reward logic.
 * Run with: node src/constants/smokecraftRewards.test.js
 *
 * Tests all 6 scenarios from the spec without a browser.
 */

import {
  SESSION_REWARDS,
  getSessionRewards,
  getVisitRewards,
  getSmokeCraftXP,
  getEarnedBadges,
  isVisitComplete,
  getNextUnlock,
  getSmokeCraftRank,
  SMOKECRAFT_BADGES,
} from './smokecraftRewards.js'

// ── Minimal GuestSession state simulator ─────────────────────────────────────
function makeSession() {
  return { completedSteps: [], xp: 0, badges: [] }
}

function awardSessionRewards(session, sessionId) {
  const rewards = getSessionRewards(sessionId)
  if (!rewards) throw new Error('Unknown session: ' + sessionId)

  // Idempotent guard
  if (session.completedSteps.includes(sessionId)) {
    return session // no-op
  }

  const completedSteps = [...session.completedSteps, sessionId]
  const newXP = session.xp + rewards.xp
  const existingIds = new Set(session.badges.map(b => b.id))
  const newBadges = rewards.sessionBadges
    .filter(b => !existingIds.has(b.id))
    .map(b => ({ ...b, earnedAt: Date.now() }))

  return {
    completedSteps,
    xp: newXP,
    badges: [...session.badges, ...newBadges],
  }
}

let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    console.log('  ✓', label)
    passed++
  } else {
    console.error('  ✗ FAIL:', label)
    failed++
  }
}

// ── Test 1: Complete Visit 1 sessions → badges + XP ─────────────────────────
console.log('\nTest 1: Complete Visit 1 sessions')
let s = makeSession()
// S1 entry auto-complete (no XP, no badge, just mark done conceptually)
s = awardSessionRewards(s, 'enroll')       // S2
s = awardSessionRewards(s, 'golden-box')   // S3
s = awardSessionRewards(s, 'mentor')       // S4

assert('Profile Started Badge awarded', s.badges.some(b => b.id === SMOKECRAFT_BADGES.PROFILE_STARTED.id))
assert('Gold Box Entry Badge awarded',  s.badges.some(b => b.id === SMOKECRAFT_BADGES.GOLD_BOX_ENTRY.id))
assert('Mentor Pair Badge awarded',     s.badges.some(b => b.id === SMOKECRAFT_BADGES.MENTOR_PAIR.id))
assert('XP increased: 250',             s.xp === 250)
assert('Visit 1 complete',              isVisitComplete(1, s.completedSteps))
assert('Rank: Enthusiast at 250 XP',    getSmokeCraftRank(s.xp).name === 'Enthusiast')

// ── Test 2: Double-tap same CTA ──────────────────────────────────────────────
console.log('\nTest 2: Double-tap Visit 1 CTA (no duplicate awards)')
const xpBefore    = s.xp
const badgesBefore = s.badges.length
s = awardSessionRewards(s, 'enroll')       // already done — should no-op
s = awardSessionRewards(s, 'golden-box')   // already done
s = awardSessionRewards(s, 'mentor')       // already done

assert('XP unchanged after repeat calls',    s.xp === xpBefore)
assert('Badges unchanged after repeat calls', s.badges.length === badgesBefore)

// ── Test 3: Passport Stamp locked before S1–S20 complete ────────────────────
console.log('\nTest 3: Passport Stamp still locked before S20 complete')
// completedSteps = ['enroll','golden-box','mentor'] — nowhere near S20
const passportUnlocked_t3 = s.completedSteps.includes('final-review') &&
                             s.completedSteps.includes('passport-stamp')
assert('Passport Stamp NOT accessible (S20 not done)', !passportUnlocked_t3)

// ── Test 4: Passport Stamp unlocks only after S20 complete ──────────────────
console.log('\nTest 4: Passport Stamp unlocks after S20 complete')
// Simulate completing every session through final-review (S20)
let s4 = makeSession()
const V1_TO_S20 = [
  'enroll','golden-box','mentor',
  'format','wrapper-strength',
  'seed-soil','pairing-lab',
  'humidor-match','request-purchase','cut-toast-light','first-third',
  'second-third','flavor-memory',
  'final-third','scorecard',
  'smokecraft-challenge','second-humidor-match','mini-tasting',
  'final-review',
]
for (const id of V1_TO_S20) s4 = awardSessionRewards(s4, id)

// Now S20 is done → passport-stamp session should be the next unlock
const nextAfterS20 = getNextUnlock(s4.completedSteps)
assert('Next unlock after S20 is passport-stamp', nextAfterS20 === 'passport-stamp')
assert('S20 final-review is completed', s4.completedSteps.includes('final-review'))
assert('S21 passport-stamp NOT yet completed', !s4.completedSteps.includes('passport-stamp'))
assert('Total XP at S20 complete: 1475', s4.xp === 1475)

// ── Test 5: Connections unlocks only after Passport Stamp ───────────────────
console.log('\nTest 5: Connections unlocks only after Passport Stamp')
let s5 = { ...s4 }
s5 = awardSessionRewards(s5, 'passport-stamp')  // S21

assert('passport-stamp now completed', s5.completedSteps.includes('passport-stamp'))
assert('connections NOT yet completed', !s5.completedSteps.includes('connections'))
const nextAfterS21 = getNextUnlock(s5.completedSteps)
assert('Next unlock after S21 is connections', nextAfterS21 === 'connections')
assert('Passport Stamp badge awarded', s5.badges.some(b => b.id === SMOKECRAFT_BADGES.PASSPORT_STAMP.id))

// ── Test 6: Management Sync unlocks only after Connections ──────────────────
console.log('\nTest 6: Management Sync unlocks only after Connections')
let s6 = { ...s5 }
s6 = awardSessionRewards(s6, 'connections')     // S22

assert('connections now completed', s6.completedSteps.includes('connections'))
assert('management-sync NOT yet completed', !s6.completedSteps.includes('management-sync'))
const nextAfterS22 = getNextUnlock(s6.completedSteps)
assert('Next unlock after S22 is management-sync', nextAfterS22 === 'management-sync')
assert('Connections Access badge awarded', s6.badges.some(b => b.id === SMOKECRAFT_BADGES.CONNECTIONS_ACCESS.id))

// ── Bonus: Full journey completion ───────────────────────────────────────────
console.log('\nBonus: Full journey completion')
let sf = { ...s6 }
sf = awardSessionRewards(sf, 'management-sync')  // S23
sf = awardSessionRewards(sf, 'session-complete') // S24

assert('All 23 non-entry sessions completed', sf.completedSteps.length === 23)
assert('Total journey XP: 1700', sf.xp === 1700)
assert('Rank: Aficionado at 1700 XP', getSmokeCraftRank(sf.xp).name === 'Aficionado')
assert('Next SmokeCraft Season badge awarded', sf.badges.some(b => b.id === SMOKECRAFT_BADGES.NEXT_SEASON.id))
assert('Journey complete signal', getNextUnlock(sf.completedSteps) === 'journey-complete')
assert('Total badges: 25', sf.badges.length === 25)

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`)
if (failed > 0) process.exit(1)
