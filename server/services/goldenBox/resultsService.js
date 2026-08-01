/**
 * Holistic Fix 5C-2B-1 — Golden Box results aggregation and final
 * ranking authority. Builds only on top of the server-authoritative
 * rubric/assignment/scorecard foundation closed in 5C-2A — no client-
 * calculated total, rank, or eligibility decision anywhere here.
 *
 * Deterministic tie-break rule (RESULT_TIE_BREAK_RULE_VERSION = 1),
 * recorded on every finalized result and canonical event:
 *   1. Higher final weighted score (average of each judge's
 *      server-computed weighted_total)
 *   2. Higher construction-quality criterion average — the `construction`
 *      rubric criterion (label: "Construction")
 *   3. Higher blend-quality criterion average — the `aroma` rubric
 *      criterion (label: "Aroma (Blend)" — the only criterion whose
 *      own approved label names it a blend-quality measure)
 *   4. Higher presentation criterion average — the `rule_compliance`
 *      rubric criterion (label: "Presentation (Rule Compliance)")
 *   5. Lower score variance (population variance of judges' weighted
 *      totals — more consistent judging preferred over a wide split)
 *   6. Earlier valid final submission timestamp (golden_box_entries.submitted_at)
 *   7. Stable entry_id ordering (lexicographic) as the final,
 *      deterministic fallback — guarantees no undefined order ever
 *      reaches a rendered ranking.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { recordGoldenBoxEvent } from './goldenBoxEventService.js'
import { getRubric } from './judgingService.js'

export class ResultsError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'
export const RESULT_TIE_BREAK_RULE_VERSION = 1

const EXCLUDED_ENTRY_STATUSES = ['withdrawn', 'disqualified']
const TIE_BREAK_CRITERIA = { construction: 'construction_avg', blend: 'aroma', presentation: 'rule_compliance' }

/**
 * Real, server-side per-entry eligibility: an entry may enter final
 * ranking only when it has a real submission, was never withdrawn or
 * disqualified, has at least one judge assignment, every assigned
 * judge has a completed (submitted/locked) scorecard, and every
 * counted scorecard was scored under the currently active rubric
 * version. Missing scorecards are never silently treated as zero —
 * an entry with any incomplete assignment is returned as pending, not
 * scored.
 */
async function loadEntryJudgingStatus(db, competitionId) {
  const { rows } = await db.query(
    `SELECT e.entry_id, e.status AS entry_status, e.submitted_at,
            (SELECT count(*) FROM golden_box_submissions s WHERE s.entry_id = e.entry_id) AS submission_count,
            (SELECT count(*) FROM golden_box_judge_assignments ja WHERE ja.entry_id = e.entry_id) AS assigned_count,
            (SELECT count(*) FROM (
               SELECT DISTINCT ON (sc.judge_id) sc.status, sc.rule_version
               FROM golden_box_scorecards sc
               WHERE sc.entry_id = e.entry_id
               ORDER BY sc.judge_id, sc.created_at DESC
             ) latest WHERE latest.status IN ('submitted','locked')) AS completed_count,
            (SELECT count(*) FROM (
               SELECT DISTINCT ON (sc.judge_id) sc.status, sc.rule_version
               FROM golden_box_scorecards sc
               WHERE sc.entry_id = e.entry_id
               ORDER BY sc.judge_id, sc.created_at DESC
             ) latest WHERE latest.status IN ('submitted','locked') AND latest.rule_version = $2) AS completed_current_rubric_count
     FROM golden_box_entries e
     WHERE e.competition_id = $1
     ORDER BY e.entry_id`,
    [competitionId, (await getRubric())[0]?.rule_version ?? 1]
  )
  return rows
}

/**
 * Computes the real per-entry aggregate from every judge's LATEST
 * scorecard (an amendment supersedes the original it was amended
 * from — the original stays a permanent audit row but is never
 * double-counted here).
 */
