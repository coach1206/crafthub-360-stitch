/**
 * Badge Controller
 * Manages badge catalog and user unlock state (in-memory; swap with DB later).
 */
import { v4 as uuidv4 } from 'uuid'

const BADGE_CATALOG = [
  { id: 'b001', name: 'First Smoke',          icon: 'local_fire_department', color: '#C9A84C', description: 'Checked into your first Grand Lounge session.',          xpReward: 0,   sourceType: 'session'    },
  { id: 'b002', name: 'Connection Made',      icon: 'handshake',             color: '#4CAF90', description: 'Verified your first Brotherhood connection.',            xpReward: 25,  sourceType: 'connection' },
  { id: 'b003', name: 'Event Insider',        icon: 'event',                 color: '#4A90D9', description: 'Attended a Grand Lounge featured event.',                xpReward: 50,  sourceType: 'event'      },
  { id: 'b004', name: 'Craft Collector',      icon: 'workspace_premium',     color: '#D4820A', description: 'Earned your first CraftHub stamp.',                      xpReward: 100, sourceType: 'craftStamp' },
  { id: 'b005', name: 'VIP Access',           icon: 'stars',                 color: '#9C27B0', description: 'Unlocked VIP access at the Grand Lounge.',               xpReward: 150, sourceType: 'vipStamp'   },
  { id: 'b006', name: 'Connoisseur Ascent',   icon: 'trending_up',           color: '#D4820A', description: 'Reached Connoisseur tier (1,000 XP).',                   xpReward: 0,   sourceType: 'tier'       },
  { id: 'b007', name: 'Sommelier Distinction',icon: 'military_tech',         color: '#B8860B', description: 'Reached Sommelier tier (2,500 XP).',                     xpReward: 0,   sourceType: 'tier'       },
  { id: 'b008', name: 'Grand Patron',         icon: 'diamond',               color: '#8B0000', description: 'Achieved Patron status — the pinnacle of the Lounge.',   xpReward: 0,   sourceType: 'tier'       },
  { id: 'b009', name: 'Night Owl',            icon: 'dark_mode',             color: '#607D8B', description: 'Checked in after 10 PM at the Grand Lounge.',            xpReward: 25,  sourceType: 'session'    },
  { id: 'b010', name: 'Travel Pioneer',       icon: 'flight',                color: '#00BCD4', description: 'Completed your first DayOne360 travel experience.',       xpReward: 200, sourceType: 'travel'     },
]

// userId → Set of badge ids
const userBadges = new Map()
const unlockLog  = []

function getOrCreateSet(userId) {
  if (!userBadges.has(userId)) userBadges.set(userId, new Set())
  return userBadges.get(userId)
}

export function getCatalog(_req, res) {
  res.json({ success: true, badges: BADGE_CATALOG })
}

export function getUserBadges(req, res) {
  const { userId } = req.params
  const earned = getOrCreateSet(userId)
  const result = BADGE_CATALOG.map(b => ({ ...b, earned: earned.has(b.id) }))
  res.json({ success: true, badges: result, earnedCount: earned.size, totalCount: BADGE_CATALOG.length })
}

export function unlockBadge(req, res) {
  const { userId, badgeId } = req.body
  if (!userId || !badgeId) return res.status(400).json({ success: false, message: 'userId and badgeId required' })
  const badge = BADGE_CATALOG.find(b => b.id === badgeId)
  if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' })
  const earned = getOrCreateSet(userId)
  if (earned.has(badgeId)) return res.json({ success: true, alreadyEarned: true, badge })
  earned.add(badgeId)
  unlockLog.push({ id: uuidv4(), userId, badgeId, ts: new Date().toISOString() })
  res.json({ success: true, alreadyEarned: false, badge, xpAwarded: badge.xpReward })
}

export function checkEligible(req, res) {
  const { userId, sourceType, xp } = req.query
  const earned  = getOrCreateSet(userId)
  const eligible = BADGE_CATALOG.filter(b =>
    !earned.has(b.id) &&
    (sourceType ? b.sourceType === sourceType : true) &&
    (xp !== undefined ? b.xpReward <= Number(xp) : true)
  )
  res.json({ success: true, eligible })
}
