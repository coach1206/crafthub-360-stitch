// POS360 Self-Ordering Routes — mounted at /api/pos360/self-ordering

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/pos360SelfOrderingController.js';

const router = Router();

// QR Menu Sessions
router.post('/qr-sessions', canAccessPOS3, c.createQrMenuSession);
router.get('/qr-sessions', c.listQrMenuSessions);
router.get('/qr-sessions/:sessionId', c.getQrMenuSession);
router.patch('/qr-sessions/:sessionId/status', canAccessPOS3, c.updateQrMenuSessionStatus);

// Self-Order Carts
router.post('/carts', c.createSelfOrderCart);
router.get('/carts', c.listSelfOrderCarts);
router.get('/carts/:cartId', c.getCartById);
router.patch('/carts/:cartId/status', canAccessPOS3, c.updateCartStatus);

// Cart Items
router.post('/carts/:cartId/items', c.addCartItem);
router.get('/carts/:cartId/items', c.listCartItems);
router.patch('/cart-items/:cartItemId/status', canAccessPOS3, c.updateCartItemStatus);

// Self-Order Submissions
router.post('/submissions', c.createSelfOrderSubmission);
router.get('/submissions', c.listSelfOrderSubmissions);
router.get('/submissions/:submissionId', c.getSubmission);
router.patch('/submissions/:submissionId/status', canAccessPOS3, c.updateSubmissionStatus);

// Handheld POS Sessions
router.post('/handheld-sessions', canAccessPOS3, c.createHandheldPosSession);
router.get('/handheld-sessions', c.listHandheldPosSessions);
router.patch('/handheld-sessions/:sessionId/status', canAccessPOS3, c.updateHandheldSessionStatus);

// Handheld Order Entries
router.post('/handheld-entries', canAccessPOS3, c.createHandheldOrderEntry);
router.get('/handheld-entries', c.listHandheldOrderEntries);
router.patch('/handheld-entries/:entryId/status', canAccessPOS3, c.updateHandheldEntryStatus);

// Table Ordering Sessions
router.post('/table-sessions', canAccessPOS3, c.createTableOrderingSession);
router.get('/table-sessions', c.listTableOrderingSessions);
router.patch('/table-sessions/:sessionId/status', canAccessPOS3, c.updateTableSessionStatus);

// Guest Checkout Handoffs
router.post('/checkout-handoffs', canAccessPOS3, c.createGuestCheckoutHandoff);
router.get('/checkout-handoffs', c.listGuestCheckoutHandoffs);
router.patch('/checkout-handoffs/:handoffId/status', canAccessPOS3, c.updateCheckoutHandoffStatus);

// QR Code Registry
router.post('/qr-codes', canAccessPOS3, c.createQrCode);
router.get('/qr-codes', c.listQrCodes);
router.patch('/qr-codes/:qrCodeId/status', canAccessPOS3, c.updateQrCodeStatus);

// Menu Availability Snapshots
router.post('/menu-snapshots', canAccessPOS3, c.createMenuAvailabilitySnapshot);
router.get('/menu-snapshots', c.listMenuAvailabilitySnapshots);

// Age Verification
router.post('/age-verification', canAccessPOS3, c.createAgeVerificationRecord);
router.get('/age-verification', c.listAgeVerificationRecords);
router.patch('/age-verification/:recordId/status', canAccessPOS3, c.updateAgeVerificationStatus);

// Modifier Selections
router.post('/modifier-selections', c.addModifierSelection);
router.get('/modifier-selections', c.listModifierSelections);

// Menu Availability Overrides
router.post('/availability-overrides', canAccessPOS3, c.createMenuItemAvailabilityOverride);
router.get('/availability-overrides', c.listMenuItemAvailabilityOverrides);
router.patch('/availability-overrides/:overrideId/status', canAccessPOS3, c.updateMenuItemAvailabilityOverride);

// SmokeCraft Self-Order Hooks
router.post('/smokecraft-hooks', canAccessPOS3, c.createSmokecraftSelfOrderHook);
router.get('/smokecraft-hooks', c.listSmokecraftSelfOrderHooks);
router.patch('/smokecraft-hooks/:hookId/status', canAccessPOS3, c.updateSmokecraftHookStatus);

// E.A.T. Handoffs
router.post('/eat-handoffs', canAccessPOS3, c.createEatSelfOrderHandoff);
router.get('/eat-handoffs', c.listEatSelfOrderHandoffs);
router.patch('/eat-handoffs/:handoffId/status', canAccessPOS3, c.updateEatHandoffStatus);

// Visibility Insights & Summary
router.post('/visibility-insights', canAccessPOS3, c.createSelfOrderVisibilityInsight);
router.get('/visibility-insights', c.listSelfOrderVisibilityInsights);
router.get('/operations-summary', c.getSelfOrderOperationsSummary);

// Offline Queue — Self-Order
router.post('/offline-queue', c.queueSelfOrderOfflineAction);
router.get('/offline-queue', c.listSelfOrderOfflineQueue);
router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3, c.markSelfOrderOfflineActionSynced);

// Offline Queue — Handheld
router.post('/handheld-offline-queue', canAccessPOS3, c.queueHandheldOfflineAction);
router.get('/handheld-offline-queue', c.listHandheldOfflineQueue);
router.post('/handheld-offline-queue/:offlineActionId/synced', canAccessPOS3, c.markHandheldOfflineActionSynced);

export default router;
