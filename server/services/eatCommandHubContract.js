/**
 * E.A.T. Command Hub Integration Contract
 *
 * Management hooks for Ticket Tapper Specials and Money Bridge.
 * This is a contract/service layer — the E.A.T. UI wires to these methods.
 *
 * Operates in preview mode when no database is available.
 */

import { resolveFeatureStatus, buildEnablePayload, defaultFeatureSettings, FEATURE_STATUSES } from '../../src/utils/venueFeatureSettings.js'
import { PROVIDER_STATUSES } from './posInventoryAdapter.js'
import { ROUTING_STATUSES } from './kitchenRoutingAdapter.js'

// In-memory stores (used when DB unavailable)
const venueFeatureStore = new Map()
const approvalQueueStore = new Map()

// ── Venue Feature: Partner Specials ──────────────────────────────────────────

export async function getVenueFeatureSettings(venueId, db = null) {
  if (db) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM venue_feature_settings WHERE venue_id = $1 LIMIT 1',
        [venueId]
      )
      if (rows[0]) return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  const stored = venueFeatureStore.get(venueId) ?? defaultFeatureSettings(venueId)
  return {
    ok: true,
    settings: resolveFeatureStatus(stored),
    storageMode: 'memory_fallback',
    syncMode: 'preview_fallback',
  }
}

