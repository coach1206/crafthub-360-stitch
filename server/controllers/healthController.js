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
