-- Rollback for 115_smokecraft_venue_humidor_real_payment_gateway.sql.
-- Drops the payment-intent/webhook/refund/dispute/reconciliation
-- ledgers and the active_payment_intent_id link column added to
-- venue_cigar_orders. venue_cigar_orders itself (and its existing
-- payment_status column from 108) is untouched.

ALTER TABLE venue_cigar_orders DROP COLUMN IF EXISTS active_payment_intent_id;

DROP TABLE IF EXISTS venue_cigar_payment_reconciliation_runs;
DROP TABLE IF EXISTS venue_cigar_payment_disputes;
DROP TABLE IF EXISTS venue_cigar_payment_refunds;
DROP TABLE IF EXISTS venue_cigar_payment_webhook_events;
DROP TABLE IF EXISTS venue_cigar_payment_intents;
