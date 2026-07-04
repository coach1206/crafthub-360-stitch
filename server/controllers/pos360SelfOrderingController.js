// POS360 Self-Ordering Controller

import * as svc from '../services/pos360/pos360SelfOrderingService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const vid = req => req.headers['x-venue-id'] || req.query.venue_id || req.body?.venue_id;
const actor = req => req.headers['x-actor-id'] || req.user?.id || 'unknown';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotency_key || null;

// QR Menu Sessions
export const createQrMenuSession = (req, res) => ok500(res, () =>
  svc.createQrMenuSession({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getQrMenuSession = (req, res) => ok500(res, () =>
  svc.getQrMenuSession({ venueId: vid(req), sessionId: req.params.sessionId }).then(d => res.json(d)));
export const listQrMenuSessions = (req, res) => ok500(res, () =>
  svc.listQrMenuSessions({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateQrMenuSessionStatus = (req, res) => ok500(res, () =>
  svc.updateQrMenuSessionStatus({ venueId: vid(req), sessionId: req.params.sessionId, status: req.body.status, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Self-Order Carts
export const createSelfOrderCart = (req, res) => ok500(res, () =>
  svc.createSelfOrderCart({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getCartById = (req, res) => ok500(res, () =>
  svc.getCartById({ venueId: vid(req), cartId: req.params.cartId }).then(d => res.json(d)));
export const listSelfOrderCarts = (req, res) => ok500(res, () =>
  svc.listSelfOrderCarts({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateCartStatus = (req, res) => ok500(res, () =>
  svc.updateCartStatus({ venueId: vid(req), cartId: req.params.cartId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Cart Items
export const addCartItem = (req, res) => ok500(res, () =>
  svc.addCartItem({ venueId: vid(req), cartId: req.params.cartId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listCartItems = (req, res) => ok500(res, () =>
  svc.listCartItems({ venueId: vid(req), cartId: req.params.cartId }).then(d => res.json(d)));
export const updateCartItemStatus = (req, res) => ok500(res, () =>
  svc.updateCartItemStatus({ venueId: vid(req), cartItemId: req.params.cartItemId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Self-Order Submissions
export const createSelfOrderSubmission = (req, res) => ok500(res, () =>
  svc.createSelfOrderSubmission({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getSubmission = (req, res) => ok500(res, () =>
  svc.getSubmission({ venueId: vid(req), submissionId: req.params.submissionId }).then(d => res.json(d)));
export const listSelfOrderSubmissions = (req, res) => ok500(res, () =>
  svc.listSelfOrderSubmissions({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateSubmissionStatus = (req, res) => ok500(res, () =>
  svc.updateSubmissionStatus({ venueId: vid(req), submissionId: req.params.submissionId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Handheld POS Sessions
export const createHandheldPosSession = (req, res) => ok500(res, () =>
  svc.createHandheldPosSession({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listHandheldPosSessions = (req, res) => ok500(res, () =>
  svc.listHandheldPosSessions({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateHandheldSessionStatus = (req, res) => ok500(res, () =>
  svc.updateHandheldSessionStatus({ venueId: vid(req), sessionId: req.params.sessionId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Handheld Order Entries
export const createHandheldOrderEntry = (req, res) => ok500(res, () =>
  svc.createHandheldOrderEntry({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listHandheldOrderEntries = (req, res) => ok500(res, () =>
  svc.listHandheldOrderEntries({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateHandheldEntryStatus = (req, res) => ok500(res, () =>
  svc.updateHandheldEntryStatus({ venueId: vid(req), entryId: req.params.entryId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Table Ordering Sessions
export const createTableOrderingSession = (req, res) => ok500(res, () =>
  svc.createTableOrderingSession({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listTableOrderingSessions = (req, res) => ok500(res, () =>
  svc.listTableOrderingSessions({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateTableSessionStatus = (req, res) => ok500(res, () =>
  svc.updateTableSessionStatus({ venueId: vid(req), sessionId: req.params.sessionId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Guest Checkout Handoffs
export const createGuestCheckoutHandoff = (req, res) => ok500(res, () =>
  svc.createGuestCheckoutHandoff({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listGuestCheckoutHandoffs = (req, res) => ok500(res, () =>
  svc.listGuestCheckoutHandoffs({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateCheckoutHandoffStatus = (req, res) => ok500(res, () =>
  svc.updateCheckoutHandoffStatus({ venueId: vid(req), handoffId: req.params.handoffId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// QR Code Registry
export const createQrCode = (req, res) => ok500(res, () =>
  svc.createQrCode({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listQrCodes = (req, res) => ok500(res, () =>
  svc.listQrCodes({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateQrCodeStatus = (req, res) => ok500(res, () =>
  svc.updateQrCodeStatus({ venueId: vid(req), qrCodeId: req.params.qrCodeId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Menu Availability Snapshots
export const createMenuAvailabilitySnapshot = (req, res) => ok500(res, () =>
  svc.createMenuAvailabilitySnapshot({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listMenuAvailabilitySnapshots = (req, res) => ok500(res, () =>
  svc.listMenuAvailabilitySnapshots({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Age Verification
export const createAgeVerificationRecord = (req, res) => ok500(res, () =>
  svc.createAgeVerificationRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listAgeVerificationRecords = (req, res) => ok500(res, () =>
  svc.listAgeVerificationRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateAgeVerificationStatus = (req, res) => ok500(res, () =>
  svc.updateAgeVerificationStatus({ venueId: vid(req), recordId: req.params.recordId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Modifier Selections
export const addModifierSelection = (req, res) => ok500(res, () =>
  svc.addModifierSelection({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listModifierSelections = (req, res) => ok500(res, () =>
  svc.listModifierSelections({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Menu Availability Overrides
export const createMenuItemAvailabilityOverride = (req, res) => ok500(res, () =>
  svc.createMenuItemAvailabilityOverride({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listMenuItemAvailabilityOverrides = (req, res) => ok500(res, () =>
  svc.listMenuItemAvailabilityOverrides({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateMenuItemAvailabilityOverride = (req, res) => ok500(res, () =>
  svc.updateMenuItemAvailabilityOverride({ venueId: vid(req), overrideId: req.params.overrideId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// SmokeCraft Hooks
export const createSmokecraftSelfOrderHook = (req, res) => ok500(res, () =>
  svc.createSmokecraftSelfOrderHook({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listSmokecraftSelfOrderHooks = (req, res) => ok500(res, () =>
  svc.listSmokecraftSelfOrderHooks({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateSmokecraftHookStatus = (req, res) => ok500(res, () =>
  svc.updateSmokecraftHookStatus({ venueId: vid(req), hookId: req.params.hookId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// E.A.T. Handoffs
export const createEatSelfOrderHandoff = (req, res) => ok500(res, () =>
  svc.createEatSelfOrderHandoff({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listEatSelfOrderHandoffs = (req, res) => ok500(res, () =>
  svc.listEatSelfOrderHandoffs({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateEatHandoffStatus = (req, res) => ok500(res, () =>
  svc.updateEatHandoffStatus({ venueId: vid(req), handoffId: req.params.handoffId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Visibility Insights
export const createSelfOrderVisibilityInsight = (req, res) => ok500(res, () =>
  svc.createSelfOrderVisibilityInsight({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listSelfOrderVisibilityInsights = (req, res) => ok500(res, () =>
  svc.listSelfOrderVisibilityInsights({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const getSelfOrderOperationsSummary = (req, res) => ok500(res, () =>
  svc.getSelfOrderOperationsSummary({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Offline Queue — Self-Order
export const queueSelfOrderOfflineAction = (req, res) => ok500(res, () =>
  svc.queueSelfOrderOfflineAction({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listSelfOrderOfflineQueue = (req, res) => ok500(res, () =>
  svc.listSelfOrderOfflineQueue({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const markSelfOrderOfflineActionSynced = (req, res) => ok500(res, () =>
  svc.markSelfOrderOfflineActionSynced({ venueId: vid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Offline Queue — Handheld
export const queueHandheldOfflineAction = (req, res) => ok500(res, () =>
  svc.queueHandheldOfflineAction({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listHandheldOfflineQueue = (req, res) => ok500(res, () =>
  svc.listHandheldOfflineQueue({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const markHandheldOfflineActionSynced = (req, res) => ok500(res, () =>
  svc.markHandheldOfflineActionSynced({ venueId: vid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
