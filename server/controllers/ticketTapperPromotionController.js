import {
  getTicketTapperHealth,
  createPromotion,
  updatePromotion,
  activatePromotion,
  deactivatePromotion,
  listPromotions,
  getPromotion,
  listActivePromotionsForSmokeCraft,
  recordPromotionRedemption,
  writeTicketTapperAuditEvent,
  getTicketTapperAuditLog,
} from '../services/ticketTapper/ticketTapperPromotionService.js'

const SAFE_CLAIM = 'ticket_tapper_promotion_backend'

function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    timestamp: new Date().toISOString(),
  })
}

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

export const getHealth = (req, res) => ok500(res, async () => wrap(res, await getTicketTapperHealth()))

export const createPromotionHandler = (req, res) => ok500(res, async () => {
  const data = await createPromotion({ ...req.body, tenantId: tenantId(req) })
  wrap(res, data)
})

export const listPromotionsHandler = (req, res) => ok500(res, async () => {
  const { venueId, status } = req.query
  const data = await listPromotions({ venueId, tenantId: tenantId(req), status })
  wrap(res, data)
})

export const getPromotionHandler = (req, res) => ok500(res, async () => {
  wrap(res, await getPromotion(req.params.promotionId))
})

export const updatePromotionHandler = (req, res) => ok500(res, async () => {
  wrap(res, await updatePromotion(req.params.promotionId, req.body))
})

export const activatePromotionHandler = (req, res) => ok500(res, async () => {
  wrap(res, await activatePromotion(req.params.promotionId))
})

export const deactivatePromotionHandler = (req, res) => ok500(res, async () => {
  wrap(res, await deactivatePromotion(req.params.promotionId))
})

export const getSmokeCraftActiveHandler = (req, res) => ok500(res, async () => {
  const venueId = req.query.venueId || req.query.venue_id || 'novee-grand-lounge'
  wrap(res, await listActivePromotionsForSmokeCraft(venueId))
})

export const recordRedemptionHandler = (req, res) => ok500(res, async () => {
  wrap(res, await recordPromotionRedemption(req.body))
})

export const writeAuditEventHandler = (req, res) => ok500(res, async () => {
  wrap(res, await writeTicketTapperAuditEvent(req.body))
})

export const getAuditLogHandler = (req, res) => ok500(res, async () => {
  const { venueId, promotionId, limit } = req.query
  wrap(res, await getTicketTapperAuditLog({ venueId, promotionId, limit: parseInt(limit) || 50 }))
})
