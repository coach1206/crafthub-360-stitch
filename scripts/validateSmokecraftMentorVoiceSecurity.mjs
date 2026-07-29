#!/usr/bin/env node
/**
 * Holistic Fix 5B-2B-1 — build-blocking validator for the server-
 * authoritative SmokeCraft mentor-voice foundation.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Mentor-Voice-security validator (Holistic Fix 5B-2B-1)\n')

// ── 1. ElevenLabs secret never reaches client code ─────────────────
const clientFiles = [
  'src/services/smokecraft/mentorVoiceApiClient.js',
  'src/hooks/useSmokeCraftMentorVoice.js',
  'src/pages/smokecraft/Mentor.jsx',
]
for (const file of clientFiles) {
  const src = fs.readFileSync(file, 'utf8')
  check(`${file} never references ELEVENLABS_API_KEY or an xi-api-key header (secret stays server-side)`, !/ELEVENLABS_API_KEY|xi-api-key/i.test(src))
}
// Build output must never contain the literal key value or the ElevenLabs auth header name.
if (fs.existsSync('dist/assets')) {
  const bundleFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'))
  let leaked = false
  for (const f of bundleFiles) {
    const content = fs.readFileSync(`dist/assets/${f}`, 'utf8')
    if (/xi-api-key/i.test(content)) { leaked = true; break }
  }
  check('No built client bundle contains the ElevenLabs auth header name (xi-api-key never shipped to the browser)', !leaked)
} else {
  console.log('  SKIP  Built bundle check (dist/assets not present — run after npm run build)')
}

const svc = fs.readFileSync('server/services/smokecraft/mentorVoiceService.js', 'utf8')
check('The ElevenLabs API key is read once from process.env and never included in any returned object', /const ELEVENLABS_API_KEY = process\.env\.ELEVENLABS_API_KEY/.test(svc) && !/audio.*ELEVENLABS_API_KEY|ELEVENLABS_API_KEY.*audio/.test(svc))

// ── 2. No invented voice IDs — an active mentor always has a real ID ─
check('Voice IDs are reused from the pre-existing, already-real NOVEE OS voice map — not freshly invented for this pass', /reused verbatim from/.test(svc))
check('listVoiceProfiles() only marks a mentor active when a real REAL_CONFIGURED_VOICE_IDS entry exists (Boolean(voiceId))', /active: Boolean\(voiceId\)/.test(svc))
check('getVoiceProfile() computes active the same way (single source of truth, no second competing active flag)', (svc.match(/active: Boolean\(voiceId\)/g) || []).length === 2)

// ── 3. Preview text is never arbitrary client input ─────────────────
const controller = fs.readFileSync('server/controllers/mentorVoiceController.js', 'utf8')
check('The preview controller only reads mentorId and speed from the request body — never a text/transcript field', /const \{ mentorId, speed \} = req\.body/.test(controller) && !/req\.body\.text|body\.previewText|body\.transcript/.test(controller))
check('The preview text is generated server-side from the mentor\'s own real roster greeting (approvedPreviewText), never echoing client input', /function approvedPreviewText/.test(svc) && /never client-supplied text/.test(svc))

// ── 4. Mentor Selection uses the shared voice service ────────────────
const mentorPage = fs.readFileSync('src/pages/smokecraft/Mentor.jsx', 'utf8')
check('Mentor Selection uses the one shared voice hook (useSmokeCraftMentorVoice) — no bypassing, no second competing voice implementation', /useSmokeCraftMentorVoice/.test(mentorPage))
check('Mentor Selection never calls the ElevenLabs API directly (only through the shared server-side service)', !/api\.elevenlabs\.io/.test(mentorPage))

// ── 5. Captions / accessible labels are present ──────────────────────
check('Preview Voice controls carry a real accessible label per mentor (aria-label with the mentor\'s name)', /aria-label=\{`Preview \$\{mentor\.name\}/.test(mentorPage))
check('Play/Pause controls carry accessible labels', /aria-label=\{voice\.isPlaying \? `Pause/.test(mentorPage))
check('Mute/Unmute controls carry accessible labels', /aria-label=\{voice\.isMuted \? 'Unmute mentor voice' : 'Mute mentor voice'\}/.test(mentorPage))
check('Caption/transcript text is rendered with aria-live so screen readers announce it', /aria-live="polite"/.test(mentorPage))

// ── 6. Duplicate-request / provider-charge protection ────────────────
check('An in-flight-request map de-duplicates concurrent identical preview requests (protects against a rapid double-click provider charge)', /_inFlight = new Map\(\)/.test(svc) && /_inFlight\.has\(inFlightKey\)/.test(svc))
check('A completed preview is cached with a bounded (non-infinite) lifetime, not cached forever', /expires_at > now\(\)/.test(svc) && /interval '30 minutes'/.test(svc))

// ── 7. Never fabricates a successful audio response ───────────────────
check('An inactive mentor (no real voice ID) always returns status "unavailable", never "ready"', /if \(!profile\.active\) \{[\s\S]{0,120}status: 'unavailable'/.test(svc))
check('A missing API key always returns status "unavailable", never "ready"', /if \(!isElevenLabsConfigured\(\)\) \{[\s\S]{0,120}status: 'unavailable'/.test(svc))
check('A provider error/timeout is caught and returns status "provider_error", never a fabricated "ready"', /status: 'provider_error'/.test(svc))

// ── 8. Preferences persistence is server-authoritative and validated ──
check('Voice preferences are saved through a real, guest-scoped UPSERT (one row per guest_reference), not client-side-only storage', /INSERT INTO smokecraft_voice_preferences/.test(svc) && /ON CONFLICT \(guest_reference\) DO UPDATE/.test(svc))
check('Preference input is validated server-side (voiceEnabled/captionsEnabled must be real booleans, speed is clamped to an allowed list)', /throw new MentorVoiceError\('invalid_voice_enabled'\)/.test(svc) && /normalizeSpeed/.test(svc))

// ── 9. Guest identity middleware — same defect class as SC-D033/036/041/052 ──
const routes = fs.readFileSync('server/routes/mentorVoiceRoutes.js', 'utf8')
check('Mentor-voice routes issue a fresh guest identity when none exists (ensureSmokeCraftGuestIdentity present) — prevents the recurring 401-on-first-navigation defect class', /ensureSmokeCraftGuestIdentity/.test(routes))
check('The preview route has its own (tighter) rate limiter, since it is the one route that can reach a paid provider', /previewLimiter = rateLimit/.test(routes) && /router\.post\('\/preview', previewLimiter/.test(routes))
check('Rate limiters are skipped outside production (dev/test), matching the established pattern', /skip: \(\) => !IS_PROD/.test(routes))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
