/**
 * POS360 Offline Sync — Event Contracts (Phase B.6)
 */

export const SYNC_EVENTS = {
  // Network
  OFFLINE_DETECTED:         'sync.offline.detected',
  ONLINE_RESTORED:          'sync.online.restored',

  // Batches
  BATCH_CREATED:            'sync.batch.created',
  BATCH_STARTED:            'sync.batch.started',
  BATCH_COMPLETED:          'sync.batch.completed',
  BATCH_FAILED:             'sync.batch.failed',
  BATCH_PAUSED:             'sync.batch.paused',

  // Actions
  ACTION_QUEUED:            'sync.action.queued',
  ACTION_VALIDATED:         'sync.action.validated',
  ACTION_REPLAYED:          'sync.action.replayed',
  ACTION_FAILED:            'sync.action.failed',
  ACTION_DUPLICATE_BLOCKED: 'sync.action.duplicate_blocked',
  ACTION_DEAD_LETTERED:     'sync.action.dead_lettered',

  // Conflicts
  CONFLICT_DETECTED:               'sync.conflict.detected',
  CONFLICT_RESOLVED:               'sync.conflict.resolved',
  CONFLICT_MANAGER_REVIEW_REQUIRED:'sync.conflict.manager_review_required',

  // Policy / replay
  POLICY_APPLIED:           'sync.policy.applied',
  ROLLBACK_REQUESTED:       'sync.replay.rollback_requested',

  // Device health
  DEVICE_HEALTH_RECORDED:   'sync.device.health_recorded',
  CLOCK_DRIFT_DETECTED:     'sync.device.clock_drift_detected',

  // E.A.T.
  EAT_ALERT_CREATED:        'sync.eat.alert_created',
  EAT_ALERT_ACKNOWLEDGED:   'sync.eat.alert_acknowledged',

  // Manager review
  MANAGER_REVIEW_APPROVED:  'sync.manager_review.approved',
  MANAGER_REVIEW_DENIED:    'sync.manager_review.denied',

  // Localization
  LANGUAGE_CHANGED:         'sync.language.changed',
  LANGUAGE_PREFERENCE_SAVED:'sync.language.preference_saved',
  TRANSLATION_MISSING_KEY:  'sync.translation.missing_key',

  // Audit
  AUDIT_RECORDED:           'sync.audit.recorded',
}

export const SYNC_PRIORITIES = [
  'emergency',
  'payment',
  'order',
  'production',
  'table',
  'guest',
  'loyalty',
  'SmokeCraft',
  'audit',
  'preference',
  'low_priority',
]

export const SYNC_STATUSES = [
  'queued',
  'validated',
  'replaying',
  'replayed',
  'failed',
  'duplicate_blocked',
  'dead_lettered',
  'manager_review',
  'canceled',
]

export const CONFLICT_TYPES = [
  'order_version',
  'table_status',
  'table_transfer',
  'production_ticket',
  'order_item',
  'payment_placeholder',
  'guest_link',
  'loyalty_reward',
  'smokecraft_session',
  'device_session',
  'language_preference',
  'manager_approval',
  'emergency_mode',
]

export const RESOLUTION_POLICIES = [
  'server_wins',
  'device_wins',
  'latest_timestamp_wins',
  'manager_review_required',
  'merge_if_safe',
  'reject_if_risky',
  'replay_after_refresh',
  'dead_letter',
]

export const HIGH_RISK_ACTIONS = [
  'payment',
  'void',
  'refund_hook',
  'comp',
  'discount',
  'close_order_reopen',
  'table_transfer_with_payment',
  'duplicate_order_submit',
  'duplicate_production_ticket',
  'compliance_override',
  'emergency_mode_action',
]

export const EAT_ALERT_TYPES = [
  'offline_device',
  'sync_failure',
  'conflict_alert',
  'delayed_order',
  'dead_letter_queue',
  'payment_risk',
  'production_routing_delay',
  'device_health',
  'emergency_mode',
  'manager_review',
  'venue_sync_summary',
  'multi_location_summary',
]

export const SUPPORTED_LANGUAGES = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
export const DEFAULT_LANGUAGE    = 'en-US'
