/**
 * Access Requests Routes — /api/access-requests/*
 *
 * Public:
 *   POST /api/access-requests — submit a request (no auth needed)
 *
 * Protected (admin+):
 *   GET  /api/access-requests         — list requests
 *   POST /api/access-requests/:id/approve
 *   POST /api/access-requests/:id/deny
 */

import { Router }        from 'express'
import { requireAuth }   from '../middleware/authMiddleware.js'
import { requireAdmin }  from '../middleware/roleMiddleware.js'
import {
  auditAction,
  preventSelfPromotion,
} from '../middleware/roleMiddleware.js'
import * as ar from '../controllers/accessRequestsController.js'

const router = Router()

// Public — anyone can submit a request
router.post('/',
  ar.submitAccessRequest
)

// Admin+ — manage requests
router.get('/',
  requireAuth,
  requireAdmin,
  ar.getAccessRequests
)

router.post('/:requestId/approve',
  requireAuth,
  requireAdmin,
  auditAction('ADMIN', 'access_request.approved', 'post'),
  ar.approveAccessRequest
)

router.post('/:requestId/deny',
  requireAuth,
  requireAdmin,
  auditAction('ADMIN', 'access_request.denied', 'post'),
  ar.denyAccessRequest
)

export default router
