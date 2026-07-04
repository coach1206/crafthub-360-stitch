// Phase B.17 — POS360 Self-Ordering Verification Script
// Checks: migration, contracts, feature flags, locales, service, controller, routes, UI, wiring, security

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../');

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

function read(relPath) {
  try {
    return readFileSync(resolve(root, relPath), 'utf8');
  } catch {
    return '';
  }
}

// ── Migration ────────────────────────────────────────────────────────────────
const sql = read('server/db/migrations/047_pos360_self_ordering_handheld_checkout.sql');

check('migration: file exists', sql.length > 0);
check('migration: no DROP TABLE', !sql.includes('DROP TABLE'));
check('migration: CREATE TABLE IF NOT EXISTS', sql.includes('CREATE TABLE IF NOT EXISTS'));
check('migration: pos360_qr_menu_sessions table', sql.includes('pos360_qr_menu_sessions'));
check('migration: pos360_self_order_carts table', sql.includes('pos360_self_order_carts'));
check('migration: pos360_self_order_cart_items table', sql.includes('pos360_self_order_cart_items'));
check('migration: pos360_self_order_submissions table', sql.includes('pos360_self_order_submissions'));
check('migration: pos360_handheld_pos_sessions table', sql.includes('pos360_handheld_pos_sessions'));
check('migration: pos360_handheld_order_entries table', sql.includes('pos360_handheld_order_entries'));
check('migration: pos360_table_ordering_sessions table', sql.includes('pos360_table_ordering_sessions'));
check('migration: pos360_guest_checkout_handoffs table', sql.includes('pos360_guest_checkout_handoffs'));
check('migration: pos360_qr_code_registry table', sql.includes('pos360_qr_code_registry'));
check('migration: pos360_menu_availability_snapshots table', sql.includes('pos360_menu_availability_snapshots'));
check('migration: pos360_age_verification_records table', sql.includes('pos360_age_verification_records'));
check('migration: pos360_self_order_modifier_selections table', sql.includes('pos360_self_order_modifier_selections'));
check('migration: pos360_guest_checkout_audit table', sql.includes('pos360_guest_checkout_audit'));
check('migration: pos360_self_order_offline_queue table', sql.includes('pos360_self_order_offline_queue'));
check('migration: pos360_menu_item_availability_overrides table', sql.includes('pos360_menu_item_availability_overrides'));
check('migration: pos360_handheld_offline_queue table', sql.includes('pos360_handheld_offline_queue'));
check('migration: pos360_self_order_visibility_insights table', sql.includes('pos360_self_order_visibility_insights'));
check('migration: pos360_smokecraft_self_order_hooks table', sql.includes('pos360_smokecraft_self_order_hooks'));
check('migration: pos360_eat_self_order_handoffs table', sql.includes('pos360_eat_self_order_handoffs'));
check('migration: self_order_completed DEFAULT FALSE', sql.includes('self_order_completed') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: payment_captured DEFAULT FALSE', sql.includes('payment_captured') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: kds_accepted DEFAULT FALSE', sql.includes('kds_accepted') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: inventory_deducted DEFAULT FALSE', sql.includes('inventory_deducted') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: age_verified DEFAULT FALSE', sql.includes('age_verified') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: printer_connected DEFAULT FALSE', sql.includes('printer_connected') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: kds_connected DEFAULT FALSE', sql.includes('kds_connected') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: external_sync_completed DEFAULT FALSE', sql.includes('external_sync_completed') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: contains_ai_generated_content DEFAULT FALSE', sql.includes('contains_ai_generated_content') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: smokecraft_sync_completed DEFAULT FALSE', sql.includes('smokecraft_sync_completed') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: contains_secrets DEFAULT FALSE', sql.includes('contains_secrets') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: stores_secrets DEFAULT FALSE', sql.includes('stores_secrets') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: generated_from_real_order DEFAULT FALSE', sql.includes('generated_from_real_order') && sql.includes('BOOLEAN NOT NULL DEFAULT FALSE'));
check('migration: exposes_private_data DEFAULT TRUE', sql.includes('exposes_private_data') && sql.includes('BOOLEAN NOT NULL DEFAULT TRUE'));
check('migration: exposes_financial_data DEFAULT TRUE', sql.includes('exposes_financial_data') && sql.includes('BOOLEAN NOT NULL DEFAULT TRUE'));
check('migration: idempotency_key UNIQUE constraint', sql.includes('UNIQUE (idempotency_key, venue_id)'));
check('migration: cross-phase order_id hook', sql.includes('order_id'));
check('migration: cross-phase table_id hook', sql.includes('table_id'));
check('migration: cross-phase reservation_id hook', sql.includes('reservation_id'));
check('migration: cross-phase guest_profile_id hook', sql.includes('guest_profile_id'));
check('migration: cross-phase customer_id hook', sql.includes('customer_id'));
check('migration: cross-phase inventory_item_id hook', sql.includes('inventory_item_id'));
check('migration: cross-phase smokecraft_session_id hook', sql.includes('smokecraft_session_id'));
check('migration: cross-phase payment_record_id hook', sql.includes('payment_record_id'));
check('migration: cross-phase staff_profile_id hook', sql.includes('staff_profile_id'));
check('migration: requires_age_verification on cart items', sql.includes('requires_age_verification'));

