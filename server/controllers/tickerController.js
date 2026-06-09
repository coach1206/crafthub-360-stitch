/**
 * Ticker Controller
 * Returns the horizontal ticker feed used in the premium header strip.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'

const SOURCES = {
  bar:      { label: 'Bar Special',     color: '#C9A84C' },
  humidor:  { label: 'Humidor Feature', color: '#8B4513' },
  kitchen:  { label: 'Kitchen Special', color: '#D4820A' },
  events:   { label: 'Upcoming Event',  color: '#4A90D9' },
  passport: { label: 'Passport Alert',  color: '#9C27B0' },
  ranking:  { label: 'Ranking Update',  color: '#C9A84C' },
  travel:   { label: 'Travel Alert',    color: '#00BCD4' },
  eat:      { label: 'E.A.T. Command',  color: '#D4820A' },
}

const FEED = [
  { id: 't01', source: 'bar',      text: 'Cognac flight special available tonight — limited seating',      route: '/crafthub' },
  { id: 't02', source: 'humidor',  text: 'Dominican Robusto pairing unlocked for Connoisseur+ members',   route: '/passport/benefits' },
  { id: 't03', source: 'kitchen',  text: "Smoked short rib sliders pair with tonight's reserve cigar",    route: '/crafthub' },
  { id: 't04', source: 'events',   text: "Collector's Night — Cigar & Cognac · Doors at 8 PM",            route: '/crafthub' },
  { id: 't05', source: 'ranking',  text: 'Sebastian Harrow claimed #1 tonight — 1,740 XP',                route: '/smokecraft/leaderboard' },
  { id: 't06', source: 'passport', text: 'Your Passport has 2 new connection requests',                    route: '/passport' },
  { id: 't07', source: 'travel',   text: 'DayOne360 DR trip — limited spots available',                   route: '/dayone360-travel' },
  { id: 't08', source: 'eat',      text: "Reserve pairing updated — Aged Gouda added to tonight's list",  route: '/crafthub' },
  { id: 't09', source: 'bar',      text: 'Nightcap service begins at 11 PM — premium spirits on pour',    route: '/crafthub' },
  { id: 't10', source: 'ranking',  text: 'Earn 150 XP tonight by scanning the VIP stamp at the bar',      route: '/smokecraft/leaderboard' },
]

function enrich(item) {
  const src = SOURCES[item.source]
  return { ...item, sourceLabel: src?.label || item.source, sourceColor: src?.color || '#C9A84C' }
}

export function getFeed(req, res) {
  const { source, limit = 20 } = req.query
  const items = (source ? FEED.filter(i => i.source === source) : FEED).slice(0, Number(limit))
  success(res, { items: items.map(enrich), total: items.length })
}

export function getSources(_req, res) {
  success(res, { sources: SOURCES })
}

export function addFeedItem(req, res) {
  const { source, text, route = '/crafthub' } = req.body
  if (!source || !text) return error(res, 'source and text are required')
  if (!SOURCES[source])  return error(res, `Unknown source: ${source}. Valid: ${Object.keys(SOURCES).join(', ')}`)
  const item = { id: uuidv4(), source, text, route }
  FEED.unshift(item)
  success(res, { item: enrich(item) }, 'Ticker item added')
}
