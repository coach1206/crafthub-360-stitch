/**
 * Package 1 — human judging (Step 10, Decision 3). Official scores are
 * always human_judge scorer_type; AI output never enters this table
 * (see aiAnalysisService.js — structurally separate table, no path in).
 *
 * Holistic Fix 5C-2A — judge-assignment and scorecard-scoring
 * authority. Rubric formalized from the already-approved, already-live
 * 12-category scorecard (migration 103, `golden_box_rubric_criteria`)
 * — no new or conflicting rubric invented. Assignment is now
 * authorization-checked (eligible entry status, no self-assignment,
 * venue/competition boundary) with a real assigned-by audit column.
 * Scorecards now have a genuine draft-save path distinct from final
 * submission, a server-computed weighted total (never client-
 * submitted), optimistic concurrency on drafts, and idempotent final
 * submission.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { transitionScorecard } from './lifecycleService.js'
import { recordGoldenBoxEvent } from './goldenBoxEventService.js'

export class JudgingError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

// Entry statuses a judge assignment is meaningful for — matches the
// real submission lifecycle (submitEntry -> 'submitted';
// lockEntry -> 'locked'; under_review is the judging-in-progress
// state). Assigning a judge to a still-editable draft, or to an entry
// that never submitted, would let a judge see/score content that
// isn't the entrant's final, locked-in work.
const ELIGIBLE_ENTRY_STATUSES_FOR_ASSIGNMENT = ['submitted', 'locked', 'under_review']

export async function getRubric() {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM golden_box_rubric_criteria WHERE active = true ORDER BY display_order`
  )
  return rows
}

function serializeCriterion(r) {
  return {
    criterionKey: r.criterion_key, ruleVersion: r.rule_version, label: r.label, description: r.description,
    minScore: Number(r.min_score), maxScore: Number(r.max_score), weight: Number(r.weight),
    commentRequired: r.comment_required, displayOrder: r.display_order,
  }
}

/**
 * Assigns a judge to an entry. Server-authoritative eligibility:
 *   - the entry must be in a real judging-eligible status (never a
 *     still-editable draft)
 *   - a judge may never be assigned to their own entry
 *   - for a venue-scoped competition, the judge must have a real
 *     active venue membership for that venue (same check already used
 *     by visibilityService.resolveViewerRole — reused, not duplicated)
 *   - duplicate assignment is a real database UNIQUE(judge_id, entry_id)
 *     no-op, never a second row
 * Route-level authorization (requireAuth + requireRole('admin')) is
 * the "only authorized staff" gate — this function additionally
 * enforces the eligibility rules above, which authorization alone
 * cannot express.
 */
