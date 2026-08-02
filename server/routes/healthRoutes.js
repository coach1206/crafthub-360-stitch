import { Router } from 'express'
import { getHealth, getVersion } from '../controllers/healthController.js'
import { getLiveness, getReadiness, getMigrationState } from '../controllers/deploymentHealthController.js'

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

export default router
