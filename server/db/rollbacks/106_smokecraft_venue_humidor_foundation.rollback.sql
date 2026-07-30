-- Rollback for 106_smokecraft_venue_humidor_foundation.sql.
-- Effect: all Venue Humidor product/inventory/hold/reservation/order
-- data is deleted (this migration owns these tables outright — they
-- did not exist before it). venues/venue_memberships are untouched.

DROP TABLE IF EXISTS venue_cigar_order_items;
DROP TABLE IF EXISTS venue_cigar_orders;
DROP TABLE IF EXISTS venue_cigar_reservations;
DROP TABLE IF EXISTS venue_cigar_inventory_holds;
DROP TABLE IF EXISTS venue_cigar_inventory_events;
DROP TABLE IF EXISTS venue_cigar_products;
