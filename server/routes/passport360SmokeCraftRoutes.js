/**
 * Passport 360 SmokeCraft Routes — Phase F.5
 * Base: /api/passport-360/smokecraft
 *
 * SECURITY REMEDIATION (docs/audits/passport-360-completion/remediation/01-API-SECURITY-AUDIT.md):
 * every write route in this file previously accepted an arbitrary
 * client-supplied guestId, xpAmount, stampId, and completion payload
 * with zero authentication — a confirmed, disclosed defect. There is
 * no way to make "award any XP amount/stamp the client asks for" secure
 * without becoming a different feature, so every write route is
 * disabled (410) rather than patched. The real, secure replacement is
 * /api/passport-360/sync/* (evidence-driven, identity-gated, never
 * trusts a client-submitted value). Read routes are also disabled —
 * their one real caller (src/services/passportService.js) was moved to
 * the canonical sync API's GET /stamps as part of this remediation.
 * Only GET /health remains active (harmless — no identity or data).
 */

import { Router } from 'express'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ success: true, backendConnected: true, persistenceMode: 'database', status: 'connected' })
})

function disabled(req, res) {
  res.status(410).json({
    success: false,
    error: 'endpoint_disabled_insecure_legacy',
    message: 'This Phase F.5 endpoint accepted unauthenticated, client-trusted identity and values and has been disabled. Use /api/passport-360/sync/* instead.',
  })
}

router.post('/guest/resolve', disabled)
router.post('/session/complete', disabled)
router.post('/stamp/award', disabled)
router.post('/xp/award', disabled)
router.post('/flavor-memory/save', disabled)
router.get('/guest/:guestId/progress', disabled)
router.get('/guest/:guestId/stamps', disabled)
router.get('/guest/:guestId/badges', disabled)
router.get('/guest/:guestId/return-visits', disabled)
router.get('/guest/:guestId/audit-log', disabled)
router.post('/audit/event', disabled)

export default router
