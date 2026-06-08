/**
 * pos3AutoSyncService — Phase 9.5
 * Handles automatic and manual POS 3 provider data sync.
 * Runs initial sync on startup, then every POS3_SYNC_INTERVAL_MS.
 * Logs every run to pos3_sync_runs table.
 * Never exposes provider credentials.
 * Never blocks server startup.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { getProvider, fetchFromProvider } from './pos3IntegrationService.js'

const SYNC_INTERVAL_MS  = parseInt(process.env.POS3_SYNC_INTERVAL_MS || '300000', 10) // 5 min
const DEFAULT_PROVIDER  = 'prototype'

let _intervalHandle = null
let _running        = false
let _lastResult     = null
let _startupDone    = false

// ── Internal helpers ──────────────────────────────────────────

async function _openSyncRun(providerKey, syncType) {
  if (!isDbAvailable()) return null
  try {
    const res = await query(
      `INSERT INTO pos3_sync_runs
         (provider_key, sync_type, status, started_at)
       VALUES ($1, $2, 'started', NOW())
       RETURNING id`,
      [providerKey, syncType]
    )
    return res.rows[0]?.id ?? null
  } catch (err) {
    console.error('[POS3Sync] Failed to open sync run log:', err.message)
    return null
  }
}

async function _closeSyncRun(runId, status, counts = {}, durationMs = 0, errorMsg = null) {
  if (!runId) return
  try {
    await query(
      `UPDATE pos3_sync_runs
       SET status          = $1,
           orders_count    = $2,
           inventory_count = $3,
           tables_count    = $4,
           staff_count     = $5,
           finished_at     = NOW(),
           duration_ms     = $6,
           error_message   = $7
       WHERE id = $8`,
      [
        status,
        counts.orders    ?? null,
        counts.inventory ?? null,
        counts.tables    ?? null,
        counts.staff     ?? null,
        durationMs,
        errorMsg         ?? null,
        runId,
      ]
    )
  } catch (err) {
    console.error('[POS3Sync] Failed to close sync run log:', err.message)
  }
}

// ── Core sync logic ───────────────────────────────────────────

async function _doSync(providerKey = DEFAULT_PROVIDER, syncType = 'auto') {
  if (_running) {
    console.log('[POS3Sync] Sync already in progress — skipping.')
    return { skipped: true }
  }
  _running = true
  const startedAt = Date.now()
  const runId = await _openSyncRun(providerKey, syncType)

  let status    = 'failed'
  let counts    = {}
  let errorMsg  = null

  try {
    const adapter = getProvider(providerKey)
    if (!adapter) {
      throw new Error(`Provider "${providerKey}" not found.`)
    }

    const [ordersRes, inventoryRes, tablesRes, staffRes] = await Promise.allSettled([
      fetchFromProvider(providerKey, 'fetchActiveOrders'),
      fetchFromProvider(providerKey, 'fetchInventory'),
      fetchFromProvider(providerKey, 'fetchTables'),
      fetchFromProvider(providerKey, 'fetchStaff'),
    ])

    counts.orders    = ordersRes.status    === 'fulfilled' ? (ordersRes.value?.orders?.length    ?? 0) : 0
    counts.inventory = inventoryRes.status === 'fulfilled' ? (inventoryRes.value?.inventory?.length ?? 0) : 0
    counts.tables    = tablesRes.status    === 'fulfilled' ? (tablesRes.value?.tables?.length    ?? 0) : 0
    counts.staff     = staffRes.status     === 'fulfilled' ? (staffRes.value?.staff?.length      ?? 0) : 0

    const allOk = [ordersRes, inventoryRes, tablesRes, staffRes].every(r => r.status === 'fulfilled')
    status = allOk ? 'success' : 'partial'

    console.log(
      `[POS3Sync] Sync complete — provider:${providerKey} status:${status}`,
      `orders:${counts.orders} inventory:${counts.inventory}`,
      `tables:${counts.tables} staff:${counts.staff}`
    )
  } catch (err) {
    status   = 'failed'
    errorMsg = err.message ?? 'Unknown error'
    console.error(`[POS3Sync] Sync failed for "${providerKey}":`, errorMsg)
  } finally {
    _running = false
    const durationMs = Date.now() - startedAt
    await _closeSyncRun(runId, status, counts, durationMs, errorMsg)

    _lastResult = {
      providerKey,
      syncType,
      status,
      counts,
      durationMs,
      errorMsg,
      timestamp: new Date().toISOString(),
    }
  }

  return _lastResult
}

// ── Public API ────────────────────────────────────────────────

export async function runPOS3SyncNow(providerKey = DEFAULT_PROVIDER, syncType = 'manual') {
  return _doSync(providerKey, syncType)
}

export function startPOS3AutoSync(providerKey = DEFAULT_PROVIDER) {
  if (_intervalHandle) {
    console.log('[POS3Sync] Auto-sync already started.')
    return
  }

  // Initial sync on startup (non-blocking)
  if (!_startupDone) {
    _startupDone = true
    setImmediate(async () => {
      console.log('[POS3Sync] Running startup sync for provider:', providerKey)
      await _doSync(providerKey, 'startup').catch(err => {
        console.error('[POS3Sync] Startup sync error (non-fatal):', err.message)
      })
    })
  }

  // Recurring interval
  _intervalHandle = setInterval(async () => {
    console.log('[POS3Sync] Running scheduled auto-sync for provider:', providerKey)
    await _doSync(providerKey, 'auto').catch(err => {
      console.error('[POS3Sync] Auto-sync interval error (non-fatal):', err.message)
    })
  }, SYNC_INTERVAL_MS)

  console.log(`[POS3Sync] Auto-sync started. Interval: ${SYNC_INTERVAL_MS / 1000}s`)
}

export function stopPOS3AutoSync() {
  if (_intervalHandle) {
    clearInterval(_intervalHandle)
    _intervalHandle = null
    console.log('[POS3Sync] Auto-sync stopped.')
  }
}

export function getPOS3SyncStatus() {
  return {
    running:       _running,
    autoSyncActive: _intervalHandle !== null,
    intervalMs:    SYNC_INTERVAL_MS,
    lastResult:    _lastResult,
    startupDone:   _startupDone,
  }
}

export async function getPOS3SyncHistory(limit = 20) {
  if (!isDbAvailable()) return []
  try {
    const res = await query(
      `SELECT id, provider_key, sync_type, status,
              orders_count, inventory_count, tables_count, staff_count,
              started_at, finished_at, duration_ms, error_message
       FROM pos3_sync_runs
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    )
    return res.rows
  } catch (err) {
    console.error('[POS3Sync] Failed to fetch sync history:', err.message)
    return []
  }
}
