/**
 * NOVEE OS — Security Activation Controller (Phase D.6 / Phase E.3)
 * contains_secrets: false
 */

import * as svc from '../services/noveeOS/noveeOSSecurityActivationService.js'

const ok500    = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId  = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey     = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success:        data.ok !== false,
  data:           data.data || data,
  safeClaim:      'security_activation_center_exists',
  productionReady: false,
  blockers:       data.blockers || [],
  timestamp:      new Date().toISOString(),
})

export const getSummary             = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityActivationSummary(tenantId(req))))
export const listProviders          = (req, res) => ok500(res, async () => wrap(res, await svc.listSecurityProviders(tenantId(req))))
export const getProvider            = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityProvider(req.params.providerId)))
export const createProvider         = (req, res) => ok500(res, async () => wrap(res, await svc.createSecurityProviderPreview(req.body, actorId(req), ikey(req))))
export const updateProviderStatus   = (req, res) => ok500(res, async () => wrap(res, await svc.updateSecurityProviderStatusPreview(req.params.providerId, req.body, actorId(req))))
export const listGates              = (req, res) => ok500(res, async () => wrap(res, await svc.listSecurityActivationGates(tenantId(req))))
export const getGate                = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityActivationGate(req.params.gateId)))
export const updateGate             = (req, res) => ok500(res, async () => wrap(res, await svc.updateSecurityActivationGatePreview(req.params.gateId, req.body, actorId(req))))
export const listRisks              = (req, res) => ok500(res, async () => wrap(res, await svc.listSecurityRisks(tenantId(req))))
export const createRisk             = (req, res) => ok500(res, async () => wrap(res, await svc.createSecurityRiskPreview(req.body, actorId(req), ikey(req))))
export const updateRiskStatus       = (req, res) => ok500(res, async () => wrap(res, await svc.updateSecurityRiskStatusPreview(req.params.riskId, req.body, actorId(req))))
export const listEvidence           = (req, res) => ok500(res, async () => wrap(res, await svc.listSecurityEvidence(tenantId(req))))
export const createEvidence         = (req, res) => ok500(res, async () => wrap(res, await svc.createSecurityEvidencePreview(req.body, actorId(req), ikey(req))))
export const getReadinessScore      = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityReadinessScore(tenantId(req))))
export const getBlockers            = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityBlockers(tenantId(req))))
export const getRemoteDistGate      = (req, res) => ok500(res, async () => wrap(res, await svc.getRemoteDistributionSecurityGate(tenantId(req))))
export const getSafeClaims          = (req, res) => ok500(res, async () => wrap(res, await svc.getSafeSecurityClaims()))
export const getAuditLog            = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityAuditLog(tenantId(req), parseInt(req.query.limit) || 50)))
export const getFeatureFlags        = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityFeatureFlagSnapshot()))
export const validateReadiness      = (req, res) => ok500(res, async () => wrap(res, await svc.validateSecurityActivationReadiness(tenantId(req))))
