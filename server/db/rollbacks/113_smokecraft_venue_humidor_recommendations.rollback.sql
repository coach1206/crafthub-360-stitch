-- Rollback for migration 113. Drops only the two new tables added by
-- this pass; no order/product/inventory/Passport/event-log data is
-- touched.
DROP TABLE IF EXISTS venue_cigar_assisted_selling_outcomes;
DROP TABLE IF EXISTS venue_cigar_recommendation_preferences;
