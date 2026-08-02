# Production Package 4 — Branch & Release Governance

## Deployment branch
`recovery/smokecraft-codex-final` remains the working/integration branch —
**not renamed or deleted** per mandate. Recommend (not yet configured, since
that requires GitHub admin access this sandbox doesn't have):
- Add branch protection: require PR review + passing
  `production-deployment.yml` checks (install-and-lint, validators, build,
  container-build, security-scan, migration-validation) before merge.
- `deploy-staging` job auto-runs on every push to this branch (CD).
- `deploy-production` job only runs on manual `workflow_dispatch` targeting
  `production`, gated by a GitHub Environment named `production` with a
  required reviewer — **never auto-deploys from a push**.

## Release tags
Recommend tagging every production deployment: `prod-YYYYMMDD-<short-sha>`
(e.g. `prod-20260802-20d2a16`). `scripts/recordDeploymentAudit.mjs` writes a
matching JSONL audit entry at deploy time; a human (or a follow-on CI step)
creates the git tag from that same sha.

## Rollback tags
On rollback, tag the sha being rolled *back to* as
`rollback-YYYYMMDD-<short-sha>` so the audit trail shows both the failed
release and the restored one. `scripts/rollback.sh` calls
`recordDeploymentAudit.mjs ... --rollback` to log this automatically; tag
creation itself is a human/CI step (not yet automated in this pass).

## Emergency hotfix process
1. Branch from `recovery/smokecraft-codex-final` at the currently-deployed
   production sha (not the tip, if the tip has unreleased work).
2. Minimal fix, same PR-check gate as any change (no `--no-verify`, no
   skipped checks — a hotfix under pressure is exactly when a broken
   migration or a wildcard-CORS regression is most likely to slip through).
3. Deploy via the same `workflow_dispatch` → production Environment
   approval gate — no separate "break glass" path that skips approval.

## Migration approval process
- Migrations are additive/forward-only in this repo's convention (115
  migrations, sequentially numbered, matching `server/db/rollbacks/` files
  for the destructive ones).
- Any new migration lands in a normal PR, reviewed like code — no
  auto-generated migrations run against production without a human having
  read the SQL.
- `migration-validation` CI job applies every migration against a fresh
  Postgres service container on every PR touching `server/db/migrations/**`
  (see `production-deployment.yml`).

## Production deployment owner
Not a technical control this pass can create (it's an org/people decision) —
documented here as a placeholder for the human operator to name a specific
owner before the first real production deploy. Recommended minimum: the
person who clicks "approve" on the GitHub Environment gate must be someone
other than the PR author for any change touching payments, auth, or
migrations.
