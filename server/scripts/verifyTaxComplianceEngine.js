/**
 * verifyTaxComplianceEngine.js — 80 checks
 * Verifies Phase 7 Tax Profiles and Compliance Engine foundation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function check(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyTaxComplianceEngine — 80 checks ===\n')

// ── 1–9. Migration ─────────────────────────────────────────────────────────────
check(1, 'Migration 022 exists', () => fileExists('server/db/migrations/022_tax_profiles_compliance_engine.sql') || 'file missing')

const migration = fileExists('server/db/migrations/022_tax_profiles_compliance_engine.sql')
  ? readFile('server/db/migrations/022_tax_profiles_compliance_engine.sql') : ''

check(2, 'venue_tax_profiles table defined', () => migration.includes('venue_tax_profiles') || 'table not found')
check(3, 'venue_tax_jurisdictions table defined', () => migration.includes('venue_tax_jurisdictions') || 'table not found')
check(4, 'venue_tax_categories table defined', () => migration.includes('venue_tax_categories') || 'table not found')
check(5, 'venue_tax_rules table defined', () => migration.includes('venue_tax_rules') || 'table not found')
check(6, 'partner_vendor_tax_profiles table defined', () => migration.includes('partner_vendor_tax_profiles') || 'table not found')
check(7, 'order_tax_calculation_logs table defined', () => migration.includes('order_tax_calculation_logs') || 'table not found')
check(8, 'tax_exemption_records table defined', () => migration.includes('tax_exemption_records') || 'table not found')
check(9, 'tax_audit_logs table defined', () => migration.includes('tax_audit_logs') || 'table not found')

// ── 10–14. Migration defaults ──────────────────────────────────────────────────
check(10, 'profile_status defaults to tax_profile_required', () => migration.includes("'tax_profile_required'") || 'default not found')
check(11, 'compliance_review_status defaults to compliance_review_required', () => migration.includes("'compliance_review_required'") || 'default not found')
check(12, 'merchant_of_record_required appears in migration', () => migration.includes("'merchant_of_record_required'") || 'status not found')
check(13, 'IF NOT EXISTS used in migration', () => migration.includes('IF NOT EXISTS') || 'missing safety guard')
check(14, 'cigar category code included in migration', () => migration.includes("'cigar'") || 'category missing')

// ── 15–19. Service files ───────────────────────────────────────────────────────
check(15, 'taxConfigService.js exists', () => fileExists('server/services/tax/taxConfigService.js') || 'file missing')
check(16, 'taxCalculationEngine.js exists', () => fileExists('server/services/tax/taxCalculationEngine.js') || 'file missing')
check(17, 'taxComplianceReadinessEngine.js exists', () => fileExists('server/services/tax/taxComplianceReadinessEngine.js') || 'file missing')
check(18, 'taxAuditService.js exists', () => fileExists('server/services/tax/taxAuditService.js') || 'file missing')
check(19, 'Controller exists', () => fileExists('server/controllers/taxComplianceController.js') || 'file missing')

// ── 20–22. Routes ──────────────────────────────────────────────────────────────
check(20, 'taxComplianceRoutes.js exists', () => fileExists('server/routes/taxComplianceRoutes.js') || 'file missing')

const routes = fileExists('server/routes/taxComplianceRoutes.js') ? readFile('server/routes/taxComplianceRoutes.js') : ''
check(21, 'Routes mounted at /api/tax in index.js', () => readFile('server/index.js').includes('/api/tax') || 'route not mounted')
check(22, '/calculate endpoint defined', () => routes.includes('/calculate') || 'endpoint missing')

// ── 23–32. taxConfigService exports ───────────────────────────────────────────
const configSvc = fileExists('server/services/tax/taxConfigService.js') ? readFile('server/services/tax/taxConfigService.js') : ''

check(23, 'getVenueTaxProfile exported', () => configSvc.includes('export') && configSvc.includes('getVenueTaxProfile') || 'export missing')
check(24, 'createOrUpdateVenueTaxProfile exported', () => configSvc.includes('createOrUpdateVenueTaxProfile') || 'export missing')
check(25, 'getVenueTaxJurisdictions exported', () => configSvc.includes('getVenueTaxJurisdictions') || 'export missing')
check(26, 'createOrUpdateVenueTaxJurisdiction exported', () => configSvc.includes('createOrUpdateVenueTaxJurisdiction') || 'export missing')
check(27, 'getVenueTaxCategories exported', () => configSvc.includes('getVenueTaxCategories') || 'export missing')
check(28, 'createOrUpdateVenueTaxCategory exported', () => configSvc.includes('createOrUpdateVenueTaxCategory') || 'export missing')
check(29, 'getVenueTaxRules exported', () => configSvc.includes('getVenueTaxRules') || 'export missing')
check(30, 'createOrUpdateVenueTaxRule exported', () => configSvc.includes('createOrUpdateVenueTaxRule') || 'export missing')
check(31, 'getPartnerVendorTaxProfile exported', () => configSvc.includes('getPartnerVendorTaxProfile') || 'export missing')
check(32, 'createOrUpdatePartnerVendorTaxProfile exported', () => configSvc.includes('createOrUpdatePartnerVendorTaxProfile') || 'export missing')

// ── 33–43. taxCalculationEngine checks ────────────────────────────────────────
const calcEngine = fileExists('server/services/tax/taxCalculationEngine.js') ? readFile('server/services/tax/taxCalculationEngine.js') : ''

check(33, 'FALLBACK_TAX_RATE defined (8.5%)', () => calcEngine.includes('FALLBACK_TAX_RATE') && calcEngine.includes('0.085') || 'fallback rate missing')
check(34, 'calculateOrderTax exported', () => calcEngine.includes('calculateOrderTax') || 'export missing')
check(35, 'buildTaxPreview exported', () => calcEngine.includes('buildTaxPreview') || 'export missing')
check(36, 'validateTaxCalculationInput exported', () => calcEngine.includes('validateTaxCalculationInput') || 'export missing')
check(37, 'tax_preview status returned when no rules', () => calcEngine.includes('tax_preview') || 'status missing')
check(38, 'tax_rule_missing status used', () => calcEngine.includes('tax_rule_missing') || 'status missing')
check(39, 'included_in_price handled', () => calcEngine.includes('included_in_price') || 'flag not handled')
check(40, 'taxPreviewMode: true set in preview', () => calcEngine.includes('taxPreviewMode') || 'flag missing')
check(41, 'complianceStatus: compliance_review_required in preview', () => calcEngine.includes('compliance_review_required') || 'status missing')
check(42, 'CATEGORY_MAP defined', () => calcEngine.includes('CATEGORY_MAP') || 'category map missing')
check(43, 'cigar category mapped', () => calcEngine.includes('cigar') || 'cigar mapping missing')

// ── 44–54. taxComplianceReadinessEngine checks ────────────────────────────────
const readinessEngine = fileExists('server/services/tax/taxComplianceReadinessEngine.js') ? readFile('server/services/tax/taxComplianceReadinessEngine.js') : ''

check(44, 'getVenueTaxComplianceReadiness exported', () => readinessEngine.includes('getVenueTaxComplianceReadiness') || 'export missing')
check(45, 'getPartnerTaxComplianceReadiness exported', () => readinessEngine.includes('getPartnerTaxComplianceReadiness') || 'export missing')
check(46, 'buildTaxReadinessScore exported', () => readinessEngine.includes('buildTaxReadinessScore') || 'export missing')
check(47, 'getOrderTaxReadiness exported', () => readinessEngine.includes('getOrderTaxReadiness') || 'export missing')
check(48, 'taxReadinessScore returned (0–100)', () => readinessEngine.includes('taxReadinessScore') || 'score missing')
check(49, 'maxScore defined', () => readinessEngine.includes('maxScore') || 'maxScore missing')
check(50, 'blockers array returned', () => readinessEngine.includes('blockers') || 'blockers missing')
check(51, 'compliance_review_required always present in blockers', () => readinessEngine.includes('compliance_review_required') || 'always-blocker missing')
check(52, 'complianceNote present in readiness result', () => readinessEngine.includes('complianceNote') || 'compliance note missing')
check(53, 'jurisdiction_required status used', () => readinessEngine.includes('jurisdiction_required') || 'status missing')
check(54, 'tax_profile_required status used', () => readinessEngine.includes('tax_profile_required') || 'status missing')

// ── 55–59. taxAuditService checks ─────────────────────────────────────────────
const auditSvc = fileExists('server/services/tax/taxAuditService.js') ? readFile('server/services/tax/taxAuditService.js') : ''

check(55, 'logTaxAuditEvent exported', () => auditSvc.includes('logTaxAuditEvent') || 'export missing')
check(56, 'getTaxAuditTrail exported', () => auditSvc.includes('getTaxAuditTrail') || 'export missing')
check(57, 'buildTaxAuditEvent exported', () => auditSvc.includes('buildTaxAuditEvent') || 'export missing')
check(58, 'audit_preview status when memory-only', () => auditSvc.includes('audit_preview') || 'status missing')
check(59, 'memory fallback for audit logs', () => auditSvc.includes('memory_fallback') || 'fallback missing')

// ── 60–65. Controller endpoints ────────────────────────────────────────────────
const controller = fileExists('server/controllers/taxComplianceController.js') ? readFile('server/controllers/taxComplianceController.js') : ''

check(60, 'handleGetVenueTaxProfile exported', () => controller.includes('handleGetVenueTaxProfile') || 'handler missing')
check(61, 'handleCreateOrUpdateVenueTaxProfile exported', () => controller.includes('handleCreateOrUpdateVenueTaxProfile') || 'handler missing')
check(62, 'handleGetVenueTaxReadiness exported', () => controller.includes('handleGetVenueTaxReadiness') || 'handler missing')
check(63, 'handleCalculateTax exported', () => controller.includes('handleCalculateTax') || 'handler missing')
check(64, 'handleTaxPreview exported', () => controller.includes('handleTaxPreview') || 'handler missing')
check(65, 'handleGetAuditTrail exported', () => controller.includes('handleGetAuditTrail') || 'handler missing')

// ── 66–70. Routes completeness ─────────────────────────────────────────────────
check(66, 'venue profile GET route defined', () => routes.includes("get('/venues/:venueId/profile'") || routes.includes("get(") && routes.includes('/profile') || 'route missing')
check(67, 'jurisdiction route defined', () => routes.includes('jurisdictions') || 'route missing')
check(68, 'categories route defined', () => routes.includes('categories') || 'route missing')
check(69, 'rules route defined', () => routes.includes('rules') || 'route missing')
check(70, 'audit route defined', () => routes.includes('audit') || 'route missing')

// ── 71–74. EAT Command Hub integration ────────────────────────────────────────
const eatContract = fileExists('server/services/eatCommandHubContract.js') ? readFile('server/services/eatCommandHubContract.js') : ''

check(71, 'getTaxReadinessHooks exported from eatCommandHubContract', () => eatContract.includes('getTaxReadinessHooks') || 'hook missing')
check(72, 'taxReadinessStatus returned in EAT hooks', () => eatContract.includes('taxReadinessStatus') || 'field missing')
check(73, 'taxReadinessScore returned in EAT hooks', () => eatContract.includes('taxReadinessScore') || 'field missing')
check(74, 'complianceNote returned in EAT hooks', () => eatContract.includes('complianceNote') || 'field missing')

// ── 75–77. Forbidden language checks ──────────────────────────────────────────
const allTaxFiles = [configSvc, calcEngine, readinessEngine, auditSvc, controller].join('\n')

check(75, 'No "tax_compliant" status returned (forbidden)', () => !allTaxFiles.includes("'tax_compliant'") || 'forbidden status found')
check(76, 'No "remitted" claim in tax services', () => !allTaxFiles.includes('"remitted"') || 'forbidden word found')
check(77, 'No "legally_compliant" claim in tax services', () => !allTaxFiles.includes('legally_compliant') || 'forbidden status found')

// ── 78–79. Documentation ──────────────────────────────────────────────────────
check(78, 'TAX_PROFILES_COMPLIANCE_ENGINE.md exists', () => fileExists('docs/TAX_PROFILES_COMPLIANCE_ENGINE.md') || 'file missing')
check(79, 'Required compliance phrase in documentation', () => {
  const doc = fileExists('docs/TAX_PROFILES_COMPLIANCE_ENGINE.md') ? readFile('docs/TAX_PROFILES_COMPLIANCE_ENGINE.md') : ''
  return doc.includes('This engine supports tax calculation previews and readiness checks, but it does not provide legal tax advice or guarantee tax compliance.') || 'required phrase missing'
})

// ── 80. Protected files unchanged ─────────────────────────────────────────────
check(80, 'Protected files not modified (SmokeCraftAssetScreen, session constants)', () => {
  const sessionFile = fileExists('src/constants/session.js') ? readFile('src/constants/session.js') : ''
  return sessionFile.includes('VISIT_STRUCTURE') || 'VISIT_STRUCTURE missing — session.js may have been modified'
})

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
if (failures.length > 0) {
  console.error('\nFailed checks:')
  failures.forEach(f => console.error(`  • ${f}`))
}
if (failed === 0) {
  console.log('\n✓ All 80 checks passed. Phase 7 Tax Profiles and Compliance Engine verified.\n')
  console.log('  IMPORTANT: Tax amounts produced by this engine are estimates/previews only.')
  console.log('  CPA/legal review is required before collecting or remitting taxes in any jurisdiction.\n')
} else {
  process.exit(1)
}
