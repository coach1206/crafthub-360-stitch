# Railway Database Setup — NOVEE OS / CraftHub 360 Stitch

This document explains exactly how to connect the Railway Postgres service to the app,
why `DATABASE_URL` can appear set but still be wrong, and the exact steps to activate
SmokeCraft database persistence.

---

## Why the app keeps saying "No DATABASE_URL — prototype mode active"

The app reads `DATABASE_URL` from `process.env` at startup via `import 'dotenv/config'`.
On Railway, variables are injected by Railway at deploy time — no `.env` file is used.

**Reasons it can still fail even when the Railway Variables screen shows `DATABASE_URL`:**

| Cause | Symptom | Fix |
|---|---|---|
| Variable set after last deploy | App uses old env from previous deploy | **Redeploy** after every variable change |
| Wrong service reference name | `DATABASE_URL` resolves to `"base"` or `"${{Postgres.DATABASE_URL}}"` literally | Match the exact Postgres service name (case-sensitive) |
| Variable set at project level instead of service level | App service doesn't see it | Set at **service** level, not project level |
| Duplicate DATABASE_URL entries | Last one wins — may be wrong | Delete all duplicates, keep one |
| Variable name has a space | e.g. `DATABASE URL` instead of `DATABASE_URL` | Rename to `DATABASE_URL` (no spaces) |
| DATABASE_URL typed as a string literal | e.g. `"postgres://..."` entered manually with typos | Use the reference form or copy-paste from Railway Postgres service |

---

## Correct Railway Variable Configuration

### Step 1 — Find your Postgres service name

1. Open Railway dashboard
2. Click your project
3. Look at the services panel — find the Postgres service
4. Note its **exact name** — it is case-sensitive (e.g. `Postgres`, `postgres`, `PostgreSQL`)

### Step 2 — Set DATABASE_URL in your app service

1. Click the **CRAFTHUB_360** service (your app)
2. Go to **Variables** tab
3. Check for any existing `DATABASE_URL` — delete all of them
4. Click **+ New Variable**
5. Set:
   ```
   Name:  DATABASE_URL
   Value: ${{Postgres.DATABASE_URL}}
   ```
   Replace `Postgres` with the **exact name** of your Postgres service.

   > If your Postgres service is named `PostgreSQL`, use `${{PostgreSQL.DATABASE_URL}}`.
   > If it is named `db`, use `${{db.DATABASE_URL}}`.

6. Click **Add**
7. Click **Deploy** (or trigger a new deploy)

### Step 3 — Verify the variable resolved

After the deploy, open Railway's **Console** tab for the CRAFTHUB_360 service and run:

```bash
echo "Has DB: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
```

If it prints `Has DB: NO`, the reference did not resolve. Go back to Step 1 and
verify the service name matches exactly.

If it prints `Has DB: YES`, continue to Step 4.

---

## Step 4 — Run the diagnostic script

In Railway Console:

```bash
npm run verify:railway-env
```

This script prints:
- `DATABASE_URL present: YES/NO`
- `DATABASE_URL shape valid: YES/NO`
- `DATABASE_URL hostname (only):` — just the hostname, no passwords
- `PostgreSQL connection: OPEN / FAILED`
- `SELECT 1: PASS / FAIL`

**If hostname shows `base`:** Your reference `${{Postgres.DATABASE_URL}}` used the wrong
service name. Go back to Step 2, find the correct service name, and fix the reference.

**If connection fails with SSL error:** Make sure `NODE_ENV=production` is set in your
app service Variables.

**If SELECT 1 passes:** Your database connection is working. Continue to Step 5.

---

## Step 5 — Run migrations

```bash
npm run db:migrate
```

Expected output:
```
[runMigrations] Applied: 001_initial_schema.sql
[runMigrations] Applied: ...
[runMigrations] Applied: 029_smokecraft_persistence_hardening.sql
[runMigrations] Done. Applied: N, Skipped: M
```

If a migration fails, copy the error message and check the migration file in
`server/db/migrations/`. All migrations use `CREATE TABLE IF NOT EXISTS` — they are
safe to re-run.

---

## Step 6 — Run SmokeCraft activation

```bash
npm run verify:smokecraft-database-activation
```

This script will:
1. Confirm DATABASE_URL is present (value hidden)
2. Run migration (idempotent — safe to run again)
3. Verify all 17 unique SmokeCraft tables exist
4. Run INSERT → SELECT → DELETE test on each table (test records are cleaned up)
5. Update persistence registry: passing areas → `database_verified`
6. Report critical area gate

**Phase B (POS360 Live Connector) is safe to start only when the script outputs:**

```
Business-critical passed:          8 / 8
Infrastructure-critical passed:    3 / 3
All critical areas ready:          11 / 11
Phase B POS360 safe to start:      YES
```

---

## What the database connection code does

`server/db/connection.js`:
- Reads `process.env.DATABASE_URL` at module load time (top-level `await`)
- If absent: logs `[NOVEE OS DB] No DATABASE_URL — prototype mode active (in-memory)`; app continues without crashing
- If present: attempts `pg.Pool` connection with SSL when `NODE_ENV=production`
- If connection fails: logs warning; pool is null; app continues in memory mode
- `isDbAvailable()` returns `true` only when the pool connected successfully

The app **never crashes** due to a missing DATABASE_URL. Missing database = memory mode only.

---

## SSL requirement

Railway Postgres requires SSL in production. The connection code uses:

```js
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

**`NODE_ENV=production` must be set** in the CRAFTHUB_360 service Variables or the SSL
handshake will fail even with a valid DATABASE_URL.

---

## Checklist before Railway Console activation

- [ ] Railway Postgres service is running (green status)
- [ ] `DATABASE_URL` variable set in CRAFTHUB_360 service (not project level)
- [ ] Variable value is `${{<ExactServiceName>.DATABASE_URL}}` (reference, not a string literal)
- [ ] `NODE_ENV=production` is set in CRAFTHUB_360 service Variables
- [ ] Service was redeployed **after** the variable was added
- [ ] `npm run verify:railway-env` exits 0 with `SELECT 1: PASS`
- [ ] `npm run db:migrate` runs without errors
- [ ] `npm run verify:smokecraft-database-activation` exits 0 with `Phase B POS360 safe to start: YES`

---

## Phase B unlock criteria

Phase B (POS360 Live Connector) must not start until:

1. `verify:railway-env` → `SELECT 1: PASS`
2. `db:migrate` → no errors, migration 029 applied
3. `verify:smokecraft-database-activation` → exit code 0 AND:
   - `Business-critical passed: 8 / 8` (orders, staff_queue, pairing_profiles, flavor_memory, rewards, loyalty, passport_rewards, venue_admin)
   - `Infrastructure-critical passed: 3 / 3` (integration_sync_events, production_sync_queue, order_audit)

**This agent cannot prove Phase B readiness from its own container.** Railway environment
variables are not injected into this cloud execution environment. The three commands above
must be run in Railway Console by a human with access to the Railway dashboard.

---

## What NOT to do

- Do not set DATABASE_URL to a hardcoded connection string in the Railway UI — if credentials rotate, it breaks silently
- Do not add DATABASE_URL to the `.env` file and commit it — that file is not used on Railway and credentials must not be in git
- Do not set the variable at Railway project level expecting the app service to inherit it automatically — set it explicitly on the service
- Do not skip the Redeploy step — variable changes do not take effect until the next deploy
