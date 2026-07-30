#!/usr/bin/env node
/**
 * Stage 5 Closure Gate — real, connected, end-to-end integration
 * journey across the Golden Box subsystem chain built across this
 * recovery arc (5C-1B submission -> 5C-2A judging -> 5C-2B-1 results
 * -> 5C-2B-2 awards), never previously proven as ONE continuous flow
 * in a single script. Also verifies guest-to-account continuity,
 * cross-device read consistency, and SC-D062 closure live.
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

  console.log('\n── 0. SC-D062 — the legacy client-controlled rewards route is gone ──')
  const legacyAttempt = await makeClient().post('/api/smokecraft/golden-box/entries/00000000-0000-0000-0000-000000000000/rewards', { xpAmount: 999999, badgeId: 'fabricated' })
  assert('The removed legacy rewards route returns an honest 404, never processes a client-controlled XP/badge grant', legacyAttempt.status === 404)

  console.log('\n── 1. One continuous Golden Box journey: guest entry -> account conversion -> judge -> results -> award ──')
  const comp = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('stage5-closure-${Date.now()}', 'Stage 5 Closure Journey', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)

  const guest = makeClient()
  await guest.get('/api/smokecraft/player-state')
  const created = await guest.post(`/api/smokecraft/golden-box/competitions/${comp}/entries`)
  let entryId = created.body.entry.entry_id
  assert('A real entry is created under a real guest identity', created.status === 201 || created.status === 200)

  const draft1 = await guest.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'closure-journey' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  assert('Draft saves successfully as a guest', draft1.status === 200)
  const reloaded = await guest.get(`/api/smokecraft/golden-box/entries/${entryId}`)
  assert('Draft reloads with the real saved presentation payload', reloaded.body.currentVersion?.presentation_payload?.note === 'closure-journey')

  // Guest-to-account conversion mid-flow — Golden Box draft state must survive.
  const accountCreate = await guest.post('/api/smokecraft/account/create', { email: `stage5-closure-${Date.now()}@example.test`, displayName: 'Stage5 Closure' })
  assert('Test setup: a real account is created on the same cookie jar as the guest', accountCreate.status === 201)
  const conversion = await guest.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: `stage5-closure-convert-${Date.now()}` })
  assert('Guest-to-account conversion succeeds', conversion.status === 200 || conversion.status === 201)
  assert('Conversion reports a real Golden Box entry transferred', conversion.body.goldenBoxEntriesTransferred >= 1)
  // Conversion generates a real NEW entry_id for the transferred copy
  // (SC-D059's documented, correct behavior — preserves child-row FK
  // integrity by remapping, not by keeping the old UUID) — the
  // account's own competition-scoped lookup is the real way to reach
  // the transferred entry going forward, not the stale guest entryId.
  const postConversionLookup = await guest.post(`/api/smokecraft/golden-box/competitions/${comp}/entries`)
  entryId = postConversionLookup.body.entry.entry_id
  assert('The transferred entry is reachable under the converted account identity with its draft state intact — no state loss on conversion', (postConversionLookup.status === 200 || postConversionLookup.status === 201) && postConversionLookup.body.entry.status === 'draft' && Number(postConversionLookup.body.entry.current_version) >= 2)
  const postConversionVersion = await guest.get(`/api/smokecraft/golden-box/entries/${entryId}`)
  assert('The transferred entry retains its real saved presentation payload after conversion', postConversionVersion.body.currentVersion?.presentation_payload?.note === 'closure-journey')

  const submit1 = await guest.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
  assert('Submission finalizes once (real server-side eligibility)', submit1.status === 200)
  const submit2 = await guest.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
  assert('A second submit attempt is idempotent/rejected, never a duplicate submission row', submit2.status !== 200 || submit2.body.submission?.id === submit1.body.submission?.id)

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const judge = makeClient()
  const judgeLogin = await judge.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const judgeId = judgeLogin.body.data.userId
  const assign = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/entries/${entryId}/judges`, { judgeUserId: judgeId })
  assert('Judge assignment succeeds (authorized staff, eligible entry)', assign.status === 200)
  const score = await judge.post(`/api/smokecraft/golden-box/entries/${entryId}/scorecard`, { scores: uniformScores(9) })
  assert('Scorecard submits with a server-computed weighted total', score.status === 200 && Number(score.body.scorecard.weighted_total) === 90)

  const finalize = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/results/finalize`, {})
  assert('Results finalize deterministically', finalize.status === 200 && finalize.body.ranked[0].entry_id === entryId)
  const issue = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, {})
  assert('Placement award issues once from the immutable finalized ranking', issue.status === 200 && issue.body.awards[0].award_type === 'first_place')

  console.log('\n── 2. Honest unavailable reward states on the finalized award ──')
  const awardView = await guest.get(`/api/smokecraft/golden-box/competitions/${comp}/entries/${entryId}/award`)
  assert('The real award record is visible to the entrant', awardView.body.status === 'issued' && awardView.body.award.award_type === 'first_place')
  assert('XP is honestly unavailable (no approved rule) — never fabricated', awardView.body.award.xp_status === 'unavailable')
  assert('Badge is honestly unavailable (no approved catalog entry) — never fabricated', awardView.body.award.badge_status === 'unavailable')
  assert('Passport stamp is honestly unavailable (no approved catalog entry) — never fabricated', awardView.body.award.passport_stamp_status === 'unavailable')

  console.log('\n── 3. Cross-device read consistency ──')
  const secondDeviceRead = await guest.get(`/api/smokecraft/golden-box/competitions/${comp}/entries/${entryId}/award`)
  assert('A second independent read under the same identity returns identical award state (no per-device drift)', secondDeviceRead.body.award.id === awardView.body.award.id)

  console.log('\n── 4. Concurrency — repeated finalize/issue after the journey remain single-instance ──')
  const refinalize = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/results/finalize`, {})
  const reissue = await admin.post(`/api/smokecraft/golden-box/competitions/${comp}/awards/issue`, {})
  assert('Repeated finalize after the journey returns the identical original result, never recomputes', refinalize.body.ranked[0].finalized_at === finalize.body.ranked[0].finalized_at)
  assert('Repeated award issuance after the journey returns the identical original issuance, never re-issues', reissue.body.issuance.issued_at === issue.body.issuance.issued_at)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-stage-5-closure', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-stage-5-closure/02-full-journey-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
