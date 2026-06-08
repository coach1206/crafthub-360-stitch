/**
 * NOVEE OS — Express Backend
 * Phase 8: Admin Roles + Founder Level 0 Security
 *
 * Runs on PORT (default 3001).
 * Frontend (Vite, port 5000) proxies /api/* to this server.
 */

import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'

import healthRoutes      from './routes/healthRoutes.js'
import sessionRoutes     from './routes/sessionRoutes.js'
import passportRoutes    from './routes/passportRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import pos3Routes        from './routes/pos3Routes.js'
import eatRoutes         from './routes/eatRoutes.js'
import auditRoutes       from './routes/auditRoutes.js'
import adminRoutes       from './routes/adminRoutes.js'
import founderRoutes     from './routes/founderRoutes.js'
import { errorHandler }  from './middleware/errorHandler.js'

dotenv.config()

const app  = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────
app.use('/api',             healthRoutes)
app.use('/api/sessions',    sessionRoutes)
app.use('/api/passport',    passportRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/pos3',        pos3Routes)
app.use('/api/eat',         eatRoutes)
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🥃 NOVEE OS Backend — port ${PORT}`)
  console.log(`   Health:  http://localhost:${PORT}/api/health`)
  console.log(`   Admin:   http://localhost:${PORT}/api/admin/my-permissions`)
  console.log(`   Founder: http://localhost:${PORT}/api/founder/status  [founder_level_0 only]`)
  console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}\n`)
})

export default app
