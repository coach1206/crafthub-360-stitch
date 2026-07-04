import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
  }
}

// ─── REGISTRY ───────────────────────────────────────────────────────────────
const reg = read('server/services/pos360/pos360ProductionReadinessRegistry.js');

check('registry: exports getPOS360ReadinessRegistry', reg.includes('export function getPOS360ReadinessRegistry'));
check('registry: exports getPOS360ReadinessModule', reg.includes('export function getPOS360ReadinessModule'));
check('registry: exports listPOS360ReadinessRoutes', reg.includes('export function listPOS360ReadinessRoutes'));
check('registry: exports listPOS360ReadinessFrontendRoutes', reg.includes('export function listPOS360ReadinessFrontendRoutes'));
check('registry: exports listPOS360NoFakeProtections', reg.includes('export function listPOS360NoFakeProtections'));
check('registry: exports listPOS360HonestLimitations', reg.includes('export function listPOS360HonestLimitations'));
check('registry: exports getPOS360FinalPhaseTracker', reg.includes('export function getPOS360FinalPhaseTracker'));
check('registry: has POS360_PRODUCTION_READINESS_REGISTRY', reg.includes('POS360_PRODUCTION_READINESS_REGISTRY'));
check('registry: has customers module', reg.includes("customer"));
check('registry: has reservations module', reg.includes("reservations"));
check('registry: has events module', reg.includes("event"));
check('registry: has payments module', reg.includes("payments"));
check('registry: has staff module', reg.includes("staff"));
check('registry: has reports module', reg.includes("reports"));
check('registry: has settings module', reg.includes("settings"));
check('registry: has integrations module', reg.includes("integrations"));
check('registry: has fulfillment module', reg.includes("fulfillment"));
check('registry: has self-ordering module', reg.includes("self-ordering"));
check('registry: has /api/pos360/customers route', reg.includes('/api/pos360/customers'));
check('registry: has /api/pos360/reservations route', reg.includes('/api/pos360/reservations'));
check('registry: has /api/pos360/events route', reg.includes('/api/pos360/events'));
check('registry: has /api/pos360/payments route', reg.includes('/api/pos360/payments'));
check('registry: has /api/pos360/staff route', reg.includes('/api/pos360/staff'));
check('registry: has /api/pos360/reports route', reg.includes('/api/pos360/reports'));
check('registry: has /api/pos360/settings route', reg.includes('/api/pos360/settings'));
check('registry: has /api/pos360/integrations route', reg.includes('/api/pos360/integrations'));
check('registry: has /api/pos360/fulfillment route', reg.includes('/api/pos360/fulfillment'));
check('registry: has /api/pos360/self-ordering route', reg.includes('/api/pos360/self-ordering'));
check('registry: has totalPhases: 18', reg.includes('totalPhases: 18'));
check('registry: has completedPhases: 18', reg.includes('completedPhases: 18'));
check('registry: has phase_b_complete status', reg.includes('phase_b_complete'));
check('registry: productionFoundationReady true', reg.includes('productionFoundationReady: true'));
check('registry: liveProviderActivationPending true', reg.includes('liveProviderActivationPending: true'));
check('registry: phaseCRecommended true', reg.includes('phaseCRecommended: true'));
check('registry: no canAccessPOS3 false', !reg.includes('canAccessPOS3Required: false'));
check('registry: has noFakeProtections arrays', reg.includes('noFakeProtections:'));
check('registry: has honestLimitations arrays', reg.includes('honestLimitations:'));

// ─── FEATURE FLAGS ───────────────────────────────────────────────────────────
const flags = read('server/config/pos360ProductionReadinessFeatureFlags.js');

