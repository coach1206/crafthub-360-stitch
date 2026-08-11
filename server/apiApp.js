import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'

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
  eatFeedRouter    as pos3EatFeedRouter,
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
import pos360SmokeCraftOrderBridgeRoutes from './routes/pos360SmokeCraftOrderBridgeRoutes.js'
import eatSmokeCraftLiveSyncRoutes       from './routes/eatSmokeCraftLiveSyncRoutes.js'
import managementSyncRoutes              from './routes/managementSyncRoutes.js'
import smokecraftTicketTapperSpecialsRoutes from './routes/smokecraftTicketTapperSpecialsRoutes.js'
import smokecraftVenueCommerceRoutes        from './routes/smokecraftVenueCommerceRoutes.js'
import smokecraftPlayerStateRoutes          from './routes/smokecraftPlayerStateRoutes.js'
import smokecraftPairingRoutes              from './routes/smokecraftPairingRoutes.js'
import passport360SyncRoutes                from './routes/passport360SyncRoutes.js'
import pairingEngineRoutes                  from './routes/pairingEngineRoutes.js'
import rankingRoutes         from './routes/rankingRoutes.js'
import badgeRoutes           from './routes/badgeRoutes.js'
import tickerRoutes          from './routes/tickerRoutes.js'
import travelRoutes          from './routes/travelRoutes.js'
import { errorHandler }       from './middleware/errorHandler.js'
import { validateEnv }        from './config/envValidator.js'

validateEnv()

const IS_PROD = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview'

function configureCoreMiddleware(app) {
  let corsOrigin = process.env.CORS_ORIGIN

  if (IS_PROD && !corsOrigin) {
    console.error(
      '[FATAL] CORS_ORIGIN is not set in production. ' +
      'Set CORS_ORIGIN to your frontend domain (e.g. https://yourdomain.replit.app) in environment secrets.'
    )
    process.exit(1)
  }

  if (!IS_PROD && !corsOrigin) {
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
}

function mountApiRoutes(app) {
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
  app.use('/api/pos360/smokecraft',       pos360SmokeCraftOrderBridgeRoutes)
  app.use('/api/eat-360/smokecraft',      eatSmokeCraftLiveSyncRoutes)
  app.use('/api/smokecraft/management-sync', managementSyncRoutes)
  app.use('/api/smokecraft/ticket-tapper',   smokecraftTicketTapperSpecialsRoutes)
  app.use('/api/smokecraft/venue-commerce',  smokecraftVenueCommerceRoutes)
  app.use('/api/smokecraft/player-state',    smokecraftPlayerStateRoutes)
  app.use('/api/modules/smokecraft/pairing', smokecraftPairingRoutes)
  app.use('/api/passport-360/sync',          passport360SyncRoutes)
  app.use('/api/smokecraft/pairing-engine',  pairingEngineRoutes)
  app.use('/api/audit',             auditRoutes)
  app.use('/api/admin',             adminRoutes)
  app.use('/api/founder',           founderRoutes)
  app.use('/api/ranking',           rankingRoutes)
  app.use('/api/badges',            badgeRoutes)
  app.use('/api/ticker',            tickerRoutes)
  app.use('/api/travel',            travelRoutes)
  app.use('/api/mentor',            mentorRoutes)
  app.use('/api/developer',         developerRoutes)
  app.use('/api/access-requests',   accessRequestsRoutes)
}

export function createApiApp({ withNotFound = true } = {}) {
  const app = express()
  configureCoreMiddleware(app)
  mountApiRoutes(app)
  if (withNotFound) {
    app.use((_req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' })
    })
  }
  app.use(errorHandler)
  return app
}

export default createApiApp()
