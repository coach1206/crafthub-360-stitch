#!/usr/bin/env node
// Focused regression: Golden Box entry creation must be genuinely
// server-enforced against real session-27 completion — not merely
// gated by the UI. Confirmed live before this fix (a completely fresh,
// zero-session guest received a real HTTP 201 on the entry-creation
// endpoint) that entryService.createEntry() never consulted
// eligibilityService.evaluateEligibility() at all. Fixed by wiring that
// check into createEntry() itself and adding a new
// 'required_completion_keys' rule type that reads the real 27-session
// completion ledger (smokecraft_session_completions), independent of
// the optional venue Management Sync journey table most guests never
// populate.
import http from 'http'
import { execSync } from 'child_process'

const HOST = 'localhost', PORT = 3001
function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function makeClient() {
  let cookies = {}
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body !== undefined ? JSON.stringify(body) : null
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b ?? {}) }
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).trim()

  // Real competition WITH a real eligibility rule requiring Session 27
  // ('session-complete') — the exact scenario the mandate asks to prove.
  const competitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('gating-regress-${Date.now()}', 'Golden Box Gating Regression', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`).split('\n')[0].trim()
  assert('A real competition with an eligibility rule exists to test against', /^[0-9]+$/.test(competitionId), `competitionId="${competitionId}"`)
  psql(`INSERT INTO golden_box_eligibility_rules (competition_id, rule_type, rule_config) VALUES (${competitionId}, 'required_completion_keys', '{"completionKeys":["session-complete"]}')`)

  console.log('\n── 1. Fresh/incomplete player cannot enter Golden Box early ──\n')

  // 1a. Completely fresh guest, 0 sessions completed.
  const fresh = makeClient()
  await fresh.get('/api/smokecraft/player-state')
  const freshElig = await fresh.post(`/api/smokecraft/golden-box/competitions/${competitionId}/eligibility`)
  assert('Fresh guest (0 sessions) evaluates as ineligible', freshElig.status === 200 && freshElig.body?.eligible === false, JSON.stringify(freshElig.body))
  const freshCreate = await fresh.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('Fresh guest (0 sessions) is REJECTED by the real create-entry endpoint — no direct-route bypass', freshCreate.status === 403 && freshCreate.body?.success === false, `status=${freshCreate.status} body=${JSON.stringify(freshCreate.body)}`)

  // 1b. Partially-completed guest (a handful of real sessions, not all 27).
  const partial = makeClient()
  await partial.get('/api/smokecraft/player-state')
  for (const id of ['entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format']) {
    await partial.post(`/api/smokecraft/player-state/sessions/${id}/complete`, { idempotencyKey: `gating-partial-${id}-${rid()}` })
  }
  const partialCreate = await partial.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('Partially-completed guest (5 of 27 sessions) is REJECTED — cannot unlock Golden Box early', partialCreate.status === 403, `status=${partialCreate.status} body=${JSON.stringify(partialCreate.body)}`)

  console.log('\n── 2. Eligible player (Session 27 complete) can enter naturally ──\n')

  const eligible = makeClient()
  await eligible.get('/api/smokecraft/player-state')
  const ALL_IDS = ['entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial',
    'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third',
    'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review', 'rewards', 'achievements', 'session-complete']
  for (const id of ALL_IDS) {
    await eligible.post(`/api/smokecraft/player-state/sessions/${id}/complete`, { idempotencyKey: `gating-eligible-${id}-${rid()}` })
  }
  const eligElig = await eligible.post(`/api/smokecraft/golden-box/competitions/${competitionId}/eligibility`)
  assert('Guest who completed all 27 sessions evaluates as eligible', eligElig.status === 200 && eligElig.body?.eligible === true, JSON.stringify(eligElig.body))
  const eligCreate = await eligible.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('Guest who completed Session 27 CAN create a real Golden Box entry', eligCreate.status === 201, `status=${eligCreate.status} body=${JSON.stringify(eligCreate.body)}`)
  const entryId = eligCreate.body?.entry?.entry_id || eligCreate.body?.entry?.id
  assert('A real entry id was returned', !!entryId)

  console.log('\n── 3. No duplicate entry / no duplicate award on repeat calls ──\n')
  const dupCreate = await eligible.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  assert('A second create-entry call for the same guest returns the SAME entry, not a duplicate', dupCreate.status === 200 || dupCreate.status === 201, JSON.stringify(dupCreate.body))
  const dupEntryId = dupCreate.body?.entry?.entry_id || dupCreate.body?.entry?.id
  assert('Repeat entry id matches the original (idempotent, no duplicate row)', dupEntryId === entryId, `original=${entryId} repeat=${dupEntryId}`)

  console.log('\n── 4. Existing zero-rule competitions (e.g. the fresh-player suite fixture) remain eligible-by-design — no regression ──\n')
  const noRulesCompetitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('gating-regress-norules-${Date.now()}', 'No Rules Competition', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`).split('\n')[0].trim()
  const noRulesGuest = makeClient()
  await noRulesGuest.get('/api/smokecraft/player-state')
  const noRulesCreate = await noRulesGuest.post(`/api/smokecraft/golden-box/competitions/${noRulesCompetitionId}/entries`)
  assert('A competition with zero configured eligibility rules remains open-entry (unchanged, documented behavior)', noRulesCreate.status === 201, `status=${noRulesCreate.status} body=${JSON.stringify(noRulesCreate.body)}`)

  console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
