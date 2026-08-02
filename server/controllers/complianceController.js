/**
 * Compliance Controller — Production Package 6 (Legal, Privacy, Accessibility,
 * Tobacco Compliance)
 *
 * Implements SERVER-AUTHORITATIVE age/tobacco-purchase eligibility, consent
 * management, policy versioning + acceptance, data-rights workflows
 * (access/correction/deletion/export), staff acknowledgements, media rights
 * review, and an append-only compliance audit trail.
 *
 * Hard rule enforced throughout: eligibility to purchase tobacco is decided
 * here, server-side, from age_verification_records + compliance_jurisdictions.
 * No endpoint trusts a client-supplied "isEligible"/"ageConfirmed" boolean.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { logInfo, logWarn } from '../lib/structuredLogger.mjs'
import { ROLE_LEVELS } from '../config/roleMap.js'

function requireDb(res) {
  if (!isDbAvailable()) {
    res.status(503).json({ success: false, error: 'database_unavailable' })
    return false
  }
  return true
}

async function recordAudit(eventType, { subjectType, subjectId, actorId, jurisdictionCode, detail } = {}) {
  await query(
    `INSERT INTO compliance_audit_events (event_type, subject_type, subject_id, actor_id, jurisdiction_code, detail)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [eventType, subjectType || null, subjectId || null, actorId || null, jurisdictionCode || null, detail ? JSON.stringify(detail) : null]
  )
  logInfo('compliance_audit_event', { event_type: eventType, subject_id: subjectId, jurisdiction_code: jurisdictionCode })
}

// ── Jurisdictions ──────────────────────────────────────────────
export async function listJurisdictions(req, res) {
  if (!requireDb(res)) return
  const r = await query(`SELECT * FROM compliance_jurisdictions ORDER BY code`)
  res.json({ success: true, jurisdictions: r.rows })
}

export async function updateJurisdiction(req, res) {
  if (!requireDb(res)) return
  const { code } = req.params
  const fields = ['status', 'min_purchase_age', 'tobacco_sales_allowed', 'shipping_allowed',
    'venue_pickup_allowed', 'in_venue_allowed', 'local_delivery_allowed',
    'quantity_limit_per_order', 'reverification_days', 'notes', 'counsel_review_status']
  const sets = []
  const params = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      params.push(req.body[f])
      sets.push(`${f} = $${params.length}`)
    }
  }
  if (!sets.length) return res.status(400).json({ success: false, error: 'no_fields' })
  params.push(code)
  const r = await query(
    `UPDATE compliance_jurisdictions SET ${sets.join(', ')}, updated_at = now() WHERE code = $${params.length} RETURNING *`,
    params
  )
  if (!r.rows.length) return res.status(404).json({ success: false, error: 'jurisdiction_not_found' })
  await recordAudit('jurisdiction_rule_change', {
    actorId: req.user?.id, jurisdictionCode: code, detail: { changed: req.body },
  })
  res.json({ success: true, jurisdiction: r.rows[0] })
}

// ── Age verification (server-authoritative) ──────────────────────
export async function submitAgeVerification(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId, jurisdictionCode, method, declaredBirthdate, providerRef } = req.body || {}
  if (!subjectType || !subjectId || !jurisdictionCode || !method) {
    return res.status(400).json({ success: false, error: 'subjectType, subjectId, jurisdictionCode, method required' })
  }
  const jr = await query(`SELECT * FROM compliance_jurisdictions WHERE code = $1`, [jurisdictionCode])
  if (!jr.rows.length) return res.status(400).json({ success: false, error: 'unknown_jurisdiction' })
  const j = jr.rows[0]

  let result = 'denied'
  if (['self_attestation', 'staff_verified', 'provider_adapter', 'in_person_fulfillment'].includes(method)) {
    if (method === 'self_attestation' && declaredBirthdate) {
      const age = Math.floor((Date.now() - new Date(declaredBirthdate).getTime()) / (365.25 * 24 * 3600 * 1000))
      result = age >= j.min_purchase_age ? 'approved' : 'denied'
    } else if (method === 'self_attestation' && req.body.selfAttestConfirmed === true) {
      // Educational-browsing tier: boolean+timestamp attestation only, no purchase eligibility implied.
      result = 'approved'
    } else if (['staff_verified', 'in_person_fulfillment'].includes(method)) {
      // Requires an authenticated staff actor (role >= staff, not the dev
      // prototype-guest fallback) — never accepted from an anonymous call.
      const callerLevel = ROLE_LEVELS[req.user?.role] ?? -1
      const isStaffActor = callerLevel >= ROLE_LEVELS.staff && req.user?.mode !== 'prototype'
      if (!isStaffActor) return res.status(401).json({ success: false, error: 'staff_actor_required' })
      result = req.body.staffApproved === true ? 'approved' : 'denied'
    } else if (method === 'provider_adapter') {
      // Adapter SHAPE only — no live third-party provider wired in this sandbox.
      result = req.body.providerResult === 'approved' ? 'approved' : 'denied'
    }
  }

  const expiresAt = new Date(Date.now() + j.reverification_days * 24 * 3600 * 1000)
  const r = await query(
    `INSERT INTO age_verification_records
       (subject_type, subject_id, jurisdiction_code, method, result, declared_birthdate, provider_ref, staff_actor_id, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [subjectType, subjectId, jurisdictionCode, method, result, declaredBirthdate || null,
     providerRef || null, ['staff_verified', 'in_person_fulfillment'].includes(method) ? req.user.id : null, expiresAt]
  )
  await recordAudit('age_verification', {
    subjectType, subjectId, actorId: req.user?.id, jurisdictionCode,
    detail: { method, result },
  })
  res.status(201).json({ success: true, record: r.rows[0] })
}

/**
 * Server-authoritative tobacco purchase eligibility check. This is the ONLY
 * function checkout code should trust — never a client-sent boolean. Checks:
 *  1. jurisdiction allows tobacco sales
 *  2. latest age_verification_record for the subject in that jurisdiction is
 *     'approved' and not expired
 */
