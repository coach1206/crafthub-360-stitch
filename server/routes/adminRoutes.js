/**
 * Admin Routes — system-level and founder-only endpoints.
 *
 * Access matrix:
 *   GET  /api/admin/my-permissions   → any authenticated user
 *   GET  /api/admin/roles            → admin+
 *   GET  /api/admin/permissions      → admin+
 *   GET  /api/admin/staff            → manager+
 *   POST /api/admin/money-settings   → founder ONLY
 *   DELETE /api/admin/data-wipe      → founder ONLY
 */

import { Router } from 'express'
import {
  requireAdmin,
  requireManager,
  founderOnly,
} from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/adminController.js'

const router = Router()

router.get(    '/my-permissions',   ctrl.getMyPermissions)
router.get(    '/roles',            requireAdmin,   ctrl.getRoles)
router.get(    '/permissions',      requireAdmin,   ctrl.getPermissionMatrix)
router.get(    '/staff',            requireManager, ctrl.listStaff)
router.post(   '/money-settings',   founderOnly,    ctrl.updateMoneySettings)
router.delete( '/data-wipe',        founderOnly,    ctrl.dataWipe)

export default router