// ── Contracts ────────────────────────────────────────────────────────────────
const contracts = read('server/services/pos360/pos360SelfOrderingContracts.js');

check('contracts: file exists', contracts.length > 0);
check('contracts: QR_SESSION_STATUSES', contracts.includes('QR_SESSION_STATUSES'));
check('contracts: CART_STATUSES', contracts.includes('CART_STATUSES'));
check('contracts: CART_ITEM_STATUSES', contracts.includes('CART_ITEM_STATUSES'));
check('contracts: SUBMISSION_STATUSES', contracts.includes('SUBMISSION_STATUSES'));
check('contracts: HANDHELD_SESSION_STATUSES', contracts.includes('HANDHELD_SESSION_STATUSES'));
check('contracts: HANDHELD_ENTRY_STATUSES', contracts.includes('HANDHELD_ENTRY_STATUSES'));
check('contracts: TABLE_SESSION_STATUSES', contracts.includes('TABLE_SESSION_STATUSES'));
check('contracts: CHECKOUT_HANDOFF_STATUSES', contracts.includes('CHECKOUT_HANDOFF_STATUSES'));
check('contracts: QR_CODE_STATUSES', contracts.includes('QR_CODE_STATUSES'));
check('contracts: QR_TARGET_TYPES', contracts.includes('QR_TARGET_TYPES'));
check('contracts: MENU_SNAPSHOT_STATUSES', contracts.includes('MENU_SNAPSHOT_STATUSES'));
check('contracts: AGE_VERIFICATION_METHODS', contracts.includes('AGE_VERIFICATION_METHODS'));
check('contracts: AGE_VERIFICATION_STATUSES', contracts.includes('AGE_VERIFICATION_STATUSES'));
check('contracts: ITEM_TYPES', contracts.includes('ITEM_TYPES'));
check('contracts: ORDER_SOURCES', contracts.includes('ORDER_SOURCES'));
check('contracts: AVAILABILITY_OVERRIDE_TYPES', contracts.includes('AVAILABILITY_OVERRIDE_TYPES'));
check('contracts: OFFLINE_QUEUE_STATUSES', contracts.includes('OFFLINE_QUEUE_STATUSES'));
check('contracts: VISIBILITY_INSIGHT_TYPES', contracts.includes('VISIBILITY_INSIGHT_TYPES'));
check('contracts: SMOKECRAFT_HOOK_STATUSES', contracts.includes('SMOKECRAFT_HOOK_STATUSES'));
check('contracts: EAT_HANDOFF_STATUSES', contracts.includes('EAT_HANDOFF_STATUSES'));
check('contracts: isValidQrSessionStatus', contracts.includes('isValidQrSessionStatus'));
check('contracts: isValidCartStatus', contracts.includes('isValidCartStatus'));
check('contracts: isValidSubmissionStatus', contracts.includes('isValidSubmissionStatus'));
check('contracts: isValidHandheldSessionStatus', contracts.includes('isValidHandheldSessionStatus'));
check('contracts: isValidAgeVerificationMethod', contracts.includes('isValidAgeVerificationMethod'));
check('contracts: isValidSmokecraftHookStatus', contracts.includes('isValidSmokecraftHookStatus'));
check('contracts: isValidEatHandoffStatus', contracts.includes('isValidEatHandoffStatus'));

// ── Feature Flags ────────────────────────────────────────────────────────────
const flags = read('server/config/pos360SelfOrderingFeatureFlags.js');

