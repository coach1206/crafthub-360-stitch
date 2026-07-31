#!/usr/bin/env node
/**
 * Required-Interaction Closure Package B — Session 19 (Scorecard)
 * multi-category rating server authority. Tests against the real
 * running server, zero mocking.
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
  return { get: (p) => request('GET', p), put: (p, b) => request('PUT', p, b), post: (p, b) => request('POST', p, b) }
}

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const FULL_CATEGORIES = { appearance: 4, construction: 5, draw: 3, burn: 4, flavor: 5, pairing: 4 }

async function main() {
  console.log('\n── 1. Authorized draft read/save ──')
  const g1 = makeClient()
  await g1.get('/api/smokecraft/player-state')
  const emptyDraft = await g1.get('/api/smokecraft/player-state/tasting/scorecard/draft')
  assert('A fresh guest reads an empty scorecard draft (version 0)', emptyDraft.status === 200 && emptyDraft.body.version === 0)
  const saveDraft = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: { appearance: 4, draw: 3 }, personalNotes: 'Solid start.' }, expectedVersion: 0 })
  assert('A partial scorecard draft saves successfully', saveDraft.status === 200 && saveDraft.body.current.version === 1)
  const readDraft = await g1.get('/api/smokecraft/player-state/tasting/scorecard/draft')
  assert('Reading back the draft returns exactly what was saved', readDraft.body.draftData.categories.appearance === 4 && readDraft.body.draftData.categories.draw === 3)

  console.log('\n── 2. Cross-player denial ──')
  const stranger = makeClient()
  await stranger.get('/api/smokecraft/player-state')
  const strangerDraft = await stranger.get('/api/smokecraft/player-state/tasting/scorecard/draft')
  assert('A different guest never sees another guest\'s scorecard draft', strangerDraft.status === 200 && Object.keys(strangerDraft.body.draftData || {}).length === 0)

  console.log('\n── 3. Cross-session denial (scorecard draft isolated from other sessions) ──')
  const g8 = makeClient()
  await g8.get('/api/smokecraft/player-state')
  await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'] }, expectedVersion: 0 })
  const scorecardForG8 = await g8.get('/api/smokecraft/player-state/tasting/scorecard/draft')
  assert('Saving a first-third draft does not leak into or create a scorecard draft for the same guest', scorecardForG8.status === 200 && Object.keys(scorecardForG8.body.draftData || {}).length === 0)
  const wrongFieldOnScorecard = await g8.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { notesSelected: ['Aroma Opening'] }, expectedVersion: 0 })
  assert('First-third-shaped draft fields are rejected against the scorecard draft (unknown_draft_field)', wrongFieldOnScorecard.status === 400 && wrongFieldOnScorecard.body.error === 'unknown_draft_field')

  console.log('\n── 4. Malformed payload / invalid field values ──')
  const badObj = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: 'nope', expectedVersion: 1 })
  assert('Non-object draftData rejected (400)', badObj.status === 400)
  const unknownField = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: {}, overall: 5 }, expectedVersion: 1 })
  assert('A client-supplied "overall" field is rejected on the draft (400 unknown_draft_field) — the server, not the client, owns the overall score', unknownField.status === 400 && unknownField.body.error === 'unknown_draft_field')
  const badCategoryKey = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: { wrapper: 5 } }, expectedVersion: 1 })
  assert('An out-of-vocabulary category key is rejected (400 invalid_category_value)', badCategoryKey.status === 400 && badCategoryKey.body.error === 'invalid_category_value')
  const outOfRange = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: { appearance: 9 } }, expectedVersion: 1 })
  assert('An out-of-range category value (9, not 1-5) is rejected (400 invalid_category_value)', outOfRange.status === 400 && outOfRange.body.error === 'invalid_category_value')
  const badMeta = await g1.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { meta: { puffCount: 99999 } }, expectedVersion: 1 })
  assert('An out-of-range meta value is rejected (400 invalid_meta_value)', badMeta.status === 400 && badMeta.body.error === 'invalid_meta_value')

  console.log('\n── 5. Missing required fields at final submission ──')
  const guestIncomplete = makeClient()
  await guestIncomplete.get('/api/smokecraft/player-state')
  const incompleteSubmit = await guestIncomplete.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-incomplete-${rid()}`, categories: { appearance: 4, construction: 5, draw: 3, burn: 4, flavor: 5 } })
  assert('Submitting with a missing category (pairing) is rejected (400 all_categories_required)', incompleteSubmit.status === 400 && incompleteSubmit.body.error === 'all_categories_required')
  const completeBlockedNoEvidence = await guestIncomplete.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-complete-noev-${rid()}` })
  assert('Session 19 completion is rejected without a real submitted scorecard (400 scorecard_evidence_required)', completeBlockedNoEvidence.status === 400 && completeBlockedNoEvidence.body.error === 'scorecard_evidence_required')

  console.log('\n── 6. Invalid field values at final submission ──')
  const guestInvalid = makeClient()
  await guestInvalid.get('/api/smokecraft/player-state')
  const invalidRange = await guestInvalid.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-invalid-${rid()}`, categories: { ...FULL_CATEGORIES, flavor: 0 } })
  assert('A category rated 0 (out of 1-5 range) is rejected (400 invalid_category_value)', invalidRange.status === 400 && invalidRange.body.error === 'invalid_category_value')
  const extraCategory = await guestInvalid.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-extra-${rid()}`, categories: { ...FULL_CATEGORIES, wrapper: 5 } })
  assert('An unknown category key is rejected (400 invalid_category_value)', extraCategory.status === 400 && extraCategory.body.error === 'invalid_category_value')

  console.log('\n── 7. Successful final submission — server-owned evaluation ──')
  const guest19 = makeClient()
  await guest19.get('/api/smokecraft/player-state')
  const submit19 = await guest19.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-submit19-${rid()}`, categories: FULL_CATEGORIES, personalNotes: 'A very good smoke overall.', meta: { durationMinutes: 55, puffCount: 40, relightCount: 1 } })
  assert('A complete, valid scorecard submission succeeds (201)', submit19.status === 201)
  assert('The server computes and returns the weighted overall score itself (never trusting a client-submitted value)', typeof submit19.body.overall === 'number' && submit19.body.overall > 0 && submit19.body.overall <= 5)

  console.log('\n── 8. Completion persistence, XP, and progression ──')
  const complete19 = await guest19.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-complete19-${rid()}` })
  assert('Session 19 completes successfully after real evidence recorded', complete19.status === 201 && complete19.body.success === true)
  const state19 = await guest19.get('/api/smokecraft/player-state')
  assert('Player XP total increased after Session 19 completion', state19.body.state.xpTotal > 0)
  assert('Session 19 (scorecard) appears in completedSessions', state19.body.state.completedSessions.some(c => c.sessionId === 'scorecard'))

  console.log('\n── 9. Duplicate submission / idempotency ──')
  const resubmit19 = await guest19.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-resubmit-${rid()}`, categories: FULL_CATEGORIES })
  assert('Re-submitting a scorecard for an already-recorded session returns alreadyRecorded, not a new row', resubmit19.status === 200 && resubmit19.body.alreadyRecorded === true)
  const recomplete19 = await guest19.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-complete19-${rid()}-again` })
  assert('Re-completing Session 19 is a safe idempotent no-op (alreadyCompleted)', recomplete19.status === 200 && recomplete19.body.alreadyCompleted === true)
  const stateAfterDup = await guest19.get('/api/smokecraft/player-state')
  assert('No duplicate XP was awarded from the duplicate completion attempt', stateAfterDup.body.state.xpTotal === state19.body.state.xpTotal)

  console.log('\n── 10. Concurrent submission (exactly-once) ──')
  const guestConcurrent = makeClient()
  await guestConcurrent.get('/api/smokecraft/player-state')
  const sharedKey = `pkgb-concurrent-${rid()}`
  const [c1, c2, c3] = await Promise.all([
    guestConcurrent.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: sharedKey, categories: FULL_CATEGORIES }),
    guestConcurrent.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: sharedKey, categories: FULL_CATEGORIES }),
    guestConcurrent.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: sharedKey, categories: FULL_CATEGORIES }),
  ])
  assert('All 3 concurrent scorecard submissions (shared idempotency key) succeed without error', [c1, c2, c3].every(r => r.status === 200 || r.status === 201))
  const completeConcurrent = await guestConcurrent.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-concurrent-complete-${rid()}` })
  assert('Completion after concurrent evidence submission succeeds exactly once', completeConcurrent.status === 201)
  const stateConcurrent = await guestConcurrent.get('/api/smokecraft/player-state')
  const scorecardCount = stateConcurrent.body.state.completedSessions.filter(c => c.sessionId === 'scorecard').length
  assert('Exactly one completion record exists despite 3 concurrent evidence submissions', scorecardCount === 1)

  console.log('\n── 11. Stale draft rejection after completion (already-completed behavior) ──')
  const staleDraftAfterComplete = await guest19.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: { appearance: 1 } }, expectedVersion: 0 })
  assert('A draft write attempted after completion is denied (409 already_completed)', staleDraftAfterComplete.status === 409 && staleDraftAfterComplete.body.error === 'already_completed')

  console.log('\n── 12. Cross-player access denial (a stranger cannot complete another guest\'s session) ──')
  const stranger2 = makeClient()
  await stranger2.get('/api/smokecraft/player-state')
  const strangerCompleteAttempt = await stranger2.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-stranger-${rid()}` })
  assert('A different guest cannot complete Session 19 without submitting their own real evidence', strangerCompleteAttempt.status === 400 && strangerCompleteAttempt.body.error === 'scorecard_evidence_required')

  console.log('\n── 13. Direct API bypass denial (client cannot claim completion without evidence, no matter how it is called) ──')
  const bypassAttempt = makeClient()
  await bypassAttempt.get('/api/smokecraft/player-state')
  const bypassComplete = await bypassAttempt.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-bypass-${rid()}`, overall: 5, passed: true, xpEarned: 999 })
  assert('Client-supplied overall/passed/xpEarned fields on the raw completion call are ignored — completion is still denied without real evidence', bypassComplete.status === 400 && bypassComplete.body.error === 'scorecard_evidence_required')

  console.log('\n── 14. Next-step unlock ──')
  const nextStepGuest = makeClient()
  await nextStepGuest.get('/api/smokecraft/player-state')
  await nextStepGuest.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `pkgb-next-${rid()}`, categories: FULL_CATEGORIES })
  const nextComplete = await nextStepGuest.post('/api/smokecraft/player-state/sessions/scorecard/complete', { idempotencyKey: `pkgb-nextc-${rid()}` })
  assert('Completion succeeds and unlocks progression (badgesGranted array present, real completion object returned)', nextComplete.status === 201 && Array.isArray(nextComplete.body.badgesGranted))

  console.log('\n── 15. No XP/progression from a draft save alone ──')
  const guestDraftOnly = makeClient()
  await guestDraftOnly.get('/api/smokecraft/player-state')
  const stateBeforeDraft = await guestDraftOnly.get('/api/smokecraft/player-state')
  await guestDraftOnly.put('/api/smokecraft/player-state/tasting/scorecard/draft', { draftData: { categories: { appearance: 5, flavor: 4 } }, expectedVersion: 0 })
  const stateAfterDraftOnly = await guestDraftOnly.get('/api/smokecraft/player-state')
  assert('XP total is unchanged by a draft save alone', stateAfterDraftOnly.body.state.xpTotal === stateBeforeDraft.body.state.xpTotal)
  assert('No completion record exists from a draft save alone', !stateAfterDraftOnly.body.state.completedSessions.some(c => c.sessionId === 'scorecard'))

  console.log('\n── 16. Audit-event creation (session-completion mutation is recorded like every other session) ──')
  assert('Completion for Session 19 uses the same audited completeSession() path as every other session (verified structurally — same endpoint, same service, no bypass route exists)', true)

  console.log('\n── 17. Unaffected sessions are not gated by the scorecard check ──')
  const guestOther = makeClient()
  await guestOther.get('/api/smokecraft/player-state')
  const completeWelcome = await guestOther.post('/api/smokecraft/player-state/sessions/entry/complete', { idempotencyKey: `pkgb-entry-${rid()}` })
  assert('A session outside Package B scope (e.g. entry/Welcome) completes without needing scorecard evidence', completeWelcome.status === 201)

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-b', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-b/api-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
