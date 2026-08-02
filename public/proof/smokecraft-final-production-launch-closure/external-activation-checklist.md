# External Activation Checklist

None of these have been exercised in this sandbox — no external
account or credential is available here. Each item: owner / credential
needed / config location / validation command / rollback / proof
required before activation.

## Railway account/project
- Owner: Deployment owner (placeholder)
- Credential: Railway project token
- Config: `railway.json` / `Dockerfile` (Package 4, unchanged)
- Validate: `railway up --detach` then hit `/api/health/ready`
- Rollback: `railway rollback` to prior deployment
- Proof required: reachable Railway URL returning 200 on `/api/health/ready`

## Managed PostgreSQL
- Owner: Deployment owner
- Credential: managed `DATABASE_URL`
- Config: env var, injected via Railway/host secrets, never committed
- Validate: `node scripts/verify-smokecraft-backup-restore.mjs --fresh` against the managed instance
- Rollback: point `DATABASE_URL` back at prior instance; restore from last backup
- Proof required: migrations run cleanly (118/118), restore cycle passes 20/20 against the managed instance

## Cloudflare R2 (object storage)
- Owner: Deployment owner
- Credential: R2 access key/secret, bucket name, endpoint
- Config: media adapter env vars (Package 1)
- Validate: upload+resize+public-read round trip via the existing Sharp pipeline
- Rollback: revert to prior bucket / disable public media temporarily
- Proof required: real bucket object retrievable over HTTPS, variant files present

## CDN / custom domain
- Owner: Deployment owner
- Credential: DNS access, TLS cert issuance
- Config: DNS records, reverse proxy / CDN config
- Validate: `curl -I https://<domain>/api/health/live`
- Rollback: DNS revert
- Proof required: TLS-valid public response

## Stripe live keys
- Owner: Payments owner
- Credential: `STRIPE_SECRET_KEY` (live), `STRIPE_PUBLISHABLE_KEY` (live)
- Config: env vars, never committed (Package 2 adapter boundary)
- Validate: `npm run verify:stripe-env` in live mode, then a real $0.50 test charge with a real card
- Rollback: revert to test-mode keys
- Proof required: one real live-mode charge + refund cycle, receipt retrievable

## Stripe webhook secret
- Owner: Payments owner
- Credential: `STRIPE_WEBHOOK_SECRET` (live endpoint)
- Config: env var; endpoint registered in Stripe dashboard
- Validate: Stripe CLI `stripe trigger` against the live endpoint, confirm signature verification
- Rollback: disable the live webhook endpoint
- Proof required: signed webhook accepted, unsigned rejected (already proven in sandbox with test keys)

## Sentry
- Owner: Monitoring owner
- Credential: Sentry DSN
- Config: env var, error-boundary wiring (already present, currently no-ops without DSN)
- Validate: trigger a test error, confirm it appears in Sentry
- Rollback: unset DSN
- Proof required: real captured event in the Sentry project

## Uptime monitor
- Owner: Monitoring owner
- Credential: uptime-provider API key or public check URL
- Config: point at `/api/health/live`
- Validate: provider dashboard shows "up"
- Rollback: pause the check
- Proof required: 24h of real uptime-provider history

## PagerDuty / alert channel
- Owner: Monitoring owner
- Credential: integration key
- Config: alert routing from uptime monitor / Sentry
- Validate: trigger a test page
- Rollback: disable integration
- Proof required: real page received and acknowledged

## Backup retention
- Owner: Deployment owner
- Credential: none beyond DB access
- Config: retention policy on managed Postgres backups
- Validate: confirm retention window and off-site copy
- Rollback: n/a
- Proof required: documented retention policy + one successful restore from an aged backup

## Object-storage versioning
- Owner: Deployment owner
- Credential: R2 bucket admin
- Config: enable versioning on the live bucket
- Validate: overwrite an object, confirm prior version retrievable
- Rollback: disable versioning
- Proof required: version history visible in bucket console

## DNS / TLS
- Owner: Deployment owner
- Credential: DNS registrar access
- Config: A/CNAME records, TLS cert (managed by host/CDN)
- Validate: `curl -vI https://<domain>` shows valid cert chain
- Rollback: DNS revert
- Proof required: valid public TLS certificate

## Production environment approval / GitHub Environment approval
- Owner: Technical owner + business owner
- Credential: GitHub repo admin
- Config: GitHub Environments with required reviewers (Package 4 CI/CD)
- Validate: deployment blocks until approved
- Rollback: remove environment protection temporarily if truly needed (not recommended)
- Proof required: signed-off approval record in GitHub

## Legal counsel review
- Owner: Legal counsel (real human, external)
- Credential: n/a
- Config: n/a
- Validate: counsel reviews each DRAFT policy in `public/proof/.../counsel-review-items.md`
- Rollback: n/a
- Proof required: counsel sign-off recorded, DRAFT labels removed only after that sign-off

## Final policy publication
- Owner: Legal counsel + business owner
- Credential: n/a
- Config: policy version bump in `policy_versions` table
- Validate: `npm run` compliance validator confirms new version seeded correctly
- Rollback: revert to prior policy version
- Proof required: counsel-approved text live, DRAFT label removed only then

## Venue staff training
- Owner: Venue manager
- Credential: n/a
- Config: staff-acknowledgement mechanism already exists (`staff_acknowledgements` table, Package 6)
- Validate: real staff member completes acknowledgement flow
- Rollback: n/a
- Proof required: real staff acknowledgement records, not fixture data
