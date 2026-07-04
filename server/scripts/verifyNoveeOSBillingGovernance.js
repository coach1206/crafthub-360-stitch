// Phase C.3 / Module 3 of 7 — NOVEE OS Billing Governance Verification

import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const pass = [];
const fail = [];

function check(label, result) {
  if (result) { pass.push(label); } else { fail.push(label); }
}

const read = p => { try { return readFileSync(resolve(root, p), 'utf8'); } catch { return ''; } };

// ─── Load files ─────────────────────────────────────────────────────────────
const mig  = read('server/db/migrations/050_novee_os_licensing_plans_billing_gates.sql');
const cont = read('server/services/noveeOS/noveeOSBillingContracts.js');
const flags = read('server/config/noveeOSBillingFeatureFlags.js');
const loc  = read('src/locales/noveeOSBilling.js');
const svc  = read('server/services/noveeOS/noveeOSBillingGovernanceService.js');
const ctrl = read('server/controllers/noveeOSBillingGovernanceController.js');
const rts  = read('server/routes/noveeOSBillingGovernanceRoutes.js');
const ui   = read('src/pages/noveeOS/NoveeOSBillingGovernance.jsx');
const idx  = read('server/index.js');
const app  = read('src/App.jsx');
const pkg  = read('package.json');

// ─── Migration checks (40) ──────────────────────────────────────────────────
check('migration: file exists',                              mig.length > 0);
check('migration: safe comment no destructive DDL',          mig.includes('Safe migration: no destructive DDL'));
check('migration: no DROP TABLE',                            !mig.includes('DROP TABLE'));
check('migration: no TRUNCATE',                              !mig.includes('TRUNCATE'));
check('migration: novee_os_plan_catalogs table',             mig.includes('novee_os_plan_catalogs'));
check('migration: novee_os_plan_tiers table',                mig.includes('novee_os_plan_tiers'));
check('migration: novee_os_plan_features table',             mig.includes('novee_os_plan_features'));
check('migration: novee_os_module_plan_gates table',         mig.includes('novee_os_module_plan_gates'));
check('migration: novee_os_feature_access_gates table',      mig.includes('novee_os_feature_access_gates'));
check('migration: novee_os_trial_policies table',            mig.includes('novee_os_trial_policies'));
check('migration: novee_os_trial_instances table',           mig.includes('novee_os_trial_instances'));
check('migration: novee_os_grace_period_records table',      mig.includes('novee_os_grace_period_records'));
check('migration: novee_os_organization_licenses table',     mig.includes('novee_os_organization_licenses'));
check('migration: novee_os_venue_licenses table',            mig.includes('novee_os_venue_licenses'));
check('migration: novee_os_workspace_licenses table',        mig.includes('novee_os_workspace_licenses'));
check('migration: novee_os_user_seat_allocations table',     mig.includes('novee_os_user_seat_allocations'));
check('migration: novee_os_addon_catalog table',             mig.includes('novee_os_addon_catalog'));
check('migration: novee_os_addon_assignments table',         mig.includes('novee_os_addon_assignments'));
check('migration: novee_os_entitlement_records table',       mig.includes('novee_os_entitlement_records'));
check('migration: novee_os_access_decision_records table',   mig.includes('novee_os_access_decision_records'));
check('migration: novee_os_billing_provider_profiles table', mig.includes('novee_os_billing_provider_profiles'));
check('migration: novee_os_billing_customer_metadata table', mig.includes('novee_os_billing_customer_metadata'));
check('migration: novee_os_subscription_metadata table',     mig.includes('novee_os_subscription_metadata'));
check('migration: novee_os_invoice_metadata table',          mig.includes('novee_os_invoice_metadata'));
check('migration: novee_os_payment_status_placeholders table', mig.includes('novee_os_payment_status_placeholders'));
check('migration: novee_os_upgrade_downgrade_requests table', mig.includes('novee_os_upgrade_downgrade_requests'));
check('migration: novee_os_cancellation_requests table',     mig.includes('novee_os_cancellation_requests'));
check('migration: novee_os_renewal_reminder_records table',  mig.includes('novee_os_renewal_reminder_records'));
check('migration: novee_os_marketplace_purchase_placeholders table', mig.includes('novee_os_marketplace_purchase_placeholders'));
check('migration: novee_os_license_health_checks table',     mig.includes('novee_os_license_health_checks'));
check('migration: novee_os_billing_governance_snapshots table', mig.includes('novee_os_billing_governance_snapshots'));
check('migration: novee_os_billing_audit table',             mig.includes('novee_os_billing_audit'));
check('migration: 28 tables total (CREATE TABLE IF NOT EXISTS)',  (mig.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 28);
check('migration: billing_connected DEFAULT FALSE',          mig.includes('billing_connected') && mig.includes('DEFAULT FALSE'));
check('migration: payment_processed DEFAULT FALSE',          mig.includes('payment_processed'));
check('migration: subscription_active DEFAULT FALSE',        mig.includes('subscription_active'));
check('migration: invoice_paid DEFAULT FALSE',               mig.includes('invoice_paid'));
check('migration: license_verified DEFAULT FALSE',           mig.includes('license_verified'));
check('migration: exposes_financial_data DEFAULT TRUE',      mig.includes('exposes_financial_data') && mig.includes('DEFAULT TRUE'));
check('migration: idempotency_key columns present',          mig.includes('idempotency_key'));

// ─── Contracts checks (20) ──────────────────────────────────────────────────
check('contracts: file exists',                              cont.length > 0);
check('contracts: PLAN_STATUSES',                            cont.includes('PLAN_STATUSES'));
check('contracts: TIER_STATUSES',                            cont.includes('TIER_STATUSES'));
check('contracts: FEATURE_GATE_STATUSES',                    cont.includes('FEATURE_GATE_STATUSES'));
check('contracts: TRIAL_STATUSES',                           cont.includes('TRIAL_STATUSES'));
check('contracts: LICENSE_STATUSES',                         cont.includes('LICENSE_STATUSES'));
check('contracts: BILLING_STATUSES',                         cont.includes('BILLING_STATUSES'));
check('contracts: SUBSCRIPTION_STATUSES',                    cont.includes('SUBSCRIPTION_STATUSES'));
check('contracts: INVOICE_STATUSES',                         cont.includes('INVOICE_STATUSES'));
check('contracts: PAYMENT_STATUSES',                         cont.includes('PAYMENT_STATUSES'));
check('contracts: ENTITLEMENT_STATUSES',                     cont.includes('ENTITLEMENT_STATUSES'));
check('contracts: REQUEST_STATUSES',                         cont.includes('REQUEST_STATUSES'));
check('contracts: HEALTH_STATUSES',                          cont.includes('HEALTH_STATUSES'));
check('contracts: BILLING_PROVIDER_KEYS',                    cont.includes('BILLING_PROVIDER_KEYS'));
check('contracts: PLAN_KEYS',                                cont.includes('PLAN_KEYS'));
check('contracts: BILLING_INTERVALS',                        cont.includes('BILLING_INTERVALS'));
check('contracts: ADDON_TYPES',                              cont.includes('ADDON_TYPES'));
check('contracts: ACCESS_DECISION_TYPES',                    cont.includes('ACCESS_DECISION_TYPES'));
check('contracts: isValidPlanStatus validator',              cont.includes('isValidPlanStatus'));
check('contracts: isValidBillingStatus validator',           cont.includes('isValidBillingStatus'));

// ─── Feature flags checks (15) ─────────────────────────────────────────────
check('flags: file exists',                                  flags.length > 0);
check('flags: DEFAULT_NOVEE_OS_BILLING_FLAGS',               flags.includes('DEFAULT_NOVEE_OS_BILLING_FLAGS'));
check('flags: getNoveeOSBillingFlags function',              flags.includes('getNoveeOSBillingFlags'));
check('flags: licensingBillingEnabled: true',                flags.includes('licensingBillingEnabled'));
check('flags: planCatalogsEnabled: true',                    flags.includes('planCatalogsEnabled'));
check('flags: planTiersEnabled: true',                       flags.includes('planTiersEnabled'));
check('flags: trialPoliciesEnabled: true',                   flags.includes('trialPoliciesEnabled'));
check('flags: organizationLicensesEnabled: true',            flags.includes('organizationLicensesEnabled'));
check('flags: billingProviderProfilesEnabled: true',         flags.includes('billingProviderProfilesEnabled'));
check('flags: noFakeBillingConnectionEnforced: true',        flags.includes('noFakeBillingConnectionEnforced'));
check('flags: noFakePaymentProcessingEnforced: true',        flags.includes('noFakePaymentProcessingEnforced'));
check('flags: noFakeSubscriptionActivationEnforced: true',   flags.includes('noFakeSubscriptionActivationEnforced'));
check('flags: noFakeLicenseVerificationEnforced: true',      flags.includes('noFakeLicenseVerificationEnforced'));
check('flags: noSecretsStorageEnforced: true',               flags.includes('noSecretsStorageEnforced'));
check('flags: platformAdminGuardRequired: true',             flags.includes('platformAdminGuardRequired'));

// ─── Locales checks (20) ────────────────────────────────────────────────────
check('locales: file exists',                                loc.length > 0);
check('locales: en-US locale',                              loc.includes("'en-US'"));
check('locales: es-DO locale',                              loc.includes("'es-DO'"));
check('locales: es locale',                                 loc.includes("'es'"));
check('locales: ht locale',                                 loc.includes("'ht'"));
check('locales: de locale',                                 loc.includes("'de'"));
check('locales: pt locale',                                 loc.includes("'pt'"));
check('locales: tNoveeOSBilling function',                  loc.includes('tNoveeOSBilling'));
check('locales: getSupportedNoveeOSBillingLanguages',       loc.includes('getSupportedNoveeOSBillingLanguages'));
check('locales: licensing label',                           loc.includes('licensing'));
check('locales: plans label',                               loc.includes('plans'));
check('locales: billingGates label',                        loc.includes('billingGates'));
check('locales: trials label',                              loc.includes('trials'));
check('locales: entitlements label',                        loc.includes('entitlements'));
check('locales: billingProvider label',                     loc.includes('billingProvider'));
check('locales: honestLimitations label',                   loc.includes('honestLimitations'));
check('locales: noSecretsStored label',                     loc.includes('noSecretsStored'));
check('locales: emptyState label',                          loc.includes('emptyState'));
check('locales: phaseC3 label',                             loc.includes('phaseC3'));
check('locales: module3of7 label',                          loc.includes('module3of7'));

// ─── Service checks (60) ────────────────────────────────────────────────────
check('service: file exists',                               svc.length > 0);
check('service: AREA novee-os-billing-governance',          svc.includes("'novee-os-billing-governance'"));
check('service: JSDoc falls back gracefully',               svc.includes('Falls back gracefully'));
check('service: JSDoc never prints db connection string',   svc.includes('Never prints or logs the database connection string'));
check('service: localFallback function',                    svc.includes('localFallback'));
check('service: localPreview: true in fallback',            svc.includes('localPreview: true'));
check('service: contains_secrets: false comment',           svc.includes('contains_secrets: false'));
check('service: isDbAvailable import',                      svc.includes('isDbAvailable'));
check('service: createPlanCatalog export',                  svc.includes('createPlanCatalog'));
check('service: listPlanCatalogs export',                   svc.includes('listPlanCatalogs'));
check('service: updatePlanCatalogStatus export',            svc.includes('updatePlanCatalogStatus'));
check('service: createPlanTier export',                     svc.includes('createPlanTier'));
check('service: listPlanTiers export',                      svc.includes('listPlanTiers'));
check('service: createPlanFeature export',                  svc.includes('createPlanFeature'));
check('service: listPlanFeatures export',                   svc.includes('listPlanFeatures'));
check('service: createModulePlanGate export',               svc.includes('createModulePlanGate'));
check('service: listModulePlanGates export',                svc.includes('listModulePlanGates'));
check('service: createFeatureAccessGate export',            svc.includes('createFeatureAccessGate'));
check('service: listFeatureAccessGates export',             svc.includes('listFeatureAccessGates'));
check('service: evaluateFeatureAccessPlaceholder export',   svc.includes('evaluateFeatureAccessPlaceholder'));
check('service: createTrialPolicy export',                  svc.includes('createTrialPolicy'));
check('service: listTrialPolicies export',                  svc.includes('listTrialPolicies'));
check('service: createTrialInstance export',                svc.includes('createTrialInstance'));
check('service: listTrialInstances export',                 svc.includes('listTrialInstances'));
check('service: updateTrialStatus export',                  svc.includes('updateTrialStatus'));
check('service: createGracePeriodRecord export',            svc.includes('createGracePeriodRecord'));
check('service: createOrganizationLicense export',          svc.includes('createOrganizationLicense'));
check('service: listOrganizationLicenses export',           svc.includes('listOrganizationLicenses'));
check('service: createVenueLicense export',                 svc.includes('createVenueLicense'));
check('service: listVenueLicenses export',                  svc.includes('listVenueLicenses'));
check('service: createWorkspaceLicense export',             svc.includes('createWorkspaceLicense'));
check('service: listWorkspaceLicenses export',              svc.includes('listWorkspaceLicenses'));
check('service: createUserSeatAllocation export',           svc.includes('createUserSeatAllocation'));
check('service: createAddonCatalogEntry export',            svc.includes('createAddonCatalogEntry'));
check('service: createAddonAssignment export',              svc.includes('createAddonAssignment'));
check('service: createEntitlementRecord export',            svc.includes('createEntitlementRecord'));
check('service: listEntitlementRecords export',             svc.includes('listEntitlementRecords'));
check('service: updateEntitlementStatus export',            svc.includes('updateEntitlementStatus'));
check('service: createAccessDecisionRecord export',         svc.includes('createAccessDecisionRecord'));
check('service: createBillingProviderProfile export',       svc.includes('createBillingProviderProfile'));
check('service: listBillingProviderProfiles export',        svc.includes('listBillingProviderProfiles'));
check('service: updateBillingProviderStatus export',        svc.includes('updateBillingProviderStatus'));
check('service: createBillingCustomerMetadata export',      svc.includes('createBillingCustomerMetadata'));
check('service: createSubscriptionMetadata export',         svc.includes('createSubscriptionMetadata'));
check('service: listSubscriptionMetadata export',           svc.includes('listSubscriptionMetadata'));
check('service: updateSubscriptionStatus export',           svc.includes('updateSubscriptionStatus'));
check('service: createInvoiceMetadata export',              svc.includes('createInvoiceMetadata'));
check('service: updateInvoiceStatus export',                svc.includes('updateInvoiceStatus'));
check('service: createPaymentStatusPlaceholder export',     svc.includes('createPaymentStatusPlaceholder'));
check('service: updatePaymentStatusPlaceholder export',     svc.includes('updatePaymentStatusPlaceholder'));
check('service: createUpgradeDowngradeRequest export',      svc.includes('createUpgradeDowngradeRequest'));
check('service: createCancellationRequest export',          svc.includes('createCancellationRequest'));
check('service: createRenewalReminderRecord export',        svc.includes('createRenewalReminderRecord'));
check('service: createMarketplacePurchasePlaceholder export', svc.includes('createMarketplacePurchasePlaceholder'));
check('service: createLicenseHealthCheck export',           svc.includes('createLicenseHealthCheck'));
check('service: createBillingGovernanceSnapshot export',    svc.includes('createBillingGovernanceSnapshot'));
check('service: getLatestBillingGovernanceSnapshot export', svc.includes('getLatestBillingGovernanceSnapshot'));
check('service: getSafeBillingClaims export',               svc.includes('getSafeBillingClaims'));
check('service: getUnsafeBillingClaims export',             svc.includes('getUnsafeBillingClaims'));
check('service: getBillingHonestLimitations export',        svc.includes('getBillingHonestLimitations'));
check('service: getBillingPhaseRoadmap export',             svc.includes('getBillingPhaseRoadmap'));
check('service: writeBillingAudit export',                  svc.includes('writeBillingAudit'));

// ─── Controller checks (30) ─────────────────────────────────────────────────
check('controller: file exists',                            ctrl.length > 0);
check('controller: ok500 pattern',                          ctrl.includes('ok500'));
check('controller: actor pattern',                          ctrl.includes('actor'));
check('controller: ikey pattern',                           ctrl.includes('ikey'));
check('controller: createPlanCatalog handler',              ctrl.includes('createPlanCatalog'));
check('controller: listPlanCatalogs handler',               ctrl.includes('listPlanCatalogs'));
check('controller: updatePlanCatalogStatus handler',        ctrl.includes('updatePlanCatalogStatus'));
check('controller: createPlanTier handler',                 ctrl.includes('createPlanTier'));
check('controller: createTrialPolicy handler',              ctrl.includes('createTrialPolicy'));
check('controller: createTrialInstance handler',            ctrl.includes('createTrialInstance'));
check('controller: updateTrialStatus handler',              ctrl.includes('updateTrialStatus'));
check('controller: createOrganizationLicense handler',      ctrl.includes('createOrganizationLicense'));
check('controller: createVenueLicense handler',             ctrl.includes('createVenueLicense'));
check('controller: createWorkspaceLicense handler',         ctrl.includes('createWorkspaceLicense'));
check('controller: createEntitlementRecord handler',        ctrl.includes('createEntitlementRecord'));
check('controller: updateEntitlementStatus handler',        ctrl.includes('updateEntitlementStatus'));
check('controller: createBillingProviderProfile handler',   ctrl.includes('createBillingProviderProfile'));
check('controller: updateBillingProviderStatus handler',    ctrl.includes('updateBillingProviderStatus'));
check('controller: createSubscriptionMetadata handler',     ctrl.includes('createSubscriptionMetadata'));
check('controller: updateSubscriptionStatus handler',       ctrl.includes('updateSubscriptionStatus'));
check('controller: createInvoiceMetadata handler',          ctrl.includes('createInvoiceMetadata'));
check('controller: updateInvoiceStatus handler',            ctrl.includes('updateInvoiceStatus'));
check('controller: createPaymentStatusPlaceholder handler', ctrl.includes('createPaymentStatusPlaceholder'));
check('controller: createUpgradeDowngradeRequest handler',  ctrl.includes('createUpgradeDowngradeRequest'));
check('controller: createCancellationRequest handler',      ctrl.includes('createCancellationRequest'));
check('controller: createBillingGovernanceSnapshot handler', ctrl.includes('createBillingGovernanceSnapshot'));
check('controller: getSafeBillingClaims handler',           ctrl.includes('getSafeBillingClaims'));
check('controller: getUnsafeBillingClaims handler',         ctrl.includes('getUnsafeBillingClaims'));
check('controller: getBillingHonestLimitations handler',    ctrl.includes('getBillingHonestLimitations'));
check('controller: writeBillingAudit handler',              ctrl.includes('writeBillingAudit'));

// ─── Routes checks (30) ─────────────────────────────────────────────────────
check('routes: file exists',                                rts.length > 0);
check('routes: canAccessPOS3 import',                       rts.includes('canAccessPOS3'));
check('routes: router created',                             rts.includes('Router()'));
check('routes: export default router',                      rts.includes('export default router'));
check('routes: GET plan-catalogs',                          rts.includes("get('/plan-catalogs'"));
check('routes: POST plan-catalogs with guard',              rts.includes("post('/plan-catalogs'") && rts.includes('canAccessPOS3'));
check('routes: PATCH plan-catalogs status',                 rts.includes("patch('/plan-catalogs/:id/status'"));
check('routes: GET plan-tiers',                             rts.includes("get('/plan-tiers'"));
check('routes: GET trial-policies',                         rts.includes("get('/trial-policies'"));
check('routes: POST trial-instances with guard',            rts.includes("post('/trial-instances'"));
check('routes: GET organization-licenses',                  rts.includes("get('/organization-licenses'"));
check('routes: POST organization-licenses with guard',      rts.includes("post('/organization-licenses'"));
check('routes: GET venue-licenses',                         rts.includes("get('/venue-licenses'"));
check('routes: GET workspace-licenses',                     rts.includes("get('/workspace-licenses'"));
check('routes: GET billing-providers',                      rts.includes("get('/billing-providers'"));
check('routes: POST billing-providers with guard',          rts.includes("post('/billing-providers'"));
check('routes: PATCH billing-providers status',             rts.includes("patch('/billing-providers/:id/status'"));
check('routes: GET subscriptions',                          rts.includes("get('/subscriptions'"));
check('routes: GET invoices',                               rts.includes("get('/invoices'"));
check('routes: GET payment-placeholders',                   rts.includes("get('/payment-placeholders'"));
check('routes: GET upgrade-downgrade-requests',             rts.includes("get('/upgrade-downgrade-requests'"));
check('routes: GET cancellation-requests',                  rts.includes("get('/cancellation-requests'"));
check('routes: GET governance-snapshots/latest',            rts.includes("get('/governance-snapshots/latest'"));
check('routes: POST governance-snapshots with guard',       rts.includes("post('/governance-snapshots'"));
check('routes: GET claims/safe',                            rts.includes("get('/claims/safe'"));
check('routes: GET claims/unsafe',                          rts.includes("get('/claims/unsafe'"));
check('routes: GET honest-limitations',                     rts.includes("get('/honest-limitations'"));
check('routes: GET phase-roadmap',                          rts.includes("get('/phase-roadmap'"));
check('routes: POST audit with guard',                      rts.includes("post('/audit'"));
check('routes: POST feature-access-gates/evaluate',         rts.includes("post('/feature-access-gates/evaluate'"));

// ─── UI checks (40) ─────────────────────────────────────────────────────────
check('ui: file exists',                                    ui.length > 0);
check('ui: DEVICE_LINE constant',                           ui.includes("const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop'"));
check('ui: NAVY color token',                               ui.includes("'#0a0d14'"));
check('ui: CHARCOAL color token',                           ui.includes("'#111520'"));
check('ui: CARD color token',                               ui.includes("'#161b27'"));
check('ui: GOLD color token',                               ui.includes("'#c9952c'"));
check('ui: GOLD2 color token',                              ui.includes("'#e8b84b'"));
check('ui: TEXT color token',                               ui.includes("'#e8e4d8'"));
check('ui: RED color token',                                ui.includes("'#c0392b'"));
check('ui: GREEN color token',                              ui.includes("'#27ae60'"));
check('ui: BLUE color token',                               ui.includes("'#2980b9'"));
check('ui: AMBER color token',                              ui.includes("'#e67e22'"));
check('ui: PURPLE color token',                             ui.includes("'#8e44ad'"));
check('ui: useState import',                                ui.includes('useState'));
check('ui: PlanCatalogPanel component',                     ui.includes('PlanCatalogPanel'));
check('ui: PlanTiersPanel component',                       ui.includes('PlanTiersPanel'));
check('ui: PlanFeaturesPanel component',                    ui.includes('PlanFeaturesPanel'));
check('ui: ModulePlanGatesPanel component',                 ui.includes('ModulePlanGatesPanel'));
check('ui: FeatureAccessGatesPanel component',              ui.includes('FeatureAccessGatesPanel'));
check('ui: TrialPoliciesPanel component',                   ui.includes('TrialPoliciesPanel'));
check('ui: TrialInstancesPanel component',                  ui.includes('TrialInstancesPanel'));
check('ui: GracePeriodsPanel component',                    ui.includes('GracePeriodsPanel'));
check('ui: OrganizationLicensesPanel component',            ui.includes('OrganizationLicensesPanel'));
check('ui: VenueLicensesPanel component',                   ui.includes('VenueLicensesPanel'));
check('ui: WorkspaceLicensesPanel component',               ui.includes('WorkspaceLicensesPanel'));
check('ui: BillingProviderProfilesPanel component',         ui.includes('BillingProviderProfilesPanel'));
check('ui: SubscriptionMetadataPanel component',            ui.includes('SubscriptionMetadataPanel'));
check('ui: InvoiceMetadataPanel component',                 ui.includes('InvoiceMetadataPanel'));
check('ui: PaymentStatusPlaceholdersPanel component',       ui.includes('PaymentStatusPlaceholdersPanel'));
check('ui: SafeClaimsPanel component',                      ui.includes('SafeClaimsPanel'));
check('ui: UnsafeClaimsPanel component',                    ui.includes('UnsafeClaimsPanel'));
check('ui: HonestLimitationsPanel component',               ui.includes('HonestLimitationsPanel'));
check('ui: BillingAuditPanel component',                    ui.includes('BillingAuditPanel'));
check('ui: PhaseRoadmapPanel component',                    ui.includes('PhaseRoadmapPanel'));
check('ui: NoveeOSBillingGovernance function',              ui.includes('function NoveeOSBillingGovernance'));
check('ui: export default NoveeOSBillingGovernance',        ui.includes('export default NoveeOSBillingGovernance'));
check('ui: NOVEE OS BILLING GOVERNANCE header',             ui.includes('NOVEE OS — BILLING GOVERNANCE'));
check('ui: Phase C.3 / Module 3 of 7 text',                ui.includes('Phase C.3 / Module 3 of 7'));
check('ui: NOT CONNECTED badge',                            ui.includes('NOT CONNECTED'));
check('ui: PLACEHOLDER badge',                              ui.includes('PLACEHOLDER'));

// ─── Wiring checks (20) ─────────────────────────────────────────────────────
check('wiring: server/index.js exists',                     idx.length > 0);
check('wiring: noveeOSBillingGovernanceRoutes import',      idx.includes('noveeOSBillingGovernanceRoutes'));
check('wiring: mounted at /api/novee-os/billing',           idx.includes("'/api/novee-os/billing'"));
check('wiring: App.jsx exists',                             app.length > 0);
check('wiring: NoveeOSBillingGovernance import in App',     app.includes('NoveeOSBillingGovernance'));
check('wiring: novee-os/billing route in App',              app.includes('novee-os/billing'));
check('wiring: package.json verify script',                 pkg.includes('verify:novee-os-billing'));
check('wiring: verify script uses node',                    pkg.includes('verifyNoveeOSBillingGovernance'));

// ─── Integrity checks — no fake real operations (20) ───────────────────────
check('integrity: no real Stripe connection claimed',        !svc.includes('stripe_connected: true') && !svc.includes('billing_connected: true'));
check('integrity: no real payment_processed claimed',        !svc.includes('payment_processed: true'));
check('integrity: no real subscription_active claimed',      !svc.includes('subscription_active: true'));
check('integrity: no real invoice_paid claimed',             !svc.includes('invoice_paid: true'));
check('integrity: no real license_verified claimed',         !svc.includes('license_verified: true'));
check('integrity: no real marketplace_purchase_completed',   !svc.includes('marketplace_purchase_completed: true'));
check('integrity: no real trial_converted claimed',          !svc.includes('trial_converted: true'));
check('integrity: no real cancellation_completed claimed',   !svc.includes('cancellation_completed: true'));
check('integrity: no real renewal_charged claimed',          !svc.includes('renewal_charged: true'));
check('integrity: no real entitlement_active claimed',       !svc.includes('entitlement_active: true'));
check('integrity: no real provider_connected claimed',       !svc.includes('provider_connected: true'));
check('integrity: contains_secrets: false in service',       svc.includes('contains_secrets: false'));
check('integrity: stores_secrets: false in service',         svc.includes('stores_secrets: false'));
check('integrity: localPreview in fallback path',            svc.includes('localPreview'));
check('integrity: evaluateFeatureAccess returns blocked',    svc.includes('blocked_plan_required'));
check('integrity: getSafeBillingClaims present',             svc.includes('getSafeBillingClaims'));
check('integrity: getUnsafeBillingClaims present',           svc.includes('getUnsafeBillingClaims'));
check('integrity: getBillingHonestLimitations present',      svc.includes('getBillingHonestLimitations'));
check('integrity: honest limitations mention provider',      svc.includes('provider'));
check('integrity: phase roadmap C.3 current',                svc.includes('C.3') && svc.includes('current'));

// ─── Guard checks (15) ──────────────────────────────────────────────────────
check('guard: canAccessPOS3 used in routes',                 rts.includes('canAccessPOS3'));
check('guard: POST routes have canAccessPOS3',               rts.includes("post('/plan-catalogs'") && rts.includes('canAccessPOS3'));
check('guard: PATCH routes have canAccessPOS3',              rts.includes("patch('/plan-catalogs/:id/status'") && rts.includes('canAccessPOS3'));
check('guard: audit route has canAccessPOS3',                rts.includes("post('/audit'") && rts.includes('canAccessPOS3'));
check('guard: canAccessPOS3 imported from roleMiddleware',   rts.includes('roleMiddleware'));
check('guard: billing snapshots write guarded',              rts.includes("post('/governance-snapshots'") && rts.includes('canAccessPOS3'));
check('guard: billing provider write guarded',               rts.includes("post('/billing-providers'") && rts.includes('canAccessPOS3'));
check('guard: subscription write guarded',                   rts.includes("post('/subscriptions'") && rts.includes('canAccessPOS3'));
check('guard: invoice write guarded',                        rts.includes("post('/invoices'") && rts.includes('canAccessPOS3'));
check('guard: entitlement write guarded',                    rts.includes("post('/entitlements'") && rts.includes('canAccessPOS3'));
check('guard: cancellation write guarded',                   rts.includes("post('/cancellation-requests'") && rts.includes('canAccessPOS3'));
check('guard: license health write guarded',                 rts.includes("post('/license-health'") && rts.includes('canAccessPOS3'));
check('guard: marketplace write guarded',                    rts.includes("post('/marketplace-purchases'") && rts.includes('canAccessPOS3'));
check('guard: upgrade/downgrade write guarded',              rts.includes("post('/upgrade-downgrade-requests'") && rts.includes('canAccessPOS3'));
check('guard: renewal write guarded',                        rts.includes("post('/renewal-reminders'") && rts.includes('canAccessPOS3'));

// ─── Phase continuity checks (10) ─────────────────────────────────────────
check('continuity: C.1 module registry routes still in index', idx.includes('novee-os/modules') || idx.includes("noveeOSModuleRegistry"));
check('continuity: C.2 tenant routes still in index',          idx.includes('novee-os/tenants') || idx.includes("noveeOSTenantGovernance"));
check('continuity: C.1 module registry in App.jsx',            app.includes('novee-os/modules') || app.includes('NoveeOSModuleRegistry'));
check('continuity: C.2 tenant governance in App.jsx',          app.includes('novee-os/tenants') || app.includes('NoveeOSTenantGovernance'));
check('continuity: verify:novee-os-modules in package.json',   pkg.includes('verify:novee-os-modules'));
check('continuity: verify:novee-os-tenants in package.json',   pkg.includes('verify:novee-os-tenants'));
check('continuity: migration 048 file exists',                  read('server/db/migrations/048_novee_os_module_registry_platform_control.sql').length > 0);
check('continuity: migration 049 file exists',                  read('server/db/migrations/049_novee_os_tenant_venue_workspace_governance.sql').length > 0);
check('continuity: migration 050 file exists',                  read('server/db/migrations/050_novee_os_licensing_plans_billing_gates.sql').length > 0);
check('continuity: C.3 does not break canAccessPOS3 import',   rts.includes('canAccessPOS3'));

// ─── Result ─────────────────────────────────────────────────────────────────
const total = pass.length + fail.length;
console.log(`\nNOVEE OS Billing Governance — Phase C.3 Module 3 Verification`);
console.log(`=`.repeat(60));
fail.forEach(f => console.log(`  FAILED: ${f}`));
console.log(`\nPASSED: ${pass.length} / ${total}`);
console.log(`FAILED: ${fail.length} / ${total}`);
if (fail.length > 0) {
  process.exit(1);
} else {
  console.log(`\nAll ${total} checks passed.`);
}
