/**
 * SmokeCraft Tenant Boundary Contract
 * Module Build 8 — tenant isolation shapes and data boundary rules.
 */

export const TENANT_BOUNDARY_STATUSES = {
  CONTRACT_READY:          'contract_ready',
  PARTIALLY_IMPLEMENTED:   'partially_implemented',
  PRODUCTION_READY:        'production_ready',
  BLOCKED:                 'blocked',
}

export const TENANT_SCOPED_AREAS = [
  'venue_analytics',
  'staff_queue',
  'reward_records',
  'white_label_config',
  'session_data',
  'order_records',
  'passport_records',
  'loyalty_records',
  'pairing_records',
]

export function createTenantRecord(overrides = {}) {
  return {
    tenantId:                 null,
    venueId:                  null,
    moduleId:                 'smokecraft',
    allowedUsers:             [],
    allowedRoles:             ['manager', 'owner', 'admin', 'staff', 'customer'],
    dataBoundaryStatus:       TENANT_BOUNDARY_STATUSES.CONTRACT_READY,
    crossTenantAccessAllowed: false,
    tenantConfigScope:        'venue_scoped',
    tenantThemeScope:         'venue_scoped',
    tenantMenuScope:          'venue_scoped',
    tenantRewardScope:        'venue_scoped',
    tenantAnalyticsScope:     'venue_scoped',
    auditScope:               'venue_scoped',
    persistenceMode:          'memory_fallback',
    tenantReady:              false,
    tenantBoundaryStatus:     TENANT_BOUNDARY_STATUSES.CONTRACT_READY,
    productionReady:          false,
    scopedAreas:              TENANT_SCOPED_AREAS,
    ...overrides,
  }
}
