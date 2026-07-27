#!/usr/bin/env node
/**
 * Holistic Fix 5A-2 — automated proof for the new server-authoritative
 * quiz scoring, leaf-challenge scoring, named-XP, badge-mirror, and
 * correction endpoints. Uses the same cookie-jar-by-name makeClient()
 * pattern established in the HF4/HF4B/HF5A test suites.
 */
import http from 'http'

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
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) {
          for (const c of setCookie) {
            const [pair] = c.split(';')
            const [k, v] = pair.split('=')
            cookies[k] = v
          }
        }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => {
          let parsed = null
          try { parsed = JSON.parse(chunks) } catch {}
          resolve({ status: res.statusCode, body: parsed })
        })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
  }
}

async function main() {
  console.log('\n── 1. Server-verified quiz scoring (never trusts client correctness) ──')
  const c1 = makeClient()
  await c1.get('/smokecraft/welcome')
  await c1.get('/api/smokecraft/player-state')

  const wrongAnswer = await c1.post('/api/smokecraft/player-state/knowledge-check/terroir/submit', {
    idempotencyKey: 'hf5a2-quiz-wrong-0001', responses: { 'terroir-q1': 'humidor-brand' }, completionStepId: 'seed-soil',
  })
  assert('Wrong answer submission (201) returns a server-computed score, not a client-trusted one', wrongAnswer.status === 201 && wrongAnswer.body.score === 1)
  assert('Server awards the real, existing session-linked XP amount (seed-soil = 75)', wrongAnswer.body.xpAwarded === 75)

  const replay = await c1.post('/api/smokecraft/player-state/knowledge-check/terroir/submit', {
    idempotencyKey: 'hf5a2-quiz-wrong-0002', responses: { 'terroir-q1': 'humidor-brand' }, completionStepId: 'seed-soil',
  })
  assert('A second attempt at an already-scored quiz module is honestly rejected as already-scored, XP not re-granted', replay.status === 200 && replay.body.alreadyScored === true && replay.body.xpAwarded === 0)

  const stateAfterQuiz = await c1.get('/api/smokecraft/player-state')
  assert('Player state XP total reflects exactly one grant of the quiz XP, not two', stateAfterQuiz.body.state.xpTotal === 75)

  console.log('\n── 2. Server-verified Leaf Challenge (real answer key, never a client score) ──')
  const c2 = makeClient()
  await c2.get('/smokecraft/welcome')
  const perfectAnswers = ['habano-colorado', 'criollo-98', 'connecticut-shade', 'sumatra-maduro', 'corojo-rosado']
  const perfect = await c2.post('/api/smokecraft/player-state/leaf-challenge/submit', {
    idempotencyKey: 'hf5a2-leaf-c2-0001', answers: perfectAnswers,
  })
  assert('A genuinely perfect answer set scores 5/5 server-side', perfect.status === 201 && perfect.body.score === 5 && perfect.body.total === 5)
  assert('Perfect score grants the tiered 125 XP (not a client-fabricated amount)', perfect.body.xpAwarded === 125)
  assert('Perfect score grants both the botanist AND leaf-scholar badges', perfect.body.badgesGranted.some(b => b.award_key === 'botanist') && perfect.body.badgesGranted.some(b => b.award_key === 'leaf-scholar'))
  assert('Perfect score grants the leaf-recognition Passport stamp', perfect.body.passportStampGranted?.award_key === 'leaf-recognition')

  const c3 = makeClient()
  await c3.get('/smokecraft/welcome')
  const wrongAnswers = ['connecticut-shade', 'sumatra-maduro', 'sumatra-maduro', 'habano-colorado', 'criollo-98']
  const zeroScore = await c3.post('/api/smokecraft/player-state/leaf-challenge/submit', {
    idempotencyKey: 'hf5a2-leaf-c3-0001', answers: wrongAnswers,
  })
  assert('An all-wrong answer set is scored 0/5 server-side, never trusting a claimed high score', zeroScore.body.score === 0)
  assert('A 0-score attempt does not grant the leaf-scholar badge', !(zeroScore.body.badgesGranted || []).some(b => b.award_key === 'leaf-scholar'))

  const replayLeaf = await c3.post('/api/smokecraft/player-state/leaf-challenge/submit', {
    idempotencyKey: 'hf5a2-leaf-c3-0002', answers: perfectAnswers,
  })
  assert('Re-submitting Leaf Challenge with a DIFFERENT (better) answer set after a first attempt is rejected — first real attempt is final, not farmable', replayLeaf.body.alreadyScored === true && replayLeaf.body.score === 0)

  console.log('\n── 3. Named one-time XP activities — server decides the amount ──')
  const c4 = makeClient()
  await c4.get('/smokecraft/welcome')
  const namedXp = await c4.post('/api/smokecraft/player-state/awards/xp', {
    idempotencyKey: 'hf5a2-named-xp-0001', awardKey: 'art-observation',
  })
  assert('A real named XP source (art-observation) is granted its server-approved amount (50)', namedXp.status === 201 && namedXp.body.award.amount === 50)

  const fabricated = await c4.post('/api/smokecraft/player-state/awards/xp', {
    idempotencyKey: 'hf5a2-named-xp-0002', awardKey: 'totally-fabricated-source',
  })
  assert('An unknown/fabricated named XP source is rejected with 400, never silently granted', fabricated.status === 400 && fabricated.body.error === 'unknown_xp_source')

  const dupNamedXp = await c4.post('/api/smokecraft/player-state/awards/xp', {
    idempotencyKey: 'hf5a2-named-xp-0003', awardKey: 'art-observation',
  })
  assert('The same named XP source cannot be granted twice to the same guest, even under a different idempotency key', dupNamedXp.body.alreadyAwarded === true)

  console.log('\n── 4. Badge mirror (addBadge direct-award path is now server-idempotent) ──')
  const c5 = makeClient()
  await c5.get('/smokecraft/welcome')
  const badge1 = await c5.post('/api/smokecraft/player-state/awards/badge', {
    idempotencyKey: 'hf5a2-badge-0001', awardKey: 'art-appreciation',
  })
  assert('A direct-award Origins badge (art-appreciation) is granted server-side', badge1.status === 201)
  const badge2 = await c5.post('/api/smokecraft/player-state/awards/badge', {
    idempotencyKey: 'hf5a2-badge-0002', awardKey: 'art-appreciation',
  })
  assert('The same badge cannot be granted twice under a different idempotency key', badge2.body.alreadyAwarded === true)

  console.log('\n── 5. Correction/reversal endpoint — staff-only, never learner-reachable ──')
  const c6 = makeClient()
  await c6.get('/smokecraft/welcome')
  const unauthorizedCorrection = await c6.post('/api/smokecraft/player-state/corrections', {
    idempotencyKey: 'hf5a2-correction-0001', guestReference: 'someone', correctionType: 'xp', targetTable: 'smokecraft_awards', reason: 'test',
  })
  assert('A plain guest identity attempting a correction is rejected (403), never applied', unauthorizedCorrection.status === 403)

  console.log('\n── 6. Two-tab race on quiz submission ──')
  const c7 = makeClient()
  await c7.get('/smokecraft/welcome')
  const [race1, race2] = await Promise.all([
    c7.post('/api/smokecraft/player-state/knowledge-check/terroir/submit', { idempotencyKey: 'hf5a2-race-0001', responses: { 'terroir-q1': 'humidor-brand' }, completionStepId: 'seed-soil' }),
    c7.post('/api/smokecraft/player-state/knowledge-check/terroir/submit', { idempotencyKey: 'hf5a2-race-0002', responses: { 'terroir-q1': 'humidor-brand' }, completionStepId: 'seed-soil' }),
  ])
  assert('Both concurrent requests return well-formed success (no 500)', [race1.status, race2.status].every(s => s === 200 || s === 201))
  const raceState = await c7.get('/api/smokecraft/player-state')
  assert('A two-tab race on the same quiz module grants XP exactly once, not twice', raceState.body.state.xpTotal === 75)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-2/01-reward-authority-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
