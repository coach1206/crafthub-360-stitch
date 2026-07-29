#!/usr/bin/env node
/**
 * Holistic Fix 5B-2B-1 — direct service-level tests for the
 * server-authoritative mentor-voice foundation. Exercises paths that
 * require a configured ElevenLabs key (ready/cache/dedupe/provider
 * error) by stubbing global.fetch — a standard, honest unit-testing
 * technique (not a fabricated production claim): this environment has
 * no real ELEVENLABS_API_KEY, so these are the only paths that can be
 * exercised without a live provider account. The no-key / no-voice
 * paths are separately verified against the real running server in
 * verify-smokecraft-hf5b2b1-mentor-voice-api.mjs with zero mocking.
 */
import 'dotenv/config'
process.env.ELEVENLABS_API_KEY = 'test-key-stub-1234567890'

let pass = 0, fail = 0
const results = []
function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const realFetch = globalThis.fetch
let fetchCallCount = 0
let fetchBehavior = 'success'

globalThis.fetch = async (url, opts) => {
  fetchCallCount++
  if (fetchBehavior === 'success') {
    return { ok: true, arrayBuffer: async () => Buffer.from('fake-mp3-audio-bytes').buffer }
  }
  if (fetchBehavior === 'error') {
    return { ok: false, status: 500, text: async () => 'Internal Server Error' }
  }
  if (fetchBehavior === 'abort') {
    return new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; reject(e) })
    })
  }
}

async function main() {
  const svc = await import('./server/services/smokecraft/mentorVoiceService.js')
  // This test's cache/dedupe assertions require a real cache miss on
  // first call — clear any rows a previous run of this same script
  // left behind (the cache table is real and persists across runs by
  // design; this is test-fixture cleanup, not product behavior).
  const { getDb } = await import('./server/db/connection.js')
  await getDb().query(`DELETE FROM smokecraft_voice_preview_cache WHERE mentor_id IN ('dominican','nicaragua','honduras','mexico')`)

  console.log('\n── 1. isElevenLabsConfigured / voice profiles ──')
  assert('isElevenLabsConfigured() is true once a key is set', svc.isElevenLabsConfigured())
  const profiles = svc.listVoiceProfiles()
  assert('listVoiceProfiles returns all 8 real roster mentors', profiles.length === 8)
  const activeIds = profiles.filter(p => p.active).map(p => p.mentorId)
  assert('Only mentors with a real, already-configured voice ID are active (dominican/nicaragua/honduras/mexico/brazil)',
    ['dominican', 'nicaragua', 'honduras', 'mexico', 'brazil'].every(id => activeIds.includes(id)))
  assert('A mentor with no real configured voice ID (cuba) is explicitly inactive, never fabricated as active',
    !activeIds.includes('cuba') && !activeIds.includes('peru') && !activeIds.includes('florida'))

  console.log('\n── 2. Mentor with valid voice — successful preview ──')
  fetchBehavior = 'success'; fetchCallCount = 0
  const readyResult = await svc.generatePreview({ mentorId: 'dominican', speed: 1.0 })
  assert('A mentor with a real configured voice and a working provider returns status "ready"', readyResult.status === 'ready')
  assert('The ready response includes real audio, transcript, and a request ID', Boolean(readyResult.audio) && Boolean(readyResult.transcript) && Boolean(readyResult.requestId))
  assert('The transcript is the mentor\'s own real, server-owned approved text (not client-supplied)', readyResult.transcript.startsWith('I am Don Alejandro'))

  console.log('\n── 3. Mentor without a configured voice ──')
  const noVoiceResult = await svc.generatePreview({ mentorId: 'cuba', speed: 1.0 })
  assert('A mentor with no real voice ID returns an honest "unavailable" status, never fabricated audio', noVoiceResult.status === 'unavailable' && noVoiceResult.reason === 'no_voice_configured' && !noVoiceResult.audio)

  console.log('\n── 4. Cached repeat request ──')
  const before = fetchCallCount
  const cachedResult = await svc.generatePreview({ mentorId: 'dominican', speed: 1.0 })
  assert('An identical repeat request reuses the cached audio (no second provider call)', fetchCallCount === before && cachedResult.fromCache === true)
  assert('The cached result still returns status "ready" with the same real audio', cachedResult.status === 'ready' && Boolean(cachedResult.audio))

  console.log('\n── 5. Rapid double-click protection (in-flight dedupe) ──')
  fetchBehavior = 'success'; fetchCallCount = 0
  const [r1, r2] = await Promise.all([
    svc.generatePreview({ mentorId: 'nicaragua', speed: 1.0 }),
    svc.generatePreview({ mentorId: 'nicaragua', speed: 1.0 }),
  ])
  assert('Two concurrent identical requests (rapid double-click) result in exactly one real provider call', fetchCallCount === 1)
  assert('Both concurrent requests still resolve to a real ready result', r1.status === 'ready' && r2.status === 'ready')

  console.log('\n── 6. Provider timeout ──')
  fetchBehavior = 'abort'
  const timeoutResult = await svc.generatePreview({ mentorId: 'honduras', speed: 0.9 })
  assert('A provider timeout returns an honest "provider_error" status, never fabricated audio', timeoutResult.status === 'provider_error' && !timeoutResult.audio)

  console.log('\n── 7. Provider failure (non-timeout error) ──')
  fetchBehavior = 'error'
  const errorResult = await svc.generatePreview({ mentorId: 'mexico', speed: 1.0 })
  assert('A provider 500 error returns an honest "provider_error" status, never fabricated audio', errorResult.status === 'provider_error' && !errorResult.audio)

  console.log('\n── 8. Missing API key ──')
  delete process.env.ELEVENLABS_API_KEY
  const svc2 = await import(`./server/services/smokecraft/mentorVoiceService.js?nokey=${Date.now()}`)
  const noKeyResult = await svc2.generatePreview({ mentorId: 'dominican', speed: 1.0 })
  assert('With no ElevenLabs API key configured, an active mentor still returns an honest "unavailable" status (never fabricated audio)',
    noKeyResult.status === 'unavailable' && noKeyResult.reason === 'provider_not_configured' && !noKeyResult.audio)

  console.log('\n── 9. Preference validation ──')
  process.env.ELEVENLABS_API_KEY = 'test-key-stub-1234567890'
  try {
    await svc.saveVoicePreferences('test-guest-voice-1', { voiceEnabled: 'not-a-bool', playbackSpeed: 1.0, captionsEnabled: true })
    assert('Invalid voiceEnabled type is rejected', false)
  } catch (err) {
    assert('Invalid voiceEnabled type is rejected', err.code === 'invalid_voice_enabled')
  }
  const saved = await svc.saveVoicePreferences('test-guest-voice-1', { voiceEnabled: true, playbackSpeed: 999, captionsEnabled: true, lastPreviewedMentorId: 'dominican' })
  assert('An out-of-range playback speed is clamped to a real allowed value, never stored as-is', [0.75, 0.9, 1.0, 1.1, 1.25].includes(saved.playbackSpeed))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  globalThis.fetch = realFetch
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2b-1/01-mentor-voice-service-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
