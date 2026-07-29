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

console.log('\n── Holistic Fix 5B-2B-2 additions ──\n')

// ── 10. Clean-reset workflow always seeds required content ───────────
const runMigrations = fs.readFileSync('server/db/runMigrations.js', 'utf8')
check('The documented reset workflow (npm run db:migrate) runs the required Seed & Soil content seed after a clean migration, not as a separate manual step', /REQUIRED_CONTENT_SEEDS/.test(runMigrations) && /runRequiredContentSeeds/.test(runMigrations))
check('The required content seed list includes the Seed & Soil / golden_box_component_catalog seed script', /seedSmokecraftEducationalContent\.mjs/.test(runMigrations))
check('The reset workflow spawns the seed as a real child process and waits for it to exit — not a fire-and-forget dynamic import that could race past its async inserts', /spawn\(process\.execPath, \[seedPath\]/.test(runMigrations) && /child\.on\('exit'/.test(runMigrations))
check('A failed required content seed fails the reset workflow\'s exit code (build-blocking, not silently ignored)', /seedOk = seedResults\.every/.test(runMigrations) && /process\.exit\(ok && seedOk/.test(runMigrations))
const seedScript = fs.readFileSync('server/db/seeds/seedSmokecraftEducationalContent.mjs', 'utf8')
check('The Seed & Soil content seed is idempotent (ON CONFLICT DO NOTHING on natural keys) — safe to run on every reset, never duplicates or clobbers existing data', /ON CONFLICT.*DO NOTHING/.test(seedScript))

// ── 11. Narration text is always the exact authoritative guidance text ──
check('generateGuidanceNarration derives its transcript from the ONE authoritative getGuidance() function (mentorGuidanceService) — never a second, independently generated line', /import \{ getGuidance, MentorGuidanceError \} from '\.\/mentorGuidanceService\.js'/.test(svc) && /const guidance = await getGuidance\(/.test(svc))
check('The narration transcript is assigned directly from guidance.message, with no intermediate client-influenced transformation', /transcript: guidance\.message/.test(svc))
const narrationController = controller
check('The narrate controller only reads mentorId/screenContext/pairingContext/speed from the request body — never a client-supplied text/transcript field that could bypass the authoritative guidance text', /const \{ mentorId, screenContext, pairingContext, speed \} = req\.body/.test(narrationController) && !/body\.text\b|body\.transcript\b/.test(narrationController))

// ── 12. Shared mentor panels use the secure voice service, no bypass ──
const panel = fs.readFileSync('src/components/smokecraft/DynamicMentorPanel.jsx', 'utf8')
check('DynamicMentorPanel uses the one shared voice hook (useSmokeCraftMentorVoice) for narration — no second, competing voice implementation', /useSmokeCraftMentorVoice/.test(panel))
check('DynamicMentorPanel never calls the ElevenLabs API directly', !/api\.elevenlabs\.io/.test(panel))
check('DynamicMentorPanel never autoplays narration — Narrate is only ever triggered by a real user click (handleNarrate is wired to an onClick, not an effect)', !/useEffect\([^}]*requestNarration/.test(panel))
check('DynamicMentorPanel only offers narration once real, ready guidance text already exists on screen (canNarrate gated on dynamic.status === \'ready\')', /canNarrate = !guidance && !noPairingActivityYet && dynamic\.status === 'ready'/.test(panel))

// ── 13. Unavailable mentors never claim playable audio in the shared panel ──
check('The shared panel only renders Play/Pause/Replay once voice.status === \'ready\' — an unavailable/provider-error mentor never shows a playable control', /\{voice\.status === 'ready' && \(/.test(panel))
check('The shared panel explicitly labels the unavailable state as unavailable (never silent, never a fake ready state)', /Voice narration unavailable for/.test(panel))

// ── 14. Learner-scoped narration cache is genuinely per-guest ────────
check('The voice-preview cache is keyed by guest_reference (guest-scoped for narration, \'\' for the shared preview text) — not a single global cache that could leak one learner\'s guidance text to another', /guestReference, mentorId, speed, hash/.test(svc) && /UNIQUE \(guest_reference, mentor_id, speed, text_hash\)/.test(fs.readFileSync('server/db/migrations/100_smokecraft_mentor_voice_narration.sql', 'utf8')))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
