/**
 * Compliance API client (Production Package 6 Correction) — thin wrapper
 * around /api/compliance/*, same conventions as venueHumidorCustomerApiClient.js
 * (credentials included, abort-controller timeout, normalized {ok,status,error}).
 * Never computes or trusts eligibility client-side — only ever displays what
 * the server returns.
 */
const BASE = '/api/compliance'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error' }
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

/**
 * Resolves the caller's real compliance subject identity ({subjectType,
 * subjectId}) via GET /api/compliance/whoami — server-derived from the
 * httpOnly, server-verified guest-session cookie (or a real authenticated
 * user session). The guest cookie is intentionally httpOnly so client JS
 * can never read or forge it directly; this is the only correct way for
 * the compliance UI to learn "who am I" for compliance purposes.
 */
export async function whoAmI() {
  const r = await request('/whoami')
  if (!r.ok) return null
  return { subjectType: r.subjectType, subjectId: r.subjectId }
}

export const getJurisdictions = () => request('/jurisdictions')
export const updateJurisdiction = (code, fields) => request(`/jurisdictions/${code}`, { method: 'PATCH', body: fields })

export const submitAgeVerification = (payload) => request('/age-verification', { method: 'POST', body: payload })
export const checkPurchaseEligibility = (subjectType, subjectId, jurisdictionCode) =>
  request(`/purchase-eligibility?subjectType=${encodeURIComponent(subjectType)}&subjectId=${encodeURIComponent(subjectId)}&jurisdictionCode=${encodeURIComponent(jurisdictionCode)}`)
export const checkFulfillmentEligibility = (jurisdictionCode, fulfillmentMethod) =>
  request(`/fulfillment-eligibility?jurisdictionCode=${encodeURIComponent(jurisdictionCode)}&fulfillmentMethod=${encodeURIComponent(fulfillmentMethod)}`)

export const listPolicies = (policyType, locale) => request(`/policies${policyType || locale ? `?${new URLSearchParams({ ...(policyType ? { policyType } : {}), ...(locale ? { locale } : {}) })}` : ''}`)
export const acceptPolicy = (payload) => request('/policies/accept', { method: 'POST', body: payload })

export const getCurrentConsent = (subjectType, subjectId) => request(`/consent?subjectType=${encodeURIComponent(subjectType)}&subjectId=${encodeURIComponent(subjectId)}`)
export const setConsent = (payload) => request('/consent', { method: 'POST', body: payload })
export const withdrawConsent = (payload) => request('/consent/withdraw', { method: 'POST', body: payload })

export const submitDataRightsRequest = (payload) => request('/data-rights/requests', { method: 'POST', body: payload })
export const listDataRightsRequests = (status) => request(`/data-rights/requests${status ? `?status=${status}` : ''}`)
export const verifyRequestIdentity = (requestId) => request(`/data-rights/requests/${requestId}/verify-identity`, { method: 'POST' })
export const generateExport = (requestId) => request(`/data-rights/requests/${requestId}/export`, { method: 'POST' })
export const previewDeletion = (requestId) => request(`/data-rights/requests/${requestId}/preview-deletion`, { method: 'POST' })
export const commitDeletion = (requestId) => request(`/data-rights/requests/${requestId}/commit-deletion`, { method: 'POST' })

export const listRetentionPolicies = () => request('/retention-policies')

export const acknowledgeStaffPolicy = (policyVersionId) => request('/staff-acknowledgements', { method: 'POST', body: { policyVersionId } })
export const listStaffAcknowledgements = () => request('/staff-acknowledgements')

export const listMediaRightsReview = () => request('/media-rights')
export const requestTakedown = (mediaId, reason) => request('/media-rights/takedown', { method: 'POST', body: { mediaId, reason } })

export const listAccessibilityIssues = () => request('/accessibility-issues')
export const createAccessibilityIssue = (payload) => request('/accessibility-issues', { method: 'POST', body: payload })
export const resolveAccessibilityIssue = (issueId, note) => request(`/accessibility-issues/${issueId}/resolve`, { method: 'POST', body: { note } })

export const listAuditEvents = (filters = {}) => request(`/audit-events${Object.keys(filters).length ? `?${new URLSearchParams(filters)}` : ''}`)
