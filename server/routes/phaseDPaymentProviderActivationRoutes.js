// platformAdminGuardRequired = true on all write routes
// contains_secrets: false, stores_secrets: false

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/phaseDPaymentProviderActivationController.js';

const router = Router();

// Provider Registry
router.get('/providers',                         ctrl.listPaymentProviders);
router.get('/providers/:providerKey',            ctrl.getPaymentProvider);
router.post('/providers',                        canAccessPOS3, ctrl.registerPaymentProvider);
router.patch('/providers/:providerKey/status',   canAccessPOS3, ctrl.updatePaymentProviderStatus);

// Credential Status
router.get('/credentials',                       ctrl.listCredentialStatuses);
router.get('/credentials/:providerKey',          ctrl.getCredentialStatus);
router.post('/credentials',                      canAccessPOS3, ctrl.updateCredentialStatus);

// Environment Locks
router.get('/environment-locks',                 ctrl.listEnvironmentLocks);
router.get('/environment-locks/:providerKey',    ctrl.getEnvironmentLock);
router.post('/environment-locks',                canAccessPOS3, ctrl.updateEnvironmentLock);

// Live Mode Requests
router.get('/live-mode-requests',                ctrl.listLiveModeRequests);
router.post('/live-mode-requests',               canAccessPOS3, ctrl.submitLiveModeRequest);
router.patch('/live-mode-requests/:requestId/approve', canAccessPOS3, ctrl.approveLiveModeRequest);

// Compliance
router.get('/compliance',                        ctrl.listComplianceChecks);
router.post('/compliance',                       canAccessPOS3, ctrl.createComplianceCheck);

// Audit
router.get('/audit',                             ctrl.listPaymentProviderAudit);
router.post('/audit',                            canAccessPOS3, ctrl.writePaymentProviderAudit);

// Stripe
router.get('/stripe/status',                     ctrl.getStripeActivationStatus);
router.post('/stripe/config',                    canAccessPOS3, ctrl.updateStripeConfig);

// Square
router.get('/square/status',                     ctrl.getSquareActivationStatus);
router.post('/square/config',                    canAccessPOS3, ctrl.updateSquareConfig);

// Manual Invoice
router.get('/manual-invoice/config',             ctrl.getManualInvoiceConfig);
router.post('/manual-invoice/config',            canAccessPOS3, ctrl.updateManualInvoiceConfig);

// Cash / Offline
router.get('/cash-offline/config',               ctrl.getCashOfflineConfig);
router.post('/cash-offline/config',              canAccessPOS3, ctrl.updateCashOfflineConfig);

// Safety Status
router.get('/safety-status',                     ctrl.getPaymentSafetyStatus);

// PCI Scope
router.get('/pci-scope',                         ctrl.listPciScopeItems);
router.post('/pci-scope',                        canAccessPOS3, ctrl.createPciScopeItem);

// Webhooks
router.get('/webhooks',                          ctrl.listWebhookEndpoints);
router.post('/webhooks',                         canAccessPOS3, ctrl.registerWebhookEndpoint);

// Refund Rules
router.get('/refund-rules',                      ctrl.listRefundRules);
router.post('/refund-rules',                     canAccessPOS3, ctrl.createRefundRule);

export default router;
