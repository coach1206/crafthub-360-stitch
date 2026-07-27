# SmokeCraft Rule Registry — Holistic Fix 5A

Generated: Holistic Fix 5A, starting commit `9ea19421`.

## What this document is

A human-readable mirror of the rules the server actually enforces for
session-completion XP, session-tied badge unlock, the one curriculum-
tied Passport stamp, and rank promotion. The underlying database table
`smokecraft_gameplay_rules` (migration 095) exists as the schema for
versioned rule storage, but this pass's rules are **sourced directly
from the existing, already-approved constants**
(`src/constants/smokecraftRewards.js`'s `SESSION_REWARDS`/`SMOKECRAFT_BADGES`/
`SC_RANKS`) rather than duplicated into hand-written database rows —
per this codebase's established "do not introduce a second competing
source of truth" convention (the same reasoning already documented in
`sessionRewardTable.js`'s file header from Holistic Fix 4). All rules
below are implicitly **version 1** (the original, only version that has
ever existed for this reward set); `rule_version` columns on
`smokecraft_awards`/`smokecraft_session_completions` are `NULL` for
every row issued before this versioning concept existed, and will be
populated with an explicit version number the first time any of these
rules actually changes (a real "version 2").

## Session-completion XP rules (24 rules, one per curriculum session)

Source of truth: `SESSION_REWARDS` in `src/constants/smokecraftRewards.js`.
Server enforcement: `getSessionRewardXp(sessionId)` in
`server/services/smokecraft/sessionRewardTable.js` — the ONLY place the
server trusts an XP amount from; never the request body.

| Session ID | XP | Tied badges |
|---|---|---|
| entry | 0 | — |
| enroll | 75 | sc-profile-started |
| identity | 50 | — |
| golden-box | 75 | sc-gold-box-entry |
| mentor | 100 | sc-mentor-pair |
| format | 75 | sc-cigar-format, sc-burn-time |
| wrapper-strength | 75 | sc-wrapper-knowledge |
| seed-soil | 75 | sc-seed-and-soil, sc-origin-knowledge |
| pairing-lab | 75 | sc-pairing-explorer |
| humidor-match | 75 | sc-first-smoke |
| request-purchase | 50 | — |
| cut-toast-light | 50 | sc-cut-and-light |
| first-third | 100 | sc-first-third |
| second-third | 75 | sc-second-third |
| flavor-memory | 75 | sc-flavor-tracker, sc-transition |
| final-third | 75 | sc-final-third |
| scorecard | 100 | sc-cigar-review, sc-scorecard |
| smokecraft-challenge | 75 | sc-challenge |
| second-humidor-match | 75 | sc-second-cigar |
| mini-tasting | 75 | sc-taste-growth |
| final-review | 100 | — |
| passport-stamp | 75 | sc-passport-stamp |
| connections | 50 | sc-connections-access |
| management-sync | 50 | sc-vip-candidate |
| session-complete | 50 | sc-next-season (badge) + **journey-complete (Passport stamp)** |
| rewards | 50 | — |
| achievements | 50 | — |

**Eligibility**: reaching and clicking Continue on the session's own
route (server never re-verifies deeper in-session activity — matches
the pre-existing product design, unchanged this pass).
**Idempotency**: `UNIQUE(guest_reference, session_id)` — a session can
be completed (and its XP/badges/stamp awarded) at most once per
guest/account identity, ever.
**Maximum repeat awards**: 1 (one-time only, no cooldown/frequency
concept applies — completion is binary).

## Rank ladder (1 rule, applies globally)

Source of truth: `SC_RANKS` in `smokecraftRewards.js` (verified aligned
with the pre-existing `RANKS` in `session.js` — **not a newly invented
ladder**, per this mandate's explicit instruction to verify existing
rank names first).

| Rank | XP threshold |
|---|---|
| Novice | 0 |
| Enthusiast | 200 |
| Connoisseur | 500 |
| Aficionado | 900 |

**Promotion rule**: recomputed automatically after every XP-affecting
mutation (`recomputeRankInTx` in `playerStateService.js`). **No
automatic demotion** — a rank promotion event, once recorded, is
permanent (matches the mandate's "no automatic demotion unless an
approved reversal requires it" — no reversal mechanism exists yet, so
demotion never occurs). **Idempotency**: `UNIQUE(guest_reference, rank_label)`.

## Explanation text

Every award response (`POST .../sessions/:id/complete`) includes the
`completion` row (with its real `xp_awarded`), `badgesGranted` (the
real badge award rows, if any), `passportStampGranted` (if any), and
`rankPromotion` (if the rank just changed) — the caller always has a
complete, real, traceable explanation of what happened and why, never a
bare success flag with no detail.
