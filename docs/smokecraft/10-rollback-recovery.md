# SmokeCraft Rollback & Recovery Guide

**Version:** MVP2 · **Audience:** Platform engineers and senior administrators

---

## When to Roll Back

Roll back when:
- A deployed change causes session locks to fail open (guests bypass gates)
- Image assets are missing or returning 404 errors
- A feature flag change caused unexpected behavior and cannot be reversed via the admin UI
- A database migration caused data corruption

Do NOT roll back for:
- Integration status showing "Not configured" — this is correct if credentials are not set
- Demo mode data appearing after reset — restart the browser session
- A single guest session stuck — resolve at the guest level, not a deployment rollback

## Application Rollback (Vercel)

1. Go to the Vercel dashboard for this project.
2. Select **Deployments**.
3. Find the last known-good deployment.
4. Click **Promote to Production**.

This redeploys the previous build without a code push. Takes approximately 30 seconds.

## Database Migration Rollback

Each migration in `server/db/migrations/` has an associated rollback script in `scripts/migrations/rollback/`.

**Rollback a single migration:**
```bash
node scripts/migrations/rollback/rollback-<migration-name>.mjs
```

**Check idempotency before running:**
All rollback scripts are idempotent — running them twice produces the same result as running once. Verify with `--dry-run` if available:
```bash
node scripts/migrations/rollback/rollback-<migration-name>.mjs --dry-run
```

**Important:** Rollback scripts require a live PostgreSQL connection (`DATABASE_URL` environment variable). They cannot be tested without a live database. In MVP2, this constraint is documented as a known limitation.

## Feature Flag Emergency Reset

If a feature flag change cannot be reversed via the admin UI (e.g., the UI is inaccessible):

Direct API call (requires admin or founder auth token):
```bash
curl -X POST /api/smokecraft/feature-flags/reset \
  -H "Authorization: Bearer <founder_token>" \
  -d '{ "key": "smokecraft.billing.enabled", "value": false }'
```

Or restart the server — feature flags are in-memory in MVP2 and reset to defaults on restart.

## SmokeCraft Module Emergency Disable

To disable the entire SmokeCraft module immediately:

1. In feature flag admin: set `smokecraft.enabled` to `false`.
2. This prevents all guest-facing SmokeCraft routes from rendering.
3. Existing guest sessions on active devices are not interrupted — they can complete the current screen but cannot advance.

For a hard disable (removes routes entirely), use the emergency system lock at `/admin` → **Emergency Lock** (founder only).

## Data Recovery

Guest session data is stored in `localStorage` on the guest device. It cannot be recovered if the browser data is cleared. In MVP2, no server-side session persistence exists for guest journey data. This is documented in the Known Limitations guide (doc 12).

Leaderboard scores and passport stamps are server-persisted and can be recovered from database backups.

## Backup Policy

- Database: automated daily backups via hosting provider (Railway/Render)
- Application: all versions are Git-tagged; any version can be redeployed
- Images: original approved images are never deleted; they are preserved in `public/assets/smokecraft/`
