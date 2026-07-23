# 11 — Rollback Plan

## What changed in this pass

Exactly two production files, adding one new, additive, non-destructive endpoint:

- `server/controllers/healthController.js` — added `getVersion()`, a safe read-only handler returning `{ service, environment, commit, buildTimestamp }` sourced only from `NODE_ENV`/`RAILWAY_GIT_COMMIT_SHA`/`GIT_COMMIT_SHA`/`RAILWAY_DEPLOYMENT_CREATED_AT`. No secret, credential, internal path, or database value is exposed. Verified locally: `curl /api/version` → `{"success":true,"service":"crafthub-360","environment":"development","commit":null,"buildTimestamp":null}` (both env vars absent locally, honestly reported as `null` rather than fabricated).
- `server/routes/healthRoutes.js` — added `router.get('/version', getVersion)`.

No other production file was touched. No database migration was created or run. No existing route, guard, or business logic was modified.

## Rollback procedure, if ever needed

1. `git revert <this pass's commit>` — safe; the new endpoint has no dependents anywhere else in the codebase (added this pass, not yet consumed by any client code).
2. No database rollback needed (no migration ran).
3. No learner-facing behavior changes — `/api/version` is a new, additive, unauthenticated diagnostic endpoint with no side effects.

## Why the endpoint was added despite the phase being blocked

Provider deployment metadata (Railway dashboard/CLI, GitHub deployment records) was entirely unavailable in this session — not merely insufficient, but completely inaccessible. Per the mandate's own instruction ("If no reliable live commit identifier exists, add the smallest safe version endpoint... Do not modify production code merely to make proof easier when provider metadata already proves the deployed commit"), adding this minimal endpoint was justified: no provider metadata existed to make it redundant, and it is the smallest safe mechanism that would let a *future* session (with either network access or user-supplied curl output) close the deployed-commit gap without needing dashboard/CLI credentials.
