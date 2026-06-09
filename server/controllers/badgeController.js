/**
 * Badge Controller — enriched catalog from server/data/badges.js
 * userBadges and unlockLog are persisted across server restarts.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'
import { BADGE_CATALOG } from '../data/badges.js'
import {
  loadJson, saveJson,
  serializeMapOfSets, deserializeMapOfSets,
} from '../utils/persist.js'
import { appendResetAudit } from '../utils/resetAudit.js'

// ── Load persisted state ──────────────────────────────────────────────────────
const userBadges = deserializeMapOfSets(loadJson('badge_user_badges.json', {}))
const unlockLog  = loadJson('badge_unlock_log.json', [])

function saveState() {
  saveJson('badge_user_badges.json', serializeMapOfSets(userBadges))
  saveJson('badge_unlock_log.json', unlockLog)
}

function getOrCreateSet(userId) {
  if (!userBadges.has(userId)) userBadges.set(userId, new Set())
  return userBadges.get(userId)
}

export function getCatalog(_req, res) {
  const { category } = _req.query
  const badges = category
    ? BADGE_CATALOG.filter(b => b.category.toLowerCase() === category.toLowerCase())
    : BADGE_CATALOG
  success(res, { badges, total: badges.length })
}

export function getUserBadges(req, res) {
  const { userId } = req.params
  const earned  = getOrCreateSet(userId)
  const badges  = BADGE_CATALOG.map(b => ({
    ...b,
    earned:   earned.has(b.id),
    earnedAt: earned.has(b.id) ? (unlockLog.find(l => l.userId === userId && l.badgeId === b.id)?.ts || 'Earlier') : null,
  }))
  success(res, { badges, earnedCount: earned.size, totalCount: BADGE_CATALOG.length })
}

export function unlockBadge(req, res) {
  const { userId, badgeId } = req.body
  if (!userId || !badgeId) return error(res, 'userId and badgeId are required')
  const badge = BADGE_CATALOG.find(b => b.id === badgeId || b.legacyId === badgeId)
  if (!badge) return error(res, 'Badge not found', 404)
  const earned = getOrCreateSet(userId)
  if (earned.has(badge.id)) return success(res, { badge, alreadyEarned: true }, 'Badge already earned')
  earned.add(badge.id)
  const record = { id: uuidv4(), userId, badgeId: badge.id, ts: new Date().toISOString() }
  unlockLog.push(record)
  saveState()
  success(res, { badge, alreadyEarned: false, xpAwarded: badge.xpValue }, 'Badge unlocked')
}

export function checkEligible(req, res) {
  const { userId, sourceType, category } = req.query
  const earned   = getOrCreateSet(userId)
  const eligible = BADGE_CATALOG.filter(b =>
    !earned.has(b.id) &&
    (sourceType ? b.sourceType === sourceType : true) &&
    (category   ? b.category.toLowerCase() === category.toLowerCase() : true)
  )
  success(res, { eligible, count: eligible.length })
}

// ── Admin: reset persisted badge data ─────────────────────────────────────────

export function resetBadgesCore(user, source = 'manual', skipAudit = false) {
  userBadges.clear()
  unlockLog.splice(0, unlockLog.length)
  saveState()
  if (!skipAudit) appendResetAudit('badges', user, source)
  return { cleared: true }
}

export function resetBadges(req, res) {
  success(res, resetBadgesCore(req.user), 'All badge progress reset')
}
