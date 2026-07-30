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
import passport360SmokeCraftRoutes from './routes/passport360SmokeCraftRoutes.js'
import passport360SyncRoutes from './routes/passport360SyncRoutes.js'
import eatSmokeCraftLiveSyncRoutes from './routes/eatSmokeCraftLiveSyncRoutes.js'
import pos360SmokeCraftOrderBridgeRoutes from './routes/pos360SmokeCraftOrderBridgeRoutes.js'
import ticketTapperPromotionRoutes from './routes/ticketTapperPromotionRoutes.js'
import managementSyncRoutes from './routes/managementSyncRoutes.js'
import venueManagementRoutes from './routes/venueManagementRoutes.js'
import goldenBoxRoutes from './routes/goldenBoxRoutes.js'
import venueHumidorRoutes from './routes/venueHumidorRoutes.js'
import packagingStudioRoutes from './routes/packagingStudioRoutes.js'
import seedSoilRoutes from './routes/seedSoilRoutes.js'
import fillerArrangementRoutes from './routes/fillerArrangementRoutes.js'
import skillTreeRoutes from './routes/skillTreeRoutes.js'
import pairingEngineRoutes from './routes/pairingEngineRoutes.js'
import mentorGuidanceRoutes from './routes/mentorGuidanceRoutes.js'
import mentorVoiceRoutes from './routes/mentorVoiceRoutes.js'
import collectionsRoutes from './routes/collectionsRoutes.js'
import challengeHubRoutes from './routes/challengeHubRoutes.js'
import blendFaultRoutes from './routes/blendFaultRoutes.js'
import leafConstructionRoutes from './routes/leafConstructionRoutes.js'
import flavorPairingRoutes from './routes/flavorPairingRoutes.js'
import goldenBoxContentRoutes from './routes/goldenBoxContentRoutes.js'
import dayone360SmokeCraftConnectionRoutes from './routes/dayone360SmokeCraftConnectionRoutes.js'
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
import smokecraftHumidorEnvRoutes from './routes/smokecraftHumidorEnvironmentRoutes.js'
import smokecraftScorecardRoutes      from './routes/smokecraftScorecardRoutes.js'
import smokecraftPassportStampRoutes  from './routes/smokecraftPassportStampRoutes.js'
import smokecraftConnectionsRoutes    from './routes/smokecraftConnectionsRoutes.js'
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
import noveeEntryRoutes                 from './routes/noveeEntryRoutes.js'
import noveeOSModuleRegistryRoutes      from './routes/noveeOSModuleRegistryRoutes.js'
import noveeOSTenantGovernanceRoutes    from './routes/noveeOSTenantGovernanceRoutes.js'
import noveeOSBillingGovernanceRoutes  from './routes/noveeOSBillingGovernanceRoutes.js'
import noveeOSSecurityGovernanceRoutes from './routes/noveeOSSecurityGovernanceRoutes.js'
import craftHubDashboardRoutes         from './routes/craftHubDashboardRoutes.js'
import craftHubOnboardingRoutes        from './routes/craftHubOnboardingRoutes.js'
import noveeOSFinalReadinessRoutes     from './routes/noveeOSFinalReadinessRoutes.js'
import noveeOS360PlatformRegistryRoutes from './routes/noveeOS360PlatformRegistryRoutes.js'
import phaseDProviderActivationRoutes  from './routes/phaseDProviderActivationRoutes.js'
import phaseDPaymentProviderActivationRoutes from './routes/phaseDPaymentProviderActivationRoutes.js'
import phaseDExternalPOSActivationRoutes from './routes/phaseDExternalPOSActivationRoutes.js'
import phaseDInventoryActivationRoutes from './routes/phaseDInventoryActivationRoutes.js'
import phaseDCommunicationActivationRoutes from './routes/phaseDCommunicationActivationRoutes.js'
import noveeOSSecurityActivationRoutes    from './routes/noveeOSSecurityActivationRoutes.js'
import noveeOSDeploymentActivationRoutes  from './routes/noveeOSDeploymentActivationRoutes.js'
import noveeOSLivePilotReadinessRoutes   from './routes/noveeOSLivePilotReadinessRoutes.js'
import noveeOSRemoteModuleDistributionRoutes from './routes/noveeOSRemoteModuleDistributionRoutes.js'
import noveeOSOnboardingTrainingRoutes from './routes/noveeOSOnboardingTrainingRoutes.js'
import noveeOSAMBIFoundationRoutes from './routes/noveeOSAMBIFoundationRoutes.js'
import noveeOSDocumentationPortalRoutes from './routes/noveeOSDocumentationPortalRoutes.js'
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
import smokecraftErrorLogRoutes     from './routes/smokecraftErrorLogRoutes.js'
import smokecraftPersistenceRoutes  from './routes/smokecraftPersistenceRoutes.js'
import smokecraftPlayerStateRoutes  from './routes/smokecraftPlayerStateRoutes.js'
import smokecraftAccountRoutes      from './routes/smokecraftAccountRoutes.js'
import { errorHandler }       from './middleware/errorHandler.js'
import { seedPrototypeUsers } from './db/seeds/seedPrototypeUsers.js'
import { seedMentorUsers }    from './db/seeds/seedMentorUsers.js'
import { startPOS3AutoSync }  from './services/pos3AutoSyncService.js'
import { initScheduler }     from './services/resetScheduleService.js'
import { validateEnv }        from './config/envValidator.js'
import rateLimit              from 'express-rate-limit'

