#!/usr/bin/env node
/**
 * Required-Interaction Closure Package A — Draft-Persistence Correction.
 * Server-authoritative draft save/read/resume for Sessions 8, 12, 16.
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

async function main() {
  console.log('\n── 1. Session 8 (first-third) — create/read/update draft ──')
  const g8 = makeClient()
  await g8.get('/api/smokecraft/player-state')
  const empty8 = await g8.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('A fresh guest reads an empty draft (version 0)', empty8.status === 200 && empty8.body.version === 0 && Object.keys(empty8.body.draftData || {}).length === 0)

  const create8 = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'], personalNotes: 'Bright opening.' }, expectedVersion: 0 })
  assert('Creating a Session 8 draft succeeds and returns version 1', create8.status === 200 && create8.body.current.version === 1)

  const read8 = await g8.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('Reading back the Session 8 draft returns exactly what was saved', read8.status === 200 && JSON.stringify(read8.body.draftData.notesSelected) === JSON.stringify(['Aroma Opening']) && read8.body.draftData.personalNotes === 'Bright opening.')

  const update8 = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening', 'Draw Ease'], personalNotes: 'Bright opening, easy draw.' }, expectedVersion: 1 })
  assert('Updating the Session 8 draft succeeds and returns version 2', update8.status === 200 && update8.body.current.version === 2)

  console.log('\n── 2. Reload / resume ──')
  const gReload = makeClient()
  gReload.cookies = g8.cookies
  const reloadRead = await g8.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('A fresh read (simulating genuine page reload) returns the latest saved draft', reloadRead.status === 200 && reloadRead.body.draftData.notesSelected.length === 2)

  console.log('\n── 3. Malformed / invalid draft payloads ──')
  const badObj = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: 'not-an-object', expectedVersion: 2 })
  assert('A non-object draftData is rejected (400)', badObj.status === 400)

  const noVersion = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'] } })
  assert('A missing expectedVersion is rejected (400)', noVersion.status === 400)

  const unknownField = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'], overallRating: 5 }, expectedVersion: 2 })
  assert('An unknown draft field is rejected (400 unknown_draft_field)', unknownField.status === 400 && unknownField.body.error === 'unknown_draft_field')

  const invalidId = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Not A Real Zone'] }, expectedVersion: 2 })
  assert('A draft with an out-of-vocabulary observation id is rejected (400 invalid_observation_id)', invalidId.status === 400 && invalidId.body.error === 'invalid_observation_id')

  const longNotes = await g8.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'], personalNotes: 'x'.repeat(2001) }, expectedVersion: 2 })
  assert('Personal notes over 2000 chars are rejected (400 personal_notes_too_long)', longNotes.status === 400 && longNotes.body.error === 'personal_notes_too_long')

  console.log('\n── 4. Cross-player denial ──')
  const stranger = makeClient()
  await stranger.get('/api/smokecraft/player-state')
  const strangerRead = await stranger.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('A different guest never sees another guest\'s Session 8 draft (reads their own empty draft)', strangerRead.status === 200 && (Object.keys(strangerRead.body.draftData || {}).length === 0))

  console.log('\n── 5. Cross-session isolation (one session cannot overwrite another\'s draft) ──')
  const g12 = makeClient()
  await g12.get('/api/smokecraft/player-state')
  const create12 = await g12.put('/api/smokecraft/player-state/tasting/second-third/draft', { draftData: { notesSelected: ['Flavor Development'], personalNotes: 'Deepening.' }, expectedVersion: 0 })
  assert('Session 12 draft save succeeds independently', create12.status === 200)
  const readBack8 = await g8.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('Session 8\'s own draft is unaffected by an unrelated Session 12 draft save', readBack8.status === 200 && readBack8.body.draftData.notesSelected.includes('Aroma Opening'))
  const crossVocab = await g12.put('/api/smokecraft/player-state/tasting/second-third/draft', { draftData: { notesSelected: ['Aroma Opening'] }, expectedVersion: create12.body.current.version })
  assert('Session 8\'s vocabulary is rejected when saved against Session 12\'s draft (distinct per-session vocabularies enforced on drafts too)', crossVocab.status === 400 && crossVocab.body.error === 'invalid_observation_id')

  console.log('\n── 6. Concurrent / stale save (optimistic concurrency) ──')
  const gConc = makeClient()
  await gConc.get('/api/smokecraft/player-state')
  const base = await gConc.put('/api/smokecraft/player-state/tasting/final-third/draft', { draftData: { notesSelected: ['earth'] }, expectedVersion: 0 })
  assert('Baseline final-third draft save succeeds', base.status === 200 && base.body.current.version === 1)
  const stale = await gConc.put('/api/smokecraft/player-state/tasting/final-third/draft', { draftData: { notesSelected: ['earth', 'cocoa'] }, expectedVersion: 0 })
  assert('A stale-version save (expectedVersion behind current) is honestly rejected with 409', stale.status === 409 && stale.body.error === 'stale_version')
  assert('The 409 response returns the server\'s current authoritative draft, not silently applying the stale write', stale.body.current && JSON.stringify(stale.body.current.draftData.notesSelected) === JSON.stringify(['earth']))

  const [c1, c2] = await Promise.all([
    gConc.put('/api/smokecraft/player-state/tasting/final-third/draft', { draftData: { notesSelected: ['earth', 'leather'] }, expectedVersion: 1 }),
    gConc.put('/api/smokecraft/player-state/tasting/final-third/draft', { draftData: { notesSelected: ['earth', 'wood'] }, expectedVersion: 1 }),
  ])
  const concurrentResults = [c1, c2]
  const oneSucceeded = concurrentResults.filter(r => r.status === 200).length === 1
  const oneConflicted = concurrentResults.filter(r => r.status === 409).length === 1
  assert('Two concurrent saves sharing the same expectedVersion: exactly one succeeds, the other gets an honest 409 (no silent corruption)', oneSucceeded && oneConflicted)

  console.log('\n── 7. Completed-state protection (stale draft cannot overwrite completion) ──')
  const gComplete = makeClient()
  await gComplete.get('/api/smokecraft/player-state')
  const draftBeforeComplete = await gComplete.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Aroma Opening'] }, expectedVersion: 0 })
  assert('Draft save before completion succeeds', draftBeforeComplete.status === 200)
  const submitEvidence = await gComplete.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `draftcorr-${rid()}`, notesSelected: ['Aroma Opening', 'Draw Ease'] })
  assert('Real evidence submission succeeds', submitEvidence.status === 201)
  const complete = await gComplete.post('/api/smokecraft/player-state/sessions/first-third/complete', { idempotencyKey: `draftcorr-c-${rid()}` })
  assert('Session 8 completes', complete.status === 201)
  const staleWriteAfterComplete = await gComplete.put('/api/smokecraft/player-state/tasting/first-third/draft', { draftData: { notesSelected: ['Body Start'] }, expectedVersion: draftBeforeComplete.body.current.version })
  assert('A draft write attempted AFTER completion is denied (409 already_completed) — a stale draft can never overwrite completed state', staleWriteAfterComplete.status === 409 && staleWriteAfterComplete.body.error === 'already_completed')
  const draftReadAfterComplete = await gComplete.get('/api/smokecraft/player-state/tasting/first-third/draft')
  assert('The draft itself is unchanged by the rejected post-completion write attempt', draftReadAfterComplete.status === 200 && JSON.stringify(draftReadAfterComplete.body.draftData.notesSelected) === JSON.stringify(['Aroma Opening']))

  console.log('\n── 8. No XP / no progression on draft save ──')
  const gNoXp = makeClient()
  await gNoXp.get('/api/smokecraft/player-state')
  const stateBeforeDraft = await gNoXp.get('/api/smokecraft/player-state')
  await gNoXp.put('/api/smokecraft/player-state/tasting/second-third/draft', { draftData: { notesSelected: ['Flavor Development', 'Body Evolution'], personalNotes: 'Testing no XP.' }, expectedVersion: 0 })
  await gNoXp.put('/api/smokecraft/player-state/tasting/second-third/draft', { draftData: { notesSelected: ['Flavor Development'] }, expectedVersion: 1 })
  const stateAfterDraft = await gNoXp.get('/api/smokecraft/player-state')
  assert('XP total is unchanged by draft saves (draft save never awards XP)', stateAfterDraft.body.state.xpTotal === stateBeforeDraft.body.state.xpTotal)
  assert('No completion record is created by draft saves alone', !stateAfterDraft.body.state.completedSessions.some(c => c.sessionId === 'second-third'))

  console.log('\n── 9. Session 12 and 16 full draft round trips ──')
  const g12b = makeClient()
  await g12b.get('/api/smokecraft/player-state')
  const s12Create = await g12b.put('/api/smokecraft/player-state/tasting/second-third/draft', { draftData: { notesSelected: ['Aroma Depth'], personalNotes: 'Depth check.' }, expectedVersion: 0 })
  assert('Session 12 draft creates', s12Create.status === 200)
  const s12Read = await g12b.get('/api/smokecraft/player-state/tasting/second-third/draft')
  assert('Session 12 draft reads back correctly', s12Read.body.draftData.notesSelected.includes('Aroma Depth'))

  const g16b = makeClient()
  await g16b.get('/api/smokecraft/player-state')
  const s16Create = await g16b.put('/api/smokecraft/player-state/tasting/final-third/draft', { draftData: { notesSelected: ['aroma-strength', 'earth'], personalNotes: 'Finish notes.' }, expectedVersion: 0 })
  assert('Session 16 draft creates (combined focus+flavor vocabulary)', s16Create.status === 200)
  const s16Read = await g16b.get('/api/smokecraft/player-state/tasting/final-third/draft')
  assert('Session 16 draft reads back correctly', s16Read.body.draftData.notesSelected.includes('aroma-strength') && s16Read.body.draftData.notesSelected.includes('earth'))

  console.log('\n── 10. Regression: Mini Tasting\'s own draft is unaffected ──')
  const gMini = makeClient()
  await gMini.get('/api/smokecraft/player-state')
  const miniDraft = await gMini.put('/api/smokecraft/player-state/tasting/mini-tasting/draft', { draftData: { selectedCigarId: 'house-1', compareIds: [] }, expectedVersion: 0 })
  assert('Mini Tasting\'s own draft (unrelated activityKey, different field shape) still saves exactly as before — no regression from the new field-validation logic', miniDraft.status === 200)

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-a-draft-correction', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-a-draft-correction/api-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
