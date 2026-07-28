#!/usr/bin/env node
/**
 * Holistic Fix 5A-3E — server-authoritative cultivator evidence/Passport
 * stamp automated proof.
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b) }
}

const ALL_STAGES = ['seed', 'soil', 'climate', 'harvest', 'curing', 'fermentation', 'aging']

async function main() {
  console.log('\n── 1. Incomplete evidence rejected ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const partial = await c1.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c1-0001', viewedStageIds: ['seed', 'soil', 'climate'] })
  assert('Only 3 of 7 viewed stages is rejected 400, never trusted as complete', partial.status === 400 && partial.body.error === 'incomplete_cultivation_stages')

  const empty = await c1.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c1-0002', viewedStageIds: [] })
  assert('Zero viewed stages is rejected 400', empty.status === 400)

  console.log('\n── 2. Invalid evidence rejected ──')
  const malformed = await c1.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c1-0003', viewedStageIds: 'not-an-array' })
  assert('A malformed (non-array) evidence payload is rejected 400', malformed.status === 400 && malformed.body.error === 'viewed_stage_ids_required')

  const fabricated = await c1.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c1-0004', viewedStageIds: ['seed', 'soil', 'climate', 'harvest', 'curing', 'fermentation', 'fabricated-stage'] })
  assert('A fabricated stage id substituted for a real one is rejected (still missing a real required stage)', fabricated.status === 400)

  console.log('\n── 3. Valid evidence accepted, XP + Passport stamp awarded once ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const valid = await c2.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c2-0001', viewedStageIds: ALL_STAGES })
  assert('A complete, real evidence set (all 7 stages) is accepted', valid.status === 201)
  assert('Grants the server-owned XP amount', valid.body.xpAwarded > 0)
  assert('Grants the cultivator Passport stamp', valid.body.passportStampGranted?.award_key === 'cultivator')

  console.log('\n── 4. Repeated submission ──')
  const dup = await c2.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c2-0002', viewedStageIds: ALL_STAGES })
  assert('A second submission (even with a different idempotency key) is honestly rejected as already-scored, no double grant', dup.status === 200 && dup.body.alreadyScored === true && dup.body.xpAwarded === 0)

  console.log('\n── 5. Rapid double-click / two-tab race ──')
  const c3 = makeClient()
  await c3.get('/api/smokecraft/player-state')
  const [race1, race2] = await Promise.all([
    c3.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c3-0001', viewedStageIds: ALL_STAGES }),
    c3.post('/api/smokecraft/player-state/cultivator/submit', { idempotencyKey: 'hf5a3e-c3-0002', viewedStageIds: ALL_STAGES }),
  ])
  assert('Both concurrent submissions return well-formed success (no 500)', [race1.status, race2.status].every(s => s === 200 || s === 201))
  const totalXp = (race1.body.xpAwarded || 0) + (race2.body.xpAwarded || 0)
  assert('A two-tab race grants the cultivator XP+stamp exactly once, not twice', totalXp > 0 && totalXp === Math.max(race1.body.xpAwarded || 0, race2.body.xpAwarded || 0))

  console.log('\n── 6. Cross-user isolation ──')
  const c4 = makeClient()
  await c4.get('/api/smokecraft/player-state')
  const otherState = await c4.get('/api/smokecraft/player-state')
  assert('A completely separate guest never sees another guest\'s cultivator award (honest zero XP)', otherState.body.state.xpTotal === 0)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-3e', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-3e/01-cultivator-flow-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
