/**
 * SmokeCraft account routes — Holistic Fix 4B.
 * Mounted at /api/smokecraft/account in server/index.js.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import * as ctrl from '../controllers/smokecraftAccountController.js'

const router = Router()

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

router.post('/create', authLimiter, ctrl.handleCreateAccount)
router.post('/login/request-pin', authLimiter, ctrl.handleRequestLoginPin)
router.post('/login', authLimiter, ctrl.handleLogin)
router.post('/logout', readLimiter, requireAuth, ctrl.handleLogout)
router.get('/me', readLimiter, optionalAuth, ctrl.handleMe)

export default router
