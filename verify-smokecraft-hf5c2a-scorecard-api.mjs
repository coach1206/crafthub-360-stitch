#!/usr/bin/env node
/**
 * Holistic Fix 5C-2A — scorecard-scoring authority tests against the
 * real running server, zero mocking.
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

const COMPLETE_COMPONENTS = [
  { componentType: 'wrapper', componentKey: 'habano', componentValue: {} },
  { componentType: 'binder', componentKey: 'nicaragua', componentValue: {} },
  { componentType: 'filler', componentKey: 'criollo', componentValue: {} },
  { componentType: 'vitola', componentKey: 'robusto', componentValue: {} },
]
const ALL_CATEGORIES = ['construction', 'draw', 'burn', 'aroma', 'flavor', 'balance', 'complexity', 'progression', 'finish', 'creativity', 'rule_compliance', 'overall_impression']
const fullScores = (score) => ALL_CATEGORIES.map(category => ({ category, score }))

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const competitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c2a-scorecard-test-${Date.now()}', 'HF5C2A Scorecard Test', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const judge = makeClient()
  const judgeLogin = await judge.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const judgeUserId = judgeLogin.body.data.userId

  async function makeAssignedEntry() {
    const c = makeClient()
    await c.get('/api/smokecraft/player-state')
    const created = await c.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
    const entryId = created.body.entry.entry_id
    await c.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'x' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
    await c.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
    await admin.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`, { judgeUserId })
    return entryId
  }

  console.log('\n── 1. Rubric is real, versioned, and equal-weight (formalized from the already-approved rubric) ──')
  const rubricRes = await judge.get('/api/smokecraft/golden-box/judging/rubric')
  assert('The rubric endpoint returns exactly the 12 already-approved categories', rubricRes.body.criteria.length === 12)
  assert('Every criterion carries a real rule version', rubricRes.body.criteria.every(c => c.ruleVersion === 1))
  assert('Every criterion carries min/max/weight (never invented — weight 1, range 0-10, matching the pre-existing behavior)', rubricRes.body.criteria.every(c => c.minScore === 0 && c.maxScore === 10 && c.weight === 1))

  console.log('\n── 2. Scorecard draft save / reload ──')
  const entry1 = await makeAssignedEntry()
  const draft1 = await judge.post(`/api/smokecraft/golden-box/entries/${entry1}/scorecard/draft`, { scores: [{ category: 'construction', score: 8, comment: 'solid' }], expectedVersion: 1 })
  assert('A partial draft (not every category scored) saves successfully', draft1.status === 200 && draft1.body.scorecard.status === 'draft')
  const reload = await judge.get(`/api/smokecraft/golden-box/judges/me/entries/${entry1}`)
  assert('Reloading the entry rehydrates the real saved draft score', reload.body.scorecard?.scores?.find(s => s.category === 'construction')?.score === 8)

  console.log('\n── 3. Incomplete final submission rejected ──')
  const incompleteSubmit = await judge.post(`/api/smokecraft/golden-box/entries/${entry1}/scorecard`, { scores: [{ category: 'construction', score: 8 }] })
  assert('A final submission missing required criteria is rejected (server decides completeness)', incompleteSubmit.status === 422 && incompleteSubmit.body.error.startsWith('missing_criterion'))

  console.log('\n── 4. Valid final submission accepted, server-computed weighted total, fabricated client total ignored ──')
  const scores2 = fullScores(8)
  const submit1 = await judge.post(`/api/smokecraft/golden-box/entries/${entry1}/scorecard`, { scores: scores2, weightedTotal: 1, totalScore: 999 })
  assert('A complete, valid submission is accepted', submit1.status === 200 && submit1.body.scorecard.status === 'submitted')
  assert('The weighted total is genuinely server-computed (8/10 across 12 equal-weight criteria = 80.00), never the fabricated client value', Number(submit1.body.scorecard.weighted_total) === 80)
  assert('The scorecard is stamped with the real rubric rule version', submit1.body.scorecard.rule_version === 1)

  console.log('\n── 5. Final scorecard cannot be edited (locked at final submission) ──')
  const editAfterSubmit = await judge.post(`/api/smokecraft/golden-box/entries/${entry1}/scorecard/draft`, { scores: [{ category: 'construction', score: 1 }] })
  assert('A draft-save attempt against an already-submitted scorecard is rejected', editAfterSubmit.status === 409 && editAfterSubmit.body.error === 'scorecard_already_submitted')
  const resubmitDifferent = await judge.post(`/api/smokecraft/golden-box/entries/${entry1}/scorecard`, { scores: fullScores(1) })
  assert('Resubmitting with different scores never changes the immutable, already-submitted result', Number(resubmitDifferent.body.scorecard.weighted_total) === 80)

  console.log('\n── 6. Stale-write rejection on draft save ──')
  const entry2 = await makeAssignedEntry()
  await judge.post(`/api/smokecraft/golden-box/entries/${entry2}/scorecard/draft`, { scores: [{ category: 'construction', score: 5 }], expectedVersion: 1 })
  const stale = await judge.post(`/api/smokecraft/golden-box/entries/${entry2}/scorecard/draft`, { scores: [{ category: 'construction', score: 6 }], expectedVersion: 1 })
  assert('A draft save carrying an outdated expectedVersion is rejected with a real 409 conflict', stale.status === 409 && stale.body.error === 'stale_version')

  console.log('\n── 7. Rapid double-click on draft save (idempotency key dedupe) ──')
  const entry3 = await makeAssignedEntry()
  const key = `hf5c2a-dedupe-${Date.now()}`
  const [d1, d2] = await Promise.all([
    judge.post(`/api/smokecraft/golden-box/entries/${entry3}/scorecard/draft`, { scores: [{ category: 'construction', score: 7 }], expectedVersion: 1, idempotencyKey: key }),
    judge.post(`/api/smokecraft/golden-box/entries/${entry3}/scorecard/draft`, { scores: [{ category: 'construction', score: 7 }], expectedVersion: 1, idempotencyKey: key }),
  ])
  assert('Both requests of a rapid double-click (same idempotency key) resolve to the SAME real scorecard row', d1.body.scorecard.id === d2.body.scorecard.id)

  console.log('\n── 8. Two-tab race on the very FIRST draft save (no row exists yet to lock) ──')
  const entry4 = await makeAssignedEntry()
  const [raceA, raceB] = await Promise.all([
    judge.post(`/api/smokecraft/golden-box/entries/${entry4}/scorecard/draft`, { scores: [{ category: 'construction', score: 5 }], expectedVersion: 1 }),
    judge.post(`/api/smokecraft/golden-box/entries/${entry4}/scorecard/draft`, { scores: [{ category: 'construction', score: 6 }], expectedVersion: 1 }),
  ])
  const statuses = [raceA.status, raceB.status]
  assert('Of two concurrent FIRST-EVER draft saves for the same entry+judge, exactly one wins (200) and one honestly loses (409) — never two silently-created scorecards', statuses.filter(s => s === 200).length === 1 && statuses.filter(s => s === 409).length === 1)
  const scorecardCount = psql(`SELECT count(*) FROM golden_box_scorecards WHERE entry_id = '${entry4}'`)
  assert('Exactly one real scorecard row exists in the database despite the race', scorecardCount === '1')

  console.log('\n── 9. Cross-user denial ──')
  const strangerJudge = makeClient()
  await strangerJudge.post('/api/auth/staff-pin-login', { pin: '1234' })
  const strangerAttempt = await strangerJudge.post(`/api/smokecraft/golden-box/entries/${entry2}/scorecard/draft`, { scores: [{ category: 'construction', score: 5 }] })
  assert('A judge not assigned to this entry cannot save a scorecard for it', strangerAttempt.status === 403 && strangerAttempt.body.error === 'judge_not_assigned')

  console.log('\n── 10. Canonical events with full required fields ──')
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type, 'payload', payload) ORDER BY created_at) FROM smokecraft_progression_events WHERE guest_reference = 'user:${judgeUserId}' AND payload->>'entryId' = '${entry1}'`)
  const events = JSON.parse(eventsJson) || []
  const types = events.map(e => e.event_type)
  assert('golden_box_scorecard_draft_saved, golden_box_scorecard_submitted, and golden_box_entry_scored were all emitted', ['golden_box_scorecard_draft_saved', 'golden_box_scorecard_submitted', 'golden_box_entry_scored'].every(t => types.includes(t)))
  const scoredEvent = events.find(e => e.event_type === 'golden_box_entry_scored')
  assert('The canonical golden_box_entry_scored event carries the real server-computed weighted total', scoredEvent.payload.result.weightedTotal === 80)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2a/02-scorecard-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
