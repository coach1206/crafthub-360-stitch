import { TICKER_FEED } from '../data/tickerFeed.js'

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export async function getTickerFeed(craft = 'all') {
  await delay(150)
  return TICKER_FEED.filter(i => i.active && (craft === 'all' || i.craft === 'all' || i.craft === craft))
}

export async function getKitchenSpecials() {
  await delay(150)
  return [
    { id: 'ks-1', name: 'Smoked Short Rib Sliders', desc: 'Pairs with bourbon flight', price: '$18', available: true },
    { id: 'ks-2', name: 'Charcuterie Board',       desc: 'Curated artisan selection',   price: '$24', available: true },
    { id: 'ks-3', name: 'Aged Gouda + Robusto Pairing', desc: 'Sommelier recommended', price: '$16', available: true },
  ]
}

export async function getHumidorSpecials() {
  await delay(150)
  return [
    { id: 'hs-1', name: 'Dominican Robusto',       origin: 'Dominican Republic', strength: 'Medium',       price: '$28', available: true },
    { id: 'hs-2', name: 'Nicaraguan Torpedo',       origin: 'Nicaragua',          strength: 'Full',         price: '$34', available: true },
    { id: 'hs-3', name: 'Connecticut Shade Toro',   origin: 'Connecticut',        strength: 'Mild-Medium',  price: '$22', available: true },
  ]
}

export async function getBarSpecials() {
  await delay(150)
  return [
    { id: 'bs-1', name: 'Cognac Flight',       desc: 'XO, VSOP, VS selection',       price: '$45', available: true },
    { id: 'bs-2', name: 'Bourbon Reserve',     desc: 'Rare allocated pour',           price: '$28', available: true },
    { id: 'bs-3', name: 'Single Malt Scotch',  desc: '18yr Speyside expression',      price: '$38', available: true },
  ]
}

export async function getUpcomingEvents() {
  await delay(150)
  return [
    { id: 'ev-1', name: 'Cigar & Cognac Collectors Night', date: 'Tonight 7 PM', xp: 50,  route: '/passport/events' },
    { id: 'ev-2', name: 'Bourbon & Smoke Pairing',         date: 'Fri 8 PM',     xp: 75,  route: '/passport/events' },
    { id: 'ev-3', name: 'Grand Lounge VIP Evening',        date: 'Sat 7 PM',     xp: 100, route: '/passport/events' },
  ]
}

export async function getPassportStampOpportunities() {
  await delay(150)
  return [
    { id: 'ps-1', name: 'Collectors Night Stamp', xp: 100, condition: 'Attend Collectors Night' },
    { id: 'ps-2', name: 'Pairing Master Stamp',   xp: 75,  condition: 'Complete 3 pairings'     },
    { id: 'ps-3', name: 'VIP Grand Lounge Stamp', xp: 150, condition: 'VIP table booking'       },
  ]
}

export async function getDayOneTravelOffers() {
  await delay(150)
  return [
    { id: 'dt-1', name: 'Dominican Republic Cigar Country', desc: 'Farm-to-lounge immersive journey', route: '/dayone360-travel' },
    { id: 'dt-2', name: 'Colombia Cultural Experience',      desc: 'Coffee, cigars, and culture',       route: '/dayone360-travel' },
    { id: 'dt-3', name: 'Atlanta Local Concierge',           desc: 'VIP departure experience',          route: '/dayone360-travel' },
  ]
}

export async function getInventoryAlerts() {
  await delay(150)
  return [
    { id: 'ia-1', source: 'Bar',     name: 'Rare Bourbon Allocation',  remaining: 3, route: '/eat/inventory' },
    { id: 'ia-2', source: 'Humidor', name: 'Limited Robusto Reserve',  remaining: 8, route: '/eat/inventory' },
  ]
}

export async function getPairingRecommendations() {
  await delay(150)
  return [
    { id: 'pr-1', cigar: 'Dominican Robusto', food: 'Aged Gouda',  drink: 'XO Cognac',    xp: 25 },
    { id: 'pr-2', cigar: 'Nicaraguan Torpedo', food: 'Short Rib Sliders', drink: 'Bourbon', xp: 25 },
  ]
}

export async function getRankingBonusOpportunities() {
  await delay(150)
  return [
    { id: 'rb-1', action: 'Verified Passport Connection', xp: 75,  route: '/grand-lounge-ranking' },
    { id: 'rb-2', action: 'Attend Collectors Night',      xp: 50,  route: '/grand-lounge-ranking' },
    { id: 'rb-3', action: 'Complete Pairing Session',     xp: 100, route: '/grand-lounge-ranking' },
  ]
}

export async function createTickerItem(item)              { await delay(200); return { ...item, id: `tk-${Date.now()}` } }
export async function updateTickerItem(id, updates)       { await delay(200); return { id, ...updates } }
export async function deactivateTickerItem(id)            { await delay(200); return { id, active: false } }
export async function getTickerItemsBySource(source)      { await delay(150); return TICKER_FEED.filter(i => i.source === source) }
export async function getTickerItemsByCraft(craft)        { await delay(150); return TICKER_FEED.filter(i => i.craft === craft || i.craft === 'all') }
