// Phase C.2 / Module 2 of 7
// NOVEE OS Tenant, Venue, Organization & Workspace Governance — Contracts

export const ORGANIZATION_STATUSES = {
  DRAFT:             'draft',
  ACTIVE_PLACEHOLDER: 'active_placeholder',
  SUSPENDED:         'suspended',
  DISABLED:          'disabled',
  UNAVAILABLE:       'unavailable',
};

export const VENUE_STATUSES = {
  DRAFT:              'draft',
  SETUP_PLACEHOLDER:  'setup_placeholder',
  ACTIVE_PLACEHOLDER: 'active_placeholder',
  DEPLOYED_EXTERNAL:  'deployed_external',
  SUSPENDED:          'suspended',
  DISABLED:           'disabled',
  UNAVAILABLE:        'unavailable',
};

export const WORKSPACE_STATUSES = {
  DRAFT:                    'draft',
  PROVISIONED_PLACEHOLDER:  'provisioned_placeholder',
  ACTIVE_PLACEHOLDER:       'active_placeholder',
  LIVE_EXTERNAL:            'live_external',
  SUSPENDED:                'suspended',
  DISABLED:                 'disabled',
  UNAVAILABLE:              'unavailable',
};

export const MEMBERSHIP_STATUSES = {
  INVITED_PLACEHOLDER: 'invited_placeholder',
  ACTIVE_PLACEHOLDER:  'active_placeholder',
  SUSPENDED:           'suspended',
  REMOVED:             'removed',
  UNAVAILABLE:         'unavailable',
};

export const ENVIRONMENT_MODES = {
  DEMO:                   'demo',
  LOCAL_PREVIEW:          'local_preview',
  STAGING_PLACEHOLDER:    'staging_placeholder',
  PRODUCTION_PLACEHOLDER: 'production_placeholder',
  LIVE_EXTERNAL:          'live_external',
  UNAVAILABLE:            'unavailable',
};

export const SCOPE_LEVELS = {
  PLATFORM:       'platform',
  ORGANIZATION:   'organization',
  VENUE_GROUP:    'venue_group',
  VENUE:          'venue',
  WORKSPACE:      'workspace',
  BUSINESS_UNIT:  'business_unit',
  DEPARTMENT:     'department',
  LOCATION:       'location',
  MODULE:         'module',
  CUSTOM:         'custom',
};

export const READINESS_STATUSES = {
  NOT_CHECKED:                  'not_checked',
  FOUNDATION_READY:             'foundation_ready',
  CONFIGURATION_REQUIRED:       'configuration_required',
  PROVIDER_ACTIVATION_REQUIRED: 'provider_activation_required',
  PRODUCTION_READY_PLACEHOLDER: 'production_ready_placeholder',
  INCOMPLETE:                   'incomplete',
  UNAVAILABLE:                  'unavailable',
};

export const GOVERNANCE_STATUSES = {
  DRAFT:            'draft',
  ACTIVE_PLACEHOLDER: 'active_placeholder',
  REVIEW_REQUIRED:  'review_required',
  BLOCKED:          'blocked',
  DISABLED:         'disabled',
  UNAVAILABLE:      'unavailable',
};

export const ROLE_SCOPES = {
  PLATFORM_OWNER:      'platform_owner',
  ORGANIZATION_ADMIN:  'organization_admin',
  VENUE_OWNER:         'venue_owner',
  WORKSPACE_ADMIN:     'workspace_admin',
  MANAGER:             'manager',
  STAFF:               'staff',
  GUEST:               'guest',
  SYSTEM:              'system',
  CUSTOM:              'custom',
};

export const BOUNDARY_TYPES = {
  DATA_ACCESS:          'data_access',
  ROUTE_ACCESS:         'route_access',
  MODULE_ACCESS:        'module_access',
  VENUE_ACCESS:         'venue_access',
  WORKSPACE_ACCESS:     'workspace_access',
  FINANCIAL_ACCESS:     'financial_access',
  PRIVATE_DATA_ACCESS:  'private_data_access',
  ADMIN_ACCESS:         'admin_access',
  CUSTOM:               'custom',
};

export const HEALTH_STATUSES = {
  UNKNOWN:             'unknown',
  HEALTHY_PLACEHOLDER: 'healthy_placeholder',
  DEGRADED:            'degraded',
  FAILED:              'failed',
  UNAVAILABLE:         'unavailable',
};

export const AVAILABILITY_STATUSES = {
  NOT_AVAILABLE:        'not_available',
  AVAILABLE_PLACEHOLDER: 'available_placeholder',
  ENABLED_PLACEHOLDER:  'enabled_placeholder',
  DISABLED:             'disabled',
  BLOCKED:              'blocked',
  UNAVAILABLE:          'unavailable',
};

const _orgStatuses   = new Set(Object.values(ORGANIZATION_STATUSES));
const _venueStatuses = new Set(Object.values(VENUE_STATUSES));
const _wsStatuses    = new Set(Object.values(WORKSPACE_STATUSES));
const _memStatuses   = new Set(Object.values(MEMBERSHIP_STATUSES));
const _envModes      = new Set(Object.values(ENVIRONMENT_MODES));
const _scopeLevels   = new Set(Object.values(SCOPE_LEVELS));
const _readiness     = new Set(Object.values(READINESS_STATUSES));
const _governance    = new Set(Object.values(GOVERNANCE_STATUSES));
const _roleScopes    = new Set(Object.values(ROLE_SCOPES));
const _boundaryTypes = new Set(Object.values(BOUNDARY_TYPES));
const _healthStats   = new Set(Object.values(HEALTH_STATUSES));
const _availStats    = new Set(Object.values(AVAILABILITY_STATUSES));

export const isValidOrganizationStatus  = v => _orgStatuses.has(v);
export const isValidVenueStatus         = v => _venueStatuses.has(v);
export const isValidWorkspaceStatus     = v => _wsStatuses.has(v);
export const isValidMembershipStatus    = v => _memStatuses.has(v);
export const isValidEnvironmentMode     = v => _envModes.has(v);
export const isValidScopeLevel          = v => _scopeLevels.has(v);
export const isValidReadinessStatus     = v => _readiness.has(v);
export const isValidGovernanceStatus    = v => _governance.has(v);
export const isValidRoleScope           = v => _roleScopes.has(v);
export const isValidBoundaryType        = v => _boundaryTypes.has(v);
export const isValidHealthStatus        = v => _healthStats.has(v);
export const isValidAvailabilityStatus  = v => _availStats.has(v);
