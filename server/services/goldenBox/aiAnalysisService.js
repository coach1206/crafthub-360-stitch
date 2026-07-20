/**
 * Package 1 — AI educational analysis (Step 11, Decision 3). Structurally
 * separate from golden_box_scores by construction: this table has no
 * FK/path into scoring — AI output cannot become an official score.
 * No external AI provider is configured in this environment; every
 * analysis is honestly recorded as `not_configured` rather than a
 * fabricated `completed` result.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'

const ANALYSIS_TYPES = new Set([
  'educational_feedback', 'blend_balance', 'flavor_comparison', 'completeness_check',
  'rule_validation', 'consistency_analysis', 'mentor_commentary',
  'improvement_suggestions', 'judging_anomaly_flag',
])

export class AiAnalysisError extends Error {
  constructor(code) { super(code); this.code = code }
}

const AI_PROVIDER_CONFIGURED = !!process.env.GOLDEN_BOX_AI_PROVIDER

export async function requestAnalysis(entryId, analysisType, actorId) {
  if (!ANALYSIS_TYPES.has(analysisType)) throw new AiAnalysisError('invalid_analysis_type')
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO golden_box_ai_analyses (entry_id, analysis_type, status)
     VALUES ($1,$2,$3) RETURNING *`,
    [entryId, analysisType, AI_PROVIDER_CONFIGURED ? 'queued' : 'not_configured']
  )
  await logActivity({ entryId, actorId, action: 'ai_analysis_requested', metadata: { analysisType, configured: AI_PROVIDER_CONFIGURED } })
  return rows[0]
}

export async function listAnalyses(entryId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM golden_box_ai_analyses WHERE entry_id = $1 ORDER BY created_at DESC`,
    [entryId]
  )
  return rows
}

export async function markReviewed(analysisId, status, actorId) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE golden_box_ai_analyses SET human_review_status = $2 WHERE id = $1 RETURNING *`,
    [analysisId, status]
  )
  await logActivity({ actorId, action: 'ai_analysis_reviewed', metadata: { analysisId, status } })
  return rows[0]
}
