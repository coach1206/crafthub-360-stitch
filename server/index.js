/**
 * NOVEE OS — Express Backend
 * Phase 9.5: POS 3 Operational Hardening + Staff PIN Reset + Auto-Sync
 *
 * Runs on PORT (default 3001).
 * Frontend (Vite, port 5000) proxies /api/* to this server.
 */

import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'

import healthRoutes      from './routes/healthRoutes.js'
import sessionRoutes     from './routes/sessionRoutes.js'
import passportRoutes    from './routes/passportRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import pos3Routes            from './routes/pos3Routes.js'
import eatRoutes             from './routes/eatRoutes.js'
import auditRoutes           from './routes/auditRoutes.js'
import adminRoutes           from './routes/adminRoutes.js'
import founderRoutes         from './routes/founderRoutes.js'
import authRoutes            from './routes/authRoutes.js'
import pos3IntegrationRoutes, {
  eatFeedRouter   as pos3EatFeedRouter,
  founderPosRouter as pos3FounderRouter,
  syncRouter       as pos3SyncRouter,
}                            from './routes/pos3IntegrationRoutes.js'
import voiceRoutes            from './routes/voiceRoutes.js'
import deviceRoutes           from './routes/deviceRoutes.js'
import deploymentRoutes       from './routes/deploymentRoutes.js'
import venueTestRoutes        from './routes/venueTestRoutes.js'
import demoRoutes             from './routes/demoRoutes.js'
import pilotRoutes            from './routes/pilotRoutes.js'
import { errorHandler }       from './middleware/errorHandler.js'
import { seedPrototypeUsers } from './db/seeds/seedPrototypeUsers.js'
import { startPOS3AutoSync }  from './services/pos3AutoSyncService.js'
import { validateEnv }        from './config/envValidator.js'

// Validate environment variables on startup
validateEnv()

const app  = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || true,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────
app.use('/api',             healthRoutes)
app.use('/api/auth',        authRoutes)
app.use('/api/sessions',    sessionRoutes)
app.use('/api/passport',    passportRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
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
app.use('/api/audit',       auditRoutes)
app.use('/api/admin',       adminRoutes)
app.use('/api/founder',     founderRoutes)

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🥃 NOVEE OS Backend — port ${PORT}`)
  console.log(`   Health:    http://localhost:${PORT}/api/health`)
  console.log(`   Auth:      http://localhost:${PORT}/api/auth/me`)
  console.log(`   Admin:     http://localhost:${PORT}/api/admin/my-permissions`)
  console.log(`   POS3 Sync: http://localhost:${PORT}/api/pos3/sync/status`)
  console.log(`   Mode:      ${process.env.NODE_ENV || 'development'}\n`)

  // Auto-seed prototype users in development only
  if (process.env.NODE_ENV !== 'production') {
    await seedPrototypeUsers()
  }

  // POS 3 Auto-Sync — starts after DB seed is ready (non-blocking)
  startPOS3AutoSync('prototype')
})

export default app
