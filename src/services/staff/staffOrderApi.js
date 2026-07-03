/**
 * Staff Order API Client
 * Wraps /api/staff endpoints. Returns preview_fallback on network errors.
 * Never stores payment secrets client-side.
 */

const BASE = '/api/staff'

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
    return await res.json()
  } catch {
    return { ok: false, sessionStatus: 'preview_fallback', error: 'network_error' }
  }
}

const get  = url => safeFetch(url)
const post = (url, body) => safeFetch(url, { method: 'POST', body: JSON.stringify(body) })
const put  = (url, body) => safeFetch(url, { method: 'PUT',  body: JSON.stringify(body) })
const del  = url => safeFetch(url, { method: 'DELETE' })

// Staff order sessions
export const startStaffOrderSession     = (venueId, payload) => post(`${BASE}/venue/${venueId}/sessions`, payload)
export const getStaffOrderSession       = sessionId => get(`${BASE}/sessions/${sessionId}`)
export const listStaffOrderSessions     = (venueId, params = {}) => get(`${BASE}/venue/${venueId}/sessions?${new URLSearchParams(params)}`)
export const addItemToSession           = (sessionId, item) => post(`${BASE}/sessions/${sessionId}/items`, item)
export const updateSessionItem          = (sessionId, itemId, payload) => put(`${BASE}/sessions/${sessionId}/items/${itemId}`, payload)
export const removeSessionItem          = (sessionId, itemId) => del(`${BASE}/sessions/${sessionId}/items/${itemId}`)
export const assignSessionTable         = (sessionId, ctx) => post(`${BASE}/sessions/${sessionId}/assign-table`, ctx)
export const assignSessionSection       = (sessionId, ctx) => post(`${BASE}/sessions/${sessionId}/assign-section`, ctx)
export const submitSessionPreview       = (sessionId, ctx) => post(`${BASE}/sessions/${sessionId}/submit-preview`, ctx)
export const cancelSession              = (sessionId, reason) => post(`${BASE}/sessions/${sessionId}/cancel`, { reason })
export const convertCartToStaffOrder    = (cartId, ctx) => post(`${BASE}/convert-cart/${cartId}`, ctx)
export const getStaffOrderReadiness     = venueId => get(`${BASE}/venue/${venueId}/readiness`)

// Floor sections
export const listSections               = venueId => get(`${BASE}/venue/${venueId}/sections`)
export const upsertSection              = (venueId, payload) => post(`${BASE}/venue/${venueId}/sections`, payload)
export const archiveSection             = (venueId, sectionId) => post(`${BASE}/venue/${venueId}/sections/${sectionId}/archive`, {})
export const getSectionReadiness        = venueId => get(`${BASE}/venue/${venueId}/sections-readiness`)

// Tables
export const listTables                 = venueId => get(`${BASE}/venue/${venueId}/tables`)
export const upsertTable                = (venueId, payload) => post(`${BASE}/venue/${venueId}/tables`, payload)
export const updateTablePosition           = (venueId, tableId, pos) => put(`${BASE}/venue/${venueId}/tables/${tableId}/position`, pos)
export const updateTableLayoutPosition     = (venueId, tableId, pos) => post(`${BASE}/venue/${venueId}/tables/${tableId}/layout-position`, pos)
export const resetTableLayoutPreview       = (venueId, sectionId) => post(`${BASE}/venue/${venueId}/table-layout/reset-preview`, { section_id: sectionId })
export const buildDefaultSectionLayout     = (venueId, sectionId) => post(`${BASE}/venue/${venueId}/sections/${sectionId}/default-layout`, {})
export const getTableLayout                = venueId => get(`${BASE}/venue/${venueId}/layout`)
export const getLayoutPreview              = venueId => get(`${BASE}/venue/${venueId}/layout-preview`)
export const getTableLayoutReadiness       = venueId => get(`${BASE}/venue/${venueId}/table-layout-readiness`)
export const getStaffReadiness             = venueId => get(`${BASE}/venue/${venueId}/readiness`)

// Manager approval
export const getActionPolicy            = (venueId, staffRole, actionType) => get(`${BASE}/venue/${venueId}/action-policy?staffRole=${staffRole}&actionType=${actionType}`)
export const createManagerApproval      = (venueId, payload) => post(`${BASE}/venue/${venueId}/approvals`, payload)
export const listManagerApprovals       = (venueId, params = {}) => get(`${BASE}/venue/${venueId}/approvals?${new URLSearchParams(params)}`)
export const approveManagerRequest      = (approvalRequestId, ctx) => post(`${BASE}/approvals/${approvalRequestId}/approve`, ctx)
export const rejectManagerRequest       = (approvalRequestId, ctx) => post(`${BASE}/approvals/${approvalRequestId}/reject`, ctx)
export const getApprovalReadiness       = venueId => get(`${BASE}/venue/${venueId}/approval-readiness`)

// Manual POS360 handoff
export const createPOS360Handoff        = (venueId, payload) => post(`${BASE}/venue/${venueId}/pos360-handoff`, payload)
export const listPOS360Handoffs         = venueId => get(`${BASE}/venue/${venueId}/pos360-handoffs`)
export const getPOS360HandoffReadiness  = venueId => get(`${BASE}/venue/${venueId}/pos360-readiness`)

// Table status
export const getTableStatusBoard        = venueId => get(`${BASE}/venue/${venueId}/table-status-board`)
export const updateTableStatus          = (venueId, tableId, table_status) => put(`${BASE}/venue/${venueId}/tables/${tableId}/status`, { table_status })
export const updateTableStatusPreview   = (venueId, tableId, table_status) => put(`${BASE}/venue/${venueId}/tables/${tableId}/status`, { table_status })
export const getTableStatusReadiness    = venueId => get(`${BASE}/venue/${venueId}/table-status-readiness`)

// Audit
export const getStaffAuditTrail         = (venueId, params = {}) => get(`${BASE}/venue/${venueId}/audit?${new URLSearchParams(params)}`)
