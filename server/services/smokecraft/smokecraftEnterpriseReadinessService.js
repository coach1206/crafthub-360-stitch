/**
 * SmokeCraft Enterprise Readiness Service
 * Module Build 8 — evaluates all enterprise readiness dimensions.
 * Overall status cannot claim production-ready without real verification.
 */

import { getDatabaseReadinessStatus } from './smokecraftDatabaseReadinessService.js'
import { getConnectorRegistryReport } from './smokecraftProviderConnectorRegistry.js'
import { getWhiteLabelReadinessReport } from './smokecraftWhiteLabelService.js'
import { getLicenseGovernanceReport } from './smokecraftLicenseGovernanceService.js'
import { getMarketplaceDraftReport } from './smokecraftMarketplaceDraftHardeningService.js'
import { getTenantReadinessReport } from './smokecraftTenantBoundaryService.js'
import { getFeatureFlagGovernanceStatus } from './smokecraftFeatureFlagGovernanceService.js'

export const READINESS_LEVELS = {
  READY_FOR_INTERNAL_PREVIEW:  'ready_for_internal_preview',
  READY_FOR_GOVERNANCE_REVIEW: 'ready_for_governance_review',
  BLOCKED_FOR_MARKETPLACE:     'blocked_for_marketplace',
  BLOCKED_FOR_LICENSE:         'blocked_for_license_enforcement',
  BLOCKED_FOR_PRODUCTION:      'blocked_for_production',
  INCOMPLETE:                  'incomplete',
}

export function getEnterpriseReadinessSummary() {
  const db       = getDatabaseReadinessStatus()
  const connectors = getConnectorRegistryReport()
  const wl       = getWhiteLabelReadinessReport()
  const lic      = getLicenseGovernanceReport()
  const mkt      = getMarketplaceDraftReport()
  const tenant   = getTenantReadinessReport()
  const flags    = getFeatureFlagGovernanceStatus()

  const dimensions = {
    moduleManifestReadiness:     { ready: true,  status: 'package_manifest_ready' },
    routeContractReadiness:      { ready: true,  status: 'routes_defined' },
    serviceContractReadiness:    { ready: true,  status: 'services_defined' },
    integrationReadiness:        { ready: false, status: 'not_connected' },
    databaseReadiness:           { ready: false, status: db.persistenceMode },
    tenantReadiness:             { ready: false, status: tenant.tenantBoundaryStatus },
    whiteLabelReadiness:         { ready: false, status: wl.whiteLabelStatus },
    licenseGovernanceReadiness:  { ready: false, status: lic.licenseState },
    marketplaceDraftReadiness:   { ready: false, status: mkt.marketplaceStatus },
    featureFlagReadiness:        { ready: true,  status: 'flags_defined' },
    upgradeRollbackReadiness:    { ready: false, status: 'plan_preview_only' },
    documentationReadiness:      { ready: true,  status: 'docs_present' },
    protectedFileCompliance:     { ready: true,  status: 'protected_files_intact' },
    secretSafety:                { ready: true,  status: 'secrets_safe' },
    auditCoverage:               { ready: true,  status: 'audit_trail_active' },
    productionSyncReadiness:     { ready: false, status: 'not_connected' },
  }

  const productionBlockers = [
    'database_not_production_ready',
    'pos360_not_connected',
    'eat_not_connected',
    'pairing_provider_not_connected',
    'venue_menu_not_connected',
    'license_enforcement_not_active',
    'billing_not_connected',
    'tenant_isolation_not_verified',
  ]

  const marketplaceBlockers = [
    'marketplace_not_live',
    'license_enforcement_not_active',
    'physical_package_not_created',
    'production_persistence_not_verified',
    'billing_not_connected',
    'final_governance_review_required',
  ]

  const licenseBlockers = [
    'license_provider_not_connected',
    'billing_not_active',
    'entitlement_enforcement_not_implemented',
  ]

  return {
    overallReadiness:      READINESS_LEVELS.READY_FOR_GOVERNANCE_REVIEW,
    dimensions,
    productionBlockers,
    marketplaceBlockers,
    licenseBlockers,
    productionReady:       false,
    marketplaceReady:      false,
    licenseEnforced:       false,
    internalPreviewReady:  true,
    governanceReviewReady: true,
    connectedCount:        connectors?.connectedCount ?? 0,
    flags:                 flags?.activeFlags ?? {},
  }
}
