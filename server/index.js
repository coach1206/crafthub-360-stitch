/**
 * NOVEE OS — Express Backend
 * Phase 10: Auth v2 + RBAC + Security Hardening
 *
 * Runs on PORT (default 3001).
 * Frontend (Vite, port 5000) proxies /api/* to this server.
 */

import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'
import path         from 'node:path'
import fs           from 'node:fs'
import { fileURLToPath } from 'node:url'

import healthRoutes          from './routes/healthRoutes.js'
import sessionRoutes         from './routes/sessionRoutes.js'
import passportRoutes        from './routes/passportRoutes.js'
import leaderboardRoutes     from './routes/leaderboardRoutes.js'
import pos3Routes            from './routes/pos3Routes.js'
import eatRoutes             from './routes/eatRoutes.js'
import auditRoutes           from './routes/auditRoutes.js'
import adminRoutes           from './routes/adminRoutes.js'
import founderRoutes         from './routes/founderRoutes.js'
import authRoutes            from './routes/authRoutes.js'
import mentorRoutes          from './routes/mentorRoutes.js'
import developerRoutes       from './routes/developerRoutes.js'
import accessRequestsRoutes  from './routes/accessRequestsRoutes.js'
import pos3IntegrationRoutes, {
  eatFeedRouter   as pos3EatFeedRouter,
  founderPosRouter as pos3FounderRouter,
  syncRouter       as pos3SyncRouter,
}                            from './routes/pos3IntegrationRoutes.js'
import voiceRoutes           from './routes/voiceRoutes.js'
import syncRoutes             from './routes/syncRoutes.js'
import syncReconciliationRoutes from './routes/syncReconciliationRoutes.js'
import syncAuditRoutes        from './routes/syncAuditRoutes.js'
import deviceRoutes          from './routes/deviceRoutes.js'
import deploymentRoutes      from './routes/deploymentRoutes.js'
import venueTestRoutes       from './routes/venueTestRoutes.js'
import demoRoutes            from './routes/demoRoutes.js'
import pilotRoutes           from './routes/pilotRoutes.js'
import pairingOrderRoutes    from './routes/pairingOrderRoutes.js'
import smokecraftOrders      from './routes/smokecraftOrders.js'
import smokecraftRoutes      from './routes/smokecraftRoutes.js'
import smokecraftEatRoutes   from './routes/smokecraftEatRoutes.js'
import rankingRoutes         from './routes/rankingRoutes.js'
import badgeRoutes           from './routes/badgeRoutes.js'
import tickerRoutes          from './routes/tickerRoutes.js'
import travelRoutes          from './routes/travelRoutes.js'
import venueCommerceRoutes              from './routes/venueCommerceRoutes.js'
import smokecraftCommerceRoutes         from './routes/smokecraftCommerceRoutes.js'
import smokecraftVenueCommerceRoutes       from './routes/smokecraftVenueCommerceRoutes.js'
import smokecraftTicketTapperSpecialsRoutes from './routes/smokecraftTicketTapperSpecialsRoutes.js'
import venueMenuRoutes                  from './routes/venueMenuRoutes.js'
import pos3OrderRoutes                  from './routes/pos3OrderRoutes.js'
import pos360IntegrationRoutes          from './routes/pos360IntegrationRoutes.js'
import pos360FloorRoutes                from './routes/pos360FloorRoutes.js'
import pos360MenuBuilderRoutes          from './routes/pos360MenuBuilderRoutes.js'
import pos360HandheldRoutes             from './routes/pos360HandheldRoutes.js'
import pos360ProductionRoutes           from './routes/pos360ProductionRoutes.js'
import pos360OrderLifecycleRoutes       from './routes/pos360OrderLifecycleRoutes.js'
import pos360OfflineSyncRoutes          from './routes/pos360OfflineSyncRoutes.js'
import pos360PaymentRoutes             from './routes/pos360PaymentRoutes.js'
import pos360CustomerLoyaltyRoutes    from './routes/pos360CustomerLoyaltyRoutes.js'
import pos360ReservationGuestFlowRoutes from './routes/pos360ReservationGuestFlowRoutes.js'
import pos360EventPackageMonetizationRoutes from './routes/pos360EventPackageMonetizationRoutes.js'
import pos360PaymentCloseoutRoutes from './routes/pos360PaymentCloseoutRoutes.js'
import pos360StaffLaborGovernanceRoutes from './routes/pos360StaffLaborGovernanceRoutes.js'
import pos360ReportsAnalyticsDecisionRoutes from './routes/pos360ReportsAnalyticsDecisionRoutes.js'
import pos360SettingsVenueAdminRoutes from './routes/pos360SettingsVenueAdminRoutes.js'
import pos360ExternalIntegrationsRoutes from './routes/pos360ExternalIntegrationsRoutes.js'
import pos360FulfillmentKdsRoutes       from './routes/pos360FulfillmentKdsRoutes.js'
import pos360SelfOrderingRoutes         from './routes/pos360SelfOrderingRoutes.js'
import pos360ProductionReadinessRoutes  from './routes/pos360ProductionReadinessRoutes.js'
import noveeOSModuleRegistryRoutes      from './routes/noveeOSModuleRegistryRoutes.js'
import noveeOSTenantGovernanceRoutes    from './routes/noveeOSTenantGovernanceRoutes.js'
import noveeOSBillingGovernanceRoutes  from './routes/noveeOSBillingGovernanceRoutes.js'
import databaseStatusRoutes            from './routes/databaseStatusRoutes.js'
import paymentMoneyBridgeRoutes        from './routes/paymentMoneyBridgeRoutes.js'
import venueOnboardingRoutes           from './routes/venueOnboardingRoutes.js'
import partnerVendorRoutes             from './routes/partnerVendorRoutes.js'
import taxComplianceRoutes             from './routes/taxComplianceRoutes.js'
import orderLifecycleRoutes           from './routes/orderLifecycleRoutes.js'
import kdsRoutingRoutes              from './routes/kdsRoutingRoutes.js'
import customerCheckoutRoutes        from './routes/customerCheckoutRoutes.js'
import staffOrderRoutes             from './routes/staffOrderRoutes.js'
import inventoryRoutes              from './routes/inventoryRoutes.js'
import reorderRoutes                from './routes/reorderRoutes.js'
import eprlHealthRoutes             from './routes/eprlHealthRoutes.js'
import operationsRoutes             from './routes/operationsRoutes.js'
import externalPOSRoutes            from './routes/externalPOSRoutes.js'
import vendorGatewayRoutes          from './routes/vendorGatewayRoutes.js'
import operationalSyncRoutes        from './routes/operationalSyncRoutes.js'
import liveExternalOpsRoutes        from './routes/liveExternalOpsRoutes.js'
import finalLockdownRoutes          from './routes/finalLockdownRoutes.js'
import postPhaseAuditRoutes         from './routes/postPhaseAuditRoutes.js'
import moduleFoundationRoutes       from './routes/moduleFoundationRoutes.js'
import smokecraftModuleRoutes       from './routes/smokecraftModuleRoutes.js'
import smokecraftOrderingRoutes     from './routes/smokecraftOrderingRoutes.js'
import smokecraftPairingRoutes      from './routes/smokecraftPairingRoutes.js'
import smokecraftRewardsRoutes      from './routes/smokecraftRewardsRoutes.js'
import smokecraftVenueAdminRoutes   from './routes/smokecraftVenueAdminRoutes.js'
import smokecraftIntegrationRoutes  from './routes/smokecraftIntegrationRoutes.js'
import smokecraftEnterpriseRoutes   from './routes/smokecraftEnterpriseRoutes.js'
import smokecraftFinalQaRoutes      from './routes/smokecraftFinalQaRoutes.js'
import smokecraftPersistenceRoutes  from './routes/smokecraftPersistenceRoutes.js'
import { errorHandler }       from './middleware/errorHandler.js'
import { seedPrototypeUsers } from './db/seeds/seedPrototypeUsers.js'
import { seedMentorUsers }    from './db/seeds/seedMentorUsers.js'
import { startPOS3AutoSync }  from './services/pos3AutoSyncService.js'
import { initScheduler }     from './services/resetScheduleService.js'
import { validateEnv }        from './config/envValidator.js'

