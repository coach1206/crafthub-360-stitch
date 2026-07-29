#!/usr/bin/env node
/**
 * Holistic Fix 5B-2B-2 — direct service-level tests for guidance
 * narration (generateGuidanceNarration). Exercises the provider-
 * success/cache/dedupe paths by stubbing global.fetch (no real
 * ELEVENLABS_API_KEY exists in this environment) — the no-key path is
 * separately verified with zero mocking in
 * verify-smokecraft-hf5b2b2-narration-api.mjs.
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
  if (fetchBehavior === 'success') return { ok: true, arrayBuffer: async () => Buffer.from('fake-mp3-audio-bytes').buffer }
  if (fetchBehavior === 'error') return { ok: false, status: 500, text: async () => 'Internal Server Error' }
  if (fetchBehavior === 'abort') {
    return new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; reject(e) })
    })
  }
}

async function main() {
  const svc = await import('./server/services/smokecraft/mentorVoiceService.js')
  const { getDb } = await import('./server/db/connection.js')
  await getDb().query(`DELETE FROM smokecraft_voice_preview_cache WHERE guest_reference LIKE 'hf5b2b2-narr-%'`)

  console.log('\n── 1. Narration text matches the exact authoritative guidance message ──')
  fetchBehavior = 'success'
  const guest1 = 'hf5b2b2-narr-guest-1'
  const guidanceMod = await import('./server/services/smokecraft/mentorGuidanceService.js')
  const guidance = await guidanceMod.getGuidance({ guestReference: guest1, mentorId: 'dominican' })
  const narration = await svc.generateGuidanceNarration({ guestReference: guest1, mentorId: 'dominican', speed: 1.0 })
  assert('The narration transcript is byte-for-byte identical to the authoritative guidance message (never a second, independent line)', narration.transcript === guidance.message)
  assert('A mentor with a real configured voice returns status "ready" with real audio', narration.status === 'ready' && Boolean(narration.audio))

  console.log('\n── 2. Valid-voice mentor vs unavailable-voice mentor ──')
  const guest2 = 'hf5b2b2-narr-guest-2'
  const unavailableNarration = await svc.generateGuidanceNarration({ guestReference: guest2, mentorId: 'cuba', speed: 1.0 })
  assert('A mentor with no configured voice honestly reports unavailable, never fabricated audio', unavailableNarration.status === 'unavailable' && unavailableNarration.reason === 'no_voice_configured' && !unavailableNarration.audio)
  assert('The unavailable narration response still carries the real transcript (captions remain honest)', Boolean(unavailableNarration.transcript))

  console.log('\n── 3. Learner-scoped idempotency / cached repeat ──')
  const before = fetchCallCount
  const repeat = await svc.generateGuidanceNarration({ guestReference: guest1, mentorId: 'dominican', speed: 1.0 })
  assert('An identical repeat narration request for the same learner reuses the cache (no second provider call)', fetchCallCount === before && repeat.fromCache === true)

  console.log('\n── 4. Cross-learner isolation of the narration cache ──')
  fetchCallCount = 0
  const guest3 = 'hf5b2b2-narr-guest-3'
  // guest3 has zero real progress/pairing signal, so their guidance text
  // (and therefore narration transcript) genuinely differs from guest1's.
  const narrationGuest3 = await svc.generateGuidanceNarration({ guestReference: guest3, mentorId: 'dominican', speed: 1.0 })
  assert('A different learner never reuses guest1\'s cached narration audio — the cache is genuinely learner-scoped, not shared (real provider call, not a cache hit)', fetchCallCount === 1 && narrationGuest3.fromCache === false)
  assert('The isolated narration request still returns real, non-fabricated audio for guest3', narrationGuest3.status === 'ready' && Boolean(narrationGuest3.audio))

  console.log('\n── 5. Rapid double-click dedupe (in-flight) ──')
  fetchCallCount = 0
  const guest4 = 'hf5b2b2-narr-guest-4'
  const [n1, n2] = await Promise.all([
    svc.generateGuidanceNarration({ guestReference: guest4, mentorId: 'nicaragua', speed: 1.0 }),
    svc.generateGuidanceNarration({ guestReference: guest4, mentorId: 'nicaragua', speed: 1.0 }),
  ])
  assert('Two concurrent identical narration requests (rapid double-click) result in exactly one real provider call', fetchCallCount === 1)
  assert('Both concurrent requests resolve to a real ready result', n1.status === 'ready' && n2.status === 'ready')

  console.log('\n── 6. Provider timeout / failure for narration ──')
  fetchBehavior = 'abort'
  const guest5 = 'hf5b2b2-narr-guest-5'
  const timeoutNarration = await svc.generateGuidanceNarration({ guestReference: guest5, mentorId: 'honduras', speed: 0.9 })
  assert('A provider timeout during narration returns an honest "provider_error", never fabricated audio', timeoutNarration.status === 'provider_error' && !timeoutNarration.audio)

  fetchBehavior = 'error'
  const guest6 = 'hf5b2b2-narr-guest-6'
  const errorNarration = await svc.generateGuidanceNarration({ guestReference: guest6, mentorId: 'mexico', speed: 1.0 })
  assert('A provider 500 error during narration returns an honest "provider_error", never fabricated audio', errorNarration.status === 'provider_error' && !errorNarration.audio)

  console.log('\n── 7. Missing API key ──')
  delete process.env.ELEVENLABS_API_KEY
  const svc2 = await import(`./server/services/smokecraft/mentorVoiceService.js?nokey=${Date.now()}`)
  const guest7 = 'hf5b2b2-narr-guest-7'
  const noKeyNarration = await svc2.generateGuidanceNarration({ guestReference: guest7, mentorId: 'dominican', speed: 1.0 })
  assert('With no ElevenLabs API key configured, narration for an active mentor still returns an honest "unavailable" status', noKeyNarration.status === 'unavailable' && noKeyNarration.reason === 'provider_not_configured' && !noKeyNarration.audio)

  console.log('\n── 8. No mentor selected ──')
  process.env.ELEVENLABS_API_KEY = 'test-key-stub-1234567890'
  try {
    await svc.generateGuidanceNarration({ guestReference: 'hf5b2b2-narr-guest-8', mentorId: null, speed: 1.0 })
    assert('Narration with no mentor selected is rejected, never returns fabricated guidance narration', false)
  } catch (err) {
    assert('Narration with no mentor selected is rejected, never returns fabricated guidance narration', err.code === 'mentor_not_selected')
  }

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  globalThis.fetch = realFetch
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2b-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2b-2/02-narration-service-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