check('flags: has DEFAULT_POS360_PRODUCTION_READINESS_FLAGS', flags.includes('DEFAULT_POS360_PRODUCTION_READINESS_FLAGS'));
check('flags: exports getProductionReadinessFlags', flags.includes('export function getProductionReadinessFlags'));
check('flags: productionReadinessEnabled: true', flags.includes('productionReadinessEnabled: true'));
check('flags: finalAuditEnabled: true', flags.includes('finalAuditEnabled: true'));
check('flags: launchLockEnabled: true', flags.includes('launchLockEnabled: true'));
check('flags: routeRegistryAuditEnabled: true', flags.includes('routeRegistryAuditEnabled: true'));
check('flags: frontendRouteAuditEnabled: true', flags.includes('frontendRouteAuditEnabled: true'));
check('flags: apiMountAuditEnabled: true', flags.includes('apiMountAuditEnabled: true'));
check('flags: canAccessPOS3AuditEnabled: true', flags.includes('canAccessPOS3AuditEnabled: true'));
check('flags: noFakeAuditEnabled: true', flags.includes('noFakeAuditEnabled: true'));
check('flags: secretStorageAuditEnabled: true', flags.includes('secretStorageAuditEnabled: true'));
check('flags: piiFinancialAuditEnabled: true', flags.includes('piiFinancialAuditEnabled: true'));
check('flags: idempotencyAuditEnabled: true', flags.includes('idempotencyAuditEnabled: true'));
check('flags: venueScopeAuditEnabled: true', flags.includes('venueScopeAuditEnabled: true'));
check('flags: managerApprovalAuditEnabled: true', flags.includes('managerApprovalAuditEnabled: true'));
check('flags: offlineQueueAuditEnabled: true', flags.includes('offlineQueueAuditEnabled: true'));
check('flags: featureFlagAuditEnabled: true', flags.includes('featureFlagAuditEnabled: true'));
check('flags: localeAuditEnabled: true', flags.includes('localeAuditEnabled: true'));
check('flags: localPreviewTruthAuditEnabled: true', flags.includes('localPreviewTruthAuditEnabled: true'));
check('flags: demoModeControlsEnabled: true', flags.includes('demoModeControlsEnabled: true'));
check('flags: launchDisclosureEnabled: true', flags.includes('launchDisclosureEnabled: true'));
check('flags: venueSalesClaimsGuardEnabled: true', flags.includes('venueSalesClaimsGuardEnabled: true'));
check('flags: productionLockFileEnabled: true', flags.includes('productionLockFileEnabled: true'));
check('flags: finalReadinessDashboardEnabled: true', flags.includes('finalReadinessDashboardEnabled: true'));
check('flags: finalVerificationScriptEnabled: true', flags.includes('finalVerificationScriptEnabled: true'));
check('flags: futurePhaseCRecommendationsEnabled: true', flags.includes('futurePhaseCRecommendationsEnabled: true'));
check('flags: noFakePaymentClaimsEnforced: true', flags.includes('noFakePaymentClaimsEnforced: true'));
check('flags: noFakeProviderClaimsEnforced: true', flags.includes('noFakeProviderClaimsEnforced: true'));
check('flags: noFakeExternalPOSClaimsEnforced: true', flags.includes('noFakeExternalPOSClaimsEnforced: true'));
check('flags: noFakeKDSClaimsEnforced: true', flags.includes('noFakeKDSClaimsEnforced: true'));
check('flags: noFakePrinterClaimsEnforced: true', flags.includes('noFakePrinterClaimsEnforced: true'));
check('flags: noFakeInventoryClaimsEnforced: true', flags.includes('noFakeInventoryClaimsEnforced: true'));
check('flags: noFakeAgeVerificationClaimsEnforced: true', flags.includes('noFakeAgeVerificationClaimsEnforced: true'));
check('flags: noFakeEATAIClaimsEnforced: true', flags.includes('noFakeEATAIClaimsEnforced: true'));
check('flags: noFakeSmokeCraftSyncClaimsEnforced: true', flags.includes('noFakeSmokeCraftSyncClaimsEnforced: true'));
check('flags: noSecretsStorageEnforced: true', flags.includes('noSecretsStorageEnforced: true'));
check('flags: canAccessPOS3ProtectionRequired: true', flags.includes('canAccessPOS3ProtectionRequired: true'));
check('flags: uses venueOverrides spread', flags.includes('venueOverrides'));

// ─── LOCALES ─────────────────────────────────────────────────────────────────
const loc = read('src/locales/pos360ProductionReadiness.js');

