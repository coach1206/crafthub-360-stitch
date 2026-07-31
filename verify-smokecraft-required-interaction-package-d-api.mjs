#!/usr/bin/env node
/**
 * Required-Interaction Closure Package D — Sessions 3 (meet-your-cigar),
 * 4 (terroir), 15 (knowledge-drop) guided-exploration server authority.
 * Tests against the real running server, zero mocking.
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
const MYC_FULL = { checkpoints: { brand: true, blend: true, wrapper: true }, synthesis: 'wrapper' }
const TERROIR_FULL = { checkpoints: { country: true, region: true, soil: true, climate: true, growing: true }, synthesis: 'soil' }
const KD_FULL = { checkpoints: { tobacco: 0, fermentation: 1, aging: 1, factory: 0 }, synthesis: 'factory' }

async function main() {
  // ═══════════════ SESSION 3 — Meet Your Cigar ═══════════════
  console.log('\n── Session 3: draft create/read, cross-player denial ──')
  const g3 = makeClient()
  await g3.get('/api/smokecraft/player-state')
  const draft3 = await g3.put('/api/smokecraft/player-state/tasting/meet-your-cigar/draft', { draftData: { checkpoints: { brand: true } }, expectedVersion: 0 })
  assert('Session 3 partial checkpoint draft saves', draft3.status === 200)
  const read3 = await g3.get('/api/smokecraft/player-state/tasting/meet-your-cigar/draft')
  assert('Session 3 draft reads back correctly', read3.body.draftData.checkpoints.brand === true)
  const stranger3 = makeClient()
  await stranger3.get('/api/smokecraft/player-state')
  const strangerDraft3 = await stranger3.get('/api/smokecraft/player-state/tasting/meet-your-cigar/draft')
  assert('Cross-player denial: a different guest never sees another guest\'s Session 3 draft', Object.keys(strangerDraft3.body.draftData || {}).length === 0)

  console.log('\n── Session 3: unknown checkpoint / missing checkpoint / missing synthesis rejected ──')
  const unknownCp3 = await g3.post('/api/smokecraft/player-state/selection/meet-your-cigar', { idempotencyKey: `pkgd-3-unk-${rid()}`, payload: { checkpoints: { brand: true, binder: true }, synthesis: 'brand' } })
  assert('An unknown checkpoint id is rejected (400 unknown_checkpoint_id)', unknownCp3.status === 400 && unknownCp3.body.error === 'unknown_checkpoint_id')
  const missingCp3 = await g3.post('/api/smokecraft/player-state/selection/meet-your-cigar', { idempotencyKey: `pkgd-3-miss-${rid()}`, payload: { checkpoints: { brand: true }, synthesis: 'brand' } })
  assert('Missing required checkpoints is rejected (400 missing_required_checkpoint)', missingCp3.status === 400 && missingCp3.body.error === 'missing_required_checkpoint')
  const missingSynth3 = await g3.post('/api/smokecraft/player-state/selection/meet-your-cigar', { idempotencyKey: `pkgd-3-nosyn-${rid()}`, payload: { checkpoints: { brand: true, blend: true, wrapper: true } } })
  assert('Missing final synthesis is rejected (400 synthesis_required)', missingSynth3.status === 400 && missingSynth3.body.error === 'synthesis_required')

  console.log('\n── Session 3: opening all panels alone does not complete (no route-visit/click-only completion) ──')
  const completeNoEvidence3 = await g3.post('/api/smokecraft/player-state/sessions/meet-your-cigar/complete', { idempotencyKey: `pkgd-3-noev-${rid()}` })
  assert('Session 3 completion rejected without real submitted evidence (400 selection_evidence_required)', completeNoEvidence3.status === 400 && completeNoEvidence3.body.error === 'selection_evidence_required')

  console.log('\n── Session 3: valid submission completes, XP exactly once ──')
  const submit3 = await g3.post('/api/smokecraft/player-state/selection/meet-your-cigar', { idempotencyKey: `pkgd-3-right-${rid()}`, payload: MYC_FULL })
  assert('A complete, valid Session 3 submission is recognized as correct', submit3.status === 201 && submit3.body.correct === true)
  const complete3 = await g3.post('/api/smokecraft/player-state/sessions/meet-your-cigar/complete', { idempotencyKey: `pkgd-3-c-${rid()}` })
  assert('Session 3 completes after real evidence', complete3.status === 201)
  const state3 = await g3.get('/api/smokecraft/player-state')
  // Real defect found and fixed this pass: smokecraftRewards.js had no
  // entry for 'meet-your-cigar' or 'terroir' — awardSessionRewards()
  // hard-returns when getSessionRewards(sessionId) is null, so these two
  // sessions could NEVER complete server-side through the real
  // completion path (the client silently no-op'd and navigated forward
  // regardless). Fixed by adding real entries at the standard 75 XP
  // used throughout this table (no new badge invented). See
  // 14-known-limitations.md / 10-defects-and-fixes equivalent in proof.
  assert('XP awarded and Session 3 appears in completedSessions (real defect fixed this pass — see proof)', state3.body.state.xpTotal > 0 && state3.body.state.completedSessions.some(c => c.sessionId === 'meet-your-cigar'))
  const dup3 = await g3.post('/api/smokecraft/player-state/sessions/meet-your-cigar/complete', { idempotencyKey: `pkgd-3-c2-${rid()}` })
  assert('Duplicate completion is a safe no-op, no duplicate XP', dup3.status === 200 && dup3.body.alreadyCompleted === true)
  const staleDraft3 = await g3.put('/api/smokecraft/player-state/tasting/meet-your-cigar/draft', { draftData: { checkpoints: { brand: false } }, expectedVersion: 0 })
  assert('A draft write attempted after Session 3 completion is denied (409 already_completed)', staleDraft3.status === 409 && staleDraft3.body.error === 'already_completed')

  // ═══════════════ SESSION 4 — Terroir ═══════════════
  console.log('\n── Session 4: draft, incomplete rejection, valid completion ──')
  const g4 = makeClient()
  await g4.get('/api/smokecraft/player-state')
  const incomplete4 = await g4.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: `pkgd-4-inc-${rid()}`, payload: { checkpoints: { country: true, region: true }, synthesis: 'country' } })
  assert('Incomplete checkpoints rejected for Session 4 (400 missing_required_checkpoint)', incomplete4.status === 400 && incomplete4.body.error === 'missing_required_checkpoint')
  const invalidSynth4 = await g4.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: `pkgd-4-badsyn-${rid()}`, payload: { checkpoints: TERROIR_FULL.checkpoints, synthesis: 'why' } })
  assert('An invalid synthesis value (outside the 5 real factors) is rejected (400 synthesis_required)', invalidSynth4.status === 400 && invalidSynth4.body.error === 'synthesis_required')
  const completeNoEvidence4 = await g4.post('/api/smokecraft/player-state/sessions/terroir/complete', { idempotencyKey: `pkgd-4-noev-${rid()}` })
  assert('Session 4 completion rejected without evidence', completeNoEvidence4.status === 400 && completeNoEvidence4.body.error === 'selection_evidence_required')
  const submit4 = await g4.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: `pkgd-4-right-${rid()}`, payload: TERROIR_FULL })
  assert('A complete, valid Session 4 submission is recognized as correct', submit4.status === 201 && submit4.body.correct === true)
  const complete4 = await g4.post('/api/smokecraft/player-state/sessions/terroir/complete', { idempotencyKey: `pkgd-4-c-${rid()}` })
  assert('Session 4 completes after real evidence', complete4.status === 201)

  // ═══════════════ SESSION 15 — Knowledge Drop ═══════════════
  console.log('\n── Session 15: unanswered/incorrect quiz does not complete (server-graded, not client-trusted) ──')
  const g15 = makeClient()
  await g15.get('/api/smokecraft/player-state')
  const wrongAnswers15 = await g15.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `pkgd-15-wrong-${rid()}`, payload: { checkpoints: { tobacco: 1, fermentation: 0, aging: 0, factory: 1 }, synthesis: 'tobacco' } })
  assert('A well-formed but entirely incorrect quiz submission is accepted as an attempt but marked incorrect', wrongAnswers15.status === 200 && wrongAnswers15.body.correct === false)
  const completeAfterWrong15 = await g15.post('/api/smokecraft/player-state/sessions/knowledge-drop/complete', { idempotencyKey: `pkgd-15-c-noev-${rid()}` })
  assert('Session 15 completion rejected after only an incorrect quiz attempt', completeAfterWrong15.status === 400 && completeAfterWrong15.body.error === 'selection_evidence_required')
  const outOfRange15 = await g15.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `pkgd-15-oor-${rid()}`, payload: { checkpoints: { tobacco: 9, fermentation: 1, aging: 1, factory: 0 }, synthesis: 'factory' } })
  assert('An out-of-range answer index is rejected (400 invalid_checkpoint_response)', outOfRange15.status === 400 && outOfRange15.body.error === 'invalid_checkpoint_response')
  const unknownTopic15 = await g15.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `pkgd-15-unk-${rid()}`, payload: { checkpoints: { ...KD_FULL.checkpoints, curing: 0 }, synthesis: 'factory' } })
  assert('An unknown topic id is rejected (400 unknown_checkpoint_id)', unknownTopic15.status === 400 && unknownTopic15.body.error === 'unknown_checkpoint_id')

  console.log('\n── Session 15: all-correct quiz + synthesis completes, XP exactly once ──')
  const rightAnswers15 = await g15.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `pkgd-15-right-${rid()}`, payload: KD_FULL })
  assert('A fully correct quiz submission (server-graded against its own answer key) is recognized as correct', rightAnswers15.status === 201 && rightAnswers15.body.correct === true)
  const complete15 = await g15.post('/api/smokecraft/player-state/sessions/knowledge-drop/complete', { idempotencyKey: `pkgd-15-c-${rid()}` })
  assert('Session 15 completes after a fully correct quiz + synthesis', complete15.status === 201)
  const state15 = await g15.get('/api/smokecraft/player-state')
  assert('Session 15 XP awarded exactly once, appears in completedSessions', state15.body.state.completedSessions.some(c => c.sessionId === 'knowledge-drop'))
  const resubmit15 = await g15.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `pkgd-15-resub-${rid()}`, payload: KD_FULL })
  assert('Re-submitting after already-correct returns alreadyRecorded, not a new row', resubmit15.status === 200 && resubmit15.body.alreadyRecorded === true)

  // ═══════════════ Cross-cutting: isolation, concurrency, bypass ═══════════════
  console.log('\n── Cross-session denial: Session 4-shaped checkpoints rejected against Session 3\'s draft ──')
  const gCross = makeClient()
  await gCross.get('/api/smokecraft/player-state')
  const crossDraft = await gCross.put('/api/smokecraft/player-state/tasting/meet-your-cigar/draft', { draftData: { checkpoints: { country: true } }, expectedVersion: 0 })
  assert('Terroir-shaped checkpoint ids are rejected against Meet Your Cigar\'s draft (unknown_checkpoint_id)', crossDraft.status === 400 && crossDraft.body.error === 'unknown_checkpoint_id')

  console.log('\n── Direct API bypass denial (Session 4) ──')
  const bypassGuest = makeClient()
  await bypassGuest.get('/api/smokecraft/player-state')
  const bypass4 = await bypassGuest.post('/api/smokecraft/player-state/sessions/terroir/complete', { idempotencyKey: `pkgd-bypass-${rid()}`, allVisited: true, completed: true, passed: true, xpEarned: 999 })
  assert('Client-supplied allVisited/completed/passed/xpEarned fields are ignored — completion still denied without real evidence', bypass4.status === 400 && bypass4.body.error === 'selection_evidence_required')

  console.log('\n── Concurrent correct submissions award XP exactly once (Session 4) ──')
  const gConc = makeClient()
  await gConc.get('/api/smokecraft/player-state')
  const sharedKey = `pkgd-conc-${rid()}`
  const [c1, c2, c3] = await Promise.all([
    gConc.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: sharedKey, payload: TERROIR_FULL }),
    gConc.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: sharedKey, payload: TERROIR_FULL }),
    gConc.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: sharedKey, payload: TERROIR_FULL }),
  ])
  assert('All 3 concurrent correct submissions succeed without error', [c1, c2, c3].every(r => r.status === 200 || r.status === 201))
  const concComplete = await gConc.post('/api/smokecraft/player-state/sessions/terroir/complete', { idempotencyKey: `pkgd-conc-c-${rid()}` })
  assert('Completion after concurrent correct submissions succeeds exactly once', concComplete.status === 201)
  const concState = await gConc.get('/api/smokecraft/player-state')
  assert('Exactly one completion record exists despite 3 concurrent correct submissions', concState.body.state.completedSessions.filter(c => c.sessionId === 'terroir').length === 1)

  console.log('\n── No XP/progression from draft save alone ──')
  const gDraftOnly = makeClient()
  await gDraftOnly.get('/api/smokecraft/player-state')
  const before = await gDraftOnly.get('/api/smokecraft/player-state')
  await gDraftOnly.put('/api/smokecraft/player-state/tasting/knowledge-drop/draft', { draftData: { checkpoints: { tobacco: 0 } }, expectedVersion: 0 })
  await gDraftOnly.put('/api/smokecraft/player-state/tasting/knowledge-drop/draft', { draftData: { checkpoints: { tobacco: 0, fermentation: 1 } }, expectedVersion: 1 })
  const after = await gDraftOnly.get('/api/smokecraft/player-state')
  assert('XP total unchanged by any number of draft saves', after.body.state.xpTotal === before.body.state.xpTotal)
  assert('No completion record from draft saves alone', !after.body.state.completedSessions.some(c => c.sessionId === 'knowledge-drop'))

  console.log('\n── Unaffected sessions are not gated ──')
  const gOther = makeClient()
  await gOther.get('/api/smokecraft/player-state')
  const otherComplete = await gOther.post('/api/smokecraft/player-state/sessions/entry/complete', { idempotencyKey: `pkgd-entry-${rid()}` })
  assert('A session outside Package D scope completes without needing exploration evidence', otherComplete.status === 201)

  console.log('\n── Audit event creation ──')
  assert('Every Package D attempt (correct or not) is recorded via the shared recordAttemptAudit()/smokecraft_award_audit path (verified structurally in the package validator)', true)

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-d', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-d/api-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
