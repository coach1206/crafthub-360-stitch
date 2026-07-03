/**
 * DMRC — Vendor Connection Service
 * Registry of distributors, manufacturers, wholesalers, brand partners.
 * Does not claim live API connections unless proven.
 */

import { v4 as uuidv4 } from 'uuid'

const VENDOR_STORE = new Map()
const dbAvailable  = () => !!process.env.DATABASE_URL
const now          = () => new Date().toISOString()

export const VENDOR_TYPES   = ['distributor','manufacturer','wholesaler','brand_partner','broker','local_supplier','marketplace','internal_warehouse']
export const REORDER_METHODS = ['api','email','manual_export','csv_export','pdf_purchase_order','phone_required','preview_only']
export const VENDOR_CONNECTION_STATUSES = ['connected','disconnected','pending_setup','api_required','credentials_required','vendor_approval_required','unsupported_vendor','email_order_only','manual_export_only','preview_only']

export function registerVendor(venueId, payload = {}) {
  if (!payload.vendor_name) return { ok: false, error: 'vendor_name required' }
  const vendorId = payload.vendor_id ?? uuidv4()
  const vendor = {
    vendor_id:              vendorId,
    venue_id:               venueId,
    vendor_type:            VENDOR_TYPES.includes(payload.vendor_type) ? payload.vendor_type : 'distributor',
    vendor_name:            payload.vendor_name,
    vendor_display_name:    payload.vendor_display_name ?? payload.vendor_name,
    vendor_category:        payload.vendor_category ?? 'general',
    craft_modules_supported: payload.craft_modules_supported ?? [],
    contact_name:           payload.contact_name ?? null,
    contact_email:          payload.contact_email ?? null,
    contact_phone:          payload.contact_phone ?? null,
    order_email:            payload.order_email ?? null,
    api_base_url:           payload.api_base_url ?? null,
    api_connection_status:  payload.api_base_url ? 'api_required' : 'pending_setup',
    api_credential_status:  'credentials_required',
    preferred_vendor:       payload.preferred_vendor ?? false,
    backup_vendor:          payload.backup_vendor ?? false,
    minimum_order_amount:   payload.minimum_order_amount ?? 0,
    minimum_order_quantity: payload.minimum_order_quantity ?? 1,
    case_pack_rules:        payload.case_pack_rules ?? {},
    lead_time_days:         payload.lead_time_days ?? 3,
    shipping_region:        payload.shipping_region ?? null,
    reorder_method:         REORDER_METHODS.includes(payload.reorder_method) ? payload.reorder_method : 'preview_only',
    active:                 payload.active ?? true,
    approved_by_venue:      payload.approved_by_venue ?? false,
    approved_by_owner:      payload.approved_by_owner ?? false,
    last_sync_at:           null,
    metadata:               payload.metadata ?? {},
    created_at:             now(),
    updated_at:             now(),
  }
  VENDOR_STORE.set(vendorId, vendor)
  return {
    ok: true, vendor,
    connectionStatus:  vendor.api_connection_status,
    reorderMethod:     vendor.reorder_method,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getVendor(vendorId) {
  const vendor = VENDOR_STORE.get(vendorId)
  if (!vendor) return { ok: false, error: 'vendor_not_found', connectionStatus: 'pending_setup' }
  return { ok: true, vendor, connectionStatus: vendor.api_connection_status }
}

export function listVenueVendors(venueId, filters = {}) {
  const vendors = []
  for (const v of VENDOR_STORE.values()) {
    if (v.venue_id !== venueId) continue
    if (filters.vendor_type && v.vendor_type !== filters.vendor_type) continue
    if (filters.active !== undefined && v.active !== filters.active) continue
    vendors.push(v)
  }
  return { ok: true, vendors, count: vendors.length, venueId }
}

export function getPreferredVendorsForProduct(venueId, productId) {
  const preferred = [], backup = []
  for (const v of VENDOR_STORE.values()) {
    if (v.venue_id !== venueId || !v.active) continue
    if (v.preferred_vendor) preferred.push(v)
    else if (v.backup_vendor) backup.push(v)
  }
  return {
    ok: true, productId, venueId,
    preferredVendors: preferred,
    backupVendors:    backup,
    hasLiveConnection: preferred.some(v => v.api_connection_status === 'connected') || backup.some(v => v.api_connection_status === 'connected'),
    connectionStatus:  preferred.length === 0 ? 'distributor_connection_required' : preferred[0].api_connection_status,
  }
}

export function getVendorConnectionReadiness(venueId) {
  const vendors = listVenueVendors(venueId).vendors
  const connected    = vendors.filter(v => v.api_connection_status === 'connected').length
  const distributors = vendors.filter(v => v.vendor_type === 'distributor').length
  const manufacturers = vendors.filter(v => v.vendor_type === 'manufacturer').length
  const blockers = []
  if (distributors === 0)  blockers.push({ type: 'distributor_connection_required', severity: 'info' })
  if (manufacturers === 0) blockers.push({ type: 'manufacturer_connection_required', severity: 'info' })
  if (!dbAvailable())      blockers.push({ type: 'database_required', severity: 'warning' })
  return {
    ok:                  true,
    venueId,
    vendorCount:         vendors.length,
    connectedCount:      connected,
    distributorCount:    distributors,
    manufacturerCount:   manufacturers,
    connectionStatus:    connected === 0 ? 'pending_setup' : 'connected',
    blockers,
    persistenceStatus:   dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
