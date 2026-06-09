import { RANKING_DATA, RECENT_RANKING_ACTIVITY, BADGES_DATA } from '../data/rankingData.js'

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms))

let _leaderboard = RANKING_DATA.users.map(u => ({ ...u }))
let _activity    = [...RECENT_RANKING_ACTIVITY]
let _badges      = [...BADGES_DATA]

export async function getLeaderboard() {
  await delay(200)
  return [..._leaderboard].sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 }))
}

export async function getCurrentUserRank(userId = 'john-collins') {
  await delay(150)
  const sorted = [..._leaderboard].sort((a, b) => b.xp - a.xp)
  const idx    = sorted.findIndex(u => u.id === userId)
  return idx >= 0 ? { ...sorted[idx], rank: idx + 1 } : null
}

export async function getMemberRankDetail(memberId) {
  await delay(200)
  const sorted = [..._leaderboard].sort((a, b) => b.xp - a.xp)
  const idx    = sorted.findIndex(u => u.id === memberId)
  return idx >= 0 ? { ...sorted[idx], rank: idx + 1 } : null
}

export async function getRankingTiers() {
  await delay(100)
  return [...RANKING_DATA.tiers]
}

export async function getRecentRankingActivity(userId = 'john-collins') {
  await delay(150)
  return [..._activity]
}

export async function addXpToUser(userId, xpValue, sourceType = 'scan') {
  await delay(300)
  const idx = _leaderboard.findIndex(u => u.id === userId)
  if (idx < 0) return null
  _leaderboard[idx] = { ..._leaderboard[idx], xp: _leaderboard[idx].xp + xpValue }
  const newXp  = _leaderboard[idx].xp
  const sorted = [..._leaderboard].sort((a, b) => b.xp - a.xp)
  const rank   = sorted.findIndex(u => u.id === userId) + 1
  const tier   = getTierForXp(newXp)
  _leaderboard[idx].tier = tier.name
  _leaderboard[idx].progressPercent = Math.round(((newXp - tier.minXp) / ((tier.maxXp || newXp + 1000) - tier.minXp)) * 100)
  return { ...sorted[idx < sorted.length ? idx : 0], rank }
}

export async function processRankingScan(payload) {
  await delay(500)
  const { sourceType, sourceId, xpValue, venueId } = payload
  const updatedUser = await addXpToUser('john-collins', xpValue, sourceType)
  const sorted = [..._leaderboard].sort((a, b) => b.xp - a.xp)
  const newRank = sorted.findIndex(u => u.id === 'john-collins') + 1

  const activityEntry = {
    id:    `act-scan-${Date.now()}`,
    type:  sourceType,
    icon:  getIconForSource(sourceType),
    title: getTitleForSource(sourceType),
    desc:  getDescForSource(sourceType, sourceId),
    xp:    xpValue,
    ago:   'just now',
    badgeId: getBadgeForSource(sourceType),
  }
  _activity = [activityEntry, ..._activity]

  const badgeUnlocked = shouldUnlockBadge(sourceType, updatedUser?.xp || 0)

  return {
    success:       true,
    updatedUser,
    newRank,
    xpAdded:       xpValue,
    activityEntry,
    badgeUnlocked,
    leaderboard:   sorted.map((u, i) => ({ ...u, rank: i + 1 })),
    toast:         `+${xpValue} XP earned — ${getTitleForSource(sourceType)}`,
  }
}

export async function unlockBadge(userId, badgeId) {
  await delay(200)
  const badge = _badges.find(b => b.id === badgeId)
  return badge ? { ...badge, earned: true, earnedAt: new Date().toISOString() } : null
}

export async function getBadgeDetail(badgeId) {
  await delay(100)
  return _badges.find(b => b.id === badgeId) || null
}

export async function getTierDetail(tierId) {
  await delay(100)
  return RANKING_DATA.tiers.find(t => t.id === tierId) || null
}

function getTierForXp(xp) {
  const tiers = RANKING_DATA.tiers
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].minXp) return tiers[i]
  }
  return tiers[0]
}

function getIconForSource(sourceType) {
  const map = { session: 'qr_code_scanner', event: 'event', connection: 'handshake', craft_stamp: 'workspace_premium', vip_stamp: 'stars' }
  return map[sourceType] || 'qr_code_scanner'
}
function getTitleForSource(sourceType) {
  const map = { session: 'Session Check-In', event: 'Event Entry', connection: 'Connection Verified', craft_stamp: 'Craft Stamp Earned', vip_stamp: 'VIP Stamp Unlocked' }
  return map[sourceType] || 'Scan Processed'
}
function getDescForSource(sourceType, sourceId) {
  const map = {
    session:     'Checked into Grand Lounge session',
    event:       'Cigar & Cognac Collectors Night',
    connection:  'Connection verified with a member',
    craft_stamp: 'Collector Night Stamp earned',
    vip_stamp:   'VIP access unlocked — Grand Lounge',
  }
  return map[sourceType] || sourceId
}
function getBadgeForSource(sourceType) {
  const map = { session: null, event: 'event-entry', connection: 'connection-verified', craft_stamp: 'craft-stamp', vip_stamp: 'vip-stamp' }
  return map[sourceType] || null
}
function shouldUnlockBadge(sourceType, currentXp) {
  if (currentXp >= 1000 && currentXp < 1100) return BADGES_DATA.find(b => b.id === 'connoisseur')
  return null
}
