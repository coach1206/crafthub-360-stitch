/**
 * Package 6B — Venue Management Command Hub API client.
 * Same conventions as managementSyncApiClient.js: credentials included,
 * abort-controller timeout, normalized {ok,status,error} shape.
 */
const BASE = '/api/venue-management'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error', details: body?.details }
}

async function request(path, { method = 'GET', body, timeoutMs = 15000 } = {}) {
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
    try { json = await res.json() } catch { /* non-JSON response */ }
    if (!res.ok) return normalizeError(res.status, json)
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

const v = (venueId) => `/venues/${encodeURIComponent(venueId)}`

export const getProfile = (venueId) => request(`${v(venueId)}/profile`)
export const createProfile = (venueId) => request(`${v(venueId)}/profile`, { method: 'POST' })
export const updateProfile = (venueId, expectedVersion, fields) =>
  request(`${v(venueId)}/profile`, { method: 'PATCH', body: { expectedVersion, ...fields } })
export const submitForApproval = (venueId) => request(`${v(venueId)}/profile/submit`, { method: 'POST' })
export const approveProfile = (venueId) => request(`${v(venueId)}/profile/approve`, { method: 'POST' })
export const rejectProfile = (venueId, reason) => request(`${v(venueId)}/profile/reject`, { method: 'POST', body: { reason } })
export const publishProfile = (venueId) => request(`${v(venueId)}/profile/publish`, { method: 'POST' })
export const unpublishProfile = (venueId) => request(`${v(venueId)}/profile/unpublish`, { method: 'POST' })
export const getVersionHistory = (venueId) => request(`${v(venueId)}/profile/versions`)
export const restoreVersion = (venueId, versionNumber) =>
  request(`${v(venueId)}/profile/versions/${versionNumber}/restore`, { method: 'POST' })

export const listMedia = (venueId) => request(`${v(venueId)}/media`)
export const uploadMedia = (venueId, { filename, mediaType, altText, base64Data }) =>
  request(`${v(venueId)}/media`, { method: 'POST', body: { filename, mediaType, altText, base64Data }, timeoutMs: 30000 })
export const getMedia = (venueId, mediaId) => request(`${v(venueId)}/media/${mediaId}`)
export const updateMediaMetadata = (venueId, mediaId, altText) =>
  request(`${v(venueId)}/media/${mediaId}`, { method: 'PATCH', body: { altText } })
export const archiveMedia = (venueId, mediaId) => request(`${v(venueId)}/media/${mediaId}/archive`, { method: 'POST' })
export const restoreMedia = (venueId, mediaId) => request(`${v(venueId)}/media/${mediaId}/restore`, { method: 'POST' })

export const assignBranding = (venueId, slot, mediaId) =>
  request(`${v(venueId)}/branding`, { method: 'POST', body: { slot, mediaId } })
export const removeBranding = (venueId, slot, mediaId) =>
  request(`${v(venueId)}/branding/${slot}`, { method: 'DELETE', body: { mediaId } })
export const reorderGallery = (venueId, orderedMediaIds) =>
  request(`${v(venueId)}/branding/gallery/reorder`, { method: 'POST', body: { orderedMediaIds } })

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
