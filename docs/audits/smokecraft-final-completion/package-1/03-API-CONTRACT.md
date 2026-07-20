# API Contract — Package 1

Mounted at `/api/smokecraft/golden-box` (`server/routes/goldenBoxRoutes.js`).
Guest-facing routes reuse the SmokeCraft guest-identity middleware
(Management Sync, Package B) — same HttpOnly cookie, same JWT scheme, no
second identity system. Administrator/judge routes reuse `requireAuth`
+ `requireRole`.

| Method | Path | Auth | Purpose | Key error codes |
|---|---|---|---|---|
| POST | `/competitions` | admin | Create competition | `invalid_scope`, `scope_venue_id_required` |
| GET | `/competitions` | public | List competitions (filterable by scope/status) | — |
| GET | `/competitions/:competitionId` | public | Get one competition | `competition_not_found` (404) |
| POST | `/competitions/:competitionId/transition` | admin | Lifecycle transition | `invalid_transition_from_X_to_Y` (409) |
| POST | `/competitions/:competitionId/eligibility` | guest/user identity | Evaluate + persist eligibility | — |
| POST | `/competitions/:competitionId/entries` | guest/user identity | Create/resume draft entry | `guest_reference_required` |
| GET | `/entries/:entryId` | guest/user identity | Get entry (recipe redacted unless authorized) | `entry_not_found` (404) |
| PATCH | `/entries/:entryId/draft` | guest/user identity | Save draft version | `entry_locked_cannot_edit` (409) |
| POST | `/entries/:entryId/submit` | guest/user identity | Submit for judging | `duplicate_submission` (409), `submission_closed` (409), `validation_failed:...` (422) |
| POST | `/entries/:entryId/withdraw` | guest/user identity | Withdraw | `withdrawal_not_allowed_in_current_status` |
| POST | `/competitions/:competitionId/entries/:entryId/judges` | admin | Assign judge | — |
| POST | `/entries/:entryId/scorecard` | authenticated (judge) | Submit human scores | `judge_not_assigned` (403), `invalid_category:X`/`invalid_score:X` (400), `scorecard_already_submitted` (409) |
| GET | `/competitions/:competitionId/entries/:entryId/results` | authenticated | Aggregate result | — |
| POST | `/entries/:entryId/ai-analysis` | guest/user identity | Request AI educational analysis | `invalid_analysis_type` |
| GET | `/entries/:entryId/ai-analysis` | guest/user identity | List analyses | — |
| GET | `/xp/history` | guest/user identity | XP balance + transaction history | — |
| POST | `/entries/:entryId/rewards` | admin | Issue XP/badge/leaderboard rewards | `recipe_private` n/a here — reward-specific errors bubble from the underlying service |

## Response shape

All responses: `{ success: boolean, ...data }` on success, `{ success: false, error: <code> }` on failure — matching every prior package's convention in this codebase. No raw Postgres error text is ever returned (all errors pass through `sendError()`'s known-code mapping in the controller, falling back to a generic `internal_error` for anything unmapped).

## Rate limiting

`readLimiter` (60/min), `writeLimiter` (30/min) — same `express-rate-limit`
tiers already used by Management Sync and Venue Management, no new
library.
