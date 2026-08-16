/**
 * NOVEE OS — Express Backend
 *
 * Local/full-server entrypoint. The Vercel function imports `apiApp.js`
 * directly so frontend assets and diagnostic dist scanners are never traced
 * into the serverless bundle.
 */

import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createApiApp } from './apiApp.js'
import { seedPrototypeUsers } from './db/seeds/seedPrototypeUsers.js'
import { seedMentorUsers } from './db/seeds/seedMentorUsers.js'
import { startPOS3AutoSync } from './services/pos3AutoSyncService.js'
import { initScheduler } from './services/resetScheduleService.js'

const PORT = parseInt(process.env.PORT || '3001', 10)
const IS_PROD = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview'
const IS_VERCEL = process.env.VERCEL === '1'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../dist')
const app = createApiApp({ withNotFound: false })

// ── TEMP diagnostic: prove what the live full server is actually serving ──
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

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

if (!IS_VERCEL) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🥃 NOVEE OS Backend — port ${PORT}`)
    console.log(`   Health:      http://localhost:${PORT}/api/health`)
    console.log(`   Auth:        http://localhost:${PORT}/api/auth/me`)
    console.log(`   Admin:       http://localhost:${PORT}/api/admin/my-permissions`)
    console.log(`   Mentor:      http://localhost:${PORT}/api/mentor/profile`)
    console.log(`   Developer:   http://localhost:${PORT}/api/developer/health`)
    console.log(`   POS3 Sync:   http://localhost:${PORT}/api/pos3/sync/status`)
    console.log(`   Mode:        ${process.env.NODE_ENV || 'development'}\n`)

    if (!IS_PROD) {
      await seedPrototypeUsers()
      await seedMentorUsers()
    }

    startPOS3AutoSync('prototype')
    initScheduler()
  })
}

export default app
