/**
 * POS360 Offline Sync — Feature Flags (Phase B.6)
 */

export const POS360_SYNC_FLAGS = {
  'pos360.sync.enabled':                          true,
  'pos360.sync.offline_mode_enabled':             true,
  'pos360.sync.order_queue_enabled':              true,
  'pos360.sync.table_queue_enabled':              true,
  'pos360.sync.production_queue_enabled':         true,
  'pos360.sync.payment_placeholder_queue_enabled':true,
  'pos360.sync.smokecraft_queue_enabled':         true,
  'pos360.sync.loyalty_queue_enabled':            true,
  'pos360.sync.audit_queue_enabled':              true,
  'pos360.sync.idempotency_enabled':              true,
  'pos360.sync.conflict_detection_enabled':       true,
  'pos360.sync.manager_review_enabled':           true,
  'pos360.sync.dead_letter_enabled':              true,
  'pos360.sync.retry_policy_enabled':             true,
  'pos360.sync.rollback_hook_enabled':            true,
  'pos360.sync.device_health_enabled':            true,
  'pos360.sync.eat_alerts_enabled':               true,
  'pos360.sync.localization_enabled':             true,
}

export function getSyncFlags(venueOverrides = {}) {
  let envOverrides = {}
  try {
    if (process.env.POS360_SYNC_FLAGS_JSON) {
      envOverrides = JSON.parse(process.env.POS360_SYNC_FLAGS_JSON)
    }
  } catch { /* ignore malformed env override */ }

  return { ...POS360_SYNC_FLAGS, ...envOverrides, ...venueOverrides }
}
