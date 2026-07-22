# Database

Migration: `server/db/migrations/090_golden_box_packaging_studio.sql` (next valid number after 089, confirmed by inspecting `server/db/migrations/` before writing).

## Tables

| Table | Purpose | Key constraints |
|---|---|---|
| `packaging_designs` | One row per design | `design_id` UUID UNIQUE; owner identity CHECK; soft-delete via `deleted_at` |
| `packaging_design_versions` | Immutable snapshot per save | `UNIQUE(design_id, version_number)`; `snapshot JSONB` |
| `packaging_assets` | Uploaded artwork/logo metadata (never raw bytes) | `asset_id` UUID UNIQUE; `asset_type` CHECK enum |
| `packaging_asset_placements` | Geometry per asset | CHECK bounds keep placement within [0,1] normalized surface |
| `packaging_shares` | Tokenized share links | `UNIQUE` active-token-hash partial index (`WHERE revoked_at IS NULL`) |
| `packaging_collaborators` | Named collaborator roles (schema-ready, no invite UI this pass) | `UNIQUE(design_id, collaborator_user_id)` |
| `packaging_comments` | Threaded comments | author CHECK (user/guest/share) |
| `packaging_final_submissions` | Locked submitted snapshot | `UNIQUE(entry_id)` — one submission per Golden Box entry; `UNIQUE(idempotency_key)` |
| `packaging_audit_events` | Append-only audit trail | `..._no_delete_or_update` trigger, same pattern as `golden_box_activity_log` |

## Idempotency mechanisms

- `packaging_designs (competition entry association)`: entry ownership re-checked at submission time, not just at creation.
- `packaging_design_versions.UNIQUE(design_id, version_number)`: prevents duplicate/corrupted version numbering even under concurrent saves.
- `packaging_shares` active-token-hash UNIQUE partial index: guarantees no two active shares hash-collide (astronomically unlikely with 32-byte random tokens, but enforced regardless).
- `packaging_final_submissions.UNIQUE(entry_id)` + `UNIQUE(idempotency_key)`: `ON CONFLICT (idempotency_key) DO NOTHING` in `submitFinalDesign()` — a duplicate submit call returns the existing row, never creates a second one.

## No globally seeded data

Migration 090 creates only table structures, indexes, and the audit trigger — zero `INSERT` statements. Verified live by the dedicated suite (`No learner designs are globally seeded`).
