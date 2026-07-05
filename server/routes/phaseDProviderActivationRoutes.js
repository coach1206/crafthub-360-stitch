// Phase D.1 — Provider Activation Routes
// platformAdminGuardRequired = true on all write routes
// No route accepts or stores secrets.
// No route fakes provider activation, credentials, payments, billing, POS sync,
// inventory sync, notification delivery, security provider, deployment, marketplace, or live mode.

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/phaseDProviderActivationController.js';

const router = Router();

// ─── Default / read-only data ────────────────────────────────────────────────
router.get('/default',                                       ctrl.getDefault);
router.get('/default/categories',                            ctrl.getDefaultCategories);
router.get('/default/candidates',                            ctrl.getDefaultCandidates);
router.get('/default/order',                                 ctrl.getDefaultOrder);
router.get('/default/matrix',                                ctrl.getDefaultMatrix);
router.get('/claims/safe',                                   ctrl.getSafeClaims);
router.get('/claims/unsafe',                                 ctrl.getUnsafeClaims);
router.get('/claims/honest-limitations',                     ctrl.getHonestLimitations);

// ─── Roadmaps ─────────────────────────────────────────────────────────────────
router.post('/roadmaps',                                     canAccessPOS3, ctrl.createRoadmap);
router.get('/roadmaps',                                      ctrl.listRoadmaps);
router.patch('/roadmaps/:roadmapId/status',                  canAccessPOS3, ctrl.updateRoadmapStatus);

// ─── Categories ───────────────────────────────────────────────────────────────
router.post('/categories',                                   canAccessPOS3, ctrl.createCategory);
router.get('/categories',                                    ctrl.listCategories);

// ─── Candidates ───────────────────────────────────────────────────────────────
router.post('/candidates',                                   canAccessPOS3, ctrl.createCandidate);
router.get('/candidates',                                    ctrl.listCandidates);
router.patch('/candidates/:providerCandidateId/status',      canAccessPOS3, ctrl.updateCandidateStatus);

// ─── Activation order ─────────────────────────────────────────────────────────
router.post('/activation-order',                             canAccessPOS3, ctrl.createActivationOrder);
router.get('/activation-order',                              ctrl.listActivationOrder);

// ─── Dependencies ─────────────────────────────────────────────────────────────
router.post('/dependencies',                                 canAccessPOS3, ctrl.createDependency);
router.get('/dependencies',                                  ctrl.listDependencies);

// ─── Credential placeholders ──────────────────────────────────────────────────
router.post('/credential-placeholders',                      canAccessPOS3, ctrl.createCredentialPlaceholder);
router.get('/credential-placeholders',                       ctrl.listCredentialPlaceholders);
router.patch('/credential-placeholders/:credentialPlaceholderId/status', canAccessPOS3, ctrl.updateCredentialStatus);

// ─── Prerequisites ────────────────────────────────────────────────────────────
router.post('/prerequisites',                                canAccessPOS3, ctrl.createPrerequisite);
router.get('/prerequisites',                                 ctrl.listPrerequisites);

// ─── Blockers ─────────────────────────────────────────────────────────────────
router.post('/blockers',                                     canAccessPOS3, ctrl.createBlocker);
router.get('/blockers',                                      ctrl.listBlockers);
router.patch('/blockers/:blockerId/status',                  canAccessPOS3, ctrl.updateBlockerStatus);

// ─── Requirements ─────────────────────────────────────────────────────────────
router.post('/requirements/legal',                           canAccessPOS3, ctrl.createLegalRequirement);
router.get('/requirements/legal',                            ctrl.listLegalRequirements);
router.post('/requirements/billing',                         canAccessPOS3, ctrl.createBillingRequirement);
router.get('/requirements/billing',                          ctrl.listBillingRequirements);
router.post('/requirements/security',                        canAccessPOS3, ctrl.createSecurityRequirement);
router.get('/requirements/security',                         ctrl.listSecurityRequirements);

// ─── Activation statuses ──────────────────────────────────────────────────────
router.post('/activation-statuses',                          canAccessPOS3, ctrl.createActivationStatus);
router.get('/activation-statuses',                           ctrl.listActivationStatuses);
router.patch('/activation-statuses/:activationStatusId/status', canAccessPOS3, ctrl.updateActivationStatus);

// ─── Test statuses ────────────────────────────────────────────────────────────
router.post('/test-statuses',                                canAccessPOS3, ctrl.createTestStatus);
router.get('/test-statuses',                                 ctrl.listTestStatuses);
router.patch('/test-statuses/:testStatusId/status',          canAccessPOS3, ctrl.updateTestStatus);

// ─── Verification statuses ────────────────────────────────────────────────────
router.post('/verification-statuses',                        canAccessPOS3, ctrl.createVerificationStatus);
router.get('/verification-statuses',                         ctrl.listVerificationStatuses);
router.patch('/verification-statuses/:verificationStatusId/status', canAccessPOS3, ctrl.updateVerificationStatus);

// ─── Rollback / failure ───────────────────────────────────────────────────────
router.post('/rollback-records',                             canAccessPOS3, ctrl.createRollbackRecord);
router.get('/rollback-records',                              ctrl.listRollbackRecords);
router.patch('/rollback-records/:rollbackId/status',         canAccessPOS3, ctrl.updateRollbackStatus);
router.post('/failure-records',                              canAccessPOS3, ctrl.createFailureRecord);
router.get('/failure-records',                               ctrl.listFailureRecords);

// ─── Matrix ───────────────────────────────────────────────────────────────────
router.post('/matrix',                                       canAccessPOS3, ctrl.createMatrixRecord);
router.get('/matrix',                                        ctrl.listMatrix);

// ─── Claims ───────────────────────────────────────────────────────────────────
router.post('/claims/safe-records',                          canAccessPOS3, ctrl.createSafeClaimRecord);
router.get('/claims/safe-records',                           ctrl.listSafeClaimRecords);
router.post('/claims/unsafe-records',                        canAccessPOS3, ctrl.createUnsafeClaimRecord);
router.get('/claims/unsafe-records',                         ctrl.listUnsafeClaimRecords);

// ─── Snapshots ────────────────────────────────────────────────────────────────
router.post('/snapshots',                                    canAccessPOS3, ctrl.createSnapshot);
router.get('/snapshots/latest',                              ctrl.getLatestSnapshot);

export default router;
