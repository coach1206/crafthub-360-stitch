/**
 * SmokeCraft Management Sync — real venue-scoped analytics (Package D).
 *
 * Decision: query smokecraft_management_sync_journeys/snapshots directly
 * (on-demand), not a new materialized aggregate table. Rationale (see
 * SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_ANALYTICS_MODEL.md): venue
 * journey volume is unproven and no background-job runner exists in
 * this codebase to keep a materialized table fresh — the same
 * conclusion already reached for `venue_insights` in the original
 * Package A schema design. No new migration was created.
 *
 * Minimum sample size: 5 completed journeys per venue per metric,
 * matching SMOKECRAFT_MANAGEMENT_SYNC_METRIC_DEFINITIONS.md.
 */
import { getDb } from '../../db/connection.js'

const MIN_SAMPLE_SIZE = 5
const MAX_RANGE_DAYS = 90

function suppressed(sampleSize) {
  return { value: null, availability: 'insufficient_data', sampleSize, threshold: MIN_SAMPLE_SIZE }
}

export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return { ok: false, error: 'date_range_required' }
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: false, error: 'invalid_date_range' }
  if (start > end) return { ok: false, error: 'invalid_date_range' }
  const days = (end - start) / (1000 * 60 * 60 * 24)
  if (days > MAX_RANGE_DAYS) return { ok: false, error: 'date_range_too_large', maxDays: MAX_RANGE_DAYS }
  return { ok: true, start, end }
}

/**
 * Real venue analytics summary — every value traces to a real row.
 * Never returns another venue's data (all queries are venue_id-scoped).
 * Never returns a guest_reference, snapshot feedback_text, or any other
 * identifiable field.
 */
export async function getVenueAnalyticsSummary(venueId, { startDate, endDate }) {
  const range = validateDateRange(startDate, endDate)
  if (!range.ok) return { ok: false, error: range.error, maxDays: range.maxDays }

  const db = getDb()
  if (!db) return { ok: false, error: 'database_unavailable' }

  // Journey counts (no sample-size suppression needed for a raw count —
  // only rankings/averages are suppressed).
  const counts = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed')  AS completed_count,
       COUNT(*) FILTER (WHERE status = 'in_progress') AS active_count,
       COUNT(*)                                        AS total_count
     FROM smokecraft_management_sync_journeys
     WHERE venue_id = $1 AND created_at BETWEEN $2 AND $3`,
    [venueId, range.start, range.end]
  )
  const completedCount = Number(counts.rows[0].completed_count)
  const activeCount = Number(counts.rows[0].active_count)
  const totalCount = Number(counts.rows[0].total_count)
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : null

  // Latest snapshot per completed journey (avoids double-counting a
  // journey that was snapshotted multiple times).
  const latestSnapshots = await db.query(
    `SELECT DISTINCT ON (s.journey_id) s.cigar_selection, s.pairing_selection, s.flavor_notes, s.rating
       FROM smokecraft_management_sync_snapshots s
       JOIN smokecraft_management_sync_journeys j ON j.journey_id = s.journey_id
      WHERE j.venue_id = $1 AND j.status = 'completed' AND j.created_at BETWEEN $2 AND $3
      ORDER BY s.journey_id, s.snapshot_version DESC`,
    [venueId, range.start, range.end]
  )
  const sampleSize = latestSnapshots.rows.length

  let cigarTrends = suppressed(sampleSize)
  let pairingTrends = suppressed(sampleSize)
  let flavorTrends = suppressed(sampleSize)
  let scorecardAverage = suppressed(sampleSize)

  if (sampleSize >= MIN_SAMPLE_SIZE) {
    const cigarCounts = {}
    const pairingCounts = {}
    const flavorCounts = {}
    let ratingSum = 0
    let ratingCount = 0
    for (const row of latestSnapshots.rows) {
      const cigarName = row.cigar_selection?.name
      if (cigarName) cigarCounts[cigarName] = (cigarCounts[cigarName] || 0) + 1
      const pairingRec = row.pairing_selection?.recommendation
      if (pairingRec) pairingCounts[pairingRec] = (pairingCounts[pairingRec] || 0) + 1
      const flavors = row.flavor_notes?.selectedFlavors || []
      for (const f of flavors) flavorCounts[f] = (flavorCounts[f] || 0) + 1
      if (typeof row.rating === 'number') { ratingSum += row.rating; ratingCount++ }
    }
    const topN = (counts, n = 5) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))
    cigarTrends = { value: topN(cigarCounts), availability: 'ok', sampleSize }
    pairingTrends = { value: topN(pairingCounts), availability: 'ok', sampleSize }
    flavorTrends = { value: topN(flavorCounts), availability: 'ok', sampleSize }
    scorecardAverage = ratingCount > 0
      ? { value: Math.round((ratingSum / ratingCount) * 100) / 100, availability: 'ok', sampleSize: ratingCount }
      : suppressed(sampleSize)
  }

  // Sync-health (this venue's own SmokeCraft Management Sync activity —
  // internal only, never an external-integration claim).
  const syncHealth = await db.query(
    `SELECT status, COUNT(*)::int AS c FROM smokecraft_management_sync_events WHERE venue_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY status`,
    [venueId, range.start, range.end]
  )
  const syncHealthByStatus = Object.fromEntries(syncHealth.rows.map(r => [r.status, r.c]))

  return {
    ok: true,
    venueId,
    dateRange: { startDate, endDate },
    completedJourneyCount: completedCount,
    activeJourneyCount: activeCount,
    completionRate: totalCount > 0 ? { value: completionRate, numerator: completedCount, denominator: totalCount } : { value: null, availability: 'insufficient_data' },
    cigarTrends,
    pairingTrends,
    flavorTrends,
    scorecardAverage,
    syncHealth: {
      pending: syncHealthByStatus.pending || 0,
      completed: syncHealthByStatus.completed || 0,
      failed: syncHealthByStatus.failed || 0,
    },
  }
}
