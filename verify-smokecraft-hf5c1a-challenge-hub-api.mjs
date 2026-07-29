#!/usr/bin/env node
/**
 * Holistic Fix 5C-1A — Challenge Hub scoring-authority API tests
 * against the real running server, zero mocking. Covers both active
 * challenge types: the Daily/Weekly progress challenges
 * (challengeHubService.js) and Blend Fault Identification
 * (blendFaultService.js) — one shared canonical event vocabulary,
 * database-enforced idempotency, server-only scoring.
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), cookies: () => cookies }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
function guestIdFromClient(c) {
  const cookie = c.cookies().smokecraft_guest_session
  const payload = JSON.parse(Buffer.from(cookie.split('.')[1], 'base64').toString())
  return payload.sub
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).trim()

  console.log('\n── 1. Honest empty/loading state — fresh guest, zero real activity ──')
  const c1 = makeClient()
  const hub1 = await c1.get('/api/smokecraft/challenge-hub/')
  assert('Hub loads for a genuinely fresh guest (no manual identity round-trip)', hub1.status === 200)
  assert('Both real seeded challenges are returned, each with a real rule version', hub1.body.challenges.length === 2 && hub1.body.challenges.every(c => typeof c.ruleVersion === 'number' && c.ruleVersion >= 1))
  assert('A fresh guest with zero activity honestly shows unmet progress, never fabricated completion', hub1.body.challenges.every(c => c.participationState !== 'completed'))

  console.log('\n── 2. Start + real evidence + server-computed completion (Daily Practice) ──')
  const startRes = await c1.post('/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start')
  assert('Start succeeds', startRes.status === 200 && startRes.body.challenge.participationState === 'in_progress')
  const guest1 = guestIdFromClient(c1)
  // Clear only non-challenge bookkeeping events for this fresh test
  // guest — must NOT delete the canonical challenge_started event the
  // start call above just wrote, or section 3 below would wrongly see
  // it as missing.
  psql(`DELETE FROM smokecraft_progression_events WHERE guest_reference = '${guest1}' AND event_type NOT LIKE 'challenge_%'`)
  psql(`INSERT INTO smokecraft_progression_events (guest_reference, source_screen, source_route, event_type, payload, idempotency_key) VALUES ('${guest1}', 'test', '/test', 'lesson_completed', '{}'::jsonb, 'hf5c1a-evt-${Date.now()}')`)
  const afterEvidence = await c1.get('/api/smokecraft/challenge-hub/')
  const daily = afterEvidence.body.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  assert('Real evidence (a progression event) server-side completes the challenge — never client-decided', daily.participationState === 'completed')

  console.log('\n── 3. Canonical challenge events with full required fields ──')
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type, 'payload', payload)) FROM smokecraft_progression_events WHERE guest_reference = '${guest1}' AND event_type IN ('challenge_started','challenge_submitted','challenge_scored','challenge_completed') AND payload->>'challengeId' = 'daily-lesson-practice'`)
  const canonicalEvents = JSON.parse(eventsJson) || []
  const types = canonicalEvents.map(e => e.event_type)
  assert('All four canonical event types were emitted (challenge_started/_submitted/_scored/_completed)', ['challenge_started', 'challenge_submitted', 'challenge_scored', 'challenge_completed'].every(t => types.includes(t)))
  const scoredEvent = canonicalEvents.find(e => e.event_type === 'challenge_scored')
  assert('The canonical challenge_scored event carries a real ruleId/ruleVersion/scoreResult (never null)', scoredEvent.payload.ruleId && scoredEvent.payload.ruleVersion && scoredEvent.payload.scoreResult)
  const completedEvent = canonicalEvents.find(e => e.event_type === 'challenge_completed')
  assert('The canonical challenge_completed event carries a real rewardResult with an explicit granted flag', completedEvent.payload.rewardResult && typeof completedEvent.payload.rewardResult.granted === 'boolean')

  console.log('\n── 4. Repeated submission / rapid re-fetch does not duplicate events or state ──')
  const beforeCount = parseInt(psql(`SELECT count(*) FROM smokecraft_progression_events WHERE guest_reference = '${guest1}' AND event_type LIKE 'challenge_%'`), 10)
  await c1.get('/api/smokecraft/challenge-hub/')
  await c1.get('/api/smokecraft/challenge-hub/')
  const afterCount = parseInt(psql(`SELECT count(*) FROM smokecraft_progression_events WHERE guest_reference = '${guest1}' AND event_type LIKE 'challenge_%'`), 10)
  assert('Re-fetching an already-completed challenge does not re-fire completion/scoring events', beforeCount === afterCount)

  console.log('\n── 5. Two-tab race / rapid double-click — reward granted at most once ──')
  psql(`UPDATE smokecraft_challenge_definitions SET xp_reward = 25 WHERE challenge_key = 'weekly-multi-activity-builder'`)
  const c2 = makeClient()
  await c2.post('/api/smokecraft/challenge-hub/challenges/weekly-multi-activity-builder/start')
  const guest2 = guestIdFromClient(c2)
  psql(`DELETE FROM smokecraft_progression_events WHERE guest_reference = '${guest2}' AND event_type NOT LIKE 'challenge_%'`)
  for (const t of ['lesson_completed_a', 'lesson_completed_b', 'lesson_completed_c']) {
    psql(`INSERT INTO smokecraft_progression_events (guest_reference, source_screen, source_route, event_type, payload, idempotency_key) VALUES ('${guest2}', 'test', '/test', '${t}', '{}'::jsonb, 'hf5c1a-race-${t}-${Date.now()}')`)
  }
  const raceResults = await Promise.all([
    c2.get('/api/smokecraft/challenge-hub/'),
    c2.get('/api/smokecraft/challenge-hub/'),
    c2.get('/api/smokecraft/challenge-hub/'),
  ])
  assert('All concurrent requests during the race succeed', raceResults.every(r => r.status === 200))
  const rewardRowCount = parseInt(psql(`SELECT count(*) FROM smokecraft_challenge_rewards WHERE guest_reference = '${guest2}'`), 10)
  assert('A real database-enforced UNIQUE constraint ensures the XP reward is granted at most once despite the concurrent race', rewardRowCount === 1)
  const xpTotal = psql(`SELECT xp_total FROM smokecraft_player_state WHERE guest_reference = '${guest2}'`)
  assert('The awarded XP total reflects exactly one grant, not one per racing request', Number(xpTotal) === 25)
  psql(`UPDATE smokecraft_challenge_definitions SET xp_reward = 0 WHERE challenge_key = 'weekly-multi-activity-builder'`)

  console.log('\n── 6. Blend Fault Identification — valid submission, passing score ──')
  const c3 = makeClient()
  const assessment = await c3.get('/api/smokecraft/blend-fault/')
  assert('Assessment loads with real questions', assessment.status === 200 && assessment.body.questions.length === 3)
  const started = await c3.post('/api/smokecraft/blend-fault/attempts')
  assert('Starting an attempt succeeds', started.status === 200)
  const attemptId = started.body.attempt.attemptId
  const correctAnswers = [
    { questionKey: 'step-1-identify-the-issue', answer: 'Wrapper Damage' },
    { questionKey: 'step-2-choose-the-best-solution', answer: 'Re-moisten and rest the leaf' },
    { questionKey: 'step-3-prevent-and-improve', answer: 'Re-moisten and rest the leaf' },
  ]
  const passSubmit = await c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId}/submit`, { answers: correctAnswers })
  assert('A fully correct submission is server-scored as passed (never client-decided)', passSubmit.status === 200 && passSubmit.body.attempt.passFail === 'passed')
  assert('The server-computed score reflects the real answer key (3/3)', passSubmit.body.attempt.scoreEarned === 3 && passSubmit.body.attempt.scorePossible === 3)

  console.log('\n── 7. Invalid / incomplete evidence rejected ──')
  const started2 = await c3.post('/api/smokecraft/blend-fault/attempts')
  const attemptId2 = started2.body.attempt.attemptId
  const incomplete = await c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId2}/submit`, { answers: [correctAnswers[0]] })
  assert('An incomplete submission (missing questions) is rejected, never partially scored', incomplete.status === 400)
  const invalidKey = await c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId2}/submit`, { answers: [{ questionKey: 'not-a-real-question', answer: 'x' }, ...correctAnswers.slice(1)] })
  assert('An unknown question key in the submission is rejected', invalidKey.status === 400)

  console.log('\n── 8. Failing score, repeated submission (already-scored attempt is immutable) ──')
  const failAnswers = correctAnswers.map(a => ({ questionKey: a.questionKey, answer: 'Cap Problem' }))
  const failSubmit = await c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId2}/submit`, { answers: failAnswers })
  assert('An incorrect submission is server-scored as failed', failSubmit.status === 200 && failSubmit.body.attempt.passFail === 'failed')
  const resubmit = await c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId2}/submit`, { answers: correctAnswers })
  assert('Resubmitting an already-scored attempt is rejected/preserved, never rescored to a different result', resubmit.body.alreadyScored === true && resubmit.body.attempt.passFail === 'failed')

  console.log('\n── 9. Rapid double-click on submit (idempotent scoring) ──')
  const started3 = await c3.post('/api/smokecraft/blend-fault/attempts')
  const attemptId3 = started3.body.attempt.attemptId
  const [d1, d2] = await Promise.all([
    c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId3}/submit`, { answers: correctAnswers }),
    c3.post(`/api/smokecraft/blend-fault/attempts/${attemptId3}/submit`, { answers: correctAnswers }),
  ])
  assert('A rapid double-click submit is safely idempotent (one real scoring outcome, not a crash or double-score)', d1.status === 200 && d2.status === 200 && d1.body.attempt.scoreEarned === d2.body.attempt.scoreEarned)

  console.log('\n── 10. Cross-user denial ──')
  const c4 = makeClient()
  await c4.get('/api/smokecraft/challenge-hub/')
  const foreignAttempt = await c4.get(`/api/smokecraft/blend-fault/attempts/${attemptId}`)
  assert('A different guest cannot read another guest\'s Blend Fault attempt', foreignAttempt.status === 403 || foreignAttempt.status === 404)

  console.log('\n── 11. Cross-device result (same identity, two independent fetches) ──')
  const refetch1 = await c1.get('/api/smokecraft/challenge-hub/')
  const refetch2 = await c1.get('/api/smokecraft/challenge-hub/')
  const d1s = refetch1.body.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  const d2s = refetch2.body.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  assert('Two independent fetches under the same identity return identical challenge state (no per-device drift)', d1s.participationState === d2s.participationState && d1s.progress === d2s.progress)

  console.log('\n── 12. Account conversion — Challenge Hub state + Blend Fault attempts transfer ──')
  const c5 = makeClient()
  await c5.post('/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start')
  const guest5 = guestIdFromClient(c5)
  psql(`INSERT INTO smokecraft_progression_events (guest_reference, source_screen, source_route, event_type, payload, idempotency_key) VALUES ('${guest5}', 'test', '/test', 'lesson_completed', '{}'::jsonb, 'hf5c1a-conv-evt-${Date.now()}')`)
  await c5.get('/api/smokecraft/challenge-hub/')
  await c5.get('/api/smokecraft/blend-fault/')
  const bfStart = await c5.post('/api/smokecraft/blend-fault/attempts')
  await c5.post(`/api/smokecraft/blend-fault/attempts/${bfStart.body.attempt.attemptId}/submit`, { answers: correctAnswers })

  const email = `hf5c1a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const createAccount = await c5.post('/api/smokecraft/account/create', { email, displayName: 'HF5C1A Test' })
  assert('A real account is created on the same cookie jar as the guest', createAccount.status === 201)
  const convert = await c5.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: `hf5c1a-convert-${Date.now()}` })
  assert('Guest-to-account conversion succeeds', convert.status === 201)
  assert('Conversion reports real Challenge Hub learner state transferred (previously never transferred — a real found gap)', convert.body.challengeStateTransferred >= 1)
  assert('Conversion reports a real Blend Fault attempt transferred (previously never transferred — a real found gap)', convert.body.blendFaultAttemptsTransferred >= 1)

  const afterConvertHub = await c5.get('/api/smokecraft/challenge-hub/')
  const afterConvertDaily = afterConvertHub.body.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  assert('After conversion, the SAME account identity still sees the completed challenge', afterConvertDaily.participationState === 'completed')
  const afterConvertHistory = await c5.get('/api/smokecraft/blend-fault/history')
  assert('After conversion, the SAME account identity still sees the transferred Blend Fault attempt history', afterConvertHistory.body.attempts.length >= 1)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-1a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-1a/01-challenge-hub-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
