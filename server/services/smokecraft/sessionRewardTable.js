/**
 * Server-owned XP reward lookup — Holistic Fix 4.
 *
 * Reuses src/constants/smokecraftRewards.js (SESSION_REWARDS) directly
 * rather than duplicating its XP values into a second, competing table
 * that could drift out of sync. That file is pure data/constants with no
 * browser-only imports (confirmed by inspection), so importing it
 * server-side is safe. This is the ONLY place the server trusts an XP
 * amount from — never the request body — satisfying the mandate's "no
 * client-controlled XP or awards" requirement.
 */
import { SESSION_REWARDS, SC_RANKS } from '../../../src/constants/smokecraftRewards.js'

/** XP for completing a given curriculum session id, or 0 if unknown. */
export function getSessionRewardXp(sessionId) {
  const entry = SESSION_REWARDS[sessionId]
  return entry && typeof entry.xp === 'number' ? entry.xp : 0
}

/**
 * Holistic Fix 5A: badges tied 1:1 to a curriculum session's completion
 * (SESSION_REWARDS[id].sessionBadges), used to auto-grant badges as
 * part of the SAME atomic transaction as the session completion itself
 * — the client no longer decides which badges to claim.
 */
export function getSessionBadgeIds(sessionId) {
  const entry = SESSION_REWARDS[sessionId]
  if (!entry || !Array.isArray(entry.sessionBadges)) return []
  return entry.sessionBadges.map(b => b.id).filter(Boolean)
}

/**
 * Holistic Fix 5A: the rank ladder is verified against the existing,
 * already-approved, already-aligned `SC_RANKS` (smokecraftRewards.js)
 * and `RANKS` (session.js) constants — not invented. Returns the rank
 * label for a given XP total using the exact same thresholds the
 * client has always used for display, so server and client can never
 * disagree about what rank a given XP total means.
 */
export function getRankForXp(xp) {
  for (let i = SC_RANKS.length - 1; i >= 0; i--) {
    if (xp >= SC_RANKS[i].minXP) return SC_RANKS[i].name
  }
  return SC_RANKS[0].name
}

export function getRankLadder() {
  return SC_RANKS.map(r => ({ name: r.name, minXP: r.minXP }))
}

// Named, server-approved XP grants not tied to a session completion
// (e.g. a one-off bonus). Empty today — no such flow exists yet in the
// product; any future one must be added here explicitly rather than
// letting a client dictate an arbitrary amount.
const NAMED_XP_SOURCES = {}

/** Returns the server-approved XP amount for a named source, or null if unrecognized (caller must reject). */
export function getNamedXpAmount(awardKey) {
  if (!awardKey || !(awardKey in NAMED_XP_SOURCES)) return null
  return NAMED_XP_SOURCES[awardKey]
}
