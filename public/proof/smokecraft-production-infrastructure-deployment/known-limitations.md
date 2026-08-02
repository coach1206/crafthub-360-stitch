# Known limitations — Production Package 4

## Carried forward (not claimed resolved)
- Mobile/tablet letterboxing (pre-existing, out of scope this pass).
- Golden Box Rules text overlap (pre-existing, out of scope this pass).
- Session 25 badge/category breakdown partially local (pre-existing).
- POS360 lacks dedicated e2e production proof beyond this pass's basic
  route-smoke check (`/api/pos360/production-readiness` returns <500).
- E.A.T. 360 lacks dedicated e2e production proof beyond this pass's basic
  route-smoke check (`/api/eat/smokecraft/status` returns <500).
- Higher-tier NOVEE/remote-control surfaces remain placeholders.
- Stripe live credentials not exercised (no real Stripe account here).
- External licensed-image imports not exercised.

## New this pass
- **Container build not actually executed** — Docker Hub pulls are blocked
  by network egress policy in this sandbox (see `container-build-result.md`).
  Dockerfile is structurally reviewed and partially parsed by buildkit, but
  never produced a running container image or measured image size.
- **Staging/production deployment not exercised** — no cloud accounts exist
  here (see `staging-results.md` for the exact human checklist).
- **Object storage adapter not activated against a live bucket** — the R2/S3
  code is real (`@aws-sdk/client-s3`) and its `healthCheck()`/`upload()`
  logic was exercised with fake-but-shaped credentials (correctly reports
  `activated:true, ok:false` since the bucket doesn't exist) — never against
  a real R2 bucket.
- **Full 200+-script verify/e2e regression suite was NOT re-run in full**
  this pass — many of those scripts require a live Postgres connection
  string this sandbox doesn't have (`DATABASE_URL` pointed at a real
  running Postgres), or a running `vite dev` server (`final-acceptance.mjs`
  specifically requires the dev server, which was not left running
  alongside the production-mode smoke test). What WAS verified for real:
  every `npm run prebuild` validator (19 validator scripts, all passed,
  full output in `npm-build-output.log`), the new
  `verify-smokecraft-production-deployment.mjs` (14/14), and the 3
  real startup-validation scenarios. This is a genuine gap versus the
  mandate's item 23 ask for exhaustive regression — disclosed rather than
  claimed complete.
- **Scheduled/background jobs** (`server/scripts/runScheduledJobs.mjs`) are
  real, idempotent SQL against tables that may not all exist yet in every
  environment (guarded with `.catch()` to degrade gracefully) — not proven
  against a populated production dataset with real expired holds/stale
  payments to act on.
- **Signed direct-upload flow for object storage** (client uploads straight
  to R2 via a pre-signed URL) was not implemented — uploads still proxy
  through the server, which is safe but not the most scalable pattern;
  documented as a follow-on, not fabricated as done.
