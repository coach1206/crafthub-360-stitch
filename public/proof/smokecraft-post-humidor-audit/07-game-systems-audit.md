# Core Game-System Audit — Score Tallying, Pairing, Mentor, Badges/Passport

This section synthesizes the four locked gameplay systems required by
the mandate. Detailed per-system evidence lives in the companion
documents (`06-golden-box-audit.md` for scoring within Golden Box,
`08-mentor-engine-audit.md`, `09-pairing-engine-audit.md`,
`11-rewards-passport-audit.md`); this document answers the specific
"one authoritative service vs. several disconnected systems" question.

## Score tallying — one authoritative source, confirmed

Evidence this pass: `verify-smokecraft-hf5a-gameplay-engine.mjs` 22/22
including the explicit "replaying a completed session's completion
returns the ORIGINAL xp_awarded value, never recalculated" assertion —
scores are written once, authoritatively, and never silently
recomputed on replay. `verify-smokecraft-hf5a2-reward-authority.mjs`
19/19 confirms a two-tab race grants XP exactly once. Golden Box scoring
(`hf5c2a-scorecard-api.mjs`, 18/18) confirms the `golden_box_entry_scored`
event carries the real server-computed weighted total — not a
client-submitted score. These are two separate domains (curriculum XP
vs. Golden Box competition scoring) that intentionally do NOT share one
literal function, but both independently enforce the same
"server-computed, idempotent, replay-safe" invariant — this is
consistent architecture, not duplicate/conflicting scoring logic. No
frontend-only or hardcoded XP value was found in either test suite.

## Cigar and beverage pairing — see `09-pairing-engine-audit.md`

Real, server-authoritative, rule-based engine; real beverage catalog
does not exist (honestly disclosed, not fabricated).

## Mentor engine — see `08-mentor-engine-audit.md`

Fully functional, guest-scoped, real fallback for unset voice API key.

## Badges and Passport unlocks — see `11-rewards-passport-audit.md`

One real rules engine (`awardsService.js` for Golden Box outcomes,
plus the curriculum's own reward-authority path for XP/badges),
idempotent, no duplicate writer found.

## Cross-system findings

- **Leaderboard** (`hf5a3h-leaderboard-flow.mjs`, 25/25, includes "a
  negative offset is server-side clamped to 0") is driven by real
  totals, not a disconnected display — confirmed by the same suite that
  exercises the real ranking/pagination logic against actual recorded
  scores.
- **Tie-breakers**: confirmed present specifically within Golden Box
  results (`hf5c2b1-results-api.mjs`, 33/33, "the canonical
  golden_box_ranking_finalized event carries the real
  competition/rank/tie-break/result-version fields"). Tie-breaker logic
  for the curriculum-level leaderboard (non-Golden-Box XP ranking) was
  not separately located or verified this pass — flagged as an open
  question for a future pass, not asserted as either present or absent
  without evidence.
- **Audit history**: every domain (curriculum XP, Golden Box scoring/
  results/awards, mentor voice/narration, pairing) writes to a real,
  append-only, idempotent event log — either the shared
  `smokecraft_progression_events` ledger or Golden Box's own dedicated
  event tables — confirmed via the passing suites' explicit event-shape
  assertions in each domain.

## Classification

**One coherent, server-authoritative architecture** across score
tallying, pairing, mentor, and rewards/Passport — not several
disconnected, frontend-driven, or hardcoded systems. The only genuinely
open sub-question is whether a curriculum-level (non-Golden-Box)
leaderboard tie-breaker rule exists and is tested; this is a narrow,
specific, disclosed gap, not a systemic architecture problem.
