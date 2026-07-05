// contains_secrets: false, stores_secrets: false

import * as svc from '../services/phaseD/phaseDPaymentProviderActivationService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const listPaymentProviders               = (req, res) => ok500(res, async () => res.json(await svc.listPaymentProviders()));
export const getPaymentProvider                 = (req, res) => ok500(res, async () => res.json(await svc.getPaymentProvider(req.params.providerKey)));
export const registerPaymentProvider            = (req, res) => ok500(res, async () => res.json(await svc.registerPaymentProvider(req.body, actorId(req), ikey(req))));
export const updatePaymentProviderStatus        = (req, res) => ok500(res, async () => res.json(await svc.updatePaymentProviderStatus(req.params.providerKey, req.body.status, actorId(req))));

export const listCredentialStatuses             = (req, res) => ok500(res, async () => res.json(await svc.listCredentialStatuses()));
export const getCredentialStatus                = (req, res) => ok500(res, async () => res.json(await svc.getCredentialStatus(req.params.providerKey)));
export const updateCredentialStatus             = (req, res) => ok500(res, async () => res.json(await svc.updateCredentialStatus(req.body, actorId(req), ikey(req))));

export const listEnvironmentLocks               = (req, res) => ok500(res, async () => res.json(await svc.listEnvironmentLocks()));
export const getEnvironmentLock                 = (req, res) => ok500(res, async () => res.json(await svc.getEnvironmentLock(req.params.providerKey)));
export const updateEnvironmentLock              = (req, res) => ok500(res, async () => res.json(await svc.updateEnvironmentLock(req.body, actorId(req), ikey(req))));

export const listLiveModeRequests               = (req, res) => ok500(res, async () => res.json(await svc.listLiveModeRequests()));
export const submitLiveModeRequest              = (req, res) => ok500(res, async () => res.json(await svc.submitLiveModeRequest(req.body, actorId(req), ikey(req))));
export const approveLiveModeRequest             = (req, res) => ok500(res, async () => res.json(await svc.approveLiveModeRequest(req.params.requestId, actorId(req))));

export const listComplianceChecks               = (req, res) => ok500(res, async () => res.json(await svc.listComplianceChecks()));
export const createComplianceCheck              = (req, res) => ok500(res, async () => res.json(await svc.createComplianceCheck(req.body, actorId(req), ikey(req))));

export const writePaymentProviderAudit          = (req, res) => ok500(res, async () => res.json(await svc.writePaymentProviderAudit(req.body, actorId(req), ikey(req))));
export const listPaymentProviderAudit           = (req, res) => ok500(res, async () => res.json(await svc.listPaymentProviderAudit(req.query)));

export const getStripeActivationStatus          = (req, res) => ok500(res, async () => res.json(await svc.getStripeActivationStatus()));
export const updateStripeConfig                 = (req, res) => ok500(res, async () => res.json(await svc.updateStripeConfig(req.body, actorId(req), ikey(req))));

export const getSquareActivationStatus          = (req, res) => ok500(res, async () => res.json(await svc.getSquareActivationStatus()));
export const updateSquareConfig                 = (req, res) => ok500(res, async () => res.json(await svc.updateSquareConfig(req.body, actorId(req), ikey(req))));

export const getManualInvoiceConfig             = (req, res) => ok500(res, async () => res.json(await svc.getManualInvoiceConfig()));
export const updateManualInvoiceConfig          = (req, res) => ok500(res, async () => res.json(await svc.updateManualInvoiceConfig(req.body, actorId(req), ikey(req))));

export const getCashOfflineConfig               = (req, res) => ok500(res, async () => res.json(await svc.getCashOfflineConfig()));
export const updateCashOfflineConfig            = (req, res) => ok500(res, async () => res.json(await svc.updateCashOfflineConfig(req.body, actorId(req), ikey(req))));

export const getPaymentSafetyStatus             = (req, res) => ok500(res, async () => res.json(await svc.getPaymentSafetyStatus()));

export const listPciScopeItems                  = (req, res) => ok500(res, async () => res.json(await svc.listPciScopeItems()));
export const createPciScopeItem                 = (req, res) => ok500(res, async () => res.json(await svc.createPciScopeItem(req.body, actorId(req), ikey(req))));

export const listWebhookEndpoints               = (req, res) => ok500(res, async () => res.json(await svc.listWebhookEndpoints()));
export const registerWebhookEndpoint            = (req, res) => ok500(res, async () => res.json(await svc.registerWebhookEndpoint(req.body, actorId(req), ikey(req))));

export const listRefundRules                    = (req, res) => ok500(res, async () => res.json(await svc.listRefundRules()));
export const createRefundRule                   = (req, res) => ok500(res, async () => res.json(await svc.createRefundRule(req.body, actorId(req), ikey(req))));
