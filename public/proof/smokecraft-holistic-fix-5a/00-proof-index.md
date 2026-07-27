# Holistic Fix 5A — Proof Index

Starting commit: `9ea19421`

## Scope disclosure

This package's mandate ("one server-controlled event, scoring, reward,
and ranking system for session completion, quiz performance, skill
demonstrations, tasting activities, challenge participation, XP, score,
ranks, badges, Passport stamps, Collections unlocks, Skill Tree
progress, Leaderboard placement") spans far more than the primary
27-session curriculum's completion/badge/rank/leaderboard path this
pass actually converts to full server authority. This pass delivers a
real, tested, working extension of the Holistic Fix 4/4B foundation:

- Server-side badge auto-unlock (was: client-decided, server-recorded).
- Server-side Passport-stamp auto-unlock for the one curriculum-tied
  stamp (was: client-decided, server-recorded).
- Server-side rank computation and promotion history (was: purely
  client-computed display value).
- A real, mock-free leaderboard (was: honestly disclosed as
  unavailable — no shared backend existed).
- Closure of the disclosed mentor dual-ownership defect.

It does **not** convert every gameplay reward path in the codebase to
server-decided eligibility — Collections, Skill Tree, Blend Fault, and
Filler Arrangement were already real and server-authoritative before
this pass (verified compatible, not rebuilt); Challenge Hub and Golden
Box scoring are explicitly deferred to Holistic Fix 5C by this
mandate's own scope boundary; pairing/mentor intelligence is deferred
to 5B; and the Origins-module's `addXP()`/3-stamp-eligibility surface
remains a disclosed, real gap — see
`docs/smokecraft/SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`'s Known Gaps for
the complete, honest accounting.

## What this proof directory contains

- `00-proof-index.md` — this file.
- `01-gameplay-engine-results.json` — automated test results from
  `verify-smokecraft-hf5a-gameplay-engine.mjs`: 22/22 passing, covering
  badge auto-unlock on first completion, no re-grant on replay, Passport-
  stamp auto-unlock, rank promotion at real XP thresholds using the
  existing approved ladder, no duplicate rank-promotion events, honest
  locked-badge state for an inactive guest, real leaderboard data with
  correct ordering, leaderboard privacy (no email leak) and opt-out, a
  two-tab race on a badge-and-rank-granting completion, and historical
  award stability (a replay never recalculates the original award).
- `02-rule-registry.md` / `03-leaderboard-rules.md` — copies of the new
  docs.
- `04-migration-095-schema.sql` — the new schema.
- `05-gameplay-integrity-validator-output.txt` — output of the new
  build-blocking `scripts/validateSmokecraftGameplayIntegrity.mjs`,
  20/20 checks PASS.

## Real defects found and fixed during this pass

1. **Badges/Passport-stamp were client-decided, not server-issued**
   (SC-D024) — the core violation of this mandate's non-negotiable
   rule. Fixed by moving the grant into the same atomic transaction as
   session completion.
2. **Mentor dual-ownership** (SC-D023, disclosed since Holistic Fix 4) —
   closed via a single write path + reactive mirror.
3. **Two pre-existing automated tests had stale badge-count assumptions**
   once real auto-grant functionality existed — investigated, confirmed
   as test staleness (not a regression — the new counts are the correct
   result of a real, working feature), and fixed to assert against
   specific award keys.

## Coverage summary

- **Event types implemented this pass**: `session_completed` (existing,
  extended with automatic badge/stamp/rank side effects),
  `badge_unlocked`, `passport_stamp_awarded`, `rank_changed` — all real
  rows in `smokecraft_awards`/`smokecraft_rank_history`, all idempotent,
  all audited (`smokecraft_award_audit`).
- **Rules created and versioned**: the schema for versioned rules
  (`smokecraft_gameplay_rules`) exists; the actual rule VALUES are
  sourced from the pre-existing, already-approved
  `SESSION_REWARDS`/`SMOKECRAFT_BADGES`/`SC_RANKS` constants (implicitly
  version 1) rather than duplicated into hand-written rows — disclosed
  as a deliberate "single source of truth" choice, not an omission.
- **Scoring**: unchanged from Holistic Fix 4 (session-completion XP,
  already server-owned) — this pass adds the badge/stamp/rank
  consequences of that same real completion event.
- **Rank**: PASS — real promotions verified at the exact existing
  approved thresholds (200/500/900 XP), idempotent, no duplicate
  promotion events, no automatic demotion.
- **Badges**: PASS for the 24 curriculum-session-tied badges.
- **Passport stamps**: PASS for the 1 curriculum-tied stamp
  (`journey-complete`); the 3 Origins-module stamps remain
  eligibility-unverified server-side (disclosed gap).
- **Collections / Skill Tree**: verified compatible, unchanged (already
  real before this pass).
- **Leaderboard**: PASS — real data, correct tie-break, privacy-safe,
  opt-out works, empty/error/offline states honest.
- **Duplicate-race results**: PASS — a two-tab race on a completion
  that grants a badge AND triggers a rank promotion still produces
  exactly one of each.
- **Authorization**: PASS — leaderboard preference is self-service, own
  identity only; no endpoint accepts a client-supplied score/XP/badge/
  rank/stamp value.

## What this proof directory does NOT cover

- Full server-side eligibility verification for the 3 Origins-module
  Passport stamps (recording is idempotent; the underlying activity
  completion is not independently re-verified server-side).
- Conversion of `addXP()`'s direct client-XP-award call sites to server
  authority.
- Challenge Hub / Golden Box judging (explicitly out of scope, deferred
  to Holistic Fix 5C).
- Pairing / mentor intelligence (explicitly out of scope, deferred to
  Holistic Fix 5B).
- A full pixel-positioned redesign of the Leaderboard screen's approved-
  image competitor table to render the new real entries (the honest
  disclosure message now reflects real data instead; a full table
  render was judged out of scope given "no visual redesign").
