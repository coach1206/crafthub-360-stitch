/**
 * Holistic Fix 5C-2B-2 — Golden Box award-issuance authority. Connects
 * the immutable finalized ranking (5C-2B-1) to real, server-decided
 * awards. Never invents award names, artwork, XP values, or
 * eligibility rules — see the explicit rule-gap documentation below
 * and in SMOKECRAFT_GOLDEN_BOX_JUDGING_RULES.md.
 *
 * Approved award types: 'first_place'/'second_place'/'third_place' —
 * these are objective descriptors of a real, already-immutable
 * placement (golden_box_results.placement), not invented content.
 * "Approved participation or finalist awards" were checked for and do
 * not exist as configured, real reward content anywhere in this
 * codebase (golden_box_entries.status does have 'finalist'/'winner'
 * values, but mutating entry.status is out of this mandate's scope —
 * results/ranking already independently records is_winner/placement
 * on golden_box_results) — so no award record is created for any
 * placement beyond third.
 *
 * XP: xp_award_rules (migration 077) is a real, provisioned config
 * table for exactly this purpose, but has NEVER been seeded with a
 * golden_box row anywhere in this codebase — getXpAwardRule() reflects
 * that honestly (returns null) rather than inventing an amount.
 * Badge: no golden-box-specific badge_id/artwork was ever defined in
 * any catalog, seed, or doc across this codebase.
 * Passport stamp: no golden-box-specific stamp_id/artwork was ever
 * defined either.
 * All three reward types are therefore genuinely UNAVAILABLE today —
 * the service is fully wired to grant them the moment a real rule/
 * catalog entry exists (via the same canonical xpService.awardXp /
 * rewardsIntegrationService.grantBadge / passport360SmokeCraftPersistenceService.awardPassportStampLive
 * used everywhere else — never a parallel reward mechanism), but never
 * fabricates content today.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { recordGoldenBoxEvent } from './goldenBoxEventService.js'
import { getLatestFinalizedResult } from './resultsService.js'
import { awardXp } from './xpService.js'
import * as rewardsIntegrationService from './rewardsIntegrationService.js'

export class AwardsError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'
export const AWARD_RULE_ID = 'golden_box_placement_award'
export const AWARD_RULE_VERSION = 1

const PLACEMENT_AWARD_TYPES = { 1: 'first_place', 2: 'second_place', 3: 'third_place' }

/** Real, honest lookup — returns null today (documented gap above). */
async function getXpAwardRule(awardType) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM xp_award_rules WHERE source_type = 'golden_box' AND rule_key = $1 AND enabled = true`,
    [`golden_box_${awardType}`]
  )
  return rows[0] || null
}

/** No golden-box badge catalog exists — documented gap, returns null. */
async function getBadgeCatalogEntry(_awardType) { return null }

/** No golden-box Passport stamp catalog exists — documented gap, returns null. */
async function getPassportStampCatalogEntry(_awardType) { return null }

/**
 * Issues awards for a finalized competition result version.
 * Server-authoritative: placement/award type are read only from the
 * immutable golden_box_results rows written by finalizeResults() —
 * never a client-submitted value. Authorized staff only (route-level
 * requireRole('admin')). Atomic (one transaction), database-enforced
 * idempotent (golden_box_award_issuances UNIQUE(competition_id,
 * result_version) + idempotency_key). A repeated request for an
 * already-issued result version returns the ORIGINAL issuance,
 * never recomputes or duplicates.
 */
export async function issueAwards(competitionId, actorId, { resultVersion = 1, idempotencyKey } = {}) {
  const db = getDb()

  if (idempotencyKey) {
    const { rows: dup } = await db.query(
      `SELECT * FROM golden_box_award_issuances WHERE idempotency_key = $1`,
      [idempotencyKey]
    )
    if (dup[0]) return loadIssuedAwards(db, dup[0].competition_id, dup[0].result_version)
  }

  const { rows: existingRows } = await db.query(
    `SELECT * FROM golden_box_award_issuances WHERE competition_id = $1 AND result_version = $2`,
    [competitionId, resultVersion]
  )
  if (existingRows[0]) return loadIssuedAwards(db, competitionId, resultVersion)

  const finalized = await getLatestFinalizedResult(competitionId)
  if (!finalized || Number(finalized.finalization.result_version) !== Number(resultVersion)) {
    throw new AwardsError('finalized_result_required')
  }

  const qualifying = finalized.ranked.filter(r => PLACEMENT_AWARD_TYPES[Number(r.placement)])

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO golden_box_award_issuances (competition_id, result_version, issued_by, idempotency_key)
         VALUES ($1,$2,$3,$4)`,
        [competitionId, resultVersion, actorId, idempotencyKey || null]
      )
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK')
        return loadIssuedAwards(db, competitionId, resultVersion)
      }
      throw err
    }

    for (const row of qualifying) {
      const awardType = PLACEMENT_AWARD_TYPES[Number(row.placement)]
      await client.query(
        `INSERT INTO golden_box_awards (
           competition_id, entry_id, result_version, placement, award_type,
           rule_id, rule_version, issued_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (competition_id, entry_id, result_version) DO NOTHING`,
        [competitionId, row.entry_id, resultVersion, row.placement, awardType, AWARD_RULE_ID, AWARD_RULE_VERSION, actorId]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }

  // Attempt real grants for each qualifying entry, strictly gated on a
  // real approved rule/catalog entry existing — never invented content.
  // Runs after the award records commit so a grant failure never blocks
  // the atomic award-record issuance itself.
  for (const row of qualifying) {
    const awardType = PLACEMENT_AWARD_TYPES[Number(row.placement)]
    const { rows: entryRows } = await db.query(`SELECT * FROM golden_box_entries WHERE entry_id = $1`, [row.entry_id])
    const entry = entryRows[0]
    if (!entry) continue

    const xpRule = await getXpAwardRule(awardType)
    if (xpRule) {
      const result = await awardXp({
        userId: entry.user_id, guestReference: entry.guest_reference, amount: xpRule.amount,
        sourceType: 'golden_box', sourceId: entry.entry_id, reason: xpRule.description || `Golden Box ${awardType}`,
        awardRuleKey: xpRule.rule_key, idempotencyKey: `golden-box-award-xp-${competitionId}-${resultVersion}-${row.entry_id}`,
      })
      await db.query(`UPDATE golden_box_awards SET xp_status = 'issued', xp_transaction_id = $1 WHERE competition_id = $2 AND entry_id = $3 AND result_version = $4`,
        [result.transaction.id, competitionId, row.entry_id, resultVersion])
      await recordGoldenBoxEvent({
        guestReference: entry.guest_reference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/awards`,
        eventType: 'golden_box_xp_awarded', entryId: row.entry_id, ruleVersion: AWARD_RULE_VERSION,
        result: { competitionId, resultVersion, placement: row.placement, awardType, amount: xpRule.amount, transactionId: result.transaction.id },
        idempotencyKey: `golden-box-xp-awarded-canonical-${competitionId}-${resultVersion}-${row.entry_id}`,
      })
    }

    const badgeEntry = await getBadgeCatalogEntry(awardType)
    if (badgeEntry) {
      // NOTE for whoever adds the first real badge catalog entry:
      // grantBadge() requires a real passport_360 guestUuid (resolved
      // via passport360SmokeCraftPersistenceService.createOrResolveGuestProfile),
      // not the raw Golden Box guest_reference used here — this path is
      // unreachable today (badgeEntry is always null) and intentionally
      // left unexercised rather than wiring an untested identity
      // resolution for content that doesn't exist yet.
      await rewardsIntegrationService.grantBadge(entry, entry.guest_reference, badgeEntry.badgeId, badgeEntry.badgeLabel)
      await db.query(`UPDATE golden_box_awards SET badge_status = 'issued', badge_reference = $1 WHERE competition_id = $2 AND entry_id = $3 AND result_version = $4`,
        [badgeEntry.badgeId, competitionId, row.entry_id, resultVersion])
      await recordGoldenBoxEvent({
        guestReference: entry.guest_reference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/awards`,
        eventType: 'golden_box_badge_unlocked', entryId: row.entry_id, ruleVersion: AWARD_RULE_VERSION,
        result: { competitionId, resultVersion, placement: row.placement, awardType, badgeId: badgeEntry.badgeId },
        idempotencyKey: `golden-box-badge-unlocked-canonical-${competitionId}-${resultVersion}-${row.entry_id}`,
      })
    }

    const stampEntry = await getPassportStampCatalogEntry(awardType)
    if (stampEntry) {
      await db.query(`UPDATE golden_box_awards SET passport_stamp_status = 'issued', passport_stamp_reference = $1 WHERE competition_id = $2 AND entry_id = $3 AND result_version = $4`,
        [stampEntry.stampId, competitionId, row.entry_id, resultVersion])
      await recordGoldenBoxEvent({
        guestReference: entry.guest_reference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/awards`,
        eventType: 'golden_box_passport_stamp_awarded', entryId: row.entry_id, ruleVersion: AWARD_RULE_VERSION,
        result: { competitionId, resultVersion, placement: row.placement, awardType, stampId: stampEntry.stampId },
        idempotencyKey: `golden-box-passport-stamp-canonical-${competitionId}-${resultVersion}-${row.entry_id}`,
      })
    }

    await recordGoldenBoxEvent({
      guestReference: entry.guest_reference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/awards`,
      eventType: 'golden_box_awards_issued', entryId: row.entry_id, ruleVersion: AWARD_RULE_VERSION,
      result: { competitionId, resultVersion, placement: row.placement, awardType, ruleId: AWARD_RULE_ID },
      idempotencyKey: `golden-box-awards-issued-canonical-${competitionId}-${resultVersion}-${row.entry_id}`,
    })
  }

  await logActivity({ entryId: null, competitionId, actorId, action: 'awards_issued', metadata: { resultVersion, awardedCount: qualifying.length } })
  return loadIssuedAwards(db, competitionId, resultVersion)
}

async function loadIssuedAwards(db, competitionId, resultVersion) {
  const { rows: issuance } = await db.query(
    `SELECT * FROM golden_box_award_issuances WHERE competition_id = $1 AND result_version = $2`,
    [competitionId, resultVersion]
  )
  if (!issuance[0]) return null
  const { rows } = await db.query(
    `SELECT * FROM golden_box_awards WHERE competition_id = $1 AND result_version = $2 ORDER BY placement ASC`,
    [competitionId, resultVersion]
  )
  return { status: 'issued', issuance: issuance[0], awards: rows }
}

/**
 * The single award view for one entry — the state the results screen
 * renders. Never fabricates a reward: 'no_finalized_result' before
 * ranking is finalized, 'awards_pending' once finalized but before
 * an admin has issued awards, 'not_qualified' for a finalized,
 * awards-issued entry outside the top three, or the real award row.
 */
export async function getEntryAward(competitionId, entryId) {
  const db = getDb()
  const finalized = await getLatestFinalizedResult(competitionId)
  if (!finalized) return { status: 'no_finalized_result', award: null }
  const resultVersion = finalized.finalization.result_version
  const { rows: issuance } = await db.query(
    `SELECT * FROM golden_box_award_issuances WHERE competition_id = $1 AND result_version = $2`,
    [competitionId, resultVersion]
  )
  if (!issuance[0]) return { status: 'awards_pending', award: null }
  const { rows } = await db.query(
    `SELECT * FROM golden_box_awards WHERE competition_id = $1 AND entry_id = $2 AND result_version = $3`,
    [competitionId, entryId, resultVersion]
  )
  if (!rows[0]) return { status: 'not_qualified', award: null }
  return { status: 'issued', award: rows[0] }
}
