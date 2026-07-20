# Rollback Plan — Package 2

## Migration 078 rollback

```sql
ALTER TABLE smoke_leaderboard_entries DROP CONSTRAINT IF EXISTS chk_sle_session_or_golden_box;
```

Safe at any time — purely a compensating CHECK constraint with no data
dependency; dropping it cannot fail.

## Application-code rollback

- Revert `server/middleware/smokecraftGuestIdentity.js`'s cookie `path`
  back to `/api/smokecraft/management-sync` (would break Golden Box
  guest auth again — only do this if Golden Box itself is being fully
  rolled back).
- Revert the `requireEntryAnalysisAccess` addition in
  `server/controllers/goldenBoxController.js` (not recommended — this is
  a security fix, rolling it back reopens the Package 1 review's flagged
  gap).
- Delete `src/pages/smokecraft/goldenBox/`, `src/components/smokecraft/goldenBox/`,
  `src/hooks/useGoldenBox.js`, `src/services/goldenBox/goldenBoxApiClient.js`,
  `verify-golden-box-package-2.mjs`.
- Revert the 4 new route registrations + 4 new lazy imports in
  `src/App.jsx` (all additive, clearly isolated in the diff).

## Blast radius if rolled back

Zero impact on any VERIFIED_COMPLETE screen or the Package 1 backend —
Package 2 added no destructive migration and modified only two existing
files (`smokecraftGuestIdentity.js`'s cookie path, `goldenBoxController.js`'s
AI-route authorization), both additive/hardening changes with no schema
or data implications.
