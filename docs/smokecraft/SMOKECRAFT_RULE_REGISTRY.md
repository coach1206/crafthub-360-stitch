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

## Holistic Fix 5A-2 update — real seeded rows, quiz/skill-check/named-XP rules

`smokecraft_gameplay_rules` now holds **46 real, seeded, version-1 rows**
(`scripts/seedSmokecraftGameplayRules.mjs`, idempotent, safe to re-run —
`ON CONFLICT (rule_key, version) DO NOTHING`), covering:

- 24 session-completion XP rules (unchanged from the 5A table above).
- 1 rank-ladder rule.
- 1 rule per Knowledge Check module (`quiz-scoring:<moduleId>`) —
  question count, real scoring formula, retry behavior, max repeat XP
  grants (1), evidence requirement (raw responses, never a submitted
  score).
- 1 leaf-challenge tiered-scoring rule (`leaf-challenge-scoring`) — the
  real 5/3/0-tier XP amounts, badge/stamp effects, evidence requirement.
- 7 named one-time XP activity rules (`named-xp:<key>`).
- 1 leaderboard eligibility rule.

Every row's `definition` was copied verbatim from the same pre-existing,
already-approved constants this document's original table already cited
— no new values were invented. A real rule CHANGE, when it happens, ships
as a new version row (the seed script never overwrites an existing
`(rule_key, version)`), and `rule_version` is recorded on the resulting
`smokecraft_activity_attempts`/`smokecraft_awards` rows going forward.

## Holistic Fix 5A-3D update — mini-tasting completion rule

`named-xp:mini-tasting-begin` (seeded in Holistic Fix 5A-2, unchanged
value) is now the completion-XP rule for `MiniTasting.jsx`'s server-
verified tasting completion — the rule row's XP amount is unchanged; the
ELIGIBILITY requirement changed (server now requires a genuine
`selectedCigarId` from its own flight-inventory data, not merely "the
Begin button was clicked"). No new rule row was needed since the amount
itself did not change.

## Holistic Fix 5A-3E update — cultivator evidence rule

Cultivator XP amount is unchanged (50, matching the existing
`cultivation-seed` named-XP value); the ELIGIBILITY requirement changed
— the server now requires real evidence (all 7 cultivation stage ids
submitted, verified against `src/data/cultivationStages.js`) rather than
a bare "Save" click. Enforced in code
(`submitCultivatorEvidence` in `playerStateService.js`), not yet mirrored
into a `smokecraft_gameplay_rules` row (same disclosed pattern as the
master-blend evidence rule from Holistic Fix 5A-3).

## Holistic Fix 5A-3F update — Collections rules

Collections eligibility rules already existed as real, structured
database rows (`smokecraft_collection_items`, migration 087 —
`earn_condition`, `source_record_type` per item) prior to this pass;
this is itself a real, versioned-in-spirit rule catalog (not yet linked
to `smokecraft_gameplay_rules`' `rule_version` scheme — disclosed as a
future integration, not fabricated as done). No values changed this
pass — only the identity/conversion/first-visit defects around it were
fixed, plus the new correction/reversal capability.

## Holistic Fix 5A-3G update (Skill Tree ledger integration)

No new rules added. Skill Tree's 7 `completion_rule` values (seeded in
migration 086) each already map to a real `EVIDENCE_CHECKS` entry in
`skillTreeService.js`; this pass added a build-blocking validator check
(`validateSmokecraftSkillTreeAuthority.mjs`) enforcing that every node's
`completion_rule` has a real evidence check and that the evaluator
throws rather than silently passing on an unmapped rule. Staff
correction of a Skill Tree node reuses the existing generic
`correctionType` field on `smokecraft_reward_corrections` (no new rule
type needed) with the value `'skill_tree'`.

## Holistic Fix 5A-3H update (Leaderboard ledger integration and integrity closure)

No new rules added. The existing tie-breaking rule
(`xp_total DESC, completed_session_count DESC, guest_reference ASC`) is
unchanged; this pass added a build-blocking validator check
(`validateSmokecraftLeaderboardAuthority.mjs`) that ties the documented
rule text in `SMOKECRAFT_LEADERBOARD_RULES.md` to the live SQL `ORDER
BY` clause, so any future drift between the two now fails the build
instead of silently diverging.

## Holistic Fix 5B-1 update (server-authoritative pairing engine)

New: `smokecraft_pairing_rules` (migration 098) — 4 versioned rules
(rule set version 1), a direct port of the pre-existing approved
scoring logic in `src/utils/pairingEngine.js`. See
`SMOKECRAFT_PAIRING_ENGINE_RULES.md` for the full rule table. Every
saved pairing records the `rule_set_version` used, per the mandate's
"historical saved pairings must retain the rule version used"
requirement.

## Holistic Fix 5C-1A update (Challenge Hub scoring authority)

`smokecraft_challenge_definitions` gained a real `rule_version` column
(migration 101), backfilled to version 1 for both active definitions
— a direct, unversioned port of their existing, already-approved
`requirement_config` (no new rule invented). Blend Fault
Identification's existing `ASSESSMENT_VERSION` (already 1, already
versioned since migration 089) is unchanged. `smokecraft_challenge_rewards`
is the new, real, database-enforced idempotency guard for a Challenge
Hub XP award: `UNIQUE (guest_reference, challenge_instance_key)`. The
XP amounts themselves are unchanged — both seeded challenges remain at
the pre-existing, disclosed `xp_reward = 0`; this pass made that
already-approved column's value structurally live for the first time,
it did not introduce a new reward amount.

## Holistic Fix 5C-1B update (Golden Box scoring and persistence audit)

`SUBMISSION_RULE_VERSION = 1` (`entryService.js`) versions the
submission-completeness rule (`validateSubmission()`'s required-
component-types list: wrapper, binder, filler, vitola) — a direct,
unversioned port of the pre-existing, already-approved rule, now
carried on every canonical Golden Box event
(`goldenBoxEventService.js`) so a future rule change is auditable
against exactly which submissions were scored under which version.
No new scoring rule or reward amount was invented this pass.
