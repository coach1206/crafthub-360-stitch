/**
 * SmokeCraft Venue Admin Contract
 * Defines admin view types, roles, record shape, and integration statuses.
 */

export const ADMIN_VIEWS = {
  OVERVIEW:           'overview',
  ACTIVE_SESSIONS:    'active_sessions',
  STAFF_QUEUE:        'staff_queue',
  ORDER_ACTIVITY:     'order_activity',
  PAIRING_ACTIVITY:   'pairing_activity',
  REWARD_ACTIVITY:    'reward_activity',
  PASSPORT_ACTIVITY:  'passport_activity',
  LOYALTY_ACTIVITY:   'loyalty_activity',
  MENU_STATUS:        'menu_status',
  POS360_STATUS:      'pos360_status',
  EAT_STATUS:         'eat_status',
  AUDIT_LOG:          'audit_log',
  MANAGEMENT_CONTROLS:'management_controls',
}

export const ADMIN_ROLES = {
  STAFF:         'staff',
  MANAGER:       'manager',
  VENUE_OWNER:   'venueOwner',
  PLATFORM_ADMIN:'platformAdmin',
}

export const BLOCKED_ADMIN_ROLES = ['customer']

export const RECORD_TYPES = {
  SESSION:     'session',
  ORDER:       'order',
  PAIRING:     'pairing',
  REWARD:      'reward',
  PASSPORT:    'passport',
  LOYALTY:     'loyalty',
  STAFF_OP:    'staff_operation',
  INTEGRATION: 'integration',
  CONTROL:     'control',
}

export const ADMIN_CONTRACT_VERSION = '0.1.0'

export function createAdminRecord(overrides = {}) {
  return {
    adminRecordId:           `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    venueId:                 null,
    managerId:               null,
    staffId:                 null,
    sourceModule:            'smokecraft',
    recordType:              RECORD_TYPES.SESSION,
    recordStatus:            'active',
    activeSessionsCount:     0,
    pendingOrdersCount:      0,
    staffAssistedOrdersCount:0,
    pairingEventsCount:      0,
    rewardEventsCount:       0,
    passportEligibleCount:   0,
    loyaltyPointsIssued:     0,
    posSyncStatus:           'not_connected',
    eatSyncStatus:           'not_connected',
    persistenceMode:         'memory_fallback',
    createdAt:               new Date().toISOString(),
    updatedAt:               new Date().toISOString(),
    ...overrides,
  }
}
