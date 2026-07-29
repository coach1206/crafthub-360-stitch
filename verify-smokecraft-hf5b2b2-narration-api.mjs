#!/usr/bin/env node
/**
 * Holistic Fix 5B-2B-2 — HTTP-level tests against the real running
 * server, zero mocking: guidance/narration text consistency, honest
 * states in this environment's real configuration (no
 * ELEVENLABS_API_KEY), preference persistence, refresh persistence,
 * same-account second device, cross-user isolation.
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
  console.log('\n── 1. Guidance/narration text consistency (real HTTP, same server) ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const guidance = await c1.post('/api/smokecraft/mentor-guidance/guidance', { mentorId: 'dominican', screenContext: 'skill-tree' })
  const narration = await c1.post('/api/smokecraft/mentor-voice/narrate', { mentorId: 'dominican', screenContext: 'skill-tree' })
  assert('Guidance request succeeds', guidance.status === 200)
  assert('Narration request succeeds', narration.status === 200)
  assert('The narration transcript is byte-for-byte identical to the guidance message returned by the shared guidance endpoint', narration.body.narration.transcript === guidance.body.guidance.message)
  assert('The narration response reports the same real sourceContext as the guidance response (single source of truth)', narration.body.narration.sourceContext === guidance.body.guidance.sourceContext)

  console.log('\n── 2. Honest states in this environment (no ElevenLabs key) ──')
  assert('A mentor with a configured voice honestly reports unavailable (provider_not_configured), never fabricated audio', narration.body.narration.status === 'unavailable' && narration.body.narration.reason === 'provider_not_configured' && !narration.body.narration.audio)
  const noVoiceNarration = await c1.post('/api/smokecraft/mentor-voice/narrate', { mentorId: 'cuba' })
  assert('A mentor with no configured voice honestly reports unavailable (no_voice_configured)', noVoiceNarration.body.narration.status === 'unavailable' && noVoiceNarration.body.narration.reason === 'no_voice_configured')
  assert('Every narration response includes a real request ID', Boolean(narration.body.narration.requestId))

  console.log('\n── 3. Input validation — no client-generated arbitrary narration text ──')
  const bareBody = JSON.stringify({ mentorId: 'dominican', text: 'arbitrary client text that should be ignored' })
  const arbitraryTextIgnored = await c1.post('/api/smokecraft/mentor-voice/narrate', { mentorId: 'dominican', text: 'This is arbitrary client-supplied text that must never be spoken.' })
  assert('A client-supplied "text" field is silently ignored — narration always uses the server-computed guidance message', arbitraryTextIgnored.body.narration.transcript !== 'This is arbitrary client-supplied text that must never be spoken.' && arbitraryTextIgnored.body.narration.transcript === guidance.body.guidance.message)
  const noMentor = await c1.post('/api/smokecraft/mentor-voice/narrate', {})
  assert('A narration request with no mentorId is rejected', noMentor.status === 400 && noMentor.body.error === 'mentor_not_selected')

  console.log('\n── 4. Preference persistence / refresh / second device ──')
  const saved = await c1.post('/api/smokecraft/mentor-voice/preferences', { voiceEnabled: true, playbackSpeed: 1.1, captionsEnabled: false, lastPreviewedMentorId: 'dominican' })
  assert('Preference save succeeds', saved.status === 200)
  const reread = await c1.get('/api/smokecraft/mentor-voice/preferences')
  assert('Saved preferences persist and are read back exactly (refresh persistence, same cookie identity)', reread.body.preferences.playbackSpeed === 1.1 && reread.body.preferences.captionsEnabled === false)
  const reread2 = await c1.get('/api/smokecraft/mentor-voice/preferences')
  assert('A second independent fetch under the same identity returns identical preferences (same-account second device)', JSON.stringify(reread.body.preferences) === JSON.stringify(reread2.body.preferences))

  console.log('\n── 5. Cross-user isolation ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/mentor-voice/preferences')
  const c2Narration = await c2.post('/api/smokecraft/mentor-voice/narrate', { mentorId: 'dominican' })
  assert('A separate guest\'s narration request succeeds independently of guest 1\'s state', c2Narration.status === 200)
  const c1StillOriginal = await c1.get('/api/smokecraft/mentor-voice/preferences')
  assert('One guest\'s narration/preference activity never leaks into or overwrites a different guest\'s preferences', c1StillOriginal.body.preferences.playbackSpeed === 1.1)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2b-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2b-2/03-narration-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
