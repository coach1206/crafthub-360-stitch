/**
 * SmokeCraft Management Sync — authoritative integration registry
 * (Package E). Server is the sole source of truth for connection
 * state; the browser can never mark anything CONNECTED.
 *
 * Classification evidence (from direct code/schema audit this package
 * and prior packages — see SMOKECRAFT_MANAGEMENT_SYNC_INTEGRATION_REGISTRY.md):
 *   - Ticket Tapper: real tables (017/071), real tracking API, real
 *     frontend component, confirmed live-wired into Venue Commerce/
 *     Venue Select/Session Complete. Genuinely CONNECTED for tap/add
 *     event tracking.
 *   - Passport 360: real persistence exists (migration 068) but for a
 *     *different* module's guest identity, not confirmed mapped to
 *     SmokeCraft Management Sync's guest_reference. INTERNAL_ONLY.
 *   - Everything else: no verified authenticated bridge into Management
 *     Sync exists. NOT_CONFIGURED or COMING_SOON, per real evidence.
 */
export const INTEGRATIONS = Object.freeze({
  internal_management_sync: {
    key: 'internal_management_sync',
    displayName: 'Internal Management Sync',
    destinationType: 'internal',
    authRequired: 'venue_membership',
    venueScoped: true,
    supportedOperations: ['journey_sync', 'venue_analytics'],
    timeoutMs: 5000,
    retryPolicy: 'client_explicit_retry_only',
    idempotencyPolicy: 'database_unique_constraint',
    auditRequired: true,
    healthCheck: 'database_connection',
    packageDependency: null,
  },
  ticket_tapper: {
    key: 'ticket_tapper',
    displayName: 'Ticket Tapper',
    destinationType: 'internal',
    authRequired: 'none_guest_facing',
    venueScoped: true,
    supportedOperations: ['tap_event', 'add_event'],
    timeoutMs: 5000,
    retryPolicy: 'client_explicit_retry_only',
    idempotencyPolicy: 'none_currently_tracking_events_not_state',
    auditRequired: false,
    healthCheck: 'specials_table_reachable',
    packageDependency: null,
  },
  passport_360: {
    key: 'passport_360',
    displayName: 'Passport 360',
    destinationType: 'internal',
    authRequired: 'guest_identity_unverified_mapping',
    venueScoped: true,
    supportedOperations: [],
    timeoutMs: null,
    retryPolicy: 'n/a',
    idempotencyPolicy: 'n/a_not_wired',
    auditRequired: false,
    healthCheck: 'tables_exist_only',
    packageDependency: null,
    note: 'Real persistence exists for the Passport module, but SmokeCraft Management Sync guest_reference is not confirmed mapped to passport_360_guest_profiles.guest_id — no write path built.',
  },
  staff_handoff: {
    key: 'staff_handoff', displayName: 'Staff Handoff', destinationType: 'internal',
    authRequired: 'n/a', venueScoped: true, supportedOperations: [],
    timeoutMs: null, retryPolicy: 'n/a', idempotencyPolicy: 'n/a', auditRequired: false,
    healthCheck: 'no_destination_exists', packageDependency: 'package_6',
  },
  inventory: {
    key: 'inventory', displayName: 'Inventory Management', destinationType: 'internal',
    authRequired: 'n/a', venueScoped: true, supportedOperations: [],
    timeoutMs: null, retryPolicy: 'n/a', idempotencyPolicy: 'n/a', auditRequired: false,
    healthCheck: 'no_cigar_humidor_inventory_table_exists', packageDependency: 'package_6',
  },
  pos360: {
    key: 'pos360', displayName: 'POS360', destinationType: 'external',
    authRequired: 'n/a', venueScoped: true, supportedOperations: [],
    timeoutMs: null, retryPolicy: 'n/a', idempotencyPolicy: 'n/a', auditRequired: false,
    healthCheck: 'real_module_exists_no_management_sync_bridge', packageDependency: 'package_7',
  },
  eat_360: {
    key: 'eat_360', displayName: 'E.A.T. 360', destinationType: 'external',
    authRequired: 'n/a', venueScoped: true, supportedOperations: [],
    timeoutMs: null, retryPolicy: 'n/a', idempotencyPolicy: 'n/a', auditRequired: false,
    healthCheck: 'confirmed_non_functional_preview_stub', packageDependency: 'package_7',
  },
  novee_os: {
    key: 'novee_os', displayName: 'NOVEE OS', destinationType: 'external',
    authRequired: 'n/a', venueScoped: false, supportedOperations: [],
    timeoutMs: null, retryPolicy: 'n/a', idempotencyPolicy: 'n/a', auditRequired: false,
    healthCheck: 'no_smokecraft_feed_exists', packageDependency: 'package_6',
  },
})

export function getIntegrationKeys() {
  return Object.keys(INTEGRATIONS)
}

export function isKnownIntegration(key) {
  return Object.prototype.hasOwnProperty.call(INTEGRATIONS, key)
}
