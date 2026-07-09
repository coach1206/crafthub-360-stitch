// Phase E.9 — NOVEE OS Documentation Portal Routes

import express from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSDocumentationPortalController.js'

const router = express.Router()

// Summary + readiness
router.get('/summary', ctrl.getPortalSummary)
router.get('/readiness-score', ctrl.getReadinessScore)
router.get('/blockers', ctrl.getBlockers)
router.get('/safe-claims-panel', ctrl.getSafeDocumentationClaims)
router.get('/feature-flags', ctrl.getFeatureFlagSnapshot)
router.get('/validate-readiness', ctrl.validatePortalReadiness)

// Documentation library
router.get('/library', ctrl.listLibrary)
router.get('/library/:docKey', ctrl.getLibraryItem)
router.post('/library', canAccessPOS3, ctrl.createLibraryItemPreview)
router.patch('/library/:docKey/status', canAccessPOS3, ctrl.updateLibraryStatusPreview)

// Articles
router.get('/articles', ctrl.listArticles)
router.get('/articles/:articleKey', ctrl.getArticle)
router.post('/articles', canAccessPOS3, ctrl.createArticlePreview)
router.patch('/articles/:articleKey/status', canAccessPOS3, ctrl.updateArticleStatusPreview)

// Content blocks
router.get('/content-blocks', ctrl.listContentBlocks)
router.get('/content-blocks/:blockKey', ctrl.getContentBlock)
router.post('/content-blocks', canAccessPOS3, ctrl.createContentBlockPreview)
router.patch('/content-blocks/:blockKey/status', canAccessPOS3, ctrl.updateContentBlockStatusPreview)

// Seeded manual content
router.get('/seeded-manual-content', ctrl.listSeededManualContent)
router.get('/seeded-manual-content/:sectionKey', ctrl.getSeededManualContent)
router.post('/seeded-manual-content', canAccessPOS3, ctrl.createSeededManualContentPreview)
router.patch('/seeded-manual-content/:sectionKey/status', canAccessPOS3, ctrl.updateSeededManualContentStatusPreview)
router.get('/manual-content-completeness', ctrl.getManualContentCompletenessSummary)

// Search index
router.get('/search-index', ctrl.listSearchIndex)
router.get('/search', ctrl.searchDocumentation)
router.post('/search', ctrl.searchDocumentation)

// Reviews
router.get('/reviews', ctrl.listReviews)
router.get('/reviews/:reviewId', ctrl.getReview)
router.post('/reviews', canAccessPOS3, ctrl.createReviewPreview)
router.patch('/reviews/:reviewId/status', canAccessPOS3, ctrl.updateReviewStatusPreview)

// Exports
router.get('/exports', ctrl.listExports)
router.get('/exports/:exportId', ctrl.getExport)
router.post('/exports', canAccessPOS3, ctrl.createExportPreview)
router.patch('/exports/:exportId/status', canAccessPOS3, ctrl.updateExportStatusPreview)

// Safe claims registry
router.get('/safe-claims', ctrl.listSafeClaims)
router.get('/safe-claims/:claimKey', ctrl.getSafeClaim)
router.post('/safe-claims', canAccessPOS3, ctrl.createSafeClaimPreview)
router.patch('/safe-claims/:claimKey/status', canAccessPOS3, ctrl.updateSafeClaimStatusPreview)

// Audit log
router.get('/audit-log', ctrl.getAuditLog)

export default router