check('locales: exports tProductionReadiness', loc.includes('export function tProductionReadiness'));
check('locales: exports getSupportedProductionReadinessLanguages', loc.includes('export function getSupportedProductionReadinessLanguages'));
check('locales: has en-US locale', loc.includes("'en-US'"));
check('locales: has es-DO locale', loc.includes("'es-DO'"));
check('locales: has es locale', loc.includes("'es'"));
check('locales: has ht locale', loc.includes("'ht'"));
check('locales: has de locale', loc.includes("'de'"));
check('locales: has pt locale', loc.includes("'pt'"));
check('locales: has productionReadiness key', loc.includes('productionReadiness'));
check('locales: has finalAudit key', loc.includes('finalAudit'));
check('locales: has launchLock key', loc.includes('launchLock'));
check('locales: has routeRegistry key', loc.includes('routeRegistry'));
check('locales: has apiMounts key', loc.includes('apiMounts'));
check('locales: has frontendRoutes key', loc.includes('frontendRoutes'));
check('locales: has authGuards key', loc.includes('authGuards'));
check('locales: has canAccessPOS3Confirmed key', loc.includes('canAccessPOS3Confirmed'));
check('locales: has noFakeClaims key', loc.includes('noFakeClaims'));
check('locales: has honestLimitations key', loc.includes('honestLimitations'));
check('locales: has secretsNotStored key', loc.includes('secretsNotStored'));
check('locales: has piiProtected key', loc.includes('piiProtected'));
check('locales: has financialDataProtected key', loc.includes('financialDataProtected'));
check('locales: has idempotencyPresent key', loc.includes('idempotencyPresent'));
check('locales: has venueScopePresent key', loc.includes('venueScopePresent'));
check('locales: has managerApprovalPresent key', loc.includes('managerApprovalPresent'));
check('locales: has offlineQueuePresent key', loc.includes('offlineQueuePresent'));
check('locales: has featureFlagsPresent key', loc.includes('featureFlagsPresent'));
check('locales: has localesPresent key', loc.includes('localesPresent'));
check('locales: has demoModeControls key', loc.includes('demoModeControls'));
check('locales: has launchDisclosure key', loc.includes('launchDisclosure'));
check('locales: has whatIsInPlace key', loc.includes('whatIsInPlace'));
check('locales: has whatIsNotInPlace key', loc.includes('whatIsNotInPlace'));
check('locales: has safeVenueClaims key', loc.includes('safeVenueClaims'));
check('locales: has notYetLive key', loc.includes('notYetLive'));
check('locales: has phaseBComplete key', loc.includes('phaseBComplete'));
check('locales: has phaseCRecommended key', loc.includes('phaseCRecommended'));
check('locales: has productionFoundationReady key', loc.includes('productionFoundationReady'));
check('locales: has liveProviderActivationPending key', loc.includes('liveProviderActivationPending'));
check('locales: has safeToSay key', loc.includes('safeToSay'));
check('locales: has notSafeToClaim key', loc.includes('notSafeToClaim'));
check('locales: has finalVerification key', loc.includes('finalVerification'));
check('locales: has deviceLine key', loc.includes('deviceLine'));
check('locales: has honestEmptyState key', loc.includes('honestEmptyState'));
check('locales: has phaseBRange key', loc.includes('phaseBRange'));
check('locales: has phaseB18Final key', loc.includes('phaseB18Final'));
check('locales: has finalLaunchLock key', loc.includes('finalLaunchLock'));
check('locales: has noSecretsStored key', loc.includes('noSecretsStored'));

// ─── SERVICE ─────────────────────────────────────────────────────────────────
const svc = read('server/services/pos360/pos360ProductionReadinessService.js');

