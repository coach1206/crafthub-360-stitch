# SmokeCraft Mentor Guidance Rules — Holistic Fix 5B-2A

Generated: Holistic Fix 5B-2A, starting commit `ac0dd68b`.

## Mentor identity — one canonical source

`SmokeCraftJourneyContext.journey.mentor` remains the sole write target
for a learner's mentor selection (fixed in Holistic Fix 5A;
re-confirmed unchanged this pass — `Mentor.jsx` has exactly one
`setMentor(...)` call site). It is already server-synced via the
existing journey-snapshot mechanism (Holistic Fix 4B), giving real
cross-device and refresh persistence and real account-conversion
preservation with no new persistence layer required.
`GuestSessionContext.session.selectedMentor` remains a pure reactive
mirror, never independently settable.

## Data source

`POST /api/smokecraft/mentor-guidance/guidance` — a real, server-
authoritative service (`server/services/smokecraft/mentorGuidanceService.js`).
The client supplies only `mentorId` (which mentor to speak as) and
`screenContext` (a display/routing label, not evidence) — every real
signal the guidance is based on is independently re-derived server-side
from the guest's own verified records. **No mock, hardcoded, or
fabricated guidance exists in this service.**

## Real signal priority (highest wins)

1. **Pairing result** (`smokecraft_pairing_saves`, most recent) —
   references the real pairing type and compat score.
2. **Quiz result** (`smokecraft_activity_attempts`, `activity_type='quiz'`,
   most recent) — references the real module and score/total.
3. **Tasting result** (`smokecraft_activity_attempts`,
   `activity_type='tasting'`, most recent).
4. **Skill gap** (live Skill Tree recalculation) — the next `available`
   node, with the real evidence-derived reason already produced by the
   Skill Tree engine (Holistic Fix 5A-3G).
5. **Progress summary** (`smokecraft_player_state.xp_total`/`rank_label`)
   — a real, non-zero XP total with no more specific signal available.
6. **Mentor bio (fallback)** — the mentor's own real roster `greeting`,
   used only when the guest has zero real activity. Honestly labeled
   `sourceContext: 'mentor_bio'`, `isFallback: true`, and the lowest
   confidence value (0.3) — never presented as if it were personalized.

## Explainability rule

Every response includes `message`, `reason` (which real evidence it's
based on), `nextAction` (a concrete real next step), `sourceContext`
(machine-readable signal name), `confidence` (0–1, honestly lower for
weaker signals), and `messageVersion` (currently `1`, bumped whenever
the composition logic changes — a saved/logged guidance result can
always be traced to the exact rule version that produced it).

## What guidance never does

- Never awards XP, badges, or Passport stamps.
- Never issues a write against `smokecraft_player_state`,
  `smokecraft_awards`, or any reward/score table — every query in
  `mentorGuidanceService.js` is read-only.
- Never claims an achievement, score, or completion that isn't real
  (every branch above reads a real row; the fallback branch never
  invents one).
- Never leaks another learner's data — every signal query is scoped by
  `WHERE guest_reference = $1`.

## Screens connected to the shared service

