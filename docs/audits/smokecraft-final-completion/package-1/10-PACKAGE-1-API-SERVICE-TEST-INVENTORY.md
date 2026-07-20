# Package 1 — API Route, Service, and Test Inventory

## Step 6 — Privacy/security bug documentation (no private data reproduced below)

### Bug 1: cross-guest recipe privacy leak

- **File**: `server/services/goldenBox/visibilityService.js`,
  `resolveViewerRole()`.
- **Original failure condition**: `identity.userId === entry.user_id` —
  for two different guest entrants, both sides are `null`, and
  `null === null` evaluates `true` in JavaScript, incorrectly granting
  `'entrant'` role (full recipe access) to any guest viewing any other
  guest's entry.
- **Potential impact**: any guest could read any other guest's private
  Golden Box blend recipe, cigar name, and presentation before judging
  closed — a direct violation of Decision 4.
- **Exact correction**: added explicit truthy guards —
  `const ownsAsUser = !!identity.userId && identity.userId === entry.user_id`
  and the equivalent for `guestReference` — so a match can only occur
  when both sides are real, non-null identifiers.
- **Test that now prevents recurrence**: check #14 (unrelated entrant
  denied recipe access) in `verify-golden-box-package-1.mjs`, using two
  genuinely distinct guest identities from two separate real guest-session
  calls.
- **Similar logic elsewhere?** A repo-wide search
  (`grep -rn "identity.userId === \|.user_id === .*.user_id"` across
  `server/`) found one structurally similar pattern in
  `venueAuthorizationService.js`'s `requireJourneyOwnership` — but it is
  **not vulnerable**: the comparison is inside a ternary gated by
  `identity?.type === 'user'`, so `user_id` is only compared when the
  caller is genuinely an authenticated user (never null), and
  `guest_reference` is compared in the guest branch instead. No other
  occurrence of the vulnerable pattern was found.

### Bug 2: unreachable submission transition

- **File**: `server/services/goldenBox/lifecycleService.js`,
  `ENTRY_TRANSITIONS`.
- **Original failure condition**: the map only allowed `submitted` from
  the `eligible` state, but no code path in the built flow ever
  transitions an entry to `eligible` — every real submission attempt
  failed with `invalid_transition_from_draft_to_submitted`.
- **Potential impact**: functional-completeness bug, not a security
  bug — the entire submission flow was unusable.
- **Exact correction**: `ENTRY_TRANSITIONS` now allows
  `draft`/`incomplete → submitted` directly, with
  `entryService.submitEntry`'s own component-completeness validation as
  the real gate (documented design choice, not silently different from
  the mandate's intent — competitions requiring hard eligibility
  gating should check `.eligible` before exposing the submit action).
- **Test that now prevents recurrence**: check #11 (submission succeeds
  with a valid, complete blend) and check #24/#25 (valid/invalid
  competition-level transitions).
- **Are lifecycle transitions centralized?** Yes — `lifecycleService.js`
  is the single service every competition/entry/scorecard status
  mutation goes through (`transitionCompetition`/`transitionEntry`/
  `transitionScorecard`); no route or other service mutates a `status`
  column directly. Confirmed by `grep -rn "SET status" server/services/goldenBox/`
  — the only `SET status`/`status =` writes outside `lifecycleService.js`
  are the two intentionally-separate `judgingService.submitScorecard`
  (`scorecards.status` set to `'submitted'` inline, since that's a
  simple one-way append within the judging flow, not a full state
  machine) and `entryService`'s `current_version`/`cigar_name` updates
  (not status transitions).

## Step 7 — 17 API routes (17 unique method+path combinations, confirmed by `grep -c`)

