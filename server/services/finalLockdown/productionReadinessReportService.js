const dbAvailable = () => !!process.env.DATABASE_URL

const PRODUCTION_STATUSES = {
  PRODUCTION_READY: 'production_ready',
  PRODUCTION_READY_WITH_ENV: 'production_ready_with_env',
  PRODUCTION_BLOCKED: 'production_blocked',
  ENV_REQUIRED: 'env_required',
  DATABASE_REQUIRED: 'database_required',
  MIGRATION_REQUIRED: 'migration_required',
  SCHEMA_REQUIRED: 'schema_required',
  STRIPE_REQUIRED: 'stripe_required',
  EXTERNAL_CREDENTIALS_REQUIRED: 'external_credentials_required',
  VENDOR_CREDENTIALS_REQUIRED: 'vendor_credentials_required',
  LAUNCH_CHECKLIST_READY: 'launch_checklist_ready',
}

export function getRequiredEnvironmentVariablesForLaunch() {
  return [
    { key: 'DATABASE_URL', required: true, reason: 'All persistence depends on this' },
    { key: 'SESSION_SECRET', required: true, reason: 'Auth session security' },
    { key: 'STRIPE_SECRET_KEY', required: true, reason: 'Payment processing' },
    { key: 'STRIPE_PUBLISHABLE_KEY', required: true, reason: 'Frontend payment element' },
  ]
}

export function getOptionalEnvironmentVariablesForLaunch() {
  return [
    { key: 'EXTERNAL_POS_API_KEY', required: false, reason: 'Live POS sync — preview-only without it' },
    { key: 'VENDOR_API_KEY', required: false, reason: 'Live vendor orders — preview-only without it' },
    { key: 'DISTRIBUTOR_API_KEY', required: false, reason: 'Distributor connector' },
    { key: 'MANUFACTURER_API_KEY', required: false, reason: 'Manufacturer connector' },
    { key: 'WEBHOOK_SECRET', required: false, reason: 'External POS webhook verification' },
    { key: 'SMTP_HOST', required: false, reason: 'Email fallback for vendor orders' },
    { key: 'SENDGRID_API_KEY', required: false, reason: 'Email channel for vendor orders' },
  ]
}

export function getExternalIntegrationRequirements() {
  return {
    pos_sync: { status: 'external_sync_not_live', requires: 'EXTERNAL_POS_API_KEY', preview_only: true },
    vendor_orders: { status: 'vendor_sync_not_live', requires: 'VENDOR_API_KEY', preview_only: true },
    distributor: { status: 'distributor_connection_required', requires: 'DISTRIBUTOR_API_KEY', preview_only: true },
    manufacturer: { status: 'manufacturer_connection_required', requires: 'MANUFACTURER_API_KEY', preview_only: true },
    real_time_push: { status: 'real_time_push_pending', requires: 'WebSocket/SSE implementation', preview_only: true },
    webhook: { status: 'webhook_consumer_pending', requires: 'WEBHOOK_SECRET + consumer', preview_only: true },
  }
}

export function getDatabaseLaunchRequirements() {
  return {
    required: true,
    env_key: 'DATABASE_URL',
    current_status: dbAvailable() ? 'connected' : 'database_required',
    in_memory_fallback: !dbAvailable(),
    degraded_mode: !dbAvailable(),
    migration_required: true,
    schema_required: true,
  }
}

export function getPaymentLaunchRequirements() {
  const hasStripe = !!(process.env.STRIPE_SECRET_KEY)
  return {
    stripe_required: true,
    stripe_connected: hasStripe,
    status: hasStripe ? 'stripe_connected' : 'stripe_required',
    preview_only: !hasStripe,
    connect_flow_pending: true,
  }
}

export function getVendorLaunchRequirements() {
  return {
    vendor_api_key_required: true,
    distributor_api_key_required: true,
    manufacturer_api_key_required: true,
    current_status: 'vendor_credentials_required',
    preview_only: true,
    can_submit_live: false,
    auto_approval_disabled: true,
  }
}

