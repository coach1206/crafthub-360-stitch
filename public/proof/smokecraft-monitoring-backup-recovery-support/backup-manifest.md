# Backup Manifest — Production Package 5

What a complete SmokeCraft backup covers, and where each piece actually lives today:

| Item | Covered by | Verified this pass |
|---|---|---|
| Database (all tables) | `pg_dump` custom-format artifact (`scripts/backup-smokecraft-database.mjs`) | YES — real 5.6MB dump of 1093 tables |
| Media originals + variants | Object-storage bucket (Package 4 adapter) — not yet checksummed/versioned in this pass | NOT exercised (no live bucket) |
| Rights metadata / asset mappings | Postgres tables (`venue_cigar_media_*`, `smokecraft_content_media`, `packaging_assets`) — included in the DB dump | YES — present and row-count-reconciled post-restore |
| Retirement history | `venue_cigar_media_events` (event-sourced) — included in DB dump | YES (table exists, part of DB dump) |
| Environment config inventory | `.env.example` (structure only, no real secrets) + `server/config/envValidator.js` (enforced shape) — NOT itself backed up as a runtime artifact; documented as "reconstructable from `.env.example` + secret-rotation doc," never as a raw `.env` snapshot | Documented, no real secrets ever written to this manifest or any proof doc |
| Migration history | `schema_migrations` table — included in DB dump; also exists independently as the SQL files in `server/db/migrations/` (already in git) | YES — migration filename matched exactly between source and restored DB |
| Deployment version | `/api/version` build-manifest identity (Package 4) — not a backup artifact itself, but reproducible from git history + CI | Existing from Package 4, unchanged |
| Audit logs | `payment_audit_logs`, `pos360_payment_audit`, `passport_360_sync_audit_log`, `inventory_audit_events`, `support_case_actions` (new this pass) — all included in DB dump | YES (tables present post-restore) |
| Payment-reference records | `venue_cigar_payment_intents`, `payment_intents_log`, `pos360_payments` — included in DB dump | YES — queried post-restore |
| Passport records | `passport_records`, `passport_stamps`, `passport_360_*` — included in DB dump | YES — row counts reconciled, zero orphaned stamps |
| Golden Box records | `golden_box_entries` + 20 related tables — included in DB dump | YES — 512/512 entries reconciled |
| Inventory ledger | `inventory_events` (append-only) — included in DB dump | YES — row count + (when present) quantity-delta sum reconciled |

No real secrets are committed to this manifest or any file in `public/proof/` — connection strings, API keys, and session secrets are never written to git; only artifact metadata (path, size, sha256, migration version) is recorded, and only into the local (gitignored) `backups/` directory and the `backup_run_log` table.
