/**
 * POS360 Floor Management — Feature Flags (Phase B.1)
 *
 * Global defaults. Individual venues override via pos360_floor_sections
 * and pos360_tables feature_flags JSONB column.
 */
export const POS360_FLOOR_FLAGS = {
  // Core capabilities — enabled by default
  floor_management_enabled:         process.env.POS360_FLOOR_ENABLED          !== 'false',
  sections_configurable:            true,
  table_status_history:             true,
  server_assignment:                true,
  audit_logging:                    true,
  event_persistence:                true,

  // Phase B.2+ capabilities — disabled until next prompts
  drag_drop_enabled:                process.env.POS360_DRAG_DROP               === 'true',
  merge_split_enabled:              process.env.POS360_MERGE_SPLIT             === 'true',
  realtime_sync_enabled:            process.env.POS360_REALTIME_SYNC           === 'true',
  smokecraft_intelligence_enabled:  process.env.POS360_SMOKECRAFT_INTEL        === 'true',
  eat_recommendations_enabled:      process.env.POS360_EAT_RECS                === 'true',
  waitlist_integration_enabled:     process.env.POS360_WAITLIST                === 'true',
  reservation_integration_enabled:  process.env.POS360_RESERVATIONS            === 'true',
  loyalty_display_enabled:          process.env.POS360_LOYALTY_DISPLAY         === 'true',
}

export function getFloorFlags(venueOverrides = {}) {
  return { ...POS360_FLOOR_FLAGS, ...venueOverrides }
}
