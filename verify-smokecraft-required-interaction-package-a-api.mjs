#!/usr/bin/env node
/**
 * Required-Interaction Closure Package A — Sessions 8, 12, 16 tasting-
 * capture server authority. Tests against the real running server,
 * zero mocking.
 */
import http from 'http'
import fs from 'fs'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
const results = []
function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function makeClient() {
  let cookies = {}
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body ? JSON.stringify(body) : null
      const req = http.request({
        host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) for (const c of setCookie) { const [pair] = c.split(';'); const [k, v] = pair.split('='); cookies[k] = v }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => { let parsed = null; try { parsed = JSON.parse(chunks) } catch {}; resolve({ status: res.statusCode, body: parsed }) })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b) }
}

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function main() {
  console.log('\n── 1. Authorized access / identity auto-provisioning ──')
  const guest1 = makeClient()
  const ident = await guest1.get('/api/smokecraft/player-state')
  assert('A fresh guest can read player state (identity auto-provisioned)', ident.status === 200)

  console.log('\n── 2. Session 8 (first-third) — incorrect/empty submission rejected ──')
  const empty8 = await guest1.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `pkga-${rid()}`, notesSelected: [] })
  assert('Empty notesSelected is rejected (400)', empty8.status === 400 && empty8.body.error === 'at_least_one_observation_required')

  const malformed8 = await guest1.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `pkga-${rid()}`, notesSelected: ['Not A Real Zone'] })
  assert('Malformed/invalid observation id is rejected (400)', malformed8.status === 400 && malformed8.body.error === 'invalid_observation_id')

  console.log('\n── 3. Session 8 — completion blocked without evidence ──')
  const guest8 = makeClient()
  await guest8.get('/api/smokecraft/player-state')
  const completeNoEvidence = await guest8.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `pkga-complete-${rid()}` })
  assert('Session 8 completion is rejected without prior tasting evidence (400 tasting_observation_required)', completeNoEvidence.status === 400 && completeNoEvidence.body.error === 'tasting_observation_required')

  console.log('\n── 4. Session 8 — correct submission, then completion succeeds ──')
  const submit8 = await guest8.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `pkga-submit8-${rid()}`, notesSelected: ['Aroma Opening', 'Draw Ease'], personalNotes: 'Bright citrus opening.' })
  assert('Real tasting observation submission succeeds (201)', submit8.status === 201)
  const complete8 = await guest8.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `pkga-complete8-${rid()}` })
  assert('Session 8 completes successfully after real evidence recorded', complete8.status === 201 && complete8.body.success === true)

  console.log('\n── 5. XP and progression (server-owned) ──')
  const state8 = await guest8.get('/api/smokecraft/player-state')
  assert('Player XP total increased after Session 8 completion', state8.body.state.xpTotal > 0)
  assert('Session 8 appears in completedSessions', state8.body.state.completedSessions.some(c => c.sessionId === 'first-third'))

  console.log('\n── 6. Duplicate submission / idempotency ──')
  const resubmit8 = await guest8.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `pkga-submit8-retry-${rid()}`, notesSelected: ['Aroma Opening'] })
  assert('Re-submitting observation for an already-recorded session returns alreadyRecorded, not a new row', resubmit8.status === 200 && resubmit8.body.alreadyRecorded === true)
  const recomplete8 = await guest8.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `pkga-complete8-${rid()}-again` })
  assert('Re-completing Session 8 is a safe idempotent no-op (alreadyCompleted)', recomplete8.status === 200 && recomplete8.body.alreadyCompleted === true)
  const stateAfterDup = await guest8.get('/api/smokecraft/player-state')
  assert('No duplicate XP was awarded from the duplicate completion attempt', stateAfterDup.body.state.xpTotal === state8.body.state.xpTotal)

  console.log('\n── 7. Cross-player isolation ──')
  const stranger = makeClient()
  await stranger.get('/api/smokecraft/player-state')
  const strangerState = await stranger.get('/api/smokecraft/player-state')
  assert('A different guest never sees Session 8 as completed', !strangerState.body.state.completedSessions.some(c => c.sessionId === 'first-third'))
  const strangerCompleteAttempt = await stranger.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `pkga-stranger-${rid()}` })
  assert('A different guest cannot complete Session 8 without submitting their own real evidence', strangerCompleteAttempt.status === 400 && strangerCompleteAttempt.body.error === 'tasting_observation_required')

  console.log('\n── 8. Session 12 (second-third) — full flow ──')
  const guest12 = makeClient()
  await guest12.get('/api/smokecraft/player-state')
  const completeNoEvidence12 = await guest12.post('/api/smokecraft/player-state/sessions/second-third/complete', { idempotencyKey: `pkga-c12-${rid()}` })
  assert('Session 12 completion blocked without evidence', completeNoEvidence12.status === 400 && completeNoEvidence12.body.error === 'tasting_observation_required')
  const guest12vocab = makeClient()
  await guest12vocab.get('/api/smokecraft/player-state')
  const invalid12 = await guest12vocab.post('/api/smokecraft/player-state/tasting-observation/second-third', { idempotencyKey: `pkga-s12-invalid-${rid()}`, notesSelected: ['Aroma Opening'] })
  assert('Session-8-only vocabulary is rejected for Session 12 (sessions have distinct real vocabularies)', invalid12.status === 400 && invalid12.body.error === 'invalid_observation_id')
  const submit12 = await guest12.post('/api/smokecraft/player-state/tasting-observation/second-third', { idempotencyKey: `pkga-s12-${rid()}`, notesSelected: ['Flavor Development', 'Body Evolution'], personalNotes: 'Deepening spice.' })
  assert('Session 12 real observation submission succeeds', submit12.status === 201)
  const complete12 = await guest12.post('/api/smokecraft/player-state/sessions/second-third/complete', { idempotencyKey: `pkga-c12b-${rid()}` })
  assert('Session 12 completes after real evidence', complete12.status === 201)

  console.log('\n── 9. Session 16 (final-third) — full flow with combined flavor+focus vocabulary ──')
  const guest16 = makeClient()
  await guest16.get('/api/smokecraft/player-state')
  const submit16 = await guest16.post('/api/smokecraft/player-state/tasting-observation/final-third', { idempotencyKey: `pkga-s16-${rid()}`, notesSelected: ['earth', 'cocoa', 'burn-quality'] })
  assert('Session 16 real observation (combined flavor+focus vocabulary) submission succeeds', submit16.status === 201)
  const complete16 = await guest16.post('/api/smokecraft/player-state/sessions/final-third/complete', { idempotencyKey: `pkga-c16-${rid()}` })
  assert('Session 16 completes after real evidence', complete16.status === 201)
  const invalid16 = makeClient()
  await invalid16.get('/api/smokecraft/player-state')
  const badVocab16 = await invalid16.post('/api/smokecraft/player-state/tasting-observation/final-third', { idempotencyKey: `pkga-s16bad-${rid()}`, notesSelected: ['Aroma Opening'] })
  assert('Session 8 vocabulary is rejected for Session 16 (distinct real vocabularies enforced)', badVocab16.status === 400 && badVocab16.body.error === 'invalid_observation_id')

  console.log('\n── 10. Concurrent submission (exactly-once) ──')
  const guestConcurrent = makeClient()
  await guestConcurrent.get('/api/smokecraft/player-state')
  const sharedKey = `pkga-concurrent-${rid()}`
  const [c1, c2, c3] = await Promise.all([
    guestConcurrent.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: sharedKey, notesSelected: ['Aroma Opening'] }),
    guestConcurrent.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: sharedKey, notesSelected: ['Aroma Opening'] }),
    guestConcurrent.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: sharedKey, notesSelected: ['Aroma Opening'] }),
  ])
  assert('All 3 concurrent observation submissions (shared idempotency key) succeed without error', [c1, c2, c3].every(r => r.status === 200 || r.status === 201))
  const completeConcurrent = await guestConcurrent.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `pkga-concurrent-complete-${rid()}` })
  assert('Completion after concurrent evidence submission succeeds exactly once', completeConcurrent.status === 201)
  const stateConcurrent = await guestConcurrent.get('/api/smokecraft/player-state')
  const firstThirdCount = stateConcurrent.body.state.completedSessions.filter(c => c.sessionId === 'first-third').length
  assert('Exactly one completion record exists despite 3 concurrent evidence submissions', firstThirdCount === 1)

  console.log('\n── 11. Malformed payload / missing idempotency key ──')
  const noKey = await guest1.post('/api/smokecraft/player-state/tasting-observation/first-third', { notesSelected: ['Aroma Opening'] })
  assert('Missing idempotencyKey is rejected (400)', noKey.status === 400)
  const badPersonalNotes = await makeClient().post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `pkga-badnotes-${rid()}`, notesSelected: ['Aroma Opening'], personalNotes: 12345 })
  assert('Non-string personalNotes is rejected (400)', badPersonalNotes.status === 400 && badPersonalNotes.body.error === 'invalid_personal_notes')

  console.log('\n── 12. Unaffected sessions are not gated ──')
  const guestOther = makeClient()
  await guestOther.get('/api/smokecraft/player-state')
  const completeWelcome = await guestOther.post('/api/smokecraft/player-state/sessions/entry/complete', { idempotencyKey: `pkga-entry-${rid()}` })
  assert('A session outside Package A scope (e.g. entry/Welcome) completes without needing tasting evidence', completeWelcome.status === 201)

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-a/api-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
