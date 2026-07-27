-- Rollback for 094_smokecraft_guest_conversion_and_journey_snapshot.sql.
-- Not auto-run (see 092's rollback file for the same convention/warning).
--   psql "$DATABASE_URL" -f server/db/rollbacks/094_smokecraft_guest_conversion_and_journey_snapshot.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '094_smokecraft_guest_conversion_and_journey_snapshot.sql';
--
-- Disclosed data-loss: dropping smokecraft_guest_conversions loses the
-- record of which guests have already converted (a re-conversion
-- attempt after rollback+reapply would no longer be blocked by history
-- — the underlying smokecraft_player_state rows, already reassigned to
-- their user_id guest_reference, are NOT reverted by this rollback,
-- since that reassignment is real, already-committed learner data, not
-- schema). Journey snapshot columns are dropped; any snapshot data
-- written after 094 was applied is lost — same class of disclosed
-- trade-off as every other rollback in this operation.

ALTER TABLE smokecraft_player_state
  DROP COLUMN IF EXISTS journey_snapshot,
  DROP COLUMN IF EXISTS journey_version,
  DROP COLUMN IF EXISTS journey_updated_at;

DROP TABLE IF EXISTS smokecraft_guest_conversions;
