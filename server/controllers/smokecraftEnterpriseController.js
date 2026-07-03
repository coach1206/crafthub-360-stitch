/**
 * SmokeCraft Enterprise Controller
 * Module Build 8 — handles /api/modules/smokecraft/enterprise/* routes.
 */

import { getEnterprisePackageStatus } from '../services/smokecraft/smokecraftEnterprisePackageService.js'
import { getWhiteLabelStatus } from '../services/smokecraft/smokecraftWhiteLabelService.js'
import { getTenantBoundaryStatus } from '../services/smokecraft/smokecraftTenantBoundaryService.js'
import { getLicenseGovernanceStatus } from '../services/smokecraft/smokecraftLicenseGovernanceService.js'
import { getMarketplaceDraftStatus } from '../services/smokecraft/smokecraftMarketplaceDraftHardeningService.js'
import { getUpgradeRollbackStatus } from '../services/smokecraft/smokecraftUpgradeRollbackService.js'
import { getFeatureFlagGovernanceStatus } from '../services/smokecraft/smokecraftFeatureFlagGovernanceService.js'
import { getEntitlementPreview } from '../services/smokecraft/smokecraftEntitlementPreviewService.js'
import { getEnterpriseReadinessSummary } from '../services/smokecraft/smokecraftEnterpriseReadinessService.js'
import { createGovernanceAuditEntry, getGovernanceAuditLog, getGovernanceAuditReport, GOVERNANCE_AUDIT_EVENTS } from '../services/smokecraft/smokecraftGovernanceAuditService.js'

function actorFromReq(req) {
  return {
    actorId:   req.query?.actorId ?? req.body?.actorId ?? null,
    actorRole: req.query?.actorRole ?? req.body?.actorRole ?? null,
    tenantId:  req.query?.tenantId ?? req.body?.tenantId ?? null,
    venueId:   req.query?.venueId ?? req.body?.venueId ?? null,
  }
}

export function getEnterpriseStatus(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.READINESS_REVIEWED })
  const readiness = getEnterpriseReadinessSummary()
  const pkg = getEnterprisePackageStatus()
  res.json({
    status:          'enterprise_preview',
    moduleId:        'smokecraft',
    overallReadiness: readiness.overallReadiness,
    productionReady:  false,
    package:          pkg,
    readiness,
  })
}

export function getPackageStatus(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.PACKAGE_REVIEWED })
  res.json(getEnterprisePackageStatus())
}

export function getWhiteLabelStatusHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.WHITE_LABEL_REVIEWED })
  res.json(getWhiteLabelStatus())
}

export function getTenantStatusHandler(req, res) {
  const { tenantId } = req.params
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, tenantId, eventType: GOVERNANCE_AUDIT_EVENTS.TENANT_BOUNDARY_REVIEWED })
  res.json(getTenantBoundaryStatus(tenantId))
}

export function getLicenseStatusHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.LICENSE_GOVERNANCE_REVIEWED })
  res.json(getLicenseGovernanceStatus())
}

export function getMarketplaceDraftHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.MARKETPLACE_DRAFT_REVIEWED })
  res.json(getMarketplaceDraftStatus())
}

export function getUpgradeRollbackHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.UPGRADE_PLAN_REVIEWED })
  res.json(getUpgradeRollbackStatus())
}

export function getFeatureFlagsHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.FEATURE_FLAGS_REVIEWED })
  res.json(getFeatureFlagGovernanceStatus())
}

export function getEntitlementsHandler(req, res) {
  const { tenantId } = req.params
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, tenantId, eventType: GOVERNANCE_AUDIT_EVENTS.ENTITLEMENT_PREVIEW_REVIEWED })
  res.json(getEntitlementPreview(tenantId, actor.venueId))
}

export function getReadinessHandler(req, res) {
  const actor = actorFromReq(req)
  createGovernanceAuditEntry({ ...actor, eventType: GOVERNANCE_AUDIT_EVENTS.READINESS_REVIEWED })
  res.json(getEnterpriseReadinessSummary())
}

export function getAuditHandler(req, res) {
  const { tenantId, eventType } = req.query
  const log = getGovernanceAuditLog({ tenantId, eventType })
  const report = getGovernanceAuditReport()
  res.json({ auditLog: log, report })
}
