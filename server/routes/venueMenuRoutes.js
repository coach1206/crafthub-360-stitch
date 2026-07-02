/**
 * Venue Menu Routes — /api/venue-menu
 *
 * GET  /api/venue-menu          — public: fetch active menu items
 * POST /api/venue-menu          — manager+: create menu item
 * PATCH /api/venue-menu/:id     — manager+: update menu item
 */

import { Router } from 'express'
import { requireAuth }    from '../middleware/authMiddleware.js'
import { requireManager } from '../middleware/roleMiddleware.js'
import { ok, fail, serverError } from '../utils/response.js'
import * as menuService from '../services/venueMenuPersistenceService.js'

const router = Router()

// GET /api/venue-menu?venueId=&category=&search=
router.get('/', async (req, res) => {
  try {
    const { venueId = 'novee-grand-lounge', category, search } = req.query
    const result = await menuService.getVenueMenuItems(venueId, { category, search })
    return ok(res, {
      items:         result.items || [],
      storageMode:   result.storageMode,
      seededDevData: result.seededDevData || false,
      localPreview:  result.localPreview || false,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/venue-menu  — manager+ only
router.post('/', requireAuth, requireManager, async (req, res) => {
  try {
    const { venueId = 'novee-grand-lounge', ...data } = req.body
    if (!data.item_name) return fail(res, 'item_name is required')
    const result = await menuService.createMenuItem(venueId, data)
    if (!result.ok) return fail(res, result.error || 'Failed to create item')
    return ok(res, { item: result.item, storageMode: result.storageMode }, 201)
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/venue-menu/:id  — manager+ only
router.patch('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const result = await menuService.updateMenuItem(req.params.id, req.body)
    if (!result.ok) return fail(res, result.error || 'Failed to update item')
    return ok(res, { item: result.item, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router
