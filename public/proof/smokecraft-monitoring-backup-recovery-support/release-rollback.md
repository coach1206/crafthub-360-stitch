# Release / Rollback Support — Production Package 5

Extends Package 4's `/api/version` build-manifest identity and `scripts/rollback.sh` — not duplicated here.

## Post-deployment verification checklist
1. `/api/version` reports the expected commit/branch/buildTimestamp.
2. `/api/health/live`, `/api/health/ready`, `/api/health/migrations` all 200.
3. `/api/admin/ops-status` shows GREEN for application/database.
4. Smoke-test one representative flow per major surface (gameplay, checkout, Venue Humidor) — Package 4's deployment smoke test (14/14) covers this.
5. No new SEV-1/2 alerts fire in the 15 minutes post-deploy.

## Operational visibility
Release version, deployment time, migration version, commit hash — all already surfaced by `/api/version` + `/api/health/migrations` (Package 4). Deployment owner is whoever triggered the GitHub Actions run (visible in Actions history). This pass adds `/api/admin/ops-status`'s `latestDeployment` field as a single owner-facing summary point, without re-implementing the underlying identity logic.

## Rollback target / completion
Rollback target = previous known-good commit (identified via GitHub Actions run history + `/api/version` history). Rollback completion is confirmed the same way as post-deployment verification above, run against the rolled-back build.