// Validate environment variables on startup
validateEnv()

const app    = express()
const PORT   = parseInt(process.env.PORT || '3001', 10)
const IS_PROD = process.env.NODE_ENV === 'production'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../dist')

// ── Reverse-proxy trust (MUST be set before rate-limit / IP-dependent middleware) ──
// Railway (and most PaaS edges) terminate TLS at a single reverse-proxy hop and
// forward the real client IP in the `X-Forwarded-For` header. With Express's
// default `trust proxy = false`, req.ip resolves to the proxy's socket address
// and express-rate-limit's validator throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// on every request (it sees a forwarded header it was told not to trust). That
// error surfaced in production as failed journey creation, missing activeJourneyId,
// and users bounced back to lock/prerequisite screens.
//
// We trust EXACTLY ONE hop in production (Railway's edge proxy) — NOT `true`.
// `trust proxy = true` would trust an arbitrarily long X-Forwarded-For chain,
// letting any direct, non-proxied attacker spoof their client IP by sending their
// own header and thereby evade per-IP rate limiting. A fixed hop count of 1 means
// Express reads the single client IP that Railway's edge appends and ignores any
// attacker-supplied values further left in the chain.
//
// In local development there is NO reverse proxy — connections are direct — so we
// leave trust proxy DISABLED (false). Trusting a phantom hop locally would itself
// be a spoofable misconfiguration. Only Railway's real topology (one edge hop)
// warrants trusting one hop.
const TRUST_PROXY = IS_PROD ? 1 : false
app.set('trust proxy', TRUST_PROXY)

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

