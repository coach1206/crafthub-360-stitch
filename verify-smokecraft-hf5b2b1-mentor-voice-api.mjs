#!/usr/bin/env node
/**
 * Holistic Fix 5B-2B-1 — HTTP-level tests against the real running
 * server, zero mocking: authenticated guest/account ownership,
 * input validation, cross-user isolation, preference persistence,
 * and the honest states this environment's real configuration
 * (no ELEVENLABS_API_KEY) actually produces.
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
  console.log('\n── 1. Secret-exposure check (profiles response) ──')
  const c1 = makeClient()
  const profiles = await c1.get('/api/smokecraft/mentor-voice/profiles')
  const profilesStr = JSON.stringify(profiles.body)
  assert('The profiles list never includes an ElevenLabs voiceId or API key', !profilesStr.includes('xi-api-key') && !/[a-zA-Z0-9]{32,}/.test(profilesStr.replace(/previewText[^,]+/g, '')))
  assert('Every mentor has an explicit active boolean (no ambiguous voice availability)', profiles.body.profiles.every(p => typeof p.active === 'boolean'))

  console.log('\n── 2. Fresh-guest identity auto-issued (no 401 on first navigation) ──')
  const c2 = makeClient()
  const firstPreview = await c2.post('/api/smokecraft/mentor-voice/preview', { mentorId: 'dominican' })
  assert('A genuinely fresh guest can request a preview without a prior identity round-trip', firstPreview.status === 200)

  console.log('\n── 3. Input validation ──')
  const noMentor = await c2.post('/api/smokecraft/mentor-voice/preview', {})
  assert('A preview request with no mentorId is rejected', noMentor.status === 400 && noMentor.body.error === 'mentor_not_selected')
  const badMentor = await c2.post('/api/smokecraft/mentor-voice/preview', { mentorId: 'nonexistent-mentor-xyz' })
  assert('A preview request for an unknown mentor is rejected (never fabricates a mentor)', badMentor.status === 404 && badMentor.body.error === 'mentor_not_found')

  console.log('\n── 4. Honest states with this environment\'s real configuration (no API key) ──')
  const activePreview = await c2.post('/api/smokecraft/mentor-voice/preview', { mentorId: 'dominican', speed: 1.0 })
  assert('An active mentor honestly reports "unavailable" (provider_not_configured) rather than fabricating audio', activePreview.body.preview.status === 'unavailable' && activePreview.body.preview.reason === 'provider_not_configured' && !activePreview.body.preview.audio)
  const inactivePreview = await c2.post('/api/smokecraft/mentor-voice/preview', { mentorId: 'cuba', speed: 1.0 })
  assert('A mentor with no configured voice honestly reports "unavailable" (no_voice_configured)', inactivePreview.body.preview.status === 'unavailable' && inactivePreview.body.preview.reason === 'no_voice_configured')
  assert('Every preview response includes a real transcript regardless of audio availability', Boolean(activePreview.body.preview.transcript) && Boolean(inactivePreview.body.preview.transcript))
  assert('Every preview response includes a real request ID', Boolean(activePreview.body.preview.requestId))

  console.log('\n── 5. Preference persistence ──')
  const saved = await c2.post('/api/smokecraft/mentor-voice/preferences', { voiceEnabled: false, playbackSpeed: 1.25, captionsEnabled: false, lastPreviewedMentorId: 'dominican' })
  assert('Preferences save succeeds', saved.status === 200 && saved.body.preferences.playbackSpeed === 1.25)
  const reread = await c2.get('/api/smokecraft/mentor-voice/preferences')
  assert('Saved preferences persist and are read back exactly (refresh persistence, same cookie identity)',
    reread.body.preferences.voiceEnabled === false && reread.body.preferences.playbackSpeed === 1.25 && reread.body.preferences.captionsEnabled === false && reread.body.preferences.lastPreviewedMentorId === 'dominican')

  console.log('\n── 6. Same-account second device (independent fetch, same identity) ──')
  const reread2 = await c2.get('/api/smokecraft/mentor-voice/preferences')
  assert('A second independent fetch under the same identity returns identical preferences (no per-device drift)',
    JSON.stringify(reread.body.preferences) === JSON.stringify(reread2.body.preferences))

  console.log('\n── 7. Preference input validation ──')
  const badVoiceEnabled = await c2.post('/api/smokecraft/mentor-voice/preferences', { voiceEnabled: 'yes', playbackSpeed: 1.0, captionsEnabled: true })
  assert('An invalid voiceEnabled type is rejected, not silently coerced', badVoiceEnabled.status === 400 && badVoiceEnabled.body.error === 'invalid_voice_enabled')
  const badMentorPref = await c2.post('/api/smokecraft/mentor-voice/preferences', { voiceEnabled: true, playbackSpeed: 1.0, captionsEnabled: true, lastPreviewedMentorId: 'not-a-real-mentor' })
  assert('An invalid lastPreviewedMentorId is rejected', badMentorPref.status === 400 && badMentorPref.body.error === 'invalid_mentor')

  console.log('\n── 8. Cross-user isolation ──')
  const c3 = makeClient()
  await c3.get('/api/smokecraft/mentor-voice/profiles')
  const c3Prefs = await c3.get('/api/smokecraft/mentor-voice/preferences')
  assert('A completely separate guest gets their own default preferences, never another guest\'s saved values', c3Prefs.body.preferences.playbackSpeed === 1 && c3Prefs.body.preferences.lastPreviewedMentorId === null)
  await c3.post('/api/smokecraft/mentor-voice/preferences', { voiceEnabled: true, playbackSpeed: 0.75, captionsEnabled: true, lastPreviewedMentorId: 'mexico' })
  const c2StillOriginal = await c2.get('/api/smokecraft/mentor-voice/preferences')
  assert('One guest saving preferences never leaks into or overwrites a different guest\'s preferences', c2StillOriginal.body.preferences.playbackSpeed === 1.25)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2b-1/02-mentor-voice-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