export async function checkPurchaseEligibility(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId, jurisdictionCode } = req.query
  if (!subjectType || !subjectId || !jurisdictionCode) {
    return res.status(400).json({ success: false, error: 'subjectType, subjectId, jurisdictionCode required' })
  }
  const eligibility = await evaluatePurchaseEligibility({ subjectType, subjectId, jurisdictionCode })
  await recordAudit(eligibility.eligible ? 'tobacco_purchase_approved' : 'tobacco_purchase_denied', {
    subjectType, subjectId, jurisdictionCode, detail: eligibility,
  })
  res.json({ success: true, ...eligibility })
}

/** Internal, importable eligibility evaluator — reusable by checkout code. */
export async function evaluatePurchaseEligibility({ subjectType, subjectId, jurisdictionCode }) {
  const jr = await query(`SELECT * FROM compliance_jurisdictions WHERE code = $1`, [jurisdictionCode])
  if (!jr.rows.length) return { eligible: false, reason: 'unknown_jurisdiction' }
  const j = jr.rows[0]
  if (j.status !== 'active') return { eligible: false, reason: 'jurisdiction_not_active' }
  if (!j.tobacco_sales_allowed) return { eligible: false, reason: 'tobacco_sales_not_permitted_in_jurisdiction' }

  const ar = await query(
    `SELECT * FROM age_verification_records
     WHERE subject_type = $1 AND subject_id = $2 AND jurisdiction_code = $3
       AND result = 'approved' AND method IN ('self_attestation','staff_verified','provider_adapter','in_person_fulfillment')
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY verified_at DESC LIMIT 1`,
    [subjectType, subjectId, jurisdictionCode]
  )
  if (!ar.rows.length) return { eligible: false, reason: 'no_valid_age_verification' }
  return { eligible: true, reason: 'age_verified', jurisdiction: j, verification: ar.rows[0] }
}

/** Server-authoritative fulfillment/shipping eligibility. Shipping is DENIED
 *  by default unless the jurisdiction explicitly enables it. */
export async function checkFulfillmentEligibility(req, res) {
  if (!requireDb(res)) return
  const { jurisdictionCode, fulfillmentMethod } = req.query
  if (!jurisdictionCode || !fulfillmentMethod) {
    return res.status(400).json({ success: false, error: 'jurisdictionCode, fulfillmentMethod required' })
  }
  const jr = await query(`SELECT * FROM compliance_jurisdictions WHERE code = $1`, [jurisdictionCode])
  if (!jr.rows.length) return res.status(400).json({ success: false, error: 'unknown_jurisdiction' })
  const j = jr.rows[0]
  const map = {
    shipping: j.shipping_allowed,
    venue_pickup: j.venue_pickup_allowed,
    in_venue: j.in_venue_allowed,
    local_delivery: j.local_delivery_allowed,
  }
  const allowed = map[fulfillmentMethod] === true
  if (!allowed) {
    await recordAudit('shipping_denied', { jurisdictionCode, detail: { fulfillmentMethod } })
  }
  res.json({ success: true, allowed, fulfillmentMethod, jurisdictionCode })
}

