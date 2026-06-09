import { Router } from 'express'
import * as ctrl from '../controllers/tickerController.js'

const router = Router()

router.get(    '/',          ctrl.getFeed)           // GET  /api/ticker?source=&type=&area=&priority=&limit=
router.get(    '/sources',   ctrl.getSources)        // GET  /api/ticker/sources
router.post(   '/',          ctrl.addFeedItem)       // POST /api/ticker  { source, title, message, type, area, priority, route, ctaLabel }
router.delete( '/:id',       ctrl.deactivateFeedItem) // DELETE /api/ticker/:id

export default router
