#!/usr/bin/env node
/**
 * Holistic Fix 5C-2B-1 — results aggregation and final ranking tests
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
const uniformScores = (score) => ALL_CATEGORIES.map(category => ({ category, score }))

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const judgeA = makeClient()
  const judgeALogin = await judgeA.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const judgeAId = judgeALogin.body.data.userId

  // A second real judge account — venue admin, reused purely as a second
  // distinct assignable judge identity for multi-judge scenarios.
  const judgeB = makeClient()
  const judgeBLogin = await judgeB.post('/api/auth/staff-pin-login', { pin: '1234' })
  const judgeBId = judgeBLogin.body.data.userId

  async function makeCompetition(prefix) {
    return psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}', 'HF5C2B1 ${prefix}', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  }

  async function makeSubmittedEntry(competitionId) {
    const c = makeClient()
    await c.get('/api/smokecraft/player-state')
    const created = await c.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
    const entryId = created.body.entry.entry_id
    await c.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'x' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
    await c.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
    return entryId
  }

  async function assignAndScore(competitionId, entryId, judgeClient, judgeUserId, perCategoryScores) {
    await admin.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`, { judgeUserId })
    const scores = ALL_CATEGORIES.map(category => ({ category, score: perCategoryScores[category] }))
    const res = await judgeClient.post(`/api/smokecraft/golden-box/entries/${entryId}/scorecard`, { scores })
    return res
  }

  function uniformMap(score) {
    const m = {}
    for (const c of ALL_CATEGORIES) m[c] = score
    return m
  }

  // ── 1. One eligible entry ────────────────────────────────────────────
  console.log('\n── 1. One eligible entry — real average, criterion averages ──')
  const compSingle = await makeCompetition('single')
  const entrySingle = await makeSubmittedEntry(compSingle)
  const scoreSingle = await assignAndScore(compSingle, entrySingle, judgeA, judgeAId, uniformMap(8))
  assert('Test setup: scorecard submitted', scoreSingle.status === 200)
  const finalizeSingle = await admin.post(`/api/smokecraft/golden-box/competitions/${compSingle}/results/finalize`, {})
  assert('Finalization succeeds for a single eligible entry', finalizeSingle.status === 200 && finalizeSingle.body.status === 'finalized')
  const rankedSingle = finalizeSingle.body.ranked[0]
  assert('The single entry is ranked #1', Number(rankedSingle.placement) === 1)
  assert('The aggregate score is the real server-computed weighted total (8/10 x 12 = 80.00)', Number(rankedSingle.aggregate_score) === 80)
  assert('judge_count and completed_scorecard_count are real, non-fabricated counts', Number(rankedSingle.judge_count) === 1 && Number(rankedSingle.completed_scorecard_count) === 1)
  assert('Criterion-level averages are persisted per category', rankedSingle.criterion_averages.construction === 8)
  assert('is_winner is set for the top (and only) placement', rankedSingle.is_winner === true)

  // ── 2. Multiple entries, deterministic ranking (no tie) ─────────────
  console.log('\n── 2. Multiple entries — deterministic ranking by real weighted total ──')
  const compMulti = await makeCompetition('multi')
  const entryHigh = await makeSubmittedEntry(compMulti)
  const entryMid = await makeSubmittedEntry(compMulti)
  const entryLow = await makeSubmittedEntry(compMulti)
  await assignAndScore(compMulti, entryHigh, judgeA, judgeAId, uniformMap(9))
  await assignAndScore(compMulti, entryMid, judgeB, judgeBId, uniformMap(7))
  // Third entry needs a distinct judge slot — reuse judgeA on a fresh
  // judge identity is not possible (already assigned to entryHigh), so
  // assign judgeB again (judges may hold multiple assignments across
  // different entries — no rule against that).
  await admin.post(`/api/smokecraft/golden-box/competitions/${compMulti}/entries/${entryLow}/judges`, { judgeUserId: judgeAId })
  await judgeA.post(`/api/smokecraft/golden-box/entries/${entryLow}/scorecard`, { scores: uniformScores(5) })
  const finalizeMulti = await admin.post(`/api/smokecraft/golden-box/competitions/${compMulti}/results/finalize`, {})
  assert('Finalization succeeds for multiple entries', finalizeMulti.status === 200)
  const rankMap = Object.fromEntries(finalizeMulti.body.ranked.map(r => [r.entry_id, r.placement]))
  assert('Higher-scored entry ranks #1', Number(rankMap[entryHigh]) === 1)
  assert('Mid-scored entry ranks #2', Number(rankMap[entryMid]) === 2)
  assert('Lowest-scored entry ranks #3', Number(rankMap[entryLow]) === 3)

  // ── 3. Incomplete scorecards — honest pending, never treated as zero ─
  console.log('\n── 3. Incomplete judging — honest pending state, finalization blocked ──')
  const compIncomplete = await makeCompetition('incomplete')
  const entryReady = await makeSubmittedEntry(compIncomplete)
  await assignAndScore(compIncomplete, entryReady, judgeA, judgeAId, uniformMap(8))
  const entryPending = await makeSubmittedEntry(compIncomplete)
  await admin.post(`/api/smokecraft/golden-box/competitions/${compIncomplete}/entries/${entryPending}/judges`, { judgeUserId: judgeBId })
  // judgeB never submits a scorecard for entryPending — genuinely incomplete.
  const liveView = await admin.get(`/api/smokecraft/golden-box/competitions/${compIncomplete}/results`)
  assert('The live admin view reports the incomplete entry as judging_in_progress, never silently scored as zero', liveView.body.pending.some(p => p.entryId === entryPending && p.completionStatus === 'judging_in_progress'))
  const finalizeBlocked = await admin.post(`/api/smokecraft/golden-box/competitions/${compIncomplete}/results/finalize`, {})
  assert('Finalization is blocked while any entry is still genuinely mid-judging', finalizeBlocked.status === 409 && finalizeBlocked.body.error === 'judging_incomplete')
  // Complete the missing scorecard, then finalize should succeed.
  await judgeB.post(`/api/smokecraft/golden-box/entries/${entryPending}/scorecard`, { scores: uniformScores(6) })
  const finalizeUnblocked = await admin.post(`/api/smokecraft/golden-box/competitions/${compIncomplete}/results/finalize`, {})
  assert('Finalization succeeds once every assigned judge has completed their scorecard', finalizeUnblocked.status === 200 && finalizeUnblocked.body.ranked.length === 2)

  // ── 4. Withdrawn and disqualified entries excluded ───────────────────
  console.log('\n── 4. Withdrawn and disqualified entries are excluded from ranking ──')
  const compExclude = await makeCompetition('exclude')
  const entryOk = await makeSubmittedEntry(compExclude)
  await assignAndScore(compExclude, entryOk, judgeA, judgeAId, uniformMap(8))
  const entryWithdrawnClient = makeClient()
  await entryWithdrawnClient.get('/api/smokecraft/player-state')
  const withdrawnCreated = await entryWithdrawnClient.post(`/api/smokecraft/golden-box/competitions/${compExclude}/entries`)
  const entryWithdrawn = withdrawnCreated.body.entry.entry_id
  await entryWithdrawnClient.post(`/api/smokecraft/golden-box/entries/${entryWithdrawn}/withdraw`)
  const entryDisqualified = await makeSubmittedEntry(compExclude)
  psql(`UPDATE golden_box_entries SET status = 'disqualified' WHERE entry_id = '${entryDisqualified}'`)
  psql(`INSERT INTO golden_box_results (competition_id, entry_id, disqualified, disqualification_reason) SELECT competition_id, entry_id, true, 'test' FROM golden_box_entries WHERE entry_id = '${entryDisqualified}' ON CONFLICT (competition_id, entry_id) DO UPDATE SET disqualified = true`)
  const finalizeExclude = await admin.post(`/api/smokecraft/golden-box/competitions/${compExclude}/results/finalize`, {})
  assert('Finalization succeeds, ranking only the real eligible entry', finalizeExclude.status === 200 && finalizeExclude.body.ranked.length === 1 && finalizeExclude.body.ranked[0].entry_id === entryOk)
  const excludeView = await admin.get(`/api/smokecraft/golden-box/competitions/${compExclude}/results`)
  assert('The withdrawn entry never appears in the eligible ranking pool', !excludeView.body.ranked?.some?.(r => r.entryId === entryWithdrawn) && !excludeView.body.pending?.some?.(p => p.entryId === entryWithdrawn))
  assert('The disqualified entry never appears in the eligible ranking pool', !excludeView.body.ranked?.some?.(r => r.entryId === entryDisqualified))

  // ── 5. Deterministic tie-break — construction-quality average ────────
  console.log('\n── 5. Deterministic tie — resolved by construction-quality criterion average ──')
  const compTie = await makeCompetition('tie-construction')
  const entryX = await makeSubmittedEntry(compTie)
  const entryY = await makeSubmittedEntry(compTie)
  const scoresX = { ...uniformMap(8), construction: 9, draw: 7 }
  const scoresY = { ...uniformMap(8), construction: 7, draw: 9 }
  await assignAndScore(compTie, entryX, judgeA, judgeAId, scoresX)
  await admin.post(`/api/smokecraft/golden-box/competitions/${compTie}/entries/${entryY}/judges`, { judgeUserId: judgeAId })
  await judgeA.post(`/api/smokecraft/golden-box/entries/${entryY}/scorecard`, { scores: ALL_CATEGORIES.map(category => ({ category, score: scoresY[category] })) })
  const finalizeTie = await admin.post(`/api/smokecraft/golden-box/competitions/${compTie}/results/finalize`, {})
  const rowX = finalizeTie.body.ranked.find(r => r.entry_id === entryX)
  const rowY = finalizeTie.body.ranked.find(r => r.entry_id === entryY)
  assert('Both entries have the same real total weighted score (9+7 == 7+9)', Number(rowX.aggregate_score) === Number(rowY.aggregate_score))
  assert('The entry with the higher construction average ranks first, tie-break reason recorded', Number(rowX.placement) === 1 && rowY.tie_break_reason === 'construction_avg')

  // ── 6. Variance tie-break ─────────────────────────────────────────────
  console.log('\n── 6. Variance tie-break — same averages, more consistent judging ranks higher ──')
  const compVar = await makeCompetition('tie-variance')
  const entryP = await makeSubmittedEntry(compVar)
  const entryQ = await makeSubmittedEntry(compVar)
  await admin.post(`/api/smokecraft/golden-box/competitions/${compVar}/entries/${entryP}/judges`, { judgeUserId: judgeAId })
  await judgeA.post(`/api/smokecraft/golden-box/entries/${entryP}/scorecard`, { scores: uniformScores(8) })
  await admin.post(`/api/smokecraft/golden-box/competitions/${compVar}/entries/${entryP}/judges`, { judgeUserId: judgeBId })
  await judgeB.post(`/api/smokecraft/golden-box/entries/${entryP}/scorecard`, { scores: uniformScores(8) })
  await admin.post(`/api/smokecraft/golden-box/competitions/${compVar}/entries/${entryQ}/judges`, { judgeUserId: judgeAId })
  await judgeA.post(`/api/smokecraft/golden-box/entries/${entryQ}/scorecard`, { scores: uniformScores(6) })
  await admin.post(`/api/smokecraft/golden-box/competitions/${compVar}/entries/${entryQ}/judges`, { judgeUserId: judgeBId })
  await judgeB.post(`/api/smokecraft/golden-box/entries/${entryQ}/scorecard`, { scores: uniformScores(10) })
  const finalizeVar = await admin.post(`/api/smokecraft/golden-box/competitions/${compVar}/results/finalize`, {})
  const rowP = finalizeVar.body.ranked.find(r => r.entry_id === entryP)
  const rowQ = finalizeVar.body.ranked.find(r => r.entry_id === entryQ)
  assert('Both entries average to the same real weighted total (80.00)', Number(rowP.aggregate_score) === 80 && Number(rowQ.aggregate_score) === 80)
  assert('Both entries have identical real per-criterion averages', rowP.criterion_averages.construction === rowQ.criterion_averages.construction)
  assert('The more consistently judged entry (zero variance) ranks first', Number(rowP.placement) === 1 && rowQ.tie_break_reason === 'score_variance')

  // ── 7. Submission-time tie-break ──────────────────────────────────────
  console.log('\n── 7. Submission-time tie-break — identical scores, earlier entry ranks first ──')
  const compTime = await makeCompetition('tie-time')
  const entryEarly = await makeSubmittedEntry(compTime)
  const entryLate = await makeSubmittedEntry(compTime)
  psql(`UPDATE golden_box_entries SET submitted_at = now() - interval '1 hour' WHERE entry_id = '${entryEarly}'`)
  psql(`UPDATE golden_box_entries SET submitted_at = now() WHERE entry_id = '${entryLate}'`)
  await assignAndScore(compTime, entryEarly, judgeA, judgeAId, uniformMap(8))
  await admin.post(`/api/smokecraft/golden-box/competitions/${compTime}/entries/${entryLate}/judges`, { judgeUserId: judgeAId })
  await judgeA.post(`/api/smokecraft/golden-box/entries/${entryLate}/scorecard`, { scores: uniformScores(8) })
  const finalizeTime = await admin.post(`/api/smokecraft/golden-box/competitions/${compTime}/results/finalize`, {})
  const rowEarly = finalizeTime.body.ranked.find(r => r.entry_id === entryEarly)
  const rowLate = finalizeTime.body.ranked.find(r => r.entry_id === entryLate)
  assert('Identical scores, identical variance — the earlier valid submission ranks first', Number(rowEarly.placement) === 1 && rowLate.tie_break_reason === 'submission_time')

  // ── 8. Duplicate finalization returns the original, never recomputes ─
  console.log('\n── 8. Duplicate finalization is idempotent — returns the SAME original result ──')
  const dupKey = `hf5c2b1-dedupe-${Date.now()}`
  const firstFinal = await admin.post(`/api/smokecraft/golden-box/competitions/${compSingle}/results/finalize`, { idempotencyKey: dupKey })
  const secondFinal = await admin.post(`/api/smokecraft/golden-box/competitions/${compSingle}/results/finalize`, { idempotencyKey: `hf5c2b1-dedupe-different-${Date.now()}` })
  assert('A repeated finalize call for the same competition/result_version returns the identical original finalized row, never a recomputation', secondFinal.body.ranked[0].finalized_at === firstFinal.body.ranked[0].finalized_at)
  const finalizationCount = psql(`SELECT count(*) FROM golden_box_result_finalizations WHERE competition_id = ${compSingle}`)
  assert('Exactly one real finalization row exists despite repeated finalize calls', finalizationCount === '1')

  // ── 9. Two-tab finalization race ──────────────────────────────────────
  console.log('\n── 9. Two-tab finalization race — exactly one real finalization row ──')
  const compRace = await makeCompetition('race')
  const entryRace = await makeSubmittedEntry(compRace)
  await assignAndScore(compRace, entryRace, judgeA, judgeAId, uniformMap(8))
  const [raceA, raceB] = await Promise.all([
    admin.post(`/api/smokecraft/golden-box/competitions/${compRace}/results/finalize`, {}),
    admin.post(`/api/smokecraft/golden-box/competitions/${compRace}/results/finalize`, {}),
  ])
  assert('Both concurrent finalize requests succeed and resolve to the SAME real finalized result (no crash, no duplicate)', raceA.status === 200 && raceB.status === 200 && raceA.body.ranked[0].finalized_at === raceB.body.ranked[0].finalized_at)
  const raceFinalizationCount = psql(`SELECT count(*) FROM golden_box_result_finalizations WHERE competition_id = ${compRace}`)
  assert('Exactly one real finalization row exists in the database despite the two-tab race', raceFinalizationCount === '1')

  // ── 10. Unauthorized finalization ─────────────────────────────────────
  console.log('\n── 10. Unauthorized finalization denied ──')
  const stranger = makeClient()
  await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
  const unauthorizedFinalize = await stranger.post(`/api/smokecraft/golden-box/competitions/${compMulti}/results/finalize`, {})
  assert('A non-admin cannot finalize results (real role check, not client-asserted)', unauthorizedFinalize.status === 403)

  // ── 11. No client-controlled rank ─────────────────────────────────────
  console.log('\n── 11. No client-controlled rank or score ──')
  const compNoClient = await makeCompetition('no-client-rank')
  const entryNoClient = await makeSubmittedEntry(compNoClient)
  await assignAndScore(compNoClient, entryNoClient, judgeA, judgeAId, uniformMap(8))
  const finalizeNoClient = await admin.post(`/api/smokecraft/golden-box/competitions/${compNoClient}/results/finalize`, { ranked: [{ entryId: entryNoClient, placement: 99, aggregate_score: 1 }], placement: 99 })
  assert('A fabricated client-submitted placement/score in the finalize request body is completely ignored', Number(finalizeNoClient.body.ranked[0].placement) === 1 && Number(finalizeNoClient.body.ranked[0].aggregate_score) === 80)

  // ── 12. Venue isolation ───────────────────────────────────────────────
  console.log('\n── 12. Venue isolation — a venue-scoped competition never ranks another venue\'s entries ──')
  const venueId1 = psql(`INSERT INTO venues (venue_id, name) VALUES ('hf5c2b1-venue-a-${Date.now()}', 'HF5C2B1 Venue A') RETURNING venue_id`)
  const venueId2 = psql(`INSERT INTO venues (venue_id, name) VALUES ('hf5c2b1-venue-b-${Date.now()}', 'HF5C2B1 Venue B') RETURNING venue_id`)
  const compVenueA = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, scope_venue_id, status, submission_closes_at, created_by) VALUES ('hf5c2b1-venue-a-comp-${Date.now()}', 'HF5C2B1 Venue A Comp', 'venue', '${venueId1}', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  const compVenueB = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, scope_venue_id, status, submission_closes_at, created_by) VALUES ('hf5c2b1-venue-b-comp-${Date.now()}', 'HF5C2B1 Venue B Comp', 'venue', '${venueId2}', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('manager-demo-001', '${venueId1}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('manager-demo-001', '${venueId2}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  const entryVenueA = await makeSubmittedEntry(compVenueA)
  const entryVenueB = await makeSubmittedEntry(compVenueB)
  await assignAndScore(compVenueA, entryVenueA, judgeA, judgeAId, uniformMap(9))
  await assignAndScore(compVenueB, entryVenueB, judgeA, judgeAId, uniformMap(3))
  const finalizeVenueA = await admin.post(`/api/smokecraft/golden-box/competitions/${compVenueA}/results/finalize`, {})
  assert('Venue A\'s finalized ranking contains only Venue A\'s own entry', finalizeVenueA.body.ranked.length === 1 && finalizeVenueA.body.ranked[0].entry_id === entryVenueA)

  // ── 13. Competition isolation ─────────────────────────────────────────
  console.log('\n── 13. Competition isolation — separate global competitions never mix rankings ──')
  const compIsoA = await makeCompetition('iso-a')
  const compIsoB = await makeCompetition('iso-b')
  const entryIsoA = await makeSubmittedEntry(compIsoA)
  const entryIsoB = await makeSubmittedEntry(compIsoB)
  await assignAndScore(compIsoA, entryIsoA, judgeA, judgeAId, uniformMap(4))
  await assignAndScore(compIsoB, entryIsoB, judgeA, judgeAId, uniformMap(9))
  const finalizeIsoA = await admin.post(`/api/smokecraft/golden-box/competitions/${compIsoA}/results/finalize`, {})
  assert('Competition A\'s ranking never includes Competition B\'s entry', !finalizeIsoA.body.ranked.some(r => r.entry_id === entryIsoB))

  // ── 14. Canonical events ────────────────────────────────────────────
  console.log('\n── 14. Canonical events with full required fields ──')
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type, 'payload', payload) ORDER BY created_at) FROM smokecraft_progression_events WHERE payload->>'entryId' = '${entrySingle}'`)
  const events = JSON.parse(eventsJson) || []
  const types = events.map(e => e.event_type)
  assert('golden_box_results_calculated and golden_box_ranking_finalized were both emitted for the finalized entry', ['golden_box_results_calculated', 'golden_box_ranking_finalized'].every(t => types.includes(t)))
  const rankedEvent = events.find(e => e.event_type === 'golden_box_ranking_finalized')
  assert('The canonical golden_box_ranking_finalized event carries the real competition/rank/tie-break/result-version fields', Number(rankedEvent.payload.result.competitionId) === Number(compSingle) && rankedEvent.payload.result.rank === 1 && rankedEvent.payload.result.resultVersion === 1)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2b-1/01-results-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
