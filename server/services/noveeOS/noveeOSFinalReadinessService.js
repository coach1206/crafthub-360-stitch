/**
 * Phase C.7 — NOVEE OS Final Platform Readiness Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  isValidReadinessStatus, isValidLaunchStatus, isValidAuditStatus,
  isValidBlockerStatus, isValidActivationStatus,
} from './noveeOSFinalReadinessContracts.js';

const AREA = 'novee_os_final_readiness';
const localFallback = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra });
const requireIdempotency = (key) => !key ? { ok: false, error: 'idempotency_key_required' } : null;
const actorId = (v) => v || 'system';

// ─── Synchronous default data ─────────────────────────────────────────────────

export function getDefaultFinalReadinessDashboard() {
  return {
    ok: true,
    localPreview: true,
    dashboard: {
      phase: 'C.7',
      module: '7 of 7',
      title: 'NOVEE OS Final Platform Readiness',
      launch_status: 'foundation_locked',
      readiness_status: 'foundation_ready',
      production_live: false,
      provider_activation_required: true,
      deployment_required: true,
      honest_limitation: 'Foundation ready. Real providers, payments, deployment, and live activation are Phase D work.',
    },
  };
}

export function getDefaultPlatformAuditCategories() {
  const categories = [
    'database', 'api_routes', 'frontend_routes', 'guards', 'feature_flags',
    'locales', 'services', 'controllers', 'verification', 'build',
    'documentation', 'security', 'billing', 'marketplace',
    'provider_activation', 'deployment', 'safe_claims', 'no_fake_claims',
  ];
  return {
    ok: true,
    localPreview: true,
    categories: categories.map(k => ({
      category_key: k,
      audit_status: 'passed_placeholder',
      foundation_ready: true,
      production_live: false,
    })),
  };
}

export function getDefaultModuleReadinessMatrix() {
  const modules = [
    { key: 'novee_os', name: 'NOVEE OS Module Registry', phase: 'C1', status: 'foundation_ready' },
    { key: 'crafthub', name: 'CraftHub Dashboard + Onboarding', phase: 'C5-C6', status: 'foundation_ready' },
    { key: 'pos360', name: 'POS360 Phase B', phase: 'B', status: 'foundation_ready' },
    { key: 'smokecraft', name: 'SmokeCraft Foundation', phase: 'B', status: 'foundation_ready' },
    { key: 'pourcraft', name: 'PourCraft', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'eat_system', name: 'E.A.T. System', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'passport_connections', name: 'Passport / Connections', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'loyalty_rewards', name: 'Loyalty / Rewards', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'inventory', name: 'Inventory', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'reports', name: 'Reports', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'external_integrations', name: 'External Integrations', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'marketplace', name: 'Marketplace', phase: 'placeholder', status: 'placeholder_ready' },
    { key: 'provider_activation', name: 'Provider Activation', phase: 'D', status: 'provider_activation_required' },
    { key: 'deployment', name: 'Deployment', phase: 'D', status: 'deployment_required' },
  ];
  return {
    ok: true,
    localPreview: true,
    matrix: modules.map(m => ({
      module_key: m.key,
      module_name: m.name,
      phase: m.phase,
      readiness_status: m.status,
      production_live: false,
      provider_connected: false,
      module_installed: false,
      module_activated: false,
    })),
  };
}

export function getDefaultSafeSalesClaims() {
  return {
    ok: true,
    localPreview: true,
    claims: [
      { claim_key: 'foundation_grade', claim_status: 'safe', claim_text: 'Production-grade foundation with module registry, tenant governance, billing gates, and security governance.' },
      { claim_key: 'module_first_architecture', claim_status: 'safe', claim_text: 'Module-first architecture with installable modules, readiness tracking, and platform audit.' },
      { claim_key: 'venue_onboarding_foundation', claim_status: 'safe', claim_text: 'Venue onboarding wizard, setup checklist, live/demo mode controls, and readiness flow.' },
      { claim_key: 'pos360_foundation', claim_status: 'safe', claim_text: 'POS360 Phase B production foundation ready for provider activation.' },
      { claim_key: 'crafthub_launcher_foundation', claim_status: 'safe', claim_text: 'CraftHub dashboard, module launcher, and navigation shell.' },
      { claim_key: 'governance_foundation', claim_status: 'safe', claim_text: 'Tenant, venue, workspace governance with idempotency and audit controls.' },
      { claim_key: 'billing_gate_foundation', claim_status: 'safe', claim_text: 'Billing and licensing gate foundation — activation required for live payments.' },
      { claim_key: 'security_foundation', claim_status: 'safe', claim_text: 'Security governance foundation with role and permission management.' },
      { claim_key: 'readiness_audit_foundation', claim_status: 'safe', claim_text: 'Readiness and audit foundation with launch-lock documentation.' },
      { claim_key: 'provider_activation_ready', claim_status: 'safe', claim_text: 'Provider-activation ready — awaiting Phase D provider connections.' },
    ],
  };
}

export function getDefaultUnsafeSalesClaims() {
  return {
    ok: true,
    localPreview: true,
    claims: [
      { claim_key: 'live_pos', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live POS replacement — not live. Provider activation required.' },
      { claim_key: 'live_payments', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live payment processor — not live. Billing activation required.' },
      { claim_key: 'live_stripe', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live Stripe billing — not live. Provider activation required.' },
      { claim_key: 'live_marketplace', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live marketplace — not live. Marketplace activation required.' },
      { claim_key: 'live_sso_mfa', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live SSO/MFA — not live. Security provider activation required.' },
      { claim_key: 'live_kds_hardware', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live KDS/printer hardware — not live. Hardware activation required.' },
      { claim_key: 'live_inventory', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live inventory deduction — not live. Inventory sync activation required.' },
      { claim_key: 'live_eat_automation', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live E.A.T. AI automation — not live. E.A.T. provider activation required.' },
      { claim_key: 'live_smokecraft', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live SmokeCraft sync — not live. SmokeCraft provider sync required.' },
      { claim_key: 'live_white_label', claim_status: 'unsafe', reason: 'not_live', claim_text: 'Live white-label custom domain — not live. Deployment required.' },
    ],
  };
}

export function getDefaultLaunchBlockers() {
  return {
    ok: true,
    localPreview: true,
    blockers: [
      { blocker_key: 'provider_activation', blocker_status: 'open', title: 'Provider Activation Required', description: 'No live POS, billing, or payment providers connected. Phase D.' },
      { blocker_key: 'deployment_required', blocker_status: 'open', title: 'Deployment Required', description: 'No production deployment completed. Phase D.' },
      { blocker_key: 'marketplace_not_live', blocker_status: 'open', title: 'Marketplace Not Live', description: 'Marketplace is placeholder only. Phase D.' },
      { blocker_key: 'license_not_active', blocker_status: 'open', title: 'License Not Active', description: 'No active license verified. Phase D.' },
    ],
  };
}

export function getDefaultActivationRequirements() {
  return {
    ok: true,
    localPreview: true,
    requirements: [
      { requirement_key: 'pos_provider', activation_status: 'activation_required', title: 'POS Provider', description: 'Connect live POS provider.' },
      { requirement_key: 'payment_provider', activation_status: 'activation_required', title: 'Payment Provider', description: 'Connect live payment processor.' },
      { requirement_key: 'billing_provider', activation_status: 'activation_required', title: 'Billing Provider', description: 'Connect live billing/subscription provider.' },
      { requirement_key: 'deployment_provider', activation_status: 'activation_required', title: 'Deployment', description: 'Complete production deployment.' },
    ],
  };
}

export function getDefaultPhaseCompletionRecords() {
  return {
    ok: true,
    localPreview: true,
    phases: [
      { phase_key: 'c1_module_registry', phase_name: 'NOVEE OS Module Registry', module: '1 of 7', status: 'complete', commit: 'f0484458', checks: 364 },
      { phase_key: 'c2_tenant_governance', phase_name: 'Tenant / Venue / Workspace Governance', module: '2 of 7', status: 'complete', commit: '6423d50e', checks: 357 },
      { phase_key: 'c3_billing_gates', phase_name: 'Licensing / Billing Gates', module: '3 of 7', status: 'complete', commit: '336b59e8', checks: 310 },
      { phase_key: 'c4_security_governance', phase_name: 'User Roles / Permissions / Security', module: '4 of 7', status: 'complete', commit: 'ad293f37', checks: 301 },
      { phase_key: 'c5_crafthub_dashboard', phase_name: 'CraftHub Launcher', module: '5 of 7', status: 'complete', commit: 'd121b567', checks: 340 },
      { phase_key: 'c6_venue_onboarding', phase_name: 'Venue Onboarding', module: '6 of 7', status: 'complete', commit: '072bb2b9', checks: 396 },
      { phase_key: 'c7_final_launch_lock', phase_name: 'Final Platform Launch Lock', module: '7 of 7', status: 'current' },
    ],
  };
}

export function getSafeFinalSalesClaims() {
  return getDefaultSafeSalesClaims();
}

export function getUnsafeFinalSalesClaims() {
  return getDefaultUnsafeSalesClaims();
}

export function getFinalHonestLimitations() {
  return {
    ok: true,
    localPreview: true,
    limitations: [
      'Foundation is ready. No live production activation has occurred.',
      'Provider activation is pending Phase D — no live POS, billing, or payment providers are connected.',
      'Marketplace is placeholder only — no real purchases, transactions, or listings are live.',
      'Deployment is pending Phase D — no production deployment has completed.',
      'SSO, MFA, and compliance certification are not active.',
      'Inventory sync, menu import, and staff invite delivery are placeholder flows only.',
      'SmokeCraft, E.A.T., PourCraft, Passport, Loyalty, and Reports are placeholder modules.',
      'No secrets are stored in this system.',
      'No fake provider connections have been created.',
    ],
    provider_activation_pending: true,
    deployment_pending: true,
    production_live: false,
  };
}

export function getFinalLaunchPhaseRoadmap() {
  return {
    ok: true,
    phases: [
      { phase: 'C1', module: '1 of 7', name: 'NOVEE OS Module Registry', status: 'complete' },
      { phase: 'C2', module: '2 of 7', name: 'Tenant / Venue / Workspace Governance', status: 'complete' },
      { phase: 'C3', module: '3 of 7', name: 'Licensing / Billing Gates', status: 'complete' },
      { phase: 'C4', module: '4 of 7', name: 'User Roles / Permissions / Security', status: 'complete' },
      { phase: 'C5', module: '5 of 7', name: 'CraftHub Launcher', status: 'complete' },
      { phase: 'C6', module: '6 of 7', name: 'Venue Onboarding', status: 'complete' },
      { phase: 'C7', module: '7 of 7', name: 'Final Platform Launch Lock', status: 'current' },
    ],
  };
}

export function getFinalLaunchSummary() {
  return {
    ok: true,
    localPreview: true,
    summary: {
      title: 'NOVEE OS Phase C — Foundation Complete',
      phase_c_complete: true,
      production_live: false,
      provider_activation_pending: true,
      deployment_pending: true,
      modules_complete: 7,
      modules_total: 7,
      safe_claim: 'NOVEE OS / CraftHub has a production-grade foundation. Real providers, payments, deployment, and live activation are Phase D work.',
      next_phase: 'Phase D — Provider Activation',
      recommended_phase_d_order: [
        '1. POS provider connection (POS360)',
        '2. Payment processor activation',
        '3. Billing / subscription provider activation',
        '4. Production deployment',
        '5. Marketplace activation',
        '6. SSO / MFA activation',
        '7. SmokeCraft provider sync',
        '8. E.A.T. AI provider activation',
        '9. White-label / custom domain deployment',
        '10. Compliance certification',
      ],
    },
  };
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function createRecord(tableName, payload, actorUserId, idempotencyKey) {
  const guard = requireIdempotency(idempotencyKey);
  if (guard) return guard;
  if (!isDbAvailable()) return localFallback({ table: tableName });
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `INSERT INTO ${tableName} (actor_user_id, idempotency_key, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [actorId(actorUserId), idempotencyKey, JSON.stringify(payload)]
    );
    return { ok: true, record: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function listRecords(tableName, filters = {}) {
  if (!isDbAvailable()) return localFallback({ table: tableName, records: [] });
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, records: rows };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Session methods ──────────────────────────────────────────────────────────

export async function createFinalReadinessSession({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_final_readiness_sessions', payload, actorUserId, idempotencyKey);
}
export async function listFinalReadinessSessions({ filters } = {}) {
  return listRecords('novee_os_final_readiness_sessions', filters);
}
export async function updateFinalReadinessSessionStatus({ readinessSessionId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidReadinessStatus(status) && !isValidLaunchStatus(status)) return { ok: false, error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `UPDATE novee_os_final_readiness_sessions SET readiness_status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 RETURNING *`,
      [status, actorId(actorUserId), readinessSessionId]
    );
    return { ok: true, record: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function createFinalReadinessCheck({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_final_readiness_checks', payload, actorUserId, idempotencyKey);
}
export async function listFinalReadinessChecks({ filters } = {}) {
  return listRecords('novee_os_final_readiness_checks', filters);
}

export async function createFinalReadinessResult({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_final_readiness_results', payload, actorUserId, idempotencyKey);
}
export async function listFinalReadinessResults({ filters } = {}) {
  return listRecords('novee_os_final_readiness_results', filters);
}

// ─── Audit category methods ───────────────────────────────────────────────────

export async function createPlatformAuditCategory({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_platform_audit_categories', payload, actorUserId, idempotencyKey);
}
export async function listPlatformAuditCategories({ filters } = {}) {
  return listRecords('novee_os_platform_audit_categories', filters);
}
export async function createPlatformAuditFinding({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_platform_audit_findings', payload, actorUserId, idempotencyKey);
}
export async function listPlatformAuditFindings({ filters } = {}) {
  return listRecords('novee_os_platform_audit_findings', filters);
}
export async function updatePlatformAuditFindingStatus({ findingId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidAuditStatus(status)) return { ok: false, error: 'invalid_audit_status' };
  if (!isDbAvailable()) return localFallback();
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `UPDATE novee_os_platform_audit_findings SET audit_status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 RETURNING *`,
      [status, actorId(actorUserId), findingId]
    );
    return { ok: true, record: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Blockers ─────────────────────────────────────────────────────────────────

export async function createPlatformLaunchBlocker({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_platform_launch_blockers', payload, actorUserId, idempotencyKey);
}
export async function listPlatformLaunchBlockers({ filters } = {}) {
  return listRecords('novee_os_platform_launch_blockers', filters);
}
export async function updatePlatformLaunchBlockerStatus({ blockerId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidBlockerStatus(status)) return { ok: false, error: 'invalid_blocker_status' };
  if (!isDbAvailable()) return localFallback();
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `UPDATE novee_os_platform_launch_blockers SET blocker_status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 RETURNING *`,
      [status, actorId(actorUserId), blockerId]
    );
    return { ok: true, record: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Activation requirements ──────────────────────────────────────────────────

export async function createPlatformActivationRequirement({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_platform_activation_requirements', payload, actorUserId, idempotencyKey);
}
export async function listPlatformActivationRequirements({ filters } = {}) {
  return listRecords('novee_os_platform_activation_requirements', filters);
}
export async function updatePlatformActivationRequirementStatus({ requirementId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidActivationStatus(status)) return { ok: false, error: 'invalid_activation_status' };
  if (!isDbAvailable()) return localFallback();
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `UPDATE novee_os_platform_activation_requirements SET activation_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, requirementId]
    );
    return { ok: true, record: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

export async function createMarketplacePrepRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_platform_marketplace_prep_records', payload, actorUserId, idempotencyKey);
}
export async function listMarketplacePrepRecords({ filters } = {}) {
  return listRecords('novee_os_platform_marketplace_prep_records', filters);
}
export async function createMarketplaceListingPlaceholder({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_marketplace_listing_placeholders', payload, actorUserId, idempotencyKey);
}
export async function listMarketplaceListingPlaceholders({ filters } = {}) {
  return listRecords('novee_os_marketplace_listing_placeholders', filters);
}
export async function createMarketplacePurchaseReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_marketplace_purchase_readiness', payload, actorUserId, idempotencyKey);
}
export async function listMarketplacePurchaseReadiness({ filters } = {}) {
  return listRecords('novee_os_marketplace_purchase_readiness', filters);
}

// ─── Provider / deployment / mode readiness ───────────────────────────────────

export async function createProviderActivationReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_provider_activation_readiness', payload, actorUserId, idempotencyKey);
}
export async function listProviderActivationReadiness({ filters } = {}) {
  return listRecords('novee_os_provider_activation_readiness', filters);
}
export async function createDeploymentReadinessRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_deployment_readiness_records', payload, actorUserId, idempotencyKey);
}
export async function listDeploymentReadinessRecords({ filters } = {}) {
  return listRecords('novee_os_deployment_readiness_records', filters);
}
export async function createDemoLiveReadinessRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_demo_live_readiness_records', payload, actorUserId, idempotencyKey);
}
export async function listDemoLiveReadinessRecords({ filters } = {}) {
  return listRecords('novee_os_demo_live_readiness_records', filters);
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export async function createSafeSalesClaim({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_safe_sales_claims', payload, actorUserId, idempotencyKey);
}
export async function listSafeSalesClaims({ filters } = {}) {
  return listRecords('novee_os_safe_sales_claims', filters);
}
export async function createUnsafeSalesClaim({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_unsafe_sales_claims', payload, actorUserId, idempotencyKey);
}
export async function listUnsafeSalesClaims({ filters } = {}) {
  return listRecords('novee_os_unsafe_sales_claims', filters);
}

// ─── Foundation / phase / matrix ──────────────────────────────────────────────

export async function createFoundationLockRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_foundation_lock_records', payload, actorUserId, idempotencyKey);
}
export async function listFoundationLockRecords({ filters } = {}) {
  return listRecords('novee_os_foundation_lock_records', filters);
}
export async function createPhaseCompletionRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_phase_completion_records', payload, actorUserId, idempotencyKey);
}
export async function listPhaseCompletionRecords({ filters } = {}) {
  return listRecords('novee_os_phase_completion_records', filters);
}
export async function createModuleReadinessMatrixRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_module_readiness_matrix', payload, actorUserId, idempotencyKey);
}
export async function listModuleReadinessMatrix({ filters } = {}) {
  return listRecords('novee_os_module_readiness_matrix', filters);
}

// ─── Readiness category tables ────────────────────────────────────────────────

export async function createDocumentationReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_documentation_readiness', payload, actorUserId, idempotencyKey);
}
export async function listDocumentationReadiness({ filters } = {}) {
  return listRecords('novee_os_documentation_readiness', filters);
}
export async function createVerificationReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_verification_readiness', payload, actorUserId, idempotencyKey);
}
export async function listVerificationReadiness({ filters } = {}) {
  return listRecords('novee_os_verification_readiness', filters);
}
export async function createBuildReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_build_readiness', payload, actorUserId, idempotencyKey);
}
export async function listBuildReadiness({ filters } = {}) {
  return listRecords('novee_os_build_readiness', filters);
}
export async function createRouteReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_route_readiness', payload, actorUserId, idempotencyKey);
}
export async function listRouteReadiness({ filters } = {}) {
  return listRecords('novee_os_route_readiness', filters);
}
export async function createUIReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_ui_readiness', payload, actorUserId, idempotencyKey);
}
export async function listUIReadiness({ filters } = {}) {
  return listRecords('novee_os_ui_readiness', filters);
}
export async function createGovernanceReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_governance_readiness', payload, actorUserId, idempotencyKey);
}
export async function listGovernanceReadiness({ filters } = {}) {
  return listRecords('novee_os_governance_readiness', filters);
}
export async function createSecurityReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_security_readiness', payload, actorUserId, idempotencyKey);
}
export async function listSecurityReadiness({ filters } = {}) {
  return listRecords('novee_os_security_readiness', filters);
}
export async function createBillingReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_billing_readiness', payload, actorUserId, idempotencyKey);
}
export async function listBillingReadiness({ filters } = {}) {
  return listRecords('novee_os_billing_readiness', filters);
}
export async function createIntegrationReadiness({ payload, actorUserId, idempotencyKey }) {
  return createRecord('novee_os_integration_readiness', payload, actorUserId, idempotencyKey);
}
export async function listIntegrationReadiness({ filters } = {}) {
  return listRecords('novee_os_integration_readiness', filters);
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export async function createFinalLaunchSnapshot({ actorUserId, idempotencyKey }) {
  const guard = requireIdempotency(idempotencyKey);
  if (guard) return guard;
  const snapshot = {
    taken_at: new Date().toISOString(),
    phase: 'C7',
    launch_status: 'foundation_locked',
    production_live: false,
    provider_activation_pending: true,
    deployment_pending: true,
  };
  if (!isDbAvailable()) return localFallback({ snapshot });
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `INSERT INTO novee_os_final_launch_snapshots (actor_user_id, idempotency_key, snapshot_data, launch_status)
       VALUES ($1, $2, $3, 'foundation_locked')
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [actorId(actorUserId), idempotencyKey, JSON.stringify(snapshot)]
    );
    return { ok: true, snapshot: rows[0] || snapshot };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function getLatestFinalLaunchSnapshot() {
  if (!isDbAvailable()) return localFallback({ snapshot: null });
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(`SELECT * FROM novee_os_final_launch_snapshots ORDER BY created_at DESC LIMIT 1`);
    return { ok: true, snapshot: rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function writeFinalLaunchAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = (await import('../../db/connection.js')).default;
    const { rows } = await db.query(
      `INSERT INTO novee_os_final_launch_audit
       (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [actorId(actorUserId), action, entityType || null, entityId || null,
       beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
       afterSnapshot ? JSON.stringify(afterSnapshot) : null,
       reason || null]
    );
    return { ok: true, audit: rows[0] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
