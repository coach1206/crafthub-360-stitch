/**
 * Station Config Service
 * Manages KDS station profiles, mappings, and routing rules.
 * Dual-mode: postgres when DATABASE_URL available, in-memory otherwise.
 */

const stationStore  = new Map()  // venueId → [stations]
const mappingStore  = new Map()  // venueId → [mappings]
const ruleStore     = new Map()  // venueId → [rules]

const DEFAULT_PREVIEW_STATIONS = [
  { stationType: 'kitchen',        stationName: 'Kitchen',          acceptsCategories: ['food','tasting_flight'] },
  { stationType: 'bar',            stationName: 'Bar',              acceptsCategories: ['alcohol','beverage'] },
  { stationType: 'humidor',        stationName: 'Humidor',          acceptsCategories: ['cigar','tobacco'] },
  { stationType: 'partner_window', stationName: 'Partner Window',   acceptsCategories: [] },
  { stationType: 'expo',           stationName: 'Expo',             acceptsCategories: [] },
  { stationType: 'service_runner', stationName: 'Service Runner',   acceptsCategories: [] },
  { stationType: 'patio_runner',   stationName: 'Patio Runner',     acceptsCategories: [] },
  { stationType: 'pickup_handoff', stationName: 'Pickup Handoff',   acceptsCategories: [] },
  { stationType: 'delivery_handoff', stationName: 'Delivery Handoff', acceptsCategories: [] },
]

function generateId() {
  return `sta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function getVenueStations(venueId, db = null) {
  if (db) {
    try {
      const { rows } = await db.query('SELECT * FROM kds_station_profiles WHERE venue_id = $1 ORDER BY display_priority', [venueId])
      if (rows.length > 0) return { ok: true, venueId, stations: rows, count: rows.length, storageMode: 'postgres' }
    } catch { /* fall through */ }
  }
  const stations = stationStore.get(venueId) ?? []
  if (stations.length === 0) {
    return {
      ok: true,
      venueId,
      stations: DEFAULT_PREVIEW_STATIONS.map((s, i) => ({
        stationId: `preview_${s.stationType}`,
        venueId,
        ...s,
        stationStatus: 'station_config_required',
        routingMode: 'routing_preview',
        displayPriority: i,
        previewOnly: true,
      })),
      count: DEFAULT_PREVIEW_STATIONS.length,
      storageMode: 'memory_fallback',
      stationConfigStatus: 'station_config_required',
      message: 'Using preview station templates. Configure venue stations for production routing.',
    }
  }
  return { ok: true, venueId, stations, count: stations.length, storageMode: 'memory_fallback' }
}

export async function getStationProfile(venueId, stationId, db = null) {
  const stations = stationStore.get(venueId) ?? []
  const station = stations.find(s => s.stationId === stationId)
  if (!station) return { ok: false, reason: 'station_config_required', stationId, venueId }
  return { ok: true, station, storageMode: 'memory_fallback' }
}

export async function createOrUpdateStationProfile(venueId, payload, db = null) {
  const now = new Date().toISOString()
  const stationId = payload.stationId ?? generateId()
  const station = {
    stationId,
    venueId,
    stationName:       payload.stationName ?? payload.station_type ?? 'unnamed',
    stationType:       payload.stationType ?? payload.station_type ?? 'custom',
    stationStatus:     payload.stationStatus ?? 'station_config_required',
    routingMode:       'routing_preview',
    acceptsCategories: payload.acceptsCategories ?? [],
    displayPriority:   payload.displayPriority ?? 0,
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  }
  const stations = stationStore.get(venueId) ?? []
  const idx = stations.findIndex(s => s.stationId === stationId)
  if (idx >= 0) stations[idx] = station; else stations.push(station)
  stationStore.set(venueId, stations)
  return { ok: true, station, storageMode: 'memory_fallback', syncMode: 'preview_fallback' }
}

export async function getStationMappings(venueId, db = null) {
  const mappings = mappingStore.get(venueId) ?? []
  if (mappings.length === 0) {
    return { ok: true, venueId, mappings: [], count: 0, storageMode: 'memory_fallback', mappingStatus: 'station_mapping_required' }
  }
  return { ok: true, venueId, mappings, count: mappings.length, storageMode: 'memory_fallback' }
}

export async function createOrUpdateStationMapping(venueId, payload, db = null) {
  const now = new Date().toISOString()
  const mappingId = payload.mappingId ?? generateId()
  const mapping = {
    mappingId,
    venueId,
    stationId:       payload.stationId ?? null,
    itemCategory:    payload.itemCategory,
    fulfillmentOwner: payload.fulfillmentOwner ?? 'venue',
    partnerId:       payload.partnerId ?? null,
    mappingStatus:   'station_mapping_required',
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  }
  const mappings = mappingStore.get(venueId) ?? []
  const idx = mappings.findIndex(m => m.mappingId === mappingId)
  if (idx >= 0) mappings[idx] = mapping; else mappings.push(mapping)
  mappingStore.set(venueId, mappings)
  return { ok: true, mapping, storageMode: 'memory_fallback' }
}

export async function getRoutingRules(venueId, db = null) {
  const rules = ruleStore.get(venueId) ?? []
  if (rules.length === 0) {
    return { ok: true, venueId, rules: [], count: 0, storageMode: 'memory_fallback', ruleStatus: 'routing_rule_required' }
  }
  return { ok: true, venueId, rules, count: rules.length, storageMode: 'memory_fallback' }
}

export async function createOrUpdateRoutingRule(venueId, payload, db = null) {
  const now = new Date().toISOString()
  const ruleId = payload.ruleId ?? generateId()
  const rule = {
    ruleId,
    venueId,
    ruleName:     payload.ruleName,
    itemCategory: payload.itemCategory,
    orderType:    payload.orderType ?? 'venue_order',
    stationType:  payload.stationType,
    priority:     payload.priority ?? 0,
    ruleStatus:   'routing_rule_required',
    conditions:   payload.conditions ?? {},
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  }
  const rules = ruleStore.get(venueId) ?? []
  const idx = rules.findIndex(r => r.ruleId === ruleId)
  if (idx >= 0) rules[idx] = rule; else rules.push(rule)
  ruleStore.set(venueId, rules)
  return { ok: true, rule, storageMode: 'memory_fallback' }
}

export async function getStationConfigReadiness(venueId, db = null) {
  const stationsResult = await getVenueStations(venueId, db)
  const mappingsResult = await getStationMappings(venueId, db)
  const rulesResult    = await getRoutingRules(venueId, db)

  const blockers = []
  if (!stationsResult.stations?.some(s => s.stationStatus !== 'station_config_required')) {
    blockers.push({ type: 'station_config_required', severity: 'warning' })
  }
  if (mappingsResult.mappingStatus === 'station_mapping_required') {
    blockers.push({ type: 'station_mapping_required', severity: 'warning' })
  }
  if (rulesResult.ruleStatus === 'routing_rule_required') {
    blockers.push({ type: 'routing_rule_required', severity: 'info' })
  }
  if (!process.env.DATABASE_URL) {
    blockers.push({ type: 'database_required', severity: 'warning' })
  }

  return {
    ok: true,
    venueId,
    stationCount:  stationsResult.count,
    mappingCount:  mappingsResult.count,
    ruleCount:     rulesResult.count,
    blockers,
    routingMode:   'routing_preview',
    kdsStatus:     'kds_routing_pending',
    storageMode:   stationsResult.storageMode,
  }
}
