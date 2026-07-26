import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../services/goldenBox/packagingStudioApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const WALNUT = '#3b2a1e'

export default function PackagingStudioDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get('entryId')
  const [designs, setDesigns] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    api.listDesigns().then(res => {
      if (!res.ok) { setState('error'); return }
      setDesigns(res.designs || [])
      setState('ready')
    })
  }, [])

  async function handleCreate() {
    const res = await api.createDesign()
    if (!res.ok) return
    if (entryId) await api.associateEntry(res.design.design_id, entryId)
    navigate(`/smokecraft/golden-box/packaging-studio/${res.design.design_id}${entryId ? `?entryId=${entryId}` : ''}`)
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #05070c)`, color: CREAM, fontFamily: 'Georgia, serif', padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 28, marginBottom: 4 }}>Golden Box Packaging Studio</h1>
        <p style={{ color: 'rgba(229,226,225,0.7)', marginBottom: 20 }}>Design the physical presentation box for your Golden Box entry.</p>

        <button onClick={handleCreate} style={{
          background: `linear-gradient(160deg, ${GOLD}, #b9873a)`, color: NAVY, border: 'none', borderRadius: 8,
          padding: '14px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 24, minHeight: 48,
        }}>+ New Packaging Design</button>

        {state === 'loading' && <div role="status">Loading your designs…</div>}
        {state === 'error' && <div role="alert" style={{ color: '#ff9696' }}>Could not load your designs — please try again.</div>}
        {state === 'ready' && designs.length === 0 && (
          <div style={{ padding: 24, border: `1px dashed ${BORDER}`, borderRadius: 10, textAlign: 'center', color: 'rgba(229,226,225,0.6)' }}>
            No packaging designs yet. Create your first design above.
          </div>
        )}
        {state === 'ready' && designs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {designs.map(d => (
              <button key={d.design_id} onClick={() => navigate(`/smokecraft/golden-box/packaging-studio/${d.design_id}`)}
                style={{ textAlign: 'left', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, cursor: 'pointer', color: CREAM, minHeight: 48 }}>
                <div style={{ height: 90, background: WALNUT, borderRadius: 6, marginBottom: 10 }} aria-hidden="true" />
                <div style={{ fontWeight: 700 }}>{d.box_name || 'Untitled Design'}</div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>
                  {d.status === 'submitted' ? 'Submitted' : d.status === 'archived' ? 'Archived' : 'Draft'} · v{d.current_version}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
