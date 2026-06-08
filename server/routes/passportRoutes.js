import { Router } from 'express'
import * as ctrl from '../controllers/passportController.js'

const router = Router()

router.get(  '/:passportId',              ctrl.getPassport)
router.get(  '/:passportId/stamps',       ctrl.getStamps)
router.post( '/:passportId/stamps',       ctrl.awardStamp)
router.put(  '/:passportId/ceremony-seen', ctrl.markCeremonySeen)

export default router
