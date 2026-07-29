# Holistic Fix 5B-2B-1 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: b73b2514

## Goal

Build only the secure ElevenLabs mentor-voice foundation and preview
flow — no lesson autoplay, no Challenge Hub, no Golden Box, no full
sweeps.

## Voice code audited

`server/services/voiceService.js` / `server/controllers/voiceController.js`
/ `server/routes/voiceRoutes.js` / `src/services/voiceService.js` /
`src/hooks/useMentorVoice.js` / `src/components/voice/VoiceButton.jsx`
— the pre-existing, generic NOVEE OS voice system (used by
Founder/Investor demo screens, not SmokeCraft-scoped). Left untouched;
its already-real, already-configured ElevenLabs voice IDs
(`VOICE_MAP`) were reused (not duplicated or re-invented) as the
starting point for the new SmokeCraft-scoped
`REAL_CONFIGURED_VOICE_IDS` map. `.env.example` already documented
`ELEVENLABS_API_KEY` (no key present in this environment).

## Mentors mapped

All 8 real roster mentors (`src/modules/smokecraft/smokeCraftMentors.js`)
now have a canonical voice profile — see
`docs/smokecraft/SMOKECRAFT_MENTOR_VOICE_MAP.md`.

## Mentors with configured voices

dominican, nicaragua, honduras, mexico, brazil (5) — each reusing a
real, already-configured ElevenLabs voice ID.

## Unavailable mentors

cuba, peru, florida (3) — no real voice ID exists for these mentors;
explicitly marked `active: false`, never fabricated.

## Secure-service result

New `server/services/smokecraft/mentorVoiceService.js` — the
ElevenLabs API key is read once from `process.env` and never appears
in any response, client file, or built bundle (verified by the
validator's static + built-bundle checks). Preview text is always
server-owned (a short excerpt of the mentor's real roster greeting);
the client can only select a mentor ID and a bounded speed. Requests
are guest/account-scoped via the existing
`ensureSmokeCraftGuestIdentity` middleware chain, rate-limited
(20/min for preview in production), timeout-bounded (12s), and every
response carries a real request ID.

## Secret-exposure result

`scripts/validateSmokecraftMentorVoiceSecurity.mjs`: PASS, 25/25 —
including a post-build check that no built client bundle contains the
ElevenLabs `xi-api-key` header name.

## Preview result

`verify-smokecraft-hf5b2b1-mentor-voice-service.mjs`: 17/17 (mocked
provider paths — ready/cache/dedupe/timeout/error, since no real
ElevenLabs key exists in this environment).
`verify-smokecraft-hf5b2b1-mentor-voice-api.mjs`: 16/16 (real HTTP
against the running server, zero mocking — honest `unavailable`
states, validation, isolation, persistence).

## Play/pause/replay/mute result

Verified live via Playwright in
`verify-smokecraft-hf5b2b1-mentor-selection-browser.mjs`: every
mentor card has its own Preview Voice + Mute controls; Play/Replay
controls appear once a preview is ready; mute/unmute toggles its
accessible label; clicking a voice control never mis-triggers card
selection.

## Captions result

Transcript/caption text renders for any preview that has been
requested at all (ready or unavailable) — SC-D053 found and fixed
live via this same browser test.

## Preference-persistence result

`voiceEnabled`/`playbackSpeed`/`captionsEnabled`/`lastPreviewedMentorId`
persist server-side per guest/account, verified via real refetch
(refresh persistence) and a second independent fetch under the same
identity (same-account second device) in
`verify-smokecraft-hf5b2b1-mentor-voice-api.mjs`.

## Caching/idempotency result

An in-flight request map de-dupes concurrent identical previews (one
real provider call for a rapid double-click); completed previews are
cached for 30 minutes keyed by (mentor, speed, text). Verified in the
service-level test suite (section 5).

## Provider-failure result

Provider timeout and non-timeout provider error both return an
honest `provider_error` status, never fabricated audio — verified in
the service-level test suite (sections 6–8, including the real
no-API-key path against the live server).

## Defects found and fixed

- **SC-D053**: the new Preview Voice caption/transcript text only
  rendered while `status` was `ready`/`loading`, silently withholding
  the transcript when a preview was genuinely `unavailable`. Found
  live via Playwright, fixed in `src/pages/smokecraft/Mentor.jsx`.

## Production configuration still required

`ELEVENLABS_API_KEY` must be set in production for real synthesized
audio. Until then, every preview honestly reports `unavailable` — by
design, not a defect. See
`docs/smokecraft/SMOKECRAFT_MENTOR_VOICE_MAP.md`.

## Tests and build

- `verify-smokecraft-hf5b2b1-mentor-voice-service.mjs`: 17/17
- `verify-smokecraft-hf5b2b1-mentor-voice-api.mjs`: 16/16
- `verify-smokecraft-hf5b2b1-mentor-selection-browser.mjs`: 14/14
- `scripts/validateSmokecraftMentorVoiceSecurity.mjs`: 25/25
- `verify-smokecraft-hf5b1-pairing-engine.mjs` (regression): 36/36
- `verify-smokecraft-hf5b2a-mentor-guidance.mjs` (regression): 20/21
  — 1 failure traced to a pre-existing, environment-only gap (this
  session's freshly-reset database is missing seed-soil content rows;
  `POST /api/smokecraft/seed-soil/progress` itself returns a foreign-
  key error before mentor-guidance logic is ever reached), reproduced
  directly via curl and confirmed unrelated to this pass's mentor-
  voice changes.
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5b-2b-1/`

## What this pass does NOT cover

Full lesson-by-lesson mentor-guidance autoplay, Challenge Hub, Golden
Box, full-route/five-viewport sweeps — explicitly out of scope per
mandate.

## Handoff

Holistic Fix 5B-2B-2: wire lesson-by-lesson autoplay of mentor
guidance text through the now-secure voice preview foundation, once
a real `ELEVENLABS_API_KEY` is configured in production.
