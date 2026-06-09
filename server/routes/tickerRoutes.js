import { Router } from 'express'
import * as ctrl from '../controllers/tickerController.js'

const router = Router()

router.get(  '/',         ctrl.getFeed)        // GET  /api/ticker?craft=&source=&limit=
router.get(  '/sources',  ctrl.getSources)     // GET  /api/ticker/sources
router.post( '/',         ctrl.addFeedItem)    // POST /api/ticker  { source, text, route }

export default router
