import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/packagingStudioApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'

export default function PackagingStudioShare() {
  const { designId } = useParams()
  const navigate = useNavigate()
  const [shares, setShares] = useState(null)
  const [newToken, setNewToken] = useState(null)
  const [accessType, setAccessType] = useState('view_only')

  function refresh() { api.listShares(designId).then(res => { if (res.ok) setShares(res.shares) }) }
  useEffect(() => { refresh() }, [designId])

  async function handleCreate() {
    const res = await api.createShare(designId, accessType)
    if (res.ok) { setNewToken(res.token); refresh() }
  }
  async function handleRevoke(shareId) {
    await api.revokeShare(shareId)
    refresh()
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ minHeight: '100vh', background: NAVY, color: CREAM, fontFamily: 'Georgia, serif', padding: 24 }}>
      <h1 style={{ color: GOLD }}>Sharing Manager</h1>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="pkg-share-access-type" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Access Type</label>
        <select id="pkg-share-access-type" value={accessType} onChange={e => setAccessType(e.target.value)}
          style={{ minHeight: 44, background: GLASS, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', marginRight: 10 }}>
          <option value="view_only">View Only</option>
          <option value="comment_enabled">Comment Enabled</option>
        </select>
        <button onClick={handleCreate} style={{ minHeight: 44, padding: '8px 16px', background: `linear-gradient(160deg, ${GOLD}, #b9873a)`, color: NAVY, border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Create Share Link</button>
      </div>

      {newToken && (
        <div style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>Share this link (shown once — the raw token is never stored):</div>
          <code style={{ wordBreak: 'break-all' }}>{`${window.location.origin}/smokecraft/golden-box/packaging-review/${newToken}`}</code>
        </div>
      )}

      <h2 style={{ color: GOLD, fontSize: 16 }}>Active and Revoked Shares</h2>
      {!shares && <div role="status">Loading…</div>}
      {shares && shares.length === 0 && <div style={{ color: 'rgba(229,226,225,0.5)' }}>No shares created yet.</div>}
      {shares && shares.map(s => (
        <div key={s.id} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div>{s.access_type === 'comment_enabled' ? 'Comment Enabled' : 'View Only'}</div>
            <div style={{ fontSize: 12, color: s.revoked_at ? DANGER : 'rgba(229,226,225,0.6)' }}>
              {s.revoked_at ? 'Revoked' : `Accessed ${s.access_count} times`}
            </div>
          </div>
          {!s.revoked_at && <button onClick={() => handleRevoke(s.id)} style={{ minHeight: 40, padding: '6px 12px', background: 'transparent', color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 6, cursor: 'pointer' }}>Revoke</button>}
        </div>
      ))}
      <button onClick={() => navigate(`/smokecraft/golden-box/packaging-studio/${designId}`)} style={{ marginTop: 20, minHeight: 44, padding: '8px 16px', background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Back to Editor</button>
    </div>
    </SmokeCraftScreenShell>
  )
}
