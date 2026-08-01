/**
 * Venue Humidor 1B-2B-1 — staff admin API client. Same conventions as
 * venueHumidorCustomerApiClient.js: cookie-based session
 * (credentials included), abort-controller timeout, normalized
 * {ok,status,error}.
 */
const BASE = '/api/smokecraft/venue-humidor'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error', fieldErrors: body?.fieldErrors }
}

async function request(path, { method = 'GET', body, timeoutMs = 12000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    if (!res.ok) return normalizeError(res.status, json)
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

function toQuery(filters = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const listAdminProducts = (venueId, filters) => request(`/venues/${venueId}/admin/products${toQuery(filters)}`)
export const getAdminProduct = (venueId, productId) => request(`/venues/${venueId}/admin/products/${productId}`)
export const createAdminProduct = (venueId, payload) => request(`/venues/${venueId}/admin/products`, { method: 'POST', body: payload })
export const updateAdminProduct = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}`, { method: 'PATCH', body: payload })
export const updateClassification = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}/classification`, { method: 'PATCH', body: payload })
export const applyInventoryMutation = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}/inventory-mutations`, { method: 'POST', body: payload })
export const listInventoryEvents = (venueId, filters) => request(`/venues/${venueId}/admin/inventory-events${toQuery(filters)}`)

// Venue Humidor 1B-2B-2 — staff order and fulfillment queue.
export const listOrderQueue = (venueId, filters) => request(`/venues/${venueId}/admin/orders${toQuery(filters)}`)
export const listFulfillmentHistory = (venueId, filters) => request(`/venues/${venueId}/admin/orders/history${toQuery(filters)}`)
export const getOrderDetail = (venueId, orderId) => request(`/venues/${venueId}/admin/orders/${orderId}`)
export const claimOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/claim`, { method: 'POST', body: { idempotencyKey } })
export const assignOrder = (venueId, orderId, targetStaffId, expectedVersion, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/assign`, { method: 'POST', body: { targetStaffId, expectedVersion, idempotencyKey } })
export const confirmOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/confirm`, { method: 'POST', body: { idempotencyKey } })
export const startPreparation = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/prepare`, { method: 'POST', body: { idempotencyKey } })
export const markItemPicked = (venueId, orderId, orderItemId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/items/${orderItemId}/pick`, { method: 'POST', body: { idempotencyKey } })
export const markReady = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/ready`, { method: 'POST', body: { idempotencyKey } })
export const blockOrder = (venueId, orderId, reason, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/block`, { method: 'POST', body: { reason, idempotencyKey } })
export const unblockOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/unblock`, { method: 'POST', body: { idempotencyKey } })
export const addFulfillmentNote = (venueId, orderId, note, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/notes`, { method: 'POST', body: { note, idempotencyKey } })
export const completeFulfillmentOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/complete`, { method: 'POST', body: { idempotencyKey } })
export const cancelFulfillmentOrder = (venueId, orderId, reason, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/cancel`, { method: 'POST', body: { reason, idempotencyKey } })

// Venue Humidor 1B-2B-3 — pickup verification, handoff, no-show, expiration.
export const generateVerificationCode = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/verification-code`, { method: 'POST', body: { idempotencyKey } })
export const verifyPickupCode = (venueId, orderId, code, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/verify`, { method: 'POST', body: { code, idempotencyKey } })
export const confirmHandoff = (venueId, orderId, payload, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/handoff`, { method: 'POST', body: { ...payload, idempotencyKey } })
export const markNoShow = (venueId, orderId, notes, nextAction, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/no-show`, { method: 'POST', body: { notes, nextAction, idempotencyKey } })
export const extendPickupWindow = (venueId, orderId, newPromisedAt, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/extend-pickup-window`, { method: 'POST', body: { newPromisedAt, idempotencyKey } })
export const expireOrder = (venueId, orderId, reason, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/expire`, { method: 'POST', body: { reason, idempotencyKey } })

