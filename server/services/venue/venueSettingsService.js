/**
 * Venue Settings Service
 * Manages operating settings, POS preferences, partner specials, and staff policy.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const operatingSettingsStore = new Map()
const posPreferencesStore = new Map()
const partnerSpecialsStore = new Map()
const staffPolicyStore = new Map()

function defaultOperatingSettings(venueId) {
  return {
    venue_id: venueId,
    default_order_mode: 'manual_pos360',
    allow_customer_direct_order: true,
    allow_staff_assisted_order: true,
    require_staff_confirmation: true,
    require_manager_approval_for_partner_items: true,
    allow_trusted_staff_publish_specials: false,
    default_routing_mode: 'routing_preview',
    manual_mode_enabled: true,
    customer_visible_sync_status: false,
    staff_visible_sync_status: true,
  }
}

function defaultPOSPreferences(venueId) {
  return {
    venue_id: venueId,
    preferred_provider_name: 'manual_pos360',
    fallback_provider_name: 'manual_pos360',
    pos_connection_required: false,
    allow_manual_fallback: true,
    menu_sync_required: false,
    inventory_sync_required: false,
    order_push_required: false,
  }
}

function defaultPartnerSpecialsSettings(venueId) {
  return {
    venue_id: venueId,
    partner_specials_enabled: false,
    status: 'partner_specials_disabled',
    require_manager_approval: true,
    allow_partner_food: false,
    allow_partner_merch: false,
    allow_partner_events: false,
  }
}

function defaultStaffPolicy(venueId) {
  return {
    venue_id: venueId,
    manager_can_publish: true,
    owner_can_publish: true,
    admin_can_publish: true,
    bartender_can_suggest: true,
    cook_can_suggest: true,
    server_can_suggest: true,
    bartender_can_publish: false,
    cook_can_publish: false,
    server_can_publish: false,
    require_manager_approval_for_staff_specials: true,
    require_manager_approval_for_inventory_adjustments: true,
  }
}

async function dbGetOrDefault(table, venueId, defaultFn, storeName) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(`SELECT * FROM ${table} WHERE venue_id=$1 LIMIT 1`, [venueId])
      if (rows[0]) return { ok: true, data: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }
  const stored = storeName.get(venueId) ?? defaultFn(venueId)
  return { ok: true, data: stored, storageMode: 'memory_fallback' }
}

export async function getVenueOperatingSettings(venueId) {
  return dbGetOrDefault('venue_operating_settings', venueId, defaultOperatingSettings, operatingSettingsStore)
}

export async function updateVenueOperatingSettings(venueId, payload) {
  const existing = (await getVenueOperatingSettings(venueId)).data
  const updated = { ...existing, ...payload, venue_id: venueId, updated_at: new Date().toISOString() }
  operatingSettingsStore.set(venueId, updated)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_operating_settings (venue_id, default_order_mode, manual_mode_enabled,
           customer_visible_sync_status, staff_visible_sync_status,
           require_manager_approval_for_partner_items, allow_trusted_staff_publish_specials)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (venue_id) DO UPDATE SET
           default_order_mode=EXCLUDED.default_order_mode,
           manual_mode_enabled=EXCLUDED.manual_mode_enabled,
           updated_at=NOW()`,
        [venueId, updated.default_order_mode, updated.manual_mode_enabled,
         updated.customer_visible_sync_status, updated.staff_visible_sync_status,
         updated.require_manager_approval_for_partner_items,
         updated.allow_trusted_staff_publish_specials]
      )
      return { ok: true, data: updated, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  return { ok: true, data: updated, storageMode: 'memory_fallback' }
}

export async function getVenuePOSPreferences(venueId) {
  return dbGetOrDefault('venue_pos_preferences', venueId, defaultPOSPreferences, posPreferencesStore)
}

export async function updateVenuePOSPreferences(venueId, payload) {
  const existing = (await getVenuePOSPreferences(venueId)).data
  const updated = { ...existing, ...payload, venue_id: venueId, updated_at: new Date().toISOString() }
  posPreferencesStore.set(venueId, updated)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_pos_preferences (venue_id, preferred_provider_name, fallback_provider_name,
           allow_manual_fallback, pos_connection_required)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (venue_id) DO UPDATE SET
           preferred_provider_name=EXCLUDED.preferred_provider_name, updated_at=NOW()`,
        [venueId, updated.preferred_provider_name, updated.fallback_provider_name,
         updated.allow_manual_fallback, updated.pos_connection_required]
      )
      return { ok: true, data: updated, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  return { ok: true, data: updated, storageMode: 'memory_fallback' }
}

export async function getVenuePartnerSpecialsSettings(venueId) {
  return dbGetOrDefault('venue_partner_specials_settings', venueId, defaultPartnerSpecialsSettings, partnerSpecialsStore)
}

export async function updateVenuePartnerSpecialsSettings(venueId, payload) {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data
  const updated = { ...existing, ...payload, venue_id: venueId, updated_at: new Date().toISOString() }
  partnerSpecialsStore.set(venueId, updated)
  return { ok: true, data: updated, storageMode: 'memory_fallback' }
}

export async function getVenueStaffPolicySettings(venueId) {
  return dbGetOrDefault('venue_staff_policy_settings', venueId, defaultStaffPolicy, staffPolicyStore)
}

export async function updateVenueStaffPolicySettings(venueId, payload) {
  const existing = (await getVenueStaffPolicySettings(venueId)).data
  const updated = { ...existing, ...payload, venue_id: venueId, updated_at: new Date().toISOString() }
  staffPolicyStore.set(venueId, updated)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_staff_policy_settings (venue_id, manager_can_publish, owner_can_publish,
           admin_can_publish, bartender_can_publish, cook_can_publish, server_can_publish,
           require_manager_approval_for_staff_specials, require_manager_approval_for_inventory_adjustments)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (venue_id) DO UPDATE SET
           manager_can_publish=EXCLUDED.manager_can_publish, updated_at=NOW()`,
        [venueId, updated.manager_can_publish, updated.owner_can_publish,
         updated.admin_can_publish, updated.bartender_can_publish,
         updated.cook_can_publish, updated.server_can_publish,
         updated.require_manager_approval_for_staff_specials,
         updated.require_manager_approval_for_inventory_adjustments]
      )
      return { ok: true, data: updated, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  return { ok: true, data: updated, storageMode: 'memory_fallback' }
}

export async function getVenueFeatureMatrix(venueId) {
  const [ops, pos, ps, staff] = await Promise.all([
    getVenueOperatingSettings(venueId),
    getVenuePOSPreferences(venueId),
    getVenuePartnerSpecialsSettings(venueId),
    getVenueStaffPolicySettings(venueId),
  ])

  return {
    venueId,
    features: {
      manualPOS360: ops.data.manual_mode_enabled,
      customerDirectOrder: ops.data.allow_customer_direct_order,
      staffAssistedOrder: ops.data.allow_staff_assisted_order,
      preferredPOSProvider: pos.data.preferred_provider_name,
      manualFallbackEnabled: pos.data.allow_manual_fallback,
      partnerSpecialsEnabled: ps.data.partner_specials_enabled,
      partnerSpecialsStatus: ps.data.status,
      partnerFoodAllowed: ps.data.allow_partner_food,
      trustedStaffPublish: ops.data.allow_trusted_staff_publish_specials,
      managerApprovalRequired: ops.data.require_manager_approval_for_partner_items,
      customerSeesSync: ops.data.customer_visible_sync_status,
      staffSeesSync: ops.data.staff_visible_sync_status,
    },
    storageMode: ops.storageMode,
  }
}