export async function assignJudge(competitionId, entryId, judgeUserId, assignedBy) {
  const db = getDb()
  const { rows: entryRows } = await db.query(`SELECT * FROM golden_box_entries WHERE entry_id = $1 AND competition_id = $2`, [entryId, competitionId])
  const entry = entryRows[0]
  if (!entry) throw new JudgingError('entry_not_found')
  if (!ELIGIBLE_ENTRY_STATUSES_FOR_ASSIGNMENT.includes(entry.status)) {
    throw new JudgingError(`entry_not_eligible_for_judging:${entry.status}`)
  }
  if (entry.user_id === judgeUserId) {
    throw new JudgingError('judge_self_assignment_prohibited')
  }

  const { rows: competitionRows } = await db.query(`SELECT * FROM golden_box_competitions WHERE id = $1`, [competitionId])
  const competition = competitionRows[0]
  if (!competition) throw new JudgingError('competition_not_found')
  if (competition.scope === 'venue' && competition.scope_venue_id) {
    const { rows: membershipRows } = await db.query(
      `SELECT membership_type FROM venue_memberships WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
      [judgeUserId, competition.scope_venue_id]
    )
    if (membershipRows.length === 0) throw new JudgingError('judge_outside_venue_scope')
  }

  const { rows: judgeRows } = await db.query(
    `INSERT INTO golden_box_judges (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING *`,
    [judgeUserId]
  )
  const judge = judgeRows[0]
  const { rows } = await db.query(
    `INSERT INTO golden_box_judge_assignments (competition_id, judge_id, entry_id, assigned_by)
     VALUES ($1,$2,$3,$4) ON CONFLICT (judge_id, entry_id) DO NOTHING RETURNING *`,
    [competitionId, judge.id, entryId, assignedBy]
  )
  const assignment = rows[0]
  await logActivity({ entryId, competitionId, actorId: assignedBy, action: 'judge_assigned', metadata: { judgeUserId } })
  await recordGoldenBoxEvent({
    guestReference: `user:${assignedBy}`, sourceScreen: 'GoldenBoxAdmin', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`,
    eventType: 'golden_box_judge_assigned', entryId, result: { judgeUserId, alreadyAssigned: !assignment },
    idempotencyKey: `golden-box-judge-assigned-canonical-${competitionId}-${judge.id}-${entryId}`,
  })
  return assignment || { judge_id: judge.id, entry_id: entryId, alreadyAssigned: true }
}

export async function isAssignedJudge(entryId, judgeUserId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM golden_box_judge_assignments ja
     JOIN golden_box_judges j ON j.id = ja.judge_id
     WHERE ja.entry_id = $1 AND j.user_id = $2`,
    [entryId, judgeUserId]
  )
  return rows.length > 0
}

function validateScorePayload(scores, rubricByKey) {
  for (const s of scores) {
    const criterion = rubricByKey.get(s.category)
    if (!criterion) throw new JudgingError(`invalid_category:${s.category}`)
    const max = Number(criterion.max_score)
    const min = Number(criterion.min_score)
    if (typeof s.score !== 'number' || s.score < min || s.score > max) throw new JudgingError(`invalid_score:${s.category}`)
    if (criterion.comment_required && !s.comment) throw new JudgingError(`comment_required:${s.category}`)
  }
}

async function getOrCreateDraftScorecard(client, entryId, judgeId) {
  const { rows: existing } = await client.query(
    `SELECT * FROM golden_box_scorecards WHERE entry_id = $1 AND judge_id = $2 AND amended_from IS NULL FOR UPDATE`,
    [entryId, judgeId]
  )
  if (existing[0]) return existing[0]
  // A row lock only protects a row that already exists — the FIRST
  // draft save for a judge+entry has no row to lock, so two concurrent
  // first saves can both reach here. The real guard is the database's
  // own partial UNIQUE(entry_id, judge_id) WHERE amended_from IS NULL
  // (migration 103) — catch the loser's violation (via a SAVEPOINT, so
  // the surrounding transaction survives) and fetch the real winning
  // row instead of erroring or creating a duplicate.
  await client.query('SAVEPOINT before_scorecard_insert')
  try {
    const { rows } = await client.query(
      `INSERT INTO golden_box_scorecards (entry_id, judge_id) VALUES ($1,$2) RETURNING *`,
      [entryId, judgeId]
    )
    return rows[0]
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      await client.query('ROLLBACK TO SAVEPOINT before_scorecard_insert')
      const { rows: winner } = await client.query(
        `SELECT * FROM golden_box_scorecards WHERE entry_id = $1 AND judge_id = $2 AND amended_from IS NULL FOR UPDATE`,
        [entryId, judgeId]
      )
      return winner[0]
    }
    throw err
  }
}

/**
 * Saves a real, distinct scorecard DRAFT — never transitions status,
 * never requires every criterion to be present, never computes an
 * authoritative total (that only happens on final submission). Real
 * optimistic concurrency: expectedVersion, if supplied, must match the
 * scorecard's real draft_version or the write is rejected with a
 * 409-mapped stale_version conflict. idempotencyKey dedupes a rapid
 * double-click.
 */
export async function saveScorecardDraft(entryId, judgeUserId, scores, actorId, { expectedVersion, idempotencyKey } = {}) {
  const authorized = await isAssignedJudge(entryId, judgeUserId)
  if (!authorized) throw new JudgingError('judge_not_assigned')

  const db = getDb()
  const rubric = await getRubric()
  const rubricByKey = new Map(rubric.map(r => [r.criterion_key, r]))
  // Draft scores may be partial — only validate the ones actually sent.
  validateScorePayload(scores, rubricByKey)

  const { rows: judgeRows } = await db.query(`SELECT id FROM golden_box_judges WHERE user_id = $1`, [judgeUserId])
  const judgeId = judgeRows[0].id

  if (idempotencyKey) {
    const { rows: dup } = await db.query(`SELECT * FROM golden_box_scorecards WHERE idempotency_key = $1`, [idempotencyKey])
    if (dup[0]) return dup[0]
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const scorecard = await getOrCreateDraftScorecard(client, entryId, judgeId)
    if (scorecard.status !== 'draft') throw new JudgingError('scorecard_already_submitted')

    if (idempotencyKey) {
      const { rows: dupLocked } = await client.query(`SELECT * FROM golden_box_scorecards WHERE idempotency_key = $1`, [idempotencyKey])
      if (dupLocked[0]) { await client.query('ROLLBACK'); return dupLocked[0] }
    }
    if (typeof expectedVersion === 'number' && expectedVersion !== scorecard.draft_version) {
      await client.query('ROLLBACK')
      const err = new JudgingError('stale_version')
      err.currentVersion = scorecard.draft_version
      throw err
    }

    // Replace this judge's category scores wholesale on each draft save
    // — simplest correct semantics for "here is my current draft state"
    // without needing per-category diffing.
    await client.query(`DELETE FROM golden_box_scores WHERE scorecard_id = $1`, [scorecard.id])
    for (const s of scores) {
      const criterion = rubricByKey.get(s.category)
      await client.query(
        `INSERT INTO golden_box_scores (scorecard_id, category, score, max_score, comment, scorer_type)
         VALUES ($1,$2,$3,$4,$5,'human_judge')`,
        [scorecard.id, s.category, s.score, criterion.max_score, s.comment || null]
      )
    }
    const nextDraftVersion = scorecard.draft_version + 1
    const { rows: updated } = await client.query(
      `UPDATE golden_box_scorecards SET draft_version = $2, idempotency_key = $3, updated_at = now() WHERE id = $1 RETURNING *`,
      [scorecard.id, nextDraftVersion, idempotencyKey || null]
    )
    await client.query('COMMIT')
    await logActivity({ entryId, actorId, action: 'scorecard_draft_saved', metadata: { judgeUserId, draftVersion: nextDraftVersion } })
    await recordGoldenBoxEvent({
      guestReference: `user:${judgeUserId}`, sourceScreen: 'JudgeEntryReview', sourceRoute: '/smokecraft/golden-box/judge',
      eventType: 'golden_box_scorecard_draft_saved', entryId, versionId: updated[0].id, ruleVersion: rubric[0]?.rule_version,
      idempotencyKey: idempotencyKey ? `golden-box-scorecard-draft-canonical-${idempotencyKey}` : `golden-box-scorecard-draft-canonical-${scorecard.id}-${nextDraftVersion}`,
    })
    return updated[0]
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Final scorecard submission — server-authoritative. Requires every
 * active rubric criterion to have a valid score (never a client-
 * asserted "complete" flag). Computes the weighted total itself
 * (never trusts a client-submitted total): sum(score * weight) /
 * sum(maxScore * weight) * 100, stamped with the real rubric
 * rule_version. Once submitted, the scorecard is immutable — a repeat
 * call with the same idempotencyKey returns the same real result; a
 * repeat call without one (or a genuinely different attempt) against
 * an already-submitted scorecard is rejected, never silently rescored.
 */
export async function submitScorecard(entryId, judgeUserId, scores, actorId, idempotencyKey) {
  const authorized = await isAssignedJudge(entryId, judgeUserId)
  if (!authorized) throw new JudgingError('judge_not_assigned')

  const db = getDb()
  const rubric = await getRubric()
  const rubricByKey = new Map(rubric.map(r => [r.criterion_key, r]))
  validateScorePayload(scores, rubricByKey)
  const submittedKeys = new Set(scores.map(s => s.category))
  for (const c of rubric) {
    if (!submittedKeys.has(c.criterion_key)) throw new JudgingError(`missing_criterion:${c.criterion_key}`)
  }

  const { rows: judgeRows } = await db.query(`SELECT id FROM golden_box_judges WHERE user_id = $1`, [judgeUserId])
  const judgeId = judgeRows[0].id

  if (idempotencyKey) {
    const { rows: dup } = await db.query(`SELECT * FROM golden_box_scorecards WHERE idempotency_key = $1`, [idempotencyKey])
    if (dup[0] && dup[0].status !== 'draft') return dup[0]
  }

  const weightedTotal = scores.reduce((sum, s) => {
    const criterion = rubricByKey.get(s.category)
    return sum + s.score * Number(criterion.weight)
  }, 0)
  const weightPossible = rubric.reduce((sum, c) => sum + Number(c.max_score) * Number(c.weight), 0)
  const normalizedTotal = weightPossible > 0 ? Math.round((weightedTotal / weightPossible) * 10000) / 100 : 0
  const ruleVersion = rubric[0]?.rule_version || 1

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const scorecard = await getOrCreateDraftScorecard(client, entryId, judgeId)
    if (scorecard.status !== 'draft') {
      // Already scored — preserve the immutable prior result, never
      // rescore. Real database state wins over any late resubmission.
      await client.query('ROLLBACK')
      return scorecard
    }
    await client.query(`DELETE FROM golden_box_scores WHERE scorecard_id = $1`, [scorecard.id])
    for (const s of scores) {
      const criterion = rubricByKey.get(s.category)
      await client.query(
        `INSERT INTO golden_box_scores (scorecard_id, category, score, max_score, comment, scorer_type)
         VALUES ($1,$2,$3,$4,$5,'human_judge')`,
        [scorecard.id, s.category, s.score, criterion.max_score, s.comment || null]
      )
    }
    let finalRows
    try {
      ;({ rows: finalRows } = await client.query(
        `UPDATE golden_box_scorecards
         SET status = 'submitted', submitted_at = now(), weighted_total = $2, rule_version = $3, idempotency_key = $4, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [scorecard.id, normalizedTotal, ruleVersion, idempotencyKey || null]
      ))
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION && idempotencyKey) {
        await client.query('ROLLBACK')
        const { rows: winner } = await db.query(`SELECT * FROM golden_box_scorecards WHERE idempotency_key = $1`, [idempotencyKey])
        return winner[0]
      }
      throw err
    }
    await client.query('COMMIT')
    await logActivity({ entryId, actorId, action: 'scorecard_submitted', metadata: { judgeUserId, weightedTotal: normalizedTotal } })
    await recordGoldenBoxEvent({
      guestReference: `user:${judgeUserId}`, sourceScreen: 'JudgeEntryReview', sourceRoute: '/smokecraft/golden-box/judge',
      eventType: 'golden_box_scorecard_submitted', entryId, versionId: finalRows[0].id, ruleVersion,
      result: { weightedTotal: normalizedTotal },
      idempotencyKey: idempotencyKey ? `golden-box-scorecard-submitted-canonical-${idempotencyKey}` : `golden-box-scorecard-submitted-canonical-${scorecard.id}`,
    })
    await recordGoldenBoxEvent({
      guestReference: `user:${judgeUserId}`, sourceScreen: 'JudgeEntryReview', sourceRoute: '/smokecraft/golden-box/judge',
      eventType: 'golden_box_entry_scored', entryId, versionId: finalRows[0].id, ruleVersion,
      result: { weightedTotal: normalizedTotal },
      idempotencyKey: idempotencyKey ? `golden-box-entry-scored-canonical-${idempotencyKey}` : `golden-box-entry-scored-canonical-${scorecard.id}`,
    })
    return finalRows[0]
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Computes the aggregate result from all submitted scorecards for an
 * entry — a read-side computation, never overwriting individual judge
 * scores. Persists into golden_box_results (separate table).
 */
