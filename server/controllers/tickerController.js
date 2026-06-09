/**
 * Ticker Controller
 * Returns the horizontal ticker feed items used in the premium header strip.
 * Mirrors src/data/tickerFeed.js — live DB integration can replace this later.
 */

const SOURCES = {
  bar:      { label: 'Bar Special',    color: '#C9A84C' },
  humidor:  { label: 'Humidor Feature',color: '#8B4513' },
  kitchen:  { label: 'Kitchen Special',color: '#D4820A' },
  events:   { label: 'Upcoming Event', color: '#4A90D9' },
  passport: { label: 'Passport Alert', color: '#9C27B0' },
  ranking:  { label: 'Ranking Update', color: '#C9A84C' },
  travel:   { label: 'Travel Alert',   color: '#00BCD4' },
  eat:      { label: 'E.A.T. Command', color: '#D4820A' },
}

const FEED = [
  { id: 't01', source: 'bar',      text: 'Cognac flight special available tonight — limited seating',    route: '/crafthub' },
  { id: 't02', source: 'humidor',  text: 'Dominican Robusto pairing unlocked for Connoisseur+ members', route: '/passport/benefits' },
  { id: 't03', source: 'kitchen',  text: 'Smoked short rib sliders pair with tonight\'s reserve cigar',  route: '/crafthub' },
  { id: 't04', source: 'events',   text: 'Collector\'s Night — Cigar & Cognac · Doors at 8 PM',          route: '/crafthub' },
  { id: 't05', source: 'ranking',  text: 'Sebastian Harrow claimed #1 tonight — 1,740 XP',              route: '/smokecraft/leaderboard' },
  { id: 't06', source: 'passport', text: 'Your Passport has 2 new connection requests',                  route: '/passport' },
  { id: 't07', source: 'travel',   text: 'DayOne360 DR trip — limited spots available',                 route: '/dayone360-travel' },
  { id: 't08', source: 'eat',      text: 'Reserve pairing updated — Aged Gouda added to tonight\'s list', route: '/crafthub' },
  { id: 't09', source: 'bar',      text: 'Nightcap service begins at 11 PM — premium spirits on pour',  route: '/crafthub' },
  { id: 't10', source: 'ranking',  text: 'Earn 150 XP tonight by scanning the VIP stamp at the bar',   route: '/smokecraft/leaderboard' },
]

export function getFeed(req, res) {
  const { craft, source, limit = 20 } = req.query
  let items = FEED
  if (source)  items = items.filter(i => i.source === source)
  if (craft && craft !== 'all') items = items.filter(i => i.source !== 'eat' || craft === 'smokecraft')
  const enriched = items.slice(0, Number(limit)).map(i => ({
    ...i,
    sourceLabel: SOURCES[i.source]?.label || i.source,
    sourceColor: SOURCES[i.source]?.color || '#C9A84C',
  }))
  res.json({ success: true, items: enriched, total: enriched.length })
}

export function getSources(_req, res) {
  res.json({ success: true, sources: SOURCES })
}

export function addFeedItem(req, res) {
  const { source, text, route = '/crafthub' } = req.body
  if (!source || !text) return res.status(400).json({ success: false, message: 'source and text required' })
  if (!SOURCES[source])  return res.status(400).json({ success: false, message: `Unknown source: ${source}` })
  const item = { id: `t${Date.now()}`, source, text, route }
  FEED.unshift(item)
  res.json({ success: true, item: { ...item, sourceLabel: SOURCES[source].label, sourceColor: SOURCES[source].color } })
}
