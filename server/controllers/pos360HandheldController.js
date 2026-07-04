/**
 * POS360 Handheld Device Suite — Controller (Phase B.3)
 */
import * as svc from '../services/pos360/pos360HandheldDeviceService.js'

function actor(req) { return { actorId: req.user?.id ?? null, actorRole: req.user?.role ?? null } }
function vid(req)   { return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId }
function ok500(fn)  {
  return async (req, res) => {
    try { const r = await fn(req, res); if (r !== undefined) res.json(r) }
    catch (err) { res.status(500).json({ ok: false, error: err.message }) }
  }
}

// ── Device ────────────────────────────────────────────────────────────────────
export const registerDevice  = ok500(async req => svc.registerDevice({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceName: req.body.deviceName, deviceType: req.body.deviceType, serialNumber: req.body.serialNumber, hardwareModel: req.body.hardwareModel, appVersion: req.body.appVersion, capabilities: req.body.capabilities, createdBy: actor(req).actorId }))
export const getDevice       = ok500(async req => svc.getDevice({ deviceId: req.params.deviceId, venueId: vid(req) }))
export const listDevices     = ok500(async req => svc.listDevices({ venueId: vid(req), tenantId: req.query.tenantId, deviceType: req.query.deviceType, isActive: req.query.isActive !== 'false' }))
export const updateDevice    = ok500(async req => svc.updateDevice({ deviceId: req.params.deviceId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const disableDevice   = ok500(async req => svc.disableDevice({ deviceId: req.params.deviceId, venueId: vid(req), disabledBy: actor(req).actorId }))

// ── Sessions ──────────────────────────────────────────────────────────────────
export const startSession    = ok500(async req => svc.startDeviceSession({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.params.deviceId, staffUserId: req.body.staffUserId, staffRole: req.body.staffRole, ipAddress: req.ip, userAgent: req.headers['user-agent'], createdBy: actor(req).actorId }))
export const endSession      = ok500(async req => svc.endDeviceSession({ sessionId: req.params.sessionId, deviceId: req.params.deviceId, venueId: vid(req), endReason: req.body.endReason, updatedBy: actor(req).actorId }))

// ── Diagnostics ───────────────────────────────────────────────────────────────
export const saveDiagnostics = ok500(async req => svc.saveDeviceDiagnostics({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.params.deviceId, staffUserId: actor(req).actorId, ...req.body, createdBy: actor(req).actorId }))
export const getDiagnostics  = ok500(async req => svc.getLatestDeviceDiagnostics({ deviceId: req.params.deviceId, venueId: vid(req) }))

// ── Sync ──────────────────────────────────────────────────────────────────────
export const recordSync      = ok500(async req => svc.recordSyncEvent({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.params.deviceId, staffUserId: actor(req).actorId, ...req.body, createdBy: actor(req).actorId }))
export const getSyncStatus   = ok500(async req => svc.getDeviceSyncStatus({ deviceId: req.params.deviceId, venueId: vid(req) }))

// ── Handheld Home ─────────────────────────────────────────────────────────────
export const getHomeState    = ok500(async req => svc.getHandheldHomeState({ venueId: vid(req), locationId: req.query.locationId, staffUserId: req.query.staffUserId || actor(req).actorId, deviceId: req.query.deviceId }))
export const getLauncher     = ok500(async req => svc.getRoleAwareLauncher({ venueId: vid(req), staffUserId: req.query.staffUserId || actor(req).actorId, role: actor(req).actorRole || req.query.role }))

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications       = ok500(async req => svc.getNotifications({ venueId: vid(req), staffUserId: req.query.staffUserId || actor(req).actorId, deviceId: req.query.deviceId, unreadOnly: req.query.unreadOnly === 'true' }))
export const markNotificationRead   = ok500(async req => svc.markNotificationRead({ notificationId: req.params.notificationId, venueId: vid(req), updatedBy: actor(req).actorId }))
export const createNotification     = ok500(async req => svc.createNotification({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.body.deviceId, staffUserId: req.body.staffUserId, ...req.body, createdBy: actor(req).actorId }))

// ── Tables ────────────────────────────────────────────────────────────────────
export const getHandheldTables      = ok500(async req => svc.getHandheldTableList({ venueId: vid(req), staffUserId: req.query.staffUserId || actor(req).actorId, role: actor(req).actorRole }))
export const syncTableState         = ok500(async req => svc.syncHandheldTableState({ venueId: vid(req), deviceId: req.query.deviceId, staffUserId: actor(req).actorId }))

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder            = ok500(async req => svc.createHandheldOrder({ venueId: vid(req), tenantId: req.body.tenantId, locationId: req.body.locationId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId, tableId: req.body.tableId, guestId: req.body.guestId, smokecraftSessionId: req.body.smokecraftSessionId, loyaltyProfileId: req.body.loyaltyProfileId, orderPayload: req.body, createdBy: actor(req).actorId }))
export const addOrderItem           = ok500(async req => svc.addItemToHandheldOrder({ orderId: req.params.orderId, venueId: vid(req), deviceId: req.body.deviceId, staffUserId: actor(req).actorId, itemId: req.body.itemId, quantity: req.body.quantity, modifiers: req.body.modifiers, addons: req.body.addons, notes: req.body.notes, createdBy: actor(req).actorId }))
export const sendToStation          = ok500(async req => svc.sendOrderToStation({ orderId: req.params.orderId, venueId: vid(req), deviceId: req.body.deviceId, staffUserId: actor(req).actorId, stationId: req.body.stationId, items: req.body.items, createdBy: actor(req).actorId }))

// ── Payments ──────────────────────────────────────────────────────────────────
export const getPaymentOptions      = ok500(async req => svc.getPaymentOptions({ venueId: vid(req) }))
export const createPaymentIntent    = ok500(async req => svc.createPaymentIntentPlaceholder({ venueId: vid(req), orderId: req.body.orderId, amount: req.body.amount, currency: req.body.currency, paymentMethod: req.body.paymentMethod, deviceId: req.body.deviceId, staffUserId: actor(req).actorId }))
export const captureTip             = ok500(async req => svc.captureTipSelection({ venueId: vid(req), orderId: req.params.orderId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId, tipAmount: req.body.tipAmount, tipPercent: req.body.tipPercent }))
export const captureSignature       = ok500(async req => svc.captureSignature({ venueId: vid(req), orderId: req.params.orderId, deviceId: req.body.deviceId, signatureData: req.body.signatureData }))
export const sendReceipt            = ok500(async req => svc.sendReceipt({ venueId: vid(req), orderId: req.params.orderId, recipientEmail: req.body.recipientEmail, recipientPhone: req.body.recipientPhone, receiptType: req.body.receiptType }))

// ── SmokeCraft ────────────────────────────────────────────────────────────────
export const getSmokecraftContext   = ok500(async req => svc.getGuestSmokecraftContext({ venueId: vid(req), guestId: req.params.guestId, tableId: req.query.tableId }))
export const getSmokecraftPairings  = ok500(async req => svc.getSmokecraftPairingHooks({ venueId: vid(req), guestId: req.params.guestId, currentItemId: req.query.itemId }))
export const attachSmokecraftSession = ok500(async req => svc.attachSmokecraftSessionToOrder({ venueId: vid(req), orderId: req.params.orderId, guestId: req.body.guestId, smokecraftSessionId: req.body.smokecraftSessionId }))

// ── E.A.T. ────────────────────────────────────────────────────────────────────
export const getRecommendations     = ok500(async req => svc.getHandheldRecommendations({ venueId: vid(req), guestId: req.query.guestId, tableId: req.query.tableId, deviceId: req.query.deviceId }))
export const getManagerAlerts       = ok500(async req => svc.getManagerAlerts({ venueId: vid(req), managerId: actor(req).actorId }))

// ── Guests / Loyalty ──────────────────────────────────────────────────────────
export const searchGuests           = ok500(async req => svc.searchGuests({ venueId: vid(req), query: req.query.q }))
export const getGuestProfile        = ok500(async req => svc.getGuestProfile({ venueId: vid(req), guestId: req.params.guestId }))
export const attachGuest            = ok500(async req => svc.attachGuestToOrder({ venueId: vid(req), orderId: req.body.orderId, guestId: req.body.guestId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId }))
export const getLoyaltyProfile      = ok500(async req => svc.getLoyaltyProfile({ venueId: vid(req), guestId: req.params.guestId }))
export const getRewardEligibility   = ok500(async req => svc.getRewardEligibility({ venueId: vid(req), guestId: req.params.guestId }))

// ── Offline Queue ─────────────────────────────────────────────────────────────
export const queueOfflineAction     = ok500(async req => svc.queueOfflineAction({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId, actionType: req.body.actionType, entityType: req.body.entityType, entityId: req.body.entityId, actionPayload: req.body.actionPayload, createdBy: actor(req).actorId }))
export const listOfflineQueue       = ok500(async req => svc.listOfflineQueue({ deviceId: req.params.deviceId, venueId: vid(req), status: req.query.status }))
export const replayOfflineQueue     = ok500(async req => svc.replayOfflineQueuePlaceholder({ deviceId: req.params.deviceId, venueId: vid(req) }))
export const setSyncCompleted       = ok500(async req => svc.markSyncCompleted({ deviceId: req.params.deviceId, venueId: vid(req), updatedBy: actor(req).actorId }))
export const setSyncFailed          = ok500(async req => svc.markSyncFailed({ deviceId: req.params.deviceId, venueId: vid(req), errorMessage: req.body.errorMessage, updatedBy: actor(req).actorId }))

// ── Manager Approvals ─────────────────────────────────────────────────────────
export const requestApproval        = ok500(async req => svc.requestManagerApproval({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.body.deviceId, requestingStaffId: actor(req).actorId, actionType: req.body.actionType, entityType: req.body.entityType, entityId: req.body.entityId, actionPayload: req.body.actionPayload, expiresAt: req.body.expiresAt, createdBy: actor(req).actorId }))
export const listApprovals          = ok500(async req => svc.listPendingApprovals({ venueId: vid(req), managerId: actor(req).actorId }))
export const resolveApproval        = ok500(async req => svc.resolveManagerApproval({ approvalId: req.params.approvalId, venueId: vid(req), decision: req.body.decision, approvingManagerId: actor(req).actorId, approvalNote: req.body.approvalNote, updatedBy: actor(req).actorId }))

// ── Emergency Mode ────────────────────────────────────────────────────────────
export const activateEmergency      = ok500(async req => svc.activateEmergencyMode({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId, emergencyType: req.body.emergencyType, notes: req.body.notes, affectedSystems: req.body.affectedSystems, createdBy: actor(req).actorId }))
export const deactivateEmergency    = ok500(async req => svc.deactivateEmergencyMode({ emergencyId: req.params.emergencyId, venueId: vid(req), deactivatedBy: actor(req).actorId, recoveryActions: req.body.recoveryActions }))
export const logEmergency           = ok500(async req => svc.logEmergencyEvent({ tenantId: req.body.tenantId, venueId: vid(req), locationId: req.body.locationId, deviceId: req.body.deviceId, staffUserId: actor(req).actorId, emergencyType: req.body.emergencyType, notes: req.body.notes, createdBy: actor(req).actorId }))

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReportsPreview      = ok500(async req => svc.getHandheldReportsPreview({ venueId: vid(req), locationId: req.query.locationId, staffUserId: actor(req).actorId }))