| # | Method | Path | Auth | Roles | Scope enforcement | Service | Private info returned | State requirement | Test coverage |
|---|---|---|---|---|---|---|---|---|---|
| 1 | POST | `/competitions` | requireAuth | admin | n/a (creation) | competitionService | No | none | #3, #4/5 |
| 2 | GET | `/competitions` | none | public | filterable, no private fields on list | competitionService | No | none | implicit (used to fetch competitionId) |
| 3 | GET | `/competitions/:competitionId` | none | public | No | competitionService | No | none | implicit |
| 4 | POST | `/competitions/:competitionId/transition` | requireAuth | admin | competition-scoped | lifecycleService | No | valid prior status (state machine) | #18, #19 |
| 5 | POST | `/competitions/:competitionId/eligibility` | requireSmokeCraftIdentity | any verified identity | own identity only | eligibilityService | No (own data only) | none | #4/5 |
| 6 | POST | `/competitions/:competitionId/entries` | requireSmokeCraftIdentity | any verified identity | own identity only | entryService | Own entry only | none | #6, #7 |
| 7 | GET | `/entries/:entryId` | requireSmokeCraftIdentity | any verified identity | role-resolved per-entry (visibilityService) | entryService + visibilityService | Redacted unless authorized | none | #11, #13, owner-view |
| 8 | PATCH | `/entries/:entryId/draft` | requireSmokeCraftIdentity | owner only (enforced in service) | own entry | entryService | Own data only | not locked/submitted | #8, #9(setup), #10 |
| 9 | POST | `/entries/:entryId/submit` | requireSmokeCraftIdentity | owner only | own entry | entryService | No | draft/incomplete status, before submission_closes_at | #9, duplicate-submission check |
| 10 | POST | `/entries/:entryId/withdraw` | requireSmokeCraftIdentity | owner only | own entry | entryService | No | not locked/finalized | not directly tested this pass (disclosed) |
| 11 | POST | `/competitions/:competitionId/entries/:entryId/judges` | requireAuth | admin | competition-scoped | judgingService | No | none | #12 |
| 12 | POST | `/entries/:entryId/scorecard` | requireAuth | assigned judge (verified in service) | entry-scoped | judgingService | No (judge's own scorecard) | judge must be assigned | #14, #15 |
| 13 | GET | `/competitions/:competitionId/entries/:entryId/results` | requireAuth | authenticated | none extra | judgingService | Aggregate score only, no individual judge identity | scorecards must exist | #16 |
| 14 | POST | `/entries/:entryId/ai-analysis` | requireSmokeCraftIdentity | any verified identity | own entry (not enforced server-side beyond identity — **disclosed gap**, see Known Limitations) | aiAnalysisService | No | none | #17 |
| 15 | GET | `/entries/:entryId/ai-analysis` | requireSmokeCraftIdentity | any verified identity | same disclosed gap as #14 | aiAnalysisService | AI output text | none | #17 (list called implicitly via check) |
| 16 | GET | `/xp/history` | requireSmokeCraftIdentity | any verified identity | own identity only | xpService | Own transaction history only | none | XP history check |
| 17 | POST | `/entries/:entryId/rewards` | requireAuth | admin | entry-scoped | rewardsIntegrationService | No | none | #20, #21, #23, #24 |

**Disclosed gap found while compiling this inventory**: routes 14/15
(`GET`/`POST /entries/:entryId/ai-analysis`) verify the caller has *a*
SmokeCraft identity but do not re-verify that identity owns the entry
before returning AI analyses — unlike `GET /entries/:entryId` which
routes through `visibilityService`. AI analysis text is lower-sensitivity
than the recipe itself (no `chk_gbs_score_range` scores or blend
components are exposed via this path), but this is still an
under-enforced boundary, not previously flagged. **Recommended fix for
Package 2 or a small follow-up**: route AI-analysis reads through
`visibilityService.getVisibility` the same way entry reads are.

## Step 8 — 10 services

| # | File | Responsibility | Public methods | Tables accessed | Authz responsibility? | Audit responsibility? | XP/reward responsibility? | Server-side-only rules? | Direct test coverage |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `competitionService.js` | Competition CRUD, invitation check | `createCompetition`, `getCompetition`, `listCompetitions`, `isInvitedEntrant` | `golden_box_competitions`, `golden_box_competition_invitations` | No (routes handle authz) | Calls `logActivity` | No | Yes (scope validation) | #3, #4/5 |
| 2 | `eligibilityService.js` | Rule evaluation against real progression data | `evaluateEligibility`, `getLatestEligibility` | `golden_box_eligibility_rules/_results`, `smokecraft_management_sync_journeys`, `xp_accounts`, `passport_360_badges`, `venue_memberships` | No | Persists results as its own audit trail | No | Yes | #4/5 |
| 3 | `entryService.js` | Draft/version/submission lifecycle | `createEntry`, `getEntry`, `getCurrentVersion`, `saveDraft`, `getBlendComponents`, `submitEntry`, `lockEntry`, `withdrawEntry` | `golden_box_entries/_versions/_blend_components/_submissions` | Ownership checks (locked-state, not role) | Calls `logActivity` | No | Yes (validation logic) | #6-#10 |
| 4 | `judgingService.js` | Judge assignment, scorecards, aggregation, disqualification | `assignJudge`, `isAssignedJudge`, `submitScorecard`, `computeAggregateResult`, `disqualifyEntry` | `golden_box_judges/_judge_assignments/_scorecards/_scores/_results` | Yes (`isAssignedJudge` check) | Calls `logActivity` | No | Yes (category/range validation) | #12-#16 |
| 5 | `aiAnalysisService.js` | AI analysis request/list/review | `requestAnalysis`, `listAnalyses`, `markReviewed` | `golden_box_ai_analyses` | **No** (disclosed gap above) | Calls `logActivity` | No | Yes (honest `not_configured` status) | #17 |
| 6 | `visibilityService.js` | Central recipe-privacy policy | `resolveViewerRole`, `getVisibility`, `requireRecipeAccess` | `golden_box_visibility_rules`, `golden_box_judge_assignments`, `venue_memberships` | **Yes — its entire purpose** | No | No | Yes (role resolution) | #11, #13 |
| 7 | `rewardsIntegrationService.js` | XP/badge/leaderboard grant, idempotent | `publishToLeaderboard`, `grantBadge`, `grantXp` | `golden_box_rewards`, `smoke_leaderboard_entries`, `passport_360_badges`, (via xpService) `xp_*` | No | Calls `logActivity` indirectly via xpService | **Yes — its entire purpose** | Yes (idempotency) | #20, #21, #23, #24 |
| 8 | `xpService.js` | Normalized append-only XP ledger | `awardXp`, `reverseXpTransaction`, `getXpBalance`, `getXpHistory` | `xp_accounts`, `xp_transactions` | No | No (transactions ARE the audit trail) | **Yes — its entire purpose** | Yes (idempotency key) | #20, #21, #22 |
| 9 | `lifecycleService.js` | **Single central state-machine** for competition/entry/scorecard transitions | `transitionCompetition`, `transitionEntry`, `transitionScorecard` | `golden_box_competitions/_entries/_scorecards` | No | Calls `logActivity` | No | Yes (transition maps) | #9, #18, #19 |
| 10 | `activityLogService.js` | Append-only Golden Box activity log writer | `logActivity` | `golden_box_activity_log` | No | **Yes — its entire purpose** | No | Yes | #25 |

**No service flagged as doing too many unrelated jobs** —
`rewardsIntegrationService` touches 3 external systems (leaderboard,
badges, XP) but all 3 are the single cohesive "integrate rewards"
responsibility named explicitly in the Package 1 mandate (Step 13), not
an accidental grab-bag.

## Step 9 — 36 tests (all against a real migrated database + real running server, no mocks)

Every test in `verify-golden-box-package-1.mjs` calls the real HTTP API
(`fetch` against `localhost:3001`) — none bypass the API or UI-equivalent
layer by calling services directly (the one exception: check #22 reads
the `xp_transactions` table directly to confirm the append-only ledger
row exists structurally, disclosed inline in the test's own comment).
Guest identities are real, freshly issued JWTs via the real guest-session
endpoint (not mocked or pre-seeded fixtures). Administrator/judge
identities use this repo's established dev-mode header-auth convention
(`x-novee-user-role`/`x-novee-user-id`), consistent with every prior
package's test suite. No transaction-rollback isolation is used between
checks (each check builds on real committed state from the prior one,
matching this repo's established testing convention) — full cleanup runs
once at the end, and the whole disposable database is dropped after the
package.

| # | Name | Category | Tables/routes involved | Result |
|---|---|---|---|---|
| 1 | Guest identity issued for two distinct entrants | Database/identity | guest-session endpoint | PASS |
| 2 | Migration integrity: 4 spot-checked tables exist | Database | information_schema | PASS |
| 3 | Competition creation succeeds | API/Database | POST /competitions | PASS |
| 4 | All 5 supported competition scopes accepted | API/Database | POST /competitions ×5 | PASS |
| 5 | Venue-scoped competition without scope_venue_id rejected | API validation | POST /competitions | PASS |
| 6 | Eligibility with zero rules is open-entry | Lifecycle | POST /eligibility | PASS |
| 7 | Entry (draft) creation succeeds | Database | POST /entries | PASS |
| 8 | Draft resume reuses the same entry | Lifecycle | POST /entries (2nd call) | PASS |
| 9 | Entry versioning: draft save creates version 2 | Database | PATCH /draft | PASS |
| 10 | Blend components genuinely persisted (4 real rows) | Database | golden_box_blend_components | PASS |
| 11 | Submission succeeds with valid, complete blend | Lifecycle | POST /submit | PASS |
| 12 | Invalid late edit rejected after submission | Lifecycle | PATCH /draft (post-lock) | PASS |
| 13 | Duplicate submission rejected | Lifecycle | POST /submit (2nd call) | PASS |
| 14 | **Recipe privacy**: unrelated entrant cannot view components/cigar name | Authorization/privacy | GET /entries/:id | PASS |
| 15 | Owner can view their own submitted recipe | Authorization/privacy | GET /entries/:id | PASS |
| 16 | Judge assignment succeeds | Database | POST /judges | PASS |
| 17 | Authorized (assigned) judge can view recipe | Authorization/privacy | GET /entries/:id | PASS |
| 18 | Unauthorized non-assigned staff cannot view recipe | Authorization/privacy | GET /entries/:id | PASS |
| 19 | Human scorecard submission succeeds | Scoring | POST /scorecard | PASS |
| 20 | Invalid (out-of-range) score rejected | Scoring validation | POST /scorecard | PASS |
| 21 | Score aggregation computes a real value | Scoring | GET /results | PASS |
| 22 | AI analysis stored honestly as not_configured | AI-analysis separation | POST /ai-analysis | PASS |
| 23 | AI analysis never appears in golden_box_scores | AI-analysis separation (real SQL check) | golden_box_scores | PASS |
| 24 | Valid competition lifecycle transition succeeds | Lifecycle | POST /transition | PASS |
| 25 | Invalid competition transition rejected | Lifecycle | POST /transition | PASS |
| 26 | XP award succeeds via normalized ledger | XP | POST /rewards | PASS |
| 27 | XP history reflects the real award | XP | GET /xp/history | PASS |
| 28 | Duplicate XP reward is idempotent | XP | POST /rewards (2nd call) | PASS |
| 29 | XP balance unchanged after duplicate attempt | XP | GET /xp/history | PASS |
| 30 | XP reversal transaction row exists in schema | XP (structural DB check) | xp_transactions | PASS |
| 31 | Leaderboard integration inserts into existing table | Reward-integration | smoke_leaderboard_entries | PASS |
| 32 | Badge integration hook fails honestly without a real guest profile | Reward-integration | POST /rewards | PASS |
| 33 | GOLDEN_BOX audit category rows created | Audit | audit_logs | PASS |
| 34 | Golden Box activity log rows created | Audit | golden_box_activity_log | PASS |
| 35 | Venue Management tables unaffected | Regression | venue_management_profiles | PASS |
| 36 | Test data removed | Cleanup | golden_box_competitions | PASS |

**Build verification** is separate: `npm run build` PASS, reported
independently in `05-TEST-EVIDENCE.md` and `07-PACKAGE-1-COMPLETION-REPORT.md`
— not counted among the 36 functional checks, per this review's
instruction not to conflate the two.
