/**
 * SmokeCraft Governance Audit Service
 * Module Build 8 — enterprise governance audit trail.
 * containsSecrets: false, exposesPrivateData: false always.
 */

import { randomUUID } from 'node:crypto'

export const GOVERNANCE_AUDIT_EVENTS = {
  PACKAGE_REVIEWED:          'smokeCraft.enterprise.packageReviewed',
  WHITE_LABEL_REVIEWED:      'smokeCraft.enterprise.whiteLabelReviewed',
  TENANT_BOUNDARY_REVIEWED:  'smokeCraft.enterprise.tenantBoundaryReviewed',
  LICENSE_GOVERNANCE_REVIEWED: 'smokeCraft.enterprise.licenseGovernanceReviewed',
  MARKETPLACE_DRAFT_REVIEWED: 'smokeCraft.enterprise.marketplaceDraftReviewed',
  UPGRADE_PLAN_REVIEWED:     'smokeCraft.enterprise.upgradePlanReviewed',
  FEATURE_FLAGS_REVIEWED:    'smokeCraft.enterprise.featureFlagsReviewed',
  ENTITLEMENT_PREVIEW_REVIEWED: 'smokeCraft.enterprise.entitlementPreviewReviewed',
  READINESS_REVIEWED:        'smokeCraft.enterprise.readinessReviewed',
}

const _auditLog = []

export function createGovernanceAuditEntry({ moduleId = 'smokecraft', tenantId = null, venueId = null, actorId = null, actorRole = null, eventType, reviewStatus = 'reviewed', blockedReasons = [] } = {}) {
  const entry = {
    auditId:            randomUUID(),
    moduleId,
    tenantId,
    venueId,
    actorId,
    actorRole,
    eventType,
    reviewStatus,
    blockedReasons,
    containsSecrets:    false,
    exposesPrivateData: false,
    createdAt:          new Date().toISOString(),
  }
  _auditLog.push(entry)
  return entry
}

export function getGovernanceAuditLog(filter = {}) {
  let log = [..._auditLog]
  if (filter.eventType) log = log.filter(e => e.eventType === filter.eventType)
  if (filter.tenantId)  log = log.filter(e => e.tenantId === filter.tenantId)
  return log
}

export function getGovernanceAuditReport() {
  return {
    totalEntries:       _auditLog.length,
    containsSecrets:    false,
    exposesPrivateData: false,
    eventTypes:         Object.values(GOVERNANCE_AUDIT_EVENTS),
    recentEntries:      _auditLog.slice(-10),
  }
}
