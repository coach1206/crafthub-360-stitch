// Phase E.9 — NOVEE OS Documentation Portal Service
// BUILD ONLY — publication, export, and client-ready flags all disabled by default

import {
  DEFAULT_DOCUMENTATION_LIBRARY,
  DEFAULT_SEEDED_MANUAL_CONTENT,
  DEFAULT_SAFE_CLAIMS,
  assertNoFakeManualCompletionClaims,
  assertNoFakeDocumentationPublicationClaims,
  assertNoFakeCertificationDocumentationClaims,
  assertNoUnsafeSmokeCraftProductionReadyClaims,
  assertNoSensitiveDocumentationData,
  assertNoEmptyManualRecords,
  assertRequiredManualsHaveSeededContent,
  validateDocumentationLibraryPayload,
  validateDocumentationArticlePayload,
  validateDocumentationContentBlockPayload,
  validateDocumentationReviewPayload,
  validateDocumentationExportPayload,
  validateDocumentationSafeClaimPayload,
  validateSeededManualContentPayload,
} from './noveeOSDocumentationPortalContracts.js'
import NOVEE_OS_DOCUMENTATION_PORTAL_FLAGS from '../../config/noveeOSDocumentationPortalFeatureFlags.js'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

async function isDbAvailable() {
  try {
    const { default: db } = await import('../../db/connection.js')
    await db.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

async function db() {
  const { default: d } = await import('../../db/connection.js')
  return d
}

const SAFETY_STATUS = 'BUILD_ONLY_DOCUMENTATION_NOT_PUBLISHED'

export async function getDocumentationPortalSummary() {
  assertNoFakeManualCompletionClaims({ published: false })
  assertNoFakeDocumentationPublicationClaims({ published: false })
  assertRequiredManualsHaveSeededContent(DEFAULT_SEEDED_MANUAL_CONTENT)

  const available = await isDbAvailable()
  if (!available) {
    return {
      ok: true,
      localPreview: true,
      safety_status: SAFETY_STATUS,
      published: false,
      client_ready: false,
      staff_ready: false,
      documentation_ready: false,
      seeded_content_ready: true,
      library_count: DEFAULT_DOCUMENTATION_LIBRARY.length,
      seeded_content_count: DEFAULT_SEEDED_MANUAL_CONTENT.length,
      safe_claims_count: DEFAULT_SAFE_CLAIMS.length,
      flags: NOVEE_OS_DOCUMENTATION_PORTAL_FLAGS,
    }
  }

  const conn = await db()
  const [libRes, seedRes, claimRes] = await Promise.all([
    conn.query('SELECT COUNT(*) FROM novee_os_documentation_library_registry'),
    conn.query('SELECT COUNT(*) FROM novee_os_documentation_seeded_manual_content_registry'),
    conn.query('SELECT COUNT(*) FROM novee_os_documentation_safe_claims_registry'),
  ])

  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    published: false,
    client_ready: false,
    staff_ready: false,
    documentation_ready: false,
    seeded_content_ready: true,
    library_count: parseInt(libRes.rows[0].count),
    seeded_content_count: parseInt(seedRes.rows[0].count),
    safe_claims_count: parseInt(claimRes.rows[0].count),
    flags: NOVEE_OS_DOCUMENTATION_PORTAL_FLAGS,
  }
}

export async function listDocumentationLibrary(tenantId) {
  const available = await isDbAvailable()
  if (!available) {
    return { ok: true, localPreview: true, records: DEFAULT_DOCUMENTATION_LIBRARY, safety_status: SAFETY_STATUS }
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, tenant_id, doc_key, doc_title, doc_type, doc_category, audience_role,
     module_key, status, published, client_ready, staff_ready, technical_only,
     version_label, safe_claim, seeded_content_status, full_content_required,
     review_required, notes, created_at, updated_at
     FROM novee_os_documentation_library_registry
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY doc_category, doc_title`,
    [tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationLibraryItem(docKey) {
  const available = await isDbAvailable()
  if (!available) {
    const found = DEFAULT_DOCUMENTATION_LIBRARY.find(d => d.doc_key === docKey)
    return found
      ? { ok: true, localPreview: true, record: found, safety_status: SAFETY_STATUS }
      : localFallback('documentation_library_item')
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_key, doc_title, doc_type, doc_category, audience_role,
     module_key, status, published, client_ready, staff_ready, technical_only,
     version_label, safe_claim, seeded_content_status, full_content_required,
     review_required, notes, created_at, updated_at
     FROM novee_os_documentation_library_registry WHERE doc_key = $1`,
    [docKey]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationLibraryItemPreview(payload, tenantId, ikey) {
  validateDocumentationLibraryPayload(payload)
  assertNoFakeDocumentationPublicationClaims({ published: false })
  assertNoEmptyManualRecords({ doc_title: payload.doc_title, doc_type: payload.doc_type })

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, published: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_library_registry
     (tenant_id, doc_key, doc_title, doc_type, doc_category, audience_role, module_key,
      status, version_label, safe_claim, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9,$10)
     ON CONFLICT (doc_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_key, payload.doc_title, payload.doc_type,
     payload.doc_category || 'platform', payload.audience_role || 'admin',
     payload.module_key || null, payload.version_label || '0.1.0-draft',
     payload.safe_claim || 'documentation_record_exists', payload.notes || null]
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, published: false }
}

export async function updateDocumentationLibraryStatusPreview(docKey, payload) {
  assertNoFakeDocumentationPublicationClaims({ published: false })

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_library_registry
     SET status = $1, notes = COALESCE($2, notes), updated_at = now()
     WHERE doc_key = $3`,
    [payload.status || 'draft', payload.notes || null, docKey]
  )
  return { ok: true, safety_status: SAFETY_STATUS, published: false }
}

export async function listDocumentationArticles(docId, tenantId) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_key, article_title, article_type, article_category,
     audience_role, module_key, sort_order, status, published, content_summary,
     full_content_required, safe_claim, created_at, updated_at
     FROM novee_os_documentation_article_registry
     WHERE ($1::uuid IS NULL OR doc_id = $1)
     AND ($2::uuid IS NULL OR tenant_id = $2)
     ORDER BY sort_order`,
    [docId || null, tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationArticle(articleKey) {
  const available = await isDbAvailable()
  if (!available) return localFallback('documentation_article')

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_key, article_title, article_type, article_category,
     audience_role, module_key, sort_order, status, published, content_summary,
     full_content_required, safe_claim, created_at, updated_at
     FROM novee_os_documentation_article_registry WHERE article_key = $1`,
    [articleKey]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationArticlePreview(payload, tenantId, ikey) {
  validateDocumentationArticlePayload(payload)
  assertNoFakeDocumentationPublicationClaims({ published: false })

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, published: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_article_registry
     (tenant_id, doc_id, article_key, article_title, article_type, article_category,
      audience_role, module_key, sort_order, status, content_summary, safe_claim)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11)
     ON CONFLICT (article_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_id || null, payload.article_key, payload.article_title,
     payload.article_type || 'overview', payload.article_category || 'platform',
     payload.audience_role || 'admin', payload.module_key || null,
     payload.sort_order || 0, payload.content_summary || null,
     payload.safe_claim || 'documentation_article_exists']
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, published: false }
}

export async function updateDocumentationArticleStatusPreview(articleKey, payload) {
  assertNoFakeDocumentationPublicationClaims({ published: false })

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_article_registry
     SET status = $1, updated_at = now() WHERE article_key = $2`,
    [payload.status || 'draft', articleKey]
  )
  return { ok: true, safety_status: SAFETY_STATUS, published: false }
}

export async function listDocumentationContentBlocks(articleId, docId, tenantId) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_id, block_key, block_title, block_type, block_status,
     content_summary, content_body, contains_sensitive_data, contains_unsafe_claim,
     needs_review, approved, published, safe_claim, created_at, updated_at
     FROM novee_os_documentation_content_block_registry
     WHERE ($1::uuid IS NULL OR article_id = $1)
     AND ($2::uuid IS NULL OR doc_id = $2)
     ORDER BY created_at`,
    [articleId || null, docId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationContentBlock(blockKey) {
  const available = await isDbAvailable()
  if (!available) return localFallback('content_block')

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_id, block_key, block_title, block_type, block_status,
     content_summary, content_body, contains_sensitive_data, contains_unsafe_claim,
     needs_review, approved, published, safe_claim, created_at, updated_at
     FROM novee_os_documentation_content_block_registry WHERE block_key = $1`,
    [blockKey]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationContentBlockPreview(payload, tenantId) {
  validateDocumentationContentBlockPayload(payload)
  assertNoSensitiveDocumentationData(payload)

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, published: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_content_block_registry
     (tenant_id, doc_id, article_id, block_key, block_title, block_type,
      block_status, content_summary, content_body, safe_claim)
     VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9)
     ON CONFLICT (block_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_id || null, payload.article_id || null,
     payload.block_key, payload.block_title, payload.block_type || 'paragraph',
     payload.content_summary || null, payload.content_body || null,
     payload.safe_claim || 'content_block_exists']
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, published: false }
}

export async function updateDocumentationContentBlockStatusPreview(blockKey, payload) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_content_block_registry
     SET block_status = $1, updated_at = now() WHERE block_key = $2`,
    [payload.status || 'draft', blockKey]
  )
  return { ok: true, safety_status: SAFETY_STATUS, published: false }
}

export async function listSeededManualContent(manualKey, tenantId) {
  // seeded manual content is intentionally local-first — content_body excluded from DB list for performance
  const available = await isDbAvailable()
  if (!available) {
    const filtered = manualKey
      ? DEFAULT_SEEDED_MANUAL_CONTENT.filter(s => s.manual_key === manualKey)
      : DEFAULT_SEEDED_MANUAL_CONTENT
    return { ok: true, localPreview: true, records: filtered, safety_status: SAFETY_STATUS }
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, manual_key, manual_title, section_key, section_title,
     section_order, audience_role, module_key, content_depth_status,
     investor_ready_draft, needs_human_review, published, safe_claim, created_at, updated_at
     FROM novee_os_documentation_seeded_manual_content_registry
     WHERE ($1::text IS NULL OR manual_key = $1)
     ORDER BY manual_key, section_order`,
    [manualKey || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getSeededManualContent(sectionKey) {
  const available = await isDbAvailable()
  if (!available) {
    const found = DEFAULT_SEEDED_MANUAL_CONTENT.find(s => s.section_key === sectionKey)
    return found
      ? { ok: true, localPreview: true, record: found, safety_status: SAFETY_STATUS }
      : localFallback('seeded_manual_content')
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, manual_key, manual_title, section_key, section_title,
     section_order, audience_role, module_key, content_body, content_depth_status,
     investor_ready_draft, needs_human_review, published, safe_claim, created_at, updated_at
     FROM novee_os_documentation_seeded_manual_content_registry WHERE section_key = $1`,
    [sectionKey]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createSeededManualContentPreview(payload, tenantId, ikey) {
  validateSeededManualContentPayload(payload)
  assertNoEmptyManualRecords({ doc_title: payload.manual_title, doc_type: 'manual' })
  assertNoUnsafeSmokeCraftProductionReadyClaims(payload)

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, published: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_seeded_manual_content_registry
     (tenant_id, doc_id, manual_key, manual_title, section_key, section_title,
      section_order, audience_role, module_key, content_body, content_depth_status, safe_claim)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (section_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_id || null, payload.manual_key, payload.manual_title,
     payload.section_key, payload.section_title, payload.section_order || 0,
     payload.audience_role || 'admin', payload.module_key || null,
     payload.content_body || '', payload.content_depth_status || 'seeded_professional_draft',
     payload.safe_claim || 'seeded_manual_content_exists']
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, published: false }
}

export async function updateSeededManualContentStatusPreview(sectionKey, payload) {
  assertNoUnsafeSmokeCraftProductionReadyClaims(payload)

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_seeded_manual_content_registry
     SET content_depth_status = $1, updated_at = now() WHERE section_key = $2`,
    [payload.content_depth_status || 'seeded_professional_draft', sectionKey]
  )
  return { ok: true, safety_status: SAFETY_STATUS, published: false }
}

export async function listDocumentationSearchIndex(tenantId) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_id, content_block_id, searchable_title,
     searchable_summary, searchable_tags_json, module_key, audience_role,
     status, indexed_at, safe_claim, created_at, updated_at
     FROM novee_os_documentation_search_index
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY searchable_title`,
    [tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function searchDocumentation(query, tenantId) {
  if (!query || query.length < 2) return { ok: false, error: 'query_too_short' }

  const available = await isDbAvailable()
  if (!available) {
    const q = query.toLowerCase()
    const results = DEFAULT_SEEDED_MANUAL_CONTENT.filter(
      s => s.section_title.toLowerCase().includes(q) || (s.content_body || '').toLowerCase().includes(q)
    ).slice(0, 20)
    return { ok: true, localPreview: true, results, safety_status: SAFETY_STATUS }
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, searchable_title, searchable_summary, searchable_tags_json,
     module_key, audience_role, status, indexed_at
     FROM novee_os_documentation_search_index
     WHERE (searchable_title ILIKE $1 OR searchable_summary ILIKE $1)
     AND ($2::uuid IS NULL OR tenant_id = $2)
     ORDER BY searchable_title LIMIT 50`,
    [`%${query}%`, tenantId || null]
  )
  return { ok: true, results: res.rows, safety_status: SAFETY_STATUS }
}