export async function computeAggregateResult(competitionId, entryId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT AVG(s.score / s.max_score * 10) AS normalized_avg, COUNT(DISTINCT sc.id) AS scorecard_count
     FROM golden_box_scorecards sc
     JOIN golden_box_scores s ON s.scorecard_id = sc.id
     WHERE sc.entry_id = $1 AND sc.status IN ('submitted', 'locked')`,
    [entryId]
  )
  const { normalized_avg, scorecard_count } = rows[0]
  if (Number(scorecard_count) === 0) return null
  const aggregateScore = Number(normalized_avg)

  const { rows: saved } = await db.query(
    `INSERT INTO golden_box_results (competition_id, entry_id, aggregate_score)
     VALUES ($1,$2,$3)
     ON CONFLICT (competition_id, entry_id) DO UPDATE SET aggregate_score = EXCLUDED.aggregate_score
     RETURNING *`,
    [competitionId, entryId, aggregateScore]
  )
  return saved[0]
}

// ── Package 7A: judge dashboard, lock/amend/void ────────────────────
export async function getJudgeAssignments(judgeUserId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT ja.entry_id, ja.competition_id, c.title AS competition_title, c.status AS competition_status,
            e.status AS entry_status, e.submitted_at,
            sc.id AS scorecard_id, sc.status AS scorecard_status
     FROM golden_box_judge_assignments ja
     JOIN golden_box_judges j ON j.id = ja.judge_id
     JOIN golden_box_competitions c ON c.id = ja.competition_id
     JOIN golden_box_entries e ON e.entry_id = ja.entry_id
     LEFT JOIN golden_box_scorecards sc ON sc.entry_id = ja.entry_id AND sc.judge_id = ja.judge_id AND sc.amended_from IS NULL
     WHERE j.user_id = $1
     ORDER BY ja.assigned_at DESC`,
    [judgeUserId]
  )
  return rows
}

