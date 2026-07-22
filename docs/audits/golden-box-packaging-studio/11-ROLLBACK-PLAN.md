# Rollback Plan

## Code rollback

All Packaging Studio code is additive and isolated to new files plus two small edits (`server/index.js` route mount, `src/App.jsx` route registration). To roll back:
1. `git revert` this pass's commit(s) — no other system's files were modified.
2. Remove the route mount line in `server/index.js` and the 6 route/import blocks in `src/App.jsx` if a partial rollback (keep backend, drop frontend routes) is desired instead of a full revert.

## Database rollback

Migration 090 is purely additive (9 new tables, no `ALTER` on any existing table). To roll back:
```sql
DROP TABLE IF EXISTS packaging_audit_events, packaging_final_submissions, packaging_comments,
  packaging_collaborators, packaging_shares, packaging_asset_placements, packaging_assets,
  packaging_design_versions, packaging_designs CASCADE;
```
No existing table's schema, data, or constraints are affected by this migration — `golden_box_entries` gained no new column; the only foreign-key relationship points *from* the new tables *to* the existing `golden_box_entries.entry_id`, so dropping the new tables is fully safe and reversible with zero impact on Golden Box competition data.

## Storage rollback

Uploaded asset files live under `server/_local_media_storage/<designId>/` (local-dev storage adapter, already labeled not-production-ready). Deleting that directory tree removes all Packaging Studio uploads with no impact on Venue Management's own uploads (they're stored in the same root but under `<venueId>/` subdirectories, which are UUIDs/text keys from a disjoint namespace).

## Risk assessment

Low risk. No existing table was altered, no existing route was changed, no existing frontend component was modified. The single defect fix in this pass (`handleGetFinalSubmission` authorization) only affects the new Packaging Studio route it lives in — it does not touch `goldenBoxController.js` or any other existing file.