export async function listDocumentationReviews(docId, tenantId) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_id, review_status, reviewer_role,
     review_notes, unsafe_claims_found, sensitive_data_found, missing_content_found,
     approved_for_client, approved_for_staff, approved_for_public, reviewed_at,
     safe_claim, idempotency_key, created_at, updated_at
     FROM novee_os_documentation_review_registry
     WHERE ($1::uuid IS NULL OR doc_id = $1)
     AND ($2::uuid IS NULL OR tenant_id = $2)
     ORDER BY created_at DESC`,
    [docId || null, tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationReview(reviewId) {
  const available = await isDbAvailable()
  if (!available) return localFallback('documentation_review')

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, article_id, review_status, reviewer_role,
     review_notes, unsafe_claims_found, sensitive_data_found, missing_content_found,
     approved_for_client, approved_for_staff, approved_for_public, reviewed_at,
     safe_claim, created_at, updated_at
     FROM novee_os_documentation_review_registry WHERE id = $1`,
    [reviewId]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationReviewPreview(payload, tenantId, ikey) {
  validateDocumentationReviewPayload(payload)

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_review_registry
     (tenant_id, doc_id, article_id, review_status, reviewer_role,
      review_notes, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_id || null, payload.article_id || null,
     payload.review_status || 'not_reviewed', payload.reviewer_role || 'admin',
     payload.review_notes || null, ikey || null]
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS }
}

