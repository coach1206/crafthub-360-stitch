// NOVEE OS Module Registry — Contracts & Validators

export const MODULE_CATEGORIES = {
  CORE_OS: 'core_os',
  EXPERIENCE_HUB: 'experience_hub',
  POS: 'pos',
  CRAFT_EXPERIENCE: 'craft_experience',
  MANAGEMENT: 'management',
  LOYALTY: 'loyalty',
  INVENTORY: 'inventory',
  REPORTING: 'reporting',
  INTEGRATION: 'integration',
  MARKETPLACE: 'marketplace',
  ADMIN: 'admin',
  CUSTOM: 'custom',
};

export const MODULE_KEYS = {
  NOVEE_OS: 'novee-os',
  CRAFTHUB: 'crafthub',
  POS360: 'pos360',
  SMOKECRAFT: 'smokecraft',
  POURCRAFT: 'pourcraft',
  EAT_SYSTEM: 'eat-system',
  PASSPORT_CONNECTIONS: 'passport-connections',
  LOYALTY_REWARDS: 'loyalty-rewards',
  VENUE_ADMIN: 'venue-admin',
  INVENTORY: 'inventory',
  REPORTS: 'reports',
  EXTERNAL_INTEGRATIONS: 'external-integrations',
  CUSTOM: 'custom',
};

export const MODULE_STATUSES = [
  'draft',
  'registered',
  'available',
  'installed_placeholder',
  'active_placeholder',
  'disabled',
  'deprecated',
  'unavailable',
];

export const INSTALL_STATUSES = [
  'not_installed',
  'install_ready_placeholder',
  'installed_placeholder',
  'install_failed',
  'uninstall_pending',
  'unavailable',
];

export const ACTIVATION_STATUSES = [
  'not_active',
  'activation_ready_placeholder',
  'active_placeholder',
  'active_external',
  'disabled',
  'blocked',
  'unavailable',
];

export const READINESS_STATUSES = [
  'not_checked',
  'foundation_ready',
  'contract_ready',
  'provider_activation_required',
  'production_ready_placeholder',
  'incomplete',
  'unavailable',
];

export const HEALTH_STATUSES = [
  'unknown',
  'healthy_placeholder',
  'degraded',
  'failed',
  'unavailable',
];

export const DEMO_LIVE_MODES = [
  'demo',
  'local_preview',
  'staging_placeholder',
  'production_placeholder',
  'live_external',
  'unavailable',
];

export const DEPENDENCY_STATUSES = [
  'required',
  'optional',
  'recommended',
  'blocked',
  'unavailable',
];

export const PERMISSION_SCOPES = [
  'platform_owner',
  'organization_admin',
  'venue_owner',
  'manager',
  'staff',
  'guest',
  'system',
  'custom',
];

export const PLAN_REQUIREMENT_STATUSES = [
  'not_required',
  'required_placeholder',
  'verified_external',
  'unavailable',
];

export const LICENSE_REQUIREMENT_STATUSES = [
  'not_required',
  'license_required_placeholder',
  'license_verified_external',
  'unavailable',
];

export const ROLLBACK_STATUSES = [
  'not_requested',
  'requested',
  'available_placeholder',
  'applied_placeholder',
  'failed',
  'unavailable',
];

export const isValidModuleCategory    = v => Object.values(MODULE_CATEGORIES).includes(v);
export const isValidModuleKey         = v => Object.values(MODULE_KEYS).includes(v) || typeof v === 'string' && v.length > 0;
export const isValidModuleStatus      = v => MODULE_STATUSES.includes(v);
export const isValidInstallStatus     = v => INSTALL_STATUSES.includes(v);
export const isValidActivationStatus  = v => ACTIVATION_STATUSES.includes(v);
export const isValidReadinessStatus   = v => READINESS_STATUSES.includes(v);
export const isValidHealthStatus      = v => HEALTH_STATUSES.includes(v);
export const isValidDemoLiveMode      = v => DEMO_LIVE_MODES.includes(v);
export const isValidDependencyStatus  = v => DEPENDENCY_STATUSES.includes(v);
export const isValidPermissionScope   = v => PERMISSION_SCOPES.includes(v);
export const isValidPlanRequirementStatus    = v => PLAN_REQUIREMENT_STATUSES.includes(v);
export const isValidLicenseRequirementStatus = v => LICENSE_REQUIREMENT_STATUSES.includes(v);
export const isValidRollbackStatus    = v => ROLLBACK_STATUSES.includes(v);
