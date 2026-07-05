// CraftHub Dashboard Contracts — Phase C.5
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

export const CRAFTHUB_MODULE_KEYS = [
  'novee_os_module_registry',
  'novee_os_tenant_governance',
  'novee_os_billing_governance',
  'novee_os_security_governance',
  'pos360_platform',
  'smokecraft_experience',
  'pourcraft_beverage',
  'eat_ai_system',
  'passport_connections',
  'loyalty_rewards',
  'venue_admin',
  'inventory_management',
  'reports_analytics',
  'external_integrations',
  'future_module_placeholder',
];

export const CRAFTHUB_MODULE_CATEGORIES = [
  'platform_core',
  'pos_ordering',
  'experience',
  'hospitality',
  'loyalty',
  'operations',
  'analytics',
  'integrations',
  'upcoming',
];

export const CRAFTHUB_MODULE_STATUSES = [
  'pending',
  'available',
  'installed',
  'activated',
  'locked',
  'placeholder',
  'demo',
  'local_preview',
  'activation_required',
  'unavailable',
];

export const CRAFTHUB_HUB_TIERS = [
  'starter',
  'growth',
  'professional',
  'enterprise',
];

export const CRAFTHUB_WIDGET_TYPES = [
  'module_launcher',
  'activity_feed',
  'quick_actions',
  'health_status',
  'onboarding_checklist',
  'announcements',
  'roadmap',
  'marketplace_featured',
  'notifications',
  'platform_stats',
];

export const CRAFTHUB_ROADMAP_PHASES = [
  { key: 'C1', name: 'NOVEE OS Module Registry', status: 'complete', order: 1 },
  { key: 'C2', name: 'Tenant & Venue Governance', status: 'complete', order: 2 },
  { key: 'C3', name: 'Billing & Licensing Gates', status: 'complete', order: 3 },
  { key: 'C4', name: 'Security & Permissions Governance', status: 'complete', order: 4 },
  { key: 'C5', name: 'CraftHub Dashboard & Module Launcher', status: 'current', order: 5 },
  { key: 'C6', name: 'Venue Onboarding Engine', status: 'next', order: 6 },
  { key: 'C7', name: 'Final Launch Lock', status: 'pending', order: 7 },
];

export const CRAFTHUB_LOCALES = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];

export const CRAFTHUB_NAV_SECTIONS = [
  'dashboard',
  'modules',
  'marketplace',
  'settings',
  'platform_admin',
];

export const CRAFTHUB_AUDIT_ACTIONS = [
  'dashboard.viewed',
  'module.launched',
  'module.install_requested',
  'module.activation_requested',
  'marketplace.item_viewed',
  'marketplace.purchase_initiated',
  'marketplace.purchase_completed',
  'widget.added',
  'widget.removed',
  'widget.repositioned',
  'layout.saved',
  'quick_action.triggered',
  'notification.dismissed',
  'onboarding.step_completed',
  'onboarding.completed',
  'api_key.created',
  'api_key.revoked',
  'connector.connect_requested',
  'connector.disconnect_requested',
  'feature_flag.override_set',
];

export const CRAFTHUB_CONNECTOR_KEYS = [
  'pos360_sync',
  'smokecraft_sync',
  'eat_ai_automation',
  'stripe_billing',
  'novee_os_core',
];

export const CRAFTHUB_CONNECTOR_TYPES = [
  'pos_sync',
  'experience_sync',
  'ai_automation',
  'billing',
  'platform_core',
];

export const CRAFTHUB_PLATFORM_COMPONENTS = [
  'api_gateway',
  'database',
  'auth_service',
  'module_registry',
  'billing_service',
  'notification_service',
];

export function validateModuleKey(key) {
  return typeof key === 'string' && CRAFTHUB_MODULE_KEYS.includes(key);
}

export function validateModuleCategory(cat) {
  return typeof cat === 'string' && CRAFTHUB_MODULE_CATEGORIES.includes(cat);
}

export function validateModuleStatus(status) {
  return typeof status === 'string' && CRAFTHUB_MODULE_STATUSES.includes(status);
}

export function validateHubTier(tier) {
  return typeof tier === 'string' && CRAFTHUB_HUB_TIERS.includes(tier);
}

export function validateWidgetType(type) {
  return typeof type === 'string' && CRAFTHUB_WIDGET_TYPES.includes(type);
}

export function validateLocale(locale) {
  return typeof locale === 'string' && CRAFTHUB_LOCALES.includes(locale);
}

export function validateNavSection(section) {
  return typeof section === 'string' && CRAFTHUB_NAV_SECTIONS.includes(section);
}

export function validateConnectorKey(key) {
  return typeof key === 'string' && CRAFTHUB_CONNECTOR_KEYS.includes(key);
}

export function validateAuditAction(action) {
  return typeof action === 'string' && CRAFTHUB_AUDIT_ACTIONS.includes(action);
}

export function validatePlatformComponent(component) {
  return typeof component === 'string' && CRAFTHUB_PLATFORM_COMPONENTS.includes(component);
}

export function isLiveModeBlocked(flag) {
  return flag === false || flag === undefined || flag === null;
}
