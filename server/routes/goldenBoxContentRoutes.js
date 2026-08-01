/**
 * Package 3 — SmokeCraft educational content API. Mounted at
 * /api/smokecraft/golden-box/content in server/index.js. Learner reads
 * are public (published-only); management writes require admin.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole, auditAction } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/goldenBoxContentController.js'

const router = Router()
// SC-D068b (Final Gameplay Acceptance pass): unlike every sibling Golden
// Box router (e.g. goldenBoxRoutes.js's own readLimiter/writeLimiter),
// these two limiters had no `skip: () => !IS_PROD` dev/test exemption —
// a real, narrow, pre-existing inconsistency that surfaced as genuine
// 429 console errors on the Golden Box results/competitions screens
// during this pass's automated investor-demo walk (multiple content
// reads within one minute from one browser). Brought in line with the
// rest of this route family; production behavior is unchanged.
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

// ── Learner reads (public, published-only) ──────────────────────────
router.get('/components', readLimiter, ctrl.handleListComponents)
router.get('/components/:id', readLimiter, ctrl.handleGetComponent)
router.get('/flavor-notes', readLimiter, ctrl.handleListFlavorNotes)

// ── Content management (admin only) ─────────────────────────────────
router.post('/components', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'content_draft_created', 'post'), ctrl.handleCreateDraft)

router.patch('/components/:id', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'content_draft_updated', 'post'), ctrl.handleUpdateDraft)

router.post('/components/:id/publish', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'content_published', 'post'), ctrl.handlePublish)

router.post('/components/:id/archive', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'content_archived', 'post'), ctrl.handleArchive)

export default router
