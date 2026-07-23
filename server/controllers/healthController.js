import { isDbAvailable } from '../db/connection.js'

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

// Safe deployment-identity endpoint — commit/build metadata only, never
// secrets, credentials, or internal paths. Populated by RAILWAY_GIT_COMMIT_SHA
// (set automatically by Railway) or GIT_COMMIT_SHA (generic fallback for other
// hosts); both are absent in local/dev, which is reported honestly as null
// rather than a fabricated value.
export function getVersion(_req, res) {
  res.json({
    success:        true,
    service:        'crafthub-360',
    environment:    process.env.NODE_ENV || 'development',
    commit:         process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null,
    buildTimestamp: process.env.RAILWAY_DEPLOYMENT_CREATED_AT || null,
  })
}
