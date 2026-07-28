# Holistic Fix 5B-2A-1 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: fba0c2f8

## Scope

Six screens: `ChallengeHub.jsx`, `BlendFaultChallenge.jsx`,
`FillerArrangement.jsx`, `CollectionsCenter.jsx`, `PairingLab.jsx`,
`PairingRecommendations.jsx`.

## Static guidance removed

`ChallengeHub.jsx`, `BlendFaultChallenge.jsx`, `FillerArrangement.jsx`,
`CollectionsCenter.jsx` — each previously passed a hardcoded
`<DynamicMentorPanel guidance="...">` string. All four now pass
`context="..."` and render through the shared, server-authoritative
`useSmokeCraftMentorGuidance` hook.

## Pairing mentor panels added

`PairingLab.jsx` (`context="pairing-lab"`) and
`PairingRecommendations.jsx` (`context="pairing-recommendations"`)
each gained a new `DynamicMentorPanel` with a `pairingContext` prop
carrying the learner's real live cigar/beverage selection. Guidance is
scored with the exact same `computeRecommendation()`/`getActiveRules()`
functions the pairing engine's own `/recommend` endpoint uses (both
newly exported from `pairingEngineService.js` for this reuse) — never
a second, competing scoring path.

## Results

- **Context-aware result**: all six screens request and render
  server-computed, mentor-identity-correct guidance (or the honest
  "no activity result yet" state on the two pairing screens before a
  beverage is picked).
- **Pairing-consistency result**: `verify-smokecraft-hf5b2a1-mentor-pairing-consistency.mjs`
  — 9/9 passed. Guidance's embedded `${score}/100` exactly matches the
  authoritative pairing engine result in every case tested (baseline,
  changed selection, conflict scenario), never fabricates, never
  changes XP, and is isolated per guest.
- **No-mentor result**: a request with no mentor selected is rejected
  (`mentor_not_selected`), never returns fabricated guidance.
- **Browser result**: `verify-smokecraft-hf5b2a1-mentor-six-screens-browser.mjs`
  — 34/34 passed (route resolves, real mentor identity, real guidance,
  keyboard focus, no horizontal cutoff/blocked overlays, no console
  errors, live-pairing score match on both pairing screens).

## Defects found and fixed

- **SC-D052**: `blendFaultRoutes.js`, `challengeHubRoutes.js`,
  `fillerArrangementRoutes.js` were missing
  `ensureSmokeCraftGuestIdentity` in their `router.use()` chain (only
  had `attachSmokeCraftIdentity`, which reads but never issues a guest
  identity) — caused real 401s for a fresh guest, and on
  FillerArrangement specifically cascaded into the mentor panel not
  rendering at all via an unrelated early-return-on-error. Found live
  via Playwright, fixed by adding `ensureSmokeCraftGuestIdentity` to
  all three routers, matching the already-correct pattern used
  elsewhere. See `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`.

## Tests and build

- `verify-smokecraft-hf5b2a1-mentor-pairing-consistency.mjs`: 9/9
- `verify-smokecraft-hf5b2a1-mentor-six-screens-browser.mjs`: 34/34
- `scripts/validateSmokecraftMentorGuidanceAuthority.mjs`: 33/33 (see
  `03-validator-output.txt`)
- `verify-smokecraft-hf5b1-pairing-engine.mjs` (regression): 36/36
- `verify-smokecraft-hf5b2a-mentor-guidance.mjs` (regression): 21/21
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5b-2a-1/`

## What this pass does NOT cover

ElevenLabs mentor voices (explicitly deferred to 5B-2B), Golden Box
(out of scope), full-route or five-viewport sweeps (explicitly excluded
by this mandate).

## Handoff

Holistic Fix 5B-2B: build ElevenLabs mentor voice narration on top of
the now-fully-connected, context-aware, pairing-consistent mentor
guidance service.
