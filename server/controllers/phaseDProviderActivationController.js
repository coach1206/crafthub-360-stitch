// Phase D.1 — Provider Activation Controller
// contains_secrets: false, stores_secrets: false — no secrets accepted or stored

import * as svc from '../services/phaseD/phaseDProviderActivationService.js';

const ok500    = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorId  = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey     = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const getDefault                       = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getDefaultPhaseDRoadmap() }));
export const getDefaultCategories             = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getDefaultProviderCategories() }));
export const getDefaultCandidates             = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getDefaultProviderCandidates() }));
export const getDefaultOrder                  = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getDefaultActivationOrder() }));
export const getDefaultMatrix                 = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getDefaultProviderReadinessMatrix() }));
export const getSafeClaims                    = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getSafePhaseDActivationClaims() }));
export const getUnsafeClaims                  = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getUnsafePhaseDActivationClaims() }));
export const getHonestLimitations             = (req, res) => ok500(res, async () => res.json({ ok: true, data: svc.getPhaseDHonestLimitations() }));

export const createRoadmap                    = (req, res) => ok500(res, async () => res.json(await svc.createProviderActivationRoadmap({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listRoadmaps                     = (req, res) => ok500(res, async () => res.json(await svc.listProviderActivationRoadmaps({ filters: req.query })));
export const updateRoadmapStatus              = (req, res) => ok500(res, async () => res.json(await svc.updateProviderActivationRoadmapStatus({ roadmapId: req.params.roadmapId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createCategory                   = (req, res) => ok500(res, async () => res.json(await svc.createProviderCategory({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listCategories                   = (req, res) => ok500(res, async () => res.json(await svc.listProviderCategories({ filters: req.query })));

export const createCandidate                  = (req, res) => ok500(res, async () => res.json(await svc.createProviderCandidate({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listCandidates                   = (req, res) => ok500(res, async () => res.json(await svc.listProviderCandidates({ filters: req.query })));
export const updateCandidateStatus            = (req, res) => ok500(res, async () => res.json(await svc.updateProviderCandidateStatus({ providerCandidateId: req.params.providerCandidateId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createActivationOrder            = (req, res) => ok500(res, async () => res.json(await svc.createProviderActivationOrder({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listActivationOrder              = (req, res) => ok500(res, async () => res.json(await svc.listProviderActivationOrder({ filters: req.query })));

export const createDependency                 = (req, res) => ok500(res, async () => res.json(await svc.createProviderDependency({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listDependencies                 = (req, res) => ok500(res, async () => res.json(await svc.listProviderDependencies({ filters: req.query })));

export const createCredentialPlaceholder      = (req, res) => ok500(res, async () => res.json(await svc.createCredentialPlaceholder({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listCredentialPlaceholders       = (req, res) => ok500(res, async () => res.json(await svc.listCredentialPlaceholders({ filters: req.query })));
export const updateCredentialStatus           = (req, res) => ok500(res, async () => res.json(await svc.updateCredentialStatus({ credentialPlaceholderId: req.params.credentialPlaceholderId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createPrerequisite               = (req, res) => ok500(res, async () => res.json(await svc.createProviderPrerequisite({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listPrerequisites                = (req, res) => ok500(res, async () => res.json(await svc.listProviderPrerequisites({ filters: req.query })));

export const createBlocker                    = (req, res) => ok500(res, async () => res.json(await svc.createProviderBlocker({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listBlockers                     = (req, res) => ok500(res, async () => res.json(await svc.listProviderBlockers({ filters: req.query })));
export const updateBlockerStatus              = (req, res) => ok500(res, async () => res.json(await svc.updateProviderBlockerStatus({ blockerId: req.params.blockerId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createLegalRequirement           = (req, res) => ok500(res, async () => res.json(await svc.createLegalRequirement({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listLegalRequirements            = (req, res) => ok500(res, async () => res.json(await svc.listLegalRequirements({ filters: req.query })));

export const createBillingRequirement         = (req, res) => ok500(res, async () => res.json(await svc.createBillingRequirement({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listBillingRequirements          = (req, res) => ok500(res, async () => res.json(await svc.listBillingRequirements({ filters: req.query })));

export const createSecurityRequirement        = (req, res) => ok500(res, async () => res.json(await svc.createSecurityRequirement({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listSecurityRequirements         = (req, res) => ok500(res, async () => res.json(await svc.listSecurityRequirements({ filters: req.query })));

export const createActivationStatus           = (req, res) => ok500(res, async () => res.json(await svc.createProviderActivationStatus({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listActivationStatuses           = (req, res) => ok500(res, async () => res.json(await svc.listProviderActivationStatuses({ filters: req.query })));
export const updateActivationStatus           = (req, res) => ok500(res, async () => res.json(await svc.updateProviderActivationStatus({ activationStatusId: req.params.activationStatusId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createTestStatus                 = (req, res) => ok500(res, async () => res.json(await svc.createProviderTestStatus({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listTestStatuses                 = (req, res) => ok500(res, async () => res.json(await svc.listProviderTestStatuses({ filters: req.query })));
export const updateTestStatus                 = (req, res) => ok500(res, async () => res.json(await svc.updateProviderTestStatus({ testStatusId: req.params.testStatusId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createVerificationStatus         = (req, res) => ok500(res, async () => res.json(await svc.createProviderVerificationStatus({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listVerificationStatuses         = (req, res) => ok500(res, async () => res.json(await svc.listProviderVerificationStatuses({ filters: req.query })));
export const updateVerificationStatus         = (req, res) => ok500(res, async () => res.json(await svc.updateProviderVerificationStatus({ verificationStatusId: req.params.verificationStatusId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createRollbackRecord             = (req, res) => ok500(res, async () => res.json(await svc.createProviderRollbackRecord({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listRollbackRecords              = (req, res) => ok500(res, async () => res.json(await svc.listProviderRollbackRecords({ filters: req.query })));
export const updateRollbackStatus             = (req, res) => ok500(res, async () => res.json(await svc.updateProviderRollbackStatus({ rollbackId: req.params.rollbackId, status: req.body.status, actorUserId: actorId(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createFailureRecord              = (req, res) => ok500(res, async () => res.json(await svc.createProviderFailureRecord({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listFailureRecords               = (req, res) => ok500(res, async () => res.json(await svc.listProviderFailureRecords({ filters: req.query })));

export const createMatrixRecord               = (req, res) => ok500(res, async () => res.json(await svc.createProviderReadinessMatrixRecord({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listMatrix                       = (req, res) => ok500(res, async () => res.json(await svc.listProviderReadinessMatrix({ filters: req.query })));

export const createSafeClaimRecord            = (req, res) => ok500(res, async () => res.json(await svc.createSafeActivationClaim({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listSafeClaimRecords             = (req, res) => ok500(res, async () => res.json(await svc.listSafeActivationClaims({ filters: req.query })));

export const createUnsafeClaimRecord          = (req, res) => ok500(res, async () => res.json(await svc.createUnsafeActivationClaim({ payload: req.body, actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const listUnsafeClaimRecords           = (req, res) => ok500(res, async () => res.json(await svc.listUnsafeActivationClaims({ filters: req.query })));

export const createSnapshot                   = (req, res) => ok500(res, async () => res.json(await svc.createProviderActivationSnapshot({ actorUserId: actorId(req), idempotencyKey: ikey(req) })));
export const getLatestSnapshot                = (req, res) => ok500(res, async () => res.json(await svc.getLatestProviderActivationSnapshot()));