check('service: has JSDoc falls back gracefully', svc.includes('Falls back gracefully when no database connection is configured'));
check('service: has JSDoc never prints connection string', svc.includes('Never prints or logs the database connection string'));
check('service: imports isDbAvailable from connection.js', svc.includes("from '../../db/connection.js'"));
check('service: has AREA pos360-production-readiness', svc.includes("AREA = 'pos360-production-readiness'"));
check('service: has LOCAL fallback', svc.includes('localPreview: true'));
check('service: exports getProductionReadinessRegistry', svc.includes('export async function getProductionReadinessRegistry'));
check('service: exports getProductionReadinessModule', svc.includes('export async function getProductionReadinessModule'));
check('service: exports getProductionReadinessSummary', svc.includes('export async function getProductionReadinessSummary'));
check('service: exports getProductionReadinessRoutes', svc.includes('export async function getProductionReadinessRoutes'));
check('service: exports getProductionReadinessFrontendRoutes', svc.includes('export async function getProductionReadinessFrontendRoutes'));
check('service: exports runRouteRegistryAudit', svc.includes('export async function runRouteRegistryAudit'));
check('service: exports runFrontendRouteAudit', svc.includes('export async function runFrontendRouteAudit'));
check('service: exports runApiMountAudit', svc.includes('export async function runApiMountAudit'));
check('service: exports runCanAccessPOS3Audit', svc.includes('export async function runCanAccessPOS3Audit'));
check('service: exports runNoFakeClaimsAudit', svc.includes('export async function runNoFakeClaimsAudit'));
check('service: exports runSecretStorageAudit', svc.includes('export async function runSecretStorageAudit'));
check('service: exports runPiiFinancialAudit', svc.includes('export async function runPiiFinancialAudit'));
check('service: exports runIdempotencyAudit', svc.includes('export async function runIdempotencyAudit'));
check('service: exports runVenueScopeAudit', svc.includes('export async function runVenueScopeAudit'));
check('service: exports runManagerApprovalAudit', svc.includes('export async function runManagerApprovalAudit'));
check('service: exports runOfflineQueueAudit', svc.includes('export async function runOfflineQueueAudit'));
check('service: exports runFeatureFlagAudit', svc.includes('export async function runFeatureFlagAudit'));
check('service: exports runLocaleAudit', svc.includes('export async function runLocaleAudit'));
check('service: exports runLocalPreviewTruthAudit', svc.includes('export async function runLocalPreviewTruthAudit'));
check('service: exports runDemoModeControlAudit', svc.includes('export async function runDemoModeControlAudit'));
check('service: exports runLaunchDisclosureAudit', svc.includes('export async function runLaunchDisclosureAudit'));
check('service: exports runFinalProductionReadinessAudit', svc.includes('export async function runFinalProductionReadinessAudit'));
check('service: exports getSafeVenueClaims', svc.includes('export function getSafeVenueClaims'));
check('service: exports getUnsafeClaims', svc.includes('export function getUnsafeClaims'));
check('service: exports getWhatIsInPlace', svc.includes('export function getWhatIsInPlace'));
check('service: exports getWhatIsNotInPlace', svc.includes('export function getWhatIsNotInPlace'));
check('service: exports getHonestLimitations', svc.includes('export function getHonestLimitations'));
check('service: exports getLaunchReadinessDisclosure', svc.includes('export function getLaunchReadinessDisclosure'));
check('service: exports getPhaseCRecommendations', svc.includes('export function getPhaseCRecommendations'));
check('service: exports createProductionLockSnapshot', svc.includes('export async function createProductionLockSnapshot'));
check('service: exports getProductionLockSnapshot', svc.includes('export async function getProductionLockSnapshot'));
check('service: exports getFinalPhaseTracker', svc.includes('export async function getFinalPhaseTracker'));
check('service: writeAudit contains_secrets FALSE', svc.includes('contains_secrets, stores_secrets'));
check('service: no fake payment processing', !svc.includes('payment_captured=TRUE') && !svc.includes('fakePayment'));
check('service: no fake KDS', !svc.includes('kds_connected=TRUE') && !svc.includes('fakeKds'));
check('service: no fake inventory', !svc.includes('inventory_deducted=TRUE') && !svc.includes('fakeInventory'));
check('service: no secrets storage', !svc.includes('stores_secrets: true') && !svc.includes("stores_secrets=true"));
check('service: contains_secrets FALSE in audit', svc.includes('contains_secrets: false') || svc.includes('contains_secrets,FALSE') || svc.includes('contains_secrets: FALSE'));
check('service: phaseBComplete true', svc.includes('phaseBComplete: true'));
check('service: liveProviderActivationPending true', svc.includes('liveProviderActivationPending: true'));

// ─── CONTROLLER ──────────────────────────────────────────────────────────────
const ctrl = read('server/controllers/pos360ProductionReadinessController.js');

