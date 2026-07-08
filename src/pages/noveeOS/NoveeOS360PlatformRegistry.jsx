/**
 * NOVEE OS — Universal 360 Platform Registry Frontend
 * Route: /novee-os/360-platforms
 * contains_secrets: false
 * Reads from /api/novee-os/360-platforms. No live activation.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NAVY     = '#0a0d14'
const CHARCOAL = '#111520'
const CARD     = '#161b27'
const LINE     = '#252d3f'
const GOLD     = '#c9952c'
const GOLD2    = '#e8b84b'
const TEXT     = '#e8e4d8'
const MUTE     = '#7a8299'
const RED      = '#c0392b'
const GREEN    = '#27ae60'
const BLUE     = '#2980b9'
const AMBER    = '#e67e22'

const STATUS_COLORS = {
  active:   GREEN,
  preview:  BLUE,
  reserved: AMBER,
  inactive: MUTE,
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
      color, border: `1px solid ${color}55`, borderRadius: 10, padding: '2px 8px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {label}
    </span>
  )
}

function BoolDot({ val }) {
  return (
    <span style={{ color: val ? GREEN : RED, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>
      {val ? '✓' : '✗'}
    </span>
  )
}

function PlatformCard({ platform }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = STATUS_COLORS[platform.activation_status] || MUTE

  return (
    <div style={{ background: CARD, border: `1px solid ${statusColor}33`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', padding: '18px 20px', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 700, color: TEXT }}>
              {platform.platform_name}
            </span>
            <Badge label={platform.activation_status} color={statusColor} />
            {platform.preview_only && <Badge label="preview-only" color={AMBER} />}
            {platform.reserved_only && <Badge label="reserved" color={RED} />}
            {platform.production_ready && <Badge label="production-ready" color={GREEN} />}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: MUTE }}>
            {platform.platform_key} · {platform.platform_type} · v{platform.version || '0.1.0'}
          </div>
        </div>
        <span style={{ color: MUTE, fontSize: 14, marginTop: 2 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${LINE}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
            {/* Identity */}
            <div>
              <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Identity</div>
              <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['Category', platform.platform_category],
                  ['Type', platform.platform_type],
                  ['Owner Scope', platform.owner_scope],
                  ['Target Market', platform.target_market],
                  ['Target User', platform.target_user_type],
                  ['Brand Family', platform.brand_family],
                  ['Parent Platform', platform.parent_platform],
                ].map(([k, v]) => v ? (
                  <tr key={k}>
                    <td style={{ color: MUTE, paddingRight: 12, paddingBottom: 4 }}>{k}</td>
                    <td style={{ color: TEXT }}>{v}</td>
                  </tr>
                ) : null)}
              </table>
            </div>

            {/* Status */}
            <div>
              <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Status Flags</div>
              <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['Install', platform.install_status],
                  ['Activation', platform.activation_status],
                  ['Entitlement', platform.entitlement_status],
                  ['License', platform.license_status],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: MUTE, paddingRight: 12, paddingBottom: 4 }}>{k}</td>
                    <td style={{ color: TEXT }}>{v}</td>
                  </tr>
                ))}
              </table>
            </div>

            {/* Capabilities */}
            <div>
              <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Capabilities</div>
              <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['AI', platform.ai_supported],
                  ['Coaching', platform.coaching_supported],
                  ['Commerce', platform.commerce_supported],
                  ['Education', platform.education_supported],
                  ['Analytics', platform.analytics_supported],
                  ['Remote Activation', platform.remote_activation_supported],
                  ['White Label', platform.white_label_supported],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: MUTE, paddingRight: 12, paddingBottom: 4 }}>{k}</td>
                    <td><BoolDot val={v} /></td>
                  </tr>
                ))}
              </table>
            </div>

            {/* Production flags */}
            <div>
              <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Production Gates</div>
              <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['Preview Only', platform.preview_only],
                  ['Reserved Only', platform.reserved_only],
                  ['Production Ready', platform.production_ready],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: MUTE, paddingRight: 12, paddingBottom: 4 }}>{k}</td>
                    <td><BoolDot val={v} /></td>
                  </tr>
                ))}
              </table>

              {platform._blockers && platform._blockers.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', textTransform: 'uppercase', color: RED, marginBottom: 6 }}>Blockers</div>
                  {platform._blockers.map((b, i) => (
                    <div key={i} style={{ fontSize: 10, color: RED, marginBottom: 3 }}>• {b}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EcosystemSnapshot({ data }) {
  if (!data) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
      {[
        { label: 'Total Platforms', value: data.total_platforms, color: BLUE },
        { label: 'Active',          value: data.active_platforms, color: GREEN },
        { label: 'Preview',         value: data.preview_platforms, color: AMBER },
        { label: 'Reserved',        value: data.reserved_platforms, color: RED },
        { label: 'Production Ready',value: data.production_ready_count, color: GREEN },
        { label: 'Preview Only',    value: data.preview_only_count, color: AMBER },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ background: CARD, border: `1px solid ${color}33`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, color }}>{value ?? '—'}</div>
          <div style={{ fontSize: 10, color: MUTE, marginTop: 4, letterSpacing: '0.06em' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function NoveeOS360PlatformRegistry() {
  const navigate = useNavigate()
  const [platforms, setPlatforms]   = useState([])
  const [snapshot, setSnapshot]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [filter, setFilter]         = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/novee-os/360-platforms/registry').then(r => r.json()),
      fetch('/api/novee-os/360-platforms/ecosystem-snapshot').then(r => r.json()),
    ])
      .then(([reg, snap]) => {
        setPlatforms(reg.platforms || reg.data || [])
        setSnapshot(snap.snapshot || snap.data || snap)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? platforms : platforms.filter(p => p.activation_status === filter)

  return (
    <div style={{ minHeight: '100dvh', background: NAVY, color: TEXT, fontFamily: '"Hanken Grotesk", sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
        background: CHARCOAL, borderBottom: `1px solid ${LINE}`,
      }}>
        <button
          onClick={() => navigate('/novee-os/command-center')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: MUTE, background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 20,
            padding: '6px 14px', cursor: 'pointer',
          }}
        >
          ← Command Center
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>NOVEE OS</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: TEXT }}>Universal 360 Platform Registry</div>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE }}>14 platforms</div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 80px' }}>
        {/* Ecosystem Snapshot */}
        {snapshot && <EcosystemSnapshot data={snapshot} />}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {['all', 'active', 'preview', 'reserved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                background: filter === f ? GOLD : 'transparent',
                color: filter === f ? NAVY : MUTE,
                border: `1px solid ${filter === f ? GOLD : LINE}`,
              }}
            >
              {f}
            </button>
          ))}
          <span style={{ fontSize: 11, color: MUTE, alignSelf: 'center', marginLeft: 8 }}>
            {filtered.length} platform{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: MUTE, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
            Loading platform registry…
          </div>
        )}

        {error && (
          <div style={{ background: `${RED}11`, border: `1px solid ${RED}44`, borderRadius: 10, padding: 20, marginBottom: 24, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: RED }}>
            API error: {error} — showing local fallback if available.
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: MUTE, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
            No platforms match filter "{filter}".
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(p => <PlatformCard key={p.platform_key || p.id} platform={p} />)}
        </div>

        {/* Safety notice */}
        <div style={{ marginTop: 40, padding: '16px 20px', background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 10, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: MUTE, lineHeight: 1.6 }}>
          REGISTRY NOTE — All platforms with <span style={{ color: AMBER }}>preview_only: true</span> or <span style={{ color: RED }}>reserved_only: true</span> are not available for live use.
          No platform can self-declare <span style={{ color: GREEN }}>production_ready</span> without verified implementation, licensing, documentation, and integration proof.
        </div>
      </main>
    </div>
  )
}