export async function enableVenuePartnerSpecials(venueId, enabledBy, db = null) {
  const payload = buildEnablePayload({ venueId, enabledBy })

  if (db) {
    try {
      const { rows } = await db.query(
        `INSERT INTO venue_feature_settings
           (venue_id, ticket_tapper_partner_specials_enabled, enabled_at, trial_expires_at, status, enabled_by)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (venue_id) DO UPDATE SET
           ticket_tapper_partner_specials_enabled = EXCLUDED.ticket_tapper_partner_specials_enabled,
           enabled_at = EXCLUDED.enabled_at,
           trial_expires_at = EXCLUDED.trial_expires_at,
           status = EXCLUDED.status,
           enabled_by = EXCLUDED.enabled_by,
           updated_at = NOW()
         RETURNING *`,
        [venueId, true, payload.enabled_at, payload.trial_expires_at, payload.status, payload.enabled_by]
      )
      return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  venueFeatureStore.set(venueId, payload)
  return {
    ok: true,
    settings: resolveFeatureStatus(payload),
    storageMode: 'memory_fallback',
    syncMode: 'preview_fallback',
    message: 'Partner specials enabled locally. Not persisted — backend unavailable.',
  }
}

export async function requestCancellation(venueId, cancelledBy, db = null) {
  const now = new Date().toISOString()

  if (db) {
    try {
      const { rows } = await db.query(
        `UPDATE venue_feature_settings
         SET cancellation_requested_at = $1, status = $2, cancelled_by = $3, updated_at = NOW()
         WHERE venue_id = $4 RETURNING *`,
        [now, FEATURE_STATUSES.CANCELLATION_PENDING, cancelledBy, venueId]
      )
      if (rows[0]) return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  const stored = venueFeatureStore.get(venueId) ?? defaultFeatureSettings(venueId)
  const updated = { ...stored, cancellation_requested_at: now, status: FEATURE_STATUSES.CANCELLATION_PENDING, cancelled_by: cancelledBy }
  venueFeatureStore.set(venueId, updated)
  return {
    ok: true,
    settings: resolveFeatureStatus(updated),
    storageMode: 'memory_fallback',
    message: 'Cancellation requested locally. Not persisted.',
  }
}

// ── Approval Queue ────────────────────────────────────────────────────────────

export async function getApprovalQueueReport(venueId, specials = []) {
  const pending = specials.filter(s => s.approval?.status === 'pending_approval' || s.status === 'pending_approval')
  const approved = specials.filter(s => s.approval?.status === 'approved')
  const rejected = specials.filter(s => s.approval?.status === 'rejected')
  const live = specials.filter(s => s.status === 'active')

  return {
    ok: true,
    venueId,
    approvalQueue: {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      liveCount: live.length,
      pending,
      approved,
      rejected,
    },
  }
}

// ── Inventory Alerts ──────────────────────────────────────────────────────────

export function buildInventoryAlerts(inventoryItems = []) {
  return inventoryItems
    .filter(item => {
      const qty = item.quantityAvailable ?? item.available_quantity ?? 0
      const threshold = item.lowInventoryThreshold ?? item.low_stock_threshold ?? 3
      return qty <= 0 || qty <= threshold
    })
    .map(item => ({
      itemId: item.id ?? item.item_id,
      itemName: item.name ?? item.item_name,
      availableQuantity: item.quantityAvailable ?? item.available_quantity ?? 0,
      status: (item.quantityAvailable ?? item.available_quantity ?? 0) <= 0 ? 'sold_out' : 'low_stock',
      posyncStatus: item.posSyncStatus ?? PROVIDER_STATUSES.NOT_CONNECTED,
    }))
}

// ── Warnings ──────────────────────────────────────────────────────────────────

export function buildSystemWarnings({ taxStatus, posProviderStatus, kdsStatus, settlementStatus }) {
  const warnings = []

  if (!taxStatus || taxStatus === 'preview_only') {
    warnings.push({ type: 'tax_preview_warning', message: 'Tax is using preview rate only. Configure venue/state tax for compliance.' })
  }
  if (!posProviderStatus || posProviderStatus === PROVIDER_STATUSES.NOT_CONNECTED) {
    warnings.push({ type: 'pos_sync_warning', message: 'No POS provider connected. Inventory is preview only.' })
  }
  if (!kdsStatus || kdsStatus === ROUTING_STATUSES.ROUTING_PREVIEW || kdsStatus === ROUTING_STATUSES.ROUTED_PREVIEW_ONLY) {
    warnings.push({ type: 'kitchen_route_warning', message: 'No KDS connected. Kitchen routing is preview only.' })
  }
  if (!settlementStatus || settlementStatus === 'pending_preview' || settlementStatus === 'integration_required') {
    warnings.push({ type: 'settlement_warning', message: 'Partner settlement is pending. Payment processor not integrated.' })
  }

  return warnings
}

// ── POS360 Management Hooks ───────────────────────────────────────────────────

export async function getPOS360ReadinessHooks(venueId) {
  const { getVenuePOSReadiness } = await import('./pos360IntegrationHub.js')
  const { getEncryptionStatus } = await import('../utils/encryption.js')
  const { isDbAvailable } = await import('../db/connection.js')
  const { getItemMappings } = await import('./pos360ItemMappingService.js')
  const { getProviderHealth } = await import('./pos360ProviderHealthService.js')

  const encStatus = getEncryptionStatus()
  const dbReady = isDbAvailable()
  const posReadiness = await getVenuePOSReadiness(venueId)

  const hooks = []

  if (encStatus.status === 'encryption_key_required') {
    hooks.push({ type: 'encryption_key_required', severity: 'critical', message: 'ENCRYPTION_SECRET not set. Cannot store POS provider tokens.' })
  }
  if (!dbReady) {
    hooks.push({ type: 'database_required', severity: 'warning', message: 'DATABASE_URL not configured. POS data not persisted.' })
  }

  for (const [provider, status] of Object.entries(posReadiness.providers ?? {})) {
    if (provider === 'manual_pos360') continue
    if (status.connectionStatus === 'provider_not_connected' || status.connectionStatus === 'oauth_required' || status.connectionStatus === 'credentials_missing') {
      hooks.push({ type: 'provider_not_connected', severity: 'info', provider, message: `${provider}: ${status.connectionStatus}` })
    }
  }

  // Item mapping check for all known providers
  const providerNames = ['square', 'toast', 'clover', 'lightspeed', 'shopify_pos']
  for (const pname of providerNames) {
    const mappings = await getItemMappings(venueId, pname)
    const unmapped = (mappings.mappings ?? []).filter(m => m.mappingStatus === 'mapping_required')
    if (unmapped.length > 0) {
      hooks.push({ type: 'mapping_required', severity: 'warning', provider: pname, unmappedCount: unmapped.length, message: `${unmapped.length} items need mapping for ${pname}.` })
    }
  }

  // Manual mode always available
  hooks.push({ type: 'manual_mode_available', severity: 'info', message: 'manual_pos360 fallback available for venues without POS connection.' })

  return {
    ok: true,
    venueId,
    posHooks: hooks,
    manualModeAvailable: true,
    databaseStatus: dbReady ? 'available' : 'database_required',
    encryptionStatus: encStatus.status,
    tenantGuardStatus: 'tenant_guard_active',
  }
}
