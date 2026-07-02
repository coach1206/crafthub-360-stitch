/**
 * Station Health Engine
 * Preview-safe health tracking for KDS stations.
 * Does not claim a station is confirmed live without integration proof.
 */

const healthStore = new Map()  // `${venueId}::${stationId}` → healthRecord

export function getStationHealth(venueId, stationId) {
  const key    = `${venueId}::${stationId}`
  const record = healthStore.get(key)
  if (!record) {
    return {
      ok: true,
      venueId,
      stationId,
      healthStatus: 'station_unavailable',
      routingMode: 'routing_preview',
      lastSeenAt: null,
      message: 'No live KDS device connected. Station health is preview-only.',
      storageMode: 'memory_fallback',
    }
  }
  return { ok: true, venueId, stationId, ...record, storageMode: 'memory_fallback' }
}

export function getVenueStationHealth(venueId) {
  const entries = [...healthStore.entries()]
    .filter(([k]) => k.startsWith(`${venueId}::`))
    .map(([k, v]) => ({ stationId: k.split('::')[1], ...v }))

  if (entries.length === 0) {
    return {
      ok: true,
      venueId,
      stations: [],
      overallHealthStatus: 'station_unavailable',
      routingMode: 'routing_preview',
      message: 'No KDS stations reporting health. All stations unavailable.',
      storageMode: 'memory_fallback',
    }
  }

  const allUnavailable = entries.every(e => e.healthStatus === 'station_unavailable')
  return {
    ok: true,
    venueId,
    stations: entries,
    overallHealthStatus: allUnavailable ? 'station_unavailable' : 'routing_preview',
    routingMode: 'routing_preview',
    storageMode: 'memory_fallback',
  }
}

export function updateStationHealthPreview(venueId, stationId, payload) {
  const key = `${venueId}::${stationId}`
  const record = {
    venueId,
    stationId,
    healthStatus: payload.healthStatus ?? 'station_unavailable',
    lastSeenAt:   payload.lastSeenAt ?? new Date().toISOString(),
    details:      payload.details ?? {},
    routingMode:  'routing_preview',
    updatedAt:    new Date().toISOString(),
  }
  healthStore.set(key, record)
  return { ok: true, venueId, stationId, health: record, storageMode: 'memory_fallback' }
}

export function getUnavailableStations(venueId) {
  const health = getVenueStationHealth(venueId)
  const unavailable = (health.stations ?? []).filter(s => s.healthStatus === 'station_unavailable')
  return { ok: true, venueId, unavailableStations: unavailable, count: unavailable.length, storageMode: 'memory_fallback' }
}

export function getStationHealthReadiness(venueId) {
  const health = getVenueStationHealth(venueId)
  const blockers = []
  if (health.overallHealthStatus === 'station_unavailable') {
    blockers.push({ type: 'station_unavailable', severity: 'warning', message: 'No live KDS stations connected. Routing in preview mode.' })
  }
  blockers.push({ type: 'kds_routing_pending', severity: 'info', message: 'KDS routing pending live station integration.' })
  return {
    ok: true,
    venueId,
    overallHealthStatus: health.overallHealthStatus,
    blockers,
    routingMode: 'routing_preview',
    kdsStatus:   'kds_routing_pending',
    storageMode: 'memory_fallback',
  }
}
