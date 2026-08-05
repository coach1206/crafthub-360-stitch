// Production Package 6 — build-blocking validator for legal, privacy,
// accessibility, and tobacco-compliance controls. Static/source + migration
// checks only (no live DB/browser dependency), same pattern as the other
// validateSmokecraft*.mjs scripts run in `npm run prebuild`.
//
// This validator confirms ENGINEERING CONTROLS exist and are wired
// correctly. It does NOT and CANNOT confirm legal sufficiency — every
// policy/warning text check below also asserts the counsel-review marker
// is present, and this script must never be read as a legal sign-off.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft legal/privacy/accessibility/tobacco compliance readiness validator (Production Package 6)\n')

// 1. Migration exists and defines the core compliance schema.
const migPath = 'server/db/migrations/117_smokecraft_legal_privacy_accessibility_compliance.sql'
check('compliance migration 117 exists', fs.existsSync(migPath))
const mig = fs.existsSync(migPath) ? fs.readFileSync(migPath, 'utf8') : ''
check('compliance_jurisdictions table exists (jurisdiction configuration)', /CREATE TABLE IF NOT EXISTS compliance_jurisdictions/.test(mig))
check('shipping is disabled by default (shipping_allowed BOOLEAN NOT NULL DEFAULT false)', /shipping_allowed\s+BOOLEAN NOT NULL DEFAULT false/.test(mig))
check('age_verification_records table exists (age-verification tiers)', /CREATE TABLE IF NOT EXISTS age_verification_records/.test(mig))
check('policy_versions table exists (policy versioning)', /CREATE TABLE IF NOT EXISTS policy_versions/.test(mig))
check('policy_acceptances table exists (versioned acceptance tracking)', /CREATE TABLE IF NOT EXISTS policy_acceptances/.test(mig))
check('consent_records table exists (cookie/localStorage consent)', /CREATE TABLE IF NOT EXISTS consent_records/.test(mig))
check('data_rights_requests table exists (access/correction/deletion/export workflow)', /CREATE TABLE IF NOT EXISTS data_rights_requests/.test(mig))
check('retention_policies table exists (retention configuration by category/jurisdiction)', /CREATE TABLE IF NOT EXISTS retention_policies/.test(mig))
check('staff_acknowledgements table exists', /CREATE TABLE IF NOT EXISTS staff_acknowledgements/.test(mig))
check('compliance_audit_events table exists (append-only audit trail)', /CREATE TABLE IF NOT EXISTS compliance_audit_events/.test(mig))
check('media_rights_review table exists (expiration + takedown)', /CREATE TABLE IF NOT EXISTS media_rights_review/.test(mig))
check('accessibility_issues table exists (compliance admin center tracking)', /CREATE TABLE IF NOT EXISTS accessibility_issues/.test(mig))
check('all seeded policy text is marked [COUNSEL REVIEW DRAFT] / [BORRADOR PARA REVISION LEGAL]', /\[COUNSEL REVIEW DRAFT\]/.test(mig) && /\[BORRADOR PARA REVISION LEGAL\]/.test(mig))
check('seeded policy rows default counsel_review_status to pending (never falsely marked approved)', (mig.match(/'pending', true\)/g) || []).length >= 5)
check('Dominican Republic / Caribbean jurisdiction is seeded disabled, not silently active', /'DR'.*'disabled'/.test(mig.replace(/\n/g, ' ')))

