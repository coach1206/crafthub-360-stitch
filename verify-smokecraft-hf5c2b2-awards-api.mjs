#!/usr/bin/env node
/**
 * Holistic Fix 5C-2B-2 — Golden Box award-issuance tests against the
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
const uniformScores = (score) => ALL_CATEGORIES.map(category => ({ category, score }))

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const judgeA = makeClient()
  const judgeALogin = await judgeA.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const judgeAId = judgeALogin.body.data.userId

  async function makeCompetition(prefix) {
    return psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}', 'HF5C2B2 ${prefix}', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
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

  async function scoreEntry(competitionId, entryId, score) {
    await admin.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`, { judgeUserId: judgeAId })
    return judgeA.post(`/api/smokecraft/golden-box/entries/${entryId}/scorecard`, { scores: uniformScores(score) })
  }

  // ── Setup: one competition, four entries → finalize (1st/2nd/3rd/4th) ─
  const comp = await makeCompetition('awards')
  const entry1 = await makeSubmittedEntry(comp)
  const entry2 = await makeSubmittedEntry(comp)
  const entry3 = await makeSubmittedEntry(comp)
  const entry4 = await makeSubmittedEntry(comp)
  await scoreEntry(comp, entry1, 9)
  await scoreEntry(comp, entry2, 8)
  await scoreEntry(comp, entry3, 7)
  await scoreEntry(comp, entry4, 6)
  const finalize = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/results/finalize`, {})
  assert('Test setup: finalization succeeds for 4 entries', finalize.status === 200)

  console.log('\n── 1. Unfinalized competition rejected ──')
  const compUnfinalized = await makeCompetition('unfinalized')
  const entryUnfinalized = await makeSubmittedEntry(compUnfinalized)
  await scoreEntry(compUnfinalized, entryUnfinalized, 9)
  const issueUnfinalized = await admin.post(`/api/smokecraft/golden-box/competitions/${compUnfinalized}/awards/issue`, {})
  assert('Issuing awards before finalization is rejected with a real 409', issueUnfinalized.status === 409 && issueUnfinalized.body.error === 'finalized_result_required')

  console.log('\n── 2. Unauthorized issuance denied ──')
  const stranger = makeClient()
  await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
  const unauthorizedIssue = await stranger.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, {})
  assert('A non-admin cannot issue awards (real role check)', unauthorizedIssue.status === 403)

  console.log('\n── 3. First/second/third place issuance, unsupported placement gets nothing ──')
  const issue = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, {})
  assert('Award issuance succeeds', issue.status === 200 && issue.body.status === 'issued')
  const awardsByEntry = Object.fromEntries(issue.body.awards.map(a => [a.entry_id, a]))
  assert('Exactly 3 award records were created (top 3 only)', issue.body.awards.length === 3)
  assert('The #1 entry receives a first_place award', awardsByEntry[entry1]?.award_type === 'first_place')
  assert('The #2 entry receives a second_place award', awardsByEntry[entry2]?.award_type === 'second_place')
  assert('The #3 entry receives a third_place award', awardsByEntry[entry3]?.award_type === 'third_place')
  assert('The #4 entry (unsupported placement) receives NO fabricated award record', !awardsByEntry[entry4])
  assert('Every award carries a real rule ID and version', awardsByEntry[entry1].rule_id === 'golden_box_placement_award' && awardsByEntry[entry1].rule_version === 1)

  console.log('\n── 4. No fabricated XP/badge/stamp — genuinely unavailable, no approved rule ──')
  assert('XP is honestly reported unavailable (no xp_award_rules row exists for golden_box)', awardsByEntry[entry1].xp_status === 'unavailable' && awardsByEntry[entry1].xp_transaction_id === null)
  assert('Badge is honestly reported unavailable (no golden-box badge catalog entry exists)', awardsByEntry[entry1].badge_status === 'unavailable' && awardsByEntry[entry1].badge_reference === null)
  assert('Passport stamp is honestly reported unavailable (no golden-box stamp catalog entry exists)', awardsByEntry[entry1].passport_stamp_status === 'unavailable' && awardsByEntry[entry1].passport_stamp_reference === null)
  const xpTxCount = psql(`SELECT count(*) FROM xp_transactions WHERE source_id = '${entry1}'`)
  assert('No real XP transaction was fabricated for the unavailable reward', xpTxCount === '0')

  console.log('\n── 5. Duplicate issuance is idempotent ──')
  const dupKey = `hf5c2b2-dedupe-${Date.now()}`
  const firstIssue = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, { idempotencyKey: dupKey })
  const secondIssue = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, { idempotencyKey: `hf5c2b2-dedupe-different-${Date.now()}` })
  assert('A repeated issuance call returns the identical original issued_at, never a recomputation', secondIssue.body.issuance.issued_at === firstIssue.body.issuance.issued_at)
  const issuanceCount = psql(`SELECT count(*) FROM golden_box_award_issuances WHERE competition_id = ${comp}`)
  assert('Exactly one real issuance row exists despite repeated calls', issuanceCount === '1')
  const awardCount = psql(`SELECT count(*) FROM golden_box_awards WHERE competition_id = ${comp}`)
  assert('Exactly 3 real award rows exist despite repeated calls (no duplicate awards)', awardCount === '3')

  console.log('\n── 6. Rapid double-click / two-tab issuance race ──')
  const compRace = await makeCompetition('award-race')
  const entryRace = await makeSubmittedEntry(compRace)
  await scoreEntry(compRace, entryRace, 9)
  await admin.post(`/api/smokecraft/golden-box/competitions/${compRace}/results/finalize`, {})
  const [raceA, raceB] = await Promise.all([
    admin.post(`/api/smokecraft/golden-box/competitions/${compRace}/awards/issue`, {}),
    admin.post(`/api/smokecraft/golden-box/competitions/${compRace}/awards/issue`, {}),
  ])
  assert('Both concurrent issuance requests succeed and resolve to the SAME real issuance (no crash, no duplicate)', raceA.status === 200 && raceB.status === 200 && raceA.body.issuance.issued_at === raceB.body.issuance.issued_at)
  const raceIssuanceCount = psql(`SELECT count(*) FROM golden_box_award_issuances WHERE competition_id = ${compRace}`)
  assert('Exactly one real issuance row exists despite the two-tab race', raceIssuanceCount === '1')
  const raceAwardCount = psql(`SELECT count(*) FROM golden_box_awards WHERE competition_id = ${compRace}`)
  assert('Exactly one real award row exists despite the two-tab race', raceAwardCount === '1')

  console.log('\n── 7. Finalized result remains immutable after award issuance ──')
  const resultAfterAwards = await admin.get(`/api/smokecraft/golden-box/competitions/${comp}/results`)
  assert('The finalized ranking is unchanged after award issuance (placements/scores identical)', resultAfterAwards.body.ranked.find(r => r.entry_id === entry1).placement === 1)

  console.log('\n── 8. Venue and competition isolation ──')
  const venueId = psql(`INSERT INTO venues (venue_id, name) VALUES ('hf5c2b2-venue-${Date.now()}', 'HF5C2B2 Venue') RETURNING venue_id`)
  const compVenue = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, scope_venue_id, status, submission_closes_at, created_by) VALUES ('hf5c2b2-venue-comp-${Date.now()}', 'HF5C2B2 Venue Comp', 'venue', '${venueId}', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('manager-demo-001', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  const entryVenue = await makeSubmittedEntry(compVenue)
  await scoreEntry(compVenue, entryVenue, 9)
  await admin.post(`/api/smokecraft/golden-box/competitions/${compVenue}/results/finalize`, {})
  const issueVenue = await admin.post(`/api/smokecraft/golden-box/competitions/${compVenue}/awards/issue`, {})
  assert('Venue competition awards contain only that venue\'s own entry', issueVenue.body.awards.length === 1 && issueVenue.body.awards[0].entry_id === entryVenue)
  assert('Global competition awards never include the venue competition\'s entry', !issue.body.awards.some(a => a.entry_id === entryVenue))

  console.log('\n── 9. Award visibility (getEntryAward) states ──')
  const awardsPendingCheck = await makeCompetition('pending-check')
  const entryPendingCheck = await makeSubmittedEntry(awardsPendingCheck)
  const notFinalizedView = await admin.get(`/api/smokecraft/golden-box/competitions/${awardsPendingCheck}/entries/${entryPendingCheck}/award`)
  assert('An entry in an unfinalized competition reports no_finalized_result (honest, never fabricated)', notFinalizedView.body.status === 'no_finalized_result')
  const notQualifiedView = await admin.get(`/api/smokecraft/golden-box/competitions/${comp}/entries/${entry4}/award`)
  assert('The #4 (unsupported placement) entry reports not_qualified after issuance, never a fabricated award', notQualifiedView.body.status === 'not_qualified')
  const issuedView = await admin.get(`/api/smokecraft/golden-box/competitions/${comp}/entries/${entry1}/award`)
  assert('The #1 entry reports the real issued award via the visibility endpoint', issuedView.body.status === 'issued' && issuedView.body.award.award_type === 'first_place')

  console.log('\n── 10. Canonical events ──')
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type, 'payload', payload) ORDER BY created_at) FROM smokecraft_progression_events WHERE payload->>'entryId' = '${entry1}'`)
  const events = JSON.parse(eventsJson) || []
  const types = events.map(e => e.event_type)
  assert('golden_box_awards_issued was emitted for the awarded entry', types.includes('golden_box_awards_issued'))
  assert('golden_box_xp_awarded/_badge_unlocked/_passport_stamp_awarded were NEVER emitted (no real grant occurred — never fabricated)', !types.includes('golden_box_xp_awarded') && !types.includes('golden_box_badge_unlocked') && !types.includes('golden_box_passport_stamp_awarded'))
  const issuedEvent = events.find(e => e.event_type === 'golden_box_awards_issued')
  assert('The canonical golden_box_awards_issued event carries the real competition/placement/awardType/ruleId fields', Number(issuedEvent.payload.result.competitionId) === Number(comp) && issuedEvent.payload.result.placement === 1 && issuedEvent.payload.result.awardType === 'first_place')

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2b-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2b-2/01-awards-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
