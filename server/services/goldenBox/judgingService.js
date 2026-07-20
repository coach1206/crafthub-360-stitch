/**
 * Package 1 — human judging (Step 10, Decision 3). Official scores are
 * always human_judge scorer_type; AI output never enters this table
 * (see aiAnalysisService.js — structurally separate table, no path in).
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { transitionScorecard } from './lifecycleService.js'

export class JudgingError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function assignJudge(competitionId, entryId, judgeUserId, assignedBy) {
  const db = getDb()
  const { rows: judgeRows } = await db.query(
    `INSERT INTO golden_box_judges (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING *`,
    [judgeUserId]
  )
  const judge = judgeRows[0]
  const { rows } = await db.query(
    `INSERT INTO golden_box_judge_assignments (competition_id, judge_id, entry_id)
     VALUES ($1,$2,$3) ON CONFLICT (judge_id, entry_id) DO NOTHING RETURNING *`,
    [competitionId, judge.id, entryId]
  )
  await logActivity({ entryId, competitionId, actorId: assignedBy, action: 'judge_assigned', metadata: { judgeUserId } })
  return rows[0] || { judge_id: judge.id, entry_id: entryId, alreadyAssigned: true }
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

const VALID_CATEGORIES = new Set([
  'construction', 'draw', 'burn', 'aroma', 'flavor', 'balance', 'complexity',
  'progression', 'finish', 'creativity', 'rule_compliance', 'overall_impression',
])

export async function submitScorecard(entryId, judgeUserId, scores, actorId) {
  const db = getDb()
  const authorized = await isAssignedJudge(entryId, judgeUserId)
  if (!authorized) throw new JudgingError('judge_not_assigned')
  for (const s of scores) {
    if (!VALID_CATEGORIES.has(s.category)) throw new JudgingError(`invalid_category:${s.category}`)
    const max = s.maxScore ?? 10
    if (typeof s.score !== 'number' || s.score < 0 || s.score > max) throw new JudgingError(`invalid_score:${s.category}`)
  }
  const { rows: judgeRows } = await db.query(`SELECT id FROM golden_box_judges WHERE user_id = $1`, [judgeUserId])
  const judgeId = judgeRows[0].id

  const { rows: existing } = await db.query(
    `SELECT * FROM golden_box_scorecards WHERE entry_id = $1 AND judge_id = $2 AND amended_from IS NULL`,
    [entryId, judgeId]
  )
  if (existing[0] && existing[0].status !== 'draft') throw new JudgingError('scorecard_already_submitted')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    let scorecard
    if (existing[0]) {
      scorecard = existing[0]
    } else {
      const { rows } = await client.query(
        `INSERT INTO golden_box_scorecards (entry_id, judge_id) VALUES ($1,$2) RETURNING *`,
        [entryId, judgeId]
      )
      scorecard = rows[0]
    }
    for (const s of scores) {
      await client.query(
        `INSERT INTO golden_box_scores (scorecard_id, category, score, max_score, comment, scorer_type)
         VALUES ($1,$2,$3,$4,$5,'human_judge')`,
        [scorecard.id, s.category, s.score, s.maxScore ?? 10, s.comment || null]
      )
    }
    await client.query(`UPDATE golden_box_scorecards SET status = 'submitted', submitted_at = now() WHERE id = $1`, [scorecard.id])
    await client.query('COMMIT')
    await logActivity({ entryId, actorId, action: 'scorecard_submitted', metadata: { judgeUserId } })
    return scorecard
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
  for (const s of scores) {
    if (!VALID_CATEGORIES.has(s.category)) throw new JudgingError(`invalid_category:${s.category}`)
    const max = s.maxScore ?? 10
    if (typeof s.score !== 'number' || s.score < 0 || s.score > max) throw new JudgingError(`invalid_score:${s.category}`)
  }
  const db = getDb()
  const { rows: originalRows } = await db.query(`SELECT * FROM golden_box_scorecards WHERE id = $1`, [scorecardId])
  const original = originalRows[0]
  if (!original) throw new JudgingError('record_not_found')
  await transitionScorecard(scorecardId, 'amended', actorId)

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: newRows } = await client.query(
      `INSERT INTO golden_box_scorecards (entry_id, judge_id, status, amended_from, submitted_at)
       VALUES ($1,$2,'locked',$3,now()) RETURNING *`,
      [original.entry_id, original.judge_id, scorecardId]
    )
    const amended = newRows[0]
    for (const s of scores) {
      await client.query(
        `INSERT INTO golden_box_scores (scorecard_id, category, score, max_score, comment, scorer_type)
         VALUES ($1,$2,$3,$4,$5,'human_judge')`,
        [amended.id, s.category, s.score, s.maxScore ?? 10, s.comment || null]
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