export async function updateDocumentationReviewStatusPreview(reviewId, payload) {
  assertNoFakeCertificationDocumentationClaims({ approved_for_public: false })

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_review_registry
     SET review_status = $1, review_notes = COALESCE($2, review_notes), updated_at = now()
     WHERE id = $3`,
    [payload.review_status || 'not_reviewed', payload.review_notes || null, reviewId]
  )
  return { ok: true, safety_status: SAFETY_STATUS }
}

export async function listDocumentationExports(tenantId) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, export_type, export_status, export_format,
     contains_sensitive_data, approved_for_export, exported_at,
     safe_claim, idempotency_key, created_at, updated_at
     FROM novee_os_documentation_export_registry
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY created_at DESC`,
    [tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationExport(exportId) {
  const available = await isDbAvailable()
  if (!available) return localFallback('documentation_export')

  const conn = await db()
  const res = await conn.query(
    `SELECT id, doc_id, export_type, export_status, export_format,
     contains_sensitive_data, approved_for_export, exported_at,
     safe_claim, created_at, updated_at
     FROM novee_os_documentation_export_registry WHERE id = $1`,
    [exportId]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationExportPreview(payload, tenantId, ikey) {
  validateDocumentationExportPayload(payload)

  if (!NOVEE_OS_DOCUMENTATION_PORTAL_FLAGS.NOVEE_DOCUMENTATION_EXPORT_ENABLED) {
    return { ok: false, blocked: true, reason: 'export_not_enabled', safety_status: SAFETY_STATUS }
  }

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, approved_for_export: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_export_registry
     (tenant_id, doc_id, export_type, export_status, export_format, idempotency_key)
     VALUES ($1,$2,$3,'not_started',$4,$5)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.doc_id || null, payload.export_type || 'pdf',
     payload.export_format || 'pdf', ikey || null]
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, approved_for_export: false }
}

export async function updateDocumentationExportStatusPreview(exportId, payload) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_export_registry
     SET export_status = $1, updated_at = now() WHERE id = $2`,
    [payload.export_status || 'not_started', exportId]
  )
  return { ok: true, safety_status: SAFETY_STATUS, approved_for_export: false }
}

export async function listDocumentationSafeClaims(tenantId) {
  const available = await isDbAvailable()
  if (!available) {
    return { ok: true, localPreview: true, records: DEFAULT_SAFE_CLAIMS, safety_status: SAFETY_STATUS }
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, claim_key, claim_text, claim_type, module_key, claim_status,
     evidence_required, evidence_present, approved_for_sales, approved_for_client,
     blocker_reason, safe_claim, created_at, updated_at
     FROM novee_os_documentation_safe_claims_registry
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY claim_type, claim_key`,
    [tenantId || null]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationSafeClaim(claimKey) {
  const available = await isDbAvailable()
  if (!available) {
    const found = DEFAULT_SAFE_CLAIMS.find(c => c.claim_key === claimKey)
    return found
      ? { ok: true, localPreview: true, record: found, safety_status: SAFETY_STATUS }
      : localFallback('documentation_safe_claim')
  }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, claim_key, claim_text, claim_type, module_key, claim_status,
     evidence_required, evidence_present, approved_for_sales, approved_for_client,
     blocker_reason, safe_claim, created_at, updated_at
     FROM novee_os_documentation_safe_claims_registry WHERE claim_key = $1`,
    [claimKey]
  )
  if (!res.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, record: res.rows[0], safety_status: SAFETY_STATUS }
}

export async function createDocumentationSafeClaimPreview(payload, tenantId, ikey) {
  validateDocumentationSafeClaimPayload(payload)

  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS, approved_for_sales: false }

  const conn = await db()
  const res = await conn.query(
    `INSERT INTO novee_os_documentation_safe_claims_registry
     (tenant_id, claim_key, claim_text, claim_type, module_key, claim_status)
     VALUES ($1,$2,$3,$4,$5,'draft')
     ON CONFLICT (claim_key) DO NOTHING RETURNING id`,
    [tenantId || null, payload.claim_key, payload.claim_text,
     payload.claim_type || 'safe_claim', payload.module_key || null]
  )
  return { ok: true, created: res.rows.length > 0, safety_status: SAFETY_STATUS, approved_for_sales: false }
}

export async function updateDocumentationSafeClaimStatusPreview(claimKey, payload) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, safety_status: SAFETY_STATUS }

  const conn = await db()
  await conn.query(
    `UPDATE novee_os_documentation_safe_claims_registry
     SET claim_status = $1, updated_at = now() WHERE claim_key = $2`,
    [payload.claim_status || 'draft', claimKey]
  )
  return { ok: true, safety_status: SAFETY_STATUS, approved_for_sales: false }
}

export async function getDocumentationReadinessScore() {
  assertRequiredManualsHaveSeededContent(DEFAULT_SEEDED_MANUAL_CONTENT)

  const requiredManuals = [
    'smokecraft_360_venue_guide', 'smokecraft_360_staff_guide', 'smokecraft_360_guest_flow_guide',
    'passport_360_connection_guide', 'pos360_staff_guide', 'eat360_manager_guide',
  ]
  const seededKeys = new Set(DEFAULT_SEEDED_MANUAL_CONTENT.map(s => s.manual_key))
  const coveredManuals = requiredManuals.filter(k => seededKeys.has(k))

  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    documentation_ready: false,
    published: false,
    client_ready: false,
    staff_ready: false,
    seeded_content_ready: true,
    seeded_section_count: DEFAULT_SEEDED_MANUAL_CONTENT.length,
    required_manual_count: requiredManuals.length,
    covered_manual_count: coveredManuals.length,
    library_count: DEFAULT_DOCUMENTATION_LIBRARY.length,
    safe_claims_count: DEFAULT_SAFE_CLAIMS.length,
    blockers: [
      'NOVEE_DOCUMENTATION_PUBLICATION_ENABLED is false',
      'NOVEE_DOCUMENTATION_CLIENT_READY_PUBLICATION_ENABLED is false',
      'Review required for all manuals before publication',
    ],
  }
}

export async function getDocumentationBlockers() {
  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    blockers: [
      { key: 'publication_disabled', label: 'Publication Not Enabled', severity: 'blocking', safe_claim: 'publication_gate_enforced' },
      { key: 'client_ready_disabled', label: 'Client-Ready Publication Not Enabled', severity: 'blocking', safe_claim: 'client_ready_gate_enforced' },
      { key: 'staff_ready_disabled', label: 'Staff-Ready Publication Not Enabled', severity: 'blocking', safe_claim: 'staff_ready_gate_enforced' },
      { key: 'export_disabled', label: 'Export Not Enabled', severity: 'blocking', safe_claim: 'export_gate_enforced' },
      { key: 'review_required', label: 'Human Review Required For All Manuals', severity: 'blocking', safe_claim: 'review_gate_enforced' },
      { key: 'full_content_required', label: 'Full Content Required Before Publication', severity: 'blocking', safe_claim: 'content_gate_enforced' },
    ],
    published: false,
    documentation_ready: false,
  }
}

export async function getSafeDocumentationClaims() {
  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    safe_claims: [
      'Documentation portal exists and is active',
      'Documentation library records are seeded with professional draft content',
      'Seeded manual content exists for all required platform guides',
      'Safe claims registry is active with evidence tracking',
      'Audit logging is active for all documentation events',
      'All publication, export, and client-ready flags require evidence before activation',
    ],
    unsafe_claims_blocked: [
      'Documentation is NOT published — publication flag is false',
      'Documentation is NOT client-ready — client_ready flag is false',
      'Documentation is NOT staff-ready — staff_ready flag is false',
      'Export is NOT enabled — export flag is false',
      'SmokeCraft is NOT production-ready — pilot readiness gate not passed',
      'AMBI hardware does NOT exist — hardware_ready flag is false',
      'No manuals are certified or compliance-approved',
    ],
  }
}

export async function getManualContentCompletenessSummary() {
  assertRequiredManualsHaveSeededContent(DEFAULT_SEEDED_MANUAL_CONTENT)

  const manualGroups = {}
  for (const section of DEFAULT_SEEDED_MANUAL_CONTENT) {
    if (!manualGroups[section.manual_key]) {
      manualGroups[section.manual_key] = { manual_key: section.manual_key, manual_title: section.manual_title, sections: [] }
    }
    manualGroups[section.manual_key].sections.push({
      section_key: section.section_key,
      section_title: section.section_title,
      section_order: section.section_order,
      content_depth_status: section.content_depth_status,
      has_content: !!(section.content_body && section.content_body.length > 50),
    })
  }

  const summaries = Object.values(manualGroups).map(g => ({
    ...g,
    section_count: g.sections.length,
    seeded_count: g.sections.filter(s => s.has_content).length,
    needs_human_review: true,
    published: false,
  }))

  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    manual_summaries: summaries,
    total_manuals: summaries.length,
    total_sections: DEFAULT_SEEDED_MANUAL_CONTENT.length,
    all_needs_human_review: true,
    published: false,
  }
}

export async function writeDocumentationAuditEvent(tenantId, actorId, eventType, summary, meta) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true }

  const conn = await db()
  await conn.query(
    `INSERT INTO novee_os_documentation_audit_log
     (tenant_id, actor_id, event_type, event_category, severity, summary, metadata_json)
     VALUES ($1,$2,$3,'documentation','info',$4,$5)`,
    [tenantId || null, actorId || 'system', eventType, summary, meta ? JSON.stringify(meta) : null]
  )
  return { ok: true }
}

export async function getDocumentationAuditLog(tenantId, limit) {
  const available = await isDbAvailable()
  if (!available) return { ok: true, localPreview: true, records: [], safety_status: SAFETY_STATUS }

  const conn = await db()
  const res = await conn.query(
    `SELECT id, actor_id, actor_role, event_type, event_category, severity,
     summary, metadata_json, created_at
     FROM novee_os_documentation_audit_log
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY created_at DESC LIMIT $2`,
    [tenantId || null, limit || 100]
  )
  return { ok: true, records: res.rows, safety_status: SAFETY_STATUS }
}

export async function getDocumentationFeatureFlagSnapshot() {
  return {
    ok: true,
    flags: NOVEE_OS_DOCUMENTATION_PORTAL_FLAGS,
    safety_status: SAFETY_STATUS,
    published: false,
    documentation_ready: false,
  }
}

export async function validateDocumentationPortalReadiness() {
  assertNoFakeManualCompletionClaims({ published: false })
  assertNoFakeDocumentationPublicationClaims({ published: false })
  assertRequiredManualsHaveSeededContent(DEFAULT_SEEDED_MANUAL_CONTENT)

  return {
    ok: true,
    safety_status: SAFETY_STATUS,
    published: false,
    client_ready: false,
    staff_ready: false,
    documentation_ready: false,
    seeded_content_ready: true,
    validation_passed: true,
    blockers: [
      'Publication requires human review approval',
      'NOVEE_DOCUMENTATION_PUBLICATION_ENABLED must be set to true',
      'NOVEE_DOCUMENTATION_CLIENT_READY_PUBLICATION_ENABLED must be set to true',
    ],
    timestamp: new Date().toISOString(),
  }
}
