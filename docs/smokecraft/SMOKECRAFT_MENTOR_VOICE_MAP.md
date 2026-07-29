# SmokeCraft Mentor Voice Map

Holistic Fix 5B-2B-1 — ElevenLabs voice foundation and secure preview.

## Canonical voice profiles

One canonical profile per real roster mentor
(`src/modules/smokecraft/smokeCraftMentors.js`), defined server-side
in `server/services/smokecraft/mentorVoiceService.js`
(`listVoiceProfiles()` / `getVoiceProfile()`) — the client never
defines or overrides a voice profile.

| Mentor ID  | Display Name       | Voice configured | ElevenLabs voice source |
|------------|---------------------|-------------------|--------------------------|
| dominican  | Don Alejandro       | Yes               | Reused from the pre-existing NOVEE OS voice map (Daniel) |
| nicaragua  | Javier Estelí       | Yes               | Reused (Arnold) |
| honduras   | Doña Jamastran      | Yes               | Reused (Rachel) |
| mexico     | Mateo San Andrés    | Yes               | Reused (Adam) |
| brazil     | Dr. Paulo Oliveira  | Yes               | Reused (Matilda) |
| cuba       | Maestro Rafael      | No — unavailable  | No real voice ID exists; not invented |
| peru       | Carlos Mendoza      | No — unavailable  | No real voice ID exists; not invented |
| florida    | (roster entry)      | No — unavailable  | No real voice ID exists; not invented |

Every voice ID above was already real and already configured in the
pre-existing NOVEE OS voice system
(`server/services/voiceService.js` `VOICE_MAP`) before this pass —
none were invented for this mandate. A mentor without a real
configured ID is explicitly `active: false` and always returns an
honest `unavailable` preview status; no client code path can produce
a `ready` status for such a mentor.

## Per-mentor profile fields

- `mentorId`, `displayName` — from the real roster, never
  client-submitted.
- `active` — `true` only when a real ElevenLabs voice ID is
  configured.
- `defaultSpeed` (1.0) / `allowedSpeeds` (`[0.75, 0.9, 1.0, 1.1,
  1.25]`) — the only speeds a client can request; any other value is
  clamped server-side to the default.
- `stability` (0.52) / `style` (0.0) — the same ElevenLabs
  voice-settings values already used by the pre-existing voice
  service, unchanged.
- `language` — `en` for every current mentor.
- `fallbackBehavior` — `webspeech`, matching the existing app-wide
  Web Speech API fallback pattern (`src/services/voiceService.js`);
  this pass does not wire the fallback into Mentor Selection's preview
  control (that stays an honest `unavailable` state — full fallback
  wiring is part of the lesson-autoplay work explicitly deferred to
  5B-2B-2).
- `previewText` — a short (<220 char), server-owned excerpt of the
  mentor's own real, already-approved roster greeting. The client
  can never supply or influence this text.

## Preview endpoint contract

`POST /api/smokecraft/mentor-voice/preview` — body: `{ mentorId,
speed? }`. The client can select WHICH mentor and a bounded speed;
it can never select WHAT is said. Response is always one of:

- `status: 'ready'` — real synthesized audio (base64) + the real
  transcript + a real request ID. Only possible when the mentor is
  active AND ElevenLabs is configured AND the provider call (or a
  cache hit) succeeded.
- `status: 'unavailable'` — `reason: 'no_voice_configured'` (mentor
  has no real voice ID) or `reason: 'provider_not_configured'` (no
  `ELEVENLABS_API_KEY` set on the server). The real transcript is
  still returned so captions remain honest and available.
- `status: 'provider_error'` — the provider call failed or timed out
  (12s timeout). Never a fabricated `ready`.

## Caching and duplicate-request protection

- An in-memory `Map` de-duplicates concurrent identical requests
  (same `mentorId` + `speed`) — a rapid double-click on Preview Voice
  results in exactly one real provider call.
- Successful syntheses are cached in `smokecraft_voice_preview_cache`
  for 30 minutes, keyed by `(mentor_id, speed, text_hash)`. Since
  preview text is always server-owned and identical for every learner
  previewing the same mentor at the same speed, this cache holds no
  private per-learner data — there is nothing to leak cross-user.

## Preferences

`smokecraft_voice_preferences` (migration 099) — one row per
`guest_reference`: `voiceEnabled`, `playbackSpeed`, `captionsEnabled`,
`lastPreviewedMentorId`. Server-authoritative, survives refresh and a
second device under the same identity, isolated per guest/account —
verified in `verify-smokecraft-hf5b2b1-mentor-voice-api.mjs`.

## What this pass does NOT include

Full lesson-by-lesson autoplay of mentor guidance text through voice,
Challenge Hub, Golden Box — explicitly out of scope, per mandate. The
Web Speech API fallback path is defined in the profile contract
(`fallbackBehavior: 'webspeech'`) but not wired into the Mentor
Selection preview control in this pass.

## Production configuration still required

`ELEVENLABS_API_KEY` is not set in this environment. Until it is set
in production, every preview request for every mentor (including the
5 with a configured voice ID) will correctly and honestly return
`status: 'unavailable', reason: 'provider_not_configured'` — this is
by design, not a defect. Setting a real key in production is the only
remaining step before real audio previews can be `ready`.

## Holistic Fix 5B-2B-2 — guidance narration endpoint

`POST /api/smokecraft/mentor-voice/narrate` — body: `{ mentorId,
screenContext?, pairingContext?, speed? }`. Unlike the preview
endpoint, this endpoint computes its own transcript server-side by
calling `mentorGuidanceService.getGuidance()` with the same inputs —
the client cannot submit narration text (any client-supplied `text`
field is ignored). Response shape matches the preview endpoint
(`status`/`transcript`/`audio`/`requestId`/...), plus `sourceContext`
and `guidanceMessageVersion` echoing the authoritative guidance
response.

Because narration text is per-learner (derived from that learner's
real progress/pairing/quiz/tasting signals), migration 100 extended
`smokecraft_voice_preview_cache` with a `guest_reference` column
(`''` for the shared, learner-independent preview cache; a real
`guest_reference` for narration) so the cache and in-flight-request
dedupe are genuinely learner-scoped — one learner's narration audio
is never served to, or blocks a fresh provider call for, another
learner requesting the same mentor's guidance.

Narration is only offered by `DynamicMentorPanel` once real `ready`
guidance text already exists on screen, and is always opt-in (a real
user click on Narrate) — never autoplayed.
