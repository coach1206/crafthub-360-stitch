/**
 * Admin Routes — /api/admin/*
 *
 * /api/admin/my-permissions — any authenticated user (no role gate)
 * /api/admin/roles          — any authenticated user
 * /api/admin/* (rest)       — admin or founder_level_0
 * /api/admin/money-settings — founder_level_0 only
 * /api/admin/data-wipe      — founder_level_0 only
 */

import { Router } from 'express'
import { requireAuth }                       from '../middleware/authMiddleware.js'
import { requireAdmin, requireManager, requireFounderLevel0, blockDevFounderSpoofing } from '../middleware/roleMiddleware.js'
import * as ac from '../controllers/adminController.js'

const router = Router()

// ── Open (any authenticated user) ────────────────────────────
router.get('/my-permissions',  requireAuth,                       ac.getMyPermissions)
router.get('/roles',           requireAuth,                       ac.getRoles)

// ── Admin-gated ───────────────────────────────────────────────
router.get('/permissions',     requireAuth, requireAdmin,         ac.getPermissionMatrix)
router.get('/me',              requireAuth, requireAdmin,         ac.getMe)
router.get('/users',           requireAuth, requireAdmin,         ac.getUsers)
router.post('/users',          requireAuth, requireAdmin,         ac.createUser)
router.put('/users/:userId',   requireAuth, requireAdmin,         ac.updateUser)
router.get('/security-events', requireAuth, requireAdmin,         ac.getSecurityEvents)
router.get('/staff',           requireAuth, requireAdmin,         ac.listStaff)

// ── Manager+ (PIN reset — manager can reset staff only, enforced in controller) ─
router.post('/users/:userId/reset-pin', requireAuth, requireManager, ac.resetUserPin)

// ── Founder-only (triple-gated: JWT + anti-spoof + role) ─────
router.post('/money-settings', requireAuth, blockDevFounderSpoofing, requireFounderLevel0, ac.updateMoneySettings)
router.delete('/data-wipe',    requireAuth, blockDevFounderSpoofing, requireFounderLevel0, ac.dataWipe)

export default router
