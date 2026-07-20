/**
 * Package 1 — Step 13: integrate existing verified systems (Leaderboard,
 * Badges, Passport Stamps), never rebuild them. Each grant is idempotent
 * (UNIQUE(entry_id, reward_type) on golden_box_rewards) and recorded in
 * golden_box_rewards as the auditable link between a Golden Box result
 * and the reward actually issued in the reused system.
 */
import { getDb } from '../../db/connection.js'
import { awardXp } from './xpService.js'
import { logActivity } from './activityLogService.js'

export class RewardsError extends Error {
  constructor(code) { super(code); this.code = code }
}

async function alreadyGranted(entryId, rewardType) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM golden_box_rewards WHERE entry_id = $1 AND reward_type = $2`,
    [entryId, rewardType]
  )
  return rows.length > 0
}

async function recordGrant(entryId, rewardType, referenceId) {
  const db = getDb()
  await db.query(
    `INSERT INTO golden_box_rewards (entry_id, reward_type, reference_id)
     VALUES ($1,$2,$3) ON CONFLICT (entry_id, reward_type) DO NOTHING`,
    [entryId, rewardType, referenceId || null]
  )
}

/** Publishes a Golden Box result into the existing smoke_leaderboard_entries table — no parallel leaderboard. */
export async function publishToLeaderboard(entry, result, venueId) {
  if (await alreadyGranted(entry.entry_id, 'leaderboard_entry')) return { skipped: true }
  const db = getDb()
  await db.query(
    `INSERT INTO smoke_leaderboard_entries (venue_id, category, participant_ref, final_score, metadata)
     VALUES ($1, 'golden_box', $2, $3, $4)`,
    [venueId || 'global', entry.guest_reference, Math.round(result.aggregate_score), JSON.stringify({ competitionId: entry.competition_id, entryId: entry.entry_id })]
  ).catch((err) => {
    // Defensive: never silently invent a fabricated leaderboard row if
    // the insert genuinely fails.
    throw new RewardsError(`leaderboard_integration_failed:${err.message}`)
  })
  await recordGrant(entry.entry_id, 'leaderboard_entry', String(entry.competition_id))
  await logActivity({ entryId: entry.entry_id, competitionId: entry.competition_id, action: 'leaderboard_published' })
  return { skipped: false }
}

/** Grants an existing/curated Passport 360 badge — golden_box-scoped badge_id, module_key='golden-box'. */
export async function grantBadge(entry, guestUuid, badgeId, badgeLabel) {
  if (await alreadyGranted(entry.entry_id, 'badge')) return { skipped: true }
  const db = getDb()
  if (!guestUuid) throw new RewardsError('guest_profile_required_for_badge')
  await db.query(
    `INSERT INTO passport_360_badges (guest_id, badge_id, badge_label, module_key, source_session_id)
     VALUES ($1,$2,$3,'golden-box',$4)`,
    [guestUuid, badgeId, badgeLabel || null, entry.entry_id]
  )
  await recordGrant(entry.entry_id, 'badge', badgeId)
  await logActivity({ entryId: entry.entry_id, action: 'badge_granted', metadata: { badgeId } })
  return { skipped: false }
}

/** Awards XP through the normalized xp ledger (never a direct balance mutation). */
export async function grantXp(entry, amount, reason) {
  if (await alreadyGranted(entry.entry_id, 'xp')) return { skipped: true }
  const result = await awardXp({
    userId: entry.user_id,
    guestReference: entry.guest_reference,
    amount,
    sourceType: 'golden_box',
    sourceId: entry.entry_id,
    reason,
    idempotencyKey: `golden_box_reward:${entry.entry_id}`,
  })
  await recordGrant(entry.entry_id, 'xp', String(result.transaction.id))
  return { skipped: false, transaction: result.transaction }
}