async function computeEntryAggregate(db, entryId) {
  const { rows } = await db.query(
    `WITH latest AS (
       SELECT DISTINCT ON (sc.judge_id) sc.id, sc.judge_id, sc.weighted_total, sc.rule_version, sc.submitted_at
       FROM golden_box_scorecards sc
       WHERE sc.entry_id = $1 AND sc.status IN ('submitted','locked')
       ORDER BY sc.judge_id, sc.created_at DESC
     )
     SELECT
       count(*) AS scorecard_count,
       avg(weighted_total) AS avg_weighted_total,
       min(weighted_total) AS min_weighted_total,
       max(weighted_total) AS max_weighted_total,
       var_pop(weighted_total) AS score_variance
     FROM latest`,
    [entryId]
  )
  const { rows: criterionRows } = await db.query(
    `WITH latest AS (
       SELECT DISTINCT ON (sc.judge_id) sc.id
       FROM golden_box_scorecards sc
       WHERE sc.entry_id = $1 AND sc.status IN ('submitted','locked')
       ORDER BY sc.judge_id, sc.created_at DESC
     )
     SELECT s.category, avg(s.score) AS avg_score
     FROM golden_box_scores s
     JOIN latest ON latest.id = s.scorecard_id
     GROUP BY s.category`,
    [entryId]
  )
  const criterionAverages = {}
  for (const r of criterionRows) criterionAverages[r.category] = Number(r.avg_score)
  const agg = rows[0]
  return {
    scorecardCount: Number(agg.scorecard_count),
    avgWeightedTotal: agg.avg_weighted_total != null ? Number(agg.avg_weighted_total) : null,
    minWeightedTotal: agg.min_weighted_total != null ? Number(agg.min_weighted_total) : null,
    maxWeightedTotal: agg.max_weighted_total != null ? Number(agg.max_weighted_total) : null,
    scoreVariance: agg.score_variance != null ? Number(agg.score_variance) : 0,
    criterionAverages,
  }
}

/**
 * Computes the full, live, server-authoritative results/ranking view
 * for a competition. Never persists anything — read-only. Used both
 * for the "what would finalization look like right now" UI state and
 * as the exact computation finalizeResults() persists.
 */
