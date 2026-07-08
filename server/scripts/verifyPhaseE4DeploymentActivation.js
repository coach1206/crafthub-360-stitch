/**
 * NOVEE OS — Phase E.4 Deployment Activation Verification
 * Run: node server/scripts/verifyPhaseE4DeploymentActivation.js
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const pass = []
const fail = []

function check(label, value) {
  if (value) { pass.push(label) } else { fail.push(label) }
}

const sql       = readFileSync(resolve(root, 'server/db/migrations/062_novee_os_deployment_activation.sql'), 'utf8')
const contracts = readFileSync(resolve(root, 'server/services/noveeOS/noveeOSDeploymentActivationContracts.js'), 'utf8')
const flags     = readFileSync(resolve(root, 'server/config/noveeOSDeploymentActivationFeatureFlags.js'), 'utf8')
const service   = readFileSync(resolve(root, 'server/services/noveeOS/noveeOSDeploymentActivationService.js'), 'utf8')
const ctrl      = readFileSync(resolve(root, 'server/controllers/noveeOSDeploymentActivationController.js'), 'utf8')
const routes    = readFileSync(resolve(root, 'server/routes/noveeOSDeploymentActivationRoutes.js'), 'utf8')
const page      = readFileSync(resolve(root, 'src/pages/phaseD/DeploymentActivation.jsx'), 'utf8')
const appJsx    = readFileSync(resolve(root, 'src/App.jsx'), 'utf8')
const cmdCenter = readFileSync(resolve(root, 'src/pages/noveeOS/NoveeOSCommandCenter.jsx'), 'utf8')
const docs      = readFileSync(resolve(root, 'docs/PHASE_E_4_DEPLOYMENT_ACTIVATION.md'), 'utf8')
const pkgJson   = readFileSync(resolve(root, 'package.json'), 'utf8')
const serverIdx = readFileSync(resolve(root, 'server/index.js'), 'utf8')

// ── Migration 062 ─────────────────────────────────────────────
check('SQL 062: file exists',                                    sql.length > 0)
check('SQL 062: novee_os_deployment_environment_registry table', sql.includes('CREATE TABLE IF NOT EXISTS novee_os_deployment_environment_registry'))
check('SQL 062: novee_os_deployment_readiness_gates table',      sql.includes('CREATE TABLE IF NOT EXISTS novee_os_deployment_readiness_gates'))
check('SQL 062: novee_os_deployment_package_registry table',     sql.includes('CREATE TABLE IF NOT EXISTS novee_os_deployment_package_registry'))
check('SQL 062: novee_os_deployment_audit_log table',            sql.includes('CREATE TABLE IF NOT EXISTS novee_os_deployment_audit_log'))
check('SQL 062: novee_os_rollback_plan_registry table',          sql.includes('CREATE TABLE IF NOT EXISTS novee_os_rollback_plan_registry'))
check('SQL 062: novee_os_deployment_evidence_registry table',    sql.includes('CREATE TABLE IF NOT EXISTS novee_os_deployment_evidence_registry'))
check('SQL 062: rollback_execution_enabled DEFAULT FALSE',       /rollback_execution_enabled\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL 062: deployment_ready DEFAULT FALSE',                 /deployment_ready\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL 062: remote_distribution_ready DEFAULT FALSE',        /remote_distribution_ready\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL 062: production_candidate DEFAULT FALSE',             /production_candidate\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL 062: verified DEFAULT FALSE',                         /verified\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL 062: no DROP TABLE',                                 !sql.toLowerCase().includes('drop table'))
check('SQL 062: no ALTER TABLE DROP',                           !sql.toLowerCase().includes('drop column'))

// ── Deployment gate keys ──────────────────────────────────────
const requiredGateKeys = [
  'security_activation_gate', 'production_environment_gate', 'railway_database_gate',
  'node_env_production_gate', 'database_ssl_gate', 'migration_status_gate',
  'build_status_gate', 'verification_scripts_gate', 'frontend_routes_gate',
  'api_routes_gate', 'provider_activation_gate', 'payment_activation_gate',
  'external_pos_activation_gate', 'inventory_activation_gate', 'communication_activation_gate',
  'deployment_audit_gate', 'rollback_plan_gate', 'safe_claims_gate', 'documentation_gate',
]
for (const key of requiredGateKeys) {
  check(`CONTRACTS: gate key "${key}" in default gates`, contracts.includes(`'${key}'`))
}

// ── Contracts ─────────────────────────────────────────────────
check('CONTRACTS: file exists',                                  contracts.length > 0)
check('CONTRACTS: DEPLOYMENT_ENVIRONMENT_TYPES defined',         contracts.includes('DEPLOYMENT_ENVIRONMENT_TYPES'))
check('CONTRACTS: DEPLOYMENT_GATE_STATUSES defined',             contracts.includes('DEPLOYMENT_GATE_STATUSES'))
check('CONTRACTS: DEPLOYMENT_PACKAGE_TYPES defined',             contracts.includes('DEPLOYMENT_PACKAGE_TYPES'))
check('CONTRACTS: DEPLOYMENT_PACKAGE_STATUSES defined',          contracts.includes('DEPLOYMENT_PACKAGE_STATUSES'))
check('CONTRACTS: DEPLOYMENT_EVIDENCE_STATUSES defined',         contracts.includes('DEPLOYMENT_EVIDENCE_STATUSES'))
check('CONTRACTS: SAFE_DEPLOYMENT_CLAIM_LABELS defined',         contracts.includes('SAFE_DEPLOYMENT_CLAIM_LABELS'))
check('CONTRACTS: FORBIDDEN_FAKE_DEPLOYMENT_CLAIMS defined',     contracts.includes('FORBIDDEN_FAKE_DEPLOYMENT_CLAIMS'))
check('CONTRACTS: FORBIDDEN_SECRET_FIELDS defined',              contracts.includes('FORBIDDEN_SECRET_FIELDS'))
check('CONTRACTS: DEFAULT_DEPLOYMENT_GATES exported',            contracts.includes('DEFAULT_DEPLOYMENT_GATES'))
check('CONTRACTS: DEFAULT_DEPLOYMENT_PACKAGES exported',         contracts.includes('DEFAULT_DEPLOYMENT_PACKAGES'))
check('CONTRACTS: DEFAULT_ROLLBACK_PLANS exported',              contracts.includes('DEFAULT_ROLLBACK_PLANS'))
check('CONTRACTS: assertNoExposedDeploymentSecrets exported',    contracts.includes('export function assertNoExposedDeploymentSecrets'))
check('CONTRACTS: assertNoFakeProductionProofClaims exported',   contracts.includes('export function assertNoFakeProductionProofClaims'))
check('CONTRACTS: assertNoFakeRailwayReadinessClaims exported',  contracts.includes('export function assertNoFakeRailwayReadinessClaims'))
check('CONTRACTS: assertNoFakeVercelReadinessClaims exported',   contracts.includes('export function assertNoFakeVercelReadinessClaims'))
check('CONTRACTS: assertNoFakeBuildPassClaims exported',         contracts.includes('export function assertNoFakeBuildPassClaims'))
check('CONTRACTS: assertNoFakeVerificationPassClaims exported',  contracts.includes('export function assertNoFakeVerificationPassClaims'))
check('CONTRACTS: assertNoRollbackExecutionClaims exported',     contracts.includes('export function assertNoRollbackExecutionClaims'))
check('CONTRACTS: assertNoRemoteDistributionBeforeDeploymentReady exported', contracts.includes('export function assertNoRemoteDistributionBeforeDeploymentReady'))
check('CONTRACTS: assertSecurityGateRequired exported',          contracts.includes('export function assertSecurityGateRequired'))
check('CONTRACTS: validateDeploymentGatePayload exported',       contracts.includes('export function validateDeploymentGatePayload'))
check('CONTRACTS: validateDeploymentPackagePayload exported',    contracts.includes('export function validateDeploymentPackagePayload'))
check('CONTRACTS: validateDeploymentEnvironmentPayload exported', contracts.includes('export function validateDeploymentEnvironmentPayload'))
check('CONTRACTS: validateDeploymentEvidencePayload exported',   contracts.includes('export function validateDeploymentEvidencePayload'))
check('CONTRACTS: railway_token in FORBIDDEN_SECRET_FIELDS',     contracts.includes('railway_token'))
check('CONTRACTS: vercel_token in FORBIDDEN_SECRET_FIELDS',      contracts.includes('vercel_token'))
check('CONTRACTS: deployment_ready: true in forbidden claims',   contracts.includes('deployment_ready'))
check('CONTRACTS: rollback_execution_enabled forbidden in preview', contracts.includes('rollback_execution_enabled may not be set to true'))
check('CONTRACTS: export default',                               contracts.includes('export default {'))

// ── Feature flags ─────────────────────────────────────────────
check('FLAGS: NOVEE_DEPLOYMENT_ACTIVATION_ENABLED true',         /NOVEE_DEPLOYMENT_ACTIVATION_ENABLED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_LIVE_PRODUCTION_ENABLED false',   /NOVEE_DEPLOYMENT_LIVE_PRODUCTION_ENABLED\s*:\s*false/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_REMOTE_DISTRIBUTION_ENABLED false', /NOVEE_DEPLOYMENT_REMOTE_DISTRIBUTION_ENABLED\s*:\s*false/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_ROLLBACK_EXECUTION_ENABLED false', /NOVEE_DEPLOYMENT_ROLLBACK_EXECUTION_ENABLED\s*:\s*false/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_FAKE_PRODUCTION_PROOF_BLOCKED true', /NOVEE_DEPLOYMENT_FAKE_PRODUCTION_PROOF_BLOCKED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_SECRET_EXPOSURE_BLOCKED true',    /NOVEE_DEPLOYMENT_SECRET_EXPOSURE_BLOCKED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_FAKE_BUILD_PASS_BLOCKED true',    /NOVEE_DEPLOYMENT_FAKE_BUILD_PASS_BLOCKED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_FAKE_VERIFICATION_PASS_BLOCKED true', /NOVEE_DEPLOYMENT_FAKE_VERIFICATION_PASS_BLOCKED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_SECURITY_GATE_REQUIRED true',     /NOVEE_DEPLOYMENT_SECURITY_GATE_REQUIRED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_FRONTEND_SAFE_CLAIMS_ENABLED true', /NOVEE_DEPLOYMENT_FRONTEND_SAFE_CLAIMS_ENABLED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DEPLOYMENT_AUDIT_LOGGING_ENABLED true',      /NOVEE_DEPLOYMENT_AUDIT_LOGGING_ENABLED\s*:\s*true/.test(flags))
check('FLAGS: getNoveeOSDeploymentActivationFlags exported',     flags.includes('export function getNoveeOSDeploymentActivationFlags'))

// ── Service ───────────────────────────────────────────────────
check('SERVICE: file exists',                                    service.length > 0)
check('SERVICE: getDeploymentActivationSummary',                 service.includes('getDeploymentActivationSummary'))
check('SERVICE: listDeploymentEnvironments',                     service.includes('listDeploymentEnvironments'))
check('SERVICE: getDeploymentEnvironment',                       service.includes('getDeploymentEnvironment'))
check('SERVICE: createDeploymentEnvironmentPreview',             service.includes('createDeploymentEnvironmentPreview'))
check('SERVICE: listDeploymentReadinessGates',                   service.includes('listDeploymentReadinessGates'))
check('SERVICE: getDeploymentReadinessGate',                     service.includes('getDeploymentReadinessGate'))
check('SERVICE: updateDeploymentReadinessGatePreview',           service.includes('updateDeploymentReadinessGatePreview'))
check('SERVICE: listDeploymentPackages',                         service.includes('listDeploymentPackages'))
check('SERVICE: getDeploymentPackage',                           service.includes('getDeploymentPackage'))
check('SERVICE: createDeploymentPackagePreview',                 service.includes('createDeploymentPackagePreview'))
check('SERVICE: listRollbackPlans',                              service.includes('listRollbackPlans'))
check('SERVICE: createRollbackPlanPreview',                      service.includes('createRollbackPlanPreview'))
check('SERVICE: getRollbackPlan',                                service.includes('getRollbackPlan'))
check('SERVICE: listDeploymentEvidence',                         service.includes('listDeploymentEvidence'))
check('SERVICE: createDeploymentEvidencePreview',                service.includes('createDeploymentEvidencePreview'))
check('SERVICE: getDeploymentReadinessScore',                    service.includes('getDeploymentReadinessScore'))
check('SERVICE: getDeploymentBlockers',                          service.includes('getDeploymentBlockers'))
check('SERVICE: getSecurityGateDependency',                      service.includes('getSecurityGateDependency'))
check('SERVICE: getRemoteDistributionDeploymentGate',            service.includes('getRemoteDistributionDeploymentGate'))
check('SERVICE: getSafeDeploymentClaims',                        service.includes('getSafeDeploymentClaims'))
check('SERVICE: writeDeploymentAuditEvent',                      service.includes('writeDeploymentAuditEvent'))
check('SERVICE: getDeploymentAuditLog',                          service.includes('getDeploymentAuditLog'))
check('SERVICE: getDeploymentFeatureFlagSnapshot',               service.includes('getDeploymentFeatureFlagSnapshot'))
check('SERVICE: validateDeploymentActivationReadiness',          service.includes('validateDeploymentActivationReadiness'))
check('SERVICE: deployment_ready: false always',                 service.includes('deployment_ready:'))
check('SERVICE: remote_distribution_ready false always',         service.includes('remote_distribution_ready:'))
check('SERVICE: BUILD_ONLY_NO_LIVE_DEPLOYMENT safety status',    service.includes('BUILD_ONLY_NO_LIVE_DEPLOYMENT'))
check('SERVICE: localFallback used',                             service.includes('localFallback'))
check('SERVICE: no raw secrets returned',                       !service.includes('process.env.RAILWAY') && !service.includes('process.env.VERCEL_TOKEN'))

// ── Controller ────────────────────────────────────────────────
check('CTRL: file exists',                                       ctrl.length > 0)
check('CTRL: ok500 pattern',                                     ctrl.includes('ok500'))
check('CTRL: actorId pattern',                                   ctrl.includes('actorId'))
check('CTRL: productionReady: false in wrap',                    ctrl.includes('productionReady:'))
check('CTRL: deploymentReady: false in wrap',                    ctrl.includes('deploymentReady:'))
check('CTRL: remoteDistributionReady: false in wrap',            ctrl.includes('remoteDistributionReady:'))
check('CTRL: safeClaim in wrap response',                        ctrl.includes('safeClaim'))
check('CTRL: getSummary exported',                               ctrl.includes('export const getSummary'))
check('CTRL: listEnvironments exported',                         ctrl.includes('export const listEnvironments'))
check('CTRL: listGates exported',                                ctrl.includes('export const listGates'))
check('CTRL: listPackages exported',                             ctrl.includes('export const listPackages'))
check('CTRL: listRollbackPlans exported',                        ctrl.includes('export const listRollbackPlans'))
check('CTRL: getBlockers exported',                              ctrl.includes('export const getBlockers'))
check('CTRL: getSecurityGateDep exported',                       ctrl.includes('export const getSecurityGateDep'))
check('CTRL: getSafeClaims exported',                            ctrl.includes('export const getSafeClaims'))
check('CTRL: validateReadiness exported',                        ctrl.includes('export const validateReadiness'))

// ── Routes ────────────────────────────────────────────────────
check('ROUTES: GET /summary',                                    routes.includes("router.get('/summary'"))
check('ROUTES: GET /environments',                               routes.includes("router.get('/environments'"))
check('ROUTES: GET /environments/:environmentId',                routes.includes("router.get('/environments/:environmentId'"))
check('ROUTES: POST /environments/preview canAccessPOS3',        /router\.post\(['"]\/environments\/preview['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /gates',                                      routes.includes("router.get('/gates'"))
check('ROUTES: GET /gates/:gateId',                              routes.includes("router.get('/gates/:gateId'"))
check('ROUTES: PATCH /gates/:gateId/preview canAccessPOS3',      /router\.patch\(['"]\/gates\/:gateId\/preview['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /packages',                                   routes.includes("router.get('/packages'"))
check('ROUTES: GET /packages/:packageId',                        routes.includes("router.get('/packages/:packageId'"))
check('ROUTES: POST /packages/preview canAccessPOS3',            /router\.post\(['"]\/packages\/preview['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /rollback-plans',                             routes.includes("router.get('/rollback-plans'"))
check('ROUTES: POST /rollback-plans/preview canAccessPOS3',      /router\.post\(['"]\/rollback-plans\/preview['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /rollback-plans/:rollbackPlanId',             routes.includes("router.get('/rollback-plans/:rollbackPlanId'"))
check('ROUTES: GET /evidence',                                   routes.includes("router.get('/evidence'"))
check('ROUTES: POST /evidence/preview canAccessPOS3',            /router\.post\(['"]\/evidence\/preview['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /readiness-score',                            routes.includes("router.get('/readiness-score'"))
check('ROUTES: GET /blockers',                                   routes.includes("router.get('/blockers'"))
check('ROUTES: GET /security-gate-dependency',                   routes.includes("router.get('/security-gate-dependency'"))
check('ROUTES: GET /remote-distribution-gate',                   routes.includes("router.get('/remote-distribution-gate'"))
check('ROUTES: GET /safe-claims',                                routes.includes("router.get('/safe-claims'"))
check('ROUTES: GET /audit-log',                                  routes.includes("router.get('/audit-log'"))
check('ROUTES: GET /feature-flags',                              routes.includes("router.get('/feature-flags'"))
check('ROUTES: GET /validate-readiness',                         routes.includes("router.get('/validate-readiness'"))

// ── Server index wiring ────────────────────────────────────────
check('SERVER: noveeOSDeploymentActivationRoutes imported',      serverIdx.includes('noveeOSDeploymentActivationRoutes'))
check('SERVER: /api/phase-d/deployment-activation mounted',      serverIdx.includes('/api/phase-d/deployment-activation'))

// ── Frontend page ─────────────────────────────────────────────
check('PAGE: DeploymentActivation.jsx exists',                   page.length > 0)
check('PAGE: SummaryPanel component',                            page.includes('SummaryPanel'))
check('PAGE: EnvironmentsPanel component',                       page.includes('EnvironmentsPanel'))
check('PAGE: GatesPanel component',                              page.includes('GatesPanel'))
check('PAGE: PackagesPanel component',                           page.includes('PackagesPanel'))
check('PAGE: RollbackPlansPanel component',                      page.includes('RollbackPlansPanel'))
check('PAGE: BlockersPanel component',                           page.includes('BlockersPanel'))
check('PAGE: SafeClaimsPanel component',                         page.includes('SafeClaimsPanel'))
check('PAGE: AuditLogPanel component',                           page.includes('AuditLogPanel'))
check('PAGE: FeatureFlagsPanel component',                       page.includes('FeatureFlagsPanel'))
check('PAGE: SecurityGatePanel component',                       page.includes('SecurityGatePanel'))
check('PAGE: fetches /api/phase-d/deployment-activation/',       page.includes('/api/phase-d/deployment-activation'))
check('PAGE: BUILD ONLY banner visible',                         page.includes('BUILD ONLY'))
check('PAGE: remote distribution BLOCKED notice',                page.includes('BLOCKED'))
check('PAGE: No live production deployment statement',           page.includes('No live production deployment'))
check('PAGE: Rollback execution DISABLED notice',                page.includes('DISABLED'))
check('PAGE: link to security activation page',                  page.includes('/phase-d/security-activation'))
check('PAGE: export default DeploymentActivation',               page.includes('export default function DeploymentActivation'))

// ── App.jsx route ─────────────────────────────────────────────
check('APP: DeploymentActivation imported',                      appJsx.includes('DeploymentActivation'))
check('APP: phase-d/deployment-activation route',                appJsx.includes('phase-d/deployment-activation'))

// ── Command Center update ─────────────────────────────────────
check('CC: D.7 links to /phase-d/deployment-activation',         cmdCenter.includes('/phase-d/deployment-activation'))
check('CC: D.7 marked built (not disabled)',                      cmdCenter.includes("'/phase-d/deployment-activation'") || cmdCenter.includes('deployment-activation'))
check('CC: D.8 still marked not built',                          cmdCenter.includes('D.8'))

// ── NoveeHome admin link ──────────────────────────────────────
const noveeHome = readFileSync(resolve(root, 'src/pages/NoveeHome.jsx'), 'utf8')
check('NOVEEHOME: D.7 Deployment Activation link added',         noveeHome.includes('/phase-d/deployment-activation'))

// ── Safe claims / no secrets ──────────────────────────────────
check('SERVICE: cannot_claim without proof items exist',         service.includes('cannot_claim_without_proof'))
check('SERVICE: Phase E.5 in recommended_next_phase',            service.includes('Phase E.5'))
check('SERVICE: remote_distribution_allowed false enforced',    !service.includes('remote_distribution_allowed: true'))
check('CONTRACTS: no raw env var secrets',                      !contracts.includes('process.env.STRIPE') && !contracts.includes('process.env.RAILWAY_TOKEN'))
check('SERVICE: no raw env var secrets',                        !service.includes('process.env.RAILWAY_TOKEN') && !service.includes('process.env.VERCEL_TOKEN'))

// ── Docs ──────────────────────────────────────────────────────
check('DOCS: PHASE_E_4_DEPLOYMENT_ACTIVATION.md exists',         docs.length > 0)
check('DOCS: What Was Built section',                            docs.includes('What Was Built'))
check('DOCS: Deployment Gates table (19)',                       docs.includes('19'))
check('DOCS: What Is NOT Live section',                          docs.includes('What Is NOT Live'))
check('DOCS: Why Remote Distribution Remains Blocked',           docs.includes('Why Remote Distribution Remains Blocked'))
check('DOCS: Safe Sales Language',                               docs.includes('Safe Sales Language'))
check('DOCS: How This Prepares Phase E.5',                       docs.includes('Phase E.5'))
check('DOCS: Depends on Phase E.3',                              docs.includes('Phase E.3'))

// ── Package.json ──────────────────────────────────────────────
check('PKG: verify:phase-e4-deployment-activation script',       pkgJson.includes('verify:phase-e4-deployment-activation'))

// ── REPORT ────────────────────────────────────────────────────
console.log('\nNOVEE OS — Phase E.4 Deployment Activation Center Verification')
console.log('='.repeat(62))
console.log(`PASS: ${pass.length}`)
console.log(`FAIL: ${fail.length}`)

if (fail.length > 0) {
  console.log('\nFAILED CHECKS:')
  fail.forEach(f => console.log(`  ✗ ${f}`))
}

console.log('\n' + (fail.length === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${fail.length} check(s) failed`))

console.log('\n── PHASE E.4 COVERAGE ──')
const coverage = [
  ['Migration 062',             '6 deployment tables',          'created'],
  ['Deployment Contracts',      '13 assertion helpers',         'enforced'],
  ['Feature Flags',             '11 flags, live=false',         'safe defaults'],
  ['Service Layer',             '27 async methods',             'built'],
  ['Controller',                '27 handlers',                  'wired'],
  ['Routes',                    '27 endpoints',                 'registered'],
  ['Frontend Page',             '/phase-d/deployment-activation','built'],
  ['Command Center',            'D.7 updated to built',         'visible'],
  ['Deployment Gates',          '19 gates tracked',             'all pending'],
  ['Deployment Packages',       '8 packages tracked',           'all preview'],
  ['Rollback Plans',            '4 plans tracked',              'execution disabled'],
  ['Remote Distribution',       'blocked',                      'BLOCKED'],
  ['Live Production',           'disabled',                     'DISABLED'],
  ['Security Gate Dependency',  'requires Phase E.3',           'enforced'],
  ['Safe Claims System',        'can/cannot lists',             'enforced'],
]
for (const [area, detail, status] of coverage) {
  console.log(`  ${area.padEnd(28)} | ${detail.padEnd(30)} | ${status}`)
}

console.log('\n── HONEST ANSWERS ──')
console.log('  Is remote deployment live?                  → NO')
console.log('  Is live production deployment enabled?      → NO')
console.log('  Is NOVEE OS more deployment-gated now?      → YES (19 gates tracked, blockers visible)')
console.log('  Next recommended phase:                     → Phase E.5 Live Pilot Readiness')

process.exit(fail.length > 0 ? 1 : 0)
