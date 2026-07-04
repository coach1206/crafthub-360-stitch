// Phase C.3 / Module 3 of 7 — NOVEE OS Billing Governance Controller

import * as svc from '../services/noveeOS/noveeOSBillingGovernanceService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actor = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey  = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

// Plan Catalogs
export const createPlanCatalog            = (req, res) => ok500(res, async () => res.json(await svc.createPlanCatalog({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listPlanCatalogs             = (req, res) => ok500(res, async () => res.json(await svc.listPlanCatalogs(req.query)));
export const updatePlanCatalogStatus      = (req, res) => ok500(res, async () => res.json(await svc.updatePlanCatalogStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Plan Tiers
export const createPlanTier               = (req, res) => ok500(res, async () => res.json(await svc.createPlanTier({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listPlanTiers                = (req, res) => ok500(res, async () => res.json(await svc.listPlanTiers(req.query)));
export const updatePlanTierStatus         = (req, res) => ok500(res, async () => res.json(await svc.updatePlanTierStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Plan Features
export const createPlanFeature            = (req, res) => ok500(res, async () => res.json(await svc.createPlanFeature({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listPlanFeatures             = (req, res) => ok500(res, async () => res.json(await svc.listPlanFeatures(req.query)));

// Module Plan Gates
export const createModulePlanGate         = (req, res) => ok500(res, async () => res.json(await svc.createModulePlanGate({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listModulePlanGates          = (req, res) => ok500(res, async () => res.json(await svc.listModulePlanGates(req.query)));

// Feature Access Gates
export const createFeatureAccessGate      = (req, res) => ok500(res, async () => res.json(await svc.createFeatureAccessGate({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listFeatureAccessGates       = (req, res) => ok500(res, async () => res.json(await svc.listFeatureAccessGates(req.query)));
export const evaluateFeatureAccess        = (req, res) => ok500(res, async () => res.json(await svc.evaluateFeatureAccessPlaceholder({ ...req.body, actor: actor(req) })));

// Trial Policies
export const createTrialPolicy            = (req, res) => ok500(res, async () => res.json(await svc.createTrialPolicy({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listTrialPolicies            = (req, res) => ok500(res, async () => res.json(await svc.listTrialPolicies(req.query)));

// Trial Instances
export const createTrialInstance          = (req, res) => ok500(res, async () => res.json(await svc.createTrialInstance({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listTrialInstances           = (req, res) => ok500(res, async () => res.json(await svc.listTrialInstances(req.query)));
export const updateTrialStatus            = (req, res) => ok500(res, async () => res.json(await svc.updateTrialStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Grace Periods
export const createGracePeriodRecord      = (req, res) => ok500(res, async () => res.json(await svc.createGracePeriodRecord({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listGracePeriodRecords       = (req, res) => ok500(res, async () => res.json(await svc.listGracePeriodRecords(req.query)));

// Organization Licenses
export const createOrganizationLicense    = (req, res) => ok500(res, async () => res.json(await svc.createOrganizationLicense({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listOrganizationLicenses     = (req, res) => ok500(res, async () => res.json(await svc.listOrganizationLicenses(req.query)));
export const updateOrganizationLicenseStatus = (req, res) => ok500(res, async () => res.json(await svc.updateOrganizationLicenseStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Venue Licenses
export const createVenueLicense           = (req, res) => ok500(res, async () => res.json(await svc.createVenueLicense({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listVenueLicenses            = (req, res) => ok500(res, async () => res.json(await svc.listVenueLicenses(req.query)));
export const updateVenueLicenseStatus     = (req, res) => ok500(res, async () => res.json(await svc.updateVenueLicenseStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Workspace Licenses
export const createWorkspaceLicense       = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceLicense({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaceLicenses        = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceLicenses(req.query)));
export const updateWorkspaceLicenseStatus = (req, res) => ok500(res, async () => res.json(await svc.updateWorkspaceLicenseStatus({ ...req.params, ...req.body, actor: actor(req) })));

// User Seat Allocations
export const createUserSeatAllocation     = (req, res) => ok500(res, async () => res.json(await svc.createUserSeatAllocation({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listUserSeatAllocations      = (req, res) => ok500(res, async () => res.json(await svc.listUserSeatAllocations(req.query)));

// Addon Catalog
export const createAddonCatalogEntry      = (req, res) => ok500(res, async () => res.json(await svc.createAddonCatalogEntry({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listAddonCatalog             = (req, res) => ok500(res, async () => res.json(await svc.listAddonCatalog(req.query)));

// Addon Assignments
export const createAddonAssignment        = (req, res) => ok500(res, async () => res.json(await svc.createAddonAssignment({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listAddonAssignments         = (req, res) => ok500(res, async () => res.json(await svc.listAddonAssignments(req.query)));

// Entitlement Records
export const createEntitlementRecord      = (req, res) => ok500(res, async () => res.json(await svc.createEntitlementRecord({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listEntitlementRecords       = (req, res) => ok500(res, async () => res.json(await svc.listEntitlementRecords(req.query)));
export const updateEntitlementStatus      = (req, res) => ok500(res, async () => res.json(await svc.updateEntitlementStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Access Decision Records
export const createAccessDecisionRecord   = (req, res) => ok500(res, async () => res.json(await svc.createAccessDecisionRecord({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listAccessDecisionRecords    = (req, res) => ok500(res, async () => res.json(await svc.listAccessDecisionRecords(req.query)));

// Billing Provider Profiles
export const createBillingProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.createBillingProviderProfile({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listBillingProviderProfiles  = (req, res) => ok500(res, async () => res.json(await svc.listBillingProviderProfiles(req.query)));
export const updateBillingProviderStatus  = (req, res) => ok500(res, async () => res.json(await svc.updateBillingProviderStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Billing Customer Metadata
export const createBillingCustomerMetadata = (req, res) => ok500(res, async () => res.json(await svc.createBillingCustomerMetadata({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listBillingCustomerMetadata   = (req, res) => ok500(res, async () => res.json(await svc.listBillingCustomerMetadata(req.query)));

// Subscription Metadata
export const createSubscriptionMetadata   = (req, res) => ok500(res, async () => res.json(await svc.createSubscriptionMetadata({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listSubscriptionMetadata     = (req, res) => ok500(res, async () => res.json(await svc.listSubscriptionMetadata(req.query)));
export const updateSubscriptionStatus     = (req, res) => ok500(res, async () => res.json(await svc.updateSubscriptionStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Invoice Metadata
export const createInvoiceMetadata        = (req, res) => ok500(res, async () => res.json(await svc.createInvoiceMetadata({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listInvoiceMetadata          = (req, res) => ok500(res, async () => res.json(await svc.listInvoiceMetadata(req.query)));
export const updateInvoiceStatus          = (req, res) => ok500(res, async () => res.json(await svc.updateInvoiceStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Payment Status Placeholders
export const createPaymentStatusPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createPaymentStatusPlaceholder({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listPaymentStatusPlaceholders  = (req, res) => ok500(res, async () => res.json(await svc.listPaymentStatusPlaceholders(req.query)));
export const updatePaymentStatusPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.updatePaymentStatusPlaceholder({ ...req.params, ...req.body, actor: actor(req) })));

// Upgrade/Downgrade Requests
export const createUpgradeDowngradeRequest       = (req, res) => ok500(res, async () => res.json(await svc.createUpgradeDowngradeRequest({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listUpgradeDowngradeRequests        = (req, res) => ok500(res, async () => res.json(await svc.listUpgradeDowngradeRequests(req.query)));
export const updateUpgradeDowngradeRequestStatus = (req, res) => ok500(res, async () => res.json(await svc.updateUpgradeDowngradeRequestStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Cancellation Requests
export const createCancellationRequest    = (req, res) => ok500(res, async () => res.json(await svc.createCancellationRequest({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listCancellationRequests     = (req, res) => ok500(res, async () => res.json(await svc.listCancellationRequests(req.query)));
export const updateCancellationRequestStatus = (req, res) => ok500(res, async () => res.json(await svc.updateCancellationRequestStatus({ ...req.params, ...req.body, actor: actor(req) })));

// Renewal Reminder Records
export const createRenewalReminderRecord  = (req, res) => ok500(res, async () => res.json(await svc.createRenewalReminderRecord({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listRenewalReminderRecords   = (req, res) => ok500(res, async () => res.json(await svc.listRenewalReminderRecords(req.query)));

// Marketplace Purchase Placeholders
export const createMarketplacePurchasePlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createMarketplacePurchasePlaceholder({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listMarketplacePurchasePlaceholders  = (req, res) => ok500(res, async () => res.json(await svc.listMarketplacePurchasePlaceholders(req.query)));

// License Health Checks
export const createLicenseHealthCheck     = (req, res) => ok500(res, async () => res.json(await svc.createLicenseHealthCheck({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const listLicenseHealthChecks      = (req, res) => ok500(res, async () => res.json(await svc.listLicenseHealthChecks(req.query)));

// Billing Governance Snapshots
export const createBillingGovernanceSnapshot = (req, res) => ok500(res, async () => res.json(await svc.createBillingGovernanceSnapshot({ ...req.body, actor: actor(req), idempotencyKey: ikey(req) })));
export const getLatestBillingGovernanceSnapshot = (req, res) => ok500(res, async () => res.json(await svc.getLatestBillingGovernanceSnapshot(req.query)));

// Safe/Unsafe Claims & Meta
export const getSafeBillingClaims         = (req, res) => ok500(res, async () => res.json(await svc.getSafeBillingClaims()));
export const getUnsafeBillingClaims       = (req, res) => ok500(res, async () => res.json(await svc.getUnsafeBillingClaims()));
export const getBillingHonestLimitations  = (req, res) => ok500(res, async () => res.json(await svc.getBillingHonestLimitations()));
export const getBillingPhaseRoadmap       = (req, res) => ok500(res, async () => res.json(await svc.getBillingPhaseRoadmap()));
export const writeBillingAudit            = (req, res) => ok500(res, async () => res.json(await svc.writeBillingAudit({ ...req.body, actor: actor(req) })));
