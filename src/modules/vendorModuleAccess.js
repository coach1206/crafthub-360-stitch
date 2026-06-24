// Vendor module access registry — Phase 4.
//
// Honest prototype data structure describing which vendor can use which
// module, and under what conditions. This is NOT a billing system and NOT
// a live licensing service — license/expiration/environment fields are
// plain data a future real system would populate. No payment verification,
// no remote enforcement happens here; this file only defines the shape and
// a small in-memory registry so moduleSecurityGuard.js has something real
// to check against today.

export const LICENSE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  UNKNOWN: 'unknown',
}

export const ACCESS_LEVEL = {
  NONE: 'none',
  VIEW_ONLY: 'view_only',
  STANDARD: 'standard',
  FULL: 'full',
}

export const ENVIRONMENT = {
  DEMO: 'demo',
  STAGING: 'staging',
  PRODUCTION: 'production',
}

/**
 * Returns a fully-populated vendor access record with honest defaults.
 * Never invents an "active" license or a "production" environment — those
 * must be supplied explicitly by the caller.
 */
export function createVendorAccessRecord(partial = {}) {
  return {
    vendorId: partial.vendorId ?? null,
    vendorName: partial.vendorName ?? null,
    assignedModules: partial.assignedModules ?? [],
    enabledModules: partial.enabledModules ?? [],
    disabledModules: partial.disabledModules ?? [],
    licenseStatus: partial.licenseStatus ?? LICENSE_STATUS.UNKNOWN,
    accessLevel: partial.accessLevel ?? ACCESS_LEVEL.NONE,
    // Placeholder only — no real expiration tracking exists yet. `null`
    // means "no expiration data known", not "never expires".
    expirationDate: partial.expirationDate ?? null,
    environment: partial.environment ?? ENVIRONMENT.DEMO,
    lastCheckedDate: partial.lastCheckedDate ?? null,
  }
}

// Prototype, in-memory vendor registry. This is sample/demo data only — a
// real system would source this from a database, not a hardcoded object.
const vendorModuleAccessRegistry = {
  'demo-vendor-smokecraft': createVendorAccessRecord({
    vendorId: 'demo-vendor-smokecraft',
    vendorName: 'Demo SmokeCraft Vendor',
    assignedModules: ['smokecraft'],
    enabledModules: ['smokecraft'],
    disabledModules: [],
    licenseStatus: LICENSE_STATUS.ACTIVE,
    accessLevel: ACCESS_LEVEL.STANDARD,
    expirationDate: null,
    environment: ENVIRONMENT.DEMO,
    lastCheckedDate: null,
  }),
  'demo-vendor-pos3': createVendorAccessRecord({
    vendorId: 'demo-vendor-pos3',
    vendorName: 'Demo POS 3 Vendor',
    assignedModules: ['pos3'],
    enabledModules: ['pos3'],
    disabledModules: [],
    licenseStatus: LICENSE_STATUS.ACTIVE,
    accessLevel: ACCESS_LEVEL.STANDARD,
    expirationDate: null,
    environment: ENVIRONMENT.DEMO,
    lastCheckedDate: null,
  }),
  'demo-vendor-eat': createVendorAccessRecord({
    vendorId: 'demo-vendor-eat',
    vendorName: 'Demo E.A.T. Vendor',
    assignedModules: ['eat-command-hub'],
    enabledModules: ['eat-command-hub'],
    disabledModules: [],
    licenseStatus: LICENSE_STATUS.ACTIVE,
    accessLevel: ACCESS_LEVEL.STANDARD,
    expirationDate: null,
    environment: ENVIRONMENT.DEMO,
    lastCheckedDate: null,
  }),
  'demo-vendor-expired': createVendorAccessRecord({
    vendorId: 'demo-vendor-expired',
    vendorName: 'Demo Expired-License Vendor',
    assignedModules: ['pos3'],
    enabledModules: ['pos3'],
    disabledModules: [],
    licenseStatus: LICENSE_STATUS.EXPIRED,
    accessLevel: ACCESS_LEVEL.STANDARD,
    expirationDate: '2020-01-01',
    environment: ENVIRONMENT.DEMO,
    lastCheckedDate: null,
  }),
  // Active license but a past expirationDate — isolates the "expired access
  // blocked" rule from the separate "license not active" rule above.
  'demo-vendor-expired-date': createVendorAccessRecord({
    vendorId: 'demo-vendor-expired-date',
    vendorName: 'Demo Vendor With Expired Date',
    assignedModules: ['pos3'],
    enabledModules: ['pos3'],
    disabledModules: [],
    licenseStatus: LICENSE_STATUS.ACTIVE,
    accessLevel: ACCESS_LEVEL.STANDARD,
    expirationDate: '2020-01-01',
    environment: ENVIRONMENT.DEMO,
    lastCheckedDate: null,
  }),
}

export function getVendor(vendorId) {
  return vendorModuleAccessRegistry[vendorId] || null
}

export function listVendors() {
  return Object.values(vendorModuleAccessRegistry)
}

export function isModuleAssignedToVendor(vendorId, moduleId) {
  const vendor = getVendor(vendorId)
  return Boolean(vendor?.assignedModules?.includes(moduleId))
}

export function isModuleEnabledForVendor(vendorId, moduleId) {
  const vendor = getVendor(vendorId)
  return Boolean(vendor?.enabledModules?.includes(moduleId)) && !vendor?.disabledModules?.includes(moduleId)
}

export default vendorModuleAccessRegistry
