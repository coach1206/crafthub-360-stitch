/**
 * POS360 Floor Management — Event Contracts (Phase B.1)
 *
 * Canonical event type registry for all floor.* events.
 * Used for type safety, documentation, and device-sync routing.
 *
 * Each event carries: { eventId, venueId, tenantId, eventType, entityType,
 *   entityId, actorId, actorRole, payload, deviceId, deviceType, createdAt }
 */

export const FLOOR_EVENTS = Object.freeze({
  // ── Section events ──────────────────────────────────────────────────────────
  SECTION_CREATED:           'floor.section.created',
  SECTION_UPDATED:           'floor.section.updated',
  SECTION_ARCHIVED:          'floor.section.archived',

  // ── Floor map events ────────────────────────────────────────────────────────
  MAP_CREATED:               'floor.map.created',
  MAP_UPDATED:               'floor.map.updated',

  // ── Table events ────────────────────────────────────────────────────────────
  TABLE_CREATED:             'floor.table.created',
  TABLE_UPDATED:             'floor.table.updated',
  TABLE_STATUS_CHANGED:      'floor.table.status_changed',
  TABLE_TRANSFERRED:         'floor.table.transferred',
  TABLE_MERGED:              'floor.table.merged',
  TABLE_SPLIT:               'floor.table.split',

  // ── Server events ───────────────────────────────────────────────────────────
  SERVER_ASSIGNED:           'floor.server.assigned',

  // ── Guest events ────────────────────────────────────────────────────────────
  GUEST_SEATED:              'floor.guest.seated',
  GUEST_MOVED:               'floor.guest.moved',

  // ── Reservation / waitlist ──────────────────────────────────────────────────
  RESERVATION_LINKED:        'floor.reservation.linked',
  WAITLIST_LINKED:           'floor.waitlist.linked',

  // ── Sync events ─────────────────────────────────────────────────────────────
  SYNC_COMPLETED:            'floor.sync.completed',
  SYNC_FAILED:               'floor.sync.failed',
})

/**
 * Canonical table statuses.
 * Color mapping is venue-configurable; these are the contract keys.
 */
export const TABLE_STATUSES = Object.freeze({
  AVAILABLE:        'available',
  OCCUPIED:         'occupied',
  ORDERED:          'ordered',
  NEEDS_ATTENTION:  'needs_attention',
  CHECK_DROPPED:    'check_dropped',
  PAYMENT_PENDING:  'payment_pending',
  DIRTY:            'dirty',
  RESERVED:         'reserved',
  BLOCKED:          'blocked',
  MERGED:           'merged',
  OFFLINE_PENDING:  'offline_sync_pending',
})

/**
 * Default section types. Venues may add custom types via metadata.
 */
export const SECTION_TYPES = Object.freeze([
  'dining_room', 'patio', 'bar', 'cigar_lounge', 'vip',
  'private_room', 'event_space', 'outdoor_seating', 'retail_area',
  'tasting_room', 'lounge', 'banquet_room', 'pool_area', 'rooftop',
  'casino_pit', 'golf_bay', 'hotel_suite', 'food_truck_zone',
  'stadium_section', 'custom',
])

/**
 * Devices that receive floor sync events.
 */
export const SYNC_DEVICES = Object.freeze([
  'handheld_pos', 'tablet_pos', 'desktop_pos', 'manager_dashboard',
  'kitchen_display', 'bar_display', 'humidor_display', 'eat_command_hub',
])

/**
 * Feature flag keys for floor management.
 * Check these before enabling experimental features per venue.
 */
export const FLOOR_FEATURE_FLAGS = Object.freeze({
  DRAG_DROP_ENABLED:         'floor.drag_drop_enabled',
  MERGE_SPLIT_ENABLED:       'floor.merge_split_enabled',
  SMOKECRAFT_INTELLIGENCE:   'floor.smokecraft_intelligence_enabled',
  EAT_RECOMMENDATIONS:       'floor.eat_recommendations_enabled',
  REALTIME_SYNC:             'floor.realtime_sync_enabled',
  WAITLIST_INTEGRATION:      'floor.waitlist_integration_enabled',
  RESERVATION_INTEGRATION:   'floor.reservation_integration_enabled',
  LOYALTY_DISPLAY:           'floor.loyalty_display_enabled',
})
