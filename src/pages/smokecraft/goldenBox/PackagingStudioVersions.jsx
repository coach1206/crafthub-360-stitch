import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/packagingStudioApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

const FIELDS = ['boxName', 'woodType', 'exteriorColor', 'finish', 'lidStyle', 'closure', 'interiorLining', 'trayConfiguration', 'engravedText', 'frontText', 'designNotes']

export default function PackagingStudioVersions() {
  const { designId } = useParams()
  const navigate = useNavigate()
  const [versions, setVersions] = useState(null)
  const [compareA, setCompareA] = useState(null)
  const [compareB, setCompareB] = useState(null)

  useEffect(() => {
    api.listVersions(designId).then(res => { if (res.ok) setVersions(res.versions) })
  }, [designId])

  async function handleRestore(versionNumber) {
    const res = await api.restoreVersion(designId, versionNumber)
    if (res.ok) navigate(`/smokecraft/golden-box/packaging-studio/${designId}`)
  }

  const a = versions?.find(v => v.version_number === compareA)
  const b = versions?.find(v => v.version_number === compareB)

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ minHeight: '100vh', background: NAVY, color: CREAM, fontFamily: 'Georgia, serif', padding: 24 }}>
      <h1 style={{ color: GOLD }}>Version History</h1>
      {!versions && <div role="status">Loading versions…</div>}
      {versions && versions.length === 0 && <div>No versions yet.</div>}
      {versions && versions.map(v => (
        <div key={v.version_number} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>v{v.version_number}</strong>{v.is_current && <span style={{ color: GOLD, marginLeft: 8 }}>(current)</span>}
              <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>{new Date(v.created_at).toLocaleString()} · {v.change_note || 'No change note'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCompareA(v.version_number)} style={{ minHeight: 36, padding: '4px 10px', background: compareA === v.version_number ? GOLD : 'transparent', color: compareA === v.version_number ? NAVY : CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Compare A</button>
              <button onClick={() => setCompareB(v.version_number)} style={{ minHeight: 36, padding: '4px 10px', background: compareB === v.version_number ? GOLD : 'transparent', color: compareB === v.version_number ? NAVY : CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Compare B</button>
              {!v.is_current && <button onClick={() => handleRestore(v.version_number)} style={{ minHeight: 36, padding: '4px 10px', background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Restore as new version</button>}
            </div>
          </div>
        </div>
      ))}

      {a && b && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ color: GOLD, fontSize: 16 }}>Comparing v{a.version_number} vs v{b.version_number}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'left', padding: 6 }}>Field</th><th style={{ textAlign: 'left', padding: 6 }}>v{a.version_number}</th><th style={{ textAlign: 'left', padding: 6 }}>v{b.version_number}</th></tr></thead>
            <tbody>
              {FIELDS.map(f => {
                const av = a.snapshot?.[f], bv = b.snapshot?.[f]
                const changed = JSON.stringify(av) !== JSON.stringify(bv)
                return (
                  <tr key={f} style={{ background: changed ? 'rgba(233,193,118,0.08)' : 'transparent' }}>
                    <td style={{ padding: 6, borderTop: `1px solid ${BORDER}` }}>{f}</td>
                    <td style={{ padding: 6, borderTop: `1px solid ${BORDER}` }}>{av ?? '—'}</td>
                    <td style={{ padding: 6, borderTop: `1px solid ${BORDER}` }}>{bv ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={() => navigate(`/smokecraft/golden-box/packaging-studio/${designId}`)} style={{ marginTop: 20, minHeight: 44, padding: '8px 16px', background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Back to Editor</button>
    </div>
    </SmokeCraftScreenShell>
  )
}
