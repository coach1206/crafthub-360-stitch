/**
 * Auth Routes — /api/auth/*
 *
 * Public (no auth required):
 *   POST /api/auth/staff-pin-login    — staff (PIN only or Staff ID + PIN)
 *   POST /api/auth/admin-login        — manager / admin (email + PIN)
 *   POST /api/auth/founder-login      — founder L0 (email + PIN + challenge)
 *   POST /api/auth/mentor-login       — human_mentor (email + PIN)
 *   POST /api/auth/dev-login          — developer (email + PIN + active grant)
 *   POST /api/auth/promote-member     — guest → passport_member promotion
 *
 * Semi-public:
 *   POST /api/auth/passport-refresh   — Passport Member refresh token rotation
 *   GET  /api/auth/me                 — current identity (returns guest if unauthenticated)
 *
 * Protected:
 *   POST /api/auth/logout             — requires active session
 *   POST /api/auth/refresh            — requires active session (non-passport-member)
 *   POST /api/auth/revoke-session     — admin+ only
 */

import { Router } from 'express'
import { requireAuth }   from '../middleware/authMiddleware.js'
import { requireAdmin }  from '../middleware/roleMiddleware.js'
import * as auth from '../controllers/authController.js'

const router = Router()

// ── Public endpoints ──────────────────────────────────────────
router.post('/staff-pin-login',  auth.staffPinLogin)
router.post('/admin-login',      auth.adminLogin)
router.post('/founder-login',    auth.founderLogin)
router.post('/mentor-login',     auth.mentorLogin)
router.post('/dev-login',        auth.devLogin)
router.post('/promote-member',   auth.promoteGuestToMember)

// ── Passport Member refresh token rotation ────────────────────
router.post('/passport-refresh', auth.passportRefresh)

// ── Identity ──────────────────────────────────────────────────
router.get('/me', requireAuth, auth.getMe)

// ── Session management ────────────────────────────────────────
router.post('/logout',         requireAuth,               auth.logout)
router.post('/refresh',        requireAuth,               auth.refreshSession)
router.post('/revoke-session', requireAuth, requireAdmin, auth.revokeSession)

export default router