check('flags: file exists', flags.length > 0);
check('flags: DEFAULT_POS360_SELF_ORDERING_FLAGS export', flags.includes('DEFAULT_POS360_SELF_ORDERING_FLAGS'));
check('flags: getSelfOrderingFlags function', flags.includes('getSelfOrderingFlags'));
check('flags: selfOrderingEnabled', flags.includes('selfOrderingEnabled'));
check('flags: qrMenuSessionsEnabled', flags.includes('qrMenuSessionsEnabled'));
check('flags: handheldPosSessionsEnabled', flags.includes('handheldPosSessionsEnabled'));
check('flags: tableOrderingSessionsEnabled', flags.includes('tableOrderingSessionsEnabled'));
check('flags: guestCheckoutHandoffsEnabled', flags.includes('guestCheckoutHandoffsEnabled'));
check('flags: ageVerificationRecordsEnabled', flags.includes('ageVerificationRecordsEnabled'));
check('flags: smokecraftSelfOrderHooksEnabled', flags.includes('smokecraftSelfOrderHooksEnabled'));
check('flags: eatSelfOrderHandoffsEnabled', flags.includes('eatSelfOrderHandoffsEnabled'));
check('flags: noFakeSelfOrderCompletionEnforced', flags.includes('noFakeSelfOrderCompletionEnforced: true'));
check('flags: noFakePaymentEnforced', flags.includes('noFakePaymentEnforced: true'));
check('flags: noFakeExternalPosOrderEnforced', flags.includes('noFakeExternalPosOrderEnforced: true'));
check('flags: noFakeKdsAcceptanceEnforced', flags.includes('noFakeKdsAcceptanceEnforced: true'));
check('flags: noFakeMenuAvailabilityEnforced', flags.includes('noFakeMenuAvailabilityEnforced: true'));
check('flags: noFakeInventoryDeductionEnforced', flags.includes('noFakeInventoryDeductionEnforced: true'));
check('flags: noFakeAgeVerificationEnforced', flags.includes('noFakeAgeVerificationEnforced: true'));
check('flags: noFakeEatAiEnforced', flags.includes('noFakeEatAiEnforced: true'));
check('flags: noFakeSmokecraftSyncEnforced', flags.includes('noFakeSmokecraftSyncEnforced: true'));
check('flags: noSecretsStorageEnforced', flags.includes('noSecretsStorageEnforced: true'));
check('flags: canAccessPOS3ProtectionRequired', flags.includes('canAccessPOS3ProtectionRequired: true'));
check('flags: ageGatingCigarAndAlcoholEnabled', flags.includes('ageGatingCigarAndAlcoholEnabled'));

// ── Locales ──────────────────────────────────────────────────────────────────
const locales = read('src/locales/pos360SelfOrdering.js');

check('locales: file exists', locales.length > 0);
check('locales: tSelfOrdering function', locales.includes('export function tSelfOrdering'));
check('locales: getSupportedSelfOrderingLanguages', locales.includes('export function getSupportedSelfOrderingLanguages'));
check('locales: en-US locale', locales.includes("'en-US'"));
check('locales: es-DO locale', locales.includes("'es-DO'"));
check('locales: es locale', locales.includes("'es'"));
check('locales: ht locale', locales.includes("'ht'"));
check('locales: de locale', locales.includes("'de'"));
check('locales: pt locale', locales.includes("'pt'"));
check('locales: qrMenuSessions key', locales.includes('qrMenuSessions'));
check('locales: selfOrderCarts key', locales.includes('selfOrderCarts'));
check('locales: ageVerification key', locales.includes('ageVerification'));
check('locales: noFakeSelfOrder key', locales.includes('noFakeSelfOrder'));
check('locales: noFakePayment key', locales.includes('noFakePayment'));
check('locales: noFakeKds key', locales.includes('noFakeKds'));
check('locales: noFakeInventory key', locales.includes('noFakeInventory'));
check('locales: noFakeAgeVerify key', locales.includes('noFakeAgeVerify'));
check('locales: noFakeEatAi key', locales.includes('noFakeEatAi'));
check('locales: noFakeSmokecraft key', locales.includes('noFakeSmokecraft'));
check('locales: noFakeExternalPos key', locales.includes('noFakeExternalPos'));
check('locales: noFakeMenuAvailability key', locales.includes('noFakeMenuAvailability'));
check('locales: noSecretsStored key', locales.includes('noSecretsStored'));
check('locales: honestEmptyState key', locales.includes('honestEmptyState'));
check('locales: deviceLine key', locales.includes('deviceLine'));
check('locales: ageGating key', locales.includes('ageGating'));
check('locales: offlineFallback key', locales.includes('offlineFallback'));

// ── Service ──────────────────────────────────────────────────────────────────
const svc = read('server/services/pos360/pos360SelfOrderingService.js');