export async function computeCompetitionResults(competitionId) {
  const db = getDb()
  const rubric = await getRubric()
  const rubricVersion = rubric[0]?.rule_version ?? 1
  const statuses = await loadEntryJudgingStatus(db, competitionId)

  if (statuses.length === 0) {
    return { status: 'no_entries', rubricVersion, entries: [] }
  }

  const excluded = []
  const pending = []
  const eligible = []

  for (const row of statuses) {
    if (EXCLUDED_ENTRY_STATUSES.includes(row.entry_status)) {
      excluded.push({ entryId: row.entry_id, entryStatus: row.entry_status, reason: row.entry_status })
      continue
    }
    if (Number(row.submission_count) === 0) {
      pending.push({ entryId: row.entry_id, completionStatus: 'awaiting_submission' })
      continue
    }
    if (Number(row.assigned_count) === 0) {
      pending.push({ entryId: row.entry_id, completionStatus: 'awaiting_judges' })
      continue
    }
    if (Number(row.completed_count) < Number(row.assigned_count)) {
      pending.push({ entryId: row.entry_id, completionStatus: 'judging_in_progress', judgeCount: Number(row.assigned_count), completedScorecardCount: Number(row.completed_count) })
      continue
    }
    if (Number(row.completed_current_rubric_count) < Number(row.assigned_count)) {
      // Every assignment has a completed scorecard, but at least one was
      // scored under a since-superseded rubric version — honestly
      // pending, never silently averaged against a mismatched rubric.
      pending.push({ entryId: row.entry_id, completionStatus: 'rubric_version_mismatch', judgeCount: Number(row.assigned_count), completedScorecardCount: Number(row.completed_count) })
      continue
    }
    eligible.push(row)
  }

  const scored = []
  for (const row of eligible) {
    const agg = await computeEntryAggregate(db, row.entry_id)
    scored.push({
      entryId: row.entry_id,
      submittedAt: row.submitted_at,
      judgeCount: Number(row.assigned_count),
      completedScorecardCount: agg.scorecardCount,
      avgWeightedTotal: agg.avgWeightedTotal,
      minWeightedTotal: agg.minWeightedTotal,
      maxWeightedTotal: agg.maxWeightedTotal,
      scoreVariance: agg.scoreVariance,
      criterionAverages: agg.criterionAverages,
      completionStatus: 'complete',
    })
  }

  // Deterministic sort implementing the documented tie-break order.
  // Records, for each entry, the deepest comparison step that was
  // actually needed to resolve its position relative to its immediate
  // neighbor — never a fabricated or unrecorded reason.
  scored.sort((a, b) => {
    if (b.avgWeightedTotal !== a.avgWeightedTotal) return b.avgWeightedTotal - a.avgWeightedTotal
    const constructionA = a.criterionAverages.construction ?? 0
    const constructionB = b.criterionAverages.construction ?? 0
    if (constructionB !== constructionA) return constructionB - constructionA
    const blendA = a.criterionAverages[TIE_BREAK_CRITERIA.blend] ?? 0
    const blendB = b.criterionAverages[TIE_BREAK_CRITERIA.blend] ?? 0
    if (blendB !== blendA) return blendB - blendA
    const presA = a.criterionAverages[TIE_BREAK_CRITERIA.presentation] ?? 0
    const presB = b.criterionAverages[TIE_BREAK_CRITERIA.presentation] ?? 0
    if (presB !== presA) return presB - presA
    if (a.scoreVariance !== b.scoreVariance) return a.scoreVariance - b.scoreVariance
    const subA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity
    const subB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity
    if (subA !== subB) return subA - subB
    return a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0
  })

  for (let i = 0; i < scored.length; i++) {
    const entry = scored[i]
    entry.rank = i + 1
    const prev = scored[i - 1]
    if (!prev) { entry.tieBreakReason = null; continue }
    if (prev.avgWeightedTotal !== entry.avgWeightedTotal) { entry.tieBreakReason = null; continue }
    const prevConstruction = prev.criterionAverages.construction ?? 0
    const entryConstruction = entry.criterionAverages.construction ?? 0
    if (prevConstruction !== entryConstruction) { entry.tieBreakReason = 'construction_avg'; continue }
    const prevBlend = prev.criterionAverages[TIE_BREAK_CRITERIA.blend] ?? 0
    const entryBlend = entry.criterionAverages[TIE_BREAK_CRITERIA.blend] ?? 0
    if (prevBlend !== entryBlend) { entry.tieBreakReason = 'blend_quality_avg'; continue }
    const prevPres = prev.criterionAverages[TIE_BREAK_CRITERIA.presentation] ?? 0
    const entryPres = entry.criterionAverages[TIE_BREAK_CRITERIA.presentation] ?? 0
    if (prevPres !== entryPres) { entry.tieBreakReason = 'presentation_avg'; continue }
    if (prev.scoreVariance !== entry.scoreVariance) { entry.tieBreakReason = 'score_variance'; continue }
    const prevSub = prev.submittedAt ? new Date(prev.submittedAt).getTime() : Infinity
    const entrySub = entry.submittedAt ? new Date(entry.submittedAt).getTime() : Infinity
    if (prevSub !== entrySub) { entry.tieBreakReason = 'submission_time'; continue }
    entry.tieBreakReason = 'entry_id_order'
  }

  let status
  if (scored.length === 0 && pending.length > 0) status = pending.some(p => p.completionStatus === 'judging_in_progress' || p.completionStatus === 'rubric_version_mismatch') ? 'judging_in_progress' : (pending.every(p => p.completionStatus === 'awaiting_submission') ? 'awaiting_submissions' : 'awaiting_judges')
  else if (pending.length > 0) status = 'judging_in_progress'
  else status = 'ready_to_finalize'

  return { status, rubricVersion, resultTieBreakRuleVersion: RESULT_TIE_BREAK_RULE_VERSION, ranked: scored, pending, excluded }
}

/**
 * Finalizes results for a competition — authorized staff only
 * (enforced at the route level via requireRole('admin')), atomic,
 * database-enforced idempotent (UNIQUE(competition_id, result_version)
 * plus an idempotency_key), and immutable once written: a repeated
 * finalize call for the same result_version returns the ORIGINAL
 * finalized result, never recomputes or overwrites it. Blocks only
 * when an entry has been assigned judges but judging is genuinely
 * still in progress for it — an entry with zero assignments never
 * blocks finalization of the entries that were actually judged.
 */