// ── Rate limiting ─────────────────────────────────────────────
// General limit: 300 req / 15 min per IP (covers most API traffic)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
  skip: () => !IS_PROD,  // disabled in dev/test to preserve existing test suites
})
// Auth routes: tighter limit — 20 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts — please try again later.' },
  skip: () => !IS_PROD,
})
app.use('/api/auth', authLimiter)
app.use('/api', generalLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/api',                   healthRoutes)
app.use('/api/auth',              authRoutes)
app.use('/api/sessions',          sessionRoutes)
app.use('/api/passport',          passportRoutes)
app.use('/api/passport-360/smokecraft', passport360SmokeCraftRoutes)
app.use('/api/passport-360/sync', passport360SyncRoutes)
app.use('/api/eat-360/smokecraft',     eatSmokeCraftLiveSyncRoutes)
app.use('/api/pos360/smokecraft',      pos360SmokeCraftOrderBridgeRoutes)
app.use('/api/ticket-tapper/promotions', ticketTapperPromotionRoutes)
app.use('/api/smokecraft/management-sync', managementSyncRoutes)
app.use('/api/smokecraft/player-state', smokecraftPlayerStateRoutes)
app.use('/api/smokecraft/account', smokecraftAccountRoutes)
app.use('/api/venue-management', venueManagementRoutes)
app.use('/api/smokecraft/golden-box', goldenBoxRoutes)
app.use('/api/smokecraft/venue-humidor', venueHumidorRoutes)
app.use('/api/smokecraft/golden-box/packaging-studio', packagingStudioRoutes)
app.use('/api/smokecraft/golden-box-content', goldenBoxContentRoutes)
app.use('/api/smokecraft/seed-soil', seedSoilRoutes)
app.use('/api/smokecraft/filler-arrangement', fillerArrangementRoutes)
app.use('/api/smokecraft/skill-tree', skillTreeRoutes)
app.use('/api/smokecraft/pairing-engine', pairingEngineRoutes)
app.use('/api/smokecraft/mentor-guidance', mentorGuidanceRoutes)
app.use('/api/smokecraft/mentor-voice', mentorVoiceRoutes)
app.use('/api/smokecraft/collections', collectionsRoutes)
app.use('/api/smokecraft/challenge-hub', challengeHubRoutes)
app.use('/api/smokecraft/blend-fault', blendFaultRoutes)
app.use('/api/smokecraft/leaf-construction', leafConstructionRoutes)
app.use('/api/smokecraft/flavor-pairing', flavorPairingRoutes)
app.use('/api/dayone360/smokecraft',   dayone360SmokeCraftConnectionRoutes)
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
app.use('/api/smokecraft/humidor',    smokecraftHumidorEnvRoutes)
app.use('/api/smokecraft/scorecard',       smokecraftScorecardRoutes)
app.use('/api/smokecraft/passport-stamp',  smokecraftPassportStampRoutes)
app.use('/api/smokecraft/connections',     smokecraftConnectionsRoutes)
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
app.use('/api/smokecraft/error-log',             smokecraftErrorLogRoutes)
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
app.use('/api/novee',                      noveeEntryRoutes)
app.use('/api/novee-os/modules',           noveeOSModuleRegistryRoutes)
app.use('/api/novee-os/tenants',          noveeOSTenantGovernanceRoutes)
app.use('/api/novee-os/billing',          noveeOSBillingGovernanceRoutes)
app.use('/api/novee-os/security',         noveeOSSecurityGovernanceRoutes)
app.use('/api/crafthub/dashboard',        craftHubDashboardRoutes)
app.use('/api/crafthub/onboarding',       craftHubOnboardingRoutes)
app.use('/api/novee-os/final-readiness',  noveeOSFinalReadinessRoutes)
app.use('/api/novee-os/360-platforms',    noveeOS360PlatformRegistryRoutes)
app.use('/api/phase-d/provider-activation', phaseDProviderActivationRoutes)
app.use('/api/phase-d/payment-provider-activation', phaseDPaymentProviderActivationRoutes)
app.use('/api/phase-d/external-pos-activation', phaseDExternalPOSActivationRoutes)
app.use('/api/phase-d/inventory-activation', phaseDInventoryActivationRoutes)
app.use('/api/phase-d/communication-activation', phaseDCommunicationActivationRoutes)
app.use('/api/phase-d/security-activation',     noveeOSSecurityActivationRoutes)
app.use('/api/phase-d/deployment-activation',   noveeOSDeploymentActivationRoutes)
app.use('/api/phase-d/live-pilot-readiness',    noveeOSLivePilotReadinessRoutes)
app.use('/api/novee-os/remote-distribution',   noveeOSRemoteModuleDistributionRoutes)
app.use('/api/novee-os/onboarding-training',  noveeOSOnboardingTrainingRoutes)
app.use('/api/novee-os/ambi-foundation',      noveeOSAMBIFoundationRoutes)
app.use('/api/novee-os/documentation-portal', noveeOSDocumentationPortalRoutes)
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

// Production Build Identity pass — cache policy split by resource type
// (previously blanket no-store for everything non-API, which was safe but
// gave every JS/CSS chunk no caching benefit despite Vite already
// content-hashing those filenames on every content change). Vite's
// content-hashed bundle files (assets/<name>-<hash>.js / .css) are safe to
// cache for a year immutably — a new build always gets a new filename, so
// there is no staleness risk. Everything else (HTML, unhashed SmokeCraft
// images, build-manifest.json) keeps the original strict no-cache
// behavior — images now rely on the ?v=<assetVersion> query string
// (src/constants/assetVersion.js) for cache-busting instead of HTTP
// headers, since their filenames don't change.
const HASHED_ASSET_RE = /\/assets\/(index|[A-Za-z0-9]+)-[a-f0-9]{8}\.(js|css)$/

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  if (HASHED_ASSET_RE.test(req.path)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  next()
})

// index: false — never let express.static auto-serve index.html with its
// own ETag/Last-Modified, since a conditional 304 against a stale browser
// cache would re-serve old HTML even with the no-cache headers above.
// redirect: false — Single Build & Live Runtime pass. `public/smokecraft/`
// (images) is copied into dist, so a request for the SPA route
// `/smokecraft` matched a real directory and express.static answered with a
// 301 Moved Permanently to `/smokecraft/`. A 301 is the most aggressively
// and persistently cached response a browser stores, and it was being
// emitted for the module's primary entry route. Disabling the directory
// redirect lets `/smokecraft` fall through to the SPA fallback below and be
// served fresh, no-store, like every other route.
app.use(express.static(CLIENT_DIST, { index: false, redirect: false }))

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
  console.log(`   Mode:        ${process.env.NODE_ENV || 'development'}`)

  // ── Reverse-proxy / rate-limiter startup diagnostic ──────────────
  // No PII, no request bodies, no auth tokens — only static config values.
  const trustProxyResolved = app.get('trust proxy')
  console.log(`\n[proxy-diagnostic] environment          : ${process.env.NODE_ENV || 'development'}`)
  console.log(`[proxy-diagnostic] trust proxy setting   : ${JSON.stringify(trustProxyResolved)} ${IS_PROD ? '(1 hop = Railway edge)' : '(disabled — direct local connections)'}`)
  console.log(`[proxy-diagnostic] req.ip resolves from   : ${trustProxyResolved ? 'X-Forwarded-For (rightmost trusted hop)' : 'direct socket address'}`)
  console.log(`[proxy-diagnostic] rate limiter enabled   : ${IS_PROD ? 'yes (300/15m general, 20/15m auth)' : 'no (skipped in dev/test)'}`)
  console.log(`[proxy-diagnostic] X-Forwarded-For safe   : yes — express-rate-limit validator will not throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR\n`)

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
