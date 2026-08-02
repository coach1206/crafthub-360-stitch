# Secret Rotation — Production Package 5

Documentation only (no live secrets rotated in this sandbox — no secret in `.env`/`.env.example` is real). Never commit active secrets; `.env` is gitignored, `.env.example` holds only placeholders/descriptions (verified pre-existing).

| Secret | Owner | Safe rotation sequence | Rollback | Expected downtime | Validation | Emergency revocation |
|---|---|---|---|---|---|---|
| JWT_SECRET / session secret | founder / infra owner | Generate new secret (`openssl rand -hex 64`), deploy with BOTH old+new accepted (dual-secret verify window) if supported, else accept a full re-login event | Revert env var, redeploy | Near-zero if dual-accept; else all sessions invalidated (~seconds of 401s until users re-auth) | `envValidator.js` startup check passes, `/api/auth/me` works with fresh login | Rotate immediately, invalidate all sessions |
| FOUNDER_CHALLENGE_SECRET | founder | Generate new secret, redeploy | Revert env var | Near-zero | Founder-level test login succeeds | Rotate immediately |
| DB password | db-owner | Create new DB role/password on provider, update `DATABASE_URL`, redeploy, then revoke old password | Revert `DATABASE_URL` | Near-zero (brief reconnect) | `/api/health/ready` green post-deploy | Revoke old role immediately, force reconnect |
| Stripe secret key | payments-owner | Roll key in Stripe dashboard (external), update env, redeploy, verify a test charge, then revoke old key in Stripe dashboard | Revert env var | Near-zero | Test charge + webhook succeed | Revoke in Stripe dashboard immediately (external action) |
| Stripe webhook secret | payments-owner | Add new webhook endpoint secret in Stripe dashboard, update env, redeploy, verify signature validation on next webhook, remove old endpoint | Revert env var | Near-zero (may miss one webhook during cutover — reconciliation backstop covers it) | Webhook signature validates | Disable old webhook endpoint in Stripe dashboard |
| Object-storage keys (R2/S3) | infra-owner | Create new access key in provider console, update env, redeploy, verify upload/fetch, revoke old key | Revert env var | Near-zero | Test upload+fetch succeeds | Revoke old key in provider console |
| Monitoring tokens (Sentry DSN, uptime API key) | infra-owner | Rotate in vendor dashboard, update env, redeploy | Revert env var | None (monitoring gap only, not customer-facing) | Test event/ping appears in vendor dashboard | Revoke in vendor dashboard |
| Deployment tokens (GitHub Actions secrets, Railway/Render tokens) | infra-owner | Rotate in provider/GitHub settings, update repo secret | Revert repo secret | None | Next CI run succeeds | Revoke in provider console |

All rotations: never skip the "validate before revoking old" step — dual-window rotation, not a hard cutover, wherever the provider supports it.
