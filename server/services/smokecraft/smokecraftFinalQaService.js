/**
 * SmokeCraft Final QA Service
 * Module Build 9 — evaluates all QA categories across the 9-build sequence.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createQaCategory, QA_STATUSES } from '../../../src/modules/smokecraft/data/smokecraftFinalQaContract.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')

function fe(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function fc(rel, str) { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str) } catch { return false } }

function buildCategory(id, name, checks) {
  const passed = checks.filter(Boolean).length
  const failed = checks.length - passed
  return createQaCategory({
    categoryId:   id,
    categoryName: name,
    status:       failed > 0 ? QA_STATUSES.WARNING : QA_STATUSES.PASSED,
    checksPassed: passed,
    checksFailed: failed,
  })
}

export function getFinalQaStatus() {
  const categories = [
    buildCategory('foundation', 'Foundation', [
      fe('server/services/smokecraft/smokecraftProductionReadinessService.js'),
      fe('src/modules/smokecraft/data/smokecraftEnterprisePackageContract.js'),
      fc('server/index.js', '/api/modules/smokecraft'),
    ]),
    buildCategory('module_registration', 'Module Registration', [
      fc('src/modules/smokecraft/README.md', 'SmokeCraft'),
      fe('src/modules/smokecraft/data/smokecraftEnterprisePackageContract.js'),
    ]),
    buildCategory('journey_protection', 'Journey Protection', [
      fc('src/constants/smokecraftJourney.js', 'Flavor Memory') || fc('src/modules/smokecraft/README.md', 'Flavor Memory'),
      fc('server/services/smokecraft/smokecraftPassportService.js', 'VISIT_8_LOCKED'),
      fc('server/services/smokecraft/smokecraftPassportService.js', 'ONE_SESSION_SHORTCUT_BLOCKED'),
      fc('server/services/smokecraft/smokecraftPassportService.js', 'SCORECARD_MISSING'),
    ]),
    buildCategory('ordering', 'Ordering', [
      fe('server/services/smokecraft/smokecraftOrderService.js') || fe('server/routes/smokecraftOrderingRoutes.js'),
    ]),
    buildCategory('pairing', 'Pairing', [
      fe('src/modules/smokecraft/data/smokecraftPairingContract.js'),
      fc('server/services/smokecraft/smokecraftProviderConnectorRegistry.js', 'pairing_provider'),
    ]),
    buildCategory('rewards', 'Rewards', [
      fe('src/modules/smokecraft/data/smokecraftRewardContract.js') || fe('src/modules/smokecraft/data/smokecraftRewardsContract.js'),
    ]),
    buildCategory('venue_admin', 'Venue Admin', [
      fe('src/modules/smokecraft/data/smokecraftVenueAdminContract.js'),
      fe('server/routes/smokecraftVenueAdminRoutes.js'),
    ]),
    buildCategory('integrations', 'Integrations', [
      fe('server/services/smokecraft/smokecraftSecretSafetyService.js'),
      fe('server/services/smokecraft/smokecraftProviderConnectorRegistry.js'),
      fc('server/services/smokecraft/smokecraftDatabaseReadinessService.js', 'memory_fallback'),
    ]),
    buildCategory('enterprise_packaging', 'Enterprise Packaging', [
      fe('server/services/smokecraft/smokecraftEnterprisePackageService.js'),
      fe('server/services/smokecraft/smokecraftMarketplaceDraftHardeningService.js'),
      fe('server/services/smokecraft/smokecraftGovernanceAuditService.js'),
    ]),
    buildCategory('documentation', 'Documentation', [
      fe('src/modules/smokecraft/README.md'),
      fe('docs/SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE.md'),
      fe('docs/SMOKECRAFT_PRODUCTION_SYNC_READINESS.md'),
    ]),
    buildCategory('security', 'Security', [
      fc('server/services/smokecraft/smokecraftConnectorAuditService.js', 'containsSecrets'),
      fc('server/services/smokecraft/smokecraftGovernanceAuditService.js', 'exposesPrivateData'),
      !fc('src/modules/smokecraft/services/smokecraftIntegrationService.js', 'sk_live'),
    ]),
    buildCategory('honest_status', 'Honest Status', [
      !fc('server/services/smokecraft/smokecraftProviderConnectorRegistry.js', 'connected: true'),
      fc('server/services/smokecraft/smokecraftLicenseGovernanceService.js', 'license_not_enforced'),
      fc('server/services/smokecraft/smokecraftMarketplaceDraftHardeningService.js', 'publishBlocked'),
    ]),
    buildCategory('production_blockers', 'Production Blockers', [
      fe('src/modules/smokecraft/data/smokecraftProductionBlockerContract.js'),
    ]),
    buildCategory('release_candidate_readiness', 'Release Candidate Readiness', [
      fc('src/modules/smokecraft/data/smokecraftReleaseCandidateContract.js', 'approvedForProduction: false'),
      fc('src/modules/smokecraft/data/smokecraftReleaseCandidateContract.js', 'approvedForInternalDemo: true'),
    ]),
  ]

  const totalPassed  = categories.reduce((s, c) => s + c.checksPassed, 0)
  const totalFailed  = categories.reduce((s, c) => s + c.checksFailed, 0)
  const allPassed    = totalFailed === 0

  return {
    qaId:                   'smokecraft-final-qa-rc-9',
    moduleId:               'smokecraft',
    qaStatus:               allPassed ? 'passed_internal_rc' : 'warning',
    categories,
    totalPassed,
    totalFailed,
    approvedForInternalDemo: allPassed,
    approvedForProduction:   false,
    approvedForMarketplace:  false,
    evaluatedAt:            new Date().toISOString(),
  }
}
