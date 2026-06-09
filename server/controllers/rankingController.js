/**
 * Ranking Controller
 * Handles Grand Lounge leaderboard, XP scan processing, and tier resolution.
 * In-memory store mirrors src/data/rankingData.js — replace with DB later.
 */
import { v4 as uuidv4 } from 'uuid'

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = [
  { id: 'aficionado',  name: 'Aficionado',  minXp: 0,    maxXp: 999,  color: '#C9A84C', description: 'Entry level — welcome to the Grand Lounge.' },
  { id: 'connoisseur', name: 'Connoisseur', minXp: 1000, maxXp: 2499, color: '#D4820A', description: 'A cultivated palate recognized by the Brotherhood.' },
  { id: 'sommelier',   name: 'Sommelier',   minXp: 2500, maxXp: 4999, color: '#B8860B', description: 'Expert-level recognition across all craft domains.' },
  { id: 'patron',      name: 'Patron',      minXp: 5000, maxXp: null, color: '#8B0000', description: 'The highest honor — a Patron of the Grand Lounge.' },
]

function resolveTier(xp) {
  return [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0]
}

// ── In-memory leaderboard ─────────────────────────────────────────────────────
const MEMBERS = [
  { id: 'u001', name: 'Sebastian Harrow', initials: 'SH', hue: 45,  xp: 1740, isCurrentUser: false },
  { id: 'u002', name: 'Marco Del Valle',  initials: 'MD', hue: 30,  xp: 1580, isCurrentUser: false },
  { id: 'u003', name: 'Vincent Ashworth', initials: 'VA', hue: 200, xp: 1285, isCurrentUser: false },
  { id: 'u004', name: 'David Harper',     initials: 'DH', hue: 160, xp: 1120, isCurrentUser: false },
  { id: 'u005', name: 'John M Collins',   initials: 'JC', hue: 45,  xp: 950,  isCurrentUser: true  },
  { id: 'u006', name: 'Alicia Chen',      initials: 'AC', hue: 290, xp: 870,  isCurrentUser: false },
  { id: 'u007', name: 'Raymond West',     initials: 'RW', hue: 100, xp: 740,  isCurrentUser: false },
  { id: 'u008', name: 'Thomas Lane',      initials: 'TL', hue: 210, xp: 620,  isCurrentUser: false },
  { id: 'u009', name: 'Grace Okafor',     initials: 'GO', hue: 50,  xp: 480,  isCurrentUser: false },
  { id: 'u010', name: 'Marcus Bell',      initials: 'MB', hue: 180, xp: 310,  isCurrentUser: false },
]

// Recent activity log (newest first)
const activityLog = []

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildLeaderboard() {
  return [...MEMBERS]
    .sort((a, b) => b.xp - a.xp)
    .map((m, i) => {
      const tier = resolveTier(m.xp)
      const nextTier = TIERS.find(t => t.minXp > m.xp)
      const nextXp   = nextTier ? nextTier.minXp : tier.minXp + 5000
      return {
        ...m,
        rank:            i + 1,
        tier:            tier.name,
        tierId:          tier.id,
        tierColor:       tier.color,
        progressPercent: Math.round(((m.xp - tier.minXp) / ((nextTier?.minXp ?? tier.minXp + 5000) - tier.minXp)) * 100),
        recentActions:   ['Grand Lounge Session', 'Craft Stamp Earned', 'Connection Verified'],
      }
    })
}

// XP awarded per source type
const XP_MAP = {
  session:    25,
  event:      50,
  connection: 75,
  craftStamp: 100,
  vipStamp:   150,
}

// ── Controllers ───────────────────────────────────────────────────────────────
export function getLeaderboard(_req, res) {
  res.json({ success: true, leaderboard: buildLeaderboard(), tiers: TIERS })
}

export function getTiers(_req, res) {
  res.json({ success: true, tiers: TIERS })
}

export function getUserRank(req, res) {
  const board  = buildLeaderboard()
  const member = board.find(m => m.id === req.params.userId || m.isCurrentUser)
  if (!member) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, member })
}

export function processScan(req, res) {
  const { sourceType = 'session', sourceId, xpValue, userId } = req.body
  if (!sourceId) return res.status(400).json({ success: false, message: 'sourceId required' })

  const xpToAdd = xpValue ?? XP_MAP[sourceType] ?? 25
  const target  = MEMBERS.find(m => (userId ? m.id === userId : m.isCurrentUser))
  if (!target)  return res.status(404).json({ success: false, message: 'User not found' })

  const prevTier = resolveTier(target.xp)
  target.xp += xpToAdd
  const newTier  = resolveTier(target.xp)

  const entry = {
    id:         uuidv4(),
    userId:     target.id,
    sourceType,
    sourceId,
    xpAdded:    xpToAdd,
    totalXp:    target.xp,
    tierChanged: newTier.id !== prevTier.id,
    newTier:    newTier.name,
    ts:         new Date().toISOString(),
  }
  activityLog.unshift(entry)

  const board = buildLeaderboard()
  res.json({
    success:     true,
    xpAdded:     xpToAdd,
    totalXp:     target.xp,
    tierChanged: entry.tierChanged,
    newTier:     newTier.name,
    leaderboard: board,
    toast:       `+${xpToAdd} XP — ${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} recorded`,
    activityEntry: {
      id:    entry.id,
      title: capitalize(sourceType) + ' Recorded',
      desc:  `Source: ${sourceId}`,
      xp:    xpToAdd,
      icon:  'qr_code_scanner',
      ago:   'Just now',
    },
  })
}

export function getActivity(req, res) {
  const { userId, limit = 20 } = req.query
  const log = userId ? activityLog.filter(e => e.userId === userId) : activityLog
  res.json({ success: true, activity: log.slice(0, Number(limit)) })
}

export function addXpAdmin(req, res) {
  const { userId, amount = 50 } = req.body
  const target = MEMBERS.find(m => userId ? m.id === userId : m.isCurrentUser)
  if (!target) return res.status(404).json({ success: false, message: 'User not found' })
  target.xp += Number(amount)
  res.json({ success: true, totalXp: target.xp, leaderboard: buildLeaderboard() })
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
