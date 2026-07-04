/**
 * pos360ReservationGuestFlowController.js — Phase B.9
 */

import * as svc from '../services/pos360/pos360ReservationGuestFlowService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const vid    = req => req.venueId
const actor  = req => req.user?.id || 'anonymous'
const tid    = req => req.tenantId || req.user?.tenantId

// Reservations
export const createReservation       = (req, res) => ok500(res, async () => res.json(await svc.createReservation({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const getReservation          = (req, res) => ok500(res, async () => res.json(await svc.getReservation({ venueId: vid(req), reservationId: req.params.reservationId })))
export const listReservations        = (req, res) => ok500(res, async () => res.json(await svc.listReservations({ venueId: vid(req), filters: req.query })))
export const updateReservationStatus = (req, res) => ok500(res, async () => res.json(await svc.updateReservationStatus({ venueId: vid(req), tenantId: tid(req), reservationId: req.params.reservationId, ...req.body, actorUserId: actor(req) })))
export const assignReservationTable  = (req, res) => ok500(res, async () => res.json(await svc.assignReservationTable({ venueId: vid(req), tenantId: tid(req), reservationId: req.params.reservationId, ...req.body, actorUserId: actor(req) })))
export const cancelReservation       = (req, res) => ok500(res, async () => res.json(await svc.cancelReservation({ venueId: vid(req), tenantId: tid(req), reservationId: req.params.reservationId, ...req.body, actorUserId: actor(req) })))
export const markReservationNoShow   = (req, res) => ok500(res, async () => res.json(await svc.markReservationNoShow({ venueId: vid(req), tenantId: tid(req), reservationId: req.params.reservationId, ...req.body, actorUserId: actor(req) })))

// Waitlist
export const createWaitlistEntry           = (req, res) => ok500(res, async () => res.json(await svc.createWaitlistEntry({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listWaitlist                  = (req, res) => ok500(res, async () => res.json(await svc.listWaitlist({ venueId: vid(req), filters: req.query })))
export const updateWaitlistStatus          = (req, res) => ok500(res, async () => res.json(await svc.updateWaitlistStatus({ venueId: vid(req), tenantId: tid(req), waitlistEntryId: req.params.waitlistEntryId, ...req.body, actorUserId: actor(req) })))
export const approveWaitlistPriorityOverride = (req, res) => ok500(res, async () => res.json(await svc.approveWaitlistPriorityOverride({ venueId: vid(req), tenantId: tid(req), waitlistEntryId: req.params.waitlistEntryId, managerUserId: actor(req), ...req.body })))

// Sections / Tables
export const createFloorSection  = (req, res) => ok500(res, async () => res.json(await svc.createFloorSection({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listFloorSections   = (req, res) => ok500(res, async () => res.json(await svc.listFloorSections({ venueId: vid(req) })))
export const createTable         = (req, res) => ok500(res, async () => res.json(await svc.createTable({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listTables          = (req, res) => ok500(res, async () => res.json(await svc.listTables({ venueId: vid(req), filters: req.query })))
export const updateTableStatus   = (req, res) => ok500(res, async () => res.json(await svc.updateTableStatus({ venueId: vid(req), tenantId: tid(req), tableId: req.params.tableId, ...req.body, actorUserId: actor(req) })))
export const assignTableToServer = (req, res) => ok500(res, async () => res.json(await svc.assignTableToServer({ venueId: vid(req), tenantId: tid(req), tableId: req.params.tableId, ...req.body, actorUserId: actor(req) })))
export const mergeTables         = (req, res) => ok500(res, async () => res.json(await svc.mergeTables({ venueId: vid(req), tenantId: tid(req), ...req.body, actorUserId: actor(req) })))
export const releaseTable        = (req, res) => ok500(res, async () => res.json(await svc.releaseTable({ venueId: vid(req), tenantId: tid(req), tableId: req.params.tableId, ...req.body, actorUserId: actor(req) })))

// Private Events
export const createPrivateEventInquiry    = (req, res) => ok500(res, async () => res.json(await svc.createPrivateEventInquiry({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listPrivateEvents            = (req, res) => ok500(res, async () => res.json(await svc.listPrivateEvents({ venueId: vid(req), filters: req.query })))
export const updatePrivateEventStatus     = (req, res) => ok500(res, async () => res.json(await svc.updatePrivateEventStatus({ venueId: vid(req), tenantId: tid(req), privateEventId: req.params.privateEventId, ...req.body, actorUserId: actor(req) })))
export const approvePrivateEvent          = (req, res) => ok500(res, async () => res.json(await svc.approvePrivateEvent({ venueId: vid(req), tenantId: tid(req), privateEventId: req.params.privateEventId, managerUserId: actor(req), ...req.body })))
export const updatePrivateEventDepositStatus = (req, res) => ok500(res, async () => res.json(await svc.updatePrivateEventDepositStatus({ venueId: vid(req), tenantId: tid(req), privateEventId: req.params.privateEventId, ...req.body, actorUserId: actor(req) })))

// Guest Flow
export const createGuestFlowEvent = (req, res) => ok500(res, async () => res.json(await svc.createGuestFlowEvent({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listGuestFlowEvents  = (req, res) => ok500(res, async () => res.json(await svc.listGuestFlowEvents({ venueId: vid(req), filters: req.query })))
export const getGuestFlowInsights = (req, res) => ok500(res, async () => res.json(await svc.getGuestFlowInsights({ venueId: vid(req), filters: req.query })))

// Offline
export const queueOfflineReservationAction = (req, res) => ok500(res, async () => res.json(await svc.queueOfflineReservationAction({ venueId: vid(req), tenantId: tid(req), actorUserId: actor(req), payload: req.body, idempotencyKey: req.body.idempotencyKey })))
export const listOfflineReservationQueue   = (req, res) => ok500(res, async () => res.json(await svc.listOfflineReservationQueue({ venueId: vid(req), filters: req.query })))
export const markOfflineActionSynced       = (req, res) => ok500(res, async () => res.json(await svc.markOfflineActionSynced({ venueId: vid(req), tenantId: tid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })))