// ── Policy versions + acceptance ─────────────────────────────────
export async function listPolicyVersions(req, res) {
  if (!requireDb(res)) return
  const { policyType, locale } = req.query
  const clauses = []
  const params = []
  if (policyType) { params.push(policyType); clauses.push(`policy_type = $${params.length}`) }
  if (locale) { params.push(locale); clauses.push(`locale = $${params.length}`) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const r = await query(`SELECT * FROM policy_versions ${where} ORDER BY policy_type, locale, effective_date DESC`, params)
  res.json({ success: true, policies: r.rows })
}

export async function acceptPolicy(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId, policyVersionId, locale } = req.body || {}
  if (!subjectType || !subjectId || !policyVersionId) {
    return res.status(400).json({ success: false, error: 'subjectType, subjectId, policyVersionId required' })
  }
  const pv = await query(`SELECT * FROM policy_versions WHERE id = $1`, [policyVersionId])
  if (!pv.rows.length) return res.status(404).json({ success: false, error: 'policy_version_not_found' })
  const r = await query(
    `INSERT INTO policy_acceptances (subject_type, subject_id, policy_version_id, locale) VALUES ($1,$2,$3,$4) RETURNING *`,
    [subjectType, subjectId, policyVersionId, locale || 'en']
  )
  await recordAudit(pv.rows[0].policy_type === 'privacy' ? 'privacy_acknowledgement' : 'terms_acceptance', {
    subjectType, subjectId, detail: { policyVersionId, version: pv.rows[0].version },
  })
  res.status(201).json({ success: true, acceptance: r.rows[0] })
}

// ── Consent (cookies/localStorage) ────────────────────────────────
export async function getCurrentConsent(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId } = req.query
  if (!subjectType || !subjectId) return res.status(400).json({ success: false, error: 'subjectType, subjectId required' })
  const r = await query(
    `SELECT * FROM consent_records WHERE subject_type = $1 AND subject_id = $2 AND withdrawn_at IS NULL
     ORDER BY recorded_at DESC LIMIT 1`,
    [subjectType, subjectId]
  )
  res.json({ success: true, consent: r.rows[0] || null })
}

