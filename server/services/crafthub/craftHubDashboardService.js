/**
 * CraftHub Dashboard Service — Phase C.5
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  CRAFTHUB_MODULE_KEYS,
  CRAFTHUB_ROADMAP_PHASES,
  CRAFTHUB_PLATFORM_COMPONENTS,
  validateModuleKey,
  validateConnectorKey,
  validateAuditAction,
} from './craftHubDashboardContracts.js';
import { getCraftHubDashboardFlags } from '../../config/craftHubDashboardFeatureFlags.js';

const AREA = 'crafthub_dashboard';

const localFallback = (extra = {}) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area: AREA,
  ...extra,
});

async function insertAudit(db, actorId, action, targetType, targetId, payload, idempotencyKey) {
  // contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
  await db.query(
    `INSERT INTO crafthub_audit_log
      (actor_id, action, target_type, target_id, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [actorId, action, targetType, targetId, JSON.stringify(payload), idempotencyKey]
  );
}

export async function getDefaultCraftHubDashboard(db) {
  if (!isDbAvailable()) return localFallback({ dashboard: buildLocalDashboard() });

  const flags = getCraftHubDashboardFlags();
  const modules = buildLocalModuleCards();
  const roadmap = CRAFTHUB_ROADMAP_PHASES;
  const platformHealth = CRAFTHUB_PLATFORM_COMPONENTS.map(c => ({
    component: c,
    status: 'unknown',
    live_monitoring_enabled: false,
  }));

  return {
    ok: true,
    flags,
    modules,
    roadmap,
    platformHealth,
    area: AREA,
  };
}

function buildLocalDashboard() {
  return {
    modules: buildLocalModuleCards(),
    roadmap: CRAFTHUB_ROADMAP_PHASES,
    flags: getCraftHubDashboardFlags(),
  };
}

function buildLocalModuleCards() {
  const cards = [
    { key: 'novee_os_module_registry', name: 'NOVEE OS Module Registry', category: 'platform_core', status: 'local_preview', phase: 'C1', route: '/novee-os/modules' },
    { key: 'novee_os_tenant_governance', name: 'Tenant & Venue Governance', category: 'platform_core', status: 'local_preview', phase: 'C2', route: '/novee-os/tenants' },
    { key: 'novee_os_billing_governance', name: 'Billing & Licensing Gates', category: 'platform_core', status: 'local_preview', phase: 'C3', route: '/novee-os/billing' },
    { key: 'novee_os_security_governance', name: 'Security & Permissions Governance', category: 'platform_core', status: 'local_preview', phase: 'C4', route: '/novee-os/security' },
    { key: 'pos360_platform', name: 'POS360 Platform', category: 'pos_ordering', status: 'local_preview', phase: 'B', route: '/pos3' },
    { key: 'smokecraft_experience', name: 'SmokeCraft Experience', category: 'experience', status: 'local_preview', phase: 'A', route: '/smokecraft' },
    { key: 'pourcraft_beverage', name: 'PourCraft Beverage', category: 'hospitality', status: 'placeholder', phase: null, route: null },
    { key: 'eat_ai_system', name: 'E.A.T. AI System', category: 'hospitality', status: 'placeholder', phase: null, route: null },
    { key: 'passport_connections', name: 'Passport & Connections', category: 'loyalty', status: 'local_preview', phase: 'A', route: '/passport' },
    { key: 'loyalty_rewards', name: 'Loyalty & Rewards', category: 'loyalty', status: 'placeholder', phase: null, route: null },
    { key: 'venue_admin', name: 'Venue Admin', category: 'operations', status: 'local_preview', phase: 'B', route: '/venue-admin' },
    { key: 'inventory_management', name: 'Inventory Management', category: 'operations', status: 'local_preview', phase: 'B', route: '/inventory' },
    { key: 'reports_analytics', name: 'Reports & Analytics', category: 'analytics', status: 'local_preview', phase: 'B', route: '/reports' },
    { key: 'external_integrations', name: 'External Integrations', category: 'integrations', status: 'local_preview', phase: 'B', route: '/integrations' },
    { key: 'future_module_placeholder', name: 'Future Module', category: 'upcoming', status: 'pending', phase: null, route: null },
  ];

  return cards.map(c => ({
    ...c,
    module_installed: false,
    module_activated: false,
    marketplace_purchase_completed: false,
    billing_connected: false,
    license_verified: false,
    launch_allowed: false,
    live_mode_enabled: false,
    activation_required: true,
    placeholder_mode: c.status === 'placeholder' || c.status === 'pending',
  }));
}

export async function getDashboardSessions(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_dashboard_sessions WHERE tenant_id=$1 ORDER BY last_seen_at DESC LIMIT 20`,
    [tenantId]
  );
  return { ok: true, sessions: result.rows };
}

export async function createDashboardSession(db, tenantId, userId, sessionToken, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  const result = await db.query(
    `INSERT INTO crafthub_dashboard_sessions (tenant_id, user_id, session_token)
     VALUES ($1,$2,$3) RETURNING *`,
    [tenantId, userId, sessionToken]
  );
  await insertAudit(db, userId, 'dashboard.viewed', 'session', result.rows[0].id, {}, idempotencyKey);
  return { ok: true, session: result.rows[0] };
}

export async function getModuleLauncherRegistry(db, tenantId) {
  if (!isDbAvailable()) return localFallback({ modules: buildLocalModuleCards() });
  const result = await db.query(
    `SELECT * FROM crafthub_module_launcher_registry WHERE tenant_id=$1 ORDER BY sort_order ASC`,
    [tenantId]
  );
  if (result.rows.length === 0) return { ok: true, modules: buildLocalModuleCards(), source: 'defaults' };
  return { ok: true, modules: result.rows };
}

export async function requestModuleInstall(db, tenantId, actorId, moduleKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!validateModuleKey(moduleKey)) return { ok: false, error: 'invalid_module_key' };
  // Real installation is not live — activation_required
  await insertAudit(db, actorId, 'module.install_requested', 'module', moduleKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: false, error: 'activation_required', module_installed: false, live_mode_enabled: false };
}

export async function requestModuleActivation(db, tenantId, actorId, moduleKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!validateModuleKey(moduleKey)) return { ok: false, error: 'invalid_module_key' };
  await insertAudit(db, actorId, 'module.activation_requested', 'module', moduleKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: false, error: 'activation_required', module_activated: false, live_mode_enabled: false };
}

export async function getNavigationShellConfig(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_navigation_shell_config WHERE tenant_id=$1 LIMIT 1`,
    [tenantId]
  );
  if (result.rows.length === 0) return { ok: true, config: null, source: 'defaults' };
  return { ok: true, config: result.rows[0] };
}

export async function updateNavigationShellConfig(db, tenantId, actorId, configData, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  const { nav_items, sidebar_collapsed, top_bar_enabled, breadcrumb_enabled, locale, theme } = configData;
  const result = await db.query(
    `INSERT INTO crafthub_navigation_shell_config
      (tenant_id, nav_items, sidebar_collapsed, top_bar_enabled, breadcrumb_enabled, locale, theme)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT DO NOTHING RETURNING *`,
    [tenantId, JSON.stringify(nav_items || []), sidebar_collapsed || false, top_bar_enabled !== false, breadcrumb_enabled !== false, locale || 'en-US', theme || 'dark']
  );
  await insertAudit(db, actorId, 'layout.saved', 'navigation_shell', tenantId, {}, idempotencyKey);
  return { ok: true, config: result.rows[0] };
}

export async function getPremiumExperienceHub(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_premium_experience_hub WHERE tenant_id=$1 LIMIT 1`,
    [tenantId]
  );
  if (result.rows.length === 0) return { ok: true, hub: null, source: 'defaults' };
  return { ok: true, hub: result.rows[0] };
}

export async function getDashboardWidgets(db, tenantId, userId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_dashboard_widgets WHERE tenant_id=$1 AND user_id=$2 ORDER BY position_y, position_x`,
    [tenantId, userId]
  );
  return { ok: true, widgets: result.rows };
}

export async function addDashboardWidget(db, tenantId, userId, actorId, widgetData, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  const { widget_key, widget_type, widget_title, position_x, position_y } = widgetData;
  const result = await db.query(
    `INSERT INTO crafthub_dashboard_widgets
      (tenant_id, user_id, widget_key, widget_type, widget_title, position_x, position_y)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tenantId, userId, widget_key, widget_type, widget_title, position_x || 0, position_y || 0]
  );
  await insertAudit(db, actorId, 'widget.added', 'widget', result.rows[0].id, { widget_key }, idempotencyKey);
  return { ok: true, widget: result.rows[0] };
}

export async function removeWidget(db, tenantId, userId, actorId, widgetId, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await db.query(
    `DELETE FROM crafthub_dashboard_widgets WHERE id=$1 AND tenant_id=$2 AND user_id=$3`,
    [widgetId, tenantId, userId]
  );
  await insertAudit(db, actorId, 'widget.removed', 'widget', widgetId, {}, idempotencyKey);
  return { ok: true };
}

export async function getModuleRoadmap(db) {
  if (!isDbAvailable()) return localFallback({ roadmap: CRAFTHUB_ROADMAP_PHASES });
  const result = await db.query(`SELECT * FROM crafthub_module_roadmap ORDER BY phase_order ASC`);
  if (result.rows.length === 0) return { ok: true, roadmap: CRAFTHUB_ROADMAP_PHASES, source: 'defaults' };
  return { ok: true, roadmap: result.rows };
}

export async function getMarketplaceCatalog(db) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_marketplace_catalog WHERE listing_status='available' ORDER BY sort_order ASC`
  );
  return { ok: true, catalog: result.rows };
}

export async function initiateMarketplacePurchase(db, tenantId, actorId, listingKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  // Real payment processing is not live
  await insertAudit(db, actorId, 'marketplace.purchase_initiated', 'marketplace', listingKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: false, error: 'activation_required', live_purchase_enabled: false, payment_completed: false };
}

export async function getMarketplacePurchases(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_marketplace_purchases WHERE tenant_id=$1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return { ok: true, purchases: result.rows };
}

export async function getQuickActions(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_quick_actions WHERE tenant_id=$1 AND is_enabled=TRUE ORDER BY sort_order ASC`,
    [tenantId]
  );
  return { ok: true, actions: result.rows };
}

export async function triggerQuickAction(db, tenantId, actorId, actionKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await insertAudit(db, actorId, 'quick_action.triggered', 'quick_action', actionKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: false, error: 'activation_required', live_mode_enabled: false };
}

export async function getActivityFeed(db, tenantId, limit = 20) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_activity_feed WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
  return { ok: true, events: result.rows };
}

export async function getNotifications(db, tenantId, userId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_notification_center WHERE tenant_id=$1 AND user_id=$2 AND is_dismissed=FALSE ORDER BY created_at DESC`,
    [tenantId, userId]
  );
  return { ok: true, notifications: result.rows };
}

export async function dismissNotification(db, tenantId, userId, actorId, notificationId, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await db.query(
    `UPDATE crafthub_notification_center SET is_dismissed=TRUE, updated_at=NOW() WHERE id=$1 AND tenant_id=$2 AND user_id=$3`,
    [notificationId, tenantId, userId]
  );
  await insertAudit(db, actorId, 'notification.dismissed', 'notification', notificationId, {}, idempotencyKey);
  return { ok: true };
}

export async function getOnboardingChecklist(db, tenantId, userId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_onboarding_checklist WHERE tenant_id=$1 AND user_id=$2 LIMIT 1`,
    [tenantId, userId]
  );
  if (result.rows.length === 0) return { ok: true, checklist: null, source: 'defaults' };
  return { ok: true, checklist: result.rows[0] };
}

export async function completeOnboardingStep(db, tenantId, userId, actorId, stepKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await insertAudit(db, actorId, 'onboarding.step_completed', 'onboarding', stepKey, { tenant_id: tenantId, user_id: userId }, idempotencyKey);
  return { ok: true, step: stepKey, completed: true };
}

export async function getAnnouncements(db) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_announcements WHERE is_active=TRUE AND (starts_at IS NULL OR starts_at<=NOW()) AND (ends_at IS NULL OR ends_at>=NOW()) ORDER BY created_at DESC`
  );
  return { ok: true, announcements: result.rows };
}

export async function getModuleHealthChecks(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_module_health_checks WHERE tenant_id=$1 ORDER BY module_key ASC`,
    [tenantId]
  );
  return { ok: true, checks: result.rows };
}

export async function getFeatureFlagOverrides(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_feature_flags_overrides WHERE tenant_id=$1`,
    [tenantId]
  );
  return { ok: true, overrides: result.rows };
}

export async function setFeatureFlagOverride(db, tenantId, actorId, flagKey, flagValue, reason, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  const result = await db.query(
    `INSERT INTO crafthub_feature_flags_overrides (tenant_id, flag_key, flag_value, override_reason, set_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [tenantId, flagKey, flagValue, reason, actorId, idempotencyKey]
  );
  await insertAudit(db, actorId, 'feature_flag.override_set', 'feature_flag', flagKey, { flag_value: flagValue }, idempotencyKey + '_audit');
  return { ok: true, override: result.rows[0] };
}

export async function getUserPreferences(db, userId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_user_preferences WHERE user_id=$1 LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return { ok: true, preferences: null, source: 'defaults' };
  return { ok: true, preferences: result.rows[0] };
}

export async function updateUserPreferences(db, userId, actorId, prefData, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  const { locale, timezone, theme, notifications_enabled } = prefData;
  const result = await db.query(
    `INSERT INTO crafthub_user_preferences (user_id, locale, timezone, theme, notifications_enabled)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id) DO UPDATE SET locale=EXCLUDED.locale, timezone=EXCLUDED.timezone, theme=EXCLUDED.theme, notifications_enabled=EXCLUDED.notifications_enabled, updated_at=NOW()
     RETURNING *`,
    [userId, locale || 'en-US', timezone || 'UTC', theme || 'dark', notifications_enabled !== false]
  );
  return { ok: true, preferences: result.rows[0] };
}

export async function getModuleEntitlements(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_module_entitlements WHERE tenant_id=$1`,
    [tenantId]
  );
  return { ok: true, entitlements: result.rows };
}

export async function grantModuleEntitlement(db, tenantId, actorId, moduleKey, source, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!validateModuleKey(moduleKey)) return { ok: false, error: 'invalid_module_key' };
  const result = await db.query(
    `INSERT INTO crafthub_module_entitlements (tenant_id, module_key, entitlement_source, granted_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [tenantId, moduleKey, source, actorId, idempotencyKey]
  );
  return { ok: true, entitlement: result.rows[0] };
}

export async function getAuditLog(db, tenantId, limit = 50) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
  return { ok: true, logs: result.rows };
}

export async function createApiKey(db, tenantId, actorId, keyName, scopes, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  // Real API key creation is not live — activation_required
  await insertAudit(db, actorId, 'api_key.created', 'api_key', keyName, { tenant_id: tenantId, scopes }, idempotencyKey);
  return { ok: false, error: 'activation_required', live_mode_enabled: false };
}

export async function getApiKeys(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT id, key_name, key_prefix, scopes, is_active, last_used_at, created_at FROM crafthub_api_keys WHERE tenant_id=$1`,
    [tenantId]
  );
  return { ok: true, api_keys: result.rows };
}

export async function revokeApiKey(db, tenantId, actorId, keyId, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await db.query(
    `UPDATE crafthub_api_keys SET is_active=FALSE, updated_at=NOW() WHERE id=$1 AND tenant_id=$2`,
    [keyId, tenantId]
  );
  await insertAudit(db, actorId, 'api_key.revoked', 'api_key', keyId, {}, idempotencyKey);
  return { ok: true };
}

export async function getIntegrationConnectors(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(
    `SELECT * FROM crafthub_integration_connectors WHERE tenant_id=$1`,
    [tenantId]
  );
  return { ok: true, connectors: result.rows };
}

export async function connectIntegration(db, tenantId, actorId, connectorKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!validateConnectorKey(connectorKey)) return { ok: false, error: 'invalid_connector_key' };
  await insertAudit(db, actorId, 'connector.connect_requested', 'connector', connectorKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: false, error: 'activation_required', provider_connected: false, live_mode_enabled: false };
}

export async function disconnectIntegration(db, tenantId, actorId, connectorKey, idempotencyKey) {
  if (!isDbAvailable()) return localFallback();
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  await insertAudit(db, actorId, 'connector.disconnect_requested', 'connector', connectorKey, { tenant_id: tenantId }, idempotencyKey);
  return { ok: true };
}

export async function getPlatformHealthStatus(db) {
  if (!isDbAvailable()) return localFallback();
  const result = await db.query(`SELECT * FROM crafthub_platform_health_status ORDER BY component_key ASC`);
  if (result.rows.length === 0) {
    return {
      ok: true,
      components: CRAFTHUB_PLATFORM_COMPONENTS.map(c => ({ component_key: c, status: 'unknown', live_monitoring_enabled: false })),
      source: 'defaults',
    };
  }
  return { ok: true, components: result.rows };
}

export async function getSearchResults(db, tenantId, query) {
  if (!isDbAvailable()) return localFallback();
  if (!query || query.trim().length < 2) return { ok: false, error: 'query_too_short' };
  const result = await db.query(
    `SELECT * FROM crafthub_search_index WHERE tenant_id=$1 AND search_text ILIKE $2 AND is_indexed=TRUE LIMIT 20`,
    [tenantId, `%${query}%`]
  );
  return { ok: true, results: result.rows, live_search_enabled: false };
}

export async function getDashboardStats(db, tenantId) {
  if (!isDbAvailable()) return localFallback();
  const modules = buildLocalModuleCards();
  return {
    ok: true,
    stats: {
      total_modules: CRAFTHUB_MODULE_KEYS.length,
      active_modules: 0,
      live_modules: 0,
      placeholder_modules: modules.filter(m => m.placeholder_mode).length,
      local_preview_modules: modules.filter(m => m.status === 'local_preview').length,
    },
    live_mode_enabled: false,
  };
}
