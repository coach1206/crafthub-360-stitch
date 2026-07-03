/**
 * SmokeCraft Experience Module API Routes
 * Module Build 2 of 9
 * Mounted at: /api/modules/smokecraft
 */

import { Router } from 'express'
import {
  registerSmokeCraftModule,
  getSmokeCraftModuleRegistration,
  buildSmokeCraftServerRegistrationReport,
} from '../services/modules/smokecraftModuleRegistration.js'

const router = Router()
const ts = () => new Date().toISOString()

function ok(res, data) { res.json({ ...data, timestamp: ts() }) }
function err(res, e) { res.status(500).json({ status: 'error', message: e.message, timestamp: ts() }) }

// GET /api/modules/smokecraft/status
router.get('/status', (req, res) => {
  try {
    ok(res, buildSmokeCraftServerRegistrationReport())
  } catch (e) { err(res, e) }
})

// GET /api/modules/smokecraft/manifest
router.get('/manifest', (req, res) => {
  try {
    const manifest = getSmokeCraftModuleRegistration()
    if (!manifest) {
      return res.status(404).json({ status: 'not_registered', moduleId: 'smokecraft-experience', timestamp: ts() })
    }
    ok(res, { manifest })
  } catch (e) { err(res, e) }
})

// POST /api/modules/smokecraft/register-preview
router.post('/register-preview', (req, res) => {
  try {
    const result = registerSmokeCraftModule()
    ok(res, { ...result, preview_only: true, module_packaging_status: 'registered_preview' })
  } catch (e) { err(res, e) }
})

export default router
