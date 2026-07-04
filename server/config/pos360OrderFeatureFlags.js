/**
 * POS360 Order Lifecycle — Feature Flags (Phase B.5)
 */

export const POS360_ORDER_FLAGS = {
  'pos360.orders.enabled':                  true,
  'pos360.orders.tabs_enabled':             true,
  'pos360.orders.guest_tabs_enabled':       true,
  'pos360.orders.table_orders_enabled':     true,
  'pos360.orders.course_management_enabled':true,
  'pos360.orders.hold_fire_enabled':        true,
  'pos360.orders.production_routing_enabled':true,
  'pos360.orders.smokecraft_links_enabled': true,
  'pos360.orders.loyalty_links_enabled':    true,
  'pos360.orders.handheld_submit_enabled':  true,
  'pos360.orders.audit_enabled':            true,
  'pos360.orders.routing_retry_enabled':    true,
  'pos360.orders.voids_enabled':            true,
  'pos360.orders.manager_override_enabled': true,
}

export function getOrderFlags(venueOverrides = {}) {
  let envOverrides = {}
  try {
    if (process.env.POS360_ORDER_FLAGS_JSON) {
      envOverrides = JSON.parse(process.env.POS360_ORDER_FLAGS_JSON)
    }
  } catch { /* ignore malformed env override */ }

  return { ...POS360_ORDER_FLAGS, ...envOverrides, ...venueOverrides }
}
