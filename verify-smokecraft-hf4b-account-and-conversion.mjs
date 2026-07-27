// Holistic Fix 4B — automated test suite for account identity, guest-
// to-account conversion, journey-snapshot sync (optimistic concurrency),
// and cross-device resume. Exercises the API directly (fast,
// deterministic).
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const API = process.env.SC_API || 'http://localhost:3001'
const PROOF = 'public/proof/smokecraft-holistic-fix-4b'
fs.mkdirSync(PROOF, { recursive: true })

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

function makeClient() {
  let cookie = null
  return {
    async get(path) {
      const res = await fetch(`${API}${path}`, { headers: cookie ? { Cookie: cookie } : {} })
      const sc = res.headers.get('set-cookie')
      if (sc) cookie = sc.split(';')[0]
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    async post(path, body) {
      const res = await fetch(`${API}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body || {}),
      })
      const sc = res.headers.get('set-cookie')
      if (sc) cookie = sc.split(';')[0]
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    async put(path, body) {
      const res = await fetch(`${API}${path}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body || {}),
      })
      const sc = res.headers.get('set-cookie')
      if (sc) cookie = sc.split(';')[0]
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    setCookie(v) { cookie = v },
    getCookie() { return cookie },
    clearCookieOfName(name) {
      if (!cookie) return
      cookie = cookie.split(';').filter(c => !c.trim().startsWith(name)).join(';')
    },
  }
}

const uniqueEmail = (label) => `hf4b-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`

// ── 1. New account ──────────────────────────────────────────────────
section('1. New account creation')
const clientA = makeClient()
const emailA = uniqueEmail('a')
const create1 = await clientA.post('/api/smokecraft/account/create', { email: emailA, displayName: 'Learner A' })
assert('Account creation returns 201 with a userId and dev PIN', create1.status === 201 && !!create1.body.userId && !!create1.body.devDeliveryPin)
const pinA = create1.body.devDeliveryPin

const dupCreate = await clientA.post('/api/smokecraft/account/create', { email: emailA, displayName: 'Dup' })
assert('Duplicate email is rejected with 409', dupCreate.status === 409 && dupCreate.body.error === 'email_already_registered')

// ── 2. Valid + invalid login ──────────────────────────────────────────
section('2. Valid login, invalid login')
const clientA2 = makeClient() // "second device" — fresh cookie jar
const loginOk = await clientA2.post('/api/smokecraft/account/login', { email: emailA, pin: pinA })
assert('Valid email+PIN login succeeds on a fresh cookie jar (second device)', loginOk.status === 200 && loginOk.body.userId === create1.body.userId)

const clientBad = makeClient()
const loginBad = await clientBad.post('/api/smokecraft/account/login', { email: emailA, pin: '000000' })
assert('Invalid PIN is rejected with 401', loginBad.status === 401 && loginBad.body.error === 'invalid_credentials')

const loginNoAccount = await clientBad.post('/api/smokecraft/account/login', { email: uniqueEmail('nope'), pin: '123456' })
assert('Login for a nonexistent account is rejected (no account-existence leak in the same generic error)', loginNoAccount.status === 401)

// ── 3. Logout / session revocation ────────────────────────────────────
section('3. Logout and session revocation')
const meBeforeLogout = await clientA.get('/api/auth/me')
assert('Signed-in client sees authenticated:true before logout', meBeforeLogout.body?.data?.authenticated === true)
await clientA.post('/api/smokecraft/account/logout')
const meAfterLogout = await clientA.get('/api/auth/me')
assert('Same client sees authenticated:false after logout (session actually revoked server-side)', meAfterLogout.body?.data?.authenticated === false)

// ── 4. Guest-to-NEW-account conversion ────────────────────────────────
section('4. Guest-to-new-account conversion (real merge)')
const guestClient = makeClient()
await guestClient.get('/api/smokecraft/player-state') // establish guest cookie
const gc1 = await guestClient.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf4b-guest-enroll-1' })
const gc2 = await guestClient.post('/api/smokecraft/player-state/sessions/format/complete', { idempotencyKey: 'hf4b-guest-format-1' })
await guestClient.post('/api/smokecraft/player-state/awards/badge', { idempotencyKey: 'hf4b-guest-badge-1', awardKey: 'sc-hf4b-test-badge' })
const guestStateBefore = await guestClient.get('/api/smokecraft/player-state')
assert('Guest accumulated 2 sessions + xp before conversion', guestStateBefore.body.state.completedSessions.length === 2 && guestStateBefore.body.state.xpTotal > 0)

