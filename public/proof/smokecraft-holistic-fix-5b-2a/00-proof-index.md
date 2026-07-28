# Holistic Fix 5B-2A — Proof Index

Starting commit: `ac0dd68b`.

## Mentor routes audited

`src/pages/smokecraft/Mentor.jsx` (`/smokecraft/mentor-selection`),
`src/pages/smokecraft/MentorCommentary.jsx`
(`/smokecraft/mentor-commentary`, session 14),
`src/components/smokecraft/DynamicMentorPanel.jsx` (used by
`SkillTree.jsx`, `CollectionsCenter.jsx`, `FillerArrangement.jsx`,
`ChallengeHub.jsx`, `BlendFaultChallenge.jsx`), plus every screen that
reads `journey.mentor` for display (`AISummary.jsx`,
`SessionComplete.jsx`, `Vitola.jsx`, `WrapperStrength.jsx`,
`WelcomeExperience.jsx`, `PassportStamp.jsx`). New this pass:
`server/routes/mentorGuidanceRoutes.js`
(`/api/smokecraft/mentor-guidance/*`).

Confirmed and explicitly NOT touched: the completely separate "human
mentor" staff-coaching system (`mentorController.js`, `mentorRoutes.js`,
`mentor_sessions`/`mentor_tasting_notes` tables, `/mentor-login`,
`/mentor-console`) — shares only the English word "mentor," a
different feature entirely.

## Mentor state result

PASS (already real, re-confirmed, not rebuilt) — `journey.mentor`
remains the sole write target (`Mentor.jsx` has exactly one `setMentor`
call site); `session.selectedMentor` remains a pure reactive mirror.
Already server-synced via the existing journey-snapshot mechanism
(Holistic Fix 4B), giving real cross-device/refresh persistence and
real account-conversion preservation — no new persistence layer was
required or added.

## Hardcoded/mock guidance found and removed

- **SC-D050**: `MentorCommentary.jsx`'s `COMMENTARY` object was keyed
  by short names (`alejandro`, `javier`, `jamastrán`, ...) that **never
  matched** the real `MENTORS` roster ids (`dominican`, `nicaragua`,
  `honduras`, ...) — every real mentor selection silently fell through
  to `DEFAULT_COMMENTARY`, so every learner saw identical generic text
  regardless of which mentor they actually chose. Closed by routing
  through the new real guidance service (which correctly resolves by
  real mentor id).
- **SC-D051**: `MentorCommentary.jsx` rendered `mentor.origin` and
  `mentor.expertise` — fields that do not exist on the real `MENTORS`
  roster (only `country`/`bio`) — rendering as literally `undefined`.
  Closed by using the real `mentor.country`/`mentor.bio` fields.
- **SkillTree.jsx**'s `DynamicMentorPanel` guidance string was a static
  hardcoded sentence, identical for every learner regardless of real
  progress — closed by passing `context="skill-tree"` to the shared
  guidance service instead.

## Guidance service result

PASS — `POST /api/smokecraft/mentor-guidance/guidance` composes every
response from real, independently-fetched server signals (pairing →
quiz → tasting → skill gap → progress summary → mentor-bio fallback,
highest-priority real signal wins). Every response includes message,
reason, nextAction, sourceContext, confidence, and messageVersion.
Client-submitted mentor identity fields are impossible — only a real
`mentorId` looked up against the server roster is accepted.

## Session-aware result

PASS — verified live: guidance changes after real Skill Tree progress
advances (a different node becomes the highlighted gap).

## Progress-aware result

PASS — verified live: the skill-gap branch reads live Skill Tree state;
the progress-summary branch reads live `xp_total`/`rank_label`.

## Pairing-aware result

PASS — verified live: once a real saved pairing exists, guidance
switches to the `pairing_result` branch and references the real
pairing type and score by name, both via the API and rendered in the
browser.

## No-mentor result

PASS — verified live (browser): Skill Tree honestly shows "No mentor
selected yet" when `journey.mentor` is empty — never defaults to any
specific mentor.

## Refresh result

PASS — verified live (browser): a real mentor selection survives a
full page refresh (persisted to `sc_journey_v1`, already server-synced
via the existing journey-snapshot mechanism).

## Cross-device result

Not independently re-tested this pass beyond the pre-existing
journey-snapshot mechanism's already-established real DB-backed
cross-device behavior (verified in earlier Holistic Fix 4B/5A passes);
this pass added no new persistence path for mentor selection to
re-verify.

## Keyboard/focus result

PASS — verified live (browser): Tab moves focus to a real focusable
element on MentorCommentary.

## Pointer/touch result

PASS — verified live (browser): mentor-card selection, toggling, and
navigation controls all respond to real click/pointer activation.

## Defects found and fixed

- **SC-D050**: `MentorCommentary.jsx`'s hardcoded `COMMENTARY` map keys
  never matched the real mentor roster ids — closed.
- **SC-D051**: `MentorCommentary.jsx` rendered nonexistent
  `mentor.origin`/`mentor.expertise` fields as `undefined` — closed,
  now uses real `mentor.country`/`mentor.bio`.

## Tests and build

`verify-smokecraft-hf5b2a-mentor-guidance.mjs` (API-level): 21/21.
`verify-smokecraft-hf5b2a-mentor-browser.mjs` (real Playwright,
selection/persistence/no-mentor/guidance-rendering/progress-change/
commentary/keyboard/pointer/back-continue/no-blocked-overlay/no-console-
errors/honest-failure-handling): 20/20. `validateSmokecraftMentorGuidanceAuthority.mjs`:
19/19 (wired into prebuild). Regression re-verified clean: HF5A-3G
22/22, HF5A-3H 25/25, HF5B-1 36/36. `npm run build` (20 prebuild
validators + vite build): clean.

## Proof path

`public/proof/smokecraft-holistic-fix-5b-2a/`

## What this pass does NOT cover (handoff to 5B-2B)

- ElevenLabs mentor voices — explicitly excluded, not started.
- Challenge Hub, Golden Box — explicitly excluded, untouched.
- `ChallengeHub.jsx`, `BlendFaultChallenge.jsx`, `FillerArrangement.jsx`,
  `CollectionsCenter.jsx` still pass a static hardcoded `guidance`
  string to `DynamicMentorPanel` rather than the new `context` prop —
  out of this pass's scope (Challenge Hub/Golden-Box-adjacent, or not a
  primary mentor-guidance surface named in this mandate).
- Pairing-screen mentor guidance (mandate section 4 lists "pairing
  result" as a guidance input, which is implemented and verified
  server-side/via Skill Tree and MentorCommentary rendering — but no
  dedicated mentor-guidance panel was added directly on the Pairing
  screens themselves this pass).
- The full 109-route/five-viewport sweeps were not run, per this
  mandate's own instruction.