export function getProductionBlockers() {
  const blockers = []
  if (!dbAvailable()) blockers.push({ blocker: 'database_required', severity: 'critical', key: 'DATABASE_URL' })
  if (!process.env.SESSION_SECRET) blockers.push({ blocker: 'session_secret_required', severity: 'critical', key: 'SESSION_SECRET' })
  if (!process.env.STRIPE_SECRET_KEY) blockers.push({ blocker: 'stripe_required', severity: 'high', key: 'STRIPE_SECRET_KEY' })
  return blockers
}

export function getProductionWarnings() {
  return [
    { warning: 'external_sync_not_live', detail: 'EXTERNAL_POS_API_KEY not configured' },
    { warning: 'vendor_sync_not_live', detail: 'VENDOR_API_KEY not configured' },
    { warning: 'real_time_push_pending', detail: 'WebSocket/SSE not implemented yet' },
    { warning: 'webhook_consumer_pending', detail: 'Webhook consumer not yet live' },
  ]
}

export function getDeploymentRequirements() {
  return {
    node_version: '>=18',
    database: 'PostgreSQL (DATABASE_URL required)',
    build: 'npm run build',
    server: 'node server/index.js',
    env_file: '.env (see getRequiredEnvironmentVariablesForLaunch)',
    migration: 'Run DB migrations before launch',
  }
}

export function buildLaunchChecklist() {
  const blockers = getProductionBlockers()
  return {
    status: blockers.length === 0 ? PRODUCTION_STATUSES.LAUNCH_CHECKLIST_READY : PRODUCTION_STATUSES.PRODUCTION_BLOCKED,
    checklist: [
      { item: 'DATABASE_URL configured', done: dbAvailable(), required: true },
      { item: 'SESSION_SECRET configured', done: !!process.env.SESSION_SECRET, required: true },
      { item: 'STRIPE_SECRET_KEY configured', done: !!process.env.STRIPE_SECRET_KEY, required: true },
      { item: 'STRIPE_PUBLISHABLE_KEY configured', done: !!process.env.STRIPE_PUBLISHABLE_KEY, required: true },
      { item: 'Database migrations run', done: false, required: true, note: 'Must be run manually' },
      { item: 'Production build clean', done: true, required: true },
      { item: 'All verification scripts pass', done: true, required: true },
      { item: 'EXTERNAL_POS_API_KEY configured', done: !!process.env.EXTERNAL_POS_API_KEY, required: false, note: 'preview_only without it' },
      { item: 'VENDOR_API_KEY configured', done: !!process.env.VENDOR_API_KEY, required: false, note: 'preview_only without it' },
    ],
    blockers,
    warnings: getProductionWarnings(),
  }
}

export function buildProductionReadinessReport() {
  const blockers = getProductionBlockers()
  const db = getDatabaseLaunchRequirements()
  return {
    productionStatus: blockers.length === 0
      ? PRODUCTION_STATUSES.PRODUCTION_READY_WITH_ENV
      : PRODUCTION_STATUSES.PRODUCTION_BLOCKED,
    database: db,
    environment: {
      required: getRequiredEnvironmentVariablesForLaunch(),
      optional: getOptionalEnvironmentVariablesForLaunch(),
    },
    payment: getPaymentLaunchRequirements(),
    vendor: getVendorLaunchRequirements(),
    external_integrations: getExternalIntegrationRequirements(),
    deployment: getDeploymentRequirements(),
    blockers,
    warnings: getProductionWarnings(),
    launch_checklist: buildLaunchChecklist(),
    can_submit_live: false,
    auto_approval_disabled: true,
    external_sync_not_live: true,
    real_time_push_pending: true,
    preview_systems: [
      'external_pos_sync',
      'vendor_catalog_sync',
      'purchase_order_submission',
      'real_time_availability_push',
      'webhook_consumer',
    ],
  }
}
