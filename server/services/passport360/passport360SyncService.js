/**
 * Passport 360 Connection Completion — secure synchronization layer.
 *
 * Unlike the pre-existing Phase F.5 API (server/routes/passport360SmokeCraftRoutes.js),
 * every write here is driven only by server-verified identity
 * (req.smokecraftIdentity.id) and real evidence read from the same
 * shared tables every other SmokeCraft pass reads from
 * (smokecraft_progression_events, xp_accounts, and each system's own
 * learner-state table) — never from a client-submitted guestId, xpAmount,
 * stampId, or completion flag. Reuses the existing migration-068 tables
 * and the existing passport360SmokeCraftPersistenceService.js write/read
 * primitives (createOrResolveGuestProfile, awardPassportStampLive,
 * saveSmokeCraftSessionToPassport, getGuestEarnedStamps, etc.) rather
 * than duplicating them.
 */
import { getDb } from '../../db/connection.js'
import {
  createOrResolveGuestProfile,
  awardPassportStampLive,
  saveSmokeCraftSessionToPassport,
  getGuestPassportProgress,
  getGuestEarnedStamps,
  getGuestBadges,
} from './passport360SmokeCraftPersistenceService.js'

export class PassportSyncError extends Error {
  constructor(code) { super(code); this.code = code }
}

const TENANT_ID = 'novee-default'
const VENUE_ID = 'novee-grand-lounge'
const MODULE_KEY = 'smokecraft-360'

async function resolveGuest(guestReference) {
  const res = await createOrResolveGuestProfile({ tenantId: TENANT_ID, venueId: VENUE_ID, guestReference })
  if (!res.ok) throw new PassportSyncError('passport_backend_unavailable')
  return res.guest
}

// Real evidence catalog — each entry maps a verifiable backend fact to a
// stable stamp key. No entry is ever satisfied by a client-submitted flag.
async function collectEvidence(db, guestReference) {
  const evidence = []

  const filler = await db.query(`SELECT completed_at FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [guestReference])
  if (filler.rows[0]) evidence.push({ stampId: 'filler-arrangement-complete', label: 'Filler Arrangement Complete', sourceRoute: '/smokecraft/filler-arrangement', sourceSessionId: 'filler-arrangement', earnedAt: filler.rows[0].completed_at })

  const skillTree = await db.query(`SELECT completed_at FROM smokecraft_skill_tree_learner_state WHERE guest_reference = $1 AND node_key = 'foundation' AND state = 'completed'`, [guestReference])
  if (skillTree.rows[0]) evidence.push({ stampId: 'skill-tree-foundation-complete', label: 'Skill Tree Foundation Complete', sourceRoute: '/smokecraft/skill-tree', sourceSessionId: 'skill-tree', earnedAt: skillTree.rows[0].completed_at })

  const collections = await db.query(`SELECT COUNT(*)::int AS c, MAX(earned_at) AS latest FROM smokecraft_collection_ownership WHERE guest_reference = $1`, [guestReference])
  if (collections.rows[0].c > 0) evidence.push({ stampId: 'collections-first-item-earned', label: 'First Collection Item Earned', sourceRoute: '/smokecraft/collections', sourceSessionId: 'collections', earnedAt: collections.rows[0].latest })

  const challenge = await db.query(`SELECT COUNT(*)::int AS c, MAX(completed_at) AS latest FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND participation_state = 'completed'`, [guestReference])
  if (challenge.rows[0].c > 0) evidence.push({ stampId: 'challenge-hub-first-completion', label: 'First Challenge Completed', sourceRoute: '/smokecraft/challenge-hub', sourceSessionId: 'challenge-hub', earnedAt: challenge.rows[0].latest })

  const blendFault = await db.query(`SELECT MAX(submitted_at) AS latest FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND status = 'passed'`, [guestReference])
  if (blendFault.rows[0].latest) evidence.push({ stampId: 'blend-fault-identification-passed', label: 'Blend Fault Identification Passed', sourceRoute: '/smokecraft/challenges/blend-fault-identification', sourceSessionId: 'blend-fault-identification', earnedAt: blendFault.rows[0].latest })

  return evidence
}

async function realXpBalance(db, guestReference) {
  const { rows } = await db.query(`SELECT balance FROM xp_accounts WHERE guest_reference = $1`, [guestReference])
  return rows[0]?.balance ?? 0
}

// Idempotent XP-summary sync — sets the Passport's mirrored total_xp to
// the real, authoritative xp_accounts.balance (an absolute set, never an
// additive award), so repeated synchronization can never double-count.
async function syncXpSummary(db, guestId, realBalance) {
  await db.query(
    `INSERT INTO passport_360_guest_progress (tenant_id, venue_id, guest_id, module_key, total_xp)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (guest_id, module_key) DO UPDATE SET total_xp = $5, updated_at = now()`,
    [TENANT_ID, VENUE_ID, guestId, MODULE_KEY, realBalance]
  )
}

// The core secure synchronization operation. Never accepts a
// client-submitted stamp, XP amount, or completion flag — everything is
// re-derived from real evidence on every call, and every write is
// idempotent (dedupe_key on stamps, absolute-set on XP, no session
// duplication).
export async function synchronize(guestReference) {
  const db = getDb()
  const guest = await resolveGuest(guestReference)
  const evidence = await collectEvidence(db, guestReference)

  const newlyAwarded = []
  const alreadyOwned = []
  for (const e of evidence) {
    const result = await awardPassportStampLive({
      tenantId: TENANT_ID, venueId: VENUE_ID, guestId: guest.guest_id,
      stampId: e.stampId, moduleKey: MODULE_KEY,
      sourceSessionId: e.sourceSessionId, sourceRoute: e.sourceRoute, xpAwarded: 0,
    })
    if (!result.ok) throw new PassportSyncError('passport_backend_unavailable')
    if (result.duplicate) alreadyOwned.push(e.stampId)
    else newlyAwarded.push(e.stampId)
  }

  const realBalance = await realXpBalance(db, guestReference)
  await syncXpSummary(db, guest.guest_id, realBalance)

  // One passport session row per real progression-event count snapshot —
  // not per sync call — keyed by a stable smokecraft_session_id so
  // repeated syncs with unchanged evidence do not create duplicate rows.
  const { rows: eventCountRows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1`, [guestReference])
  const eventCount = eventCountRows[0].c
  const sessionKey = `passport-sync-snapshot-${eventCount}`
  const { rows: existingSession } = await db.query(
    `SELECT passport_session_id FROM passport_360_smokecraft_sessions WHERE guest_id = $1 AND smokecraft_session_id = $2`,
    [guest.guest_id, sessionKey]
  )
  if (existingSession.length === 0) {
    await saveSmokeCraftSessionToPassport({
      tenantId: TENANT_ID, venueId: VENUE_ID, guestId: guest.guest_id,
      smokecraftSessionId: sessionKey, sessionStatus: 'completed',
      completedRoute: '/smokecraft/passport-stamp',
      completedSteps: evidence.map(e => e.stampId),
      xpSummary: { totalXp: realBalance }, stampSummary: evidence.map(e => e.stampId),
    })
  }

  return { guest, newlyAwarded, alreadyOwned, realBalance, evidenceCount: evidence.length }
}

