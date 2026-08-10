/**
 * pos360CustomerLoyaltyController.js — Phase B.8
 */

import * as svc from '../services/pos360/pos360CustomerLoyaltyService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const vid    = req => req.venueId
const actor  = req => req.user?.id || 'anonymous'
const tid    = req => req.tenantId || req.user?.tenantId

export const createCustomer          = (req, res) => ok500(res, async () => res.json(await svc.createCustomer({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), ...req.body })))
export const getCustomer             = (req, res) => ok500(res, async () => res.json(await svc.getCustomer({ venueId: vid(req), customerId: req.params.customerId })))
export const updateCustomer          = (req, res) => ok500(res, async () => res.json(await svc.updateCustomer({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, updates: req.body })))
export const searchCustomers         = (req, res) => ok500(res, async () => res.json(await svc.searchCustomers({ venueId: vid(req), q: req.query.q || '', limit: Number(req.query.limit) || 20, offset: Number(req.query.offset) || 0 })))

export const createGuestProfile      = (req, res) => ok500(res, async () => res.json(await svc.createGuestProfile({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const getGuestProfile         = (req, res) => ok500(res, async () => res.json(await svc.getGuestProfile({ venueId: vid(req), customerId: req.params.customerId })))
export const recordGuestVisit        = (req, res) => ok500(res, async () => res.json(await svc.recordGuestVisit({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))

export const recordConsent           = (req, res) => ok500(res, async () => res.json(await svc.recordConsent({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))

export const enrollLoyalty           = (req, res) => ok500(res, async () => res.json(await svc.enrollLoyalty({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const getLoyaltyProfile       = (req, res) => ok500(res, async () => res.json(await svc.getLoyaltyProfile({ venueId: vid(req), customerId: req.params.customerId })))
export const earnPoints              = (req, res) => ok500(res, async () => res.json(await svc.earnPoints({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const redeemPoints            = (req, res) => ok500(res, async () => res.json(await svc.redeemPoints({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const requestPointsAdjustment = (req, res) => ok500(res, async () => res.json(await svc.requestPointsAdjustment({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const approvePointsAdjustment = (req, res) => ok500(res, async () => res.json(await svc.approvePointsAdjustment({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), adjustmentId: req.params.adjustmentId })))

export const listRewards             = (req, res) => ok500(res, async () => res.json(await svc.listRewards({ venueId: vid(req) })))
export const redeemReward            = (req, res) => ok500(res, async () => res.json(await svc.redeemPoints({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))
export const requestRewardReversal   = (req, res) => ok500(res, async () => res.json(await svc.requestRewardReversal({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), redemptionId: req.params.redemptionId, ...req.body })))
export const approveRewardReversal   = (req, res) => ok500(res, async () => res.json(await svc.approveRewardReversal({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), redemptionId: req.params.redemptionId })))

export const listLoyaltyTiers        = (req, res) => ok500(res, async () => res.json(await svc.listLoyaltyTiers({ venueId: vid(req) })))
export const createLoyaltyTier       = (req, res) => ok500(res, async () => res.json(await svc.createLoyaltyTier({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), ...req.body })))

export const listEATInsights         = (req, res) => ok500(res, async () => res.json(await svc.listEATInsights({ venueId: vid(req), customerId: req.params.customerId })))
export const triggerServiceRecovery  = (req, res) => ok500(res, async () => res.json(await svc.triggerServiceRecovery({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId, ...req.body })))

export const queuePrivacyExport      = (req, res) => ok500(res, async () => res.json(await svc.queuePrivacyExport({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId })))
export const queuePrivacyDelete      = (req, res) => ok500(res, async () => res.json(await svc.queuePrivacyDelete({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), customerId: req.params.customerId })))

export const queueOfflineGuestAction = (req, res) => ok500(res, async () => res.json(await svc.queueOfflineGuestAction({ venueId: vid(req), tenantId: tid(req), ...req.body })))

export const requestCustomerMerge    = (req, res) => ok500(res, async () => res.json(await svc.requestCustomerMerge({ venueId: vid(req), tenantId: tid(req), actorId: actor(req), ...req.body })))

export const getSmokecraftLink       = (req, res) => ok500(res, async () => res.json(await svc.getSmokecraftLink({ venueId: vid(req), customerId: req.params.customerId })))
