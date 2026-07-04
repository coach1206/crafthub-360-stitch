/**
 * POS360 Production Display System — Feature Flags (Phase B.4)
 */

export const POS360_PRODUCTION_FLAGS = {
  production_enabled:             true,
  kds_enabled:                    true,
  bar_display_enabled:            true,
  humidor_display_enabled:        true,
  expo_enabled:                   true,
  custom_stations_enabled:        true,
  hold_fire_enabled:              true,
  routing_rules_enabled:          true,
  station_devices_enabled:        true,
  ticket_timers_enabled:          true,
  prep_timers_enabled:            true,
  rush_priority_enabled:          true,
  allergy_flags_enabled:          true,
  smokecraft_context_enabled:     true,
  eat_recommendations_enabled:    true,
  analytics_enabled:              true,
  audit_enabled:                  true,
  sync_enabled:                   true,
}

export function getProductionFlags(venueOverrides = {}) {
  let envOverrides = {}
  try {
    if (process.env.POS360_PRODUCTION_FLAGS_JSON) {
      envOverrides = JSON.parse(process.env.POS360_PRODUCTION_FLAGS_JSON)
    }
  } catch { /* ignore malformed env override */ }

  return { ...POS360_PRODUCTION_FLAGS, ...envOverrides, ...venueOverrides }
}
