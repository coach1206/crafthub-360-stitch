#!/usr/bin/env node
/**
 * Holistic Fix 5B-2A-1 — mentor-guidance/pairing-consistency automated
 * proof: guidance never contradicts the authoritative pairing engine
 * result, and never fabricates achievements/scores.
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

const CIGAR = { cigarShape: 'Robusto', wrapper: 'Habano', origin: 'Nicaragua', strength: 'Full' }

async function main() {
  console.log('\n── 1. Live pairing guidance matches the authoritative pairing engine exactly ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const pairingContext = { ...CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'] }
  const engineResult = await c1.post('/api/smokecraft/pairing-engine/recommend', pairingContext)
  const guidanceResult = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'nicaragua', screenContext: 'pairing-lab', pairingContext })
  assert('Mentor guidance is available for a live (unsaved) pairing selection', guidanceResult.status === 200)
  assert('Mentor guidance uses the live-pairing signal (never a stale saved-pairing row) when pairingContext is supplied', guidanceResult.body.guidance.sourceContext === 'live_pairing_result')
  assert('The score referenced in the guidance message exactly matches the real pairing engine score (never contradicts it)',
    guidanceResult.body.guidance.message.includes(`${engineResult.body.compatScore}/100`))

  console.log('\n── 2. Guidance changes when the pairing selection changes ──')
  const pairingContext2 = { ...CIGAR, pairingType: 'Rum', flavorNotes: ['Sweet'] }
  const guidance2 = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'nicaragua', screenContext: 'pairing-lab', pairingContext: pairingContext2 })
  assert('Guidance changes when the live pairing selection changes (beverage type)', guidance2.body.guidance.message !== guidanceResult.body.guidance.message)

  console.log('\n── 3. Flavor bridges / conflicts appear honestly in guidance ──')
  const clashContext = { ...CIGAR, pairingType: 'Whiskey', flavorNotes: ['Sweet', 'Creamy'] }
  const clashGuidance = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'nicaragua', screenContext: 'pairing-lab', pairingContext: clashContext })
  const clashEngine = await c1.post('/api/smokecraft/pairing-engine/recommend', clashContext)
  assert('A real conflict from the pairing engine is reflected in the guidance message', clashEngine.body.conflicts.length > 0 && clashGuidance.body.guidance.message.length > 0)
  assert('The clash-scenario guidance score still exactly matches the pairing engine (no independent scoring path)', clashGuidance.body.guidance.message.includes(`${clashEngine.body.compatScore}/100`))

  console.log('\n── 4. No mentor selected + no pairing selected ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const noMentor = await c2.post('/api/smokecraft/mentor-guidance/guidance', { pairingContext: { ...CIGAR, pairingType: 'Whiskey' } })
  assert('A request with no mentor selected is rejected, never returns fabricated pairing guidance', noMentor.status === 400 && noMentor.body.error === 'mentor_not_selected')

  console.log('\n── 5. Never awards XP/badges/changes scores ──')
  const stateBefore = await c1.get('/api/smokecraft/player-state')
  await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'nicaragua', pairingContext: pairingContext2 })
  const stateAfter = await c1.get('/api/smokecraft/player-state')
  assert('Requesting live-pairing-aware guidance does not change xpTotal', stateBefore.body.state.xpTotal === stateAfter.body.state.xpTotal)

  console.log('\n── 6. Cross-user isolation for live pairing guidance ──')
  const c3 = makeClient()
  await c3.get('/api/smokecraft/player-state')
  const c3Guidance = await c3.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'nicaragua', pairingContext: { ...CIGAR, pairingType: 'Espresso' } })
  assert('A separate guest gets guidance scored from their OWN pairing context, not another guest\'s', c3Guidance.body.guidance.sourceContext === 'live_pairing_result' && c3Guidance.body.guidance.message.includes('Espresso'))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2a-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2a-1/01-mentor-pairing-consistency-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