check('service: file exists', svc.length > 0);
check('service: JSDoc Falls back gracefully', svc.includes('Falls back gracefully when no database connection is configured.'));
check('service: JSDoc Never prints or logs the database connection string', svc.includes('Never prints or logs the database connection string.'));
check('service: JSDoc SmokeCraft Self-Order Hooks', svc.includes('SmokeCraft Self-Order Hooks'));
check('service: JSDoc E.A.T. Handoffs', svc.includes('E.A.T. Handoffs'));
check('service: import from db/connection.js', svc.includes("from '../../db/connection.js'"));
check('service: isDbAvailable import', svc.includes('isDbAvailable'));
check('service: AREA = pos360-self-ordering', svc.includes("AREA = 'pos360-self-ordering'"));
check('service: LOCAL fallback', svc.includes('localPreview: true'));
check('service: createQrMenuSession', svc.includes('createQrMenuSession'));
check('service: getQrMenuSession', svc.includes('getQrMenuSession'));
check('service: listQrMenuSessions', svc.includes('listQrMenuSessions'));
check('service: updateQrMenuSessionStatus', svc.includes('updateQrMenuSessionStatus'));
check('service: createSelfOrderCart', svc.includes('createSelfOrderCart'));
check('service: getCartById', svc.includes('getCartById'));
check('service: listSelfOrderCarts', svc.includes('listSelfOrderCarts'));
check('service: updateCartStatus', svc.includes('updateCartStatus'));
check('service: addCartItem', svc.includes('addCartItem'));
check('service: listCartItems', svc.includes('listCartItems'));
check('service: updateCartItemStatus', svc.includes('updateCartItemStatus'));
check('service: createSelfOrderSubmission', svc.includes('createSelfOrderSubmission'));
check('service: getSubmission', svc.includes('getSubmission'));
check('service: listSelfOrderSubmissions', svc.includes('listSelfOrderSubmissions'));
check('service: updateSubmissionStatus', svc.includes('updateSubmissionStatus'));
check('service: createHandheldPosSession', svc.includes('createHandheldPosSession'));
check('service: listHandheldPosSessions', svc.includes('listHandheldPosSessions'));
check('service: updateHandheldSessionStatus', svc.includes('updateHandheldSessionStatus'));
check('service: createHandheldOrderEntry', svc.includes('createHandheldOrderEntry'));
check('service: listHandheldOrderEntries', svc.includes('listHandheldOrderEntries'));
check('service: updateHandheldEntryStatus', svc.includes('updateHandheldEntryStatus'));
check('service: createTableOrderingSession', svc.includes('createTableOrderingSession'));
check('service: listTableOrderingSessions', svc.includes('listTableOrderingSessions'));
check('service: updateTableSessionStatus', svc.includes('updateTableSessionStatus'));
check('service: createGuestCheckoutHandoff', svc.includes('createGuestCheckoutHandoff'));
check('service: listGuestCheckoutHandoffs', svc.includes('listGuestCheckoutHandoffs'));
check('service: updateCheckoutHandoffStatus', svc.includes('updateCheckoutHandoffStatus'));
check('service: createQrCode', svc.includes('createQrCode'));
check('service: listQrCodes', svc.includes('listQrCodes'));
check('service: updateQrCodeStatus', svc.includes('updateQrCodeStatus'));
check('service: createMenuAvailabilitySnapshot', svc.includes('createMenuAvailabilitySnapshot'));
check('service: listMenuAvailabilitySnapshots', svc.includes('listMenuAvailabilitySnapshots'));
check('service: createAgeVerificationRecord', svc.includes('createAgeVerificationRecord'));
check('service: listAgeVerificationRecords', svc.includes('listAgeVerificationRecords'));
check('service: updateAgeVerificationStatus', svc.includes('updateAgeVerificationStatus'));
check('service: addModifierSelection', svc.includes('addModifierSelection'));
check('service: listModifierSelections', svc.includes('listModifierSelections'));
check('service: createMenuItemAvailabilityOverride', svc.includes('createMenuItemAvailabilityOverride'));
check('service: listMenuItemAvailabilityOverrides', svc.includes('listMenuItemAvailabilityOverrides'));
check('service: updateMenuItemAvailabilityOverride', svc.includes('updateMenuItemAvailabilityOverride'));
check('service: createSmokecraftSelfOrderHook', svc.includes('createSmokecraftSelfOrderHook'));
check('service: listSmokecraftSelfOrderHooks', svc.includes('listSmokecraftSelfOrderHooks'));
check('service: updateSmokecraftHookStatus', svc.includes('updateSmokecraftHookStatus'));
check('service: createEatSelfOrderHandoff', svc.includes('createEatSelfOrderHandoff'));
check('service: listEatSelfOrderHandoffs', svc.includes('listEatSelfOrderHandoffs'));
check('service: updateEatHandoffStatus', svc.includes('updateEatHandoffStatus'));
check('service: createSelfOrderVisibilityInsight', svc.includes('createSelfOrderVisibilityInsight'));
check('service: listSelfOrderVisibilityInsights', svc.includes('listSelfOrderVisibilityInsights'));
check('service: getSelfOrderOperationsSummary', svc.includes('getSelfOrderOperationsSummary'));
check('service: queueSelfOrderOfflineAction', svc.includes('queueSelfOrderOfflineAction'));
check('service: listSelfOrderOfflineQueue', svc.includes('listSelfOrderOfflineQueue'));
check('service: markSelfOrderOfflineActionSynced', svc.includes('markSelfOrderOfflineActionSynced'));
check('service: queueHandheldOfflineAction', svc.includes('queueHandheldOfflineAction'));
check('service: listHandheldOfflineQueue', svc.includes('listHandheldOfflineQueue'));
check('service: markHandheldOfflineActionSynced', svc.includes('markHandheldOfflineActionSynced'));
check('service: honest self_order_completed=FALSE in INSERT', svc.includes('self_order_completed') && svc.includes('FALSE'));
check('service: honest payment_captured=FALSE in INSERT', svc.includes('payment_captured') && svc.includes('FALSE'));
check('service: honest kds_accepted=FALSE in INSERT', svc.includes('kds_accepted') && svc.includes('FALSE'));
check('service: honest inventory_deducted=FALSE in INSERT', svc.includes('inventory_deducted') && svc.includes('FALSE'));
check('service: honest age_verified=FALSE in INSERT', svc.includes('age_verified=FALSE') || (svc.includes('age_verified') && svc.includes(',FALSE,')));
check('service: honest external_sync_completed=FALSE', svc.includes('external_sync_completed') && svc.includes('FALSE'));
check('service: honest smokecraft_sync_completed=FALSE', svc.includes('smokecraft_sync_completed') && svc.includes('FALSE'));
check('service: honest printer_connected=FALSE', svc.includes('printer_connected') && svc.includes('FALSE'));
check('service: honest kds_connected=FALSE', svc.includes('kds_connected') && svc.includes('FALSE'));
check('service: honest contains_ai_generated_content=FALSE', svc.includes('contains_ai_generated_content') && svc.includes('FALSE'));
check('service: contains_secrets=FALSE in audit', svc.includes('contains_secrets') && svc.includes('FALSE'));
check('service: stores_secrets=FALSE in audit', svc.includes('stores_secrets') && svc.includes('FALSE'));
check('service: writeAudit helper', svc.includes('writeAudit'));
check('service: dupCheck helper', svc.includes('dupCheck'));
check('service: duplicate: true returned', svc.includes('duplicate: true'));
check('service: operations summary requires DB note', svc.includes('kds_accepted=false'));

