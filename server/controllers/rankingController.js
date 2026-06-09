/**
 * Ranking Controller — Grand Lounge Leaderboard
 * Canonical roster + seeded activity log from server/data/.
 * XP and activityLog are persisted across server restarts.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'
import { recentActivity } from '../data/recentActivity.js'
import { loadJson, saveJson } from '../utils/persist.js'
import { appendResetAudit } from '../utils/resetAudit.js'

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

// ── Canonical roster (seed) ───────────────────────────────────────────────────
const SEED_MEMBERS = [
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

// ── Load persisted state ──────────────────────────────────────────────────────
// Persist XP overrides as { memberId: xp } so seed structure stays canonical
const persistedXp = loadJson('ranking_xp.json', {})

// Member roster: use persisted list if present, otherwise seed
const persistedMembers = loadJson('ranking_members.json', null)
const MEMBERS = (persistedMembers || SEED_MEMBERS).map(m => ({
  ...m,
  xp: persistedXp[m.id] !== undefined ? persistedXp[m.id] : m.xp,
}))

// Activity log: seed first, then persisted additions on top
const seedLog = recentActivity.map(a => ({
  ...a,
  userId:  'user-john-collins',
  xpAdded: a.xp,
  totalXp: 950,
  ts:      a.timestamp,
}))
const persistedLog = loadJson('ranking_activity.json', [])
const activityLog  = [...persistedLog, ...seedLog]

function saveState() {
  const xpMap = {}
  for (const m of MEMBERS) xpMap[m.id] = m.xp
  saveJson('ranking_xp.json', xpMap)
  // Only persist runtime additions (everything before seed entries)
  const runtimeEntries = activityLog.filter(e => !seedLog.some(s => s.id === e.id))
  saveJson('ranking_activity.json', runtimeEntries)
}

function saveMembers() {
  saveJson('ranking_members.json', MEMBERS)
}

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
  saveState()

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
  saveState()
  success(res, { userId: target.id, totalXp: target.xp, leaderboard: buildLeaderboard() }, `Added ${amount} XP`)
}

// ── Admin: member roster management ──────────────────────────────────────────

export function addMember(req, res) {
  const { name, initials, hue = 180, xp = 0, badgeType = 'aficionado', isCurrentUser = false, recentActions = [] } = req.body
  if (!name || !initials) return error(res, 'name and initials are required')

  const id = 'user-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  if (MEMBERS.some(m => m.id === id || (m.name.toLowerCase() === name.toLowerCase()))) {
    return error(res, 'A member with that name already exists', 409)
  }

  const member = { id, name, initials, hue: Number(hue), xp: Number(xp), badgeType, isCurrentUser: Boolean(isCurrentUser), recentActions }
  MEMBERS.push(member)
  saveMembers()
  saveState()
  success(res, { member, leaderboard: buildLeaderboard() }, 'Member added')
}

export function removeMember(req, res) {
  const { memberId } = req.params
  const idx = MEMBERS.findIndex(m => m.id === memberId)
  if (idx === -1) return error(res, 'Member not found', 404)
  const [removed] = MEMBERS.splice(idx, 1)
  saveMembers()
  saveState()
  success(res, { removed, leaderboard: buildLeaderboard() }, 'Member removed')
}

export function updateMember(req, res) {
  const { memberId } = req.params
  const member = MEMBERS.find(m => m.id === memberId)
  if (!member) return error(res, 'Member not found', 404)

  const { name, initials, badgeType } = req.body
  if (name      !== undefined) member.name      = name
  if (initials  !== undefined) member.initials  = initials
  if (badgeType !== undefined) member.badgeType = badgeType

  saveMembers()
  success(res, { member, leaderboard: buildLeaderboard() }, 'Member updated')
}

// ── Admin: reset persisted state to seed ──────────────────────────────────────

export function resetXpCore(user, source = 'manual') {
  for (const member of MEMBERS) {
    const seed = SEED_MEMBERS.find(s => s.id === member.id)
    member.xp = seed ? seed.xp : 0
  }
  saveState()
  appendResetAudit('ranking-xp', user, source)
  return { leaderboard: buildLeaderboard() }
}

export function resetActivityCore(user, source = 'manual') {
  activityLog.splice(0, activityLog.length, ...seedLog)
  saveJson('ranking_activity.json', [])
  appendResetAudit('ranking-activity', user, source)
  return { cleared: true }
}

export function resetMembersCore(user, source = 'manual') {
  MEMBERS.splice(0, MEMBERS.length, ...SEED_MEMBERS.map(m => ({ ...m })))
  saveMembers()
  saveState()
  appendResetAudit('ranking-members', user, source)
  return { leaderboard: buildLeaderboard() }
}

export function resetXp(req, res) {
  const data = resetXpCore(req.user)
  success(res, data, 'XP reset to seed values')
}

export function resetActivity(req, res) {
  const data = resetActivityCore(req.user)
  success(res, data, 'Activity log cleared')
}

export function resetMembers(req, res) {
  const data = resetMembersCore(req.user)
  success(res, data, 'Member roster reset to seed')
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
