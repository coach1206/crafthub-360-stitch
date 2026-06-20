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
import deviceRoutes          from './routes/deviceRoutes.js'
import deploymentRoutes      from './routes/deploymentRoutes.js'
import venueTestRoutes       from './routes/venueTestRoutes.js'
import demoRoutes            from './routes/demoRoutes.js'
import pilotRoutes           from './routes/pilotRoutes.js'
import pairingOrderRoutes    from './routes/pairingOrderRoutes.js'
import smokecraftOrders      from './routes/smokecraftOrders.js'
import rankingRoutes         from './routes/rankingRoutes.js'
import badgeRoutes           from './routes/badgeRoutes.js'
import tickerRoutes          from './routes/tickerRoutes.js'
import travelRoutes          from './routes/travelRoutes.js'
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
app.use('/api/device',            deviceRoutes)
app.use('/api/deployment',        deploymentRoutes)
app.use('/api/eat',               eatRoutes)
app.use('/api/venue-test',        venueTestRoutes)
app.use('/api/demo',              demoRoutes)
app.use('/api/pilot',             pilotRoutes)
app.use('/api/pairings',          pairingOrderRoutes)
app.use('/api/smokecraft',        smokecraftOrders)
app.use('/api/audit',             auditRoutes)
app.use('/api/admin',             adminRoutes)
app.use('/api/founder',           founderRoutes)
app.use('/api/ranking',           rankingRoutes)
app.use('/api/badges',            badgeRoutes)
app.use('/api/ticker',            tickerRoutes)
app.use('/api/travel',            travelRoutes)

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
  const assetsDir = path.join(CLIENT_DIST, 'assets')
  if (distExists && fs.existsSync(assetsDir)) {
    jsFilesChecked = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
    distJsContainsBadge = jsFilesChecked.some(f =>
      fs.readFileSync(path.join(assetsDir, f), 'utf8').includes(EXPECTED_BADGE)
    )
  }

  res.json({
    ok: true,
    expectedBadge: EXPECTED_BADGE,
    distPath: CLIENT_DIST,
    distExists,
    distIndexExists,
    distIndexContainsBadge,
    distJsContainsBadge,
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
