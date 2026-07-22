import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/packagingStudioApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const OK = '#7fd0a3'
const DANGER = 'rgba(255,150,150,0.9)'

const WOOD_TYPES = ['spanish_cedar', 'mahogany', 'walnut', 'oak', 'maple', 'cherry', 'black_lacquer', 'natural_unfinished']
const FINISHES = ['natural', 'matte', 'satin', 'gloss', 'high_gloss', 'distressed', 'smoked', 'lacquered']
const LID_STYLES = ['hinged', 'lift_off', 'slide_top', 'book_style', 'magnetic_close']
const CLOSURES = ['none', 'magnetic', 'brass_latch', 'champagne_gold_latch', 'wooden_clasp']
const LININGS = ['natural_cedar', 'suede', 'velvet', 'leather', 'fabric', 'paper_wrap', 'unlined']
const TRAYS = ['single_layer', 'double_layer', 'removable_tray', 'individual_channels', 'open_presentation_bed']
const WOOD_COLOR = { spanish_cedar: '#a8663a', mahogany: '#5b2e1e', walnut: '#3b2a1e', oak: '#c8a06a', maple: '#e2c79a', cherry: '#6e2f1f', black_lacquer: '#141414', natural_unfinished: '#d9bd8f' }

function label(key) { return key ? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '' }

function Select({ id, labelText, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>{labelText}{required && ' *'}</label>
      <select id={id} value={value || ''} onChange={e => onChange(e.target.value || null)}
        style={{ width: '100%', minHeight: 44, background: GLASS, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px' }}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{label(o)}</option>)}
      </select>
    </div>
  )
}
function TextField({ id, labelText, value, onChange, maxLength = 200 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>{labelText}</label>
      <input id={id} type="text" value={value || ''} maxLength={maxLength} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', minHeight: 44, background: GLASS, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px' }} />
    </div>
  )
}

