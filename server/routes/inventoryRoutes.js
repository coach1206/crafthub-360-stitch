import { Router } from 'express'
import {
  handleSetInventory, handleGetInventory, handleGetVenueInventory,
  handleAdjustInventory, handleCheckAvailability, handleBlockProduct,
  handleUnblockProduct, handleGetLowStock, handleGetInventoryEvents,
  handleGetInventoryReadiness, handleValidateCheckout, handleBuildAvailabilityMap,
  handleNcieAvailabilityContext, handleProductAvailabilityReadiness,
} from '../controllers/inventoryController.js'

const router = Router()

// Inventory CRUD
router.post('/venue/:venueId/set',                     handleSetInventory)
router.get('/venue/:venueId/product/:productId',       handleGetInventory)
router.get('/venue/:venueId',                          handleGetVenueInventory)
router.post('/venue/:venueId/product/:productId/adjust', handleAdjustInventory)
router.get('/venue/:venueId/product/:productId/check', handleCheckAvailability)
router.post('/venue/:venueId/product/:productId/block', handleBlockProduct)
router.post('/venue/:venueId/product/:productId/unblock', handleUnblockProduct)

// Summary + readiness
router.get('/venue/:venueId/low-stock',                handleGetLowStock)
router.get('/venue/:venueId/events',                   handleGetInventoryEvents)
router.get('/venue/:venueId/readiness',                handleGetInventoryReadiness)
router.get('/venue/:venueId/availability/readiness',   handleProductAvailabilityReadiness)

// Checkout + NCIE integration
router.post('/venue/:venueId/validate-checkout',       handleValidateCheckout)
router.post('/venue/:venueId/availability-map',        handleBuildAvailabilityMap)
router.post('/venue/:venueId/ncie-availability',       handleNcieAvailabilityContext)

export default router
