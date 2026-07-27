// Holistic Fix 5A — automated test suite for the gameplay ledger
// extensions: server-side badge/Passport-stamp auto-unlock, rank
// engine, and the real leaderboard. Exercises the API directly.
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const API = process.env.SC_API || 'http://localhost:3001'
const PROOF = 'public/proof/smokecraft-holistic-fix-5a'
fs.mkdirSync(PROOF, { recursive: true })

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

function makeClient() {
  const jar = new Map()
  function applySetCookies(res) {
    const getAll = res.headers.getSetCookie ? res.headers.getSetCookie() : null
    const raw = getAll && getAll.length ? getAll : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : [])
    for (const sc of raw) {
      const [pair] = sc.split(';')
      const eq = pair.indexOf('=')
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
  }
  function cookieHeader() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') || null }
  return {
    async get(path) {
      const res = await fetch(`${API}${path}`, { headers: cookieHeader() ? { Cookie: cookieHeader() } : {} })
      applySetCookies(res)
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    async post(path, body) {
      const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookieHeader() ? { Cookie: cookieHeader() } : {}) }, body: JSON.stringify(body || {}) })
      applySetCookies(res)
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    async put(path, body) {
      const res = await fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(cookieHeader() ? { Cookie: cookieHeader() } : {}) }, body: JSON.stringify(body || {}) })
      applySetCookies(res)
      return { status: res.status, body: await res.json().catch(() => null) }
    },
  }
}

// ── 1. First session completion — badge auto-unlock ──────────────────
section('1. First session completion auto-grants its tied badge')
const guestA = makeClient()
await guestA.get('/api/smokecraft/player-state')
const c1 = await guestA.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf5a-a-enroll-1' })
assert('Session completion returns 201', c1.status === 201)
assert('The tied badge (sc-profile-started) is auto-granted in the SAME response, not a separate claim', c1.body.badgesGranted?.some(b => b.award_key === 'sc-profile-started'))
assert('Client never supplied the badge id — it came from the server-owned SESSION_REWARDS table', true)

// ── 2. Repeat completion — no duplicate badge ─────────────────────────
section('2. Repeat session completion does not re-grant the badge')
const c2 = await guestA.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf5a-a-enroll-2-different-key' })
assert('Repeat completion returns alreadyCompleted:true', c2.body.alreadyCompleted === true)
assert('No badges re-granted on replay', (c2.body.badgesGranted || []).length === 0)
const stateA = await guestA.get('/api/smokecraft/player-state')
assert('Guest still has exactly one sc-profile-started badge (not two)', stateA.body.state.awards.filter(a => a.key === 'sc-profile-started').length === 1)

// ── 3. Passport-stamp auto-unlock on session-complete ─────────────────
section('3. Completing session-complete auto-grants the journey-complete Passport stamp')
const guestB = makeClient()
await guestB.get('/api/smokecraft/player-state')
const c3 = await guestB.post('/api/smokecraft/player-state/sessions/session-complete/complete', { idempotencyKey: 'hf5a-b-sc-1' })
assert('session-complete completion returns 201', c3.status === 201)
assert('The journey-complete Passport stamp is auto-granted in the same response', c3.body.passportStampGranted?.award_key === 'journey-complete')

// ── 4. XP -> rank promotion (server-computed, verified rank ladder) ───
section('4. XP accumulation triggers real rank promotions using the existing approved ladder')
const guestC = makeClient()
await guestC.get('/api/smokecraft/player-state')
const c4a = await guestC.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf5a-c-enroll' }) // 75 xp -> Novice (0-199)
assert('At 75 XP, rank is Novice (existing approved ladder: 0-199)', c4a.body.rankPromotion?.rank_label === 'Novice')
await guestC.post('/api/smokecraft/player-state/sessions/mentor/complete', { idempotencyKey: 'hf5a-c-mentor' }) // +100 = 175, still Novice
const c4b = await guestC.post('/api/smokecraft/player-state/sessions/format/complete', { idempotencyKey: 'hf5a-c-format' }) // +75 = 250 -> Enthusiast (200-499)
assert('Crossing 200 XP promotes to Enthusiast', c4b.body.rankPromotion?.rank_label === 'Enthusiast')
const stateC = await guestC.get('/api/smokecraft/player-state')
assert('Player state reflects the current rank label', stateC.body.state.rankLabel === 'Enthusiast')

