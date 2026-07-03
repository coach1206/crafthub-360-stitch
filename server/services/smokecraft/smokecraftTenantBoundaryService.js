/**
 * SmokeCraft Tenant Boundary Service
 * Module Build 8 — tenant isolation contracts and boundary enforcement.
 * crossTenantAccessAllowed: false always.
 */

import { createTenantRecord, TENANT_BOUNDARY_STATUSES, TENANT_SCOPED_AREAS } from '../../../src/modules/smokecraft/data/smokecraftTenantContract.js'

const _tenantRecords = new Map()

export function getTenantBoundaryStatus(tenantId = null) {
  const record = createTenantRecord({ tenantId })
  return {
    ...record,
    crossTenantAccessAllowed: false,
    tenantReady:              false,
    productionReady:          false,
    warnings: [
      'Full multi-tenant persistence is not yet production-verified.',
      'Tenant boundaries are contract-ready but not database-enforced.',
      'Customer data must not be shared across tenants.',
    ],
  }
}

export function isCrossTenantAccessAllowed() {
  return false
}

export function getTenantScopedAreas() {
  return TENANT_SCOPED_AREAS
}

export function validateTenantAccess(tenantId, requestingTenantId) {
  if (!tenantId || !requestingTenantId) {
    return { allowed: false, reason: 'missing_tenant_context' }
  }
  if (tenantId !== requestingTenantId) {
    return { allowed: false, reason: 'cross_tenant_access_blocked', crossTenantAccessAllowed: false }
  }
  return { allowed: true, tenantId }
}

export function getTenantReadinessReport() {
  return {
    tenantBoundaryStatus:     TENANT_BOUNDARY_STATUSES.CONTRACT_READY,
    crossTenantAccessAllowed: false,
    tenantReady:              false,
    productionReady:          false,
    scopedAreas:              TENANT_SCOPED_AREAS,
    readinessBlockers: [
      'production_persistence_not_verified',
      'multi_tenant_database_not_configured',
    ],
  }
}
