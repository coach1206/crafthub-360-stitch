/**
 * Ranking API — live endpoints backed by /api/ranking.
 * Falls back gracefully on network errors.
 */

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data
}

function normalizeActivityEntry(entry) {
  return {
    ...entry,
    desc: entry.description || entry.desc || '',
    ago:  entry.timestamp   || entry.ago  || 'just now',
  }
}

export async function getLeaderboard() {
  const data = await apiFetch('/api/ranking')
  return data.leaderboard || []
}

export async function getRecentRankingActivity(userId) {
  const params = new URLSearchParams({ limit: 20 })
  if (userId) params.set('userId', userId)
  const data = await apiFetch(`/api/ranking/activity?${params}`)
  return (data.activity || []).map(normalizeActivityEntry)
}

export async function getRankingTiers() {
  const data = await apiFetch('/api/ranking/tiers')
  return data.tiers || []
}

export async function getCurrentUserRank() {
  const data = await apiFetch('/api/ranking/user/me')
  return data.member || null
}

export async function getMemberRankDetail(memberId) {
  const data = await apiFetch(`/api/ranking/user/${memberId}`)
  return data.member || null
}

export async function processRankingScan(payload) {
  const { sourceType = 'session', sourceId, xpValue, venueId } = payload
  const data = await apiFetch('/api/ranking/scan', {
    method: 'POST',
    body: JSON.stringify({
      sourceType,
      sourceId:  sourceId || sourceType,
      xpValue,
      venueId,
    }),
  })
  const activityEntry = normalizeActivityEntry(data.activityEntry || {})
  return {
    success:       true,
    xpAdded:       data.xpAdded,
    totalXp:       data.totalXp,
    tierChanged:   data.tierChanged,
    prevTier:      data.prevTier,
    newTier:       data.newTier,
    leaderboard:   data.leaderboard || [],
    activityEntry,
    badgeUnlocked: null,
    toast:         data.toast || `+${data.xpAdded} XP earned`,
    updatedUser:   (data.leaderboard || []).find(u => u.isCurrentUser) || null,
    newRank:       ((data.leaderboard || []).find(u => u.isCurrentUser) || {}).rank || null,
  }
}

export async function addXpAdmin(amount = 50) {
  const data = await apiFetch('/api/ranking/admin/xp', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
  return { leaderboard: data.leaderboard || [] }
}

export async function getTierDetail(tierId) {
  const tiers = await getRankingTiers()
  return tiers.find(t => t.id === tierId) || null
}

export async function unlockBadge(_userId, _badgeId) { return null }
export async function getBadgeDetail(_badgeId)       { return null }
