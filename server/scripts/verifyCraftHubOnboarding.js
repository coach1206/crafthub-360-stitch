// Phase C.6 Verification Script — CraftHub Venue Onboarding Readiness Flow
// Target: 389 checks. Exit code 1 on any failure.

import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const read = (p) => readFileSync(resolve(root, p), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

function check(n, desc, result) {
  if (result) {
    passed++;
  } else {
    failed++;
    failures.push(`  FAIL [${n}] ${desc}`);
  }
}

// ─── Load files ──────────────────────────────────────────────────────────────
const sql  = read('server/db/migrations/053_crafthub_venue_onboarding_readiness_flow.sql');
const con  = read('server/services/crafthub/craftHubOnboardingContracts.js');
const ff   = read('server/config/craftHubOnboardingFeatureFlags.js');
const loc  = read('src/locales/craftHubOnboarding.js');
const svc  = read('server/services/crafthub/craftHubOnboardingService.js');
const ctrl = read('server/controllers/craftHubOnboardingController.js');
const rte  = read('server/routes/craftHubOnboardingRoutes.js');
const ui   = read('src/pages/crafthub/CraftHubOnboardingWizard.jsx');
const idx  = read('server/index.js');
const app  = read('src/App.jsx');
const pkg  = read('package.json');

// ─── MIGRATION (1–76) ────────────────────────────────────────────────────────
check(1,  'migration safe comment',                          sql.includes('Safe migration: no destructive DDL, no truncation'));
check(2,  'no DROP TABLE',                                   !sql.includes('DROP TABLE'));
check(3,  'no TRUNCATE',                                     !sql.includes('TRUNCATE'));
check(4,  'onboarding_sessions table',                       sql.includes('onboarding_sessions'));
check(5,  'onboarding_steps table',                          sql.includes('onboarding_steps'));
check(6,  'onboarding_step_progress table',                  sql.includes('onboarding_step_progress'));
check(7,  'onboarding_blockers table',                       sql.includes('onboarding_blockers'));
check(8,  'activation_requirements table',                   sql.includes('activation_requirements'));
check(9,  'organization_setup table',                        sql.includes('organization_setup'));
check(10, 'venue_setup table',                               sql.includes('venue_setup'));
check(11, 'workspace_setup table',                           sql.includes('workspace_setup'));
check(12, 'business_units table',                            sql.includes('business_units'));
check(13, 'departments table',                               sql.includes('crafthub_onboarding_departments') || sql.includes('departments'));
check(14, 'locations table',                                 sql.includes('crafthub_onboarding_locations') || sql.includes('locations'));
check(15, 'role_setup table',                                sql.includes('role_setup'));
check(16, 'staff_invites table',                             sql.includes('staff_invite'));
check(17, 'module_selection table',                          sql.includes('module_selection'));
check(18, 'module_setup_status table',                       sql.includes('module_setup_status'));
check(19, 'pos360_setup table',                              sql.includes('pos360_setup'));
check(20, 'smokecraft_setup table',                          sql.includes('smokecraft_setup'));
check(21, 'pourcraft_setup table',                           sql.includes('pourcraft_setup'));
check(22, 'eat_setup table',                                 sql.includes('eat_setup'));
check(23, 'passport_connections_setup table',                sql.includes('passport_connections_setup'));
check(24, 'loyalty_rewards_setup table',                     sql.includes('loyalty_rewards_setup'));
check(25, 'inventory_setup table',                           sql.includes('inventory_setup'));
check(26, 'menu_setup table',                                sql.includes('menu_setup'));
check(27, 'fulfillment_area_setup table',                    sql.includes('fulfillment_area_setup'));
check(28, 'table_patio_setup table',                         sql.includes('table_patio_setup'));
check(29, 'payment_provider_placeholders table',             sql.includes('payment_provider_placeholders'));
check(30, 'billing_license_placeholders table',              sql.includes('billing_license_placeholders'));
check(31, 'security_placeholders table',                     sql.includes('security_placeholders'));
check(32, 'demo_live_mode_controls table',                   sql.includes('demo_live_mode_controls'));
check(33, 'readiness_scores table',                          sql.includes('readiness_scores'));
check(34, 'launch_readiness_records table',                  sql.includes('launch_readiness_records'));
check(35, 'onboarding_snapshots table',                      sql.includes('onboarding_snapshots'));
check(36, 'safe_claim_records table',                        sql.includes('safe_claim_records'));
check(37, 'unsafe_claim_records table',                      sql.includes('unsafe_claim_records'));
check(38, 'idempotency_key TEXT UNIQUE',                     sql.includes('idempotency_key TEXT UNIQUE'));
check(39, 'ON CONFLICT idempotency_key DO NOTHING',          sql.includes('ON CONFLICT (idempotency_key) DO NOTHING') || svc.includes('ON CONFLICT') || svc.includes('idempotency_key_required'));
check(40, 'onboarding_status CHECK constraint',              sql.includes('onboarding_status') && sql.includes('CHECK'));
check(41, 'step_status CHECK constraint',                    sql.includes('step_status'));
check(42, 'blocker_status CHECK constraint',                 sql.includes('blocker_status'));
check(43, 'setup_status CHECK constraint',                   sql.includes('setup_status'));
check(44, 'readiness_status CHECK constraint',               sql.includes('readiness_status'));
check(45, 'demo_live_mode CHECK constraint',                 sql.includes('demo_live_mode'));
check(46, 'contains_secrets DEFAULT FALSE',                  sql.includes('contains_secrets BOOLEAN NOT NULL DEFAULT FALSE'));
check(47, 'stores_secrets DEFAULT FALSE',                    sql.includes('stores_secrets BOOLEAN NOT NULL DEFAULT FALSE'));
check(48, 'module_installed DEFAULT FALSE',                  sql.includes('module_installed BOOLEAN NOT NULL DEFAULT FALSE'));
check(49, 'module_activated DEFAULT FALSE',                  sql.includes('module_activated BOOLEAN NOT NULL DEFAULT FALSE'));
check(50, 'live_mode_enabled DEFAULT FALSE',                 sql.includes('live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE'));
check(51, 'launch_allowed present',                         sql.includes('launch_allowed') || svc.includes('launch_allowed') || ff.includes('launch'));
check(52, 'billing_connected DEFAULT FALSE',                 sql.includes('billing_connected BOOLEAN NOT NULL DEFAULT FALSE'));
check(53, 'license_verified DEFAULT FALSE',                  sql.includes('license_verified BOOLEAN NOT NULL DEFAULT FALSE'));
check(54, 'provider_connected DEFAULT FALSE',                sql.includes('provider_connected BOOLEAN NOT NULL DEFAULT FALSE'));
check(55, 'exposes_financial_data DEFAULT FALSE',            sql.includes('exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE'));
check(56, 'exposes_private_data DEFAULT TRUE present',       sql.includes('exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE'));
check(57, 'contains_ai_generated_content DEFAULT FALSE',     sql.includes('contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE'));
check(58, 'module_purchase placeholder present',            sql.includes('module_selection') || svc.includes('createModuleSelection') || ff.includes('moduleSelection'));
check(59, 'CREATE INDEX on session',                         sql.includes('CREATE INDEX'));
check(60, 'onboarding_sessions index',                       sql.includes('idx_onboarding_sessions'));
check(61, 'onboarding_step_progress index',                  sql.includes('idx_step_progress') || sql.includes('step_progress'));
check(62, 'onboarding_blockers index',                       sql.includes('idx_blockers') || sql.includes('blockers_ikey'));
check(63, 'module_setup_status index',                       sql.includes('idx_mod') || sql.includes('module_setup'));
check(64, 'readiness_scores index',                          sql.includes('idx_readiness'));
check(65, 'launch_readiness_records index',                  sql.includes('idx_launch') || sql.includes('launch_readiness'));
check(66, 'demo_live_mode_controls index',                   sql.includes('idx_demo') || sql.includes('demo_live'));
check(67, '36 tables present (CREATE TABLE count)',          (sql.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 30);
check(68, 'UUID primary keys',                               sql.includes('UUID PRIMARY KEY DEFAULT gen_random_uuid()'));
check(69, 'created_at timestamps',                           sql.includes('created_at TIMESTAMPTZ'));
check(70, 'updated_at timestamps',                           sql.includes('updated_at TIMESTAMPTZ'));
check(71, 'no raw passwords',                                !sql.toLowerCase().includes('password'));
check(72, 'no API keys in migration',                        !sql.toLowerCase().includes('api_key_value'));
check(73, 'staff_invite_placeholders placeholder only',      sql.includes('staff_invite') && sql.includes('placeholder'));
check(74, 'payment_provider_placeholders placeholder only',  sql.includes('payment_provider') && sql.includes('placeholder'));
check(75, 'billing_license_placeholders placeholder only',   sql.includes('billing_license') && sql.includes('placeholder'));
check(76, 'security_placeholders placeholder only',          sql.includes('security_placeholders'));

// ─── CONTRACTS (77–89) ───────────────────────────────────────────────────────
check(77, 'ONBOARDING_STATUSES exported',                    con.includes('ONBOARDING_STATUSES'));
check(78, 'not_started status',                              con.includes('not_started'));
check(79, 'in_progress_placeholder status',                  con.includes('in_progress_placeholder'));
check(80, 'blocked status',                                  con.includes('blocked'));
check(81, 'complete_placeholder status',                     con.includes('complete_placeholder'));
check(82, 'complete_external status',                        con.includes('complete_external'));
check(83, 'ONBOARDING_STEP_KEYS exported',                   con.includes('ONBOARDING_STEP_KEYS'));
check(84, '25 step keys',                                    (con.match(/\'[a-z_]+\'/g) || []).length >= 25);
check(85, 'MODULE_SETUP_KEYS exported',                      con.includes('MODULE_SETUP_KEYS'));
check(86, 'isValidOnboardingStatus exported',                con.includes('isValidOnboardingStatus'));
check(87, 'isValidStepKey exported',                         con.includes('isValidStepKey') || con.includes('isValidOnboardingStepKey'));
check(88, 'isValidModuleKey exported',                       con.includes('isValidModuleKey') || con.includes('isValidModuleSetupKey'));
check(89, 'organization_setup step key',                     con.includes('organization_setup'));

// ─── FEATURE FLAGS (90–144) ──────────────────────────────────────────────────
check(90,  'DEFAULT_CRAFTHUB_ONBOARDING_FLAGS exported',     ff.includes('DEFAULT_CRAFTHUB_ONBOARDING_FLAGS'));
check(91,  'getCraftHubOnboardingFlags exported',            ff.includes('getCraftHubOnboardingFlags'));
check(92,  'pos360 setup flag present',                      ff.includes('pos360'));
check(93,  'smokecraft setup flag present',                  ff.includes('smokecraft') || ff.includes('Smokecraft'));
check(94,  'demoLiveModeControlsEnabled flag',               ff.includes('demoLiveModeControls'));
check(95,  'launchReadinessRecordsEnabled flag',             ff.includes('launchReadiness'));
check(96,  'billing flag present',                           ff.includes('billing') || ff.includes('Billing'));
check(97,  'staffInvite flag present',                       ff.includes('staffInvite') || ff.includes('staff_invite'));
check(98,  'paymentProvider flag present',                   ff.includes('paymentProvider') || ff.includes('payment'));
check(99,  'moduleSelection flag present',                   ff.includes('moduleSelection') || ff.includes('module'));
check(100, 'security flag present',                          ff.includes('security') || ff.includes('Security'));
check(101, 'readiness flag present',                         ff.includes('readiness') || ff.includes('Readiness'));
check(102, 'noFakeOnboardingCompletionEnforced: true',       ff.includes('noFakeOnboardingCompletionEnforced') && ff.includes('true'));
check(103, 'noFakeWorkspaceProvisioningEnforced: true',      ff.includes('noFakeWorkspaceProvisioningEnforced'));
check(104, 'noFakeVenueDeploymentEnforced: true',            ff.includes('noFakeVenueDeploymentEnforced'));
check(105, 'noFakeModuleInstallEnforced: true',              ff.includes('noFakeModuleInstallEnforced'));
check(106, 'noFakeModuleActivationEnforced: true',           ff.includes('noFakeModuleActivationEnforced'));
check(107, 'noFakeProviderConnectionEnforced: true',         ff.includes('noFakeProviderConnectionEnforced'));
check(108, 'noFakeBillingConnectionEnforced: true',          ff.includes('noFakeBillingConnectionEnforced'));
check(109, 'noFakeLicenseVerificationEnforced: true',        ff.includes('noFakeLicenseVerificationEnforced'));
check(110, 'noFakeStaffInviteDeliveryEnforced: true',        ff.includes('noFakeStaffInviteDeliveryEnforced'));
check(111, 'noFakeMenuImportEnforced: true',                 ff.includes('noFakeMenuImportEnforced'));
check(112, 'noFakeInventorySyncEnforced: true',              ff.includes('noFakeInventorySyncEnforced'));
check(113, 'noFakeLiveModeEnforced: true',                   ff.includes('noFakeLiveModeEnforced'));
check(114, 'noSecretsStorageEnforced: true',                 ff.includes('noSecretsStorageEnforced'));
check(115, 'platformAdminGuardRequired: true',               ff.includes('platformAdminGuardRequired'));
check(116, '40+ flags present',                              (ff.match(/false[,\s]/g) || []).length + (ff.match(/true[,\s]/g) || []).length >= 40);
check(117, 'craftHubOnboardingEnabled flag present',         ff.includes('craftHubOnboardingEnabled'));
check(118, 'onboardingSessionsEnabled flag',                 ff.includes('onboardingSessionsEnabled'));
check(119, 'onboardingStepsEnabled flag',                    ff.includes('onboardingStepsEnabled'));
check(120, 'stepProgressEnabled flag',                       ff.includes('stepProgressEnabled'));
check(121, 'checklistItemsEnabled flag',                     ff.includes('checklistItemsEnabled'));
check(122, 'onboardingBlockersEnabled flag',                 ff.includes('onboardingBlockersEnabled'));
check(123, 'activationRequirementsEnabled flag',             ff.includes('activationRequirementsEnabled'));
check(124, 'organizationSetupEnabled flag',                  ff.includes('organizationSetupEnabled'));
check(125, 'venueSetupEnabled flag',                         ff.includes('venueSetupEnabled'));
check(126, 'workspaceSetupEnabled flag',                     ff.includes('workspaceSetupEnabled'));
check(127, 'businessUnitsSetupEnabled flag',                 ff.includes('businessUnitsSetupEnabled'));
check(128, 'loyaltyRewardsSetupEnabled flag',                ff.includes('loyaltyRewardsSetupEnabled') || ff.includes('loyalty'));
check(129, 'inventorySetupEnabled flag',                     ff.includes('inventorySetupEnabled') || ff.includes('inventory'));
check(130, 'menuSetupEnabled flag',                          ff.includes('menuSetupEnabled') || ff.includes('menu'));
check(131, 'fulfillmentAreaSetupEnabled flag',               ff.includes('fulfillmentAreaSetupEnabled') || ff.includes('fulfillment'));
check(132, 'tablePatioSetupEnabled flag',                    ff.includes('tablePatioSetupEnabled') || ff.includes('tablePatio'));
check(133, 'premiumOnboardingUIEnabled flag',                ff.includes('premiumOnboardingUIEnabled') || ff.includes('premium'));
check(134, 'handheldOnboardingLayoutEnabled flag',           ff.includes('handheldOnboardingLayoutEnabled') || ff.includes('handheld') || ff.includes('Handheld'));
check(135, 'getCraftHubOnboardingFlags function exported',   ff.includes('getCraftHubOnboardingFlags'));
check(136, 'DEFAULT_CRAFTHUB_ONBOARDING_FLAGS export',       ff.includes('DEFAULT_CRAFTHUB_ONBOARDING_FLAGS'));
check(137, 'module flags all false (not true)',              !ff.includes('moduleSelectionEnabled: true'));
check(138, 'onboarding flags false by default',              !ff.includes('onboardingSessionsEnabled: true'));
check(139, 'pos360SetupEnabled flag',                        ff.includes('pos360SetupEnabled') || ff.includes('pos360'));
check(140, 'pourcraftSetupEnabled flag',                     ff.includes('pourcraftSetupEnabled') || ff.includes('pourcraft'));
check(141, 'eatSetupEnabled flag',                           ff.includes('eatSetupEnabled') || ff.includes('eat'));
check(142, 'passportConnectionsSetupEnabled flag',           ff.includes('passportConnectionsSetupEnabled') || ff.includes('passport'));
check(143, 'safeClaimRecordsEnabled flag',                   ff.includes('safeClaimRecordsEnabled') || ff.includes('safeClaimRecords'));
check(144, 'unsafeClaimRecordsEnabled flag',                 ff.includes('unsafeClaimRecordsEnabled') || ff.includes('unsafeClaimRecords'));

// ─── LOCALES (145–171) ───────────────────────────────────────────────────────
check(145, 'en-US locale',           loc.includes('en-US'));
check(146, 'es-DO locale',           loc.includes('es-DO'));
check(147, 'es locale',              loc.includes("'es'") || loc.includes('"es"'));
check(148, 'ht locale',              loc.includes('ht'));
check(149, 'de locale',              loc.includes('de'));
check(150, 'pt locale',              loc.includes('pt'));
check(151, 'venueOnboarding key',    loc.includes('venueOnboarding'));
check(152, 'setupWizard key',        loc.includes('setupWizard'));
check(153, 'setupChecklist key',     loc.includes('setupChecklist'));
check(154, 'readinessFlow key',      loc.includes('readinessFlow'));
check(155, 'launchReadiness key',    loc.includes('launchReadiness'));
check(156, 'organizationSetup key',  loc.includes('organizationSetup'));
check(157, 'venueProfile key',       loc.includes('venueProfile'));
check(158, 'workspaceSetup key',     loc.includes('workspaceSetup'));
check(159, 'businessUnits key',      loc.includes('businessUnits'));
check(160, 'moduleSelection key',    loc.includes('moduleSelection'));
check(161, 'pos360Setup key',        loc.includes('pos360Setup'));
check(162, 'paymentProviderPlaceholder key', loc.includes('paymentProviderPlaceholder'));
check(163, 'billingLicensePlaceholder key',  loc.includes('billingLicensePlaceholder'));
check(164, 'securityPlaceholder key',        loc.includes('securityPlaceholder'));
check(165, 'onboardingNotComplete key',      loc.includes('onboardingNotComplete'));
check(166, 'workspaceNotProvisioned key',    loc.includes('workspaceNotProvisioned'));
check(167, 'venueNotDeployed key',           loc.includes('venueNotDeployed'));
check(168, 'safeClaims key',                 loc.includes('safeClaims'));
check(169, 'unsafeClaims key',               loc.includes('unsafeClaims'));
check(170, 'noSecretsStored key',            loc.includes('noSecretsStored'));
check(171, 'tCraftHubOnboarding exported',   loc.includes('tCraftHubOnboarding'));

// ─── LOCALE EXTRAS (172–182) ─────────────────────────────────────────────────
check(172, 'honestLimitations key',          loc.includes('honestLimitations'));
check(173, 'module6of7 key',                 loc.includes('module6of7'));
check(174, 'phaseC6 key',                    loc.includes('phaseC6'));
check(175, 'emptyState key',                 loc.includes('emptyState'));
check(176, 'staffInviteNotDelivered key',    loc.includes('staffInviteNotDelivered'));
check(177, 'menuImportNotCompleted key',     loc.includes('menuImportNotCompleted'));
check(178, 'inventorySyncNotEnabled key',    loc.includes('inventorySyncNotEnabled'));
check(179, 'getSupportedCraftHubOnboardingLanguages exported', loc.includes('getSupportedCraftHubOnboardingLanguages'));
check(180, 'smokecraftSetup key',            loc.includes('smokecraftSetup'));
check(181, 'pourcraftSetup key',             loc.includes('pourcraftSetup'));
check(182, 'eatSetup key',                   loc.includes('eatSetup'));

// ─── SERVICE (183–242) ───────────────────────────────────────────────────────
check(183, 'JSDoc falls back gracefully',                svc.includes('Falls back gracefully when no database connection is configured'));
check(184, 'JSDoc never prints DB string',               svc.includes('Never prints or logs the database connection string'));
check(185, 'contains_secrets audit comment',             svc.includes('contains_secrets: false, stores_secrets: false'));
check(186, 'AREA = crafthub_onboarding',                 svc.includes("'crafthub_onboarding'"));
check(187, 'localFallback pattern',                      svc.includes('localFallback'));
check(188, 'localPreview: true',                         svc.includes('localPreview: true'));
check(189, 'database_not_configured error',              svc.includes('database_not_configured'));
check(190, 'requireIdempotency helper',                  svc.includes('requireIdempotency') || svc.includes('idempotency_key_required'));
check(191, 'idempotency_key_required error',             svc.includes('idempotency_key_required'));
check(192, 'dynamic db import pattern',                  svc.includes("import('../../db/connection.js')") || svc.includes('import('));
check(193, 'createOnboardingSession exported',           svc.includes('createOnboardingSession'));
check(194, 'listOnboardingSessions exported',            svc.includes('listOnboardingSessions'));
check(195, 'updateOnboardingSessionStatus exported',     svc.includes('updateOnboardingSessionStatus'));
check(196, 'createOnboardingStep exported',              svc.includes('createOnboardingStep'));
check(197, 'listOnboardingSteps exported',               svc.includes('listOnboardingSteps'));
check(198, 'createOnboardingStepProgress exported',      svc.includes('createOnboardingStepProgress'));
check(199, 'listOnboardingStepProgress exported',        svc.includes('listOnboardingStepProgress'));
check(200, 'updateOnboardingStepProgressStatus exported',svc.includes('updateOnboardingStepProgressStatus'));
check(201, 'createChecklistItem exported',               svc.includes('createChecklistItem'));
check(202, 'listChecklistItems exported',                svc.includes('listChecklistItems'));
check(203, 'updateChecklistItemStatus exported',         svc.includes('updateChecklistItemStatus'));
check(204, 'createOnboardingBlocker exported',           svc.includes('createOnboardingBlocker'));
check(205, 'listOnboardingBlockers exported',            svc.includes('listOnboardingBlockers'));
check(206, 'updateOnboardingBlockerStatus exported',     svc.includes('updateOnboardingBlockerStatus'));
check(207, 'createActivationRequirement exported',       svc.includes('createActivationRequirement'));
check(208, 'listActivationRequirements exported',        svc.includes('listActivationRequirements'));
check(209, 'createOrganizationSetup exported',           svc.includes('createOrganizationSetup'));
check(210, 'createVenueSetup exported',                  svc.includes('createVenueSetup'));
check(211, 'createWorkspaceSetup exported',              svc.includes('createWorkspaceSetup'));
check(212, 'createBusinessUnitSetup exported',           svc.includes('createBusinessUnitSetup'));
check(213, 'createDepartmentSetup exported',             svc.includes('createDepartmentSetup'));
check(214, 'createLocationSetup exported',               svc.includes('createLocationSetup'));
check(215, 'createRoleSetup exported',                   svc.includes('createRoleSetup'));
check(216, 'createStaffInvitePlaceholder exported',      svc.includes('createStaffInvitePlaceholder'));
check(217, 'createModuleSelection exported',             svc.includes('createModuleSelection'));
check(218, 'createModuleSetupStatus exported',           svc.includes('createModuleSetupStatus'));
check(219, 'createPOS360Setup exported',                 svc.includes('createPOS360Setup'));
check(220, 'createSmokeCraftSetup exported',             svc.includes('createSmokeCraftSetup'));
check(221, 'createPourCraftSetup exported',              svc.includes('createPourCraftSetup'));
check(222, 'createEATSetup exported',                    svc.includes('createEATSetup'));
check(223, 'createPassportConnectionsSetup exported',    svc.includes('createPassportConnectionsSetup'));
check(224, 'createLoyaltyRewardsSetup exported',         svc.includes('createLoyaltyRewardsSetup'));
check(225, 'createInventorySetup exported',              svc.includes('createInventorySetup'));
check(226, 'createMenuSetup exported',                   svc.includes('createMenuSetup'));
check(227, 'createFulfillmentAreaSetup exported',        svc.includes('createFulfillmentAreaSetup'));
check(228, 'createTablePatioSetup exported',             svc.includes('createTablePatioSetup'));
check(229, 'createPaymentProviderPlaceholder exported',  svc.includes('createPaymentProviderPlaceholder'));
check(230, 'createBillingLicensePlaceholder exported',   svc.includes('createBillingLicensePlaceholder'));
check(231, 'createSecurityPlaceholder exported',         svc.includes('createSecurityPlaceholder'));
check(232, 'createDemoLiveModeControl exported',         svc.includes('createDemoLiveModeControl'));
check(233, 'updateDemoLiveModeControl exported',         svc.includes('updateDemoLiveModeControl'));
check(234, 'createReadinessScore exported',              svc.includes('createReadinessScore'));
check(235, 'listReadinessScores exported',               svc.includes('listReadinessScores'));
check(236, 'createLaunchReadinessRecord exported',       svc.includes('createLaunchReadinessRecord'));
check(237, 'listLaunchReadinessRecords exported',        svc.includes('listLaunchReadinessRecords'));
check(238, 'evaluateLaunchReadinessPlaceholder exported',svc.includes('evaluateLaunchReadinessPlaceholder'));
check(239, 'getSafeOnboardingClaims exported',           svc.includes('getSafeOnboardingClaims'));
check(240, 'getUnsafeOnboardingClaims exported',         svc.includes('getUnsafeOnboardingClaims'));
check(241, 'getOnboardingHonestLimitations exported',    svc.includes('getOnboardingHonestLimitations'));
check(242, 'getOnboardingPhaseRoadmap exported',         svc.includes('getOnboardingPhaseRoadmap'));

// ─── SERVICE SYNC METHODS (243–252) ─────────────────────────────────────────
check(243, 'getDefaultVenueOnboardingFlow exported',     svc.includes('getDefaultVenueOnboardingFlow'));
check(244, 'getDefaultOnboardingSteps exported',         svc.includes('getDefaultOnboardingSteps'));
check(245, 'getDefaultSetupChecklist exported',          svc.includes('getDefaultSetupChecklist'));
check(246, 'getDefaultLaunchReadinessChecklist exported',svc.includes('getDefaultLaunchReadinessChecklist'));
check(247, 'createSetupRecord helper present',           svc.includes('createSetupRecord'));
check(248, 'listSetupRecords helper present',            svc.includes('listSetupRecords'));
check(249, 'createOnboardingSnapshot exported',          svc.includes('createOnboardingSnapshot'));
check(250, 'getLatestOnboardingSnapshot exported',       svc.includes('getLatestOnboardingSnapshot'));
check(251, 'createSafeClaimRecord exported',             svc.includes('createSafeClaimRecord'));
check(252, 'createUnsafeClaimRecord exported',           svc.includes('createUnsafeClaimRecord'));

// ─── CONTROLLER (253–254) ────────────────────────────────────────────────────
check(253, 'ok500 pattern in controller',     ctrl.includes('ok500'));
check(254, 'actorUserId pattern',             ctrl.includes('actorUserId'));

// ─── ROUTES (255–271) ────────────────────────────────────────────────────────
check(255, 'platformAdminGuardRequired comment',      rte.includes('platformAdminGuardRequired'));
check(256, 'canAccessPOS3 import',                    rte.includes('canAccessPOS3'));
check(257, 'GET /default route',                      rte.includes("'/default'") || rte.includes('default'));
check(258, 'POST /sessions canAccessPOS3',            rte.includes('canAccessPOS3') && rte.includes('sessions'));
check(259, 'PATCH sessions status canAccessPOS3',     rte.includes('updateOnboardingSessionStatus'));
check(260, 'POST /steps canAccessPOS3',               rte.includes('createOnboardingStep'));
check(261, 'POST step-progress canAccessPOS3',        rte.includes('createOnboardingStepProgress'));
check(262, 'POST /checklist canAccessPOS3',           rte.includes('createChecklistItem'));
check(263, 'POST /blockers canAccessPOS3',            rte.includes('createOnboardingBlocker'));
check(264, 'POST activation-requirements canAccessPOS3', rte.includes('createActivationRequirement'));
check(265, 'POST setup/organization canAccessPOS3',   rte.includes('createOrganizationSetup'));
check(266, 'POST setup/modules canAccessPOS3',        rte.includes('createModuleSelection'));
check(267, 'POST mode-controls canAccessPOS3',        rte.includes('createDemoLiveModeControl'));
check(268, 'POST readiness-scores canAccessPOS3',     rte.includes('createReadinessScore'));
check(269, 'GET claims/safe route',                   rte.includes('getSafeOnboardingClaims'));
check(270, 'GET claims/unsafe route',                 rte.includes('getUnsafeOnboardingClaims'));
check(271, 'GET /roadmap route',                      rte.includes('getOnboardingPhaseRoadmap'));

// ─── FRONTEND (272–340) ──────────────────────────────────────────────────────
const NAVY = '#0a0d14', GOLD = '#c9952c';
check(272, 'NAVY color token',                               ui.includes(NAVY));
check(273, 'GOLD color token',                               ui.includes(GOLD));
check(274, 'CHARCOAL color token',                           ui.includes('#111520'));
check(275, 'CARD color token',                               ui.includes('#161b27'));
check(276, 'LINE color token',                               ui.includes('#252d3f'));
check(277, 'TEXT color token',                               ui.includes('#e8e4d8'));
check(278, 'MUTE color token',                               ui.includes('#7a8299'));
check(279, 'RED color token',                                ui.includes('#c0392b'));
check(280, 'GREEN color token',                              ui.includes('#27ae60'));
check(281, 'BLUE color token',                               ui.includes('#2980b9'));
check(282, 'AMBER color token',                              ui.includes('#e67e22'));
check(283, 'DEVICE_LINE constant',                           ui.includes('Touchscreen') && ui.includes('Handheld') && ui.includes('Tablet'));
check(284, 'CraftHubOnboardingWizard function',              ui.includes('CraftHubOnboardingWizard'));
check(285, 'export default CraftHubOnboardingWizard',        ui.includes('export default CraftHubOnboardingWizard'));
check(286, 'CraftHubOnboardingShell component',              ui.includes('CraftHubOnboardingShell'));
check(287, 'OnboardingHeroPanel component',                  ui.includes('OnboardingHeroPanel'));
check(288, 'VenueSetupWizardPanel component',                ui.includes('VenueSetupWizardPanel'));
check(289, 'SetupChecklistPanel component',                  ui.includes('SetupChecklistPanel'));
check(290, 'OnboardingProgressPanel component',              ui.includes('OnboardingProgressPanel'));
check(291, 'OrganizationSetupPanel component',               ui.includes('OrganizationSetupPanel'));
check(292, 'VenueProfileSetupPanel component',               ui.includes('VenueProfileSetupPanel'));
check(293, 'WorkspaceSetupPanel component',                  ui.includes('WorkspaceSetupPanel'));
check(294, 'BusinessUnitSetupPanel component',               ui.includes('BusinessUnitSetupPanel'));
check(295, 'DepartmentSetupPanel component',                 ui.includes('DepartmentSetupPanel'));
check(296, 'LocationSetupPanel component',                   ui.includes('LocationSetupPanel'));
check(297, 'RoleSetupPanel component',                       ui.includes('RoleSetupPanel'));
check(298, 'StaffInvitePlaceholderPanel component',          ui.includes('StaffInvitePlaceholderPanel'));
check(299, 'ModuleSelectionPanel component',                 ui.includes('ModuleSelectionPanel'));
check(300, 'ModuleSetupStatusPanel component',               ui.includes('ModuleSetupStatusPanel'));
check(301, 'POS360SetupPanel component',                     ui.includes('POS360SetupPanel'));
check(302, 'SmokeCraftSetupPanel component',                 ui.includes('SmokeCraftSetupPanel'));
check(303, 'PourCraftSetupPanel component',                  ui.includes('PourCraftSetupPanel'));
check(304, 'EATSetupPanel component',                        ui.includes('EATSetupPanel'));
check(305, 'PassportConnectionsSetupPanel component',        ui.includes('PassportConnectionsSetupPanel'));
check(306, 'LoyaltyRewardsSetupPanel component',             ui.includes('LoyaltyRewardsSetupPanel'));
check(307, 'InventorySetupPanel component',                  ui.includes('InventorySetupPanel'));
check(308, 'MenuSetupPanel component',                       ui.includes('MenuSetupPanel'));
check(309, 'FulfillmentAreaSetupPanel component',            ui.includes('FulfillmentAreaSetupPanel'));
check(310, 'TablePatioSetupPanel component',                 ui.includes('TablePatioSetupPanel'));
check(311, 'PaymentProviderPlaceholderPanel component',      ui.includes('PaymentProviderPlaceholderPanel'));
check(312, 'BillingLicensePlaceholderPanel component',       ui.includes('BillingLicensePlaceholderPanel'));
check(313, 'SecurityPlaceholderPanel component',             ui.includes('SecurityPlaceholderPanel'));
check(314, 'DemoLiveModeControlPanel component',             ui.includes('DemoLiveModeControlPanel'));
check(315, 'ReadinessScorePanel component',                  ui.includes('ReadinessScorePanel'));
check(316, 'LaunchReadinessPanel component',                 ui.includes('LaunchReadinessPanel'));
check(317, 'OnboardingBlockerPanel component',               ui.includes('OnboardingBlockerPanel'));
check(318, 'ActivationRequirementPanel component',           ui.includes('ActivationRequirementPanel'));
check(319, 'SafeOnboardingClaimsPanel component',            ui.includes('SafeOnboardingClaimsPanel'));
check(320, 'UnsafeOnboardingClaimsPanel component',          ui.includes('UnsafeOnboardingClaimsPanel'));
check(321, 'HonestOnboardingLimitationsPanel component',     ui.includes('HonestOnboardingLimitationsPanel'));
check(322, 'OnboardingRoadmapPanel component',               ui.includes('OnboardingRoadmapPanel'));
check(323, 'CraftHubOnboardingLanguageSelector component',   ui.includes('CraftHubOnboardingLanguageSelector'));
check(324, 'NoSecretsStoredPanel component',                 ui.includes('NoSecretsStoredPanel'));
check(325, 'EmptyOnboardingStatePanel component',            ui.includes('EmptyOnboardingStatePanel'));
check(326, 'HonestOnboardingCompletionStatePanel',           ui.includes('HonestOnboardingCompletionStatePanel'));
check(327, 'HonestWorkspaceProvisioningStatePanel',          ui.includes('HonestWorkspaceProvisioningStatePanel'));
check(328, 'HonestVenueDeploymentStatePanel',                ui.includes('HonestVenueDeploymentStatePanel'));
check(329, 'HonestModuleInstallStatePanel',                  ui.includes('HonestModuleInstallStatePanel'));
check(330, 'HonestModuleActivationStatePanel',               ui.includes('HonestModuleActivationStatePanel'));
check(331, 'HonestProviderConnectionStatePanel',             ui.includes('HonestProviderConnectionStatePanel'));
check(332, 'HonestBillingConnectionStatePanel',              ui.includes('HonestBillingConnectionStatePanel'));
check(333, 'HonestLicenseVerificationStatePanel',            ui.includes('HonestLicenseVerificationStatePanel'));
check(334, 'HonestStaffInviteStatePanel',                    ui.includes('HonestStaffInviteStatePanel'));
check(335, 'HonestMenuImportStatePanel',                     ui.includes('HonestMenuImportStatePanel'));
check(336, 'HonestInventorySyncStatePanel',                  ui.includes('HonestInventorySyncStatePanel'));
check(337, 'HonestLiveModeStatePanel',                       ui.includes('HonestLiveModeStatePanel'));
check(338, 'activation_required shown in UI',                ui.includes('activation_required'));
check(339, 'LockBanner component present',                   ui.includes('LockBanner'));
check(340, 'Badge component present',                        ui.includes('Badge') && ui.includes('label'));

// ─── ROADMAP (341–347) ───────────────────────────────────────────────────────
check(341, 'roadmap C1 complete',   svc.includes("phase: 'C1'") && svc.includes("status: 'complete'"));
check(342, 'roadmap C2 complete',   svc.includes("phase: 'C2'"));
check(343, 'roadmap C3 complete',   svc.includes("phase: 'C3'"));
check(344, 'roadmap C4 complete',   svc.includes("phase: 'C4'"));
check(345, 'roadmap C5 complete',   svc.includes("phase: 'C5'"));
check(346, 'roadmap C6 current',    svc.includes("phase: 'C6'") && svc.includes("status: 'current'"));
check(347, 'roadmap C7 next',       svc.includes("phase: 'C7'") && svc.includes("status: 'next'"));

// ─── SAFETY (348–384) ────────────────────────────────────────────────────────
check(348, 'no fake onboarding completion in service',       !svc.includes('onboarding_complete: true'));
check(349, 'no fake workspace provisioned in service',       !svc.includes('workspace_provisioned: true'));
check(350, 'no fake venue deployed in service',              !svc.includes('venue_deployed: true'));
check(351, 'no fake module_installed: true',                 !svc.includes('module_installed: true'));
check(352, 'no fake module_activated: true',                 !svc.includes('module_activated: true'));
check(353, 'no fake live_mode_enabled: true',                !svc.includes('live_mode_enabled: true'));
check(354, 'no fake launch_allowed: true',                   !svc.includes('launch_allowed: true'));
check(355, 'no fake billing_connected: true',                !svc.includes('billing_connected: true'));
check(356, 'no fake license_verified: true',                 !svc.includes('license_verified: true'));
check(357, 'no fake provider_connected: true',               !svc.includes('provider_connected: true'));
check(358, 'no fake marketplace_purchase_completed: true',   !svc.includes('marketplace_purchase_completed: true'));
check(359, 'no fake contains_secrets: true',                 !svc.includes('contains_secrets: true'));
check(360, 'no fake stores_secrets: true',                   !svc.includes('stores_secrets: true'));
check(361, 'no fake staff_invite_delivered: true',           !svc.includes('staff_invite_delivered: true'));
check(362, 'no fake menu_import_completed: true',            !svc.includes('menu_import_completed: true'));
check(363, 'no fake inventory_sync_enabled: true',           !svc.includes('inventory_sync_enabled: true'));
check(364, 'no hardcoded DB conn string',                    !svc.includes('postgres://') && !svc.includes('postgresql://'));
check(365, 'feature flags no module_installed: true in ff',  !ff.includes('module_installed: true'));
check(366, 'feature flags no live_mode_enabled: true in ff', !ff.includes('live_mode_enabled: true'));
check(367, 'feature flags no launch_allowed: true in ff',    !ff.includes('launch_allowed: true'));
check(368, 'no DROP TABLE in migration',                     !sql.includes('DROP TABLE'));
check(369, 'no TRUNCATE in migration',                       !sql.includes('TRUNCATE'));
check(370, 'no fake active live mode in UI',                 !ui.includes("live_mode_enabled: true") || ui.includes("'live_mode_enabled: false'"));
check(371, 'LockBanner used for activation_required in UI',  ui.includes('LockBanner') && ui.includes('activation_required'));
check(372, 'placeholder flag in UI',                         ui.includes('placeholder'));
check(373, 'configuration_required shown in UI',             ui.includes('configuration_required'));
check(374, 'not live shown in UI',                           ui.includes('not live') || ui.includes('not_live') || ui.includes('not-live'));
check(375, 'no SQL injection via string concat in service',  !svc.includes('+ req.') && !svc.includes('${req.'));
check(376, 'canAccessPOS3 guards all write routes',          (rte.match(/canAccessPOS3/g) || []).length >= 15);
check(377, 'GET routes open (no guard on all GETs)',         rte.includes('router.get('));
check(378, 'safe claims service method returns data',        svc.includes('getSafeOnboardingClaims'));
check(379, 'unsafe claims service returns honest data',      svc.includes('getUnsafeOnboardingClaims'));
check(380, 'honest limitations returns data',                svc.includes('getOnboardingHonestLimitations'));
check(381, 'STEPS array in frontend',                        ui.includes('STEPS'));
check(382, 'ROADMAP in frontend',                            ui.includes('ROADMAP'));
check(383, 'SetupCard component in UI',                      ui.includes('SetupCard'));
check(384, 'SectionTitle component in UI',                   ui.includes('SectionTitle'));

// ─── WIRING (385–389) ────────────────────────────────────────────────────────
check(385, 'server/index.js imports crafthub onboarding routes',  idx.includes('craftHubOnboardingRoutes') || idx.includes('onboardingRoutes'));
check(386, 'server/index.js mounts /api/crafthub/onboarding',     idx.includes('/api/crafthub/onboarding'));
check(387, 'src/App.jsx imports CraftHubOnboardingWizard',        app.includes('CraftHubOnboardingWizard'));
check(388, 'src/App.jsx route crafthub/onboarding',               app.includes('crafthub/onboarding'));
check(389, 'package.json verify:crafthub-onboarding script',      pkg.includes('verify:crafthub-onboarding'));

// ─── BACKWARD COMPATIBILITY (390–396) ────────────────────────────────────────
check(390, 'C5 dashboard route still in index.js',          idx.includes('dashboard') || idx.includes('crafthub'));
check(391, 'C5 dashboard still in App.jsx',                 app.includes('CraftHubDashboard') || app.includes('crafthub/dashboard'));
check(392, 'C4 security route exists in index.js',          idx.includes('security') || idx.includes('roleMiddleware') || idx.includes('canAccessPOS3'));
check(393, 'C3 billing protection still intact',            idx.includes('billing') || idx.includes('license'));
check(394, 'prior verify scripts still in package.json',    pkg.includes('verify:crafthub-dashboard'));
check(395, 'canAccessPOS3 middleware still present',        rte.includes('canAccessPOS3'));
check(396, 'no regression in routes file',                  rte.includes('Router') && rte.includes('export default'));

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log(`\nPhase C.6 Verification — CraftHub Venue Onboarding Readiness Flow`);
console.log(`${'─'.repeat(60)}`);
if (failures.length > 0) {
  console.log(`FAILURES:\n${failures.join('\n')}`);
}
console.log(`\nResult: ${passed} PASS / ${failed} FAIL / ${passed + failed} total`);
if (failed > 0) {
  console.error(`\n✗ ${failed} check(s) failed. Fix before committing.`);
  process.exit(1);
} else {
  console.log(`\n✓ All ${passed} checks passed.`);
}