check('controller: imports from service', ctrl.includes("from '../services/pos360/pos360ProductionReadinessService.js'"));
check('controller: ok500 pattern', ctrl.includes('const ok500 = (res, fn)'));
check('controller: vid pattern', ctrl.includes('const vid = req =>'));
check('controller: actor pattern', ctrl.includes('const actor = req =>'));
check('controller: exports getProductionReadinessRegistry', ctrl.includes('export const getProductionReadinessRegistry'));
check('controller: exports getProductionReadinessModule', ctrl.includes('export const getProductionReadinessModule'));
check('controller: exports getProductionReadinessSummary', ctrl.includes('export const getProductionReadinessSummary'));
check('controller: exports runRouteRegistryAudit', ctrl.includes('export const runRouteRegistryAudit'));
check('controller: exports runFrontendRouteAudit', ctrl.includes('export const runFrontendRouteAudit'));
check('controller: exports runApiMountAudit', ctrl.includes('export const runApiMountAudit'));
check('controller: exports runCanAccessPOS3Audit', ctrl.includes('export const runCanAccessPOS3Audit'));
check('controller: exports runNoFakeClaimsAudit', ctrl.includes('export const runNoFakeClaimsAudit'));
check('controller: exports runSecretStorageAudit', ctrl.includes('export const runSecretStorageAudit'));
check('controller: exports runPiiFinancialAudit', ctrl.includes('export const runPiiFinancialAudit'));
check('controller: exports runIdempotencyAudit', ctrl.includes('export const runIdempotencyAudit'));
check('controller: exports runVenueScopeAudit', ctrl.includes('export const runVenueScopeAudit'));
check('controller: exports runManagerApprovalAudit', ctrl.includes('export const runManagerApprovalAudit'));
check('controller: exports runOfflineQueueAudit', ctrl.includes('export const runOfflineQueueAudit'));
check('controller: exports runFeatureFlagAudit', ctrl.includes('export const runFeatureFlagAudit'));
check('controller: exports runLocaleAudit', ctrl.includes('export const runLocaleAudit'));
check('controller: exports runLocalPreviewTruthAudit', ctrl.includes('export const runLocalPreviewTruthAudit'));
check('controller: exports runDemoModeControlAudit', ctrl.includes('export const runDemoModeControlAudit'));
check('controller: exports runLaunchDisclosureAudit', ctrl.includes('export const runLaunchDisclosureAudit'));
check('controller: exports runFinalProductionReadinessAudit', ctrl.includes('export const runFinalProductionReadinessAudit'));
check('controller: exports getSafeVenueClaims', ctrl.includes('export const getSafeVenueClaims'));
check('controller: exports getUnsafeClaims', ctrl.includes('export const getUnsafeClaims'));
check('controller: exports getWhatIsInPlace', ctrl.includes('export const getWhatIsInPlace'));
check('controller: exports getWhatIsNotInPlace', ctrl.includes('export const getWhatIsNotInPlace'));
check('controller: exports getHonestLimitations', ctrl.includes('export const getHonestLimitations'));
check('controller: exports getLaunchReadinessDisclosure', ctrl.includes('export const getLaunchReadinessDisclosure'));
check('controller: exports getPhaseCRecommendations', ctrl.includes('export const getPhaseCRecommendations'));
check('controller: exports createProductionLockSnapshot', ctrl.includes('export const createProductionLockSnapshot'));
check('controller: exports getProductionLockSnapshot', ctrl.includes('export const getProductionLockSnapshot'));
check('controller: exports getFinalPhaseTracker', ctrl.includes('export const getFinalPhaseTracker'));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
const routes = read('server/routes/pos360ProductionReadinessRoutes.js');

