# Holistic Fix 5C-2B-2 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 40816ceb

## Goal

Connect Golden Box finalized rankings to real, server-authoritative
awards. Scope: Golden Box XP, badges, Passport stamps, award records,
award visibility on finalized results only. No leaderboard beyond the
finalized ranking, no Venue Humidor, no full sweeps.

## Reward infrastructure audited

`golden_box_rewards` (idempotent grant ledger, migration 077, real but
never used for a placement award), `rewardsIntegrationService.js`
(`grantXp`/`grantBadge`/`publishToLeaderboard` — real canonical
wrappers), `xpService.js` (the real, already-wired XP ledger that
`ResultsExperience.jsx` already displayed before this pass),
`passport360SmokeCraftPersistenceService.js` (the real, canonical
SmokeCraft Passport stamp/badge/XP system used by Management Sync),
`xp_award_rules` (a real, provisioned config table — confirmed empty
for `golden_box` across the entire codebase), and the dormant
`handleIssueRewards` route (SC-D062 — accepted a fully client-
controlled XP amount/badge ID with no rule basis; left in place,
unchanged, but never called by the new award pipeline).

## Approved awards found

`first_place` / `second_place` / `third_place` — objective descriptors
of an entry's real, immutable placement from the 5C-2B-1 finalized
ranking. No approved XP amount, badge, or Passport stamp content
exists for Golden Box anywhere in this codebase — see "Unsupported or
missing award rules" below.

## Rules implemented

`AWARD_RULE_ID = 'golden_box_placement_award'`, `AWARD_RULE_VERSION =
1` — versions which real placements (top 3) receive an award record.
Stamped on every award row and canonical event.

## XP result

Genuinely unavailable — no `xp_award_rules` row exists for
`source_type = 'golden_box'`. Every award's `xp_status` is honestly
`'unavailable'`, `xp_transaction_id` is `null`. Verified live: no real
`xp_transactions` row was fabricated for any issued award. The service
is fully wired to call the canonical `xpService.awardXp()` the moment
a real rule exists.

## Badge result

Genuinely unavailable — no golden-box badge catalog entry exists.
`badge_status = 'unavailable'` on every award. Wired to the canonical
`rewardsIntegrationService.grantBadge()`, never invoked today.

## Passport result

Genuinely unavailable — no golden-box Passport stamp catalog entry
exists. `passport_stamp_status = 'unavailable'` on every award. Wired
to the canonical `passport360SmokeCraftPersistenceService.awardPassportStampLive()`,
never invoked today.

## Award-record result

Real, immutable award records issued for exactly the top 3 real
placements from a finalized ranking — verified live with a 4-entry
competition (1st/2nd/3rd received records, 4th received none).

## Duplicate-race result

Both duplicate-issuance-call and two-tab concurrent-issuance race
verified live: exactly one real issuance row and the correct award-
record count in every case.

## Authorization result

Route-level admin-only gate verified live with a real 403 denial for
a non-admin.

## Account-conversion result

Not applicable to this pass in isolation — award issuance derives
entry identity (`user_id`/`guest_reference`) from the already-
converted-safe `golden_box_entries` row (the same identity fields the
5C-1B account-conversion work already made durable across guest→
account conversion); no new identity path was introduced. The existing
account-conversion regression (`verify-smokecraft-hf5c1b-golden-box-api.mjs`)
was re-run clean (26/26) to confirm no regression.

## Cross-device result

Award visibility (`getEntryAward`) is a pure, stateless read scoped by
`competitionId`/`entryId` — the same cross-device-safe pattern already
verified for results in 5C-2B-1 (two independent fetches under the
same identity return identical state). No device-specific or session-
local award state was introduced.

## Result-screen result

`verify-smokecraft-hf5c2b2-awards-browser.mjs`: 10/10 — real
Playwright session covering the awards_pending state, the real Issue
Awards action, the real award title after reload, the honest
"unavailable" XP/badge/stamp copy, an unrelated stranger's honest
handling, keyboard/layout/no console errors. Approved visuals
preserved (additive-only "Your Award" section).

## Defects found and fixed

- **SC-D062**: `handleIssueRewards()` accepted a fully client-
  controlled XP amount and badge ID with zero connection to real
  placement or any approved rule. Dead/unwired beyond its own route.
  Left in place (deleting a live endpoint is out of scope), but the
  new award pipeline never calls it and derives everything from the
  immutable finalized ranking.

Full detail in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`.

## Unsupported or missing award rules

XP amount, badge identity/artwork, and Passport stamp identity/artwork
for Golden Box placements were never approved or configured anywhere
in this codebase. This gap is documented (not silently worked around)
in `SMOKECRAFT_GOLDEN_BOX_JUDGING_RULES.md` and
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`. Only the award RECORD
(placement + rule id/version) is issued; no XP/badge/stamp content was
invented to fill the gap.

## Tests and build

- `verify-smokecraft-hf5c2b2-awards-api.mjs`: 29/29
- `verify-smokecraft-hf5c2b2-awards-browser.mjs`: 10/10
- `scripts/validateSmokecraftGoldenBoxAwardsAuthority.mjs`: 27/27
- `verify-smokecraft-hf5c2b1-results-api.mjs` (results regression): 33/33
- `verify-smokecraft-hf5c2a-judge-assignment-api.mjs` (judging
  regression): 11/11
- `verify-smokecraft-hf5c1b-golden-box-api.mjs` (submission
  regression): 26/26
- `verify-smokecraft-hf5a2-reward-authority.mjs` (core reward-
  authority regression): 19/19
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5c-2b-2/`

## What this pass does NOT cover

The competition leaderboard beyond the finalized ranking already
completed, Venue Humidor, full-route/five-viewport sweeps — explicitly
out of scope per mandate.

## Stage 5 closure-gate handoff

Golden Box's server-authoritative core is now complete end-to-end:
submission (5C-1B) → judge assignment and scorecard scoring (5C-2A) →
results aggregation and final ranking (5C-2B-1) → award issuance
(5C-2B-2). The next stage-closure item is Venue Humidor (explicitly
deferred by every pass in this sequence), plus — if and when a real
Golden Box XP/badge/Passport-stamp rule is approved — populating
`xp_award_rules` and the badge/stamp catalogs to activate the reward
content this pass already wired but left honestly unavailable.
