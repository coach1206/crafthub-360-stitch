/**
 * SmokeCraft diagnostics routes — /api/smokecraft/diagnostics/*
 *
 * Mounted in server/index.js. Reuses the same real admin auth middleware
 * as every other admin-gated route in this codebase (requireAuth +
 * requireAdmin — see server/routes/adminRoutes.js) rather than inventing
 * a new authorization scheme. Never public.
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import { handleReadinessCheck } from '../controllers/smokecraftDiagnosticsController.js'

const router = Router()

router.get('/readiness', requireAuth, requireAdmin, handleReadinessCheck)

export default router
