import { Router } from 'express'
import { getHealth, getVersion } from '../controllers/healthController.js'

const router = Router()

// Production Build Identity pass — these two endpoints exist specifically
// to prove deployment freshness, so they must never be cached themselves.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.get('/health', getHealth)
router.get('/version', getVersion)

export default router