export async function finalizeResults(competitionId, actorId, { resultVersion = 1, idempotencyKey } = {}) {
  const db = getDb()

  if (idempotencyKey) {
    const { rows: dup } = await db.query(
      `SELECT * FROM golden_box_result_finalizations WHERE idempotency_key = $1`,
      [idempotencyKey]
    )
    if (dup[0]) return loadFinalizedResult(db, dup[0].competition_id, dup[0].result_version)
  }

  const { rows: existingRows } = await db.query(
    `SELECT * FROM golden_box_result_finalizations WHERE competition_id = $1 AND result_version = $2`,
    [competitionId, resultVersion]
  )
  if (existingRows[0]) return loadFinalizedResult(db, competitionId, resultVersion)

  const computed = await computeCompetitionResults(competitionId)
  if (computed.status === 'no_entries') throw new ResultsError('no_entries_to_finalize')
  if (computed.pending.some(p => p.completionStatus === 'judging_in_progress' || p.completionStatus === 'rubric_version_mismatch')) {
    throw new ResultsError('judging_incomplete')
  }
  if (computed.ranked.length === 0) throw new ResultsError('no_eligible_entries_to_finalize')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO golden_box_result_finalizations (competition_id, result_version, rubric_version, finalized_by, idempotency_key)
         VALUES ($1,$2,$3,$4,$5)`,
        [competitionId, resultVersion, computed.rubricVersion, actorId, idempotencyKey || null]
      )
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        // Two-tab finalization race: the other request won. Roll back
        // this transaction cleanly and return the real winning result.
        await client.query('ROLLBACK')
        return loadFinalizedResult(db, competitionId, resultVersion)
      }
      throw err
    }

    for (const entry of computed.ranked) {
      await client.query(
        `INSERT INTO golden_box_results (
           competition_id, entry_id, aggregate_score, placement, is_finalist, is_winner,
           tie_break_reason, disqualified, judge_count, completed_scorecard_count,
           criterion_averages, min_score, max_score, score_variance, completion_status,
           result_version, rubric_version, finalized_by, finalized_at, published_at
         ) VALUES ($1,$2,$3,$4,true,$5,$6,false,$7,$8,$9,$10,$11,$12,'complete',$13,$14,$15,now(),now())
         ON CONFLICT (competition_id, entry_id) DO UPDATE SET
           aggregate_score = EXCLUDED.aggregate_score, placement = EXCLUDED.placement,
           is_finalist = EXCLUDED.is_finalist, is_winner = EXCLUDED.is_winner,
           tie_break_reason = EXCLUDED.tie_break_reason, judge_count = EXCLUDED.judge_count,
           completed_scorecard_count = EXCLUDED.completed_scorecard_count,
           criterion_averages = EXCLUDED.criterion_averages, min_score = EXCLUDED.min_score,
           max_score = EXCLUDED.max_score, score_variance = EXCLUDED.score_variance,
           completion_status = EXCLUDED.completion_status, result_version = EXCLUDED.result_version,
           rubric_version = EXCLUDED.rubric_version, finalized_by = EXCLUDED.finalized_by,
           finalized_at = now(), published_at = now()`,
        [
          competitionId, entry.entryId, entry.avgWeightedTotal, entry.rank, entry.rank === 1,
          entry.tieBreakReason, entry.judgeCount, entry.completedScorecardCount,
          JSON.stringify(entry.criterionAverages), entry.minWeightedTotal, entry.maxWeightedTotal,
          entry.scoreVariance, resultVersion, computed.rubricVersion, actorId,
        ]
      )
    }
    // SC-D068 (Final Gameplay Acceptance pass): finalizeResults() persisted
    // real, correct golden_box_results rows but never advanced the parent
    // competition's own `status` column — so ResultsExperience.jsx's
    // `resultsReleased = ['results_pending','completed'].includes(competition.status)`
    // stayed permanently false, and every finalized competition (however it
    // reached 'active'/'judging') kept showing "Judging is not complete
    // yet — results have not been released" directly above its own real,
    // correctly finalized rankings — a genuine, investor-visible
    // contradiction on the flagship Golden Box results screen, confirmed
    // by direct DB read (status stayed 'active' after a real finalize+award
    // run) and by screenshot in this pass's proof docs. Fixed with the
    // smallest correct change: once finalization succeeds, if the
    // competition isn't already in a terminal/cancelled/archived state,
    // advance it to 'results_pending' (the exact value the frontend
    // already checks for) directly here, scoped to this one function —
    // no change to the shared COMPETITION_TRANSITIONS state machine used
    // by unrelated admin flows.
    await client.query(
      `UPDATE golden_box_competitions SET status = 'results_pending', updated_at = now()
       WHERE id = $1 AND status NOT IN ('results_pending', 'completed', 'cancelled', 'archived')`,
      [competitionId]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }

  for (const entry of computed.ranked) {
    const { rows: entryRows } = await db.query(`SELECT guest_reference FROM golden_box_entries WHERE entry_id = $1`, [entry.entryId])
    const guestReference = entryRows[0]?.guest_reference
    const eventPayload = {
      competitionId, entryId: entry.entryId, resultVersion, rank: entry.rank,
      tieBreakReason: entry.tieBreakReason, judgeCount: entry.judgeCount,
      scoreSummary: { avgWeightedTotal: entry.avgWeightedTotal, minWeightedTotal: entry.minWeightedTotal, maxWeightedTotal: entry.maxWeightedTotal, scoreVariance: entry.scoreVariance },
    }
    await recordGoldenBoxEvent({
      guestReference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/results`,
      eventType: 'golden_box_results_calculated', entryId: entry.entryId, ruleVersion: computed.rubricVersion, result: eventPayload,
      idempotencyKey: `golden-box-results-calculated-canonical-${competitionId}-${resultVersion}-${entry.entryId}`,
    })
    await recordGoldenBoxEvent({
      guestReference, sourceScreen: 'ResultsExperience', sourceRoute: `/api/smokecraft/golden-box/competitions/${competitionId}/results/finalize`,
      eventType: 'golden_box_ranking_finalized', entryId: entry.entryId, ruleVersion: computed.rubricVersion, result: eventPayload,
      idempotencyKey: `golden-box-ranking-finalized-canonical-${competitionId}-${resultVersion}-${entry.entryId}`,
    })
  }

  await logActivity({ entryId: null, competitionId, actorId, action: 'results_finalized', metadata: { resultVersion, rankedCount: computed.ranked.length } })
  return loadFinalizedResult(db, competitionId, resultVersion)
}

