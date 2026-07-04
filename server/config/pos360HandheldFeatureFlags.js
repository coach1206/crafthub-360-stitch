/**
 * POS360 Handheld Device Suite — Feature Flags (Phase B.3)
 */

export const POS360_HANDHELD_FLAGS = {
  handheld_enabled:                   true,
  dynamic_menu_enabled:               true,
  tables_enabled:                     true,
  orders_enabled:                     true,
  payments_enabled:                   true,
  smokecraft_enabled:                 true,
  loyalty_enabled:                    true,
  guests_enabled:                     true,
  reports_enabled:                    true,
  notifications_enabled:              true,
  scanner_enabled:                    false,  // requires real device scanner API
  camera_enabled:                     false,  // requires device camera permission
  signature_enabled:                  false,  // requires signature capture provider
  receipt_delivery_enabled:           true,
  offline_mode_enabled:               true,
  sync_enabled:                       true,
  diagnostics_enabled:                true,
  manager_approvals_enabled:          true,
  emergency_mode_enabled:             true,
  multi_location_switching_enabled:   false,  // Phase B.4+
}

/**
 * Merge venue-level overrides over defaults.
 * Env var POS360_HANDHELD_FLAGS_JSON can supply a JSON object to override.
 */
export function getHandheldFlags(venueOverrides = {}) {
  let envOverrides = {}
  try {
    if (process.env.POS360_HANDHELD_FLAGS_JSON) {
      envOverrides = JSON.parse(process.env.POS360_HANDHELD_FLAGS_JSON)
    }
  } catch { /* ignore malformed env override */ }

  return { ...POS360_HANDHELD_FLAGS, ...envOverrides, ...venueOverrides }
}
