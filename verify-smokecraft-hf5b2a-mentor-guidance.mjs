#!/usr/bin/env node
/**
 * Holistic Fix 5B-2A — mentor guidance service automated proof.
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
  console.log('\n── 1. Missing/invalid mentor ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const missing = await c1.post('/api/smokecraft/mentor-guidance/guidance', {})
  assert('A request with no mentorId is rejected (400), never silently returns guidance', missing.status === 400 && missing.body.error === 'mentor_not_selected')
  const invalid = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'not-a-real-mentor' })
  assert('A request with an unrecognized mentorId is rejected, never fabricates a mentor identity', invalid.status === 400 && invalid.body.error === 'mentor_not_selected')

  console.log('\n── 2. Fallback state (no real activity yet) ──')
  const first = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba', screenContext: 'test' })
  assert('A valid mentor with real (if minimal) signal returns guidance', first.status === 200 && first.body.success)
  assert('Every guidance response has a non-empty message', typeof first.body.guidance.message === 'string' && first.body.guidance.message.length > 0)
  assert('Every guidance response has a reason', typeof first.body.guidance.reason === 'string' && first.body.guidance.reason.length > 0)
  assert('Every guidance response has a nextAction', typeof first.body.guidance.nextAction === 'string' && first.body.guidance.nextAction.length > 0)
  assert('Every guidance response has a sourceContext', typeof first.body.guidance.sourceContext === 'string')
  assert('Every guidance response has a confidence value', typeof first.body.guidance.confidence === 'number')
  assert('Every guidance response has a messageVersion', typeof first.body.guidance.messageVersion === 'number')
  assert('The real mentor identity (name/country/flag) comes from the server roster, never client-submitted', first.body.guidance.mentorName === 'Maestro Rafael' && first.body.guidance.mentorCountry === 'Cuba')

  console.log('\n── 3. Progress-aware guidance changes when session/progress changes ──')
  // Completing the real Foundation evidence (Seed & Soil) moves the
  // real Skill Tree gap forward, which the guidance service's
  // skill_gap branch reads live — a genuine progress-driven change,
  // unlike an unrelated named-XP award which correctly has no effect
  // on which skill-tree node is highlighted.
  await c1.post('/api/smokecraft/seed-soil/progress', { componentId: 20 })
  const afterProgress = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  assert('Guidance changes after real Skill Tree progress advances (not static regardless of progress)', afterProgress.body.guidance.message !== first.body.guidance.message)

  console.log('\n── 4. Pairing-aware guidance ──')
  await c1.post('/api/smokecraft/pairing-engine/save', { idempotencyKey: `hf5b2a-pairing-${Date.now()}`, cigarShape: 'Robusto', wrapper: 'Habano', origin: 'Nicaragua', strength: 'Full', pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'] })
  const afterPairing = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  assert('Guidance references the real saved pairing once one exists (highest-priority real signal)', afterPairing.body.guidance.sourceContext === 'pairing_result')
  assert('The pairing-aware message includes the real pairing type and score', afterPairing.body.guidance.message.includes('Whiskey') && /\d+\/100/.test(afterPairing.body.guidance.message))

  console.log('\n── 5. Mentor-change result ──')
  const otherMentor = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'brazil' })
  assert('Guidance is genuinely per-mentor (different mentor identity in the response)', otherMentor.body.guidance.mentorId === 'brazil' && otherMentor.body.guidance.mentorName === 'Dr. Paulo Oliveira')
  assert('Changing mentor does not change the underlying real signal used (same pairing_result, same guest)', otherMentor.body.guidance.sourceContext === 'pairing_result')

  console.log('\n── 6. Deterministic repeated result (same input, same real state) ──')
  const repeat1 = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  const repeat2 = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  assert('Identical mentor + unchanged real state produces an identical guidance message', repeat1.body.guidance.message === repeat2.body.guidance.message)

  console.log('\n── 7. Never awards XP/badges/stamps, never changes scores ──')
  const stateBefore = await c1.get('/api/smokecraft/player-state')
  await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  const stateAfter = await c1.get('/api/smokecraft/player-state')
  assert('Requesting guidance does not change xpTotal', stateBefore.body.state.xpTotal === stateAfter.body.state.xpTotal)
  assert('Requesting guidance does not change awards count', stateBefore.body.state.awards.length === stateAfter.body.state.awards.length)

  console.log('\n── 8. Cross-user isolation ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const c2Guidance = await c2.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'cuba' })
  assert('A completely separate guest never sees another guest\'s real pairing/quiz signal', c2Guidance.body.guidance.sourceContext !== 'pairing_result')

  console.log('\n── 9. Live-screen route smoke (fresh identity, no prior navigation) ──')
  const c3 = makeClient()
  const fresh = await c3.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'dominican' })
  assert('A genuinely first-ever request from a fresh browser does not 401 (guest identity auto-issued)', fresh.status === 200)
  assert('A fresh guest with zero activity gets an honest fallback/low-signal state (never fabricated pairing/quiz data)', ['mentor_bio', 'skill_gap', 'progress_summary'].includes(fresh.body.guidance.sourceContext))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2a/01-mentor-guidance-flow-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