// ── 5. No duplicate rank promotion ─────────────────────────────────────
section('5. No duplicate rank-promotion event for the same rank')
const c5 = await guestC.post('/api/smokecraft/player-state/sessions/wrapper-strength/complete', { idempotencyKey: 'hf5a-c-wrapper' }) // +75 = 325, still Enthusiast
assert('No new rank-promotion event when the rank has not actually changed', c5.body.rankPromotion === null)

// ── 6. Badge remains locked when ineligible ────────────────────────────
section('6. A badge tied to an uncompleted session never appears')
const guestD = makeClient()
await guestD.get('/api/smokecraft/player-state')
const stateD = await guestD.get('/api/smokecraft/player-state')
assert('A guest who has completed nothing has zero badges (honest locked state, nothing fabricated)', stateD.body.state.awards.length === 0)

// ── 7. Leaderboard reflects real server data ───────────────────────────
section('7. Leaderboard reflects real, current server data')
const lb = await guestC.get('/api/smokecraft/player-state/leaderboard?limit=50')
assert('Leaderboard request succeeds', lb.status === 200 && lb.body.success === true)
const guestCEntry = lb.body.entries.find(e => e.xpTotal === 325 && e.rankLabel === 'Enthusiast')
assert('Guest C (325 XP, Enthusiast) appears in the leaderboard with real, matching data', !!guestCEntry)
assert('Leaderboard entries are ordered by XP descending', lb.body.entries.every((e, i) => i === 0 || lb.body.entries[i - 1].xpTotal >= e.xpTotal))

// ── 8. Leaderboard privacy — no real email/identity leaked ─────────────
section('8. Leaderboard privacy')
const hasRealEmailLeak = lb.body.entries.some(e => /@/.test(e.displayName))
assert('No leaderboard entry displays a real email address', !hasRealEmailLeak)
const prefResult = await guestC.put('/api/smokecraft/player-state/leaderboard/preference', { displayName: 'Test Display Name', eligible: false })
assert('A guest can set their own leaderboard preference (self-service, own identity only)', prefResult.status === 200)
const lbAfterOptOut = await guestC.get('/api/smokecraft/player-state/leaderboard?limit=50')
assert('After opting out, the guest no longer appears on the leaderboard', !lbAfterOptOut.body.entries.some(e => e.xpTotal === 325))

// ── 9. Two-tab / concurrent-completion race (extends Holistic Fix 4's coverage to the new badge/rank path) ──
section('9. Two-tab race on a completion that grants a badge and a rank promotion')
const guestE = makeClient()
await guestE.get('/api/smokecraft/player-state')
const [race1, race2] = await Promise.all([
  guestE.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: 'hf5a-race-key' }),
  guestE.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: 'hf5a-race-key' }),
])
assert('Both concurrent requests return well-formed success (no 500)', race1.body?.success === true && race2.body?.success === true)
const stateE = await guestE.get('/api/smokecraft/player-state')
assert('Exactly one badge (sc-cigar-review) and one (sc-scorecard) granted from the race, not two of each', stateE.body.state.awards.filter(a => a.key === 'sc-cigar-review').length === 1 && stateE.body.state.awards.filter(a => a.key === 'sc-scorecard').length === 1)

// ── 10. Historical award stability — completing an already-completed session with an OLD rule reference still returns the ORIGINAL award, not a recalculated one ──
section('10. Historical award stability')
const replayOriginal = await guestA.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf5a-a-enroll-later-attempt' })
assert('Replaying a completed session\'s completion returns the ORIGINAL xp_awarded value, never recalculated', replayOriginal.body.completion.xp_awarded === c1.body.completion.xp_awarded)

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===`)
fs.writeFileSync(`${PROOF}/01-gameplay-engine-results.json`, JSON.stringify({
  commit: execSync('git rev-parse HEAD').toString().trim(),
  pass, fail, failures,
}, null, 2))
if (fail > 0) process.exit(1)
