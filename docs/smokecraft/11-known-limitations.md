# SmokeCraft Known Limitations

**Version:** MVP2 · **Status:** Documented at closeout · **Audience:** Founders, engineers, and QA

---

## Session Progress Storage

**Limitation:** Guest journey progress is stored in `localStorage` on the guest device.

**Impact:**
- Progress is lost if the guest clears browser data.
- Progress does not transfer between devices.
- Multiple browser tabs on the same device share progress (by design).

**Mitigation:** A server-side session persistence API (`/api/smokecraft/sessions`) is deployed but not yet wired to the frontend guest journey. Server-side sync is deferred to post-MVP2.

**Workaround:** Staff can manually advance a guest session via the Admin panel if progress is lost.

---

## Database Migration Rollbacks

**Limitation:** Rollback scripts for all 71 database migrations are provided but cannot be executed-tested without a live PostgreSQL connection.

**Impact:** Idempotency is verified by code review only, not by automated test run.

**Mitigation:** All rollback scripts use `IF EXISTS` guards and transaction wrappers. A live Postgres connection is required before production rollback of any migration.

---

## Integration Statuses Are Informational Only in MVP2

**Limitation:** POS360, E.A.T., and Humidor integrations show status but do not execute real transactions in MVP2.

**Impact:** The Request Purchase session queues a purchase request; it does not submit a live POS360 order unless `SMOKECRAFT_POS360_KEY` is configured and `smokecraft.billing.enabled` is true.

**Mitigation:** The Truthful Status Guard ensures no false success language appears. All statuses accurately reflect the unconfigured state.

---

## Visual Regression Baselines Not Pre-Generated

**Limitation:** The visual regression suite (`e2e-smokecraft-visual-regression.mjs`) requires `--update-baseline` to be run before comparisons are possible. No baseline snapshots are committed to the repository.

**Impact:** The first run of the visual regression suite in compare mode will report "no baseline" for all screens.

**Mitigation:** Run `node e2e-smokecraft-visual-regression.mjs --update-baseline` after the first production deployment to establish baselines.

---

## Error Log In-Memory Only

**Limitation:** The server-side error log buffer holds the last 500 entries in memory. Entries are lost on server restart.

**Impact:** Error history does not persist across deployments.

**Mitigation:** Forward critical errors to an external logging service (Sentry, Datadog, etc.) by implementing a transport adapter in `smokecraftErrorLogger.js`.

---

## Demo Mode Flag Not Persisted Server-Side

**Limitation:** Demo mode is tracked via `sessionStorage` on the client. The server does not know if a request is from a demo session.

**Impact:** Demo-mode sessions that submit data to the server cannot be automatically filtered from real analytics.

**Mitigation:** Demo-mode requests include a `x-demo-mode: 1` header in the API client. Server routes that receive this header should filter demo submissions from analytics aggregation (implementation deferred to post-MVP2).

---

## R17: Rollback Script Execution Not Verified

**Limitation:** Due to the absence of a live PostgreSQL connection in the development environment, all 71 rollback scripts were authored and reviewed but not executed against a live database.

**Status:** PARTIAL — scripts exist, idempotency is code-reviewed but not runtime-verified.

---

## R25: Release Tag Deferred

**Limitation:** The MVP2 release tag (`smokecraft-v2.0.0-mvp2`) has not been created or pushed. It requires explicit founder sign-off.

**Status:** DEFERRED — intentional per founder instruction.