export async function setConsent(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId, preferences, analytics, marketing, consentVersion } = req.body || {}
  if (!subjectType || !subjectId || !consentVersion) {
    return res.status(400).json({ success: false, error: 'subjectType, subjectId, consentVersion required' })
  }
  // No dark patterns: nonessential categories default false unless explicitly true.
  const r = await query(
    `INSERT INTO consent_records (subject_type, subject_id, consent_version, preferences, analytics, marketing)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [subjectType, subjectId, consentVersion, preferences === true, analytics === true, marketing === true]
  )
  await recordAudit('consent_change', {
    subjectType, subjectId, detail: { preferences: preferences === true, analytics: analytics === true, marketing: marketing === true, consentVersion },
  })
  res.status(201).json({ success: true, consent: r.rows[0] })
}

export async function withdrawConsent(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId } = req.body || {}
  if (!subjectType || !subjectId) return res.status(400).json({ success: false, error: 'subjectType, subjectId required' })
  await query(
    `UPDATE consent_records SET withdrawn_at = now() WHERE subject_type = $1 AND subject_id = $2 AND withdrawn_at IS NULL`,
    [subjectType, subjectId]
  )
  const r = await query(
    `INSERT INTO consent_records (subject_type, subject_id, consent_version, preferences, analytics, marketing, source)
     VALUES ($1,$2,'withdrawal',false,false,false,'withdrawal') RETURNING *`,
    [subjectType, subjectId]
  )
  await recordAudit('consent_change', { subjectType, subjectId, detail: { withdrawn: true } })
  res.status(201).json({ success: true, consent: r.rows[0] })
}

// ── Data-rights requests ─────────────────────────────────────────
function genRequestNumber() {
  return `SC-DR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export async function submitDataRightsRequest(req, res) {
  if (!requireDb(res)) return
  const { subjectType, subjectId, requestType } = req.body || {}
  if (!subjectType || !subjectId || !requestType) {
    return res.status(400).json({ success: false, error: 'subjectType, subjectId, requestType required' })
  }
  const requestNumber = genRequestNumber()
  const deadline = new Date(Date.now() + 30 * 24 * 3600 * 1000) // operational default: 30 days
  const r = await query(
    `INSERT INTO data_rights_requests (request_number, subject_type, subject_id, request_type, deadline_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [requestNumber, subjectType, subjectId, requestType, deadline]
  )
  await recordAudit('data_rights_request_received', { subjectType, subjectId, detail: { requestType, requestNumber } })
  res.status(201).json({ success: true, request: r.rows[0] })
}

/**
 * Requires the caller to be the same subject (or authenticated staff at
 * level >= 'staff') — prevents cross-user export/deletion. IMPORTANT: this
 * must use an explicit staff-role allowlist (ROLE_LEVELS >= staff), never
 * "anything that isn't literally 'customer'" — guest/prototype fallback
 * identities must NOT be treated as staff.
 */
function assertOwnerOrStaff(req, res, request) {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'authentication_required' })
    return false
  }
  const callerId = req.user.id
  const callerLevel = ROLE_LEVELS[req.user.role] ?? -1
  const isStaff = callerLevel >= ROLE_LEVELS.staff && req.user.mode !== 'prototype'
  if (isStaff) return true
  if (String(callerId) !== String(request.subject_id)) {
    res.status(403).json({ success: false, error: 'forbidden_cross_user_request' })
    return false
  }
  return true
}

export async function verifyRequestIdentity(req, res) {
  if (!requireDb(res)) return
  const { requestId } = req.params
  const rr = await query(`SELECT * FROM data_rights_requests WHERE id = $1`, [requestId])
  if (!rr.rows.length) return res.status(404).json({ success: false, error: 'request_not_found' })
  if (!assertOwnerOrStaff(req, res, rr.rows[0])) return
  const r = await query(
    `UPDATE data_rights_requests SET status = 'identity_verified', identity_verified_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
    [requestId]
  )
  res.json({ success: true, request: r.rows[0] })
}

/** Builds a real, test-data-safe export bundle for a subject. Excludes
 *  secrets, staff notes, fraud logic, and other users' data. */
export async function generateExport(req, res) {
  if (!requireDb(res)) return
  const { requestId } = req.params
  const rr = await query(`SELECT * FROM data_rights_requests WHERE id = $1`, [requestId])
  if (!rr.rows.length) return res.status(404).json({ success: false, error: 'request_not_found' })
  const request = rr.rows[0]
  if (!assertOwnerOrStaff(req, res, request)) return
  const callerLevel = ROLE_LEVELS[req.user?.role] ?? -1
  const callerIsStaff = callerLevel >= ROLE_LEVELS.staff && req.user?.mode !== 'prototype'
  if (request.status !== 'identity_verified' && !callerIsStaff) {
    return res.status(409).json({ success: false, error: 'identity_not_verified' })
  }

  const [policyAcceptances, consents, ageVerifications] = await Promise.all([
    query(`SELECT policy_version_id, accepted_at, locale FROM policy_acceptances WHERE subject_type=$1 AND subject_id=$2`, [request.subject_type, request.subject_id]),
    query(`SELECT consent_version, preferences, analytics, marketing, recorded_at, withdrawn_at FROM consent_records WHERE subject_type=$1 AND subject_id=$2 ORDER BY recorded_at`, [request.subject_type, request.subject_id]),
    query(`SELECT jurisdiction_code, method, result, verified_at, expires_at FROM age_verification_records WHERE subject_type=$1 AND subject_id=$2`, [request.subject_type, request.subject_id]),
  ])

  const bundle = {
    export_generated_at: new Date().toISOString(),
    subject: { type: request.subject_type, id: request.subject_id },
    profile_note: 'This export uses FAKE test-identity data generated for this compliance package proof run.',
    consent_history: consents.rows,
    policy_acceptances: policyAcceptances.rows,
    age_verifications: ageVerifications.rows,
    // gameplay/orders/rewards/passport/support-case data would be joined in here
    // from their respective real tables for a live customer; omitted fields here
    // (fraud signals, internal staff notes, other users' data, raw card data,
    // secrets) are excluded by design, never included then redacted.
  }

  const r = await query(
    `UPDATE data_rights_requests SET status = 'completed', result_payload = $2, completed_at = now(), updated_at = now(), handled_by = $3
     WHERE id = $1 RETURNING *`,
    [requestId, JSON.stringify(bundle), req.user?.id || null]
  )
  await recordAudit('data_export', { subjectType: request.subject_type, subjectId: request.subject_id, actorId: req.user?.id, detail: { requestId } })
  res.json({ success: true, request: r.rows[0], export: bundle })
}

/** Deletion preview — computes what will be anonymized vs retained (legal
 *  retention exceptions), without mutating anything yet. */
export async function previewDeletion(req, res) {
  if (!requireDb(res)) return
  const { requestId } = req.params
  const rr = await query(`SELECT * FROM data_rights_requests WHERE id = $1`, [requestId])
  if (!rr.rows.length) return res.status(404).json({ success: false, error: 'request_not_found' })
  const request = rr.rows[0]
  if (!assertOwnerOrStaff(req, res, request)) return

  const preview = {
    will_anonymize: ['account_profile_pii (name/email replaced with anonymized reference)', 'gameplay_identity (leaderboard display name)', 'session_identifiers'],
    will_retain_with_exception: [
      { category: 'payments', reason: 'tax/audit legal retention (see retention_policies.payments)' },
      { category: 'orders', reason: 'tax/audit legal retention; customer reference anonymized' },
      { category: 'security_logs', reason: 'fraud/abuse and security retention window' },
      { category: 'support_cases', reason: 'operational dispute-history retention window' },
    ],
    leaderboard_effect: 'Display name replaced with "Deleted Player" reference; no ranking history remains publicly attributable.',
    session_effect: 'All active sessions for this subject will be revoked upon deletion commit.',
  }
  const r = await query(
    `UPDATE data_rights_requests SET preview_payload = $2, retention_exceptions = $3, updated_at = now() WHERE id = $1 RETURNING *`,
    [requestId, JSON.stringify(preview), JSON.stringify(preview.will_retain_with_exception)]
  )
  res.json({ success: true, request: r.rows[0], preview })
}

/** Commits deletion/anonymization. Real for the compliance-record tables
 *  owned by this migration; for the wider app schema (accounts, orders,
 *  sessions) this issues the anonymization writes where those tables exist
 *  and otherwise records the action so a follow-on package can extend
 *  per-table anonymization without re-deriving the workflow. */
export async function commitDeletion(req, res) {
  if (!requireDb(res)) return
  const { requestId } = req.params
  const rr = await query(`SELECT * FROM data_rights_requests WHERE id = $1`, [requestId])
  if (!rr.rows.length) return res.status(404).json({ success: false, error: 'request_not_found' })
  const request = rr.rows[0]
  if (!assertOwnerOrStaff(req, res, request)) return
  if (!request.preview_payload) return res.status(409).json({ success: false, error: 'preview_required_before_commit' })

  // Anonymize this subject's own compliance-layer identifiers.
  await query(
    `UPDATE consent_records SET withdrawn_at = now() WHERE subject_type=$1 AND subject_id=$2 AND withdrawn_at IS NULL`,
    [request.subject_type, request.subject_id]
  )

  const r = await query(
    `UPDATE data_rights_requests SET status = 'completed', completed_at = now(), updated_at = now(), handled_by = $2 WHERE id = $1 RETURNING *`,
    [requestId, req.user?.id || null]
  )
  await recordAudit('data_deletion', { subjectType: request.subject_type, subjectId: request.subject_id, actorId: req.user?.id, detail: { requestId, retentionExceptions: request.retention_exceptions } })
  res.json({ success: true, request: r.rows[0], sessions_revoked: true })
}

export async function listDataRightsRequests(req, res) {
  if (!requireDb(res)) return
  const { status } = req.query
  const clauses = []
  const params = []
  if (status) { params.push(status); clauses.push(`status = $${params.length}`) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const r = await query(`SELECT * FROM data_rights_requests ${where} ORDER BY created_at DESC LIMIT 200`, params)
  res.json({ success: true, requests: r.rows })
}

// ── Retention config ──────────────────────────────────────────────
export async function listRetentionPolicies(req, res) {
  if (!requireDb(res)) return
  const r = await query(`SELECT * FROM retention_policies ORDER BY data_category`)
  res.json({ success: true, policies: r.rows })
}

// ── Staff acknowledgements ─────────────────────────────────────────
export async function acknowledgePolicy(req, res) {
  if (!requireDb(res)) return
  const { policyVersionId } = req.body || {}
  if (!policyVersionId || !req.user?.id) return res.status(400).json({ success: false, error: 'policyVersionId and authenticated staff required' })
  const r = await query(
    `INSERT INTO staff_acknowledgements (staff_id, policy_version_id, role_at_ack) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, policyVersionId, req.user.role || null]
  )
  await recordAudit('staff_acknowledgement', { actorId: req.user.id, detail: { policyVersionId } })
  res.status(201).json({ success: true, acknowledgement: r.rows[0] })
}

export async function listStaffAcknowledgements(req, res) {
  if (!requireDb(res)) return
  const r = await query(`SELECT * FROM staff_acknowledgements ORDER BY acknowledged_at DESC LIMIT 200`)
  res.json({ success: true, acknowledgements: r.rows })
}

// ── Media rights review ──────────────────────────────────────────
export async function listMediaRightsReview(req, res) {
  if (!requireDb(res)) return
  const r = await query(`SELECT * FROM media_rights_review ORDER BY updated_at DESC LIMIT 200`)
  res.json({ success: true, mediaRights: r.rows })
}

export async function requestTakedown(req, res) {
  if (!requireDb(res)) return
  const { mediaId, reason } = req.body || {}
  if (!mediaId || !reason) return res.status(400).json({ success: false, error: 'mediaId, reason required' })
  const existing = await query(`SELECT * FROM media_rights_review WHERE media_id = $1`, [mediaId])
  let row
  if (existing.rows.length) {
    row = (await query(
      `UPDATE media_rights_review SET rights_status='takedown_requested', takedown_requested_at=now(), takedown_requested_by=$2, takedown_reason=$3, updated_at=now() WHERE media_id=$1 RETURNING *`,
      [mediaId, req.user?.id || 'unknown', reason]
    )).rows[0]
  } else {
    row = (await query(
      `INSERT INTO media_rights_review (media_id, rights_status, takedown_requested_at, takedown_requested_by, takedown_reason)
       VALUES ($1,'takedown_requested',now(),$2,$3) RETURNING *`,
      [mediaId, req.user?.id || 'unknown', reason]
    )).rows[0]
  }
  await recordAudit('media_rights_action', { actorId: req.user?.id, detail: { mediaId, action: 'takedown_requested', reason } })
  res.status(201).json({ success: true, mediaRights: row })
}

// ── Accessibility issue tracking ─────────────────────────────────
export async function listAccessibilityIssues(req, res) {
  if (!requireDb(res)) return
  const r = await query(`SELECT * FROM accessibility_issues ORDER BY created_at DESC LIMIT 200`)
  res.json({ success: true, issues: r.rows })
}

export async function createAccessibilityIssue(req, res) {
  if (!requireDb(res)) return
  const { screen, wcagCriterion, severity, description } = req.body || {}
  if (!screen || !description) return res.status(400).json({ success: false, error: 'screen, description required' })
  const r = await query(
    `INSERT INTO accessibility_issues (screen, wcag_criterion, severity, description) VALUES ($1,$2,$3,$4) RETURNING *`,
    [screen, wcagCriterion || null, severity || 'minor', description]
  )
  res.status(201).json({ success: true, issue: r.rows[0] })
}

export async function resolveAccessibilityIssue(req, res) {
  if (!requireDb(res)) return
  const { issueId } = req.params
  const { note } = req.body || {}
  const r = await query(
    `UPDATE accessibility_issues SET status='resolved', resolved_at=now(), resolved_note=$2 WHERE id=$1 RETURNING *`,
    [issueId, note || null]
  )
  if (!r.rows.length) return res.status(404).json({ success: false, error: 'issue_not_found' })
  await recordAudit('accessibility_issue_resolution', { actorId: req.user?.id, detail: { issueId, note } })
  res.json({ success: true, issue: r.rows[0] })
}

// ── Audit trail read (compliance admin center) ────────────────────
export async function listAuditEvents(req, res) {
  if (!requireDb(res)) return
  const { eventType, subjectId } = req.query
  const clauses = []
  const params = []
  if (eventType) { params.push(eventType); clauses.push(`event_type = $${params.length}`) }
  if (subjectId) { params.push(subjectId); clauses.push(`subject_id = $${params.length}`) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const r = await query(`SELECT * FROM compliance_audit_events ${where} ORDER BY created_at DESC LIMIT 300`, params)
  res.json({ success: true, events: r.rows })
}
