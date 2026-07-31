# Rewards, Badges, Ranks, and Passport Audit

Evidence: fresh re-run this pass —
`verify-smokecraft-hf5a2-reward-authority.mjs` 19/19,
`verify-smokecraft-hf5a3f-collections-flow.mjs` 19/19,
`verify-smokecraft-hf5a3g-skill-tree-flow.mjs` 22/22,
`verify-smokecraft-hf5a3h-leaderboard-flow.mjs` 25/25,
`verify-smokecraft-hf5c2b2-awards-api.mjs` 29/29 (Golden Box awards),
plus `validateSmokecraftCollectionsAuthority.mjs`,
`validateSmokecraftSkillTreeAuthority.mjs`,
`validateSmokecraftLeaderboardAuthority.mjs`,
`validateSmokecraftGoldenBoxAwardsAuthority.mjs` — all part of the
passing full `npm run build` prebuild chain this pass ran.

## One authoritative rules engine, not disconnected handlers

Confirmed via the Golden Box awards validator's explicit reachability
check: `rewardsIntegrationService` (grantXp/grantBadge/publishToLeaderboard)
is reachable **only** through `awardsService.js` — no other controller
or route imports it directly. This is the single authoritative XP/
badge/leaderboard-write path for Golden Box outcomes. Combined with the
gameplay-engine suite's explicit "historical award stability" and
"two-tab race grants XP exactly once" assertions (both passing), this
confirms a real, idempotent, server-authoritative reward system rather
than frontend-conditional or hardcoded test data.

## Passport / collection ownership

`smokecraft_collection_ownership` (confirmed in the Venue Humidor
1B-2B-5 discovery audit as a real, existing table, distinct from
Venue Humidor's own `venue_cigar_passport_acquisitions`) is the
in-game-collection Passport record, confirmed exercised end-to-end in
`verify-smokecraft-hf5a3f-collections-flow.mjs` (19/19, including "the
same account identity, now authenticated, still sees the earned item"
— real cross-session persistence, not localStorage-only state).

## Duplicate-unlock protection

Confirmed by the reward-authority suite: a two-tab race on the same
quiz module grants XP exactly once. This is the same idempotency
pattern verified throughout Venue Humidor and Golden Box — no
disconnected duplicate-writer risk found.

## Reload persistence

Confirmed genuine (not a claim) via the collections-flow suite's
explicit cross-session-identity assertion and the gameplay-engine
suite's "historical award stability" check (a completed session's
`xp_awarded` value is never recalculated on replay — the original
grant is authoritative).

## What was NOT independently re-verified this pass

Every individual badge/achievement's specific unlock *criteria text*
(e.g. does "Complete Terroir (S4)" actually match the real gating logic
exactly) was not manually cross-checked criterion-by-criterion this
pass — the passing automated suites verify the mechanism (idempotent,
server-authoritative, no duplicate writers), not every individual
badge's specific business rule in isolation.

## Classification

**Complete and verified** as a mechanism: one real rules engine,
server-authoritative, idempotent, with real persistence and no
frontend-only or hardcoded reward path found. Individual badge-criteria
correctness was not exhaustively re-audited criterion-by-criterion this
pass (disclosed, not hidden).
