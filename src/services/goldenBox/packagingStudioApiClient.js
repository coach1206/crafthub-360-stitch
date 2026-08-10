/**
 * Golden Box Packaging Studio frontend API client — same conventions as
 * goldenBoxApiClient.js (credentials included, abort-controller timeout,
 * normalized {ok,status,error}).
 */
const BASE = '/api/smokecraft/golden-box/packaging-studio'

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

export const listDesigns = () => request('/designs')
export const createDesign = (entryId) => request('/designs', { method: 'POST', body: { entryId } })
export const getDesign = (designId) => request(`/designs/${designId}`)
export const saveDraft = (designId, config) => request(`/designs/${designId}/draft`, { method: 'PATCH', body: config })
export const duplicateDesign = (designId) => request(`/designs/${designId}/duplicate`, { method: 'POST' })
export const archiveDesign = (designId) => request(`/designs/${designId}/archive`, { method: 'POST' })
export const restoreDesign = (designId) => request(`/designs/${designId}/restore`, { method: 'POST' })
export const deleteDesign = (designId) => request(`/designs/${designId}`, { method: 'DELETE' })

export const listVersions = (designId) => request(`/designs/${designId}/versions`)
export const getVersion = (designId, versionNumber) => request(`/designs/${designId}/versions/${versionNumber}`)
export const restoreVersion = (designId, versionNumber) => request(`/designs/${designId}/versions/${versionNumber}/restore`, { method: 'POST' })

export const setAssetPlacement = (assetId, placement) => request(`/assets/${assetId}/placement`, { method: 'PUT', body: placement })
export const removeAsset = (assetId) => request(`/assets/${assetId}`, { method: 'DELETE' })

export const createShare = (designId, accessType, expiresAt) => request(`/designs/${designId}/shares`, { method: 'POST', body: { accessType, expiresAt } })
export const listShares = (designId) => request(`/designs/${designId}/shares`)
export const revokeShare = (shareId) => request(`/shares/${shareId}/revoke`, { method: 'POST' })
export const readShared = (shareToken) => request(`/shares/token/${shareToken}`)
export const addSharedComment = (shareToken, body) => request(`/shares/token/${shareToken}/comments`, { method: 'POST', body })

export const listComments = (designId) => request(`/designs/${designId}/comments`)
export const addComment = (designId, body) => request(`/designs/${designId}/comments`, { method: 'POST', body })
export const resolveComment = (commentId) => request(`/comments/${commentId}/resolve`, { method: 'POST' })

export const submitFinal = (designId, entryId) => request(`/designs/${designId}/submit`, { method: 'POST', body: { entryId } })
export const getFinalSubmission = (entryId) => request(`/entries/${entryId}/final-submission`)
export const getPackagingReadiness = (entryId) => request(`/entries/${entryId}/readiness`)
export const associateEntry = (designId, entryId) => request(`/designs/${designId}/associate-entry`, { method: 'POST', body: { entryId } })