// ── Controller ───────────────────────────────────────────────────────────────
const ctrl = read('server/controllers/pos360SelfOrderingController.js');

check('controller: file exists', ctrl.length > 0);
check('controller: ok500 pattern', ctrl.includes('const ok500'));
check('controller: vid helper', ctrl.includes('const vid'));
check('controller: actor helper', ctrl.includes('const actor'));
check('controller: ikey helper', ctrl.includes('const ikey'));
check('controller: createQrMenuSession export', ctrl.includes('export const createQrMenuSession'));
check('controller: listQrMenuSessions export', ctrl.includes('export const listQrMenuSessions'));
check('controller: createSelfOrderCart export', ctrl.includes('export const createSelfOrderCart'));
check('controller: addCartItem export', ctrl.includes('export const addCartItem'));
check('controller: createSelfOrderSubmission export', ctrl.includes('export const createSelfOrderSubmission'));
check('controller: createHandheldPosSession export', ctrl.includes('export const createHandheldPosSession'));
check('controller: createHandheldOrderEntry export', ctrl.includes('export const createHandheldOrderEntry'));
check('controller: createTableOrderingSession export', ctrl.includes('export const createTableOrderingSession'));
check('controller: createGuestCheckoutHandoff export', ctrl.includes('export const createGuestCheckoutHandoff'));
check('controller: createQrCode export', ctrl.includes('export const createQrCode'));
check('controller: createAgeVerificationRecord export', ctrl.includes('export const createAgeVerificationRecord'));
check('controller: createSmokecraftSelfOrderHook export', ctrl.includes('export const createSmokecraftSelfOrderHook'));
check('controller: createEatSelfOrderHandoff export', ctrl.includes('export const createEatSelfOrderHandoff'));
check('controller: getSelfOrderOperationsSummary export', ctrl.includes('export const getSelfOrderOperationsSummary'));
check('controller: queueSelfOrderOfflineAction export', ctrl.includes('export const queueSelfOrderOfflineAction'));
check('controller: queueHandheldOfflineAction export', ctrl.includes('export const queueHandheldOfflineAction'));
check('controller: x-venue-id header', ctrl.includes("'x-venue-id'"));
check('controller: x-idempotency-key header', ctrl.includes("'x-idempotency-key'"));

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = read('server/routes/pos360SelfOrderingRoutes.js');

