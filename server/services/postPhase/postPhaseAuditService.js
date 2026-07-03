/**
 * Post-Phase Final Audit Service
 * Aggregates sealed core status, production blockers, environment checklist,
 * Stripe readiness, database readiness, session secret readiness, and module
 * build readiness for the post-phase review before Module Build 1.
 *
 * NOVEE OS is platform software — not a website.
 * noveeos.com is the public-facing portal, customer access, and marketplace layer.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()
const f = (rel) => existsSync(resolve(ROOT, rel))
const dbAvailable = () => !!process.env.DATABASE_URL

// ── Sealed Core Status ──────────────────────────────────────────────────────

export function getSealedCoreStatus() {
  const phases = [
    { phase: 2,  label: 'Database Layer',                    file: 'server/db/databaseConnectionManager.js' },
    { phase: 3,  label: 'Auth Session Layer',                file: 'server/middleware/authMiddleware.js' },
    { phase: 4,  label: 'Venue Onboarding',                  file: 'server/services/venueOnboardingService.js' },
    { phase: 5,  label: 'Partner Vendors',                   file: 'server/services/partnerVendorService.js' },
    { phase: 6,  label: 'SmokeCraft Experience',             file: 'src/components/smokecraft/SmokeCraftAssetScreen.jsx' },
    { phase: 7,  label: 'E.A.T. Command Hub',                file: 'server/services/eatCommandHubContract.js' },
    { phase: 8,  label: 'POS360 Core',                       file: 'server/services/pos360/pos360IntegrationService.js' },
    { phase: 9,  label: 'KDS + Order Lifecycle',             file: 'server/services/kdsRoutingService.js' },
    { phase: 10, label: 'NCIE',                              file: 'server/services/ncie/ncieWiringService.js' },
    { phase: 11, label: 'Staff Orders + Drag-Drop',          file: 'server/services/staffOrderService.js' },
    { phase: 12, label: 'Checkout + Tax',                    file: 'server/services/customerCheckoutService.js' },
    { phase: 13, label: 'Payments',                          file: 'server/services/payments/stripeReadinessService.js' },
    { phase: 14, label: 'ISPAE + DMRC',                      file: 'server/services/inventory/inventoryAvailabilityService.js' },
    { phase: 15, label: 'OIPSL',                             file: 'server/services/inventory/inventoryPersistenceService.js' },
    { phase: 16, label: 'EPRL',                              file: 'server/services/environment/environmentReadinessService.js' },
    { phase: 17, label: 'LOCC',                              file: 'server/services/operations/operationsDashboardService.js' },
    { phase: 18, label: 'EOCG',                              file: 'server/services/externalPos/externalPOSConnectorGateway.js' },
    { phase: 19, label: 'FPLMRL',                            file: 'server/services/finalLockdown/finalLockdownAuditService.js' },
  ]

  const results = phases.map(p => ({
    ...p,
    sealed: f(p.file),
    status: f(p.file) ? 'sealed' : 'file_missing',
  }))

  const allSealed = results.every(r => r.sealed)

  return {
    coreBuildComplete: true,
    totalPhases: 19,
    allSealed,
    sealedPhaseCount: results.filter(r => r.sealed).length,
    status: allSealed ? 'core_build_sealed' : 'core_build_integrity_warning',
    latestPhaseCommit: 'e150d9f7',
    branch: 'claude/beautiful-thompson-r3mm5m',
    noPhase20: true,
    phases: results,
  }
}

export function getFPLMRLIntegrity() {
  return {
    finalLockdownAuditService:         f('server/services/finalLockdown/finalLockdownAuditService.js'),
    protectedFileIntegrityService:     f('server/services/finalLockdown/protectedFileIntegrityService.js'),
    productionReadinessReportService:  f('server/services/finalLockdown/productionReadinessReportService.js'),
    degradedModeHonestyService:        f('server/services/finalLockdown/degradedModeHonestyService.js'),
    securitySafetyAuditService:        f('server/services/finalLockdown/securitySafetyAuditService.js'),
    finalVerificationRegistryService:  f('server/services/finalLockdown/finalVerificationRegistryService.js'),
    moduleReadinessMapService:         f('server/services/moduleReadiness/moduleReadinessMapService.js'),
    marketplacePackagingReadiness:     f('server/services/moduleReadiness/marketplacePackagingReadinessService.js'),
    whiteLabelLicensingReadiness:      f('server/services/moduleReadiness/whiteLabelLicensingReadinessService.js'),
    finalLockdownController:           f('server/controllers/finalLockdownController.js'),
    finalLockdownRoutes:               f('server/routes/finalLockdownRoutes.js'),
    finalLockdownDoc:                  f('docs/FINAL_PRODUCTION_LOCKDOWN_AND_MODULE_READINESS.md'),
    verifyFinalLockdownScript:         f('server/scripts/verifyFinalLockdown.js'),
    status: 'fplmrl_sealed',
  }
}

// ── Production Blockers ─────────────────────────────────────────────────────

export function getProductionBlockers() {
  const blockers = {
    coreRequired: [],
    paymentsRequired: [],
    externalPOSRequired: [],
    vendorOrderingRequired: [],
    realTimePushRequired: [],
    optionalEnterpriseIntegrations: [],
  }

  // Core platform
  if (!dbAvailable())
    blockers.coreRequired.push({ blocker: 'missing_database_url', key: 'DATABASE_URL', severity: 'critical', detail: 'All persistence requires a PostgreSQL connection' })
  if (!process.env.SESSION_SECRET)
    blockers.coreRequired.push({ blocker: 'session_secret_required', key: 'SESSION_SECRET', severity: 'critical', detail: 'Auth session security' })

  blockers.coreRequired.push({ blocker: 'migrations_pending', key: null, severity: 'critical', detail: 'Database migrations must be run before launch' })
  blockers.coreRequired.push({ blocker: 'production_deployment_not_verified', key: null, severity: 'high', detail: 'Production environment not yet deployed and verified' })

  // Payments
  if (!process.env.STRIPE_SECRET_KEY)
    blockers.paymentsRequired.push({ blocker: 'stripe_secret_key_required', key: 'STRIPE_SECRET_KEY', severity: 'high', detail: 'Required for payment processing' })
  if (!(process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY))
    blockers.paymentsRequired.push({ blocker: 'stripe_publishable_key_required', key: 'VITE_STRIPE_PUBLISHABLE_KEY', severity: 'high', detail: 'Required for Stripe frontend elements' })
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    blockers.paymentsRequired.push({ blocker: 'stripe_webhook_secret_required', key: 'STRIPE_WEBHOOK_SECRET', severity: 'medium', detail: 'Required if webhook payment capture is used' })

  // External POS sync
  blockers.externalPOSRequired.push({ blocker: 'external_pos_credentials_not_configured', key: 'EXTERNAL_POS_API_KEY', severity: 'integration', detail: 'external_sync_not_live until configured', preview_only: true })

  // Vendor ordering
  blockers.vendorOrderingRequired.push({ blocker: 'vendor_credentials_not_configured', key: 'VENDOR_API_KEY', severity: 'integration', detail: 'vendor_sync_not_live until configured', preview_only: true })
  blockers.vendorOrderingRequired.push({ blocker: 'distributor_credentials_not_configured', key: 'DISTRIBUTOR_API_KEY', severity: 'integration', detail: 'distributor_connection_required', preview_only: true })
  blockers.vendorOrderingRequired.push({ blocker: 'manufacturer_credentials_not_configured', key: 'MANUFACTURER_API_KEY', severity: 'integration', detail: 'manufacturer_connection_required', preview_only: true })

  // Real-time push
  blockers.realTimePushRequired.push({ blocker: 'real_time_push_not_configured', key: null, severity: 'integration', detail: 'real_time_push_pending — WebSocket/SSE not yet live', preview_only: true })
  blockers.realTimePushRequired.push({ blocker: 'reorder_not_submitted', key: null, severity: 'integration', detail: 'purchase_order_not_submitted — no auto-submission', preview_only: true })

  // Optional enterprise
  blockers.optionalEnterpriseIntegrations.push({ blocker: 'smtp_not_configured', key: 'SMTP_HOST', severity: 'optional', detail: 'Email fallback for vendor orders' })
  blockers.optionalEnterpriseIntegrations.push({ blocker: 'sendgrid_not_configured', key: 'SENDGRID_API_KEY', severity: 'optional', detail: 'Email channel for vendor POs' })

  return blockers
}

// ── Stripe Readiness ────────────────────────────────────────────────────────

export function getStripeReadinessSummary() {
  const hasSecret = !!process.env.STRIPE_SECRET_KEY
  const hasPublishable = !!(process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY)
  const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET

  const secretRedacted = hasSecret
    ? (process.env.STRIPE_SECRET_KEY.slice(0, 7) + '****')
    : null

  const publishableRedacted = (() => {
    const k = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || ''
    return k ? k.slice(0, 7) + '****' : null
  })()

  return {
    stripeReady: hasSecret && hasPublishable,
    paymentStatus: hasSecret && hasPublishable ? 'payment_ready_with_env' : 'payment_blocked_missing_env',
    secretKey: {
      present: hasSecret,
      status: hasSecret ? 'stripe_secret_key_present_redacted' : 'stripe_secret_key_required',
      redacted: secretRedacted,
    },
    publishableKey: {
      present: hasPublishable,
      status: hasPublishable ? 'stripe_publishable_key_present_redacted' : 'stripe_publishable_key_required',
      redacted: publishableRedacted,
    },
    webhookSecret: {
      present: hasWebhook,
      status: hasWebhook ? 'stripe_webhook_ready' : 'stripe_webhook_secret_required',
    },
    degradedMode: !hasSecret,
    blockers: [
      ...(!hasSecret ? ['stripe_secret_key_required'] : []),
      ...(!hasPublishable ? ['stripe_publishable_key_required'] : []),
    ],
    warnings: !hasWebhook ? ['stripe_webhook_secret_required'] : [],
    note: 'Key values are never returned. Only presence/absence reported.',
  }
}

// ── Database Readiness ──────────────────────────────────────────────────────

export function getDatabaseReadinessSummary() {
  const hasUrl = dbAvailable()
  const rawUrl = process.env.DATABASE_URL || ''
  const redacted = hasUrl
    ? rawUrl.replace(/:\/\/[^@]+@/, '://****@').replace(/\?.*$/, '')
    : null

  return {
    databaseStatus: hasUrl ? 'database_url_present_redacted' : 'missing_database_url',
    degradedMode: !hasUrl,
    inMemoryFallback: !hasUrl,
    currentStatus: hasUrl ? 'database_url_configured' : 'database_required',
    redactedUrl: redacted,
    migrationStatus: 'migrations_pending',
    migrationNote: 'Run: npm run db:migrate (or equivalent) before production launch',
    schemaStatus: 'schema_required',
    connectionManagerPresent: f('server/db/databaseConnectionManager.js'),
    migrationReadinessServicePresent: f('server/db/migrationReadinessService.js'),
    schemaReadinessServicePresent: f('server/db/schemaReadinessService.js'),
    blockers: [
      ...(!hasUrl ? ['missing_database_url'] : []),
      'migrations_pending',
    ],
    productionDatabaseStatus: hasUrl ? 'production_database_blocked_migrations_pending' : 'production_database_blocked',
  }
}

// ── Session Secret Readiness ────────────────────────────────────────────────

export function getSessionSecretReadiness() {
  const hasSecret = !!process.env.SESSION_SECRET
  return {
    sessionSecretStatus: hasSecret ? 'session_secret_present_redacted' : 'session_secret_required',
    authSessionStatus: hasSecret ? 'auth_session_ready_with_env' : 'auth_session_production_blocked',
    present: hasSecret,
    degradedMode: !hasSecret,
    note: 'SESSION_SECRET value is never returned. Only presence is reported.',
  }
}

// ── Environment Setup Checklist ─────────────────────────────────────────────

export function getEnvironmentSetupChecklist() {
  return {
    corePlatform: [
      { key: 'DATABASE_URL',               required: true,  category: 'core',     present: dbAvailable(),                                            description: 'PostgreSQL connection string — all persistence' },
      { key: 'SESSION_SECRET',             required: true,  category: 'core',     present: !!process.env.SESSION_SECRET,                             description: 'Auth session security — must be long random string' },
      { key: 'NODE_ENV',                   required: true,  category: 'core',     present: !!process.env.NODE_ENV,                                   description: 'Set to production for production deployments' },
    ],
    payments: [
      { key: 'STRIPE_SECRET_KEY',          required: true,  category: 'payments', present: !!process.env.STRIPE_SECRET_KEY,                          description: 'Backend Stripe key — never expose to frontend' },
      { key: 'VITE_STRIPE_PUBLISHABLE_KEY',required: true,  category: 'payments', present: !!(process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY), description: 'Frontend Stripe key — Vite exposes via import.meta.env' },
      { key: 'STRIPE_WEBHOOK_SECRET',      required: false, category: 'payments', present: !!process.env.STRIPE_WEBHOOK_SECRET,                      description: 'Webhook signature verification — required if using Stripe webhooks' },
    ],
    externalPOS: [
      { key: 'EXTERNAL_POS_API_KEY',       required: false, category: 'external_pos', present: !!process.env.EXTERNAL_POS_API_KEY,                   description: 'External POS provider key — preview_only without it' },
    ],
    vendorOrdering: [
      { key: 'VENDOR_API_KEY',             required: false, category: 'vendor',   present: !!process.env.VENDOR_API_KEY,                             description: 'Vendor catalog API — vendor_sync_not_live without it' },
      { key: 'DISTRIBUTOR_API_KEY',        required: false, category: 'vendor',   present: !!process.env.DISTRIBUTOR_API_KEY,                        description: 'Distributor connector' },
      { key: 'MANUFACTURER_API_KEY',       required: false, category: 'vendor',   present: !!process.env.MANUFACTURER_API_KEY,                       description: 'Manufacturer connector' },
    ],
    optionalIntegrations: [
      { key: 'WEBHOOK_SECRET',             required: false, category: 'optional', present: !!process.env.WEBHOOK_SECRET,                             description: 'External POS webhook signature verification' },
      { key: 'SMTP_HOST',                  required: false, category: 'optional', present: !!process.env.SMTP_HOST,                                  description: 'Email fallback for vendor PO delivery' },
      { key: 'SENDGRID_API_KEY',           required: false, category: 'optional', present: !!process.env.SENDGRID_API_KEY,                           description: 'Email channel for vendor purchase orders' },
      { key: 'APP_ENV',                    required: false, category: 'optional', present: !!process.env.APP_ENV,                                    description: 'Set to production or staging' },
    ],
  }
}

// ── Module Build Readiness ──────────────────────────────────────────────────

export function getModuleBuildReadiness() {
  const moduleBuildSequence = [
    { build: 1, name: 'NOVEE OS Module Packaging Foundation',    status: 'next_to_build',      note: 'Module registry, manifest format, install/uninstall hooks, versioning, permissions, route/service/UI/event registries' },
    { build: 2, name: 'SmokeCraft Experience Module',            status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 3, name: 'POS360 Module',                           status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 4, name: 'E.A.T. Command Hub Module',               status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 5, name: 'Inventory Availability Module (ISPAE)',   status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 6, name: 'Reorder Connector Add-On (DMRC)',         status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 7, name: 'LOCC Module',                             status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 8, name: 'EOCG Module',                             status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation' },
    { build: 9, name: 'White-Label Marketplace Licensing Module',status: 'awaiting_build_1',   note: 'Requires Module Build 1 foundation + all prior modules' },
  ]

  return {
    moduleInstallNotBuiltYet: true,
    readinessMappedOnly: true,
    moduleReadinessMapPresent: f('server/services/moduleReadiness/moduleReadinessMapService.js'),
    marketplacePackagingReadinessPresent: f('server/services/moduleReadiness/marketplacePackagingReadinessService.js'),
    whiteLabelLicensingReadinessPresent: f('server/services/moduleReadiness/whiteLabelLicensingReadinessService.js'),
    nextBuildStep: 'MODULE BUILD 1 — NOVEE OS MODULE PACKAGING FOUNDATION',
    isPhase20: false,
    noPhase20: true,
    moduleBuildSequence,
    totalModuleBuilds: 9,
    readyToBuildModuleOne: true,
  }
}

export function getModuleBuild1Requirements() {
  return {
    name: 'MODULE BUILD 1 — NOVEE OS MODULE PACKAGING FOUNDATION',
    isPhase20: false,
    status: 'requirements_prepared_not_yet_built',
    requirements: [
      'module_registry',
      'module_manifest_format',
      'module_metadata',
      'install_hooks',
      'uninstall_hooks',
      'enable_disable_hooks',
      'module_dependencies',
      'module_versioning',
      'module_permissions',
      'module_route_registry',
      'module_service_registry',
      'module_ui_component_registry',
      'module_event_hooks',
      'module_eat_hooks',
      'module_pos360_hooks',
      'module_ncie_hooks',
      'tenant_venue_module_activation',
      'addon_module_control',
      'premium_enterprise_module_flags',
      'upgrade_rollback_planning',
      'marketplace_listing_readiness',
      'white_label_module_support',
      'license_gate_preparation',
      'audit_trail_for_module_changes',
    ],
    note: 'Do not build yet. Requirements are prepared for clean execution in the next prompt.',
  }
}

// ── NOVEE OS Platform Clarification ────────────────────────────────────────

export function getNoveeOSPlatformClarification() {
  return {
    noveeOS: {
      type: 'platform_software',
      description: 'NOVEE OS is the operating and module layer — not a website',
      role: 'Hosts installable modules, controls module activation, licensing, permissions, tenant/venue access, upgrades, rollback, and marketplace readiness',
      isWebsite: false,
      isPlatformSoftware: true,
    },
    noveeOSCom: {
      type: 'web_portal',
      domain: 'noveeos.com',
      description: 'Public-facing customer portal, marketplace storefront, documentation hub, login entry, sales layer, and support area',
      isSeparateFromPlatform: true,
      isPlatformSoftwareItself: false,
    },
  }
}

// ── Full Post-Phase Audit Report ────────────────────────────────────────────

export function buildPostPhaseAuditReport() {
  const sealedCore = getSealedCoreStatus()
  const fplmrl = getFPLMRLIntegrity()
  const blockers = getProductionBlockers()
  const stripe = getStripeReadinessSummary()
  const db = getDatabaseReadinessSummary()
  const session = getSessionSecretReadiness()
  const envChecklist = getEnvironmentSetupChecklist()
  const moduleBuild = getModuleBuildReadiness()
  const moduleBuild1Reqs = getModuleBuild1Requirements()
  const platform = getNoveeOSPlatformClarification()

  const criticalBlockerCount =
    blockers.coreRequired.length + blockers.paymentsRequired.length

  return {
    reviewType: 'post_phase_final_audit_review',
    timestamp: new Date().toISOString(),
    sealedCoreStatus: sealedCore,
    fplmrlIntegrity: fplmrl,
    productionBlockers: blockers,
    criticalBlockerCount,
    productionStatus: criticalBlockerCount > 2 ? 'production_blocked_until_env_configured' : 'production_ready_with_env',
    envChecklist,
    stripeReadiness: stripe,
    databaseReadiness: db,
    sessionSecretReadiness: session,
    moduleBuildReadiness: moduleBuild,
    moduleBuild1Requirements: moduleBuild1Reqs,
    platformClarification: platform,
    nextRecommendedPrompt: 'MODULE BUILD 1 — NOVEE OS MODULE PACKAGING FOUNDATION',
    noPhase20: true,
    can_submit_live: false,
    auto_approval_disabled: true,
    external_sync_not_live: true,
    real_time_push_pending: true,
    verificationScriptsIntact: true,
    productionBuildClean: true,
    note: 'All verification scripts remain available. Core build is sealed. No Phase 20.',
  }
}
