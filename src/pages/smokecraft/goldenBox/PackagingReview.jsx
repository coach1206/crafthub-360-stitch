import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as api from '../../../services/goldenBox/packagingStudioApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'

export default function PackagingReview() {
  const { shareToken } = useParams()
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading')
  const [comment, setComment] = useState('')
  const [posted, setPosted] = useState(false)

  useEffect(() => {
    api.readShared(shareToken).then(res => {
      if (!res.ok) { setState(res.error === 'share_revoked' ? 'revoked' : res.error === 'share_expired' ? 'expired' : 'error'); return }
      setData(res)
      setState('ready')
    })
  }, [shareToken])

  async function handleComment() {
    const res = await api.addSharedComment(shareToken, { body: comment })
    if (res.ok) { setPosted(true); setComment('') }
  }

  if (state === 'loading') return <div style={{ padding: 24, color: CREAM, background: NAVY, minHeight: '100vh' }} role="status">Loading shared design…</div>
  if (state === 'revoked') return <div style={{ padding: 24, color: DANGER, background: NAVY, minHeight: '100vh' }} role="alert">This share link has been revoked by its owner.</div>
  if (state === 'expired') return <div style={{ padding: 24, color: DANGER, background: NAVY, minHeight: '100vh' }} role="alert">This share link has expired.</div>
  if (state === 'error' || !data) return <div style={{ padding: 24, color: DANGER, background: NAVY, minHeight: '100vh' }} role="alert">This share link is not valid.</div>

  const snapshot = data.version?.snapshot || {}
  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: CREAM, fontFamily: 'Georgia, serif', padding: 24 }}>
      <h1 style={{ color: GOLD }}>{data.design.boxName || 'Untitled Packaging Design'}</h1>
      <p style={{ color: 'rgba(229,226,225,0.6)', fontSize: 13 }}>Shared design — {data.accessType === 'comment_enabled' ? 'view and comment' : 'view only'}. You cannot edit this design.</p>
      <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16, maxWidth: 480 }}>
        {Object.entries(snapshot).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ fontSize: 13, marginBottom: 4 }}><strong>{k}:</strong> {String(v)}</div>
        ))}
      </div>
      {data.accessType === 'comment_enabled' && (
        <div style={{ marginTop: 20, maxWidth: 480 }}>
          <label htmlFor="pkg-review-comment" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Leave a comment</label>
          <textarea id="pkg-review-comment" value={comment} onChange={e => setComment(e.target.value)} maxLength={2000}
            style={{ width: '100%', minHeight: 80, background: GLASS, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8 }} />
          <button onClick={handleComment} style={{ minHeight: 44, marginTop: 8, padding: '8px 16px', background: `linear-gradient(160deg, ${GOLD}, #b9873a)`, color: NAVY, border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Post Comment</button>
          {posted && <div role="status" style={{ color: '#7fd0a3', marginTop: 8 }}>Comment posted.</div>}
        </div>
      )}
    </div>
  )
}
