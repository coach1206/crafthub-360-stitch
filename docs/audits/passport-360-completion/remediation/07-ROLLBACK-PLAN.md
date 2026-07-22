# Remediation 7 — Rollback Plan

**No rollback was executed. This document only records the plan.**

## Commit lineage

| Commit | Description |
|---|---|
| `f5a8b065` | Last known-good commit — 360 Passport Connection Completion, before this remediation |
| (this pass's new commit) | Passport Security and Unified Identity Remediation |

## What changed (no new migration this pass)

- `server/middleware/smokecraftGuestIdentity.js` — cookie `path` broadened from `/api/smokecraft` to `/api`; added `req.smokecraftGuestCookieIdentity` for the linking endpoint.
- `server/routes/passport360SmokeCraftRoutes.js` — rewritten to disable all Phase F.5 endpoints except `/health` (410 responses).
- `server/routes/smokecraftPassportStampRoutes.js` — rewritten to be identity-gated and DB-persisted (was in-memory, unauthenticated).
- `server/services/passport360/passport360SyncService.js` — added `saveFlavorMemory()`, `claimJourneyCompletionStamp()`, `linkGuestToUser()`.
- `server/controllers/passport360SyncController.js` + `server/routes/passport360SyncRoutes.js` — added 3 new endpoints.
- `src/pages/smokecraft/FlavorMemory.jsx` — call target changed to the canonical sync API.
- `src/services/passportService.js` — `getEarnedStampsWithBackend()` rewritten to call the canonical sync API directly.
- `server/controllers/passport360SmokeCraftController.js` — now dead code (unused by the rewritten routes file); left in place, not deleted, to minimize risk.

## No database migration required or created

No schema change was needed — every write uses the existing migration-068 tables and constraints. Rollback is a pure code rollback.

## Rollback method

`git revert` this pass's commit (or `git checkout f5a8b065 -- <affected files>`) fully restores the prior behavior: the Phase F.5 and in-memory passport-stamp routes become active again exactly as they were, `FlavorMemory.jsx`/`passportService.js` revert to their old call targets, and the cookie path narrows back to `/api/smokecraft`. No database cleanup is required — any real stamps/progress rows written through the newly-secured routes during this remediation remain valid, harmless rows in the same schema the prior pass already used.

## Verification after rollback

Re-run: `npm run build`, `GET /api/health`, `verify-passport-360-connection.mjs` (54/54 baseline), and the full SmokeCraft regression battery.

## Conditions that require rollback

- A confirmed defect where the cookie `path` broadening to `/api` causes the guest cookie to be sent somewhere it shouldn't (none found — the JWT itself remains scope/audience-checked regardless of which path receives it, and no other route family reads this specific cookie name).
- A confirmed regression in any previously-completed system caused by this remediation (none found — full regression battery re-run clean).

## Conditions that do NOT require rollback

- The disabled Phase F.5 endpoints now returning `410` for any caller that hasn't been updated — this is the intended, secure outcome, not a defect. No real, still-active caller was left pointing at a disabled endpoint (verified directly).
- The `passport360SmokeCraftController.js` file remaining as unused dead code — harmless, not imported by any active route.
- The disclosed, unchanged eligibility-verification limitation on the SmokeCraft Passport Stamp claim (client-reported `completedSteps`) — a real, pre-existing, explicitly out-of-scope limitation, not introduced by this remediation.