// Validate environment variables on startup
validateEnv()

const app    = express()
const PORT   = parseInt(process.env.PORT || '3001', 10)
const IS_PROD = process.env.NODE_ENV === 'production'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../dist')

// ── CORS ──────────────────────────────────────────────────────
// In production, CORS_ORIGIN must be explicitly set.
// Defaulting to wildcard in production is a security risk.
let corsOrigin = process.env.CORS_ORIGIN

if (IS_PROD && !corsOrigin) {
  console.error(
    '[FATAL] CORS_ORIGIN is not set in production. ' +
    'Set CORS_ORIGIN to your frontend domain (e.g. https://yourdomain.replit.app) in environment secrets.'
  )
  process.exit(1)
}

if (!IS_PROD && !corsOrigin) {
  // Development fallback — allow all origins with a clear warning
  console.warn('[cors] ⚠  CORS_ORIGIN not set — allowing all origins (development mode only).')
  corsOrigin = true
}

app.use(cors({
  origin:      corsOrigin,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────
app.use('/api',                   healthRoutes)
app.use('/api/auth',              authRoutes)
app.use('/api/sessions',          sessionRoutes)
app.use('/api/passport',          passportRoutes)
app.use('/api/leaderboard',       leaderboardRoutes)
app.use('/api/pos3',              pos3Routes)
app.use('/api/pos3/sync',         pos3SyncRouter)
app.use('/api/pos3/providers',    pos3IntegrationRoutes)
app.use('/api/pos3/eat-feed',     pos3EatFeedRouter)
app.use('/api/pos3/founder',      pos3FounderRouter)
app.use('/api/voice',             voiceRoutes)
app.use('/api/sync',              syncRoutes)
app.use('/api/sync',              syncReconciliationRoutes)
app.use('/api/sync/audit',        syncAuditRoutes)
app.use('/api/device',            deviceRoutes)
app.use('/api/deployment',        deploymentRoutes)
app.use('/api/eat',               eatRoutes)
app.use('/api/venue-test',        venueTestRoutes)
app.use('/api/demo',              demoRoutes)
app.use('/api/pilot',             pilotRoutes)
app.use('/api/pairings',          pairingOrderRoutes)
app.use('/api/smokecraft',        smokecraftRoutes)
app.use('/api/smokecraft',        smokecraftOrders)
app.use('/api/eat/smokecraft',    smokecraftEatRoutes)
app.use('/api/checkout',          customerCheckoutRoutes)
app.use('/api/staff',             staffOrderRoutes)
app.use('/api/inventory',         inventoryRoutes)
app.use('/api/reorder',           reorderRoutes)
app.use('/api/health',            eprlHealthRoutes)
app.use('/api/operations',        operationsRoutes)
app.use('/api/external-pos',      externalPOSRoutes)
app.use('/api/vendor-gateway',    vendorGatewayRoutes)
app.use('/api/operational-sync',  operationalSyncRoutes)
app.use('/api/live-external-ops', liveExternalOpsRoutes)
app.use('/api/final-lockdown',    finalLockdownRoutes)
app.use('/api/post-phase',        postPhaseAuditRoutes)
app.use('/api/modules',           moduleFoundationRoutes)
app.use('/api/modules/smokecraft', smokecraftModuleRoutes)
app.use('/api/modules/smokecraft/orders',  smokecraftOrderingRoutes)
app.use('/api/modules/smokecraft/pairing',  smokecraftPairingRoutes)
app.use('/api/modules/smokecraft/rewards', smokecraftRewardsRoutes)
app.use('/api/modules/smokecraft/admin',        smokecraftVenueAdminRoutes)
app.use('/api/modules/smokecraft/integrations', smokecraftIntegrationRoutes)
app.use('/api/modules/smokecraft/enterprise',   smokecraftEnterpriseRoutes)
app.use('/api/modules/smokecraft/final-qa',      smokecraftFinalQaRoutes)
app.use('/api/modules/smokecraft/persistence',   smokecraftPersistenceRoutes)
app.use('/api/audit',             auditRoutes)
app.use('/api/admin',             adminRoutes)
app.use('/api/founder',           founderRoutes)
app.use('/api/ranking',           rankingRoutes)
app.use('/api/badges',            badgeRoutes)
app.use('/api/ticker',            tickerRoutes)
app.use('/api/travel',            travelRoutes)
app.use('/api/venues',            venueCommerceRoutes)
app.use('/api/smokecraft',                  smokecraftCommerceRoutes)
app.use('/api/smokecraft/venue-commerce',   smokecraftVenueCommerceRoutes)
app.use('/api/smokecraft/ticket-tapper',   smokecraftTicketTapperSpecialsRoutes)
app.use('/api/pos360',                    pos360IntegrationRoutes)
app.use('/api/pos360/floor',              pos360FloorRoutes)
app.use('/api/pos360/menu',              pos360MenuBuilderRoutes)
app.use('/api/pos360/handheld',          pos360HandheldRoutes)
app.use('/api/pos360/production',        pos360ProductionRoutes)
app.use('/api/pos360/orders',            pos360OrderLifecycleRoutes)
app.use('/api/pos360/sync',             pos360OfflineSyncRoutes)
app.use('/api/pos360/payments',         pos360PaymentRoutes)
app.use('/api/pos360/guests',           pos360CustomerLoyaltyRoutes)
app.use('/api/pos360/reservations',    pos360ReservationGuestFlowRoutes)
app.use('/api/pos360/event-packages',  pos360EventPackageMonetizationRoutes)
app.use('/api/pos360/payments-closeout', pos360PaymentCloseoutRoutes)
app.use('/api/pos360/staff',              pos360StaffLaborGovernanceRoutes)
app.use('/api/pos360/reports',            pos360ReportsAnalyticsDecisionRoutes)
app.use('/api/pos360/settings',           pos360SettingsVenueAdminRoutes)
app.use('/api/pos360/integrations',       pos360ExternalIntegrationsRoutes)
app.use('/api/pos360/fulfillment',        pos360FulfillmentKdsRoutes)
app.use('/api/pos360/self-ordering',     pos360SelfOrderingRoutes)
app.use('/api/pos360/production-readiness', pos360ProductionReadinessRoutes)
app.use('/api/novee-os/modules',           noveeOSModuleRegistryRoutes)
app.use('/api/novee-os/tenants',          noveeOSTenantGovernanceRoutes)
app.use('/api/novee-os/billing',          noveeOSBillingGovernanceRoutes)
app.use('/api/system/database',           databaseStatusRoutes)
app.use('/api/payments/money-bridge',     paymentMoneyBridgeRoutes)
app.use('/api/onboarding',               venueOnboardingRoutes)
app.use('/api/partners',                partnerVendorRoutes)
app.use('/api/tax',                     taxComplianceRoutes)
app.use('/api/orders',                  orderLifecycleRoutes)
app.use('/api/kds',                     kdsRoutingRoutes)
app.use('/api/venue-menu',        venueMenuRoutes)
app.use('/api/pos3',              pos3OrderRoutes)

// ── Phase 10: New role routes ─────────────────────────────────
app.use('/api/mentor',            mentorRoutes)
app.use('/api/developer',         developerRoutes)
app.use('/api/access-requests',   accessRequestsRoutes)

// ── TEMP diagnostic: prove what the live server is actually serving ──
const EXPECTED_BADGE = 'LIVE SMOKECRAFT BUILD 668d6599'

app.get('/__build-check', (_req, res) => {
  const distExists = fs.existsSync(CLIENT_DIST)
  const distIndexPath = path.join(CLIENT_DIST, 'index.html')
  const distIndexExists = distExists && fs.existsSync(distIndexPath)

  let distIndexContainsBadge = false
  if (distIndexExists) {
    distIndexContainsBadge = fs.readFileSync(distIndexPath, 'utf8').includes(EXPECTED_BADGE)
  }

  let jsFilesChecked = []
  let distJsContainsBadge = false
  let formatContainsCigarVisual = false
  let formatContainsVitolaDiagram = false
  let formatContainsCigarImage = false
  let distJsContainsFormatPhotoFixMarker = false
  let distJsContainsCigarVisualCardMarker = false
  const assetsDir = path.join(CLIENT_DIST, 'assets')
  if (distExists && fs.existsSync(assetsDir)) {
    jsFilesChecked = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
    const jsContents = jsFilesChecked.map(f => fs.readFileSync(path.join(assetsDir, f), 'utf8'))
    distJsContainsBadge = jsContents.some(c => c.includes(EXPECTED_BADGE))
    // Function/component identifiers (CigarVisual, VitolaDiagram, CigarImage) get mangled by the
    // minifier and won't survive in dist as literal text, so this checks the className strings
    // those components render instead — string literals are preserved through minification.
    formatContainsCigarVisual = jsContents.some(c => c.includes('cigar-visual'))
    formatContainsVitolaDiagram = jsContents.some(c => c.includes('vitola-stage') || c.includes('vitola-svg'))
    formatContainsCigarImage = jsContents.some(c => c.includes('cigar-fallback-panel'))
    distJsContainsFormatPhotoFixMarker = jsContents.some(c => c.includes('FORMAT PHOTO FIX LIVE c6104fd'))
    distJsContainsCigarVisualCardMarker = jsContents.some(c => c.includes('CIGARVISUAL CARD LIVE'))
  }

  res.json({
    ok: true,
    expectedBadge: EXPECTED_BADGE,
    distPath: CLIENT_DIST,
    distExists,
    distIndexExists,
    distIndexContainsBadge,
    distJsContainsBadge,
    formatContainsCigarVisual,
    formatContainsVitolaDiagram,
    formatContainsCigarImage,
    distJsContainsFormatPhotoFixMarker,
    distJsContainsCigarVisualCardMarker,
    deployedExpectedCommit: 'c6104fd',
    currentServerTime: new Date().toISOString(),
    jsFilesChecked,
    timestamp: new Date().toISOString(),
  })
})

// ── Frontend static app ──────────────────────────────────────
app.get('/', (_req, res) => res.redirect(302, '/crafthub'))

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  next()
})

// index: false — never let express.static auto-serve index.html with its
// own ETag/Last-Modified, since a conditional 304 against a stale browser
// cache would re-serve old HTML even with the no-cache headers above.
app.use(express.static(CLIENT_DIST, { index: false }))

const sendFreshIndexHtml = (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), {
    cacheControl: false,
    etag: false,
    lastModified: false,
  })
}

app.get(/^\/(?!api\/?).*/, sendFreshIndexHtml)

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🥃 NOVEE OS Backend — port ${PORT}`)
  console.log(`   Health:      http://localhost:${PORT}/api/health`)
  console.log(`   Auth:        http://localhost:${PORT}/api/auth/me`)
  console.log(`   Admin:       http://localhost:${PORT}/api/admin/my-permissions`)
  console.log(`   Mentor:      http://localhost:${PORT}/api/mentor/profile`)
  console.log(`   Developer:   http://localhost:${PORT}/api/developer/health`)
  console.log(`   POS3 Sync:   http://localhost:${PORT}/api/pos3/sync/status`)
  console.log(`   Mode:        ${process.env.NODE_ENV || 'development'}\n`)

  // Auto-seed prototype users in development only
  if (!IS_PROD) {
    await seedPrototypeUsers()
    await seedMentorUsers()
  }

  // POS 3 Auto-Sync — starts after DB seed is ready (non-blocking)
  startPOS3AutoSync('prototype')

  // Auto-Reset Scheduler — loads persisted schedule and arms the cron job
  initScheduler()
})

export default app
