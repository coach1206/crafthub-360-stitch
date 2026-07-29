# Holistic Fix 5C-1A — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 4ebb8b53

## Goal

Close only the Challenge Hub scoring-authority gap. No Golden Box, no
new challenges, no full sweeps.

## Challenges audited

Both active Challenge Hub systems: the two Daily/Weekly progress
challenges (`daily-lesson-practice`, `weekly-multi-activity-builder` —
`challengeHubService.js`, migration 088) and Blend Fault Identification
(`blendFaultService.js`, migration 089). See
`docs/smokecraft/SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md` and
`SMOKECRAFT_RULE_REGISTRY.md` for the full mapping (challenge ID,
type, qualifying evidence, scoring rule, rule version, attempt limit,
repeatability, completion criteria, reward eligibility).

## Client scoring paths found and removed

None existed — both systems were already server-authoritative for
scoring/completion (Blend Fault since migration 089; Daily/Weekly since
migration 088). A stale code comment in `ChallengeHub.jsx` incorrectly
claimed otherwise for Blend Fault; corrected (SC-D056).

## Evidence model

Daily/Weekly: real `smokecraft_progression_events` rows within the
instance's UTC period window (distinct event-type count). Blend Fault:
raw `{questionKey, answer}` pairs, validated against the real active
question set and scored against the server-only answer key.

## Scoring result

Blend Fault: 3/3 correct → passed, incorrect → failed, verified live.
Daily/Weekly: real event-derived progress vs. target, verified live.
Neither trusts a client-submitted score/pass-fail value.

## Completion result

Daily/Weekly completion now happens inside a row-locked
(`FOR UPDATE`) transaction (`completeChallengeAndAward()`), closing a
real two-tab race the previous plain read-then-update allowed. Blend
Fault's existing row-locked (`FOR UPDATE`) scoring transaction is
unchanged and was already correct.

## Reward result

`smokecraft_challenge_definitions.xp_reward` (existing schema column,
already serialized to the client, previously never read by any server
code) is now genuinely awarded when nonzero, guarded by a real
database UNIQUE constraint (`smokecraft_challenge_rewards`, migration
101) — verified via a temporary controlled xp_reward flip (both
seeded challenges remain at their pre-existing, disclosed `xp_reward
= 0`; no new reward amount was invented).

## Duplicate-race result

Verified via 3 concurrent requests during an evaluation race: exactly
one reward row, exactly one XP grant. Verified via rapid double-click
Blend Fault submit: one real scoring outcome, no crash, no double-score.

## Cross-device result

Two independent fetches under the same identity return identical
challenge state (no per-device drift) — verified live.

## Account-conversion result

Found and fixed a real gap (matching the SC-D037/SC-D042 pattern):
Challenge Hub learner state, Challenge Hub reward grants, and Blend
Fault attempts/answers were never transferred by
`convertGuestToAccount()` at all. Fixed; verified live end-to-end
(guest completes a challenge and passes a Blend Fault attempt →
converts to a real account → the same account identity still sees
both).

## Authorization result

Found and fixed SC-D055: both `challengeHubRoutes.js` and
`blendFaultRoutes.js` used the raw account id instead of the
established `user:${id}` prefix, so a converted account's requests
silently queried under the wrong identity and never saw their own
just-transferred state — this is what originally surfaced the
account-conversion gap above. Fixed to match the established, correct
pattern (`skillTreeRoutes.js`, `mentorGuidanceRoutes.js`). Cross-user
denial (a different guest cannot read another guest's Blend Fault
attempt) verified live (403/404).

## Defects found and fixed

- **SC-D055**: missing `user:` identity prefix in two routers.
- **SC-D056**: stale/incorrect code comment about Blend Fault's
  scoring status.
- Structural gap: `xp_reward` schema column was dead code (no reward
  pathway existed at all) — now genuinely wired, idempotent.
- Structural gap: Challenge Hub / Blend Fault state was never included
  in guest-to-account conversion — now transferred.

## Tests and build

- `verify-smokecraft-hf5c1a-challenge-hub-api.mjs`: 29/29
- `verify-smokecraft-hf5c1a-challenge-hub-browser.mjs`: 12/12
- `scripts/validateSmokecraftChallengeHubAuthority.mjs`: 25/25
- `scripts/validateSmokecraftGameplayAuthority.mjs` (regression): PASS
- `verify-smokecraft-hf5b2a-mentor-guidance.mjs` (regression): 21/21
- `verify-smokecraft-hf5b1-pairing-engine.mjs` (regression): 36/36
- `verify-smokecraft-hf5b2b2-narration-api.mjs` (regression): 14/14
- `verify-smokecraft-hf5a3g-skill-tree-flow.mjs` (regression —
  exercises `convertGuestToAccount`, touched this pass): 22/22
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5c-1a/`

## What this pass does NOT cover

Golden Box, new challenges, full-route/five-viewport sweeps —
explicitly out of scope per mandate.

## Handoff

Holistic Fix 5C-1B: continue Stage 5C — Golden Box scoring/persistence
audit, using the same server-authoritative, canonical-event,
database-enforced-idempotency pattern established here and in prior
5A/5B passes.