// 2. Server-authoritative eligibility: controller never trusts a
//    client-supplied eligibility boolean.
const ctrlPath = 'server/controllers/complianceController.js'
check('complianceController.js exists', fs.existsSync(ctrlPath))
const ctrl = fs.existsSync(ctrlPath) ? fs.readFileSync(ctrlPath, 'utf8') : ''
check('evaluatePurchaseEligibility is exported for reuse by checkout code (single source of truth)', /export async function evaluatePurchaseEligibility/.test(ctrl))
check('purchase eligibility is derived from DB age_verification_records, never from req.body.isEligible/ageConfirmed', /age_verification_records/.test(ctrl) && !/req\.body\.isEligible/.test(ctrl) && !/req\.body\.ageConfirmed/.test(ctrl))
check('eligibility requires result = approved AND not expired (reverification enforced)', /result = 'approved'/.test(ctrl) && /expires_at IS NULL OR expires_at > now\(\)/.test(ctrl))
check('staff_verified / in_person_fulfillment methods require an authenticated staff-role actor, not just any req.user.id', /ROLE_LEVELS\[req\.user\?\.role\] \?\? -1/.test(ctrl) && /isStaffActor/.test(ctrl))
check('fulfillment eligibility (shipping/pickup/etc.) is looked up per-jurisdiction from the DB, not client-selected', /checkFulfillmentEligibility/.test(ctrl) && /compliance_jurisdictions WHERE code = \$1/.test(ctrl))
check('data-rights export/deletion enforce owner-or-staff via explicit ROLE_LEVELS.staff check (not "anything but customer")', /callerLevel >= ROLE_LEVELS\.staff/.test(ctrl))
check('cross-user data-rights request access is denied (forbidden_cross_user_request)', /forbidden_cross_user_request/.test(ctrl))
check('deletion preview computes retention exceptions before commit is allowed', /preview_required_before_commit/.test(ctrl))
check('deletion commit revokes sessions and is reported to the caller', /sessions_revoked: true/.test(ctrl))
check('export excludes secrets/fraud logic/other users\' data by design (documented in code)', /never included then redacted/.test(ctrl) || /excluded by design/.test(ctrl))
check('every mutating compliance action records an append-only audit event via recordAudit()', /async function recordAudit/.test(ctrl) && (ctrl.match(/await recordAudit\(/g) || []).length >= 8)
check('consent grant defaults nonessential categories to false unless explicitly true (no dark patterns)', /preferences === true, analytics === true, marketing === true/.test(ctrl))

// 3. Routes: RBAC on admin/compliance-center endpoints; public routes for
//    age-gate/consent stay reachable without staff auth.
const routesPath = 'server/routes/complianceRoutes.js'
check('complianceRoutes.js exists', fs.existsSync(routesPath))
const routes = fs.existsSync(routesPath) ? fs.readFileSync(routesPath, 'utf8') : ''
check('jurisdiction config writes require requireAdmin', /jurisdictions\/:code'.*requireAuth, requireAdmin/.test(routes.replace(/\n/g, ' ')))
check('audit-events read requires requireAdmin (compliance-center RBAC)', /audit-events'.*requireAuth, requireAdmin/.test(routes.replace(/\n/g, ' ')))
check('retention-policies read requires requireManager+', /retention-policies'.*requireAuth, requireManager/.test(routes.replace(/\n/g, ' ')))
check('age-verification route uses optionalAuth (public self-attestation, staff methods gated in controller)', /age-verification', optionalAuth/.test(routes))
check('purchase-eligibility and fulfillment-eligibility are reachable without staff auth (public checkout-time checks)', /router\.get\('\/purchase-eligibility', c\.checkPurchaseEligibility\)/.test(routes) && /router\.get\('\/fulfillment-eligibility', c\.checkFulfillmentEligibility\)/.test(routes))

// 4. Server wiring.
const serverIndex = fs.readFileSync('server/index.js', 'utf8')
check('complianceRoutes mounted at /api/compliance', /app\.use\('\/api\/compliance',\s*complianceRoutes\)/.test(serverIndex))

// Proof-directory checks (E.A.T. known-defect disclosure, counsel-review
// checklist, accessibility standard doc, data-rights samples, banned-phrase
// scan) live in scripts/verifySmokecraftComplianceProof.mjs, run via
// `npm run verify:smokecraft-compliance-proof` — not here. public/proof/ is
// deliberately excluded from the production build context (.dockerignore),
// so a build-blocking check that depends on it would fail every Docker
// build for a reason having nothing to do with source-code/engineering
// control correctness, which is what this script exists to gate. This
// script covers only real source, schema, and route-wiring checks — all
// of which are independent of public/proof and remain build-blocking.

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
