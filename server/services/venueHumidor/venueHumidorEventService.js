/**
 * Venue Humidor 1B-2A — canonical checkout/order events. Reuses the
 * existing, already-idempotent smokecraft_progression_events log (the
 * same shared ledger Golden Box already writes to) rather than
 * creating a second, competing event log.
 */
import { recordEvent } from '../smokecraft/progressionEventService.js'

export const CANONICAL_VENUE_HUMIDOR_EVENT_TYPES = [
  'venue_humidor_checkout_quoted', 'venue_humidor_order_created',
  'venue_humidor_payment_pending', 'venue_humidor_hold_converted',
  'venue_humidor_order_completed', 'venue_humidor_order_canceled',
  'venue_humidor_hold_released',
]

/**
 * Records one canonical Venue Humidor event. Every event carries:
 * customer identity (guestReference), venue ID, order ID, hold/
 * reservation ID, product ID, quantity, authoritative totals, status,
 * idempotency key (a duplicate call is a silent no-op via
 * recordEvent's own UNIQUE constraint), audit ID, and server timestamp.
 */
export async function recordVenueHumidorEvent({
  guestReference, venueId, sourceScreen, sourceRoute, eventType,
  orderId, holdId, productId, quantity, totals, status, idempotencyKey,
}) {
  if (!CANONICAL_VENUE_HUMIDOR_EVENT_TYPES.includes(eventType)) {
    throw new Error(`non_canonical_venue_humidor_event_type:${eventType}`)
  }
  const { event, deduplicated } = await recordEvent({
    guestReference, venueId, sourceScreen, sourceRoute, eventType,
    payload: { venueId, orderId: orderId ?? null, holdId: holdId ?? null, productId: productId ?? null, quantity: quantity ?? null, totals: totals ?? null, status: status ?? null },
    idempotencyKey,
  })
  return { auditId: event.id, serverTimestamp: event.created_at, deduplicated }
}