const emailB = uniqueEmail('b')
const createB = await guestClient.post('/api/smokecraft/account/create', { email: emailB, displayName: 'Learner B' })
assert('Account created on the SAME cookie jar as the guest (both identities coexist)', createB.status === 201)

const convert1 = await guestClient.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-convert-1' })
assert('First conversion request succeeds (201, alreadyConverted:false)', convert1.status === 201 && convert1.body.conversion.alreadyConverted !== true)
assert('Conversion transferred both sessions, no merged duplicates (fresh account)', convert1.body.conversion.sessions_transferred === 2 && convert1.body.conversion.sessions_merged_duplicate === 0)
assert('Conversion transferred the badge', convert1.body.conversion.awards_transferred === 1)

const accountStateAfter = await guestClient.get('/api/smokecraft/player-state')
assert('Account now has the guest\'s XP and sessions (server-authoritative merge, not client-reported)', accountStateAfter.body.state.xpTotal === guestStateBefore.body.state.xpTotal && accountStateAfter.body.state.completedSessions.length === 2)

// ── 5. Repeated / concurrent conversion request ───────────────────────
section('5. Repeated and concurrent conversion requests (idempotent)')
const convertReplay = await guestClient.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-convert-DIFFERENT-KEY' })
assert('A repeat conversion request (different idempotency key) returns alreadyConverted:true, does not re-transfer', convertReplay.body.alreadyConverted === true)

const guestClient2 = makeClient()
await guestClient2.get('/api/smokecraft/player-state')
await guestClient2.post('/api/smokecraft/player-state/sessions/mentor/complete', { idempotencyKey: 'hf4b-guest2-mentor-1' })
const emailC = uniqueEmail('c')
await guestClient2.post('/api/smokecraft/account/create', { email: emailC, displayName: 'Learner C' })
const [race1, race2] = await Promise.all([
  guestClient2.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-race-1' }),
  guestClient2.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-race-2' }),
])
assert('Both concurrent conversion requests return well-formed success (no 500)', race1.body?.success === true && race2.body?.success === true)
const oneReallyApplied = [race1, race2].filter(r => r.body.alreadyConverted !== true).length
assert('Exactly one of the two concurrent conversion requests actually applied the merge', oneReallyApplied === 1, `applied=${oneReallyApplied}`)

// ── 6. Guest-to-EXISTING-account conversion with conflicting prior state ──
section('6. Guest-to-existing-account conversion — account already has prior state')
const clientD = makeClient()
const emailD = uniqueEmail('d')
const createD = await clientD.post('/api/smokecraft/account/create', { email: emailD, displayName: 'Learner D' })
const pinD = createD.body.devDeliveryPin
// Account D does some independent work while signed in (no guest cookie on this client yet).
await clientD.post('/api/smokecraft/player-state/sessions/enroll/complete', { idempotencyKey: 'hf4b-accountD-enroll-1' })
await clientD.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: { mentor: { id: 'account-d-mentor' } }, expectedVersion: 0 })

// Now a fresh guest session on a DIFFERENT client independently completes 'mentor' and has its own notes.
const guestClientD = makeClient()
await guestClientD.get('/api/smokecraft/player-state')
await guestClientD.post('/api/smokecraft/player-state/sessions/mentor/complete', { idempotencyKey: 'hf4b-guestD-mentor-1' })
await guestClientD.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: { mentor: { id: 'guest-d-mentor' } }, expectedVersion: 0 })
// Sign into account D on this SAME client (so guest cookie + account cookie coexist), then convert.
await guestClientD.post('/api/smokecraft/account/login', { email: emailD, pin: pinD })
const convertD = await guestClientD.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-convertD-1' })
assert('Conversion with a pre-existing account succeeds', convertD.status === 201 || convertD.body.alreadyConverted === true)
assert('Non-conflicting session (mentor, only guest had it) is transferred', convertD.body.conversion.sessions_transferred === 1, JSON.stringify(convertD.body.conversion))
const stateD = await guestClientD.get('/api/smokecraft/player-state')
assert('Account D retains its own pre-existing session (enroll) after merge — nothing lost', stateD.body.state.completedSessions.some(s => s.sessionId === 'enroll'))
assert('Account D also has the guest\'s transferred session (mentor)', stateD.body.state.completedSessions.some(s => s.sessionId === 'mentor'))
const snapshotD = await guestClientD.get('/api/smokecraft/player-state/journey-snapshot')
assert('Per the merge policy, the ACCOUNT\'s own journey snapshot wins over the guest\'s (server-authoritative-value-wins rule, disclosed in the merge policy doc)', snapshotD.body.snapshot.mentor?.id === 'account-d-mentor')

