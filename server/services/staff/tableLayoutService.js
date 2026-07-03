/**
 * Table Layout Service
 * Manages venue tables and drag/drop-ready layout positions in preview-safe mode.
 * Does not claim live layout saved unless database proof exists.
 */

import { v4 as uuidv4 } from 'uuid'

const TABLE_STORE    = new Map()
const POSITION_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export function getVenueTables(venueId) {
  const tables = []
  for (const t of TABLE_STORE.values()) {
    if (t.venue_id === venueId) tables.push(t)
  }
  return {
    ok: true, tables, count: tables.length,
    tableLayoutStatus: 'table_layout_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getTable(venueId, tableId) {
  const table = TABLE_STORE.get(tableId)
  if (!table || table.venue_id !== venueId) return { ok: false, tableStatus: 'table_not_found' }
  return { ok: true, table, tableStatus: table.table_status }
}

export function createOrUpdateTable(venueId, payload = {}) {
  if (!payload.table_name) return { ok: false, error: 'table_name is required' }
  const existing = payload.table_id ? TABLE_STORE.get(payload.table_id) : null
  const table = {
    table_id:     existing?.table_id ?? uuidv4(),
    venue_id:     venueId,
    section_id:   payload.section_id ?? null,
    table_name:   payload.table_name,
    table_type:   payload.table_type ?? 'standard',
    seat_count:   payload.seat_count ?? 2,
    table_status: payload.table_status ?? 'table_assignment_pending',
    server_id:    payload.server_id ?? null,
    metadata:     payload.metadata ?? {},
    created_at:   existing?.created_at ?? now(),
    updated_at:   now(),
  }
  TABLE_STORE.set(table.table_id, table)
  return {
    ok: true, table,
    tableLayoutStatus: 'table_layout_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function assignTableToSection(venueId, tableId, sectionId, actorContext = {}) {
  const table = TABLE_STORE.get(tableId)
  if (!table || table.venue_id !== venueId) return { ok: false, tableStatus: 'table_not_found' }
  table.section_id = sectionId
  table.updated_at = now()
  return {
    ok: true, table,
    tableLayoutStatus: 'table_layout_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function updateTableLayoutPosition(venueId, tableId, positionPayload = {}) {
  const table = TABLE_STORE.get(tableId)
  if (!table || table.venue_id !== venueId) return { ok: false, tableStatus: 'table_not_found' }

  const posKey = `${venueId}:${tableId}`
  const existing = POSITION_STORE.get(posKey)
  const position = {
    layout_position_id: existing?.layout_position_id ?? uuidv4(),
    venue_id:           venueId,
    section_id:         positionPayload.section_id ?? table.section_id ?? null,
    table_id:           tableId,
    x_position:         positionPayload.x_position ?? existing?.x_position ?? 0,
    y_position:         positionPayload.y_position ?? existing?.y_position ?? 0,
    width:              positionPayload.width ?? existing?.width ?? 100,
    height:             positionPayload.height ?? existing?.height ?? 80,
    rotation:           positionPayload.rotation ?? existing?.rotation ?? 0,
    layout_status:      'floor_layout_preview',
    device_mode:        positionPayload.device_mode ?? 'tablet',
    metadata:           positionPayload.metadata ?? {},
    created_at:         existing?.created_at ?? now(),
    updated_at:         now(),
  }
  POSITION_STORE.set(posKey, position)
  return {
    ok: true, position,
    layoutStatus:      'floor_layout_preview',
    layoutNote:        'Layout position updated in preview mode. Not persisted to database.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getTableLayout(venueId, filters = {}) {
  const tables = []
  for (const t of TABLE_STORE.values()) {
    if (t.venue_id !== venueId) continue
    if (filters.section_id && t.section_id !== filters.section_id) continue
    const posKey = `${venueId}:${t.table_id}`
    tables.push({ ...t, position: POSITION_STORE.get(posKey) ?? null })
  }
  return {
    ok: true, tables, count: tables.length,
    floorLayoutStatus: 'floor_layout_preview',
    deviceMode:        filters.device_mode ?? 'tablet',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function buildLayoutPreview(venueId) {
  const { tables } = getTableLayout(venueId)
  return {
    ok: true, venueId,
    layoutPreview:     tables,
    floorLayoutStatus: 'floor_layout_preview',
    patioLayoutStatus: 'patio_layout_preview',
    tableCount:        tables.length,
    layoutNote:        'Floor layout is a preview. No live layout has been saved.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getTableLayoutReadiness(venueId) {
  const { tables } = getVenueTables(venueId)
  return {
    ok:                true,
    venueId,
    tableCount:        tables.length,
    tableLayoutStatus: 'table_layout_preview',
    floorLayoutStatus: 'floor_layout_preview',
    blockers:          tables.length === 0
      ? [{ type: 'no_tables_configured', severity: 'warning' }]
      : [],
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

// --- Layout helper functions ---

export function normalizeTablePosition(positionPayload = {}) {
  return {
    x_position:  Math.max(0, Math.round(positionPayload.x_position ?? 0)),
    y_position:  Math.max(0, Math.round(positionPayload.y_position ?? 0)),
    width:       Math.max(40, Math.round(positionPayload.width ?? 100)),
    height:      Math.max(30, Math.round(positionPayload.height ?? 80)),
    rotation:    ((positionPayload.rotation ?? 0) % 360 + 360) % 360,
    section_id:  positionPayload.section_id ?? null,
    device_mode: positionPayload.device_mode ?? 'tablet',
  }
}

export function validateTablePosition(positionPayload = {}) {
  const errors = []
  if (positionPayload.x_position < 0) errors.push({ type: 'section_boundary_warning', field: 'x_position', message: 'x_position cannot be negative' })
  if (positionPayload.y_position < 0) errors.push({ type: 'section_boundary_warning', field: 'y_position', message: 'y_position cannot be negative' })
  if ((positionPayload.width ?? 100) < 40) errors.push({ type: 'overlap_warning', field: 'width', message: 'width must be at least 40' })
  if ((positionPayload.height ?? 80) < 30) errors.push({ type: 'overlap_warning', field: 'height', message: 'height must be at least 30' })
  return { valid: errors.length === 0, errors }
}

export function validateLayoutBounds(positionPayload = {}, sectionBounds = {}) {
  const warnings = []
  const bw = sectionBounds.width  ?? 1200
  const bh = sectionBounds.height ?? 800
  const x = positionPayload.x_position ?? 0
  const y = positionPayload.y_position ?? 0
  const w = positionPayload.width ?? 100
  const h = positionPayload.height ?? 80
  if (x + w > bw) warnings.push({ type: 'section_boundary_warning', message: 'Table exceeds right boundary' })
  if (y + h > bh) warnings.push({ type: 'section_boundary_warning', message: 'Table exceeds bottom boundary' })
  return { withinBounds: warnings.length === 0, warnings }
}

export function detectTableOverlap(tablePosition, existingPositions = []) {
  const tx = tablePosition.x_position ?? 0
  const ty = tablePosition.y_position ?? 0
  const tw = tablePosition.width ?? 100
  const th = tablePosition.height ?? 80
  return existingPositions.filter(p => {
    if (p.table_id === tablePosition.table_id) return false
    const px = p.x_position ?? 0
    const py = p.y_position ?? 0
    const pw = p.width ?? 100
    const ph = p.height ?? 80
    return tx < px + pw && tx + tw > px && ty < py + ph && ty + th > py
  })
}

export function buildCollisionWarnings(tablePosition, existingPositions = []) {
  return detectTableOverlap(tablePosition, existingPositions).map(o => ({
    type: 'collision_warning', table_id: o.table_id, message: `Overlaps with table ${o.table_id?.slice(0,6)}`,
  }))
}

export function buildSectionBoundaryWarnings(tablePosition, sectionBounds = {}) {
  return validateLayoutBounds(tablePosition, sectionBounds).warnings
}

export function buildSnapGridPosition(positionPayload = {}, gridSize = 20) {
  return {
    ...normalizeTablePosition(positionPayload),
    x_position: Math.round((positionPayload.x_position ?? 0) / gridSize) * gridSize,
    y_position: Math.round((positionPayload.y_position ?? 0) / gridSize) * gridSize,
    snapStatus: 'snap_grid_ready',
    gridSize,
  }
}

export function buildLayoutChangePreview(venueId, tableId, positionPayload = {}) {
  const normalized = normalizeTablePosition(positionPayload)
  const posKey = `${venueId}:${tableId}`
  const existing = POSITION_STORE.get(posKey)
  const allPositions = [...POSITION_STORE.values()].map(p => ({ ...p }))
  const collisions = buildCollisionWarnings({ ...normalized, table_id: tableId }, allPositions)
  return {
    ok: true, venueId, tableId,
    proposedPosition:  normalized,
    previousPosition:  existing ?? null,
    collisionWarnings: collisions,
    layoutStatus:      'table_position_updated_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'layout_not_persisted',
  }
}

export function resetTableLayoutPreview(venueId, sectionId = null) {
  const keys = [...POSITION_STORE.keys()].filter(k => k.startsWith(`${venueId}:`))
  let count = 0
  for (const key of keys) {
    const pos = POSITION_STORE.get(key)
    if (sectionId && pos.section_id !== sectionId) continue
    POSITION_STORE.delete(key)
    count++
  }
  return {
    ok: true, venueId, sectionId,
    resetCount:        count,
    layoutStatus:      'floor_layout_preview',
    persistenceStatus: 'layout_not_persisted',
    resetNote:         'Layout reset to default positions in preview mode. Not persisted.',
  }
}

export function buildDefaultLayoutForSection(venueId, sectionId) {
  const tables = [...TABLE_STORE.values()].filter(t => t.venue_id === venueId && t.section_id === sectionId)
  const positions = tables.map((t, i) => ({
    layout_position_id: uuidv4(),
    venue_id:    venueId,
    section_id:  sectionId,
    table_id:    t.table_id,
    x_position:  (i % 4) * 160,
    y_position:  Math.floor(i / 4) * 120,
    width:       120,
    height:      80,
    rotation:    0,
    layout_status: 'floor_layout_preview',
    device_mode: 'tablet',
    metadata:    {},
    created_at:  now(),
    updated_at:  now(),
  }))
  positions.forEach(p => POSITION_STORE.set(`${venueId}:${p.table_id}`, p))
  return { ok: true, venueId, sectionId, positions, layoutStatus: 'floor_layout_preview', persistenceStatus: 'layout_not_persisted' }
}
