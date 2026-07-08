// Phase E.5 — NOVEE OS Live Pilot Readiness Controller
import * as svc from '../services/noveeOS/noveeOSLivePilotReadinessService.js'
import { assertNoFakePilotApprovalClaims, assertNoFakeGoLiveClaims, assertNoFakeRemoteDistributionClaims, assertNoExposedPilotSecrets, validatePilotVenuePayload, validatePilotGatePayload, validateModuleReadinessPayload, validatePilotChecklistPayload, validatePilotEvidencePayload, validateAcceptancePayload } from '../services/noveeOS/noveeOSLivePilotReadinessContracts.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success: true,
  data,
  safeClaim: 'live_pilot_readiness_center_exists',
  productionReady: false,
  pilotReady: false,
  remoteDistributionReady: false,
  blockers: [],
  timestamp: new Date().toISOString(),
})

export async function listPilotVenues(req, res) { ok500(res, async () => { const d = await svc.listPilotVenues(tenantId(req)); wrap(res, d) }) }
export async function getPilotVenue(req, res) { ok500(res, async () => { const d = await svc.getPilotVenue(req.params.venueId); wrap(res, d) }) }
export async function createPilotVenuePreview(req, res) {
  ok500(res, async () => {
    validatePilotVenuePayload(req.body)
    const d = await svc.createPilotVenuePreview(req.body, actorId(req))
    wrap(res, d)
  })
}

export async function listPilotReadinessGates(req, res) { ok500(res, async () => { const d = await svc.listPilotReadinessGates(tenantId(req)); wrap(res, d) }) }
export async function getPilotReadinessGate(req, res) { ok500(res, async () => { const d = await svc.getPilotReadinessGate(req.params.gateKey); wrap(res, d) }) }
export async function updatePilotReadinessGatePreview(req, res) {
  ok500(res, async () => {
    validatePilotGatePayload({ gate_key: req.params.gateKey, gate_label: req.body.gate_label || req.params.gateKey, ...req.body })
    const d = await svc.updatePilotReadinessGatePreview(req.params.gateKey, req.body, actorId(req))
    wrap(res, d)
  })
}

export async function listModuleReadiness(req, res) { ok500(res, async () => { const d = await svc.listModuleReadiness(tenantId(req)); wrap(res, d) }) }
export async function getModuleReadiness(req, res) { ok500(res, async () => { const d = await svc.getModuleReadiness(req.params.moduleKey); wrap(res, d) }) }
export async function updateModuleReadinessPreview(req, res) {
  ok500(res, async () => {
    validateModuleReadinessPayload({ module_key: req.params.moduleKey, module_label: req.body.module_label || req.params.moduleKey, ...req.body })
    const d = await svc.updateModuleReadinessPreview(req.params.moduleKey, req.body, actorId(req))
    wrap(res, d)
  })
}

export async function listPilotChecklist(req, res) { ok500(res, async () => { const d = await svc.listPilotChecklist(tenantId(req)); wrap(res, d) }) }
export async function updatePilotChecklistItem(req, res) {
  ok500(res, async () => {
    validatePilotChecklistPayload({ checklist_key: req.params.checklistKey, checklist_label: req.body.checklist_label || req.params.checklistKey, ...req.body })
    const d = await svc.updatePilotChecklistItem(req.params.checklistKey, req.body, actorId(req))
    wrap(res, d)
  })
}

export async function listPilotEvidence(req, res) { ok500(res, async () => { const d = await svc.listPilotEvidence(tenantId(req)); wrap(res, d) }) }
export async function submitPilotEvidencePreview(req, res) {
  ok500(res, async () => {
    validatePilotEvidencePayload(req.body)
    const d = await svc.submitPilotEvidencePreview(req.body, actorId(req), ikey(req))
    wrap(res, d)
  })
}

export async function listPilotAuditLog(req, res) { ok500(res, async () => { const d = await svc.listPilotAuditLog(tenantId(req)); wrap(res, d) }) }
export async function logPilotAuditEvent(req, res) {
  ok500(res, async () => {
    const d = await svc.logPilotAuditEvent(req.body, actorId(req), ikey(req))
    wrap(res, d)
  })
}

export async function listAcceptanceRegistry(req, res) { ok500(res, async () => { const d = await svc.listAcceptanceRegistry(tenantId(req)); wrap(res, d) }) }
export async function createAcceptancePreview(req, res) {
  ok500(res, async () => {
    validateAcceptancePayload(req.body)
    const d = await svc.createAcceptancePreview(req.body, actorId(req), ikey(req))
    wrap(res, d)
  })
}

export async function getPilotReadinessScore(req, res) { ok500(res, async () => { const d = await svc.getPilotReadinessScore(); wrap(res, d) }) }
export async function getPilotBlockers(req, res) { ok500(res, async () => { const d = await svc.getPilotBlockers(); wrap(res, d) }) }
export async function getSafePilotClaims(req, res) { ok500(res, async () => { const d = await svc.getSafePilotClaims(); wrap(res, d) }) }
export async function getPilotFeatureFlagSnapshot(req, res) { ok500(res, async () => { const d = await svc.getPilotFeatureFlagSnapshot(); wrap(res, d) }) }
export async function validateLivePilotReadiness(req, res) { ok500(res, async () => { const d = await svc.validateLivePilotReadiness(); wrap(res, d) }) }
