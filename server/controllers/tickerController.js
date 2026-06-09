/**
 * Ticker Controller — enriched feed from server/data/tickerFeed.js
 * Runtime POST additions are persisted across server restarts.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'
import { TICKER_FEED, SOURCE_COLORS, PRIORITY_ORDER } from '../data/tickerFeed.js'
import { loadJson, saveJson } from '../utils/persist.js'
import { appendResetAudit } from '../utils/resetAudit.js'

// Runtime additions persisted across restarts; seed data is always prepended
const persistedAdditions = loadJson('ticker_additions.json', [])

// Feed = persisted runtime additions (newest first) + seed data
const feed = [...persistedAdditions, ...TICKER_FEED]

function saveState() {
  // Only persist runtime entries (those not from the original seed)
  const seedIds      = new Set(TICKER_FEED.map(i => i.id))
  const runtimeItems = feed.filter(i => !seedIds.has(i.id))
  saveJson('ticker_additions.json', runtimeItems)
}

function enrich(item) {
  return {
    ...item,
    sourceColor:   SOURCE_COLORS[item.source] || '#C9A84C',
    priorityOrder: PRIORITY_ORDER[item.priority] || 1,
  }
}

export function getFeed(req, res) {
  const { source, type, area, priority, limit = 20 } = req.query
  let items = feed.filter(i => i.active)
  if (source)   items = items.filter(i => i.source.toLowerCase()   === source.toLowerCase())
  if (type)     items = items.filter(i => i.type                    === type)
  if (area)     items = items.filter(i => i.area                    === area)
  if (priority) items = items.filter(i => i.priority                === priority)
  const sorted  = [...items].sort((a, b) => (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1))
  const limited = sorted.slice(0, Number(limit))
  success(res, { items: limited.map(enrich), total: limited.length })
}

export function getSources(_req, res) {
  const sources = Object.entries(SOURCE_COLORS).map(([name, color]) => ({ name, color }))
  success(res, { sources })
}

export function addFeedItem(req, res) {
  const { source, title, message, type = 'announcement', area = 'venue', priority = 'medium', route = '/crafthub', ctaLabel = 'View' } = req.body
  if (!source || !message) return error(res, 'source and message are required')
  if (!SOURCE_COLORS[source]) return error(res, `Unknown source: "${source}". Valid: ${Object.keys(SOURCE_COLORS).join(', ')}`)
  const item = { id: uuidv4(), source, title: title || source, message, type, area, priority, route, active: true, ctaLabel }
  feed.unshift(item)
  saveState()
  success(res, { item: enrich(item) }, 'Ticker item added')
}

export function deactivateFeedItem(req, res) {
  const item = feed.find(i => i.id === req.params.id)
  if (!item) return error(res, 'Ticker item not found', 404)
  item.active = false
  saveState()
  success(res, { item }, 'Ticker item deactivated')
}

// ── Admin: reset persisted runtime additions ──────────────────────────────────

export function resetFeed(req, res) {
  const seedIds = new Set(TICKER_FEED.map(i => i.id))
  // Remove all runtime (non-seed) entries from the in-memory feed
  const runtimeIndices = []
  for (let i = feed.length - 1; i >= 0; i--) {
    if (!seedIds.has(feed[i].id)) runtimeIndices.push(i)
  }
  for (const i of runtimeIndices) feed.splice(i, 1)
  saveJson('ticker_additions.json', [])
  appendResetAudit('ticker-feed', req.user)
  success(res, { cleared: runtimeIndices.length }, 'Ticker additions cleared — seed data restored')
}