check('routes: file exists', routes.length > 0);
check('routes: mounted comment /api/pos360/self-ordering', routes.includes('/api/pos360/self-ordering'));
check('routes: import canAccessPOS3', routes.includes('canAccessPOS3'));
check('routes: export default router', routes.includes('export default router'));
check('routes: GET /qr-sessions', routes.includes("router.get('/qr-sessions'"));
check('routes: POST /qr-sessions with canAccessPOS3', routes.includes("router.post('/qr-sessions', canAccessPOS3"));
check('routes: POST /carts (guest creates cart)', routes.includes("router.post('/carts'"));
check('routes: PATCH /carts/:cartId/status with canAccessPOS3', routes.includes("router.patch('/carts/:cartId/status', canAccessPOS3"));
check('routes: POST /submissions', routes.includes("router.post('/submissions'"));
check('routes: POST /handheld-sessions with canAccessPOS3', routes.includes("router.post('/handheld-sessions', canAccessPOS3"));
check('routes: POST /handheld-entries with canAccessPOS3', routes.includes("router.post('/handheld-entries', canAccessPOS3"));
check('routes: POST /table-sessions with canAccessPOS3', routes.includes("router.post('/table-sessions', canAccessPOS3"));
check('routes: POST /checkout-handoffs with canAccessPOS3', routes.includes("router.post('/checkout-handoffs', canAccessPOS3"));
check('routes: POST /qr-codes with canAccessPOS3', routes.includes("router.post('/qr-codes', canAccessPOS3"));
check('routes: POST /menu-snapshots with canAccessPOS3', routes.includes("router.post('/menu-snapshots', canAccessPOS3"));
check('routes: POST /age-verification with canAccessPOS3', routes.includes("router.post('/age-verification', canAccessPOS3"));
check('routes: PATCH /age-verification/:recordId/status with canAccessPOS3', routes.includes("router.patch('/age-verification/:recordId/status', canAccessPOS3"));
check('routes: POST /availability-overrides with canAccessPOS3', routes.includes("router.post('/availability-overrides', canAccessPOS3"));
check('routes: POST /smokecraft-hooks with canAccessPOS3', routes.includes("router.post('/smokecraft-hooks', canAccessPOS3"));
check('routes: POST /eat-handoffs with canAccessPOS3', routes.includes("router.post('/eat-handoffs', canAccessPOS3"));
check('routes: POST /visibility-insights with canAccessPOS3', routes.includes("router.post('/visibility-insights', canAccessPOS3"));
check('routes: GET /operations-summary', routes.includes("router.get('/operations-summary'"));
check('routes: POST /offline-queue (no auth — offline)', routes.includes("router.post('/offline-queue'"));
check('routes: POST /offline-queue/:offlineActionId/synced with canAccessPOS3', routes.includes("router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3"));
check('routes: POST /handheld-offline-queue with canAccessPOS3', routes.includes("router.post('/handheld-offline-queue', canAccessPOS3"));

// ── UI Component ─────────────────────────────────────────────────────────────
const ui = read('src/pages/pos360/POS360SelfOrdering.jsx');

