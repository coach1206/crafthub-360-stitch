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
