# Holistic Fix 5A-2 — Proof Index

Starting commit: `c34455be`.

## Scope

Follow-up to Holistic Fix 5A, closing the specific gaps that pass
explicitly disclosed rather than fabricated as done: the unguarded
`addXP()`/`addBadge()` client-controlled-reward surface, the
`leaf-recognition` Origins Passport stamp's client-decided eligibility,
and adding a protected correction/reversal mechanism. Does not attempt
the full 23-item HF5A-2 mandate in one pass — see the Final Report's
"remaining core gameplay gaps" for an honest accounting of what is still
open (tasting draft/completion distinction, skill-checkpoint evidence,
Collections/Skill Tree ledger integration, full reward-screen
reconnection to fresh server fetches, the complete 16-event-type ledger).

## Contents

- `00-proof-index.md` — this file.
- `01-reward-authority-results.json` — 19/19 automated tests from
  `verify-smokecraft-hf5a2-reward-authority.mjs`: server-verified quiz
  scoring (correct/incorrect/replay/race), server-verified Leaf Challenge
  scoring (perfect/zero/farming-resistance), named XP (real amount,
  rejected fabricated source, no double-grant), badge mirror, staff-only
  correction gate, two-tab quiz race.
- `02-gameplay-authority-validator-output.txt` — 25/25 checks from the
  new build-blocking `scripts/validateSmokecraftGameplayAuthority.mjs`.
- `03-rule-registry.md` — copy of the updated rule registry doc.
- `04-migration-096-schema.sql` — the new schema.
- `05-rule-seed-output.txt` — output of the idempotent rule-seed script:
  46 real, versioned rows written.

## What was verified live (not just unit-level)

- `POST /knowledge-check/terroir/submit` with a wrong answer returns a
  server-computed score of 1/2 and the exact existing session-linked XP
  amount (75) — never a client-trusted value.
- The identical module cannot be scored/rewarded twice, even with a
  different idempotency key.
- `POST /leaf-challenge/submit` with the real 5-correct answer set scores
  5/5, grants 125 XP, both badges, and the Passport stamp, all
  atomically; an all-wrong set scores 0/5 and does not grant
  leaf-scholar; a second, "better" answer set submitted after a first
  real attempt is rejected (not farmable).
- `POST /awards/xp` with an unrecognized `awardKey` is rejected 400 —
  the server has no fallback path that grants an arbitrary amount.
- `POST /corrections` from a plain guest identity is rejected 403 before
  ever reaching the correction logic.
- A real two-tab race (`Promise.all`, same guest, two different
  idempotency keys) on the same quiz module still grants XP exactly once.

## Regression re-verified after this pass's changes

- HF4 idempotency suite: 30/30.
- HF4B account/conversion suite: 32/32.
- HF5A gameplay engine suite: 22/22.
- Full journey (`verify-smokecraft-full-journey-sequence-and-assets.mjs`): 107/107.
- Interaction sweep (88 controls-behavior checks): 88/88, 276 controls unchanged.
- Forward/backward + SC-D014 regression: 10/10.
- Phase/session lock: 9/9.
- Asset exclusivity: 17/17.
- Control coverage: PASS.
- Full `npm run build` (all 11 prebuild validators + vite build): clean.

## What this pass does NOT close (see Final Report for the complete list)

- Tasting draft-vs-completion distinction and skill-checkpoint evidence
  requirements (mandate's tasting/skill sections) — not rebuilt.
- `master-blend`/`cultivator` Passport stamps still lack independent
  free-form-content verification beyond their paired XP activity
  succeeding (their content is subjective, unlike the leaf challenge's
  real answer key).
- Reward Center/Passport/Collections/Skill Tree screens still read the
  local GuestSessionContext mirror, not an explicit fresh server fetch
  per view.
- The full 16-event-type canonical ledger, Collections/Skill Tree
  ledger-driven unlock rebuild, and Challenge Hub/Golden Box (5C)/
  pairing-mentor-intelligence (5B) remain out of scope.