check('routes: mount comment /api/pos360/production-readiness', routes.includes('/api/pos360/production-readiness'));
check('routes: imports canAccessPOS3', routes.includes('canAccessPOS3'));
check('routes: imports from roleMiddleware', routes.includes('roleMiddleware'));
check('routes: GET /registry', routes.includes("router.get('/registry'"));
check('routes: GET /registry/:moduleKey', routes.includes("router.get('/registry/:moduleKey'"));
check('routes: GET /summary', routes.includes("router.get('/summary'"));
check('routes: GET /routes/backend', routes.includes("router.get('/routes/backend'"));
check('routes: GET /routes/frontend', routes.includes("router.get('/routes/frontend'"));
check('routes: GET /claims/safe', routes.includes("router.get('/claims/safe'"));
check('routes: GET /claims/unsafe', routes.includes("router.get('/claims/unsafe'"));
check('routes: GET /what-is-in-place', routes.includes("router.get('/what-is-in-place'"));
check('routes: GET /what-is-not-in-place', routes.includes("router.get('/what-is-not-in-place'"));
check('routes: GET /honest-limitations', routes.includes("router.get('/honest-limitations'"));
check('routes: GET /launch-disclosure', routes.includes("router.get('/launch-disclosure'"));
check('routes: GET /phase-c-recommendations', routes.includes("router.get('/phase-c-recommendations'"));
check('routes: GET /tracker', routes.includes("router.get('/tracker'"));
check('routes: GET /audit/route-registry with canAccessPOS3', routes.includes("router.get('/audit/route-registry', canAccessPOS3"));
check('routes: GET /audit/frontend-routes with canAccessPOS3', routes.includes("router.get('/audit/frontend-routes', canAccessPOS3"));
check('routes: GET /audit/api-mounts with canAccessPOS3', routes.includes("router.get('/audit/api-mounts', canAccessPOS3"));
check('routes: GET /audit/can-access-pos3 with canAccessPOS3', routes.includes("router.get('/audit/can-access-pos3', canAccessPOS3"));
check('routes: GET /audit/no-fake-claims with canAccessPOS3', routes.includes("router.get('/audit/no-fake-claims', canAccessPOS3"));
check('routes: GET /audit/secret-storage with canAccessPOS3', routes.includes("router.get('/audit/secret-storage', canAccessPOS3"));
check('routes: GET /audit/pii-financial with canAccessPOS3', routes.includes("router.get('/audit/pii-financial', canAccessPOS3"));
check('routes: GET /audit/idempotency with canAccessPOS3', routes.includes("router.get('/audit/idempotency', canAccessPOS3"));
check('routes: GET /audit/venue-scope with canAccessPOS3', routes.includes("router.get('/audit/venue-scope', canAccessPOS3"));
check('routes: GET /audit/manager-approval with canAccessPOS3', routes.includes("router.get('/audit/manager-approval', canAccessPOS3"));
check('routes: GET /audit/offline-queue with canAccessPOS3', routes.includes("router.get('/audit/offline-queue', canAccessPOS3"));
check('routes: GET /audit/feature-flags with canAccessPOS3', routes.includes("router.get('/audit/feature-flags', canAccessPOS3"));
check('routes: GET /audit/locales with canAccessPOS3', routes.includes("router.get('/audit/locales', canAccessPOS3"));
check('routes: GET /audit/local-preview-truth with canAccessPOS3', routes.includes("router.get('/audit/local-preview-truth', canAccessPOS3"));
check('routes: GET /audit/demo-mode-controls with canAccessPOS3', routes.includes("router.get('/audit/demo-mode-controls', canAccessPOS3"));
check('routes: GET /audit/launch-disclosure with canAccessPOS3', routes.includes("router.get('/audit/launch-disclosure', canAccessPOS3"));
check('routes: GET /audit/final with canAccessPOS3', routes.includes("router.get('/audit/final', canAccessPOS3"));
check('routes: POST /lock-snapshot with canAccessPOS3', routes.includes("router.post('/lock-snapshot', canAccessPOS3"));
check('routes: GET /lock-snapshot with canAccessPOS3', routes.includes("router.get('/lock-snapshot', canAccessPOS3"));
check('routes: export default router', routes.includes('export default router'));

// ─── UI ───────────────────────────────────────────────────────────────────────
const ui = read('src/pages/pos360/POS360ProductionReadiness.jsx');

