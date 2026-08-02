/**
 * Compliance Routes — /api/compliance/*  (Production Package 6)
 *
 * Public/customer-facing: age verification submission, purchase eligibility
 * check, fulfillment eligibility check, policy read/accept, consent
 * read/set/withdraw, data-rights request submission + self-service
 * export/deletion (identity-scoped, enforced in the controller).
 *
 * Admin/staff (RBAC via requireManager/requireAdmin, reusing Package 2-5
 * patterns): jurisdiction config, retention config, staff acknowledgements,
 * media-rights review, accessibility issue tracking, audit trail, and
 * data-rights request administration (identity verification for a
 * requester who cannot self-serve, staff-assisted export/deletion).
 */
import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin, auditAction } from '../middleware/roleMiddleware.js'
import * as c from '../controllers/complianceController.js'

const router = Router()

// ── Jurisdictions ──────────────────────────────────────────────
router.get('/jurisdictions', c.listJurisdictions)
router.patch('/jurisdictions/:code', requireAuth, requireAdmin, auditAction('COMPLIANCE', 'jurisdiction.updated', 'post'), c.updateJurisdiction)

// ── Age verification / purchase / fulfillment eligibility (server-authoritative) ──
// optionalAuth: self-attestation stays available to anonymous guests, but
// staff_verified / in_person_fulfillment methods require req.user to be
// populated (enforced in the controller) so a staff actor id is recorded.
router.post('/age-verification', optionalAuth, c.submitAgeVerification)
router.get('/purchase-eligibility', c.checkPurchaseEligibility)
router.get('/fulfillment-eligibility', c.checkFulfillmentEligibility)

// ── Policies ──────────────────────────────────────────────────
router.get('/policies', c.listPolicyVersions)
router.post('/policies/accept', c.acceptPolicy)

// ── Consent ───────────────────────────────────────────────────
router.get('/consent', c.getCurrentConsent)
router.post('/consent', c.setConsent)
router.post('/consent/withdraw', c.withdrawConsent)

// ── Data-rights requests ─────────────────────────────────────
router.post('/data-rights/requests', c.submitDataRightsRequest)
router.get('/data-rights/requests', requireAuth, requireManager, c.listDataRightsRequests)
router.post('/data-rights/requests/:requestId/verify-identity', requireAuth, c.verifyRequestIdentity)
router.post('/data-rights/requests/:requestId/export', requireAuth, auditAction('COMPLIANCE', 'data_rights.export', 'post'), c.generateExport)
router.post('/data-rights/requests/:requestId/preview-deletion', requireAuth, c.previewDeletion)
router.post('/data-rights/requests/:requestId/commit-deletion', requireAuth, auditAction('COMPLIANCE', 'data_rights.deletion', 'post'), c.commitDeletion)

// ── Retention config (admin read) ─────────────────────────────
router.get('/retention-policies', requireAuth, requireManager, c.listRetentionPolicies)

// ── Staff acknowledgements ────────────────────────────────────
router.post('/staff-acknowledgements', requireAuth, c.acknowledgePolicy)
router.get('/staff-acknowledgements', requireAuth, requireManager, c.listStaffAcknowledgements)

// ── Media rights review ───────────────────────────────────────
router.get('/media-rights', requireAuth, requireManager, c.listMediaRightsReview)
router.post('/media-rights/takedown', requireAuth, requireManager, auditAction('COMPLIANCE', 'media_rights.takedown_requested', 'post'), c.requestTakedown)

// ── Accessibility issue tracking ──────────────────────────────
router.get('/accessibility-issues', requireAuth, requireManager, c.listAccessibilityIssues)
router.post('/accessibility-issues', requireAuth, requireManager, c.createAccessibilityIssue)
router.post('/accessibility-issues/:issueId/resolve', requireAuth, requireAdmin, c.resolveAccessibilityIssue)

// ── Audit trail (admin read) ──────────────────────────────────
router.get('/audit-events', requireAuth, requireAdmin, c.listAuditEvents)

export default router
