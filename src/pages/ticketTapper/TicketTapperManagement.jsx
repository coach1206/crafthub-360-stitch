/**
 * Ticket Tapper Management — Phase F.10
 * Internal management view for venue promotions / specials.
 * NO payment processing. NO third-party POS integration. NO live vendor ordering.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const gold = '#E9C176'
const dark = '#0a0603'
const bg = '#0d0906'
const panel = 'rgba(14,8,4,0.96)'
const border = 'rgba(233,193,118,0.18)'
const muted = '#888'
const textMain = '#E5E2E1'

const SAFE_CLAIM = 'ticket_tapper_promotion_backend'
const VENUE_ID = 'novee-grand-lounge'

const PROMOTION_TYPES = [
  { value: 'cigar_special', label: 'Cigar Special' },
  { value: 'drink_special', label: 'Drink Special' },
  { value: 'food_pairing', label: 'Food Pairing' },
  { value: 'partner_special', label: 'Partner Special' },
  { value: 'house_feature', label: 'House Feature' },
]

const ROLES = ['manager','bartender','cook','server','owner','admin']

function StatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(125,220,160,0.12)', border: 'rgba(125,220,160,0.35)', text: '#7ddca0' },
    draft: { bg: 'rgba(150,150,150,0.1)', border: 'rgba(150,150,150,0.3)', text: '#aaa' },
    paused: { bg: 'rgba(255,169,77,0.1)', border: 'rgba(255,169,77,0.3)', text: '#ffa94d' },
    ended: { bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.3)', text: '#ff8080' },
    archived: { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.25)', text: '#666' },
  }
  const c = colors[status] || colors.draft
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text, textTransform: 'uppercase' }}>
      {status}
    </span>
  )
}

function BackendBanner({ backendConnected, persistenceMode }) {
  if (backendConnected) {
    return (
      <div style={{ fontSize: 11, color: '#7ddca0', background: 'rgba(125,220,160,0.08)',
        border: '1px solid rgba(125,220,160,0.2)', borderRadius: 6, padding: '6px 12px', marginBottom: 16 }}>
        Ticket Tapper Backend Connected — promotions persist to database.
      </div>
    )
  }
  return (
    <div style={{ fontSize: 11, color: '#ffa94d', background: 'rgba(255,169,77,0.07)',
      border: '1px solid rgba(255,169,77,0.2)', borderRadius: 6, padding: '6px 12px', marginBottom: 16 }}>
      Local Preview Mode — backend not connected. Promotions shown from local seed data.
    </div>
  )
}

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`/api/ticket-tapper/promotions${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) return { ok: false, backendConnected: false }
    return await res.json()
  } catch {
    return { ok: false, backendConnected: false }
  }
}

export default function TicketTapperManagement() {
  const navigate = useNavigate()
  const [promotions, setPromotions] = useState([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [persistenceMode, setPersistenceMode] = useState('local_fallback')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '',
    promotionType: 'drink_special', promotedByRole: 'manager',
    specialPrice: '', regularPrice: '', callToAction: 'Add Special',
    badgeLabel: '',
  })
  const [actionMsg, setActionMsg] = useState(null)

  const loadPromotions = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch(`/?venueId=${VENUE_ID}`)
    if (result?.success && result?.data?.promotions) {
      setPromotions(result.data.promotions)
      setBackendConnected(result.backendConnected ?? false)
      setPersistenceMode(result.persistenceMode || 'local_fallback')
    } else {
      // local seed fallback
      setBackendConnected(false)
      setPersistenceMode('local_fallback')
      setPromotions([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadPromotions() }, [loadPromotions])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    const result = await apiFetch('/', {
      method: 'POST',
      body: JSON.stringify({
        venueId: VENUE_ID,
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        promotionType: form.promotionType,
        promotedByRole: form.promotedByRole,
        specialPrice: form.specialPrice ? parseFloat(form.specialPrice) : null,
        regularPrice: form.regularPrice ? parseFloat(form.regularPrice) : null,
        discountAmount: (form.regularPrice && form.specialPrice)
          ? Math.max(0, parseFloat(form.regularPrice) - parseFloat(form.specialPrice)) : null,
        callToAction: form.callToAction || 'Add Special',
        badgeLabel: form.badgeLabel || null,
        approvalStatus: 'auto_approved',
      }),
    })
    if (result?.success) {
      setActionMsg({ type: 'success', msg: `Promotion created${result.backendConnected ? ' — saved to backend.' : ' locally (backend not connected).'}` })
      setForm({ title: '', subtitle: '', description: '', promotionType: 'drink_special', promotedByRole: 'manager', specialPrice: '', regularPrice: '', callToAction: 'Add Special', badgeLabel: '' })
      await loadPromotions()
    } else {
      setActionMsg({ type: 'error', msg: 'Failed to create promotion. Backend may be unavailable.' })
    }
    setCreating(false)
    setTimeout(() => setActionMsg(null), 4000)
  }

  async function handleActivate(promotionId) {
    const result = await apiFetch(`/${promotionId}/activate`, { method: 'POST' })
    setActionMsg({ type: result?.success ? 'success' : 'error', msg: result?.success ? 'Promotion activated.' : 'Activate failed.' })
    await loadPromotions()
    setTimeout(() => setActionMsg(null), 3000)
  }

  async function handleDeactivate(promotionId) {
    const result = await apiFetch(`/${promotionId}/deactivate`, { method: 'POST' })
    setActionMsg({ type: result?.success ? 'success' : 'error', msg: result?.success ? 'Promotion paused.' : 'Deactivate failed.' })
    await loadPromotions()
    setTimeout(() => setActionMsg(null), 3000)
  }

  const inp = { width: '100%', padding: '9px 11px', borderRadius: 7, border: `1px solid ${border}`,
    background: 'rgba(255,255,255,0.04)', color: textMain, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }
  const sel = { ...inp, appearance: 'none' }
  const lbl = { fontSize: 10, color: muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, fontFamily: 'system-ui,sans-serif', padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: `1px solid ${border}`, color: gold, borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontSize: 12 }}>
          ← Back
        </button>
        <div>
          <div style={{ color: gold, fontSize: 20, fontWeight: 900, letterSpacing: '-0.01em' }}>Ticket Tapper</div>
          <div style={{ fontSize: 11, color: muted }}>Promotion Management — {VENUE_ID}</div>
        </div>
      </div>

      <BackendBanner backendConnected={backendConnected} persistenceMode={persistenceMode} />

      {/* Disclaimer */}
      <div style={{ fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 6, padding: '6px 10px', marginBottom: 20 }}>
        Internal management only. No payment processing. No third-party POS provider connection. No live vendor ordering.
        Safe claim: {SAFE_CLAIM}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div style={{ fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 8, marginBottom: 16,
          color: actionMsg.type === 'success' ? '#7ddca0' : '#ff8080',
          background: actionMsg.type === 'success' ? 'rgba(125,220,160,0.08)' : 'rgba(255,128,128,0.08)',
          border: `1px solid ${actionMsg.type === 'success' ? 'rgba(125,220,160,0.25)' : 'rgba(255,128,128,0.25)'}` }}>
          {actionMsg.msg}
        </div>
      )}

      {/* Create form */}
      <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ color: gold, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Create Promotion</div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Title *</label>
              <input required style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Smoked Wings + Old Fashioned" />
            </div>
            <div>
              <label style={lbl}>Subtitle</label>
              <input style={inp} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Tonight's SmokeCraft Pairing" />
            </div>
            <div>
              <label style={lbl}>Badge Label</label>
              <input style={inp} value={form.badgeLabel} onChange={e => setForm(f => ({ ...f, badgeLabel: e.target.value }))} placeholder="Tonight Only" />
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select style={sel} value={form.promotionType} onChange={e => setForm(f => ({ ...f, promotionType: e.target.value }))}>
                {PROMOTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Promoted By Role</label>
              <select style={sel} value={form.promotedByRole} onChange={e => setForm(f => ({ ...f, promotedByRole: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Special Price ($)</label>
              <input type="number" step="0.01" style={inp} value={form.specialPrice} onChange={e => setForm(f => ({ ...f, specialPrice: e.target.value }))} placeholder="24.00" />
            </div>
            <div>
              <label style={lbl}>Regular Price ($)</label>
              <input type="number" step="0.01" style={inp} value={form.regularPrice} onChange={e => setForm(f => ({ ...f, regularPrice: e.target.value }))} placeholder="28.00" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Call to Action</label>
              <input style={inp} value={form.callToAction} onChange={e => setForm(f => ({ ...f, callToAction: e.target.value }))} placeholder="Add Special" />
            </div>
          </div>
          <button type="submit" disabled={creating} style={{
            marginTop: 4, padding: '10px 22px', background: gold, color: dark, border: 'none',
            borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1,
          }}>
            {creating ? 'Creating…' : 'Create Promotion'}
          </button>
        </form>
      </div>

      {/* Promotion list */}
      <div style={{ color: gold, fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
        Promotions {promotions.length > 0 ? `(${promotions.length})` : ''}
      </div>

      {loading && <div style={{ color: muted, fontSize: 12, padding: 20 }}>Loading…</div>}

      {!loading && promotions.length === 0 && (
        <div style={{ color: muted, fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
          No promotions found for {VENUE_ID}.
          {!backendConnected && ' Backend not connected — create a promotion above to test local flow.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {promotions.map(p => (
          <div key={p.promotion_id} style={{ background: panel, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: textMain }}>{p.title}</div>
                {p.subtitle && <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{p.subtitle}</div>}
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: muted }}>{p.promotion_type}</span>
              {p.promoted_by_role && <span style={{ fontSize: 10, color: muted }}>{p.promoted_by_role}</span>}
              {p.special_price != null && <span style={{ fontSize: 12, color: gold, fontWeight: 800 }}>${parseFloat(p.special_price).toFixed(2)}</span>}
              {p.regular_price != null && <span style={{ fontSize: 11, color: '#666', textDecoration: 'line-through' }}>${parseFloat(p.regular_price).toFixed(2)}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {p.status !== 'active' && (
                <button onClick={() => handleActivate(p.promotion_id)} style={{ padding: '5px 14px', background: 'rgba(125,220,160,0.1)', border: '1px solid rgba(125,220,160,0.3)', color: '#7ddca0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                  Activate
                </button>
              )}
              {p.status === 'active' && (
                <button onClick={() => handleDeactivate(p.promotion_id)} style={{ padding: '5px 14px', background: 'rgba(255,169,77,0.1)', border: '1px solid rgba(255,169,77,0.3)', color: '#ffa94d', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                  Pause
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