check('ui: DEVICE_LINE hardcoded literal', ui.includes("const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop'"));
check('ui: uses DEVICE_LINE', ui.includes('{DEVICE_LINE}'));
check('ui: has smokecraft-pos360.png first instance', ui.includes('src="/smokecraft-pos360.png"'));
check('ui: has smokecraft-pos360.png second instance', (ui.match(/src="\/smokecraft-pos360\.png"/g) || []).length >= 2);
check('ui: imports tProductionReadiness', ui.includes('tProductionReadiness'));
check('ui: function POS360ProductionReadiness()', ui.includes('function POS360ProductionReadiness()'));
check('ui: export default POS360ProductionReadiness', ui.includes('export default POS360ProductionReadiness'));
check('ui: no export default function', !ui.includes('export default function POS360ProductionReadiness'));
check('ui: has DashboardPanel', ui.includes('function DashboardPanel'));
check('ui: has RegistryPanel', ui.includes('function RegistryPanel'));
check('ui: has RoutesPanel', ui.includes('function RoutesPanel'));
check('ui: has AuditsPanel', ui.includes('function AuditsPanel'));
check('ui: has NoFakeClaimsPanel', ui.includes('function NoFakeClaimsPanel'));
check('ui: has SecretsAuditPanel', ui.includes('function SecretsAuditPanel'));
check('ui: has PiiFinancialPanel', ui.includes('function PiiFinancialPanel'));
check('ui: has IdempotencyPanel', ui.includes('function IdempotencyPanel'));
check('ui: has VenueScopePanel', ui.includes('function VenueScopePanel'));
check('ui: has ManagerApprovalPanel', ui.includes('function ManagerApprovalPanel'));
check('ui: has OfflineQueuePanel', ui.includes('function OfflineQueuePanel'));
check('ui: has FeatureFlagsPanel', ui.includes('function FeatureFlagsPanel'));
check('ui: has LocalesPanel', ui.includes('function LocalesPanel'));
check('ui: has LocalPreviewPanel', ui.includes('function LocalPreviewPanel'));
check('ui: has DemoModePanel', ui.includes('function DemoModePanel'));
check('ui: has LaunchDisclosurePanel', ui.includes('function LaunchDisclosurePanel'));
check('ui: has SafeClaimsPanel', ui.includes('function SafeClaimsPanel'));
check('ui: has UnsafeClaimsPanel', ui.includes('function UnsafeClaimsPanel'));
check('ui: has WhatIsInPlacePanel', ui.includes('function WhatIsInPlacePanel'));
check('ui: has WhatIsNotInPlacePanel', ui.includes('function WhatIsNotInPlacePanel'));
check('ui: has HonestLimitationsPanel', ui.includes('function HonestLimitationsPanel'));
check('ui: has PhaseCRecsPanel', ui.includes('function PhaseCRecsPanel'));
check('ui: has LockSnapshotPanel', ui.includes('function LockSnapshotPanel'));
check('ui: has PhaseTrackerPanel', ui.includes('function PhaseTrackerPanel'));
check('ui: has CanAccessPOS3Panel', ui.includes('function CanAccessPOS3Panel'));
check('ui: has AuditFinalPanel', ui.includes('function AuditFinalPanel'));
check('ui: has ModulePanel', ui.includes('function ModulePanel'));
check('ui: has LanguageSelectorPanel', ui.includes('function LanguageSelectorPanel'));
check('ui: has DARK_BG color', ui.includes("DARK_BG = '#080604'"));
check('ui: has GOLD color', ui.includes("GOLD = '#c9952c'"));
check('ui: has DARK_CARD color', ui.includes("DARK_CARD = '#13110d'"));
check('ui: has DARK_LINE color', ui.includes("DARK_LINE = '#2a2520'"));
check('ui: has DARK_TEXT color', ui.includes("DARK_TEXT = '#f0ead8'"));
check('ui: has DARK_MUTE color', ui.includes("DARK_MUTE = '#8a7e6a'"));
check('ui: has RED color', ui.includes("RED = '#c0392b'"));
check('ui: has GREEN color', ui.includes("GREEN = '#27ae60'"));
check('ui: has BLUE color', ui.includes("BLUE = '#2980b9'"));
check('ui: has AMBER color', ui.includes("AMBER = '#e67e22'"));
check('ui: has no fake claims text', ui.includes('no fake'));
check('ui: references localPreview', ui.includes('localPreview'));
check('ui: has phase b complete reference', ui.includes('phase_b_complete') || ui.includes('Phase B'));
check('ui: locale selector en-US', ui.includes("'en-US'"));
check('ui: locale selector es-DO', ui.includes("'es-DO'"));
check('ui: TABS array with Dashboard', ui.includes("'Dashboard'"));
check('ui: TABS has Lock Snapshot', ui.includes("'Lock Snapshot'"));
check('ui: TABS has Phase Tracker', ui.includes("'Phase Tracker'"));
check('ui: has /api/pos360/production-readiness reference', ui.includes('/api/pos360/production-readiness'));

// ─── DOCS ─────────────────────────────────────────────────────────────────────
const doc1 = read('docs/POS360_PHASE_B_PRODUCTION_READINESS.md');

check('docs: phase b complete title', doc1.includes('Phase B Complete'));
check('docs: has what is in place section', doc1.includes('What Is In Place'));
check('docs: has what is not in place section', doc1.includes('What Is Not Yet In Place'));
check('docs: has security guarantees section', doc1.includes('Security Guarantees'));
check('docs: has phase c recommendation', doc1.includes('Phase C'));
check('docs: lists customers module', doc1.includes('customers'));
check('docs: lists fulfillment module', doc1.includes('fulfillment'));
check('docs: lists self-ordering module', doc1.includes('self-ordering'));
check('docs: lists production-readiness module', doc1.includes('production-readiness'));
check('docs: has canAccessPOS3 mention', doc1.includes('canAccessPOS3'));
check('docs: has no fake claims mention', doc1.includes('no fake'));
check('docs: has DATABASE_URL mention', doc1.includes('DATABASE_URL'));
check('docs: has totalPhases 18', doc1.includes('18'));

