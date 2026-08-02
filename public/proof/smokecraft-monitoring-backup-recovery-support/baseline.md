# Baseline — Production Package 5

- Starting commit: `71c3ccc87b0ce27866221b9b9d3d0684dab801a5`
- Branch: `recovery/smokecraft-codex-final`
- `git status` at start: clean, up to date with origin
- `git rev-parse HEAD` == `git rev-parse origin/recovery/smokecraft-codex-final` == `71c3ccc8...` confirmed before any work began.
- Local PostgreSQL 16 instance was down at session start (`pg_isready` refused). Started via `service postgresql start` (local sandbox service, not a cloud provider). Database `crafthub_smokecraft_final` was present with 1093 tables, 95 MB, real dev/dogfooding data (114 prior migrations applied, latest `115_smokecraft_venue_humidor_real_payment_gateway.sql`).
- This package's own migration `116_smokecraft_monitoring_backup_support.sql` was the only schema change applied on top of that baseline.
