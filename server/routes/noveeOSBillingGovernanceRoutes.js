// Phase C.3 / Module 3 of 7 — NOVEE OS Billing Governance Routes

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/noveeOSBillingGovernanceController.js';

const router = Router();

// Plan Catalogs
router.get('/plan-catalogs',               ctrl.listPlanCatalogs);
router.post('/plan-catalogs',              canAccessPOS3, ctrl.createPlanCatalog);
router.patch('/plan-catalogs/:id/status',  canAccessPOS3, ctrl.updatePlanCatalogStatus);

// Plan Tiers
router.get('/plan-tiers',                  ctrl.listPlanTiers);
router.post('/plan-tiers',                 canAccessPOS3, ctrl.createPlanTier);
router.patch('/plan-tiers/:id/status',     canAccessPOS3, ctrl.updatePlanTierStatus);

// Plan Features
router.get('/plan-features',               ctrl.listPlanFeatures);
router.post('/plan-features',              canAccessPOS3, ctrl.createPlanFeature);

// Module Plan Gates
router.get('/module-plan-gates',           ctrl.listModulePlanGates);
router.post('/module-plan-gates',          canAccessPOS3, ctrl.createModulePlanGate);

// Feature Access Gates
router.get('/feature-access-gates',        ctrl.listFeatureAccessGates);
router.post('/feature-access-gates',       canAccessPOS3, ctrl.createFeatureAccessGate);
router.post('/feature-access-gates/evaluate', ctrl.evaluateFeatureAccess);

// Trial Policies
router.get('/trial-policies',              ctrl.listTrialPolicies);
router.post('/trial-policies',             canAccessPOS3, ctrl.createTrialPolicy);

// Trial Instances
router.get('/trial-instances',             ctrl.listTrialInstances);
router.post('/trial-instances',            canAccessPOS3, ctrl.createTrialInstance);
router.patch('/trial-instances/:id/status', canAccessPOS3, ctrl.updateTrialStatus);

// Grace Periods
router.get('/grace-periods',               ctrl.listGracePeriodRecords);
router.post('/grace-periods',              canAccessPOS3, ctrl.createGracePeriodRecord);

// Organization Licenses
router.get('/organization-licenses',       ctrl.listOrganizationLicenses);
router.post('/organization-licenses',      canAccessPOS3, ctrl.createOrganizationLicense);
router.patch('/organization-licenses/:id/status', canAccessPOS3, ctrl.updateOrganizationLicenseStatus);

// Venue Licenses
router.get('/venue-licenses',              ctrl.listVenueLicenses);
router.post('/venue-licenses',             canAccessPOS3, ctrl.createVenueLicense);
router.patch('/venue-licenses/:id/status', canAccessPOS3, ctrl.updateVenueLicenseStatus);

// Workspace Licenses
router.get('/workspace-licenses',          ctrl.listWorkspaceLicenses);
router.post('/workspace-licenses',         canAccessPOS3, ctrl.createWorkspaceLicense);
router.patch('/workspace-licenses/:id/status', canAccessPOS3, ctrl.updateWorkspaceLicenseStatus);

// User Seat Allocations
router.get('/user-seat-allocations',       ctrl.listUserSeatAllocations);
router.post('/user-seat-allocations',      canAccessPOS3, ctrl.createUserSeatAllocation);

// Addon Catalog
router.get('/addon-catalog',               ctrl.listAddonCatalog);
router.post('/addon-catalog',              canAccessPOS3, ctrl.createAddonCatalogEntry);

// Addon Assignments
router.get('/addon-assignments',           ctrl.listAddonAssignments);
router.post('/addon-assignments',          canAccessPOS3, ctrl.createAddonAssignment);

// Entitlement Records
router.get('/entitlements',                ctrl.listEntitlementRecords);
router.post('/entitlements',               canAccessPOS3, ctrl.createEntitlementRecord);
router.patch('/entitlements/:id/status',   canAccessPOS3, ctrl.updateEntitlementStatus);

// Access Decision Records
router.get('/access-decisions',            ctrl.listAccessDecisionRecords);
router.post('/access-decisions',           canAccessPOS3, ctrl.createAccessDecisionRecord);

// Billing Provider Profiles
router.get('/billing-providers',           ctrl.listBillingProviderProfiles);
router.post('/billing-providers',          canAccessPOS3, ctrl.createBillingProviderProfile);
router.patch('/billing-providers/:id/status', canAccessPOS3, ctrl.updateBillingProviderStatus);

// Billing Customer Metadata
router.get('/billing-customers',           ctrl.listBillingCustomerMetadata);
router.post('/billing-customers',          canAccessPOS3, ctrl.createBillingCustomerMetadata);

// Subscription Metadata
router.get('/subscriptions',               ctrl.listSubscriptionMetadata);
router.post('/subscriptions',              canAccessPOS3, ctrl.createSubscriptionMetadata);
router.patch('/subscriptions/:id/status',  canAccessPOS3, ctrl.updateSubscriptionStatus);

// Invoice Metadata
router.get('/invoices',                    ctrl.listInvoiceMetadata);
router.post('/invoices',                   canAccessPOS3, ctrl.createInvoiceMetadata);
router.patch('/invoices/:id/status',       canAccessPOS3, ctrl.updateInvoiceStatus);

// Payment Status Placeholders
router.get('/payment-placeholders',        ctrl.listPaymentStatusPlaceholders);
router.post('/payment-placeholders',       canAccessPOS3, ctrl.createPaymentStatusPlaceholder);
router.patch('/payment-placeholders/:id',  canAccessPOS3, ctrl.updatePaymentStatusPlaceholder);

// Upgrade/Downgrade Requests
router.get('/upgrade-downgrade-requests',  ctrl.listUpgradeDowngradeRequests);
router.post('/upgrade-downgrade-requests', canAccessPOS3, ctrl.createUpgradeDowngradeRequest);
router.patch('/upgrade-downgrade-requests/:id/status', canAccessPOS3, ctrl.updateUpgradeDowngradeRequestStatus);

// Cancellation Requests
router.get('/cancellation-requests',       ctrl.listCancellationRequests);
router.post('/cancellation-requests',      canAccessPOS3, ctrl.createCancellationRequest);
router.patch('/cancellation-requests/:id/status', canAccessPOS3, ctrl.updateCancellationRequestStatus);

// Renewal Reminder Records
router.get('/renewal-reminders',           ctrl.listRenewalReminderRecords);
router.post('/renewal-reminders',          canAccessPOS3, ctrl.createRenewalReminderRecord);

// Marketplace Purchase Placeholders
router.get('/marketplace-purchases',       ctrl.listMarketplacePurchasePlaceholders);
router.post('/marketplace-purchases',      canAccessPOS3, ctrl.createMarketplacePurchasePlaceholder);

// License Health Checks
router.get('/license-health',              ctrl.listLicenseHealthChecks);
router.post('/license-health',             canAccessPOS3, ctrl.createLicenseHealthCheck);

// Billing Governance Snapshots
router.get('/governance-snapshots/latest', ctrl.getLatestBillingGovernanceSnapshot);
router.post('/governance-snapshots',       canAccessPOS3, ctrl.createBillingGovernanceSnapshot);

// Meta / Claims
router.get('/claims/safe',                 ctrl.getSafeBillingClaims);
router.get('/claims/unsafe',               ctrl.getUnsafeBillingClaims);
router.get('/honest-limitations',          ctrl.getBillingHonestLimitations);
router.get('/phase-roadmap',               ctrl.getBillingPhaseRoadmap);
router.post('/audit',                      canAccessPOS3, ctrl.writeBillingAudit);

export default router;
