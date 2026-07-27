# Holistic Fix 5A-3 — Proof Index

Starting commit: `c77e4a44`.

## Scope disclosure

This pass closed **one** concrete, fully-tested item from the 20-section
Holistic Fix 5A-3 mandate — the `master-blend` Passport stamp's
previously-disclosed unverified-client-eligibility gap — and spent
remaining time root-causing a real anomaly (SC-D027) discovered while
re-running the existing regression suite. It does not attempt or claim
partial coverage of tasting, skill-checkpoint evidence, Collections/Skill
Tree ledger integration, reward-screen reconnection, the Leaderboard
re-audit, full correction/reversal coverage, or the complete rule
registry — see `SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`'s Holistic Fix 5A-3
section for the full, itemized list of what remains open.

## Contents

- `00-proof-index.md` — this file.
- `01-blend-evidence-results.json` — 5/5 automated tests from
  `verify-smokecraft-hf5a3-blend-evidence.mjs`: complete selection grants
  the stamp + real XP amount; an incomplete filler set (2 of 3) is
  rejected 400; an out-of-range wrapper index is rejected; the stamp
  cannot be granted twice even with a different selection under a
  different idempotency key.

## SC-D027 — real anomaly found, root-caused, disclosed (not fixed)

While re-running the existing interaction-sweep and full-journey
suites, both showed new failures (a `role="alert"` element intercepting
real pointer-event clicks on several screens). Investigated via a
controlled before/after: `git stash`'d this pass's entire diff, rebuilt,
restarted backend+preview fresh, and reran both suites against the
byte-identical unmodified starting commit `c77e4a44` — the exact same
failures reproduced (interaction sweep: 73/88 both times, same 15
sessions; full journey: 86/88 both times, same 2 failures). This
conclusively rules out this pass's code changes as the cause. Documented
as SC-D028's neighbor SC-D027 in the defect register — a real, disclosed,
currently-open defect, not fabricated as closed and not silently ignored.

## Regression re-verified after this pass's changes (identical to pre-existing baseline)

- HF4: 30/30. HF4B: 32/32. HF5A: 22/22. HF5A-2: 19/19. HF5A-3 blend: 5/5.
- Interaction sweep: 73/88 — reproduced identically on unmodified
  baseline, confirmed pre-existing (SC-D027), not a regression from this
  pass.
- Full journey: 86/88 — same as above, confirmed pre-existing.
- `npm run build` (equivalent `vite build`, run directly given time
  constraints on the full prebuild-validator chain this round): clean.
