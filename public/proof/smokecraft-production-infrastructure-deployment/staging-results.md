# Staging results — NOT EXERCISED (honest disclosure)

No staging deployment occurred in this pass. This sandbox has no Railway/
Render/Fly/AWS account, no R2/S3 credentials, and Docker Hub image pulls
are blocked by network egress policy (see `container-build-result.md`).

What WAS exercised in place of a live staging deployment:
- All infra files validated locally (Dockerfile structure, .dockerignore,
  env contract completeness).
- CI workflow YAML validated for syntax correctness
  (`python3 -c "import yaml; yaml.safe_load(...)"` — see `ci-workflow-validation.txt`).
- Full local production-mode smoke test against a locally-run instance —
  14/14 checks passed (`deployment-smoke-test-results.json`).
- Startup validation proven with 3 real pass/fail scenarios
  (`startup-validation-results.md`).

## Exact checklist for a human to run this for real
1. Create a Railway account/project (or Render/Fly — `Dockerfile` is portable).
2. Create two Railway environments: `staging`, `production`. Attach a managed
   Postgres to each.
3. Create a Cloudflare account, enable R2, create two buckets (or one bucket
   with `STORAGE_KEY_PREFIX=staging` / `production`).
4. Generate R2 API token (scoped to that bucket only) → set
   `STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY`/`STORAGE_ENDPOINT` in
   each Railway environment's variables.
5. Set `JWT_SECRET`/`FOUNDER_CHALLENGE_SECRET`/`SESSION_SECRET` per
   environment via `openssl rand -hex 32` — never share the same secret
   across staging and production.
6. Set `CORS_ORIGIN`/`APP_PUBLIC_URL` to each environment's real Railway
   (or custom) domain.
7. Set `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` — test-mode keys for
   staging, live-mode for production (see `ALLOW_STRIPE_TEST_IN_PRODUCTION`
   guard in `docs/deployment/environment-contract.md`).
8. Connect the GitHub repo to Railway (or wire `RAILWAY_TOKEN` into
   `.github/workflows/production-deployment.yml`'s deploy-staging job).
9. Add a GitHub Environment named `production` with a required reviewer,
   matching the `deploy-production` job's `environment: production` gate.
10. Push to `recovery/smokecraft-codex-final` → staging auto-deploys →
    verify `scripts/verify-smokecraft-production-deployment.mjs` passes
    against the real staging URL (`DEPLOY_TARGET_URL=https://staging....`)
    → trigger `workflow_dispatch` with `target=production` → approve the
    Environment gate → production deploys.
