import { Router }       from 'express'
import { requireAuth }  from '../middleware/authMiddleware.js'
import { requireManager } from '../middleware/roleMiddleware.js'
import * as ctrl        from '../controllers/deviceController.js'

const router = Router()

// Public — any device can fetch its own config and send heartbeats
router.get('/config',                   ctrl.getConfig)
router.post('/:deviceId/heartbeat',     ctrl.heartbeat)

// Manager+ required for device management
router.get('/list',                     requireAuth, requireManager, ctrl.list)
router.post('/register',                requireAuth, requireManager, ctrl.register)
router.put('/:deviceId',               requireAuth, requireManager, ctrl.update)

export default router
