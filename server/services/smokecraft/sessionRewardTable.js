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
import { SESSION_REWARDS } from '../../../src/constants/smokecraftRewards.js'

/** XP for completing a given curriculum session id, or 0 if unknown. */
export function getSessionRewardXp(sessionId) {
  const entry = SESSION_REWARDS[sessionId]
  return entry && typeof entry.xp === 'number' ? entry.xp : 0
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
