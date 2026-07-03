/**
 * SmokeCraft Production Sync Contract
 * Defines sync event shape, sync statuses, and target system identifiers.
 */

export const SYNC_STATUSES = {
  QUEUED:               'queued',
  READY:                'ready',
  BLOCKED_MISSING_CONFIG:'blocked_missing_config',
  BLOCKED_NOT_CONNECTED: 'blocked_not_connected',
  ATTEMPTING:           'attempting',
  SYNCED:               'synced',
  FAILED:               'failed',
  RETRY_SCHEDULED:      'retry_scheduled',
  DEAD_LETTER:          'dead_letter',
  PREVIEW_ONLY:         'preview_only',
}

export const TARGET_SYSTEMS = {
  POS360:              'pos360',
  EAT:                 'eat_system',
  PAIRING_PROVIDER:    'pairing_provider',
  VENUE_MENU:          'venue_menu_provider',
  PASSPORT:            'passport_connections',
  LOYALTY:             'loyalty_provider',
  BILLING:             'billing_provider',
  ANALYTICS:           'analytics_provider',
  MARKETPLACE:         'marketplace_provider',
  LICENSE:             'license_provider',
}

export const SYNC_CONTRACT_VERSION = '0.1.0'
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_DELAY_MS = 5000

export function createSyncEvent(overrides = {}) {
  return {
    syncEventId:     `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceModule:    'smokecraft',
    sourceEventType: null,
    targetSystem:    null,
    payloadSummary:  null,
    payloadRef:      null,
    syncStatus:      SYNC_STATUSES.QUEUED,
    attemptCount:    0,
    lastAttemptAt:   null,
    nextRetryAt:     null,
    errorCode:       null,
    errorMessage:    null,
    deadLetter:      false,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
    ...overrides,
  }
}