`src/hooks/useSmokeCraftMentorGuidance.js` is the one shared adapter.
Connected this pass: `DynamicMentorPanel.jsx` (accepts a new `context`
prop; the pre-existing `guidance` string prop remains supported for
Challenge Hub / Golden-Box-adjacent callers, explicitly out of this
mandate's scope, and always takes precedence when both are supplied),
`SkillTree.jsx` (now passes `context="skill-tree"` instead of a
hardcoded string), and `MentorCommentary.jsx` (now derives its
construction/flavor/action-equivalent notes from real guidance instead
of the broken hardcoded `COMMENTARY` map — see defect SC-D050 in
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`).

## States supported

`no-mentor` / `loading` / `ready` / `unavailable` / `offline` /
`session-expired` — represented by the shared hook and rendered
honestly by every connected screen (a failed request never shows a
fabricated success; the mentor-specific text is only ever shown once a
real response arrives).

## What this pass does NOT include

ElevenLabs mentor voices, Challenge Hub, Golden Box — untouched, per
explicit mandate exclusion. `ChallengeHub.jsx`, `BlendFaultChallenge.jsx`,
`FillerArrangement.jsx`, and `CollectionsCenter.jsx` still pass a static
`guidance` string to `DynamicMentorPanel` — unchanged, out of this
pass's scope. The full 109-route/five-viewport sweeps were not run, per
this mandate's own instruction.

## Holistic Fix 5B-2A-1 update (remove remaining static mentor guidance)

The four remaining static `guidance="..."` strings on `ChallengeHub.jsx`,
`BlendFaultChallenge.jsx`, `FillerArrangement.jsx`, and
`CollectionsCenter.jsx` are now retired — all four pass `context="..."`
and render through the shared `useSmokeCraftMentorGuidance` hook, same
as every other connected screen.

`PairingLab.jsx` and `PairingRecommendations.jsx` now also carry a
`DynamicMentorPanel`, each passing a new `pairingContext` prop (cigar
shape/wrapper/origin/strength/pairingType/flavorNotes/pairingGoal —
the learner's real live selection, not a saved row). When
`pairingContext.pairingType` is present, `mentorGuidanceService.js`
computes a `livePairing` signal using the exact same
`computeRecommendation()`/`getActiveRules()` functions the pairing
engine's own `/recommend` endpoint uses (now exported from
`pairingEngineService.js` for this reuse) — never a second, competing
scoring path. This guarantees the guidance message's embedded
`${score}/100` can never diverge from the score the learner sees on
the Match badge / score donut, verified live via Playwright (identical
scores) and via API test
(`verify-smokecraft-hf5b2a1-mentor-pairing-consistency.mjs`, 9/9).
`livePairing` outranks a stale saved-pairing row in priority order
whenever a current selection is supplied.

A new honest "no activity result yet" state was added specifically for
the two pairing screens: when `pairingContext` is passed but has no
`pairingType` yet (before a beverage is chosen), the panel shows
"Select a beverage to see {mentor}'s pairing guidance." instead of
issuing a premature request.

## What this pass does NOT include

ElevenLabs mentor voices, Golden Box — untouched, per explicit mandate
exclusion. The full 109-route/five-viewport sweeps were not run, per
this mandate's own instruction.

## Holistic Fix 5B-2B-1 note (voice is a separate, additive system)

The new mentor-voice preview foundation
(`server/services/smokecraft/mentorVoiceService.js`,
`SMOKECRAFT_MENTOR_VOICE_MAP.md`) is intentionally independent of
`mentorGuidanceService.js` — voice previews speak a mentor's own
already-approved roster greeting, never the dynamic, context-aware
guidance text this service generates. The two systems are not wired
together in this pass (no full lesson-by-lesson autoplay of guidance
text — explicitly out of scope, deferred to Holistic Fix 5B-2B-2).

## Holistic Fix 5B-2B-2 update (shared mentor narration)

`DynamicMentorPanel` — the one shared component every context-aware
mentor panel renders through (Skill Tree, Collections, Challenge Hub,
Blend Fault, Filler Arrangement, Pairing Lab, Pairing Recommendations)
— now offers an opt-in "Narrate" control once real, `ready` guidance
text is already on screen. Narration is generated server-side by
`mentorVoiceService.generateGuidanceNarration()`, which calls the
exact same `mentorGuidanceService.getGuidance()` function the visible
text already came from — the narrated transcript can never diverge
from the guidance text rendered above it, verified live via Playwright
(byte-for-byte identical) and via API test (same `sourceContext` in
both responses). The client never supplies narration text; only
`mentorId`/`screenContext`/`pairingContext`/`speed` (an unrestricted
`text` field sent by a client is silently ignored server-side).
Narration never autoplays — always opt-in via a real user click.
