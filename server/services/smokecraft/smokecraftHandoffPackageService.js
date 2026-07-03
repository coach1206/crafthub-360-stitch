/**
 * SmokeCraft Handoff Package Service
 * Module Build 9 — handoff package index and file map.
 */

import { createHandoffRecord, BUILD_SEQUENCE, VERIFY_SCRIPT_MAP, API_ROUTE_MAP } from '../../../src/modules/smokecraft/data/smokecraftHandoffContract.js'
import { PRODUCTION_BLOCKERS } from '../../../src/modules/smokecraft/data/smokecraftProductionBlockerContract.js'

const SERVICE_MAP = [
  'smokecraftOrderService.js',
  'smokecraftPairingService.js',
  'smokecraftPassportService.js',
  'smokecraftRewardPolicyService.js',
  'smokecraftVenueAdminStore.js',
  'smokecraftAnalyticsService.js',
  'smokecraftSecretSafetyService.js',
  'smokecraftProviderConnectorRegistry.js',
  'smokecraftIntegrationHealthService.js',
  'smokecraftEnterprisePackageService.js',
  'smokecraftGovernanceAuditService.js',
  'smokecraftFinalQaService.js',
  'smokecraftReleaseCandidateService.js',
  'smokecraftHandoffPackageService.js',
  'smokecraftProductionBlockerService.js',
  'smokecraftDocumentationLockService.js',
].map(f => `server/services/smokecraft/${f}`)

const COMPONENT_MAP = [
  'SmokeCraftIntegrationStatusPanel.jsx',
  'SmokeCraftDatabaseReadinessPanel.jsx',
  'SmokeCraftProviderConnectorsPanel.jsx',
  'SmokeCraftProductionSyncPanel.jsx',
  'SmokeCraftEnvironmentValidationPanel.jsx',
  'SmokeCraftEnterpriseReadinessPanel.jsx',
  'SmokeCraftWhiteLabelReadinessPanel.jsx',
  'SmokeCraftLicenseGovernancePanel.jsx',
  'SmokeCraftMarketplaceDraftPanel.jsx',
  'SmokeCraftTenantBoundaryPanel.jsx',
  'SmokeCraftUpgradeRollbackPanel.jsx',
  'SmokeCraftFinalQaPanel.jsx',
  'SmokeCraftReleaseCandidatePanel.jsx',
  'SmokeCraftProductionBlockersPanel.jsx',
  'SmokeCraftHandoffPackagePanel.jsx',
  'SmokeCraftDocumentationLockPanel.jsx',
].map(f => `src/modules/smokecraft/components/${f}`)

const DOCUMENTATION_MAP = [
  'src/modules/smokecraft/README.md',
  'docs/SMOKECRAFT_ORDERING_INTEGRATION.md',
  'docs/SMOKECRAFT_PAIRING_INTELLIGENCE.md',
  'docs/SMOKECRAFT_REWARDS_MONETIZATION.md',
  'docs/SMOKECRAFT_VENUE_ADMIN_OPERATIONS.md',
  'docs/SMOKECRAFT_PRODUCTION_SYNC_READINESS.md',
  'docs/SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE.md',
  'docs/SMOKECRAFT_RELEASE_CANDIDATE_REPORT.md',
  'docs/SMOKECRAFT_FINAL_QA_CHECKLIST.md',
  'docs/SMOKECRAFT_HANDOFF_PACKAGE.md',
  'docs/SMOKECRAFT_PRODUCTION_BLOCKERS.md',
  'docs/SMOKECRAFT_NEXT_PHASE_ROADMAP.md',
]

export function getHandoffPackage() {
  return createHandoffRecord({
    serviceMap:       SERVICE_MAP,
    componentMap:     COMPONENT_MAP,
    documentationMap: DOCUMENTATION_MAP,
    productionBlockers: PRODUCTION_BLOCKERS.map(b => b.title),
  })
}

export function getHandoffSummary() {
  return {
    buildSequence:     BUILD_SEQUENCE,
    verifyScriptMap:   VERIFY_SCRIPT_MAP,
    apiRouteMap:       API_ROUTE_MAP,
    serviceMap:        SERVICE_MAP,
    componentMap:      COMPONENT_MAP,
    documentationMap:  DOCUMENTATION_MAP,
    productionBlockerCount: PRODUCTION_BLOCKERS.length,
    handoffStatus:     'handoff_ready',
    productionReady:   false,
  }
}
