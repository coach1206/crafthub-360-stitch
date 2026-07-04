/**
 * POS360 Floor Management Controller — Phase B.1
 *
 * All routes require venueId (enforced by venueTenantGuard middleware).
 * Role-based permission checks use req.user populated by requireAuth middleware.
 * Falls back gracefully when DATABASE_URL is not configured.
 */
import * as floorSvc from '../services/pos360/pos360FloorManagementService.js'

function actor(req) {
  return { actorId: req.user?.id ?? null, actorRole: req.user?.role ?? null }
}

function venueId(req) {
  return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function createSection(req, res) {
  try {
    const vid = venueId(req)
    const { actorId } = actor(req)
    const result = await floorSvc.createSection({ venueId: vid, tenantId: req.body.tenantId, sectionName: req.body.sectionName, sectionType: req.body.sectionType, displayOrder: req.body.displayOrder, colorHex: req.body.colorHex, icon: req.body.icon, capacity: req.body.capacity, createdBy: actorId, metadata: req.body.metadata, featureFlags: req.body.featureFlags })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}

export async function updateSection(req, res) {
  try {
    const result = await floorSvc.updateSection({ sectionId: req.params.sectionId, venueId: venueId(req), tenantId: req.body.tenantId, updates: req.body, updatedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function listSections(req, res) {
  try {
    const result = await floorSvc.listSections({ venueId: venueId(req), includeInactive: req.query.includeInactive === 'true' })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function archiveSection(req, res) {
  try {
    const result = await floorSvc.archiveSection({ sectionId: req.params.sectionId, venueId: venueId(req), archivedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Floor Maps ────────────────────────────────────────────────────────────────

export async function createFloorMap(req, res) {
  try {
    const result = await floorSvc.createFloorMap({ venueId: venueId(req), tenantId: req.body.tenantId, mapName: req.body.mapName, canvasWidth: req.body.canvasWidth, canvasHeight: req.body.canvasHeight, createdBy: actor(req).actorId, metadata: req.body.metadata })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function updateFloorMap(req, res) {
  try {
    const result = await floorSvc.updateFloorMap({ mapId: req.params.mapId, venueId: venueId(req), updates: req.body, updatedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function listFloorMaps(req, res) {
  try {
    const result = await floorSvc.listFloorMaps({ venueId: venueId(req) })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Tables ────────────────────────────────────────────────────────────────────

export async function createTable(req, res) {
  try {
    const result = await floorSvc.createTable({ venueId: venueId(req), tenantId: req.body.tenantId, ...req.body, createdBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function updateTable(req, res) {
  try {
    const result = await floorSvc.updateTable({ tableId: req.params.tableId, venueId: venueId(req), updates: req.body, updatedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function moveTable(req, res) {
  try {
    const result = await floorSvc.moveTable({ tableId: req.params.tableId, venueId: venueId(req), posX: req.body.posX, posY: req.body.posY, movedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function changeTableStatus(req, res) {
  try {
    const { actorId, actorRole } = actor(req)
    const result = await floorSvc.changeTableStatus({ tableId: req.params.tableId, venueId: venueId(req), tenantId: req.body.tenantId, newStatus: req.body.status, changedBy: actorId, changedByRole: actorRole, reason: req.body.reason })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function listTables(req, res) {
  try {
    const result = await floorSvc.listTables({ venueId: venueId(req), sectionId: req.query.sectionId, mapId: req.query.mapId, status: req.query.status, includeInactive: req.query.includeInactive === 'true' })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function getTable(req, res) {
  try {
    const result = await floorSvc.getTable({ tableId: req.params.tableId, venueId: venueId(req) })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Server Assignment ─────────────────────────────────────────────────────────

export async function assignServer(req, res) {
  try {
    const result = await floorSvc.assignServer({ venueId: venueId(req), ...req.body, assignedBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function getServerAssignments(req, res) {
  try {
    const result = await floorSvc.getServerAssignments({ venueId: venueId(req), serverId: req.query.serverId, tableId: req.query.tableId, sectionId: req.query.sectionId, activeOnly: req.query.activeOnly !== 'false' })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Transfer ──────────────────────────────────────────────────────────────────

export async function transferTable(req, res) {
  try {
    const result = await floorSvc.transferTable({ venueId: venueId(req), ...req.body, transferredBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Merge / Split ─────────────────────────────────────────────────────────────

export async function mergeTables(req, res) {
  try {
    const result = await floorSvc.mergeTables({ venueId: venueId(req), ...req.body, mergedBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function splitTable(req, res) {
  try {
    const result = await floorSvc.splitTable({ venueId: venueId(req), ...req.body, splitBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Guest Links ───────────────────────────────────────────────────────────────

export async function linkGuest(req, res) {
  try {
    const result = await floorSvc.linkGuest({ venueId: venueId(req), ...req.body, seatedBy: actor(req).actorId })
    res.status(result.ok ? 201 : 503).json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function unlinkGuest(req, res) {
  try {
    const result = await floorSvc.unlinkGuest({ linkId: req.params.linkId, venueId: venueId(req), departedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function linkReservation(req, res) {
  try {
    const result = await floorSvc.linkReservation({ venueId: venueId(req), tableId: req.params.tableId, reservationId: req.body.reservationId, linkedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function linkWaitlist(req, res) {
  try {
    const result = await floorSvc.linkWaitlist({ venueId: venueId(req), tableId: req.params.tableId, waitlistId: req.body.waitlistId, linkedBy: actor(req).actorId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Intelligence ──────────────────────────────────────────────────────────────

export async function getTableIntelligence(req, res) {
  try {
    const result = await floorSvc.getTableIntelligence({ tableId: req.params.tableId, venueId: venueId(req) })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

// ── Floor State ───────────────────────────────────────────────────────────────

export async function getFloorState(req, res) {
  try {
    const result = await floorSvc.getFloorState({ venueId: venueId(req), mapId: req.query.mapId })
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}

export async function syncFloorState(req, res) {
  try {
    const result = await floorSvc.getFloorState({ venueId: venueId(req), mapId: req.body?.mapId })
    res.json({ ...result, synced: true })
  } catch (err) { res.status(500).json({ ok: false, error: err.message }) }
}
