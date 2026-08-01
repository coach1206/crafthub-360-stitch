-- Rollback for migration 114. Drops only the four new tables added by
-- this pass; no product/inventory/order/event-log data is touched.
DROP TABLE IF EXISTS venue_cigar_media_import_batches;
DROP TABLE IF EXISTS venue_cigar_media_events;
DROP TABLE IF EXISTS venue_cigar_media_assets;
DROP TABLE IF EXISTS venue_cigar_media_master_catalog;