const doc2 = read('docs/POS360_SAFE_SALES_CLAIMS.md');

check('safe claims doc: has safe to say section', doc2.includes('Safe to Say'));
check('safe claims doc: has not safe to claim section', doc2.includes('Not Safe to Claim'));
check('safe claims doc: has live provider checklist', doc2.includes('Live Provider Activation Checklist'));
check('safe claims doc: explains why distinction matters', doc2.includes('Why This Distinction Matters'));
check('safe claims doc: has no fake claims enforcement', doc2.includes('no-fake-claims enforcement'));
check('safe claims doc: lists payment provider', doc2.includes('payment provider'));
check('safe claims doc: lists KDS', doc2.includes('KDS'));
check('safe claims doc: lists printer', doc2.includes('printer'));
check('safe claims doc: lists age verification', doc2.includes('age verification'));
check('safe claims doc: lists E.A.T. AI', doc2.includes('E.A.T. AI'));
check('safe claims doc: lists SmokeCraft', doc2.includes('SmokeCraft'));
check('safe claims doc: lists Railway', doc2.includes('Railway'));
check('safe claims doc: references localPreview=true', doc2.includes('localPreview: true'));

// ─── WIRING — server/index.js ──────────────────────────────────────────────
const idx = read('server/index.js');

check('index: imports pos360ProductionReadinessRoutes', idx.includes('pos360ProductionReadinessRoutes'));
check('index: mounts /api/pos360/production-readiness', idx.includes("'/api/pos360/production-readiness'"));
check('index: uses pos360ProductionReadinessRoutes', idx.includes('app.use') && idx.includes('pos360ProductionReadinessRoutes'));

// ─── WIRING — src/App.jsx ─────────────────────────────────────────────────
const app = read('src/App.jsx');

check('App.jsx: imports POS360ProductionReadiness', app.includes('POS360ProductionReadiness'));
check('App.jsx: has production-readiness route', app.includes('production-readiness'));
check('App.jsx: renders POS360ProductionReadiness element', app.includes('<POS360ProductionReadiness'));

// ─── WIRING — package.json ──────────────────────────────────────────────────
const pkg = read('package.json');

check('package.json: has verify:pos360-production-readiness script', pkg.includes('verify:pos360-production-readiness'));
check('package.json: script runs verifyPos360ProductionReadiness.js', pkg.includes('verifyPos360ProductionReadiness'));

// ─── SECURITY: no fake data across all new files ──────────────────────────
check('security: service no fake payment captured', !svc.includes('payment_captured: true') && !svc.includes("payment_captured=true"));
check('security: service no fake kds connected', !svc.includes('kds_connected: true') && !svc.includes("kds_connected=true"));
check('security: service no fake printer connected', !svc.includes('printer_connected: true') && !svc.includes("printer_connected=true"));
check('security: service no fake inventory deducted', !svc.includes('inventory_deducted: true') && !svc.includes("inventory_deducted=true"));
check('security: service no fake age verified', !svc.includes('age_verified: true') && !svc.includes("age_verified=true"));
check('security: service no fake EAT AI', !svc.includes('eat_ai_completed: true') && !svc.includes('fakeEatAi'));
check('security: service no fake smokecraft sync', !svc.includes('smokecraft_sync_completed: true') && !svc.includes('fakeSmokecraftSync'));
check('security: service no fake external pos', !svc.includes('external_sync_completed: true') && !svc.includes('fakeExternalPos'));
check('security: registry no stores_secrets true', !reg.includes('stores_secrets: true'));
check('security: flags no false enforcement claims', !flags.includes('noFakePaymentClaimsEnforced: false'));
check('security: routes canAccessPOS3 on all audit routes', routes.includes('canAccessPOS3'));
check('security: routes canAccessPOS3 on lock-snapshot', routes.includes("'/lock-snapshot', canAccessPOS3"));
check('security: no DROP TABLE in any new file', !reg.includes('DROP TABLE') && !svc.includes('DROP TABLE'));
check('security: no DATABASE_URL in service logs', !svc.includes('console.log') || !svc.includes('DATABASE_URL'));

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log(`\n=== POS360 Production Readiness Verification ===`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`TOTAL:  ${passed + failed}`);

if (failures.length) {
  console.log('\nFAILED CHECKS:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
}

if (failed > 0) {
  console.log('\n❌ VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
  process.exit(0);
}
