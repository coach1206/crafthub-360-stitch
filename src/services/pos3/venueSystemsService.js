/**
 * POS360 Phase 4.9 — local-first persistence for floor objects, venue theme,
 * image previews, inventory connections, network/device telemetry. All
 * state is local/demo: there is no venue-settings, image-storage, inventory
 * provider, or device-management backend connected yet.
 */
import { opsGet, opsSet } from '../shared/opsStorage.js'
import {
  FLOOR_OBJECT_TYPE_MAP, SEED_FLOOR_OBJECTS, DEFAULT_VENUE_THEME, THEME_PRESETS,
  INVENTORY_CONNECTIONS, NETWORK_STATUS, CONNECTED_DEVICES, VENUE_IMAGE_AREAS,
  SEED_FLOOR_PLANS, FLOOR_PLAN_AREA_MAP,
} from '../../data/pos360VenueSystems.js'

const K = {
  floorObjects: 'pos3:floorObjects',
  theme: 'pos3:venueTheme',
  images: 'pos3:venueImages',
  inventory: 'pos3:inventoryConnections',
  devices: 'pos3:connectedDevices',
  floorPlans: 'pos3:floorPlans',
  tablePositions: 'pos3:tablePositions',
}

function uid(prefix = 'FO') { return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}` }

// ── Floor Plans (multi-layout support) ──────────────────────────────────
// Local/demo persistence — floor plan changes are local until backend persistence is connected.
export function getFloorPlans() { return opsGet(K.floorPlans, SEED_FLOOR_PLANS) }

export function getActiveFloorPlan() {
  const plans = getFloorPlans()
  return plans.find((p) => p.active) || plans[0]
}

export function setActiveFloorPlan(id) {
  const next = getFloorPlans().map((p) => ({ ...p, active: p.id === id }))
  opsSet(K.floorPlans, next)
  return next
}

export function createFloorPlan(name, areaType = 'custom') {
  const plans = getFloorPlans()
  const plan = {
    id: uid('FP'), name: name || FLOOR_PLAN_AREA_MAP[areaType]?.label || 'New Layout', areaType,
    backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now(),
  }
  opsSet(K.floorPlans, [...plans, plan])
  return plan
}

export function duplicateFloorPlan(id) {
  const plans = getFloorPlans()
  const src = plans.find((p) => p.id === id)
  if (!src) return plans
  const copy = { ...src, id: uid('FP'), name: `${src.name} Copy`, active: false, createdAt: Date.now(), updatedAt: Date.now() }
  opsSet(K.floorPlans, [...plans, copy])
  // duplicate this plan's floor objects under the new floorPlanId
  const objects = getFloorObjects(id)
  const copiedObjects = objects.map((o) => ({ ...o, id: uid(), floorPlanId: copy.id }))
  saveFloorLayoutLocal([...getAllFloorObjects(), ...copiedObjects])
  return copy
}

export function renameFloorPlan(id, name) {
  const next = getFloorPlans().map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p))
  opsSet(K.floorPlans, next)
  return next
}

export function resetFloorPlan(id) {
  saveFloorLayoutLocal(getAllFloorObjects().filter((o) => o.floorPlanId !== id))
  const tp = { ...getAllTablePositions() }
  delete tp[id]
  opsSet(K.tablePositions, tp)
  const next = getFloorPlans().map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p))
  opsSet(K.floorPlans, next)
  return next
}

export function deleteFloorPlan(id) {
  saveFloorLayoutLocal(getAllFloorObjects().filter((o) => o.floorPlanId !== id))
  const next = getFloorPlans().filter((p) => p.id !== id)
  const stillHasActive = next.some((p) => p.active)
  if (!stillHasActive && next.length) next[0].active = true
  opsSet(K.floorPlans, next)
  return next
}

export function assignBackgroundToFloorPlan(id, dataUrlOrPath) {
  const next = getFloorPlans().map((p) => (p.id === id ? { ...p, backgroundImage: dataUrlOrPath, updatedAt: Date.now() } : p))
  opsSet(K.floorPlans, next)
  return next
}

export function lockFloorPlan(id, locked) {
  const next = getFloorPlans().map((p) => (p.id === id ? { ...p, locked, updatedAt: Date.now() } : p))
  opsSet(K.floorPlans, next)
  return next
}

export function touchFloorPlan(id) {
  const next = getFloorPlans().map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p))
  opsSet(K.floorPlans, next)
  return next
}

// ── Table position overrides per floor plan ──────────────────────────────
// Tables themselves live in pos3Service; this stores per-layout x/y overrides only, local/demo.
function getAllTablePositions() { return opsGet(K.tablePositions, {}) }
export function getTablePositions(floorPlanId) { return getAllTablePositions()[floorPlanId] || {} }
export function moveTablePosition(floorPlanId, tableId, x, y) {
  const all = getAllTablePositions()
  const forPlan = { ...(all[floorPlanId] || {}), [tableId]: { x, y } }
  const next = { ...all, [floorPlanId]: forPlan }
  opsSet(K.tablePositions, next)
  touchFloorPlan(floorPlanId)
  return forPlan
}

// ── Floor Objects (now scoped per floor plan) ────────────────────────────
function getAllFloorObjects() {
  return opsGet(K.floorObjects, SEED_FLOOR_OBJECTS.map((o) => ({ ...o, floorPlanId: 'FP-LOUNGE' })))
}
export function getFloorObjects(floorPlanId) {
  const all = getAllFloorObjects()
  if (!floorPlanId) return all
  return all.filter((o) => o.floorPlanId === floorPlanId)
}
export function saveFloorLayoutLocal(objects) { opsSet(K.floorObjects, objects); return objects }

export function addFloorObject(objectType, section, x = 50, y = 50, floorPlanId) {
  const def = FLOOR_OBJECT_TYPE_MAP[objectType]
  const plan = floorPlanId || getActiveFloorPlan()?.id
  const objects = getAllFloorObjects()
  const next = [...objects, {
    id: uid(), floorPlanId: plan, objectType, section, seats: def?.seats || 0, status: 'open',
    x, y, rotation: 0, locked: false, vip: !!def?.vip, lastUpdated: Date.now(),
  }]
  touchFloorPlan(plan)
  return saveFloorLayoutLocal(next)
}

export function updateFloorObjectType(id, objectType) {
  const def = FLOOR_OBJECT_TYPE_MAP[objectType]
  const objects = getFloorObjects().map((o) => (o.id === id
    ? { ...o, objectType, seats: def?.seats ?? o.seats, vip: !!def?.vip, lastUpdated: Date.now() }
    : o))
  return saveFloorLayoutLocal(objects)
}

export function moveFloorObject(id, x, y) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, x, y, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function duplicateFloorObject(id) {
  const objects = getFloorObjects()
  const src = objects.find((o) => o.id === id)
  if (!src) return objects
  const copy = { ...src, id: uid(), x: Math.min(94, (src.x || 0) + 6), y: Math.min(94, (src.y || 0) + 6), lastUpdated: Date.now() }
  return saveFloorLayoutLocal([...objects, copy])
}

export function rotateFloorObject(id, deg = 45) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, rotation: ((o.rotation || 0) + deg) % 360, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function resizeFloorObject(id, width, height) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, width, height, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function lockFloorObject(id, locked) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, locked, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function toggleFloorObjectVip(id) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, vip: !o.vip, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function assignStaffToFloorObject(id, staffName) {
  const objects = getFloorObjects().map((o) => (o.id === id ? { ...o, assignedStaff: staffName, lastUpdated: Date.now() } : o))
  return saveFloorLayoutLocal(objects)
}

export function deleteFloorObject(id) {
  return saveFloorLayoutLocal(getFloorObjects().filter((o) => o.id !== id))
}

// ── Venue Theme ──────────────────────────────────────────────────────────
export function getVenueTheme() { return opsGet(K.theme, DEFAULT_VENUE_THEME) }
export function updateVenueTheme(patch) {
  const next = { ...getVenueTheme(), ...patch }
  opsSet(K.theme, next)
  return next
}
export function previewVenueTheme(presetId) {
  return THEME_PRESETS.find((p) => p.id === presetId) || THEME_PRESETS[0]
}

// ── Venue Images ─────────────────────────────────────────────────────────
export function getVenueImages() { return opsGet(K.images, {}) }
export function uploadVenueImagePreview(areaId, dataUrl) {
  const images = { ...getVenueImages(), [areaId]: dataUrl }
  opsSet(K.images, images)
  return images
}
export function assignImageToVenueArea(areaId, dataUrl) { return uploadVenueImagePreview(areaId, dataUrl) }
export function removeVenueImage(areaId) {
  const images = { ...getVenueImages() }
  delete images[areaId]
  opsSet(K.images, images)
  return images
}
export function listVenueImageAreas() { return VENUE_IMAGE_AREAS }

// ── Inventory Connection ─────────────────────────────────────────────────
export function getInventoryConnections() { return opsGet(K.inventory, INVENTORY_CONNECTIONS) }
export function connectInventorySource(id) {
  const next = getInventoryConnections().map((c) => (c.id === id ? { ...c, connected: true, provider: c.provider === 'Not connected' ? 'Local Demo Provider' : c.provider } : c))
  opsSet(K.inventory, next)
  return next
}
export function mapInventoryCategory(id, provider) {
  const next = getInventoryConnections().map((c) => (c.id === id ? { ...c, provider } : c))
  opsSet(K.inventory, next)
  return next
}
export function calculateInventoryHealthScore() {
  const conns = getInventoryConnections()
  const connectedCount = conns.filter((c) => c.connected).length
  const lowStockTotal = conns.reduce((s, c) => s + (c.lowStock || 0), 0)
  const score = Math.max(0, Math.round((connectedCount / conns.length) * 100 - lowStockTotal * 3))
  return { score, connectedCount, total: conns.length, lowStockTotal }
}
export function generateLowStockAlerts() {
  return getInventoryConnections().filter((c) => c.connected && c.lowStock > 0)
    .map((c) => ({ source: c.label, count: c.lowStock, message: `${c.lowStock} item(s) low stock in ${c.label}` }))
}

// ── Network / Wi-Fi ──────────────────────────────────────────────────────
export function getNetworkHealth() { return NETWORK_STATUS }
export function generateNetworkAlerts() {
  const alerts = []
  getConnectedDevices().forEach((d) => {
    if (!d.online) alerts.push({ severity: 'high', message: `${d.name} (${d.role}) is offline` })
    else if (d.signal === 'weak') alerts.push({ severity: 'medium', message: `${d.name} (${d.role}) has a weak signal` })
  })
  return alerts
}

// ── Devices ──────────────────────────────────────────────────────────────
export function getConnectedDevices() { return opsGet(K.devices, CONNECTED_DEVICES) }
export function getDeviceHealth() {
  const devices = getConnectedDevices()
  return { online: devices.filter((d) => d.online).length, total: devices.length, weak: devices.filter((d) => d.signal === 'weak').length }
}
export function registerVenueDevice(device) {
  const next = [...getConnectedDevices(), { ...device, id: uid('D'), lastSync: 'just now' }]
  opsSet(K.devices, next)
  return next
}
export function updateDeviceStatus(id, patch) {
  const next = getConnectedDevices().map((d) => (d.id === id ? { ...d, ...patch } : d))
  opsSet(K.devices, next)
  return next
}
