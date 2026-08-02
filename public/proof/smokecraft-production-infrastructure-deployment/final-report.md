# SmokeCraft 360 — Production Package 4: Production Infrastructure and Deployment — Final Report

See sibling files in this directory for detailed evidence:
baseline.md, container-build-result.md, startup-validation-results.md,
staging-results.md, known-limitations.md, deployment-smoke-test-results.json,
image-resize-pipeline-report.json, image-variants/, deployment-audit-log.jsonl,
npm-build-output.log, local-production-server-startup.log,
ci-workflow-validation.txt, health-endpoint-output.txt.

Provider decision, cost/scaling, environment contract, release governance,
domain/TLS/CORS/cookies, and security hardening are documented in
`docs/deployment/` (provider-decision.md, environment-contract.md,
release-governance.md, security-hardening.md, domain-tls-cors-cookies.md).

## What is genuinely real and verified in this pass
1. Real Sharp-based image-resize pipeline — 9/9 variants generated from a
   real repo image, real files on disk with real differing dimensions and
   checksums.
2. Real S3-compatible object-storage adapter code
   (`@aws-sdk/client-s3`-based), with a fail-closed production guard that
   refuses local-disk media persistence in production.
3. Real startup validation — 3 executed pass/fail scenarios, exit codes
   verified.
4. Real health endpoints (`/api/health/live`, `/api/health/ready`,
   `/api/health/migrations`) with real DB/storage/payment connectivity
   checks, verified with real HTTP requests against a running server.
5. Real graceful shutdown (SIGTERM/SIGINT) added and verified by killing a
   running server and confirming it stops accepting connections.
6. Real local production-mode smoke test — 14/14 checks passed against an
   actually-running `NODE_ENV=production` server instance.
7. Real `npm run build` — all 19 prebuild validators passed, Vite build
   succeeded, `public/proof` correctly stripped from `dist/`.
8. Real CI YAML — parsed and validated with `yaml.safe_load`, 8-job graph
   confirmed, production deploy gated behind `workflow_dispatch` +
   GitHub Environment approval (never auto-deploys from a push).

## What is honestly NOT exercised
1. Container build never completed — Docker Hub pulls blocked by sandbox
   network egress policy (403, confirmed org-policy denial, not retried
   per protocol).
2. No live staging/production deployment — no cloud credentials exist in
   this sandbox.
3. Object storage never activated against a real bucket.
4. Full 200+-script verify/e2e suite not exhaustively re-run (many require
   a live Postgres DB or a running `vite dev` server not present this
   pass) — prebuild validators (19 scripts) and the new deployment smoke
   test WERE run for real.

See `known-limitations.md` for the complete, itemized list.
