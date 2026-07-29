# Holistic Fix 5B-2B-2 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 87600a0e

## Goal

Two tightly-scoped things: repair the missing Seed & Soil baseline
data so the mentor-guidance regression is clean on a genuinely fresh
reset, and add secure, opt-in narration to the shared
`DynamicMentorPanel` using the 5B-2B-1 voice foundation.

## Seed Soil root cause

`npm run db:migrate` — the repo's own documented reset workflow — only
ever applied schema migrations. `golden_box_component_catalog` (and
everything that foreign-keys to it) has never had its rows created by
a migration; they were only ever inserted by the pre-existing,
already-idempotent `seedSmokecraftEducationalContent.mjs` seed script,
which nothing in the automated reset path ever invoked. A genuinely
fresh database therefore always passed every migration yet still had
zero catalog rows — the first request referencing a catalog id
(`POST /api/smokecraft/seed-soil/progress`) failed with a real 23503
foreign-key violation, one layer upstream of the mentor-guidance
regression test that surfaced it. See SC-D054 in
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` (which also documents a second,
real defect found while fixing the first: a naive `import()`-based
seed invocation resolved before the seed's async inserts actually
completed).

## Baseline repair result

`server/db/runMigrations.js`'s CLI entrypoint now spawns every
required content seed as a real child process, awaited to completion,
after a successful migration run — closing SC-D054 permanently, not
with a one-off manual insert. Verified via
`verify-smokecraft-hf5b2b2-clean-reset-baseline.mjs` (7/7): drops and
recreates the real database, runs the real `npm run db:migrate`
command, asserts real content rows exist, confirms idempotency across
two consecutive runs, and confirms unrelated existing data survives a
repeat run.

## Mentor panels connected

`DynamicMentorPanel` — the one shared component behind Skill Tree,
Collections, Challenge Hub, Blend Fault, Filler Arrangement, Pairing
Lab, and Pairing Recommendations — gained the Narrate control. No
other component was touched.

## Narration result

`server/services/smokecraft/mentorVoiceService.generateGuidanceNarration()`
derives its transcript from the exact same `mentorGuidanceService.getGuidance()`
call the visible guidance text already came from. `verify-smokecraft-hf5b2b2-narration-service.mjs`
(13/13, mocked provider paths) and `verify-smokecraft-hf5b2b2-narration-api.mjs`
(14/14, real HTTP, zero mocking) both confirm the narration transcript
is byte-for-byte identical to the guidance message.

## Guidance/audio consistency result

Verified at three layers: service-level (direct function comparison),
API-level (two real HTTP requests, same server), and browser-level
(`verify-smokecraft-hf5b2b2-shared-panel-narration-browser.mjs`,
15/15 — the rendered caption text is asserted byte-for-byte identical
to the rendered guidance text above it).

## Play/pause/replay/mute result

Verified live via Playwright on Skill Tree: Play/Pause/Replay appear
once narration is `ready`; Mute is always present; a rapid double-
click on Narrate does not crash the panel or duplicate the request.

## Captions result

A captions on/off toggle is present and clickable; when enabled, the
narration transcript renders in a dedicated caption line
(`data-testid="mentor-narration-caption"`) that always matches the
guidance text, even in the honest `unavailable` state (no ElevenLabs
key in this environment) — captions are never withheld just because
audio isn't playable.

## Preference-persistence result

`voiceEnabled`/`playbackSpeed`/`captionsEnabled`/`lastPreviewedMentorId`
persist server-side per guest/account (shared with 5B-2B-1's
preferences table), verified via real refetch and a second independent
fetch under the same identity.

## Caching/idempotency result

Migration 100 extends the 5B-2B-1 preview cache with a `guest_reference`
column so narration — whose text is per-learner — gets its own
learner-scoped cache slot and in-flight-request dedupe, verified: a
repeat request for the same learner hits cache (no second provider
call); a different learner never reuses another learner's cached
audio; two concurrent identical requests (rapid double-click) result
in exactly one real provider call.

## Unavailable/provider-error result

A mentor with no configured voice, a missing API key, a provider
timeout, and a provider 500 error all return honest, explicit
non-`ready` statuses with the real transcript still attached — never
fabricated audio.

## Defects found and fixed

- **SC-D054**: the Seed & Soil reset defect described above, plus the
  fire-and-forget `import()` sub-defect found while fixing it.

## Production configuration still required

`ELEVENLABS_API_KEY` must be set in production for real narrated
audio. Until then, every narration honestly reports `unavailable` by
design — captions/transcript remain fully functional regardless.

## Tests and build

- `verify-smokecraft-hf5b2b2-clean-reset-baseline.mjs`: 7/7
- `verify-smokecraft-hf5b2a-mentor-guidance.mjs` (regression, on the
  freshly-repaired database): 21/21
- `verify-smokecraft-hf5b2b2-narration-service.mjs`: 13/13
- `verify-smokecraft-hf5b2b2-narration-api.mjs`: 14/14
- `verify-smokecraft-hf5b2b2-shared-panel-narration-browser.mjs`: 15/15
- `scripts/validateSmokecraftMentorVoiceSecurity.mjs`: 41/41
- `scripts/validateSmokecraftMentorGuidanceAuthority.mjs`: PASS
  (unchanged)
- `verify-smokecraft-hf5b1-pairing-engine.mjs` (regression): 36/36
- 5B-2B-1 regression suite (voice service/API/Mentor-Selection
  browser): 17/17, 16/16, 14/14 — all still passing after the
  narration refactor
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5b-2b-2/`

## What this pass does NOT cover

Full lesson-by-lesson autoplay across every lesson, Challenge Hub work
beyond the pre-existing shared panel, Golden Box, full-route/five-
viewport sweeps — explicitly out of scope per mandate.

## Handoff

Holistic Fix 5C-1: begin the next system area per the operation's
sequencing — full lesson-by-lesson autoplay of mentor narration
remains deferred pending a production `ELEVENLABS_API_KEY` and an
explicit future mandate.