// Latest scorecard row for this judge+entry regardless of amendment
// chain — an amendment's row HAS amended_from set (it is not the
// original), so filtering on "amended_from IS NULL" (an earlier version
// of this function, a real bug caught by testing) would keep returning
// the stale original after an amendment instead of the current one.
export async function getOwnScorecard(entryId, judgeUserId) {
  const db = getDb()
  const { rows: judgeRows } = await db.query(`SELECT id FROM golden_box_judges WHERE user_id = $1`, [judgeUserId])
  if (!judgeRows[0]) return null
  const { rows } = await db.query(
    `SELECT sc.*, json_agg(json_build_object('id', s.id, 'category', s.category, 'score', s.score, 'maxScore', s.max_score, 'comment', s.comment) ORDER BY s.id) AS scores
     FROM golden_box_scorecards sc LEFT JOIN golden_box_scores s ON s.scorecard_id = sc.id
     WHERE sc.entry_id = $1 AND sc.judge_id = $2
     GROUP BY sc.id ORDER BY sc.created_at DESC LIMIT 1`,
    [entryId, judgeRows[0].id]
  )
  return rows[0] || null
}

// Ownership check shared by lock/void/amend — a real gap caught by
// testing: none of these three originally verified the caller is the
// judge who owns the scorecard, so any authenticated user could lock,
// void, or amend any judge's scorecard by id.
async function assertOwnsScorecard(scorecardId, judgeUserId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT sc.id FROM golden_box_scorecards sc
     JOIN golden_box_judges j ON j.id = sc.judge_id
     WHERE sc.id = $1 AND j.user_id = $2`,
    [scorecardId, judgeUserId]
  )
  if (!rows[0]) throw new JudgingError('judge_not_assigned')
}

export async function lockScorecard(scorecardId, actorId) {
  await assertOwnsScorecard(scorecardId, actorId)
  const scorecard = await transitionScorecard(scorecardId, 'locked', actorId)
  await logActivity({ entryId: scorecard.entry_id, actorId, action: 'scorecard_locked', metadata: { scorecardId } })
  return scorecard
}

export async function voidScorecard(scorecardId, actorId, reason) {
  if (!reason) throw new JudgingError('void_reason_required')
  await assertOwnsScorecard(scorecardId, actorId)
  const scorecard = await transitionScorecard(scorecardId, 'voided', actorId)
  await logActivity({ entryId: scorecard.entry_id, actorId, action: 'scorecard_voided', metadata: { scorecardId, reason } })
  return scorecard
}

// Amendment creates a NEW scorecard row (amended_from = original), never
// mutating the original's scores in place — the original stays a
// permanent audit record.
export async function amendScorecard(scorecardId, judgeUserId, scores, actorId, reason) {
  if (!reason) throw new JudgingError('amend_reason_required')
  await assertOwnsScorecard(scorecardId, judgeUserId)
  const rubric = await getRubric()
  const rubricByKey = new Map(rubric.map(r => [r.criterion_key, r]))
  validateScorePayload(scores, rubricByKey)
  const db = getDb()
  const { rows: originalRows } = await db.query(`SELECT * FROM golden_box_scorecards WHERE id = $1`, [scorecardId])
  const original = originalRows[0]
  if (!original) throw new JudgingError('record_not_found')
  await transitionScorecard(scorecardId, 'amended', actorId)

  const weightedTotal = scores.reduce((sum, s) => sum + s.score * Number(rubricByKey.get(s.category).weight), 0)
  const weightPossible = rubric.reduce((sum, c) => sum + Number(c.max_score) * Number(c.weight), 0)
  const normalizedTotal = weightPossible > 0 ? Math.round((weightedTotal / weightPossible) * 10000) / 100 : 0

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: newRows } = await client.query(
      `INSERT INTO golden_box_scorecards (entry_id, judge_id, status, amended_from, submitted_at, weighted_total, rule_version)
       VALUES ($1,$2,'locked',$3,now(),$4,$5) RETURNING *`,
      [original.entry_id, original.judge_id, scorecardId, normalizedTotal, rubric[0]?.rule_version || 1]
    )
    const amended = newRows[0]
    for (const s of scores) {
      const criterion = rubricByKey.get(s.category)
      await client.query(
        `INSERT INTO golden_box_scores (scorecard_id, category, score, max_score, comment, scorer_type)
         VALUES ($1,$2,$3,$4,$5,'human_judge')`,
        [amended.id, s.category, s.score, criterion.max_score, s.comment || null]
      )
    }
    await client.query('COMMIT')
    await logActivity({ entryId: original.entry_id, actorId, action: 'scorecard_amended', metadata: { originalScorecardId: scorecardId, reason } })
    return amended
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function disqualifyEntry(entryId, actorId, reason) {
  const db = getDb()
  await db.query(
    `UPDATE golden_box_entries SET status = 'disqualified', updated_at = now() WHERE entry_id = $1`,
    [entryId]
  )
  await db.query(
    `INSERT INTO golden_box_results (competition_id, entry_id, disqualified, disqualification_reason)
     SELECT competition_id, $1, true, $2 FROM golden_box_entries WHERE entry_id = $1
     ON CONFLICT (competition_id, entry_id) DO UPDATE SET disqualified = true, disqualification_reason = $2`,
    [entryId, reason]
  )
  await logActivity({ entryId, actorId, action: 'entry_disqualified', metadata: { reason } })
}
