const LICENSE_TIERS = {
  CORE: 'core',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
  WHITE_LABEL: 'white_label',
  RESELLER: 'reseller',
  INTERNAL_ADMIN: 'internal_admin',
}

const LICENSE_TIER_DEFINITIONS = [
  {
    licenseTier: LICENSE_TIERS.CORE,
    allowedModules: ['venue-onboarding', 'checkout', 'inventory-ispae', 'pos360', 'kds', 'ncie', 'staff-orders'],
    allowedAddOns: [],
    venueLimit: 1,
    locationLimit: 1,
    whiteLabelAllowed: false,
    resellerAllowed: false,
    marketplaceAccess: false,
    supportLevel: 'self_service',
    activationRequired: true,
    licenseGateRequired: true,
    currentStatus: 'tier_defined_not_enforced',
    blockers: ['license_gate_engine_not_built'],
  },
  {
    licenseTier: LICENSE_TIERS.PREMIUM,
    allowedModules: ['venue-onboarding', 'checkout', 'inventory-ispae', 'pos360', 'kds', 'ncie', 'staff-orders', 'smokecraft-experience', 'locc'],
    allowedAddOns: ['reorder-dmrc', 'vendor-partner'],
    venueLimit: 5,
    locationLimit: 10,
    whiteLabelAllowed: false,
    resellerAllowed: false,
    marketplaceAccess: false,
    supportLevel: 'email_support',
    activationRequired: true,
    licenseGateRequired: true,
    currentStatus: 'tier_defined_not_enforced',
    blockers: ['license_gate_engine_not_built'],
  },
  {
    licenseTier: LICENSE_TIERS.ENTERPRISE,
    allowedModules: ['all'],
    allowedAddOns: ['all'],
    venueLimit: null,
    locationLimit: null,
    whiteLabelAllowed: false,
    resellerAllowed: false,
    marketplaceAccess: true,
    supportLevel: 'dedicated_support',
    activationRequired: true,
    licenseGateRequired: true,
    currentStatus: 'tier_defined_not_enforced',
    blockers: ['license_gate_engine_not_built'],
  },
  {
    licenseTier: LICENSE_TIERS.WHITE_LABEL,
    allowedModules: ['all'],
    allowedAddOns: ['all'],
    venueLimit: null,
    locationLimit: null,
    whiteLabelAllowed: true,
    resellerAllowed: false,
    marketplaceAccess: true,
    supportLevel: 'white_label_support',
    activationRequired: true,
    licenseGateRequired: true,
    currentStatus: 'tier_defined_not_enforced',
    blockers: ['license_gate_engine_not_built', 'white_label_branding_engine_not_built'],
  },
  {
    licenseTier: LICENSE_TIERS.RESELLER,
    allowedModules: ['all'],
    allowedAddOns: ['all'],
    venueLimit: null,
    locationLimit: null,
    whiteLabelAllowed: true,
    resellerAllowed: true,
    marketplaceAccess: true,
    supportLevel: 'reseller_partner_support',
    activationRequired: true,
    licenseGateRequired: true,
    currentStatus: 'tier_defined_not_enforced',
    blockers: ['license_gate_engine_not_built', 'reseller_portal_not_built'],
  },
  {
    licenseTier: LICENSE_TIERS.INTERNAL_ADMIN,
    allowedModules: ['all'],
    allowedAddOns: ['all'],
    venueLimit: null,
    locationLimit: null,
    whiteLabelAllowed: true,
    resellerAllowed: true,
    marketplaceAccess: true,
    supportLevel: 'internal',
    activationRequired: false,
    licenseGateRequired: false,
    currentStatus: 'tier_defined_not_enforced',
    blockers: [],
  },
]

export function buildWhiteLabelReadinessReport() {
  return {
    status: 'white_label_ready_draft',
    license_gate_built: false,
    white_label_engine_built: false,
    reseller_portal_built: false,
    tiers_defined: true,
    tiers: LICENSE_TIER_DEFINITIONS,
    note: 'License tiers are defined but not enforced. License gate engine required for enforcement.',
    next_step: 'Module Build 9 — White-Label Marketplace Licensing Module',
  }
}