export default function PackagingStudioEditor() {
  const { designId } = useParams()
  const navigate = useNavigate()
  const [design, setDesign] = useState(null)
  const [config, setConfig] = useState({})
  const [state, setState] = useState('loading')
  const [saveState, setSaveState] = useState('saved')
  const [view, setView] = useState('closed_front')
  const [assets, setAssets] = useState([])
  const [uploadState, setUploadState] = useState('idle')
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api.getDesign(designId).then(res => {
      if (!res.ok) { setState('error'); return }
      setDesign(res.design)
      setConfig(res.currentVersion?.snapshot || {})
      setState('ready')
    })
  }, [designId])
  useEffect(() => { load() }, [load])

  function set(field, value) { setConfig(c => ({ ...c, [field]: value })); setSaveState('unsaved') }

  async function handleSave() {
    setSaveState('saving')
    const res = await api.saveDraft(designId, config)
    if (res.ok) { setSaveState('saved'); load() } else { setSaveState('unsaved'); setError(res.error) }
  }
  async function handleDuplicate() {
    const res = await api.duplicateDesign(designId)
    if (res.ok) navigate(`/smokecraft/golden-box/packaging-studio/${res.design.design_id}`)
  }
  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState('uploading')
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1]
      const uploadRes = await fetch(`/api/smokecraft/golden-box/packaging-studio/designs/${designId}/assets`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetType: 'logo', filename: file.name, base64Data }),
      })
      const body = await uploadRes.json().catch(() => ({}))
      if (uploadRes.ok) { setUploadState('idle'); setAssets(a => [...a, body.asset]) } else { setUploadState('error'); setError(body.error) }
    }
    reader.readAsDataURL(file)
  }

  if (state === 'loading') return <div style={{ padding: 24, color: CREAM, background: NAVY, minHeight: '100vh' }} role="status">Loading design…</div>
  if (state === 'error' || !design) return <div style={{ padding: 24, color: DANGER, background: NAVY, minHeight: '100vh' }} role="alert">Design not found or not accessible.</div>
  if (design.status === 'submitted') {
    return (
      <div style={{ padding: 24, color: CREAM, background: NAVY, minHeight: '100vh' }}>
        <h2 style={{ color: GOLD }}>This design has been submitted</h2>
        <p>The submitted packaging snapshot is locked and cannot be edited. It remains readable by authorized judges.</p>
      </div>
    )
  }

  const woodColor = WOOD_COLOR[config.woodType] || '#1a1410'

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #05070c)`, color: CREAM, fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', gap: 0, minHeight: '100vh' }}>
        {/* Left: Configuration */}
        <div style={{ borderRight: `1px solid ${BORDER}`, padding: 16, overflowY: 'auto' }}>
          <h2 style={{ color: GOLD, fontSize: 16, marginBottom: 12 }}>Configuration</h2>
          <TextField id="pkg-box-name" labelText="Box Name" value={config.boxName} onChange={v => set('boxName', v)} />
          <TextField id="pkg-subtitle" labelText="Subtitle" value={config.subtitle} onChange={v => set('subtitle', v)} />
          <TextField id="pkg-cigar-capacity" labelText="Cigar Capacity" value={config.cigarCapacity} onChange={v => set('cigarCapacity', v ? Number(v) : null)} maxLength={3} />
          <Select id="pkg-wood" labelText="Wood Type" value={config.woodType} onChange={v => set('woodType', v)} options={WOOD_TYPES} required />
          <Select id="pkg-finish" labelText="Finish" value={config.finish} onChange={v => set('finish', v)} options={FINISHES} required />
          <Select id="pkg-lid" labelText="Lid Style" value={config.lidStyle} onChange={v => set('lidStyle', v)} options={LID_STYLES} required />
          <Select id="pkg-closure" labelText="Closure" value={config.closure} onChange={v => set('closure', v)} options={CLOSURES} />
          <Select id="pkg-lining" labelText="Interior Lining" value={config.interiorLining} onChange={v => set('interiorLining', v)} options={LININGS} />
          <Select id="pkg-tray" labelText="Tray Configuration" value={config.trayConfiguration} onChange={v => set('trayConfiguration', v)} options={TRAYS} />
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="pkg-exterior-color" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>Exterior Color</label>
            <input id="pkg-exterior-color" type="color" value={config.exteriorColor || '#3b2a1e'} onChange={e => set('exteriorColor', e.target.value)}
              style={{ width: '100%', minHeight: 44, background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 6 }} />
          </div>
          <TextField id="pkg-engraved" labelText="Engraved Text" value={config.engravedText} onChange={v => set('engravedText', v)} maxLength={100} />
          <TextField id="pkg-front-text" labelText="Front Text" value={config.frontText} onChange={v => set('frontText', v)} maxLength={100} />
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="pkg-logo-upload" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>Logo Upload</label>
            <input id="pkg-logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} style={{ color: CREAM }} />
            {uploadState === 'uploading' && <div role="status" style={{ fontSize: 12, color: GOLD }}>Uploading…</div>}
            {uploadState === 'error' && <div role="alert" style={{ fontSize: 12, color: DANGER }}>Upload failed: {error}</div>}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="pkg-notes" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>Design Notes</label>
            <textarea id="pkg-notes" value={config.designNotes || ''} onChange={e => set('designNotes', e.target.value)} maxLength={2000}
              style={{ width: '100%', minHeight: 80, background: GLASS, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8 }} />
          </div>
        </div>

        {/* Center: Live Preview */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div role="tablist" aria-label="Preview view" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['closed_top', 'closed_front', 'closed_left', 'closed_right', 'open_box', 'interior_tray', 'presentation'].map(v => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                style={{ minHeight: 40, padding: '8px 14px', borderRadius: 6, border: `1px solid ${view === v ? GOLD : BORDER}`, background: view === v ? 'rgba(233,193,118,0.15)' : 'transparent', color: CREAM, cursor: 'pointer' }}>
                {label(v)}
              </button>
            ))}
          </div>
          <div aria-label={`${label(view)} preview`} style={{
            width: 360, height: 240, borderRadius: 10, position: 'relative', overflow: 'hidden',
            background: view.startsWith('interior') || view === 'open_box'
              ? `linear-gradient(160deg, ${config.interiorLining ? '#4a2f1a' : '#2a1c12'}, #1a1008)`
              : woodColor,
            border: `2px solid ${config.closure === 'champagne_gold_latch' || config.closure === 'brass_latch' ? GOLD : BORDER}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          }}>
            {config.exteriorColor && !view.startsWith('interior') && view !== 'open_box' && (
              <div style={{ position: 'absolute', inset: 0, background: config.exteriorColor, opacity: config.finish === 'matte' ? 0.85 : 0.6, mixBlendMode: 'multiply' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 12 }}>
              <div style={{ color: GOLD, fontSize: 18, fontWeight: 700 }}>{config.boxName || 'Untitled Box'}</div>
              {config.subtitle && <div style={{ color: CREAM, fontSize: 12 }}>{config.subtitle}</div>}
              {view === 'closed_front' && config.frontText && <div style={{ color: CREAM, fontSize: 11, marginTop: 8 }}>{config.frontText}</div>}
              {view === 'closed_top' && config.engravedText && <div style={{ color: 'rgba(233,193,118,0.7)', fontSize: 11, marginTop: 8 }}>{config.engravedText}</div>}
              {(view === 'interior_tray' || view === 'open_box') && <div style={{ color: 'rgba(229,226,225,0.7)', fontSize: 11, marginTop: 8 }}>{label(config.interiorLining) || 'No lining selected'} · {label(config.trayConfiguration) || 'No tray selected'}</div>}
              {!config.woodType && <div style={{ color: 'rgba(229,226,225,0.4)', fontSize: 10, marginTop: 8 }}>No wood selected — neutral preview</div>}
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)', marginTop: 16, maxWidth: 360, textAlign: 'center' }}>
            This is a live, layered CSS mockup driven by your real selections — not a static image or photorealistic 3D render. See documentation for rendering-limitation disclosure.
          </p>
        </div>

        {/* Right: Design Status */}
        <div style={{ borderLeft: `1px solid ${BORDER}`, padding: 16 }}>
          <h2 style={{ color: GOLD, fontSize: 16, marginBottom: 12 }}>Design Status</h2>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Status: <strong>{design.status}</strong></div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Version: <strong>{design.current_version}</strong></div>
          <div style={{ fontSize: 13, marginBottom: 6 }} aria-live="polite">
            Save state: <strong style={{ color: saveState === 'saved' ? OK : saveState === 'saving' ? GOLD : DANGER }}>
              {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Unsaved changes'}
            </strong>
          </div>
          {error && <div role="alert" style={{ fontSize: 12, color: DANGER, marginBottom: 8 }}>{error}</div>}
          <button onClick={handleSave} style={{ width: '100%', minHeight: 44, background: `linear-gradient(160deg, ${GOLD}, #b9873a)`, color: NAVY, border: 'none', borderRadius: 6, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>Save</button>
          <button onClick={handleDuplicate} style={{ width: '100%', minHeight: 44, background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, marginBottom: 8, cursor: 'pointer' }}>Duplicate</button>
          <button onClick={() => navigate(`/smokecraft/golden-box/packaging-studio/${designId}/versions`)} style={{ width: '100%', minHeight: 44, background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, marginBottom: 8, cursor: 'pointer' }}>Version History</button>
          <button onClick={() => navigate(`/smokecraft/golden-box/packaging-studio/${designId}/share`)} style={{ width: '100%', minHeight: 44, background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, marginBottom: 8, cursor: 'pointer' }}>Share</button>
          <button onClick={() => navigate('/smokecraft/golden-box/packaging-studio')} style={{ width: '100%', minHeight: 44, background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer' }}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  )
}
