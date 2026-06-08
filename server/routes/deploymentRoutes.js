import { Router }        from 'express'
import { requireAuth }   from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin } from '../middleware/roleMiddleware.js'
import { checklist, runChecks } from '../controllers/deploymentController.js'

const router = Router()

router.get('/checklist',   requireAuth, requireManager, checklist)
router.post('/run-checks', requireAuth, requireAdmin,   runChecks)

export default router