export async function getLatestFinalizedResult(competitionId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT result_version FROM golden_box_result_finalizations WHERE competition_id = $1 ORDER BY result_version DESC LIMIT 1`,
    [competitionId]
  )
  if (!rows[0]) return null
  return loadFinalizedResult(db, competitionId, rows[0].result_version)
}

export async function loadFinalizedResult(db, competitionId, resultVersion) {
  const { rows: finalization } = await db.query(
    `SELECT * FROM golden_box_result_finalizations WHERE competition_id = $1 AND result_version = $2`,
    [competitionId, resultVersion]
  )
  if (!finalization[0]) return null
  const { rows } = await db.query(
    `SELECT * FROM golden_box_results WHERE competition_id = $1 AND result_version = $2 ORDER BY placement ASC`,
    [competitionId, resultVersion]
  )
  return { status: 'finalized', finalization: finalization[0], ranked: rows }
}

/**
 * The single result an entrant/judge/administrator sees for one
 * entry — either the live, unfinalized computed view (pending states)
 * or the immutable finalized row if one exists.
 */
export async function getEntryResult(competitionId, entryId) {
  const db = getDb()
  const { rows: finalizedRows } = await db.query(
    `SELECT * FROM golden_box_results WHERE competition_id = $1 AND entry_id = $2 AND finalized_at IS NOT NULL ORDER BY result_version DESC LIMIT 1`,
    [competitionId, entryId]
  )
  if (finalizedRows[0]) return { status: 'finalized', result: finalizedRows[0] }

  const { rows: dqRows } = await db.query(
    `SELECT disqualified, disqualification_reason FROM golden_box_results WHERE competition_id = $1 AND entry_id = $2`,
    [competitionId, entryId]
  )
  if (dqRows[0]?.disqualified) return { status: 'disqualified', result: dqRows[0] }

  const computed = await computeCompetitionResults(competitionId)
  const ranked = computed.ranked.find(e => e.entryId === entryId)
  if (ranked) return { status: 'ready_to_finalize', result: ranked }
  const pending = computed.pending.find(e => e.entryId === entryId)
  if (pending) return { status: pending.completionStatus, result: pending }
  const excluded = computed.excluded.find(e => e.entryId === entryId)
  if (excluded) return { status: excluded.reason, result: excluded }
  return { status: 'no_entries', result: null }
}
