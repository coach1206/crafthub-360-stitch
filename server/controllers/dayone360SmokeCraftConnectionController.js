import {
  getDayOne360ConnectionHealth,
  getDayOne360AssetInventory,
  createSmokeCraftDayOneConnection,
  recordDayOneGuestWorkflowEvent,
  getSmokeCraftDayOneConnections,
  getDayOneGuestWorkflowEvents,
  writeDayOneConnectionAuditEvent,
  getDayOneConnectionAuditLog,
} from '../services/dayone360/dayone360SmokeCraftConnectionService.js'

const SAFE_CLAIM = 'dayone360_smokecraft_connection_internal'

function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    websiteReference: 'www.dayone360.com',
    timestamp: new Date().toISOString(),
  })
}

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))

export const getHealth = (req, res) => ok500(res, async () => wrap(res, await getDayOne360ConnectionHealth()))

export const getAssets = (req, res) => ok500(res, async () => wrap(res, await getDayOne360AssetInventory()))

export const createConnection = (req, res) => ok500(res, async () => {
  wrap(res, await createSmokeCraftDayOneConnection(req.body))
})

export const recordWorkflowEvent = (req, res) => ok500(res, async () => {
  wrap(res, await recordDayOneGuestWorkflowEvent(req.body))
})

export const getConnections = (req, res) => ok500(res, async () => {
  const { venueId, guestId, limit } = req.query
  wrap(res, await getSmokeCraftDayOneConnections({ venueId, guestId, limit: parseInt(limit) || 50 }))
})

export const getWorkflowEvents = (req, res) => ok500(res, async () => {
  const { venueId, guestId, connectionId, limit } = req.query
  wrap(res, await getDayOneGuestWorkflowEvents({ venueId, guestId, connectionId, limit: parseInt(limit) || 50 }))
})

export const writeAuditEvent = (req, res) => ok500(res, async () => {
  wrap(res, await writeDayOneConnectionAuditEvent(req.body))
})

export const getAuditLog = (req, res) => ok500(res, async () => {
  const { venueId, connectionId, limit } = req.query
  wrap(res, await getDayOneConnectionAuditLog({ venueId, connectionId, limit: parseInt(limit) || 50 }))
})
