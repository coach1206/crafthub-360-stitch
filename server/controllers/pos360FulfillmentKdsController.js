// POS360 Fulfillment KDS Controller

import * as svc from '../services/pos360/pos360FulfillmentKdsService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const vid = req => req.headers['x-venue-id'] || req.query.venue_id || req.body?.venue_id;
const actor = req => req.headers['x-actor-id'] || req.user?.id || 'unknown';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotency_key || null;

// Stations
export const createStationProfile = (req, res) => ok500(res, () =>
  svc.createStationProfile({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getStationProfile = (req, res) => ok500(res, () =>
  svc.getStationProfile({ venueId: vid(req), stationId: req.params.stationId }).then(d => res.json(d)));
export const listStationProfiles = (req, res) => ok500(res, () =>
  svc.listStationProfiles({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateStationStatus = (req, res) => ok500(res, () =>
  svc.updateStationStatus({ venueId: vid(req), stationId: req.params.stationId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const createStationCapability = (req, res) => ok500(res, () =>
  svc.createStationCapability({ venueId: vid(req), stationId: req.params.stationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listStationCapabilities = (req, res) => ok500(res, () =>
  svc.listStationCapabilities({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Routing
export const createItemRoutingRule = (req, res) => ok500(res, () =>
  svc.createItemRoutingRule({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listItemRoutingRules = (req, res) => ok500(res, () =>
  svc.listItemRoutingRules({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateItemRoutingRule = (req, res) => ok500(res, () =>
  svc.updateItemRoutingRule({ venueId: vid(req), routingRuleId: req.params.routingRuleId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Production tickets
export const createProductionTicketPlaceholder = (req, res) => ok500(res, () =>
  svc.createProductionTicketPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getProductionTicket = (req, res) => ok500(res, () =>
  svc.getProductionTicket({ venueId: vid(req), ticketId: req.params.ticketId }).then(d => res.json(d)));
export const listProductionTickets = (req, res) => ok500(res, () =>
  svc.listProductionTickets({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateProductionTicketStatus = (req, res) => ok500(res, () =>
  svc.updateProductionTicketStatus({ venueId: vid(req), ticketId: req.params.ticketId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const createProductionTicketItem = (req, res) => ok500(res, () =>
  svc.createProductionTicketItem({ venueId: vid(req), ticketId: req.params.ticketId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProductionTicketItems = (req, res) => ok500(res, () =>
  svc.listProductionTicketItems({ venueId: vid(req), ticketId: req.params.ticketId }).then(d => res.json(d)));
export const updateProductionTicketItemStatus = (req, res) => ok500(res, () =>
  svc.updateProductionTicketItemStatus({ venueId: vid(req), ticketItemId: req.params.ticketItemId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// KDS queues
export const createKdsQueueRecord = (req, res) => ok500(res, () =>
  svc.createKdsQueueRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listKdsQueueRecords = (req, res) => ok500(res, () =>
  svc.listKdsQueueRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateKdsQueueStatus = (req, res) => ok500(res, () =>
  svc.updateKdsQueueStatus({ venueId: vid(req), queueRecordId: req.params.queueRecordId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const updateKdsQueuePriority = (req, res) => ok500(res, () =>
  svc.updateKdsQueuePriority({ venueId: vid(req), queueRecordId: req.params.queueRecordId, priority: req.body.priority, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Course fire
export const createCourseFireControl = (req, res) => ok500(res, () =>
  svc.createCourseFireControl({ venueId: vid(req), ticketId: req.params.ticketId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listCourseFireControls = (req, res) => ok500(res, () =>
  svc.listCourseFireControls({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateCourseFireStatus = (req, res) => ok500(res, () =>
  svc.updateCourseFireStatus({ venueId: vid(req), fireControlId: req.params.fireControlId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Assignments / handoffs
export const createStationStaffAssignment = (req, res) => ok500(res, () =>
  svc.createStationStaffAssignment({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listStationStaffAssignments = (req, res) => ok500(res, () =>
  svc.listStationStaffAssignments({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const createProductionHandoff = (req, res) => ok500(res, () =>
  svc.createProductionHandoff({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProductionHandoffs = (req, res) => ok500(res, () =>
  svc.listProductionHandoffs({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateProductionHandoffStatus = (req, res) => ok500(res, () =>
  svc.updateProductionHandoffStatus({ venueId: vid(req), handoffId: req.params.handoffId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Item unavailable / overrides
export const createItemUnavailableRecord = (req, res) => ok500(res, () =>
  svc.createItemUnavailableRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listItemUnavailableRecords = (req, res) => ok500(res, () =>
  svc.listItemUnavailableRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const createProductionManagerOverride = (req, res) => ok500(res, () =>
  svc.createProductionManagerOverride({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const decideProductionManagerOverride = (req, res) => ok500(res, () =>
  svc.decideProductionManagerOverride({ venueId: vid(req), overrideId: req.params.overrideId, managerUserId: actor(req), decision: req.body.decision, reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Refire / rush / delay
export const createProductionRefire = (req, res) => ok500(res, () =>
  svc.createProductionRefire({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProductionRefires = (req, res) => ok500(res, () =>
  svc.listProductionRefires({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const createProductionRushDelay = (req, res) => ok500(res, () =>
  svc.createProductionRushDelay({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProductionRushDelayRecords = (req, res) => ok500(res, () =>
  svc.listProductionRushDelayRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Order handoffs
export const createGuestSelfOrderHandoffPlaceholder = (req, res) => ok500(res, () =>
  svc.createGuestSelfOrderHandoffPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listGuestSelfOrderHandoffs = (req, res) => ok500(res, () =>
  svc.listGuestSelfOrderHandoffs({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const createServerOrderHandoffPlaceholder = (req, res) => ok500(res, () =>
  svc.createServerOrderHandoffPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listServerOrderHandoffs = (req, res) => ok500(res, () =>
  svc.listServerOrderHandoffs({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Area fulfillment
export const createHumidorFulfillmentRecord = (req, res) => ok500(res, () =>
  svc.createHumidorFulfillmentRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listHumidorFulfillmentRecords = (req, res) => ok500(res, () =>
  svc.listHumidorFulfillmentRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateHumidorFulfillmentStatus = (req, res) => ok500(res, () =>
  svc.updateHumidorFulfillmentStatus({ venueId: vid(req), humidorFulfillmentId: req.params.humidorFulfillmentId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const createBarFulfillmentRecord = (req, res) => ok500(res, () =>
  svc.createBarFulfillmentRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listBarFulfillmentRecords = (req, res) => ok500(res, () =>
  svc.listBarFulfillmentRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateBarFulfillmentStatus = (req, res) => ok500(res, () =>
  svc.updateBarFulfillmentStatus({ venueId: vid(req), barFulfillmentId: req.params.barFulfillmentId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const createKitchenFulfillmentRecord = (req, res) => ok500(res, () =>
  svc.createKitchenFulfillmentRecord({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listKitchenFulfillmentRecords = (req, res) => ok500(res, () =>
  svc.listKitchenFulfillmentRecords({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateKitchenFulfillmentStatus = (req, res) => ok500(res, () =>
  svc.updateKitchenFulfillmentStatus({ venueId: vid(req), kitchenFulfillmentId: req.params.kitchenFulfillmentId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// External KDS providers
export const createExternalKdsProviderProfile = (req, res) => ok500(res, () =>
  svc.createExternalKdsProviderProfile({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listExternalKdsProviderProfiles = (req, res) => ok500(res, () =>
  svc.listExternalKdsProviderProfiles({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const updateExternalKdsProviderStatus = (req, res) => ok500(res, () =>
  svc.updateExternalKdsProviderStatus({ venueId: vid(req), providerProfileId: req.params.providerProfileId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

// Visibility
export const createProductionVisibilityInsightPlaceholder = (req, res) => ok500(res, () =>
  svc.createProductionVisibilityInsightPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProductionVisibilityInsights = (req, res) => ok500(res, () =>
  svc.listProductionVisibilityInsights({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const getProductionOperationsSummary = (req, res) => ok500(res, () =>
  svc.getProductionOperationsSummary({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));

// Offline
export const queueOfflineProductionAction = (req, res) => ok500(res, () =>
  svc.queueOfflineProductionAction({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listOfflineProductionQueue = (req, res) => ok500(res, () =>
  svc.listOfflineProductionQueue({ venueId: vid(req), filters: req.query }).then(d => res.json(d)));
export const markOfflineProductionActionSynced = (req, res) => ok500(res, () =>
  svc.markOfflineProductionActionSynced({ venueId: vid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