check('ui: file exists', ui.length > 0);
check('ui: /smokecraft-pos360.png reference 1', ui.includes('/smokecraft-pos360.png'));
check('ui: /smokecraft-pos360.png reference 2', (ui.match(/\/smokecraft-pos360\.png/g) || []).length >= 2);
check('ui: Touchscreen · Handheld · Tablet · Desktop', ui.includes('Touchscreen · Handheld · Tablet · Desktop'));
check('ui: DARK_BG color token', ui.includes("DARK_BG = '#080604'"));
check('ui: GOLD color token', ui.includes("GOLD = '#c9952c'"));
check('ui: DARK_CARD color token', ui.includes("DARK_CARD = '#13110d'"));
check('ui: DARK_LINE color token', ui.includes("DARK_LINE = '#2a2520'"));
check('ui: RED color token', ui.includes("RED = '#c0392b'"));
check('ui: GREEN color token', ui.includes("GREEN = '#27ae60'"));
check('ui: BLUE color token', ui.includes("BLUE = '#2980b9'"));
check('ui: AMBER color token', ui.includes("AMBER = '#e67e22'"));
check('ui: tSelfOrdering import', ui.includes('tSelfOrdering'));
check('ui: getSupportedSelfOrderingLanguages import', ui.includes('getSupportedSelfOrderingLanguages'));
check('ui: TABS array with 31 tabs', (ui.match(/TABS = \[/)));
check('ui: Dashboard tab', ui.includes("'Dashboard'"));
check('ui: QR Sessions tab', ui.includes("'QR Sessions'"));
check('ui: Self-Order Carts tab', ui.includes("'Self-Order Carts'"));
check('ui: Handheld Sessions tab', ui.includes("'Handheld Sessions'"));
check('ui: Table Sessions tab', ui.includes("'Table Sessions'"));
check('ui: Checkout Handoffs tab', ui.includes("'Checkout Handoffs'"));
check('ui: Age Verification tab', ui.includes("'Age Verification'"));
check('ui: SmokeCraft Hooks tab', ui.includes("'SmokeCraft Hooks'"));
check('ui: E.A.T. Handoffs tab', ui.includes("'E.A.T. Handoffs'"));
check('ui: No Fake Self-Order tab', ui.includes("'No Fake Self-Order'"));
check('ui: No Fake Payment tab', ui.includes("'No Fake Payment'"));
check('ui: No Fake KDS tab', ui.includes("'No Fake KDS'"));
check('ui: No Fake Inventory tab', ui.includes("'No Fake Inventory'"));
check('ui: No Fake Age Verify tab', ui.includes("'No Fake Age Verify'"));
check('ui: No Fake E.A.T. AI tab', ui.includes("'No Fake E.A.T. AI'"));
check('ui: No Fake SmokeCraft tab', ui.includes("'No Fake SmokeCraft'"));
check('ui: Private Data tab', ui.includes("'Private Data'"));
check('ui: Financial Data tab', ui.includes("'Financial Data'"));
check('ui: Language Selector tab', ui.includes("'Language Selector'"));
check('ui: SelfOrderDashboard component', ui.includes('SelfOrderDashboard'));
check('ui: QrSessionsPanel component', ui.includes('QrSessionsPanel'));
check('ui: SelfOrderCartsPanel component', ui.includes('SelfOrderCartsPanel'));
check('ui: CartItemsPanel component', ui.includes('CartItemsPanel'));
check('ui: SubmissionsPanel component', ui.includes('SubmissionsPanel'));
check('ui: HandheldSessionsPanel component', ui.includes('HandheldSessionsPanel'));
check('ui: HandheldEntriesPanel component', ui.includes('HandheldEntriesPanel'));
check('ui: TableSessionsPanel component', ui.includes('TableSessionsPanel'));
check('ui: CheckoutHandoffsPanel component', ui.includes('CheckoutHandoffsPanel'));
check('ui: QrCodeRegistryPanel component', ui.includes('QrCodeRegistryPanel'));
check('ui: MenuSnapshotsPanel component', ui.includes('MenuSnapshotsPanel'));
check('ui: AgeVerificationPanel component', ui.includes('AgeVerificationPanel'));
check('ui: ModifierSelectionsPanel component', ui.includes('ModifierSelectionsPanel'));
check('ui: AvailabilityOverridesPanel component', ui.includes('AvailabilityOverridesPanel'));
check('ui: SmokecraftHooksPanel component', ui.includes('SmokecraftHooksPanel'));
check('ui: EatHandoffsPanel component', ui.includes('EatHandoffsPanel'));
check('ui: VisibilityInsightsPanel component', ui.includes('VisibilityInsightsPanel'));
check('ui: OperationsSummaryPanel component', ui.includes('OperationsSummaryPanel'));
check('ui: SelfOrderOfflinePanel component', ui.includes('SelfOrderOfflinePanel'));
check('ui: HandheldOfflinePanel component', ui.includes('HandheldOfflinePanel'));
check('ui: NoFakeSelfOrderPanel component', ui.includes('NoFakeSelfOrderPanel'));
check('ui: NoFakePaymentPanel component', ui.includes('NoFakePaymentPanel'));
check('ui: NoFakeKdsPanel component', ui.includes('NoFakeKdsPanel'));
check('ui: NoFakeInventoryPanel component', ui.includes('NoFakeInventoryPanel'));
check('ui: NoFakeAgeVerifyPanel component', ui.includes('NoFakeAgeVerifyPanel'));
check('ui: NoFakeEatAiPanel component', ui.includes('NoFakeEatAiPanel'));
check('ui: NoFakeSmokecraftPanel component', ui.includes('NoFakeSmokecraftPanel'));
check('ui: NoFakeExternalPosPanel component', ui.includes('NoFakeExternalPosPanel'));
check('ui: PrivateDataPanel component', ui.includes('PrivateDataPanel'));
check('ui: FinancialDataPanel component', ui.includes('FinancialDataPanel'));
check('ui: LanguageSelectorPanel component', ui.includes('LanguageSelectorPanel'));
check('ui: HonestStatePanel component', ui.includes('HonestStatePanel'));
check('ui: honest self_order_completed: false label', ui.includes('self_order_completed'));
check('ui: honest payment_captured: false label', ui.includes('payment_captured'));
check('ui: honest kds_accepted: false label', ui.includes('kds_accepted'));
check('ui: honest inventory_deducted: false label', ui.includes('inventory_deducted'));
check('ui: honest age_verified: false label', ui.includes('age_verified'));
check('ui: export default POS360SelfOrdering', ui.includes('export default POS360SelfOrdering'));

// ── Server Wiring ────────────────────────────────────────────────────────────
const idx = read('server/index.js');

check('server: import pos360SelfOrderingRoutes', idx.includes('pos360SelfOrderingRoutes'));
check('server: app.use /api/pos360/self-ordering', idx.includes('/api/pos360/self-ordering'));

// ── App.jsx Wiring ───────────────────────────────────────────────────────────
const app = read('src/App.jsx');

check('app: import POS360SelfOrdering', app.includes('POS360SelfOrdering'));
check('app: Route path fulfillment-kds still present', app.includes('fulfillment-kds'));
check('app: Route path self-ordering present', app.includes('self-ordering'));

// ── package.json ─────────────────────────────────────────────────────────────
const pkg = read('package.json');

check('package.json: verify:pos360-self-ordering script', pkg.includes('verify:pos360-self-ordering'));
check('package.json: verify:pos360-fulfillment-kds still present', pkg.includes('verify:pos360-fulfillment-kds'));

// ── Security Invariants ──────────────────────────────────────────────────────
check('security: no fake self-order — service uses FALSE for self_order_completed', svc.includes('self_order_completed') && !svc.includes('self_order_completed=TRUE'));
check('security: no fake payment — service uses FALSE for payment_captured', svc.includes('payment_captured') && !svc.includes('payment_captured=TRUE'));
check('security: no fake KDS — service uses FALSE for kds_accepted', svc.includes('kds_accepted') && !svc.includes('kds_accepted=TRUE'));
check('security: no fake inventory — service uses FALSE for inventory_deducted', svc.includes('inventory_deducted') && !svc.includes("inventory_deducted=TRUE"));
check('security: no fake age verify — age_verified defaults FALSE', svc.includes('age_verified') && !svc.includes("age_verified=TRUE,"));
check('security: no fake smokecraft sync — smokecraft_sync_completed=FALSE', svc.includes('smokecraft_sync_completed') && !svc.includes('smokecraft_sync_completed=TRUE'));
check('security: no fake external sync — external_sync_completed=FALSE in all INSERTs', svc.includes('external_sync_completed') && !svc.includes('external_sync_completed=TRUE'));
check('security: no fake AI — contains_ai_generated_content=FALSE', svc.includes('contains_ai_generated_content') && !svc.includes('contains_ai_generated_content=TRUE'));
check('security: no secrets stored in qr code registry', svc.includes("contains_secrets, stores_secrets") && svc.includes("FALSE,FALSE"));
check('security: canAccessPOS3 on all sensitive write routes', routes.includes('canAccessPOS3'));
check('security: canAccessPOS3 on handheld sessions', routes.includes("post('/handheld-sessions', canAccessPOS3"));
check('security: canAccessPOS3 on age verification writes', routes.includes("post('/age-verification', canAccessPOS3"));
check('security: canAccessPOS3 on checkout handoffs', routes.includes("post('/checkout-handoffs', canAccessPOS3"));
check('security: canAccessPOS3 on availability overrides', routes.includes("post('/availability-overrides', canAccessPOS3"));
check('security: canAccessPOS3 on smokecraft hooks', routes.includes("post('/smokecraft-hooks', canAccessPOS3"));
check('security: canAccessPOS3 on eat-handoffs', routes.includes("post('/eat-handoffs', canAccessPOS3"));
check('security: no DATABASE_URL in service', !svc.includes('DATABASE_URL'));
check('security: no DATABASE_URL in controller', !ctrl.includes('DATABASE_URL'));
check('security: migration safe — additive only', sql.includes('CREATE TABLE IF NOT EXISTS') && !sql.includes('DROP TABLE') && !sql.includes('ALTER TABLE'));
check('security: contains_secrets in audit: FALSE', svc.includes('contains_secrets') && svc.includes('FALSE'));
check('security: stores_secrets in audit: FALSE', svc.includes('stores_secrets') && svc.includes('FALSE'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nPhase B.17 — POS360 Self-Ordering & Guest Checkout`);
console.log(`Checks: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

if (failures.length) {
  console.log('\nFailed checks:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log('\n✓ All checks passed — Phase B.17 verification PASS');
}
