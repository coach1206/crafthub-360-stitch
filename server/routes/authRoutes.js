/**
 * Auth Routes — /api/auth/*
 *
 * Public (no auth required):
 *   POST /api/auth/staff-pin-login
 *   POST /api/auth/admin-login
 *   POST /api/auth/founder-login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *
 * Protected:
 *   POST /api/auth/refresh          — requires active session
 *   POST /api/auth/revoke-session   — admin+ only
 */

import { Router } from 'express'
import { requireAuth }   from '../middleware/authMiddleware.js'
import { requireAdmin }  from '../middleware/roleMiddleware.js'
import * as auth from '../controllers/authController.js'

const router = Router()

// ── Public endpoints ──────────────────────────────────────────
router.post('/staff-pin-login', auth.staffPinLogin)
router.post('/admin-login',     auth.adminLogin)
router.post('/founder-login',   auth.founderLogin)
router.post('/logout',          requireAuth, auth.logout)
router.get('/me',               requireAuth, auth.getMe)

// ── Session management ────────────────────────────────────────
router.post('/refresh',         requireAuth, auth.refreshSession)
router.post('/revoke-session',  requireAuth, requireAdmin, auth.revokeSession)

export default router
