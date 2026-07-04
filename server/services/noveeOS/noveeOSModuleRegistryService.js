/**
 * NOVEE OS Module Registry Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  MODULE_KEYS, MODULE_CATEGORIES,
  isValidModuleStatus, isValidInstallStatus, isValidActivationStatus,
  isValidReadinessStatus, isValidHealthStatus, isValidDemoLiveMode,
  isValidRollbackStatus,
} from './noveeOSModuleContracts.js';

const AREA = 'novee-os-module-registry';
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra });

async function getDb() {
  const mod = await import('../../db/connection.js');
  return mod.default;
}

export async function writeModuleAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  if (!isDbAvailable()) return;
  try {
    const db = await getDb();
    await db.query(
      `INSERT INTO novee_os_module_audit
         (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason,
          contains_secrets, stores_secrets, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,NOW())`,
      [actorUserId, action, entityType, entityId,
       beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
       afterSnapshot  ? JSON.stringify(afterSnapshot)  : null,
       reason]
    );
  } catch (_) {}
}

// ─── DEFAULT CORE REGISTRY ───────────────────────────────────────────────────

export function getDefaultCoreModuleRegistry() {
  return [
    { moduleKey: MODULE_KEYS.NOVEE_OS,              moduleName: 'NOVEE OS',              category: MODULE_CATEGORIES.CORE_OS,          status: 'registered',          readinessStatus: 'foundation_ready',          installStatus: 'not_installed', activationStatus: 'not_active' },
    { moduleKey: MODULE_KEYS.CRAFTHUB,              moduleName: 'CraftHub',              category: MODULE_CATEGORIES.EXPERIENCE_HUB,   status: 'registered',          readinessStatus: 'foundation_ready',          installStatus: 'not_installed', activationStatus: 'not_active' },
    { moduleKey: MODULE_KEYS.POS360,                moduleName: 'POS360',                category: MODULE_CATEGORIES.POS,              status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.SMOKECRAFT,            moduleName: 'SmokeCraft',            category: MODULE_CATEGORIES.CRAFT_EXPERIENCE, status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.POURCRAFT,             moduleName: 'PourCraft',             category: MODULE_CATEGORIES.CRAFT_EXPERIENCE, status: 'registered',          readinessStatus: 'provider_activation_required', installStatus: 'not_installed', activationStatus: 'not_active' },
    { moduleKey: MODULE_KEYS.EAT_SYSTEM,            moduleName: 'E.A.T. System',         category: MODULE_CATEGORIES.MANAGEMENT,       status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.PASSPORT_CONNECTIONS,  moduleName: 'Passport / Connections',category: MODULE_CATEGORIES.LOYALTY,          status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.LOYALTY_REWARDS,       moduleName: 'Loyalty / Rewards',     category: MODULE_CATEGORIES.LOYALTY,          status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.VENUE_ADMIN,           moduleName: 'Venue Admin',           category: MODULE_CATEGORIES.ADMIN,            status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.INVENTORY,             moduleName: 'Inventory',             category: MODULE_CATEGORIES.INVENTORY,        status: 'registered',          readinessStatus: 'provider_activation_required', installStatus: 'not_installed', activationStatus: 'not_active' },
    { moduleKey: MODULE_KEYS.REPORTS,               moduleName: 'Reports',               category: MODULE_CATEGORIES.REPORTING,        status: 'active_placeholder',  readinessStatus: 'contract_ready',            installStatus: 'installed_placeholder', activationStatus: 'active_placeholder' },
    { moduleKey: MODULE_KEYS.EXTERNAL_INTEGRATIONS, moduleName: 'External Integrations', category: MODULE_CATEGORIES.INTEGRATION,      status: 'active_placeholder',  readinessStatus: 'provider_activation_required', installStatus: 'installed_placeholder', activationStatus: 'not_active' },
  ].map(m => ({
    ...m,
    liveProviderConnected: false,
    marketplacePurchaseCompleted: false,
    licenseVerified: false,
    billingConnected: false,
    deploymentCompleted: false,
    containsAiGeneratedContent: false,
    containsSecrets: false,
    storesSecrets: false,
    localPreview: true,
  }));
}

// ─── REGISTRY ────────────────────────────────────────────────────────────────

export async function registerModule({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'registerModule' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_registry
         (module_key, module_name, module_category, module_status, module_version, description,
          organization_id, venue_id, install_status, activation_status, readiness_status,
          health_status, demo_live_mode, live_provider_connected, marketplace_purchase_completed,
          license_verified, billing_connected, deployment_completed, contains_ai_generated_content,
          contains_secrets, stores_secrets, metadata, idempotency_key, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
               FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
               $14,$15,$16,NOW(),NOW())
       ON CONFLICT (module_key) DO NOTHING
       RETURNING *`,
      [payload.moduleKey, payload.moduleName, payload.moduleCategory,
       payload.moduleStatus || 'registered', payload.moduleVersion || '0.1.0',
       payload.description, payload.organizationId, payload.venueId,
       payload.installStatus || 'not_installed', payload.activationStatus || 'not_active',
       payload.readinessStatus || 'not_checked', payload.healthStatus || 'unknown',
       payload.demoLiveMode || 'demo',
       payload.metadata ? JSON.stringify(payload.metadata) : null,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'register_module', entityType: 'module', entityId: payload.moduleKey, afterSnapshot: payload, reason: 'module registration' });
    return { ok: true, module: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModules({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, modules: getDefaultCoreModuleRegistry(), localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_registry ORDER BY created_at DESC`);
    return { ok: true, modules: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function getModule({ moduleKey }) {
  if (!isDbAvailable()) {
    const mod = getDefaultCoreModuleRegistry().find(m => m.moduleKey === moduleKey);
    return mod ? { ok: true, module: mod, localPreview: true } : { ok: false, error: 'module_not_found', localPreview: true };
  }

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_registry WHERE module_key=$1`, [moduleKey]);
    if (!result.rows.length) return { ok: false, error: 'module_not_found' };
    return { ok: true, module: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function updateModuleStatus({ moduleKey, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isValidModuleStatus(status)) return { ok: false, error: 'invalid_module_status', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'updateModuleStatus' });

  const db = await getDb();
  try {
    const result = await db.query(
      `UPDATE novee_os_module_registry SET module_status=$1, updated_by=$2, updated_at=NOW() WHERE module_key=$3 RETURNING *`,
      [status, actorUserId, moduleKey]
    );
    await writeModuleAudit({ actorUserId, action: 'update_module_status', entityType: 'module', entityId: moduleKey, afterSnapshot: { status }, reason });
    return { ok: true, module: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── VERSIONS ────────────────────────────────────────────────────────────────

export async function createModuleVersion({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleVersion' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_versions
         (module_key, module_version, changelog, release_notes, organization_id, venue_id, contains_secrets, stores_secrets, metadata, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,$9,NOW()) RETURNING *`,
      [moduleKey, payload.moduleVersion, payload.changelog, payload.releaseNotes,
       payload.organizationId, payload.venueId,
       payload.metadata ? JSON.stringify(payload.metadata) : null,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_module_version', entityType: 'module_version', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, version: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleVersions({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, versions: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_versions WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, versions: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

export async function registerModuleBackendRoute({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'registerModuleBackendRoute' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_routes
         (module_key, route_path, http_method, route_label, guard_required, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,$8,$9,NOW()) RETURNING *`,
      [moduleKey, payload.routePath, payload.httpMethod || 'GET', payload.routeLabel,
       payload.guardRequired, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'register_backend_route', entityType: 'module_route', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, route: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleBackendRoutes({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, routes: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_routes WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, routes: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function registerModuleFrontendRoute({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'registerModuleFrontendRoute' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_frontend_routes
         (module_key, route_path, component_name, guard_required, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.routePath, payload.componentName, payload.guardRequired,
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'register_frontend_route', entityType: 'module_frontend_route', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, route: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleFrontendRoutes({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, routes: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_frontend_routes WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, routes: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── DEPENDENCIES ────────────────────────────────────────────────────────────

export async function createModuleDependency({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleDependency' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_dependencies
         (module_key, dependency_module_key, dependency_status, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,$6,$7,NOW()) RETURNING *`,
      [moduleKey, payload.dependencyModuleKey, payload.dependencyStatus || 'required',
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_module_dependency', entityType: 'module_dependency', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, dependency: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleDependencies({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, dependencies: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_dependencies WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, dependencies: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────

export async function createModulePermission({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModulePermission' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_permissions
         (module_key, permission_key, permission_scope, description, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.permissionKey, payload.permissionScope || 'staff',
       payload.description, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_module_permission', entityType: 'module_permission', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, permission: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModulePermissions({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, permissions: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_permissions WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, permissions: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────

export async function createModuleFeatureFlag({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleFeatureFlag' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_feature_flags
         (module_key, feature_flag_key, flag_value, description, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.featureFlagKey, payload.flagValue || false,
       payload.description, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_module_feature_flag', entityType: 'module_feature_flag', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, flag: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleFeatureFlags({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, flags: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_feature_flags WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, flags: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── INSTALLATIONS ────────────────────────────────────────────────────────────

export async function createModuleInstallationPlaceholder({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleInstallationPlaceholder' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_installations
         (module_key, module_version, install_status, install_reason, organization_id, venue_id,
          live_provider_connected, marketplace_purchase_completed, license_verified, billing_connected,
          deployment_completed, contains_secrets, stores_secrets, idempotency_key, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$7,$8,NOW(),NOW()) RETURNING *`,
      [moduleKey, payload.moduleVersion, payload.installStatus || 'install_ready_placeholder',
       payload.installReason, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_installation_placeholder', entityType: 'module_installation', entityId: moduleKey, afterSnapshot: { moduleKey, installStatus: payload.installStatus } });
    return { ok: true, installation: result.rows[0], note: 'placeholder_only_not_live' };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleInstallations({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, installations: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_installations ORDER BY created_at DESC`);
    return { ok: true, installations: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function updateModuleInstallStatus({ moduleKey, installStatus, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isValidInstallStatus(installStatus)) return { ok: false, error: 'invalid_install_status', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'updateModuleInstallStatus' });

  const db = await getDb();
  try {
    const result = await db.query(
      `UPDATE novee_os_module_installations SET install_status=$1, updated_by=$2, updated_at=NOW() WHERE module_key=$3 RETURNING *`,
      [installStatus, actorUserId, moduleKey]
    );
    await writeModuleAudit({ actorUserId, action: 'update_install_status', entityType: 'module_installation', entityId: moduleKey, afterSnapshot: { installStatus }, reason });
    return { ok: true, installation: result.rows[0], note: 'placeholder_only_not_live' };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── ACTIVATION ───────────────────────────────────────────────────────────────

export async function createModuleActivationState({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleActivationState' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_activation_states
         (module_key, module_version, activation_status, activation_reason, organization_id, venue_id,
          live_provider_connected, marketplace_purchase_completed, license_verified, billing_connected,
          deployment_completed, contains_secrets, stores_secrets, idempotency_key, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$7,$8,NOW(),NOW()) RETURNING *`,
      [moduleKey, payload.moduleVersion, payload.activationStatus || 'activation_ready_placeholder',
       payload.activationReason, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_activation_state', entityType: 'module_activation', entityId: moduleKey, afterSnapshot: { moduleKey, activationStatus: payload.activationStatus } });
    return { ok: true, activation: result.rows[0], note: 'placeholder_only_not_live' };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleActivationStates({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, activations: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_activation_states ORDER BY created_at DESC`);
    return { ok: true, activations: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function updateModuleActivationStatus({ moduleKey, activationStatus, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isValidActivationStatus(activationStatus)) return { ok: false, error: 'invalid_activation_status', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'updateModuleActivationStatus' });

  const db = await getDb();
  try {
    const result = await db.query(
      `UPDATE novee_os_module_activation_states SET activation_status=$1, updated_by=$2, updated_at=NOW() WHERE module_key=$3 RETURNING *`,
      [activationStatus, actorUserId, moduleKey]
    );
    await writeModuleAudit({ actorUserId, action: 'update_activation_status', entityType: 'module_activation', entityId: moduleKey, afterSnapshot: { activationStatus }, reason });
    return { ok: true, activation: result.rows[0], note: 'placeholder_only_not_live' };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export async function createTenantAvailability({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createTenantAvailability' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_tenant_availability
         (module_key, organization_id, available, availability_status, reason, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,$6,$7,NOW()) RETURNING *`,
      [moduleKey, payload.organizationId, payload.available || false,
       payload.availabilityStatus || 'unavailable', payload.reason,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_tenant_availability', entityType: 'tenant_availability', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, availability: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listTenantAvailability({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, availability: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_tenant_availability ORDER BY created_at DESC`);
    return { ok: true, availability: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function createVenueAvailability({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createVenueAvailability' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_venue_availability
         (module_key, venue_id, organization_id, available, availability_status, reason, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.venueId, payload.organizationId,
       payload.available || false, payload.availabilityStatus || 'unavailable',
       payload.reason, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_venue_availability', entityType: 'venue_availability', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, availability: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listVenueAvailability({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, availability: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_venue_availability ORDER BY created_at DESC`);
    return { ok: true, availability: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── PLAN / LICENSE ───────────────────────────────────────────────────────────

export async function createPlanRequirement({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createPlanRequirement' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_plan_requirements
         (module_key, plan_requirement_status, plan_name, description, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.planRequirementStatus || 'not_required', payload.planName,
       payload.description, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_plan_requirement', entityType: 'plan_requirement', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, requirement: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listPlanRequirements({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, requirements: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_plan_requirements WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, requirements: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function createLicenseRequirement({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createLicenseRequirement' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_license_requirements
         (module_key, license_requirement_status, license_name, license_verified, description, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,FALSE,$4,$5,$6,FALSE,FALSE,$7,$8,NOW()) RETURNING *`,
      [moduleKey, payload.licenseRequirementStatus || 'not_required', payload.licenseName,
       payload.description, payload.organizationId, payload.venueId,
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_license_requirement', entityType: 'license_requirement', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, requirement: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listLicenseRequirements({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, requirements: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_license_requirements WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, requirements: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── DEMO/LIVE MODE ───────────────────────────────────────────────────────────

export async function createDemoLiveModeRecord({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createDemoLiveModeRecord' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_demo_live_modes
         (module_key, demo_live_mode, reason, organization_id, venue_id, live_provider_connected, contains_secrets, stores_secrets, idempotency_key, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,$6,$7,NOW(),NOW()) RETURNING *`,
      [moduleKey, payload.demoLiveMode || 'demo', payload.reason,
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_demo_live_mode', entityType: 'demo_live_mode', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, record: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listDemoLiveModeRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, records: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_demo_live_modes ORDER BY created_at DESC`);
    return { ok: true, records: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function updateDemoLiveMode({ moduleKey, mode, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isValidDemoLiveMode(mode)) return { ok: false, error: 'invalid_demo_live_mode', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'updateDemoLiveMode' });

  const db = await getDb();
  try {
    const result = await db.query(
      `UPDATE novee_os_module_demo_live_modes SET demo_live_mode=$1, updated_by=$2, updated_at=NOW() WHERE module_key=$3 RETURNING *`,
      [mode, actorUserId, moduleKey]
    );
    await writeModuleAudit({ actorUserId, action: 'update_demo_live_mode', entityType: 'demo_live_mode', entityId: moduleKey, afterSnapshot: { mode }, reason });
    return { ok: true, record: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── READINESS / HEALTH ───────────────────────────────────────────────────────

export async function createModuleReadinessRecord({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleReadinessRecord' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_readiness_records
         (module_key, readiness_status, notes, organization_id, venue_id,
          live_provider_connected, marketplace_purchase_completed, license_verified,
          billing_connected, deployment_completed, contains_ai_generated_content,
          contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$6,$7,NOW()) RETURNING *`,
      [moduleKey, payload.readinessStatus || 'not_checked', payload.notes,
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_readiness_record', entityType: 'module_readiness', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, record: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleReadinessRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, records: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_readiness_records ORDER BY created_at DESC`);
    return { ok: true, records: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function createModuleHealthCheck({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleHealthCheck' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_health_checks
         (module_key, health_status, check_notes, organization_id, venue_id, live_provider_connected, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,$6,$7,NOW()) RETURNING *`,
      [moduleKey, payload.healthStatus || 'unknown', payload.checkNotes,
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_health_check', entityType: 'module_health', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, check: result.rows[0], note: 'placeholder_health_not_live' };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleHealthChecks({ filters = {} } = {}) {
  if (!isDbAvailable()) return { ok: true, checks: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_health_checks ORDER BY created_at DESC`);
    return { ok: true, checks: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── ROLLBACK ─────────────────────────────────────────────────────────────────

export async function createModuleRollbackRecord({ moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createModuleRollbackRecord' });

  const db = await getDb();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_module_rollbacks
         (module_key, module_version, rollback_status, rollback_reason, rollback_metadata, organization_id, venue_id, contains_secrets, stores_secrets, idempotency_key, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,$8,$9,NOW(),NOW()) RETURNING *`,
      [moduleKey, payload.moduleVersion, payload.rollbackStatus || 'not_requested',
       payload.rollbackReason,
       payload.rollbackMetadata ? JSON.stringify(payload.rollbackMetadata) : null,
       payload.organizationId, payload.venueId, idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_rollback_record', entityType: 'module_rollback', entityId: moduleKey, afterSnapshot: payload });
    return { ok: true, rollback: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function listModuleRollbackRecords({ moduleKey }) {
  if (!isDbAvailable()) return { ok: true, rollbacks: [], localPreview: true };

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_module_rollbacks WHERE module_key=$1 ORDER BY created_at DESC`, [moduleKey]);
    return { ok: true, rollbacks: result.rows };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function updateModuleRollbackStatus({ moduleKey, rollbackStatus, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isValidRollbackStatus(rollbackStatus)) return { ok: false, error: 'invalid_rollback_status', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'updateModuleRollbackStatus' });

  const db = await getDb();
  try {
    const result = await db.query(
      `UPDATE novee_os_module_rollbacks SET rollback_status=$1, updated_by=$2, updated_at=NOW() WHERE module_key=$3 RETURNING *`,
      [rollbackStatus, actorUserId, moduleKey]
    );
    await writeModuleAudit({ actorUserId, action: 'update_rollback_status', entityType: 'module_rollback', entityId: moduleKey, afterSnapshot: { rollbackStatus }, reason });
    return { ok: true, rollback: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── SNAPSHOTS ────────────────────────────────────────────────────────────────

export async function createPlatformControlSnapshot({ actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required', area: AREA };
  if (!isDbAvailable()) return LOCAL({ operation: 'createPlatformControlSnapshot' });

  const db = await getDb();
  const registry = getDefaultCoreModuleRegistry();
  try {
    const result = await db.query(
      `INSERT INTO novee_os_platform_control_snapshots
         (snapshot_label, total_modules, registered_modules, active_modules, installed_modules,
          platform_status, live_providers_connected, marketplace_enabled, billing_connected,
          deployment_completed, snapshot_data, contains_secrets, stores_secrets, idempotency_key, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,$7,FALSE,FALSE,$8,$9,NOW()) RETURNING *`,
      ['phase_c1_snapshot', registry.length, registry.length,
       registry.filter(m => m.activationStatus === 'active_placeholder').length,
       registry.filter(m => m.installStatus === 'installed_placeholder').length,
       'foundation_ready', JSON.stringify({ modules: registry.map(m => m.moduleKey) }),
       idempotencyKey, actorUserId]
    );
    await writeModuleAudit({ actorUserId, action: 'create_platform_control_snapshot', entityType: 'platform_snapshot', entityId: 'platform' });
    return { ok: true, snapshot: result.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

export async function getLatestPlatformControlSnapshot() {
  if (!isDbAvailable()) {
    const registry = getDefaultCoreModuleRegistry();
    return {
      ok: true, localPreview: true,
      snapshot: {
        totalModules: registry.length, registeredModules: registry.length,
        activeModules: registry.filter(m => m.activationStatus === 'active_placeholder').length,
        installedModules: registry.filter(m => m.installStatus === 'installed_placeholder').length,
        platformStatus: 'foundation_ready', liveProvidersConnected: false,
        marketplaceEnabled: false, billingConnected: false, deploymentCompleted: false,
      },
    };
  }

  const db = await getDb();
  try {
    const result = await db.query(`SELECT * FROM novee_os_platform_control_snapshots ORDER BY created_at DESC LIMIT 1`);
    return { ok: true, snapshot: result.rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message, area: AREA };
  }
}

// ─── CLAIMS ──────────────────────────────────────────────────────────────────

export function getSafeModuleClaims() {
  return {
    ok: true,
    safeToSay: [
      'NOVEE OS Phase C.1 Module Registry foundation is implemented and build-verified.',
      'All 12 core modules are registered in the in-memory registry.',
      'No module installation is claimed as live.',
      'No module activation is claimed as live.',
      'No marketplace purchase is claimed as completed.',
      'No license is claimed as verified.',
      'No billing is claimed as connected.',
      'No deployment is claimed as completed.',
      'No provider is claimed as connected.',
      'No secrets are stored.',
      'All audit records contain contains_secrets=FALSE and stores_secrets=FALSE.',
      'Platform admin guard is required on all write routes.',
      'Idempotency keys are required on all mutations.',
    ],
  };
}

export function getUnsafeModuleClaims() {
  return {
    ok: true,
    notSafeToClaim: [
      'Any module is installed in production.',
      'Any module is activated in production.',
      'Any marketplace purchase has been completed.',
      'Any license has been verified.',
      'Any billing system is connected.',
      'Any deployment is complete.',
      'Any live provider is connected.',
      'Module health checks reflect live provider status.',
      'Tenant isolation is enforced beyond venue/org-scoped records.',
    ],
  };
}

export function getModuleHonestLimitations() {
  return {
    ok: true,
    limitations: [
      'Module installations are placeholders only — live install requires Phase C provider activation.',
      'Module activations are placeholders only — live activation requires live provider connection.',
      'Marketplace is not live — no purchases can be made.',
      'License verification is not live — no licenses are issued.',
      'Billing is not connected — no billing system is active.',
      'Deployment is not completed — no production deployment has occurred.',
      'Health checks return placeholder status — no live provider is polled.',
      'Tenant isolation is structural — full multi-tenant enforcement requires Phase C.2.',
      'Production database is required for persistent registry records.',
    ],
  };
}

export function getModulePhaseRoadmap() {
  return {
    ok: true,
    roadmap: [
      { phase: 'C.1', module: 1, of: 7, title: 'Module Registry, Platform Control Center & Installable Module Governance', status: 'complete' },
      { phase: 'C.2', module: 2, of: 7, title: 'Tenant, Venue, Organization & Workspace Governance', status: 'pending' },
      { phase: 'C.3', module: 3, of: 7, title: 'Licensing, Plans, Trials, Billing Gates & Feature Access', status: 'pending' },
      { phase: 'C.4', module: 4, of: 7, title: 'User Roles, Permissions, Admin Security & Platform Governance', status: 'pending' },
      { phase: 'C.5', module: 5, of: 7, title: 'CraftHub Main Dashboard, Module Launcher, Navigation Shell & Premium Experience Hub', status: 'pending' },
      { phase: 'C.6', module: 6, of: 7, title: 'Venue Onboarding Wizard, Setup Checklist, Live/Demo Mode Controls & Readiness Flow', status: 'pending' },
      { phase: 'C.7', module: 7, of: 7, title: 'NOVEE OS Final Production Readiness, Platform Audit, Marketplace Prep & Launch Lock', status: 'pending' },
    ],
  };
}
