/**
 * Floor Section Service
 * Manages venue floor sections in preview-safe mode.
 * Does not claim persisted layout unless database proof exists.
 */

import { v4 as uuidv4 } from 'uuid'

const SECTION_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const DEFAULT_SECTION_TYPES = ['lounge', 'patio', 'bar', 'dining_room', 'humidor', 'vip', 'private_room', 'event_space', 'pickup_area', 'custom']

export function buildDefaultSections(venueId) {
  return [
    { section_type: 'lounge',       section_name: 'Main Lounge',    capacity: 40 },
    { section_type: 'patio',        section_name: 'Outdoor Patio',  capacity: 24 },
    { section_type: 'bar',          section_name: 'Bar',            capacity: 12 },
    { section_type: 'humidor',      section_name: 'Walk-In Humidor',capacity: 8  },
    { section_type: 'vip',          section_name: 'VIP Room',       capacity: 10 },
  ].map(s => ({
    section_id:     uuidv4(),
    venue_id:       venueId,
    section_name:   s.section_name,
    section_type:   s.section_type,
    section_status: 'section_layout_preview',
    capacity:       s.capacity,
    metadata:       {},
    created_at:     now(),
    updated_at:     now(),
  }))
}

export function getVenueSections(venueId) {
  const sections = []
  for (const s of SECTION_STORE.values()) {
    if (s.venue_id === venueId) sections.push(s)
  }
  if (sections.length === 0) {
    const defaults = buildDefaultSections(venueId)
    defaults.forEach(s => SECTION_STORE.set(s.section_id, s))
    return { ok: true, sections: defaults, sectionLayoutStatus: 'section_layout_preview', source: 'default_preview', persistenceStatus: 'not_persisted' }
  }
  return {
    ok: true, sections,
    sectionLayoutStatus: 'section_layout_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getSection(venueId, sectionId) {
  const section = SECTION_STORE.get(sectionId)
  if (!section || section.venue_id !== venueId) return { ok: false, sectionStatus: 'section_not_found' }
  return { ok: true, section, sectionLayoutStatus: section.section_status }
}

export function createOrUpdateSection(venueId, payload = {}) {
  if (!payload.section_name) return { ok: false, error: 'section_name is required' }
  if (payload.section_type && !DEFAULT_SECTION_TYPES.includes(payload.section_type))
    payload.section_type = 'custom'

  const existing = payload.section_id ? SECTION_STORE.get(payload.section_id) : null
  const section = {
    section_id:     existing?.section_id ?? uuidv4(),
    venue_id:       venueId,
    section_name:   payload.section_name,
    section_type:   payload.section_type ?? 'lounge',
    section_status: 'section_layout_preview',
    capacity:       payload.capacity ?? null,
    metadata:       payload.metadata ?? {},
    created_at:     existing?.created_at ?? now(),
    updated_at:     now(),
  }
  SECTION_STORE.set(section.section_id, section)
  return {
    ok: true, section,
    sectionLayoutStatus: 'section_layout_preview',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function archiveSectionPreview(venueId, sectionId, actorContext = {}) {
  const section = SECTION_STORE.get(sectionId)
  if (!section || section.venue_id !== venueId) return { ok: false, sectionStatus: 'section_not_found' }
  section.section_status = 'section_archived_preview'
  section.updated_at = now()
  return { ok: true, sectionId, sectionStatus: 'section_archived_preview', persistenceStatus: 'not_persisted' }
}

export function getSectionReadiness(venueId) {
  const { sections } = getVenueSections(venueId)
  return {
    ok:                   true,
    venueId,
    sectionCount:         sections.length,
    sectionLayoutStatus:  'section_layout_preview',
    blockers:             dbAvailable() ? [] : [{ type: 'database_required', severity: 'warning' }],
    persistenceStatus:    dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