// Venue Humidor 1B-2B-5 — assisted selling / tobacconist recommendations.
export const getAssistedRecommendations = (venueId, customerReference, preferences, beverageCategory) => request(`/venues/${venueId}/admin/assisted-selling/recommendations`, { method: 'POST', body: { customerReference, preferences, beverageCategory } })
export const getAssistedAlternatives = (venueId, productId) => request(`/venues/${venueId}/admin/assisted-selling/alternatives/${productId}`)
export const recordAssistedSellingOutcome = (venueId, productId, outcome, customerReference, notes, idempotencyKey) => request(`/venues/${venueId}/admin/assisted-selling/outcome`, { method: 'POST', body: { productId, outcome, customerReference, notes, idempotencyKey } })

// Venue Humidor Media and Product Image Management — Production Package 1 of 7.
export const uploadMediaAsset = (venueId, payload) => request(`/venues/${venueId}/media/upload-authorization`, { method: 'POST', body: payload })
export const listVenueMedia = (venueId, filters) => request(`/venues/${venueId}/media${toQuery(filters)}`)
export const listProductGallery = (venueId, productId) => request(`/venues/${venueId}/media/products/${productId}/gallery`)
export const assignAssetToProduct = (venueId, assetId, productId) => request(`/venues/${venueId}/media/${assetId}/assign`, { method: 'POST', body: { productId } })
export const editAssetMetadata = (venueId, assetId, patch) => request(`/venues/${venueId}/media/${assetId}/metadata`, { method: 'PATCH', body: patch })
export const setPrimaryAsset = (venueId, productId, assetId) => request(`/venues/${venueId}/media/products/${productId}/set-primary`, { method: 'POST', body: { assetId } })
export const reorderGallery = (venueId, productId, orderedAssetIds) => request(`/venues/${venueId}/media/products/${productId}/reorder`, { method: 'POST', body: { orderedAssetIds } })
export const approveAsset = (venueId, assetId) => request(`/venues/${venueId}/media/${assetId}/approve`, { method: 'POST' })
export const rejectAsset = (venueId, assetId, reason) => request(`/venues/${venueId}/media/${assetId}/reject`, { method: 'POST', body: { reason } })
export const activateAsset = (venueId, assetId) => request(`/venues/${venueId}/media/${assetId}/activate`, { method: 'POST' })
export const retireAsset = (venueId, assetId, reason) => request(`/venues/${venueId}/media/${assetId}/retire`, { method: 'POST', body: { reason } })
export const importMediaFromUrl = (venueId, productId, payload) => request(`/venues/${venueId}/media/products/${productId}/import-url`, { method: 'POST', body: payload })
export const csvDryRun = (venueId, csv) => request(`/venues/${venueId}/media/csv/dry-run`, { method: 'POST', body: { csv } })
export const csvImport = (venueId, csv) => request(`/venues/${venueId}/media/csv/import`, { method: 'POST', body: { csv } })
export const getMissingImageReport = (venueId, filters) => request(`/venues/${venueId}/media/missing-image-report${toQuery(filters)}`)
export const listMasterCatalog = (venueId, filters) => request(`/venues/${venueId}/media/master-catalog${toQuery(filters)}`)

// ── Real Payment Gateway Integration (Production Package 2 of 7) —
// staff/admin payment views, refunds, webhook-event audit, disputes,
// and manual reconciliation. Same request()/RBAC conventions as
// every other admin surface above.
export const listPayments = (venueId, filters) => request(`/venues/${venueId}/admin/payments${toQuery(filters)}`)
export const getOrderPayment = (venueId, orderId) => request(`/venues/${venueId}/admin/orders/${orderId}/payment`)
export const refundOrderPayment = (venueId, orderId, { amountCents, reason, idempotencyKey }) =>
  request(`/venues/${venueId}/admin/orders/${orderId}/refund`, { method: 'POST', body: { amountCents, reason, idempotencyKey } })
export const listWebhookEvents = (venueId) => request(`/venues/${venueId}/admin/payments/webhook-events`)
export const listDisputes = (venueId) => request(`/venues/${venueId}/admin/payments/disputes`)
export const runPaymentReconciliation = (venueId) => request(`/venues/${venueId}/admin/payments/reconcile`, { method: 'POST' })