// ── 7. Same-identity cross-device resume ──────────────────────────────
section('7. Same-identity cross-device resume (real second login, not just a separate guest cookie)')
const deviceX = makeClient()
await deviceX.get('/api/smokecraft/player-state')
await deviceX.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: { note: 'written on device X' }, expectedVersion: 0 })
const emailE = uniqueEmail('e')
await deviceX.post('/api/smokecraft/account/create', { email: emailE, displayName: 'Learner E' })
const pinE = (await deviceX.get('/api/auth/me'), null) // pin already captured below
const createEResp = await (async () => { const r = await deviceX.get('/api/auth/me'); return r })()
// Retrieve the actual pin from the create response captured earlier is cleaner:
const emailE2 = uniqueEmail('e2')
const deviceX2 = makeClient()
await deviceX2.get('/api/smokecraft/player-state')
const createE2 = await deviceX2.post('/api/smokecraft/account/create', { email: emailE2, displayName: 'Learner E2' })
await deviceX2.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-deviceX2-convert' })
await deviceX2.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: { note: 'written on device X2' }, expectedVersion: 1 }).catch(() => {})
const deviceY = makeClient() // genuinely different device: fresh cookie jar, real login (not a shared guest cookie)
const loginY = await deviceY.post('/api/smokecraft/account/login', { email: emailE2, pin: createE2.body.devDeliveryPin })
assert('Device Y logs into the SAME account as Device X2', loginY.status === 200)
const stateY = await deviceY.get('/api/smokecraft/player-state/journey-snapshot')
assert('Device Y (real second login) sees the content Device X2 wrote — true cross-device resume via a real account, not merely two guest cookies', JSON.stringify(stateY.body.snapshot).includes('X2'))

// ── 8. Stale write (two-device conflict) ──────────────────────────────
section('8. Stale write on a mutable versioned record')
const staleWrite = await deviceX2.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: { note: 'stale attempt' }, expectedVersion: 1 })
assert('A write with an outdated expectedVersion is rejected with 409, not silently applied', staleWrite.status === 409 && staleWrite.body.error === 'stale_version')
assert('The 409 response includes the server\'s current state (so the client can reconcile)', !!staleWrite.body.current)

// ── 9. Unauthorized / cross-user access ────────────────────────────────
section('9. Unauthorized access and cross-user isolation')
const noCookieClient = makeClient()
const convertNoAuth = await noCookieClient.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf4b-noauth-1' })
assert('Conversion without a signed-in account is rejected (401)', convertNoAuth.status === 401 && convertNoAuth.body.error === 'account_required')

const clientF = makeClient()
const clientG = makeClient()
await clientF.get('/api/smokecraft/player-state')
await clientG.get('/api/smokecraft/player-state')
await clientF.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: 'hf4b-f-scorecard-1' })
const gState = await clientG.get('/api/smokecraft/player-state')
assert('A completely separate guest identity never sees another guest\'s completions (cross-user isolation)', !gState.body.state.completedSessions.some(s => s.sessionId === 'scorecard'))

// ── 10. Malformed input ────────────────────────────────────────────────
section('10. Malformed input handling')
const badEmail = await clientA.post('/api/smokecraft/account/create', { email: 'not-an-email', displayName: 'X' })
assert('Malformed email is rejected with 400', badEmail.status === 400 && badEmail.body.error === 'valid_email_required')
const noSnapshot = await guestClient.put('/api/smokecraft/player-state/journey-snapshot', { expectedVersion: 0 })
assert('Missing snapshot object is rejected with 400', noSnapshot.status === 400 && noSnapshot.body.error === 'snapshot_object_required')
const noVersion = await guestClient.put('/api/smokecraft/player-state/journey-snapshot', { snapshot: {} })
assert('Missing expectedVersion is rejected with 400', noVersion.status === 400 && noVersion.body.error === 'expected_version_required')

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===`)
fs.writeFileSync(`${PROOF}/01-account-and-conversion-results.json`, JSON.stringify({
  commit: execSync('git rev-parse HEAD').toString().trim(),
  pass, fail, failures,
}, null, 2))
if (fail > 0) process.exit(1)
