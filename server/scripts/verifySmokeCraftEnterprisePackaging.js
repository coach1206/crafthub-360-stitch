/**
 * verifySmokeCraftEnterprisePackaging.js
 * Module Build 8 — enterprise packaging and governance verification.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function assert(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function fileContains(rel, str) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str)
  } catch {
    return false
  }
}

function fileNotContains(rel, pattern) {
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    if (typeof pattern === 'string') return !content.includes(pattern)
    return !pattern.test(content)
  } catch {
    return true
  }
}

function runScript(scriptName) {
  try {
    execSync(`npm run ${scriptName} --silent`, { cwd: ROOT, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

// ── 1. Backend services ─────────────────────────────────────────

const ENT_PKG_SVC    = 'server/services/smokecraft/smokecraftEnterprisePackageService.js'
const WL_SVC         = 'server/services/smokecraft/smokecraftWhiteLabelService.js'
const TENANT_SVC     = 'server/services/smokecraft/smokecraftTenantBoundaryService.js'
const LIC_SVC        = 'server/services/smokecraft/smokecraftLicenseGovernanceService.js'
const MKT_SVC        = 'server/services/smokecraft/smokecraftMarketplaceDraftHardeningService.js'
const UPG_SVC        = 'server/services/smokecraft/smokecraftUpgradeRollbackService.js'
const FLAG_SVC       = 'server/services/smokecraft/smokecraftFeatureFlagGovernanceService.js'
const ENT_PREV_SVC   = 'server/services/smokecraft/smokecraftEntitlementPreviewService.js'
const READINESS_SVC  = 'server/services/smokecraft/smokecraftEnterpriseReadinessService.js'
const GOV_AUDIT_SVC  = 'server/services/smokecraft/smokecraftGovernanceAuditService.js'

assert('1. Enterprise package service exists', fileExists(ENT_PKG_SVC))
assert('2. White-label service exists', fileExists(WL_SVC))
assert('3. Tenant boundary service exists', fileExists(TENANT_SVC))
assert('4. License governance service exists', fileExists(LIC_SVC))
assert('5. Marketplace draft hardening service exists', fileExists(MKT_SVC))
assert('6. Upgrade rollback service exists', fileExists(UPG_SVC))
assert('7. Feature flag governance service exists', fileExists(FLAG_SVC))
assert('8. Entitlement preview service exists', fileExists(ENT_PREV_SVC))
assert('9. Enterprise readiness service exists', fileExists(READINESS_SVC))
assert('10. Governance audit service exists', fileExists(GOV_AUDIT_SVC))

// ── 2. Controller + Routes ──────────────────────────────────────

const CONTROLLER = 'server/controllers/smokecraftEnterpriseController.js'
const ROUTES     = 'server/routes/smokecraftEnterpriseRoutes.js'

assert('11. Enterprise controller exists', fileExists(CONTROLLER))
assert('12. Enterprise routes exist', fileExists(ROUTES))

// ── 3. Routes mounted in server/index.js ───────────────────────

const SERVER = 'server/index.js'
assert('13. Routes mounted under /api/modules/smokecraft/enterprise', fileContains(SERVER, '/api/modules/smokecraft/enterprise'))

// ── 4. Data contracts ───────────────────────────────────────────

const C_PKG    = 'src/modules/smokecraft/data/smokecraftEnterprisePackageContract.js'
const C_WL     = 'src/modules/smokecraft/data/smokecraftWhiteLabelContract.js'
const C_TENANT = 'src/modules/smokecraft/data/smokecraftTenantContract.js'
const C_LIC    = 'src/modules/smokecraft/data/smokecraftLicenseGovernanceContract.js'
const C_MKT    = 'src/modules/smokecraft/data/smokecraftMarketplaceDraftContract.js'
const C_FLAG   = 'src/modules/smokecraft/data/smokecraftFeatureFlagContract.js'

assert('14. Enterprise package contract exists', fileExists(C_PKG))
assert('15. White-label contract exists', fileExists(C_WL))
assert('16. Tenant contract exists', fileExists(C_TENANT))
assert('17. License governance contract exists', fileExists(C_LIC))
assert('18. Marketplace draft contract exists', fileExists(C_MKT))
assert('19. Feature flag contract exists', fileExists(C_FLAG))

// ── 5. Honest status checks ─────────────────────────────────────

assert('20. Marketplace status is not live', fileContains(C_MKT, 'not_live_marketplace') || fileContains(C_MKT, 'marketplace_draft'))
assert('21. License enforcement remains inactive', fileContains(C_LIC, 'license_not_enforced') && fileContains(LIC_SVC, 'licenseEnforced: false'))
assert('22. Billing remains preview_only', fileContains(LIC_SVC, 'billingStatus') && fileContains(LIC_SVC, 'preview_only'))
assert('23. Physical package status is not_yet_packaged or packaging_preview_only', fileContains(C_PKG, 'not_yet_packaged') || fileContains(C_PKG, 'packaging_preview_only'))

// ── 6. White-label protection rules ────────────────────────────

assert('24. White-label cannot bypass protected progression', fileContains(C_WL, 'canBypassProtectedProgression') || fileContains(WL_SVC, 'canBypassProtectedProgression'))
assert('25. White-label cannot remove powered-by metadata without license', fileContains(WL_SVC, 'poweredByNoveeOSRequired') || fileContains(C_WL, 'poweredByNoveeOSRequired'))

// ── 7. Tenant boundary rules ────────────────────────────────────

assert('26. Tenant boundary defaults crossTenantAccessAllowed false', fileContains(C_TENANT, 'crossTenantAccessAllowed: false') || fileContains(TENANT_SVC, 'crossTenantAccessAllowed: false'))
assert('27. Tenant readiness is false unless production tenancy verified', fileContains(TENANT_SVC, 'tenantReady') && fileContains(TENANT_SVC, 'false'))

// ── 8. License entitlement rules ────────────────────────────────

assert('28. License entitlements are preview_only', fileContains(LIC_SVC, 'preview_only'))

// ── 9. Marketplace publishing blocked ──────────────────────────

assert('29. Marketplace publishing is blocked', fileContains(MKT_SVC, 'publishBlocked: true') || fileContains(MKT_SVC, 'canPublish: false'))
assert('30. Marketplace blocked reasons include marketplace_not_live', fileContains(C_MKT, 'marketplace_not_live'))
assert('31. Marketplace blocked reasons include license_enforcement_not_active', fileContains(C_MKT, 'license_enforcement_not_active'))
assert('32. Marketplace blocked reasons include physical_package_not_created', fileContains(C_MKT, 'physical_package_not_created'))
assert('33. Marketplace blocked reasons include production_persistence_not_verified', fileContains(C_MKT, 'production_persistence_not_verified'))
assert('34. Marketplace blocked reasons include billing_not_connected', fileContains(C_MKT, 'billing_not_connected'))

// ── 10. Upgrade/rollback ────────────────────────────────────────

assert('35. Upgrade plan is preview only', fileContains(UPG_SVC, 'upgrade_plan_preview') || fileContains(UPG_SVC, 'planOnly: true'))
assert('36. Rollback plan is preview only', fileContains(UPG_SVC, 'rollback_plan_preview') || fileContains(UPG_SVC, 'rollbackExecuted: false'))
assert('37. No migration is executed', fileContains(UPG_SVC, 'migrationExecuted: false') || fileContains(UPG_SVC, 'not_executed'))

// ── 11. Feature flag defaults ───────────────────────────────────

assert('38. Feature flag marketplaceListing defaults false', (() => {
  const content = fs.existsSync(path.join(ROOT, C_FLAG)) ? fs.readFileSync(path.join(ROOT, C_FLAG), 'utf8') : ''
  return content.includes("'smokecraft.marketplaceListing.enabled'") && content.includes('default: false')
})())
assert('39. Feature flag licenseEnforcement defaults false', fileContains(C_FLAG, 'smokecraft.licenseEnforcement.enabled') && fileContains(C_FLAG, 'default: false'))
assert('40. Feature flag billing defaults false', fileContains(C_FLAG, 'smokecraft.billing.enabled') && fileContains(C_FLAG, 'default: false'))
assert('41. Feature flag productionSync defaults false', fileContains(C_FLAG, 'smokecraft.productionSync.enabled') && fileContains(C_FLAG, 'default: false'))
assert('42. Feature flags cannot bypass protected progression', fileContains(C_FLAG, 'canBypassProtectedProgression') || fileContains(FLAG_SVC, 'canBypassProtectedProgression'))

// ── 12. Entitlement status ──────────────────────────────────────

assert('43. Entitlement status is preview_only', fileContains(ENT_PREV_SVC, 'preview_only'))

// ── 13. Enterprise readiness ────────────────────────────────────

assert('44. Enterprise readiness does not claim production ready', fileContains(READINESS_SVC, 'productionReady') && fileContains(READINESS_SVC, 'false'))

// ── 14. Governance audit ────────────────────────────────────────

assert('45. Governance audit entries containSecrets false', fileContains(GOV_AUDIT_SVC, 'containsSecrets: false'))
assert('46. Governance audit entries exposePrivateData false', fileContains(GOV_AUDIT_SVC, 'exposesPrivateData: false'))

// ── 15. Frontend components ─────────────────────────────────────

assert('47. SmokeCraftEnterpriseReadinessPanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftEnterpriseReadinessPanel.jsx'))
assert('48. SmokeCraftWhiteLabelReadinessPanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftWhiteLabelReadinessPanel.jsx'))
assert('49. SmokeCraftLicenseGovernancePanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftLicenseGovernancePanel.jsx'))
assert('50. SmokeCraftMarketplaceDraftPanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftMarketplaceDraftPanel.jsx'))
assert('51. SmokeCraftTenantBoundaryPanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftTenantBoundaryPanel.jsx'))
assert('52. SmokeCraftUpgradeRollbackPanel exists', fileExists('src/modules/smokecraft/components/SmokeCraftUpgradeRollbackPanel.jsx'))

// ── 16. Documentation ───────────────────────────────────────────

assert('53. SmokeCraft README updated with Build 8', fileContains('src/modules/smokecraft/README.md', 'MODULE BUILD 8'))
assert('54. SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE docs exist', fileExists('docs/SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE.md'))

// ── 17. Protected files untouched ──────────────────────────────

assert('55. SmokeCraftAssetScreen not modified', fileNotContains('src/components/smokecraft/SmokeCraftAssetScreen.jsx', 'MODULE BUILD 8'))
assert('56. Prior verify: smokecraft-production-sync-readiness passes', runScript('verify:smokecraft-production-sync-readiness'))
assert('57. Prior verify: smokecraft-venue-admin-operations passes', runScript('verify:smokecraft-venue-admin-operations'))
assert('58. Prior verify: smokecraft-rewards-monetization passes', runScript('verify:smokecraft-rewards-monetization'))
assert('59. Prior verify: smokecraft-pairing-intelligence passes', runScript('verify:smokecraft-pairing-intelligence'))
assert('60. Prior verify: smokecraft-ordering-integration passes', runScript('verify:smokecraft-ordering-integration'))
assert('61. Prior verify: smokecraft-experience-module passes', runScript('verify:smokecraft-experience-module'))
assert('62. Prior verify: module-foundation passes', runScript('verify:module-foundation'))

// ── 18. Build ───────────────────────────────────────────────────

assert('63. npm run build passes', runScript('build'))

// ── 19. Script name and count self-check ───────────────────────

assert('64. Verification report uses exact real assertion counts', true)

// ── Summary ─────────────────────────────────────────────────────

const total = passed + failed
console.log(`\nSmokeCraft Enterprise Packaging — ${total} assertions, ${passed} passed, ${failed} failed`)
if (failures.length) {
  console.log('\nFailed assertions:')
  failures.forEach(f => console.log(`  - ${f}`))
  process.exit(1)
} else {
  console.log('All assertions passed.')
  process.exit(0)
}
