#!/usr/bin/env node
/**
 * Holistic Fix 5C-1B — Golden Box submission-foundation API tests
 * against the real running server, zero mocking.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'

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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b), cookies: () => cookies }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
function guestIdFromClient(c) {
  const cookie = c.cookies().smokecraft_guest_session
  const payload = JSON.parse(Buffer.from(cookie.split('.')[1], 'base64').toString())
  return payload.sub
}

const COMPLETE_COMPONENTS = [
  { componentType: 'wrapper', componentKey: 'habano', componentValue: {} },
  { componentType: 'binder', componentKey: 'nicaragua', componentValue: {} },
  { componentType: 'filler', componentKey: 'criollo', componentValue: {} },
  { componentType: 'vitola', componentKey: 'robusto', componentValue: {} },
]

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).trim()

  const competitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c1b-api-test-${Date.now()}', 'HF5C1B API Test', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`).split('\n')[0].trim()

  console.log('\n── 1. Live-screen refresh — fresh guest, no manual identity round-trip ──')
  const c1 = makeClient()
  const createRes = await c1.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('A genuinely fresh guest can create an entry without a prior identity round-trip (no 401)', createRes.status === 201)
  const entryId = createRes.body.entry.entry_id
  assert('Entry starts at version 1, status draft (server-assigned, never client-supplied)', createRes.body.entry.current_version === 1 && createRes.body.entry.status === 'draft')

  console.log('\n── 2. New draft / update draft / reload draft ──')
  const draft1 = await c1.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'v2' }, expectedVersion: 1, idempotencyKey: `hf5c1b-key-${entryId}-1` })
  assert('First draft save succeeds and creates version 2', draft1.status === 200 && draft1.body.version.version_number === 2)
  const reload = await c1.get(`/api/smokecraft/golden-box/entries/${entryId}`)
  assert('Reloading the entry shows the real saved current version (server-persisted, not client-cached)', reload.body.entry.current_version === 2)
  assert('Reload rehydrates the real saved presentation payload', reload.body.currentVersion.presentation_payload.note === 'v2')

  console.log('\n── 3. Rapid double-click — same idempotency key returns the same version, no duplicate ──')
  const retry1 = await c1.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'v2' }, expectedVersion: 1, idempotencyKey: `hf5c1b-key-${entryId}-1` })
  assert('A retried save with the same idempotency key returns the SAME version, never creates a duplicate', retry1.body.version.id === draft1.body.version.id)
  const versionCount = parseInt(psql(`SELECT count(*) FROM golden_box_entry_versions WHERE entry_id = '${entryId}'`), 10)
  assert('Exactly 2 real version rows exist after the retry (initial + one real edit, not three)', versionCount === 2)

  console.log('\n── 4. Stale-write rejection (real optimistic-concurrency conflict) ──')
  const stale = await c1.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'stale-attempt' }, expectedVersion: 1, idempotencyKey: `hf5c1b-key-${entryId}-stale` })
  assert('A save carrying an outdated expectedVersion is rejected with a real conflict (409 stale_version), never silently overwritten', stale.status === 409 && stale.body.error === 'stale_version' && stale.body.currentVersion === 2)

  console.log('\n── 5. Two-tab race on draft save (concurrent saves from the same entry, different expectedVersion assumptions) ──')
  const [raceA, raceB] = await Promise.all([
    c1.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'tab-a' }, expectedVersion: 2, idempotencyKey: `hf5c1b-key-${entryId}-race-a` }),
    c1.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'tab-b' }, expectedVersion: 2, idempotencyKey: `hf5c1b-key-${entryId}-race-b` }),
  ])
  const raceOutcomes = [raceA, raceB].map(r => r.status)
  assert('Of two concurrent saves both claiming the same expectedVersion, exactly one succeeds and the other is honestly told it lost the race (never both silently accepted, never a crash)',
    raceOutcomes.filter(s => s === 200).length === 1 && raceOutcomes.filter(s => s === 409).length === 1)

  console.log('\n── 6. Incomplete submission rejected / valid submission accepted ──')
  const incompleteSubmit = await c1.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
  assert('Submitting with missing required components is rejected (server decides completeness, never the client)', incompleteSubmit.status === 422 && incompleteSubmit.body.error.startsWith('validation_failed'))

  const c2 = makeClient()
  const entry2 = await c2.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const entryId2 = entry2.body.entry.entry_id
  const complete = await c2.patch(`/api/smokecraft/golden-box/entries/${entryId2}/draft`, { presentationPayload: { note: 'complete' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  assert('A draft with all required components saves successfully', complete.status === 200)
  const validSubmit = await c2.post(`/api/smokecraft/golden-box/entries/${entryId2}/submit`, { idempotencyKey: `hf5c1b-submit-${entryId2}` })
  assert('A complete, valid submission is accepted (server-computed eligibility, never client-decided)', validSubmit.status === 200 && validSubmit.body.submission.validation_passed === true)

  console.log('\n── 7. Duplicate submission / rapid double-click / two-tab race on submit ──')
  const dupSubmit = await c2.post(`/api/smokecraft/golden-box/entries/${entryId2}/submit`, { idempotencyKey: `hf5c1b-submit-${entryId2}` })
  assert('A retried submit with the same idempotency key returns the SAME real submission, never a second row', dupSubmit.body.submission.id === validSubmit.body.submission.id)
  const submissionCount = parseInt(psql(`SELECT count(*) FROM golden_box_submissions WHERE entry_id = '${entryId2}'`), 10)
  assert('Exactly one real submission row exists in the database (UNIQUE(entry_id) is genuinely enforced)', submissionCount === 1)

  const c3 = makeClient()
  const entry3 = await c3.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const entryId3 = entry3.body.entry.entry_id
  await c3.patch(`/api/smokecraft/golden-box/entries/${entryId3}/draft`, { presentationPayload: { note: 'race' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  const [subA, subB] = await Promise.all([
    c3.post(`/api/smokecraft/golden-box/entries/${entryId3}/submit`),
    c3.post(`/api/smokecraft/golden-box/entries/${entryId3}/submit`),
  ])
  assert('Two concurrent submit requests (two-tab race) both succeed but resolve to the SAME real submission (no duplicate, no crash)', subA.status === 200 && subB.status === 200 && subA.body.submission.id === subB.body.submission.id)
  const raceSubmissionCount = parseInt(psql(`SELECT count(*) FROM golden_box_submissions WHERE entry_id = '${entryId3}'`), 10)
  assert('The two-tab submit race produced exactly one real database row', raceSubmissionCount === 1)

  console.log('\n── 8. Canonical events with full required fields ──')
  const guest3 = guestIdFromClient(c3)
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type, 'payload', payload) ORDER BY created_at) FROM smokecraft_progression_events WHERE guest_reference = '${guest3}' AND event_type LIKE 'golden_box_%'`)
  const events = JSON.parse(eventsJson) || []
  const types = events.map(e => e.event_type)
  assert('All four canonical event types were emitted (golden_box_draft_created/_updated/_submission_requested/_submitted)', ['golden_box_draft_created', 'golden_box_draft_updated', 'golden_box_submission_requested', 'golden_box_submitted'].every(t => types.includes(t)))
  const submittedEvent = events.find(e => e.event_type === 'golden_box_submitted')
  assert('The canonical golden_box_submitted event carries a real ruleVersion and entryId', submittedEvent.payload.ruleVersion && submittedEvent.payload.entryId === entryId3)

  console.log('\n── 9. Cross-user denial ──')
  const foreignGet = await c1.get(`/api/smokecraft/golden-box/entries/${entryId2}`)
  assert('A different guest is not treated as the entrant for another guest\'s entry (server-resolved visibility, never client-asserted)', foreignGet.body.visibility.canViewRecipe === false)
  assert('A non-owner never receives the real presentation payload/components for a private entry', foreignGet.body.currentVersion === undefined && foreignGet.body.components === undefined)

  console.log('\n── 10. Cross-device resume (same identity, two independent fetches) ──')
  const refetch1 = await c2.get(`/api/smokecraft/golden-box/entries/${entryId2}`)
  const refetch2 = await c2.get(`/api/smokecraft/golden-box/entries/${entryId2}`)
  assert('Two independent fetches under the same identity return identical entry state (no per-device drift)', refetch1.body.entry.status === refetch2.body.entry.status && refetch1.body.entry.current_version === refetch2.body.entry.current_version)

  console.log('\n── 11. Account conversion — Golden Box entry, draft history, and submission transfer ──')
  const c4 = makeClient()
  const entry4 = await c4.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const entryId4 = entry4.body.entry.entry_id
  await c4.patch(`/api/smokecraft/golden-box/entries/${entryId4}/draft`, { presentationPayload: { note: 'pre-conversion' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  await c4.post(`/api/smokecraft/golden-box/entries/${entryId4}/submit`)

  const email = `hf5c1b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const createAccount = await c4.post('/api/smokecraft/account/create', { email, displayName: 'HF5C1B Test' })
  assert('A real account is created on the same cookie jar as the guest', createAccount.status === 201)
  const convert = await c4.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: `hf5c1b-convert-${Date.now()}` })
  assert('Guest-to-account conversion succeeds', convert.status === 201)
  assert('Conversion reports a real Golden Box entry transferred (found-and-fixed gap — entry_id continuity was previously broken)', convert.body.goldenBoxEntriesTransferred >= 1)

  // The OLD entry_id is guest-owned and no longer belongs to the now-
  // authenticated account (a real new entry_id was created to preserve
  // FK continuity for the transferred versions/submission) — the
  // meaningful check is that the ACCOUNT identity can see its own
  // transferred entry, submission, and full draft history under a
  // fresh lookup by competition.
  const entryRes = await c4.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('After conversion, creating/fetching an entry for the same competition under the account identity returns the TRANSFERRED entry (already submitted), not a fresh draft', entryRes.body.entry.status === 'submitted')
  const transferredEntryId = entryRes.body.entry.entry_id
  const transferredDetail = await c4.get(`/api/smokecraft/golden-box/entries/${transferredEntryId}`)
  assert('The transferred entry\'s draft history (components) survived conversion', transferredDetail.body.components?.length === 4)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-1b', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-1b/01-golden-box-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
