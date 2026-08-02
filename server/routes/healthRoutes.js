import { Router } from 'express'
import { getHealth, getVersion, getMetrics } from '../controllers/healthController.js'
import { getLiveness, getReadiness, getMigrationState } from '../controllers/deploymentHealthController.js'
import { getPublicStatus } from '../controllers/publicStatusController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'

const router = Router()

// Production Build Identity pass — these two endpoints exist specifically
// to prove deployment freshness, so they must never be cached themselves.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.get('/health', getHealth)
router.get('/version', getVersion)

// Production Package 4 — deployment-grade health endpoints.
router.get('/health/live',       getLiveness)
router.get('/health/ready',      getReadiness)
router.get('/health/migrations', getMigrationState)

// Production Package 5 — admin-gated metrics snapshot (not public: could
// reveal operational internals such as error rates / DB latency).
router.get('/health/metrics',    requireAuth, requireAdmin, getMetrics)

// Production Package 7 — practical-minimum public status summary.
// Sensitive-field-stripped; honest degraded state; no live external
// monitoring provider is connected in this environment (disclosed in
// the payload itself).
router.get('/status/public',     getPublicStatus)

export default router
