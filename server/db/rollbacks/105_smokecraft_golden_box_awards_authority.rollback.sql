-- Rollback for 105_smokecraft_golden_box_awards_authority.sql.
-- Effect: award records and the atomic issuance gate are removed.
-- No entry/scorecard/results data is deleted; any real XP transactions
-- or Passport stamps already granted through the canonical xpService/
-- passport360 services remain untouched (this migration never owned
-- that data, only the Golden Box audit link to it).

DROP TABLE IF EXISTS golden_box_award_issuances;
DROP TABLE IF EXISTS golden_box_awards;
