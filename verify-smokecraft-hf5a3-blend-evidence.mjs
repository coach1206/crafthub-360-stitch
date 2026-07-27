#!/usr/bin/env node
/**
 * Holistic Fix 5A-3 — automated proof for the master-blend Passport
 * stamp's closed eligibility gap: the server verifies a complete,
 * well-formed wrapper/binder/filler selection before granting anything.
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

async function main() {
  console.log('\n── Master-blend Passport stamp — server-verified evidence ──')

  const c1 = makeClient()
  await c1.get('/smokecraft/welcome')
  const valid = await c1.post('/api/smokecraft/player-state/blend/submit', {
    idempotencyKey: 'hf5a3-blend-c1-0001', wrapperIndex: 0, binderIndex: 1, fillerIndices: [0, 1, 2],
  })
  assert('A complete, well-formed blend selection grants the master-blend stamp', valid.status === 201 && valid.body.passportStampGranted?.award_key === 'master-blend')
  assert('Grants the server-owned XP amount (150)', valid.body.xpAwarded === 150)

  const c2 = makeClient()
  await c2.get('/smokecraft/welcome')
  const incomplete = await c2.post('/api/smokecraft/player-state/blend/submit', {
    idempotencyKey: 'hf5a3-blend-c2-0001', wrapperIndex: 0, binderIndex: 1, fillerIndices: [0, 1],
  })
  assert('An incomplete filler set (2 instead of 3) is rejected 400, no stamp granted', incomplete.status === 400 && incomplete.body.error === 'incomplete_blend_selection')

  const c3 = makeClient()
  await c3.get('/smokecraft/welcome')
  const invalidWrapper = await c3.post('/api/smokecraft/player-state/blend/submit', {
    idempotencyKey: 'hf5a3-blend-c3-0001', wrapperIndex: 99, binderIndex: 1, fillerIndices: [0, 1, 2],
  })
  assert('An out-of-range wrapper index is rejected, never silently accepted', invalidWrapper.status === 400)

  const c4 = makeClient()
  await c4.get('/smokecraft/welcome')
  const dup = await c4.post('/api/smokecraft/player-state/blend/submit', { idempotencyKey: 'hf5a3-blend-c4-0001', wrapperIndex: 0, binderIndex: 0, fillerIndices: [0, 1, 2] })
  const dup2 = await c4.post('/api/smokecraft/player-state/blend/submit', { idempotencyKey: 'hf5a3-blend-c4-0002', wrapperIndex: 1, binderIndex: 1, fillerIndices: [0, 1, 2] })
  assert('The blend stamp cannot be granted twice to the same guest, even with a different selection under a different idempotency key', dup2.body.alreadyScored === true && dup2.body.xpAwarded === 0)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-3', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-3/01-blend-evidence-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
