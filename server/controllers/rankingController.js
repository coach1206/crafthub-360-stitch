/**
 * Ranking Controller — Grand Lounge Leaderboard
 * Canonical roster + seeded activity log from server/data/.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'
import { recentActivity } from '../data/recentActivity.js'

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = [
  { id: 'tier-aficionado',  name: 'Aficionado',  minXp: 0,    maxXp: 999,  color: '#C9A84C', description: 'Entry rank for verified Grand Lounge participants.'              },
  { id: 'tier-connoisseur', name: 'Connoisseur', minXp: 1000, maxXp: 2499, color: '#D4820A', description: 'Recognized member with deeper tasting and pairing access.'      },
  { id: 'tier-sommelier',   name: 'Sommelier',   minXp: 2500, maxXp: 4999, color: '#B8860B', description: 'Elite member with curated pairing and event privileges.'         },
  { id: 'tier-patron',      name: 'Patron',      minXp: 5000, maxXp: null, color: '#8B0000', description: 'Highest status tier with premium access and private benefits.'   },
]

function resolveTier(xp) {
  return [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0]
}

// ── Canonical roster ──────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 'user-sebastian-harrow',  name: 'Sebastian Harrow',  initials: 'SH', hue: 45,  xp: 1740, badgeType: 'gold-crown',        isCurrentUser: false, recentActions: ['Won top ranking', 'Craft stamp earned']    },
  { id: 'user-marco-del-valle',   name: 'Marco Del Valle',   initials: 'MD', hue: 30,  xp: 1580, badgeType: 'silver-medal',       isCurrentUser: false, recentActions: ['Event entry', 'Verified connection']        },
  { id: 'user-vincent-ashworth',  name: 'Vincent Ashworth',  initials: 'VA', hue: 200, xp: 1285, badgeType: 'bronze-medal',       isCurrentUser: false, recentActions: ['Humidor check-in']                         },
  { id: 'user-rafael-cienfuegos', name: 'Rafael Cienfuegos', initials: 'RC', hue: 160, xp: 1100, badgeType: 'bronze-ring',        isCurrentUser: false, recentActions: ['Profile check']                            },
  { id: 'user-john-collins',      name: 'John M Collins',    initials: 'JC', hue: 45,  xp: 950,  badgeType: 'current-user-gold',  isCurrentUser: true,  recentActions: ['Connection verified', 'Craft stamp earned']  },
  { id: 'user-adrian-moreau',     name: 'Adrian Moreau',     initials: 'AM', hue: 290, xp: 820,  badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
  { id: 'user-daniel-torres',     name: 'Daniel Torres',     initials: 'DT', hue: 100, xp: 730,  badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
  { id: 'user-luca-santoro',      name: 'Luca Santoro',      initials: 'LS', hue: 210, xp: 610,  badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
  { id: 'user-james-whitaker',    name: 'James Whitaker',    initials: 'JW', hue: 50,  xp: 540,  badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
  { id: 'user-patrick-bishop',    name: 'Patrick Bishop',    initials: 'PB', hue: 180, xp: 420,  badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
]

// Seed activity log from canonical data (newest first, tagged to current user)
const activityLog = recentActivity.map(a => ({
  ...a,
  userId:    'user-john-collins',
  xpAdded:   a.xp,
  totalXp:   950,
  ts:        a.timestamp,
}))

const XP_MAP = { session: 25, event: 50, connection: 75, craftStamp: 100, vipStamp: 150 }

// ── Build ranked leaderboard ──────────────────────────────────────────────────
function buildLeaderboard() {
  return [...MEMBERS]
    .sort((a, b) => b.xp - a.xp)
    .map((m, i) => {
      const tier     = resolveTier(m.xp)
      const nextTier = TIERS.find(t => t.minXp > m.xp)
      const rangeMax = nextTier ? nextTier.minXp : tier.minXp + 5000
      return {
        ...m,
        rank:            i + 1,
        tier:            tier.name,
        tierId:          tier.id,
        tierColor:       tier.color,
        progressPercent: Math.round(((m.xp - tier.minXp) / (rangeMax - tier.minXp)) * 100),
      }
    })
}

// ── Controllers ───────────────────────────────────────────────────────────────
export function getLeaderboard(_req, res) {
  success(res, {
    venueId:     'grand-lounge',
    venueName:   'Grand Lounge',
    sessionName: "Tonight's Ranking",
    updatedAt:   new Date().toISOString(),
    leaderboard: buildLeaderboard(),
    tiers:       TIERS,
  })
}

export function getTiers(_req, res) {
  success(res, { tiers: TIERS })
}

export function getUserRank(req, res) {
  const board  = buildLeaderboard()
  const member = board.find(m => m.id === req.params.userId || (req.params.userId === 'me' && m.isCurrentUser))
  if (!member) return error(res, 'User not found', 404)
  success(res, { member })
}

export function getActivity(req, res) {
  const { userId, limit = 20 } = req.query
  const log = userId ? activityLog.filter(e => e.userId === userId) : activityLog
  success(res, { activity: log.slice(0, Number(limit)), total: log.length })
}

export function processScan(req, res) {
  const { sourceType = 'session', sourceId, xpValue, userId } = req.body
  if (!sourceId) return error(res, 'sourceId is required')

  const xpToAdd = xpValue ?? XP_MAP[sourceType] ?? 25
  const target  = MEMBERS.find(m => userId ? m.id === userId : m.isCurrentUser)
  if (!target)  return error(res, 'User not found', 404)

  const prevTier    = resolveTier(target.xp)
  target.xp        += xpToAdd
  const newTier     = resolveTier(target.xp)
  const tierChanged = newTier.id !== prevTier.id

  const entry = {
    id:          uuidv4(),
    userId:      target.id,
    sourceType,
    sourceId,
    xpAdded:     xpToAdd,
    totalXp:     target.xp,
    tierChanged,
    prevTier:    prevTier.name,
    newTier:     newTier.name,
    ts:          new Date().toISOString(),
    title:       capitalize(sourceType) + ' Recorded',
    description: `Source: ${sourceId}`,
    icon:        'qr_code_scanner',
    timestamp:   'Just now',
    badgeId:     null,
  }
  activityLog.unshift(entry)

  success(res, {
    xpAdded:      xpToAdd,
    totalXp:      target.xp,
    tierChanged,
    prevTier:     prevTier.name,
    newTier:      newTier.name,
    leaderboard:  buildLeaderboard(),
    toast:        `+${xpToAdd} XP — ${capitalize(sourceType)} recorded`,
    activityEntry: {
      id:          entry.id,
      title:       entry.title,
      description: entry.description,
      xp:          xpToAdd,
      icon:        'qr_code_scanner',
      timestamp:   'Just now',
      sourceId,
      badgeId:     null,
    },
  }, 'Scan processed')
}

export function addXpAdmin(req, res) {
  const { userId, amount = 50 } = req.body
  const target = MEMBERS.find(m => userId ? m.id === userId : m.isCurrentUser)
  if (!target) return error(res, 'User not found', 404)
  target.xp += Number(amount)
  success(res, { userId: target.id, totalXp: target.xp, leaderboard: buildLeaderboard() }, `Added ${amount} XP`)
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