export async function getProfile(guestReference) {
  const db = getDb()
  const guest = await resolveGuest(guestReference)
  const progress = await getGuestPassportProgress({ guestId: guest.guest_id, moduleKey: MODULE_KEY })
  const stamps = await getGuestEarnedStamps({ guestId: guest.guest_id, moduleKey: MODULE_KEY })
  const badges = await getGuestBadges({ guestId: guest.guest_id, moduleKey: MODULE_KEY })

  const skillTree = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_skill_tree_learner_state WHERE guest_reference = $1 AND state = 'completed'`, [guestReference])
  const collections = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_collection_ownership WHERE guest_reference = $1`, [guestReference])
  const challenges = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND participation_state = 'completed'`, [guestReference])
  const blendFault = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND status = 'passed'`, [guestReference])

  return {
    passportId: guest.guest_id,
    profileStatus: guest.profile_status,
    createdAt: guest.created_at || null,
    xpSummary: { totalXp: progress.progress?.total_xp ?? 0 },
    stampSummary: { count: stamps.stamps?.length ?? 0 },
    badgeSummary: { count: badges.badges?.length ?? 0, supported: true },
    smokecraftProgress: {
      skillTreeCompletedNodes: skillTree.rows[0].c,
      collectionsOwnedItems: collections.rows[0].c,
      challengesCompleted: challenges.rows[0].c,
      blendFaultPassed: blendFault.rows[0].c > 0,
    },
    goldenBox: { connected: false, reason: 'not_yet_approved_for_passport_sync' },
    tasteProfile: { connected: false, reason: 'no_confirmed_taste_data_source_for_this_guest' },
  }
}

export async function getStamps(guestReference) {
  const guest = await resolveGuest(guestReference)
  const stamps = await getGuestEarnedStamps({ guestId: guest.guest_id, moduleKey: MODULE_KEY })
  return stamps.stamps || []
}

export async function getConnections(guestReference) {
  const db = getDb()
  const mentor = await db.query(
    `SELECT DISTINCT payload->>'mentorId' AS mentor_id FROM smokecraft_progression_events WHERE guest_reference = $1 AND payload ? 'mentorId'`,
    [guestReference]
  )
  return {
    craftConnections: [{ craftKey: 'smokecraft-360', connected: true, source: 'real_progression_events' }],
    mentorConnections: mentor.rows.filter(r => r.mentor_id).map(r => ({ mentorId: r.mentor_id, source: 'real_progression_events' })),
    venueConnections: [],
    eventConnections: [],
    platformConnections: [],
  }
}

export async function getActivity(guestReference, limit = 50) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT event_type, source_route, created_at FROM smokecraft_progression_events WHERE guest_reference = $1 ORDER BY created_at DESC LIMIT $2`,
    [guestReference, Math.min(limit, 200)]
  )
  return rows
}
