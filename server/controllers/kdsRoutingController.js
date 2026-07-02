/**
 * KDS Routing Controller
 */

import {
  getVenueStations, getStationProfile, createOrUpdateStationProfile,
  getStationMappings, createOrUpdateStationMapping,
  getRoutingRules, createOrUpdateRoutingRule, getStationConfigReadiness,
} from '../services/kds/stationConfigService.js'
import {
  routeOrderToStations, buildDispatchPreview, getFulfillmentOwnerForLineItem,
  getRoutingReadiness, buildRoutingPlan, validateRoutingInput,
} from '../services/kds/kdsRoutingEngine.js'
import {
  getFulfillmentStations, getFulfillmentPlan, getLineItemFulfillmentStatus,
  updateLineItemFulfillmentPreview, buildHandoffPlan, getHandoffStatus,
  getFulfillmentReadiness,
} from '../services/kds/fulfillmentStationEngine.js'
import {
  getStationHealth, getVenueStationHealth, updateStationHealthPreview,
  getUnavailableStations, getStationHealthReadiness,
} from '../services/kds/stationHealthEngine.js'
import { getKdsAuditTrail, logDispatchEvent } from '../services/kds/kdsAuditService.js'

// ── Station Config ────────────────────────────────────────────────────────────

export async function handleGetVenueStations(req, res) {
  try { return res.json(await getVenueStations(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateStation(req, res) {
  try { return res.json(await createOrUpdateStationProfile(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetStationProfile(req, res) {
  try {
    const result = await getStationProfile(req.params.venueId, req.params.stationId)
    if (!result.ok) return res.status(404).json(result)
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetStationMappings(req, res) {
  try { return res.json(await getStationMappings(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateMapping(req, res) {
  try { return res.json(await createOrUpdateStationMapping(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetRoutingRules(req, res) {
  try { return res.json(await getRoutingRules(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateRule(req, res) {
  try { return res.json(await createOrUpdateRoutingRule(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetStationConfigReadiness(req, res) {
  try { return res.json(await getStationConfigReadiness(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Routing / Dispatch ────────────────────────────────────────────────────────

export async function handleRouteOrder(req, res) {
  try {
    const result = routeOrderToStations(req.body, req.body.routingContext ?? {})
    await logDispatchEvent(req.body.orderId, { actorRole: 'api' })
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleDispatchPreview(req, res) {
  try {
    const plan    = buildRoutingPlan(req.body, req.body.stationConfig ?? [], req.body.routingRules ?? [])
    const preview = buildDispatchPreview(req.body, plan)
    return res.json(preview)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleFulfillmentPlan(req, res) {
  try { return res.json(getFulfillmentPlan(req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleHandoffPlan(req, res) {
  try { return res.json(buildHandoffPlan(req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function handleGetVenueHealth(req, res) {
  try { return res.json(getVenueStationHealth(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleUpdateStationHealthPreview(req, res) {
  try { return res.json(updateStationHealthPreview(req.params.venueId, req.params.stationId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export async function handleGetKdsAudit(req, res) {
  try { return res.json(await getKdsAuditTrail(req.params.entityType, req.params.entityId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}