export function getLicenseTierRecommendations() {
  return {
    single_venue: LICENSE_TIERS.CORE,
    small_group: LICENSE_TIERS.PREMIUM,
    multi_venue_enterprise: LICENSE_TIERS.ENTERPRISE,
    branded_partner: LICENSE_TIERS.WHITE_LABEL,
    technology_reseller: LICENSE_TIERS.RESELLER,
  }
}

export function getModuleLicenseRequirements() {
  return [
    { moduleId: 'smokecraft-experience', minimumTier: LICENSE_TIERS.PREMIUM },
    { moduleId: 'locc', minimumTier: LICENSE_TIERS.ENTERPRISE },
    { moduleId: 'eocg', minimumTier: LICENSE_TIERS.ENTERPRISE },
    { moduleId: 'eat-command-hub', minimumTier: LICENSE_TIERS.ENTERPRISE },
    { moduleId: 'white-label-licensing', minimumTier: LICENSE_TIERS.WHITE_LABEL },
    { moduleId: 'marketplace-registry', minimumTier: LICENSE_TIERS.WHITE_LABEL },
  ]
}

export function getAddonLicenseRequirements() {
  return [
    { moduleId: 'reorder-dmrc', minimumTier: LICENSE_TIERS.PREMIUM },
    { moduleId: 'vendor-partner', minimumTier: LICENSE_TIERS.PREMIUM },
    { moduleId: 'ncie', minimumTier: LICENSE_TIERS.PREMIUM },
  ]
}

export function getWhiteLabelBrandingRequirements() {
  return [
    { requirement: 'tenant_id_system', status: 'not_built' },
    { requirement: 'brand_config_per_tenant', status: 'not_built' },
    { requirement: 'logo_override', status: 'not_built' },
    { requirement: 'color_scheme_override', status: 'not_built' },
    { requirement: 'domain_mapping', status: 'not_built' },
    { requirement: 'novee_os_attribution_rules', status: 'needs_definition' },
  ]
}

export function getResellerReadinessChecklist() {
  return {
    status: 'reseller_not_ready',
    checklist: [
      { item: 'Reseller agreement template', done: false },
      { item: 'Reseller portal', done: false },
      { item: 'Reseller license activation', done: false },
      { item: 'Sub-venue provisioning', done: false },
      { item: 'Revenue split configuration', done: false },
    ],
    next_step: 'Module Build 9 — White-Label Marketplace Licensing Module',
  }
}

export function getBrokerMonetizationChecklist() {
  return {
    status: 'broker_not_ready',
    checklist: [
      { item: 'Broker agreement template', done: false },
      { item: 'Commission tracking', done: false },
      { item: 'Broker portal', done: false },
      { item: 'Upgrade path from core to premium', done: false },
    ],
    next_step: 'Module Build 9 — White-Label Marketplace Licensing Module',
  }
}

export function buildLicensingLaunchChecklist() {
  return {
    status: 'licensing_not_ready',
    tiers_defined: true,
    license_gate_built: false,
    blockers: [
      { blocker: 'license_gate_engine_not_built', severity: 'critical' },
      { blocker: 'tenant_id_system_not_built', severity: 'critical' },
      { blocker: 'module_install_hooks_not_built', severity: 'critical' },
    ],
    checklist: [
      { item: 'License tiers defined', done: true },
      { item: 'License gate engine built', done: false, required: true },
      { item: 'Tenant ID system built', done: false, required: true },
      { item: 'Module install hooks built', done: false, required: true },
      { item: 'White-label branding engine built', done: false, required: false },
      { item: 'Reseller portal built', done: false, required: false },
    ],
    next_step: 'Module Build 9 — White-Label Marketplace Licensing Module',
  }
}
