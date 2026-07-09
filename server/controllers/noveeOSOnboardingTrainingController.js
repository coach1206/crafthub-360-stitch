import * as svc from '../services/noveeOS/noveeOSOnboardingTrainingService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success: true,
  data,
  safeClaim: 'onboarding_training_center_exists',
  published: false,
  trainingReady: false,
  onboardingReady: false,
  remoteDistributionReady: false,
  blockers: [],
  timestamp: new Date().toISOString(),
})

export const getSummary = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingTrainingSummary({ tenantId: tenantId(req) })))

export const listPrograms = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listOnboardingPrograms({ tenantId: tenantId(req) })))

export const getProgram = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingProgram(req.params.programId, { tenantId: tenantId(req) })))

export const createProgramPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createOnboardingProgramPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateProgramStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateOnboardingProgramStatusPreview(req.params.programId, req.body, { actorId: actorId(req) })))

export const listManuals = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listTrainingManuals({ tenantId: tenantId(req) })))

export const getManual = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getTrainingManual(req.params.manualId, { tenantId: tenantId(req) })))

export const createManualPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createTrainingManualPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateManualStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateTrainingManualStatusPreview(req.params.manualId, req.body, { actorId: actorId(req) })))

export const listLessons = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listTrainingLessons({ tenantId: tenantId(req) })))

export const getLesson = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getTrainingLesson(req.params.lessonId, { tenantId: tenantId(req) })))

export const createLessonPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createTrainingLessonPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateLessonStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateTrainingLessonStatusPreview(req.params.lessonId, req.body, { actorId: actorId(req) })))

export const listChecklist = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listOnboardingChecklist({ tenantId: tenantId(req) })))

export const getChecklistItem = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingChecklistItem(req.params.checklistItemId, { tenantId: tenantId(req) })))

export const updateChecklistItemPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateOnboardingChecklistItemPreview(req.params.checklistItemId, req.body, { actorId: actorId(req) })))

export const listProgress = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listTrainingProgress({ tenantId: tenantId(req) })))

export const getProgress = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getTrainingProgress(req.params.progressId, { tenantId: tenantId(req) })))

export const updateProgressPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateTrainingProgressPreview(req.params.progressId, req.body, { actorId: actorId(req) })))

export const listEvidence = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listTrainingEvidence({ tenantId: tenantId(req) })))

export const createEvidencePreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createTrainingEvidencePreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const listAcceptance = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listOnboardingAcceptanceRecords({ tenantId: tenantId(req) })))

export const createAcceptancePreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createOnboardingAcceptancePreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const getReadinessScore = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingReadinessScore({ tenantId: tenantId(req) })))

export const getBlockers = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingBlockers({ tenantId: tenantId(req) })))

export const getRemoteDistributionGate = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getRemoteDistributionTrainingGate({ tenantId: tenantId(req) })))

export const getSafeClaims = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getSafeOnboardingClaims()))

export const getAuditLog = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingAuditLog({ tenantId: tenantId(req), limit: parseInt(req.query.limit) || 50 })))

export const getFeatureFlags = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getOnboardingFeatureFlagSnapshot()))

export const validateReadiness = (req, res) =>
  ok500(res, async () => wrap(res, await svc.validateOnboardingTrainingReadiness({ tenantId: tenantId(req) })))
