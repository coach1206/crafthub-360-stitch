import { Router } from 'express'
import { getDatabaseStatusHandler } from '../controllers/databaseStatusController.js'

const router = Router()

router.get('/status', getDatabaseStatusHandler)

export default router
