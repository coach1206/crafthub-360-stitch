-- Rollback for 112_smokecraft_venue_humidor_post_purchase.sql.
-- Effect: the narrow verified-purchase rating/tasting-note/smoked
-- table is removed. All order/receipt/acquisition source data
-- (venue_cigar_orders, venue_cigar_order_items,
-- venue_cigar_passport_acquisitions) is untouched — this pass added
-- no columns to those tables.

DROP TABLE IF EXISTS venue_cigar_acquisition_notes;
