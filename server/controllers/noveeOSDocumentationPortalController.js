// Phase E.9 — NOVEE OS Documentation Portal Controller

import * as svc from '../services/noveeOS/noveeOSDocumentationPortalService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success: true,
  data,
  safeClaim: 'documentation_portal_exists',
  published: false,
  clientReady: false,
  staffReady: false,
  documentationReady: false,
  seededContentReady: true,
  blockers: [],
  timestamp: new Date().toISOString(),
})

export async function getPortalSummary(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationPortalSummary()))
}

export async function listLibrary(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationLibrary(tenantId(req))))
}

export async function getLibraryItem(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationLibraryItem(req.params.docKey)))
}

export async function createLibraryItemPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationLibraryItemPreview(req.body, tenantId(req), ikey(req))))
}

export async function updateLibraryStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationLibraryStatusPreview(req.params.docKey, req.body)))
}

export async function listArticles(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationArticles(req.query.doc_id, tenantId(req))))
}

export async function getArticle(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationArticle(req.params.articleKey)))
}

export async function createArticlePreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationArticlePreview(req.body, tenantId(req), ikey(req))))
}

export async function updateArticleStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationArticleStatusPreview(req.params.articleKey, req.body)))
}

export async function listContentBlocks(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationContentBlocks(req.query.article_id, req.query.doc_id, tenantId(req))))
}

export async function getContentBlock(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationContentBlock(req.params.blockKey)))
}

export async function createContentBlockPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationContentBlockPreview(req.body, tenantId(req))))
}

export async function updateContentBlockStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationContentBlockStatusPreview(req.params.blockKey, req.body)))
}

export async function listSeededManualContent(req, res) {
  ok500(res, async () => wrap(res, await svc.listSeededManualContent(req.query.manual_key, tenantId(req))))
}

export async function getSeededManualContent(req, res) {
  ok500(res, async () => wrap(res, await svc.getSeededManualContent(req.params.sectionKey)))
}

export async function createSeededManualContentPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createSeededManualContentPreview(req.body, tenantId(req), ikey(req))))
}

export async function updateSeededManualContentStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateSeededManualContentStatusPreview(req.params.sectionKey, req.body)))
}

export async function listSearchIndex(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationSearchIndex(tenantId(req))))
}

export async function searchDocumentation(req, res) {
  ok500(res, async () => wrap(res, await svc.searchDocumentation(req.query.q || req.body?.query, tenantId(req))))
}

export async function listReviews(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationReviews(req.query.doc_id, tenantId(req))))
}

export async function getReview(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationReview(req.params.reviewId)))
}

export async function createReviewPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationReviewPreview(req.body, tenantId(req), ikey(req))))
}

export async function updateReviewStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationReviewStatusPreview(req.params.reviewId, req.body)))
}

export async function listExports(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationExports(tenantId(req))))
}

export async function getExport(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationExport(req.params.exportId)))
}

export async function createExportPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationExportPreview(req.body, tenantId(req), ikey(req))))
}

export async function updateExportStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationExportStatusPreview(req.params.exportId, req.body)))
}

export async function listSafeClaims(req, res) {
  ok500(res, async () => wrap(res, await svc.listDocumentationSafeClaims(tenantId(req))))
}

export async function getSafeClaim(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationSafeClaim(req.params.claimKey)))
}

export async function createSafeClaimPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.createDocumentationSafeClaimPreview(req.body, tenantId(req), ikey(req))))
}

export async function updateSafeClaimStatusPreview(req, res) {
  ok500(res, async () => wrap(res, await svc.updateDocumentationSafeClaimStatusPreview(req.params.claimKey, req.body)))
}

export async function getReadinessScore(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationReadinessScore()))
}

export async function getBlockers(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationBlockers()))
}

export async function getSafeDocumentationClaims(req, res) {
  ok500(res, async () => wrap(res, await svc.getSafeDocumentationClaims()))
}

export async function getManualContentCompletenessSummary(req, res) {
  ok500(res, async () => wrap(res, await svc.getManualContentCompletenessSummary()))
}

export async function getAuditLog(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationAuditLog(tenantId(req), req.query.limit)))
}

export async function getFeatureFlagSnapshot(req, res) {
  ok500(res, async () => wrap(res, await svc.getDocumentationFeatureFlagSnapshot()))
}

export async function validatePortalReadiness(req, res) {
  ok500(res, async () => wrap(res, await svc.validateDocumentationPortalReadiness()))
}
