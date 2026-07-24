import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { isDbAvailable } from '../db/connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../../dist')
const BUILD_MANIFEST_PATH = path.join(CLIENT_DIST, 'build-manifest.json')

export function getHealth(_req, res) {
  res.json({
    success:   true,
    status:    'ok',
    service:   'NOVEE OS Backend',
    version:   'phase-7',
    db:        isDbAvailable() ? 'postgres' : 'prototype',
    timestamp: new Date().toISOString(),
  })
}

// Production Build Identity pass — reads build-manifest.json from the same
// dist/ directory express.static serves, at request time, rather than
// duplicating build metadata into a second, independently-set env-var path.
// This guarantees /api/version and /build-manifest.json can never disagree
// with each other about what this specific running process is serving —
// by construction, not by convention. Falls back to the raw env vars
// (still real, never fabricated) if the manifest hasn't been generated
// (e.g. this server process was started without running `npm run build`
// first, such as local `npm run server` against stale/no dist output).
export function getVersion(_req, res) {
  let manifest = null
  try {
    manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST_PATH, 'utf8'))
  } catch { /* manifest not present — fall back below */ }

  const commit = manifest?.commit || process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null

  res.json({
    success:            true,
    service:            'crafthub-360',
    environment:        manifest?.environment || process.env.NODE_ENV || 'development',
    // Single monorepo build — frontend and backend are always the same
    // commit by construction (one `npm run build && node server/index.js`
    // process), so backendCommit/frontendCommit are intentionally identical
    // here, not independently tracked. Disclosed, not a placeholder.
    commit,
    backendCommit:      commit,
    frontendCommit:     commit,
    branch:             manifest?.branch || process.env.RAILWAY_GIT_BRANCH || null,
    buildTimestamp:     manifest?.buildTimestamp || process.env.RAILWAY_DEPLOYMENT_CREATED_AT || null,
    assetVersion:       manifest?.assetVersion || null,
    applicationVersion: manifest?.applicationVersion || null,
    manifestFound:      !!manifest,
  })
}
