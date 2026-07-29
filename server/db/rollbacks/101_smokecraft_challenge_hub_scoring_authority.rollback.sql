-- Rollback for 101_smokecraft_challenge_hub_scoring_authority.sql.
-- Not auto-run.
--   psql "$DATABASE_URL" -f server/db/rollbacks/101_smokecraft_challenge_hub_scoring_authority.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '101_smokecraft_challenge_hub_scoring_authority.sql';
--
-- Disclosed data loss: any Challenge Hub reward-grant audit rows are
-- lost (harmless — both seeded challenges currently award 0 XP, so no
-- real XP total is affected). rule_version is dropped; the underlying
-- requirement_config each version pointed to is untouched.

DROP TABLE IF EXISTS smokecraft_challenge_rewards;
ALTER TABLE smokecraft_challenge_definitions DROP COLUMN IF EXISTS rule_version;
