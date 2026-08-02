# Production Package 4 — Deployment Provider Decision

## Selected: Railway (primary), with the codebase kept portable to Render/Fly

**Why Railway, not AWS/GCP/Azure directly:**
- The repo already contains Railway-specific integration points from prior
  packages: `nixpacks.toml`, `RAILWAY_GIT_COMMIT_SHA`/`RAILWAY_GIT_BRANCH`/
  `RAILWAY_DEPLOYMENT_CREATED_AT` read in `vite.config.js` and
  `healthController.js`, `server/scripts/verifyRailwayEnv.js`, and
  `verify-smokecraft-railway-proxy-and-destinations.mjs`. Prior packages
  already made this call — Package 4 confirms it rather than re-deciding
  from zero, per the mandate's "don't assume a hosting provider is already
  selected — check first" instruction (checked: it effectively already is,
  via these integration points, though never formally documented until now).
- Railway bundles app hosting + managed Postgres + managed TLS + GitHub-based
  deploys in one dashboard, at MVP-appropriate cost, with none of AWS/GCP's
  per-service setup overhead (VPC, IAM, ALB, RDS, ACM, ECS/EKS) that this
  project's team size doesn't need yet.
- `trust proxy` in `server/index.js` is already tuned for "1 hop" (Railway's
  edge) — switching providers now would require re-tuning that plus CORS/
  cookie domain assumptions for no functional gain.

**Object storage is deliberately NOT Railway** — Railway has no object
storage product. **Cloudflare R2** is used instead (S3-compatible API, so
the adapter in `objectStorageAdapter.js` also works unmodified against AWS
S3 if a future package needs to switch): zero egress fees (unlike S3),
lower cost than S3 at this scale, and a CDN (Cloudflare) sits naturally in
front of it.

## MVP architecture
- **App hosting**: Railway (Node/Express server, serves built Vite `dist/`
  and the API from one process/port — matches the existing `npm start`
  topology, no separate frontend host needed).
- **Database**: Railway managed Postgres (encrypted connection, automated
  backups included in the platform).
- **Object storage**: Cloudflare R2 (`STORAGE_PROVIDER=r2`), CDN-fronted via
  Cloudflare's built-in CDN in front of the bucket's public bucket domain or
  a custom `media.` subdomain (`STORAGE_CDN_URL`).
- **TLS**: Railway automatic TLS on the app's *.up.railway.app subdomain and
  any custom domain attached to it; Cloudflare-issued TLS in front of R2's
  CDN domain.
- **CI/CD**: GitHub Actions (`.github/workflows/production-deployment.yml`),
  Railway deploys triggered from the pipeline (or Railway's own GitHub
  integration for staging auto-deploy — either is compatible with this repo's
  layout).
- **Environments**: two separate Railway projects/environments (staging,
  production) — separate Postgres instances, separate R2 buckets/prefixes,
  separate Stripe mode, per the environment-separation section below.

## Estimated MVP monthly cost (public list pricing, not a live quote)
| Item | Estimate |
|---|---|
| Railway Hobby/Pro plan (app + Postgres, staging + production) | ~$20–40/mo combined (Railway usage-based, Hobby plan covers light MVP traffic; Pro ~$20/mo base + usage) |
| Cloudflare R2 storage (10s of GB of venue media) | ~$0.15/GB-month storage, $0 egress — likely **<$5/mo** at MVP media volume |
| Cloudflare CDN | $0 (R2 public bucket / Cloudflare CDN in front is free at this tier) |
| Domain registration | ~$10–15/year (one-time-ish, not monthly) |
| **Total estimate** | **roughly $25–50/month** at MVP traffic/media volume |

This is a public-pricing estimate for planning purposes, not a live invoice —
no account was created in this sandbox to get an exact quote.

## Scaling limits / upgrade path
- Railway: vertical scaling (more CPU/RAM per service) and horizontal
  replicas are available on paid plans as traffic grows; Postgres can be
  upgraded to larger managed instances or migrated to Railway's dedicated
  Postgres plans.
- R2: effectively unlimited storage scaling at linear cost, no egress-fee
  cliff (the main reason S3 gets expensive at scale doesn't apply here).
- If Railway's compute ceiling is ever hit, the containerized `Dockerfile`
  in this repo is the portability path — the same image runs unmodified on
  Render, Fly.io, or AWS ECS/Fargate, so this is not a lock-in decision.

## Vendor risk / portability
- **App layer**: portable — real `Dockerfile`, no Railway-proprietary
  runtime API used in application code, env-var-driven config throughout.
- **Database**: standard Postgres — `pg_dump`/`pg_restore` moves it anywhere.
- **Object storage**: R2 speaks the S3 API — `objectStorageAdapter.js`
  already works against AWS S3 by changing `STORAGE_PROVIDER=s3` and
  `STORAGE_ENDPOINT` (or leaving it blank for AWS's default endpoint
  resolution), so this is not an R2 lock-in either.
- **Residual risk**: Railway-specific env vars (`RAILWAY_GIT_COMMIT_SHA` etc.)
  are read with fallbacks to generic equivalents (`GIT_COMMIT_SHA`,
  `VERCEL_GIT_COMMIT_SHA`) precisely so a provider switch doesn't break
  build-identity reporting.
