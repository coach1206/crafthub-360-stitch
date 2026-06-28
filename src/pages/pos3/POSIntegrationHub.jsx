import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
import { Card, Pill } from '../../components/eat/ui.jsx'
import PoweredByNoveeOSBadge from '../../components/shared/PoweredByNoveeOSBadge.jsx'
import SyncEngineOrb from '../../components/pos3/integrations/SyncEngineOrb.jsx'
import POSProviderCard from '../../components/pos3/integrations/POSProviderCard.jsx'
import POSConnectionWizard from '../../components/pos3/integrations/POSConnectionWizard.jsx'
import POSSyncStatusPanel from '../../components/pos3/integrations/POSSyncStatusPanel.jsx'
import { getPosProviders } from '../../data/pos3/posProviders.js'
import { getAllConfigs } from '../../services/pos3/posIntegrationService.js'
import { getSyncStatus, getSyncHistory, pauseSync, activateSync } from '../../services/pos3/posSyncService.js'

const NAV_ITEMS = [
  ['Home', '/pos3', 'home'], ['Tables', '/pos3/tables', 'table_restaurant'], ['Orders', '/pos3/orders', 'receipt_long'],
  ['Reservations', null, 'event'], ['Members', null, 'badge'], ['Payments', '/pos3/checkout', 'payments'],
  ['Bar Orders', '/pos3/bar', 'local_bar'], ['Kitchen Routing', '/pos3/kitchen', 'soup_kitchen'],
  ['Humidor Orders', '/pos3/humidor', 'inventory_2'], ['Reports', null, 'bar_chart'], ['Guest Profile', null, 'person'],
  ['Integrations', '/pos3/integrations', 'sync'], ['Staff Assist', null, 'support_agent'], ['More', '/pos3/settings', 'more_horiz'],
]

const NOT_YET_AVAILABLE = ['Korona POS', 'NCR Aloha', 'Micros Simphony', 'Oracle Hospitality', 'PAX']

const INTEGRATION_TOOLS = [
  { label: 'Add Connector', note: 'Local-only — TODO: connect to real integration provider API.' },
  { label: 'Import Data', note: 'Local-only — TODO: persist integration configuration.' },
  { label: 'API Keys', note: 'TODO: add OAuth/API credential flow where needed.' },
  { label: 'Webhooks', note: 'TODO: add provider-specific sync jobs where needed.' },
  { label: 'Sandbox Mode', note: 'Demo data only, no real network calls.' },
  { label: 'Support Docs', note: 'No docs module connected yet.' },
]

/** POS3 External Integration Hub — manage all 13 provider connections (local sample data, see posSyncService.js). */
export default function POSIntegrationHub() {
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [haptics, setHaptics] = useState(true)
  const [successAnim, setSuccessAnim] = useState(true)
  const [soundFeedback, setSoundFeedback] = useState(false)

  const providers = getPosProviders()
  const configs = getAllConfigs()
  const [activeProvider, setActiveProvider] = useState(null)
  const [managingProvider, setManagingProvider] = useState(null)

  const connectedCount = Object.values(configs).filter((c) => c.status === 'connected' || c.status === 'sync_active').length
  const syncActiveCount = Object.values(configs).filter((c) => c.status === 'sync_active').length

  function openProvider(provider) {
    const cfg = configs[provider.id]
    if (cfg && (cfg.status === 'connected' || cfg.status === 'sync_active' || cfg.status === 'needs_credentials')) {
      setManagingProvider(provider)
    } else {
      setActiveProvider(provider)
    }
  }
  function closeWizard() { setActiveProvider(null); refresh() }

  const textScale = highContrast ? 1.05 : 1
  const baseFont = 13 * fontScale * textScale

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif',
      background: highContrast ? '#fff' : '#f7f6f0', color: highContrast ? '#000' : '#1c2230', fontSize: baseFont,
    }}>
      <nav style={{ width: 220, flexShrink: 0, background: L_NAVY, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 2, minHeight: '100vh' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, padding: '4px 8px 2px' }}>POS3</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, padding: '0 8px 14px', letterSpacing: '0.08em' }}>THE VAULT LOUNGE</div>
        {NAV_ITEMS.map(([label, to, icon]) => (
          <button key={label} type="button"
            onClick={to ? () => navigate(to) : undefined}
            disabled={!to}
            title={!to ? `${label} is not yet built` : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, fontSize: 13,
              border: 'none', textAlign: 'left', cursor: to ? 'pointer' : 'not-allowed',
              color: label === 'Integrations' ? '#1c2230' : 'rgba(255,255,255,0.7)',
              background: label === 'Integrations' ? L_GOLD : 'transparent',
              fontWeight: label === 'Integrations' ? 700 : 500, opacity: to ? 1 : 0.4,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>{label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 14 }}>
          <PoweredByNoveeOSBadge variant="sidebar" compact animated={!reducedMotion} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,149,44,0.3)', color: '#fff' }} />
        </div>
      </nav>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: L_GOLD, fontWeight: 700 }}>POS3</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>Integrations Hub</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input placeholder="Search providers…" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.14)', fontSize: 12, width: 180 }} />
            <select style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.14)', fontSize: 12 }}>
              <option>Lounge Floor</option><option>Patio Floor</option>
            </select>
            <button type="button" title="Staff Assist — local-only, no live chat backend yet" style={{
              fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.14)',
              background: '#fff', color: L_NAVY, cursor: 'pointer',
            }}>Staff Assist</button>
            <PoweredByNoveeOSBadge variant="header" animated={!reducedMotion} />
          </div>
        </div>

        <div style={{ padding: 22 }}>
          {/* Hero: venue background + sync orb + connected systems */}
          <div style={{
            position: 'relative', borderRadius: 18, overflow: 'hidden', padding: '28px 24px', marginBottom: 20,
            background: 'radial-gradient(circle at 15% 20%, rgba(201,149,44,0.16), transparent 50%), radial-gradient(circle at 85% 80%, rgba(154,98,42,0.16), transparent 50%), linear-gradient(160deg, #fbf3e2 0%, #f0e2c4 100%)',
            border: '1px solid rgba(201,149,44,0.25)', boxShadow: 'inset 0 0 40px rgba(154,98,42,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <Pill label="All Systems Operational" tone="open" />
                <div style={{ fontSize: 22, fontWeight: 800, color: L_NAVY, marginTop: 10 }}>POS3 Sync Engine</div>
                <div style={{ fontSize: 12.5, color: '#6b7385', marginTop: 4, maxWidth: 360 }}>
                  Connect The Vault Lounge to external POS, payment, and venue systems. All connections below are local sample data — no live network calls are made yet.
                </div>
                <button type="button" style={{
                  marginTop: 14, fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 10,
                  background: L_NAVY, color: '#fff', border: 'none', cursor: 'pointer',
                }}>View All Integrations</button>
              </div>
              <SyncEngineOrb connectedCount={connectedCount} totalCount={providers.length} reducedMotion={reducedMotion} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 260 }}>
                {providers.slice(0, 8).map((p) => (
                  <span key={p.id} style={{
                    fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 999,
                    background: configs[p.id]?.status === 'connected' || configs[p.id]?.status === 'sync_active' ? 'rgba(47,158,91,0.12)' : 'rgba(19,41,75,0.06)',
                    color: configs[p.id]?.status === 'connected' || configs[p.id]?.status === 'sync_active' ? '#1f7a45' : '#6b7385',
                    border: '1px solid rgba(19,41,75,0.08)',
                  }}>{p.name}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <KpiTile label="Total Providers" value={providers.length} />
                <KpiTile label="Connected" value={connectedCount} accent="#2f9e5b" />
                <KpiTile label="Sync Active" value={syncActiveCount} accent="#7e57c2" />
              </div>

              {managingProvider && (
                <ManagePanel
                  provider={managingProvider}
                  onClose={() => { setManagingProvider(null); refresh() }}
                  onReconfigure={() => { setActiveProvider(managingProvider); setManagingProvider(null) }}
                />
              )}

              {!managingProvider && (
                <>
                  <SectionLabel>Connected Systems</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 22 }}>
                    {providers.map((p) => (
                      <POSProviderCard key={p.id} provider={p} status={configs[p.id]?.status} onOpen={openProvider} />
                    ))}
                  </div>

                  <SectionLabel>Available to Connect</SectionLabel>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
                    {NOT_YET_AVAILABLE.map((name) => (
                      <div key={name} style={{
                        padding: '12px 16px', minWidth: 160, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 12,
                      }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{name}</span>
                        <span title="TODO: connect to real integration provider API." style={{ fontSize: 10, color: '#8b95a3', fontWeight: 700 }}>Soon</span>
                      </div>
                    ))}
                  </div>

                  <SectionLabel>Integration Tools</SectionLabel>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
                    {INTEGRATION_TOOLS.map((t) => (
                      <button key={t.label} type="button" title={t.note} onClick={() => window.alert(`${t.label} — ${t.note}`)} style={{
                        fontSize: 12, fontWeight: 700, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        border: '1px solid rgba(19,41,75,0.12)', background: '#fff', color: L_NAVY,
                      }}>{t.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 300, flexShrink: 0 }}>
              <GlassPanel title="Sync Health Overview">
                {['Menu Sync', 'Table Sync', 'Order Routing', 'Payments Reconciliation', 'Staff Mapping', 'Customer/Member Mapping', 'Analytics Import'].map((row) => (
                  <div key={row} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
                    <span style={{ color: '#4a5266' }}>{row}</span>
                    <Pill label="Local Data" tone="warning" />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => navigate('/pos3/settings')} style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '9px 8px', borderRadius: 9, border: 'none', background: L_NAVY, color: '#fff', cursor: 'pointer' }}>Go to POS3 Bridge</button>
                  <button type="button" onClick={() => window.alert('Full sync dashboard — TODO: connect POS3 Bridge backend.')} style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '9px 8px', borderRadius: 9, border: `1px solid ${L_GOLD}`, background: 'transparent', color: '#9c7320', cursor: 'pointer' }}>View Full Sync Dashboard</button>
                </div>
              </GlassPanel>

              <GlassPanel title="Live Activity Feed" style={{ marginTop: 14 }}>
                {['Square sync completed · 2m ago', 'Toast credential check passed · 9m ago', 'Clover webhook received · 14m ago'].map((row, i) => (
                  <div key={row} style={{
                    fontSize: 12, color: '#1c2230', padding: '6px 0', borderTop: i ? '1px solid rgba(19,41,75,0.06)' : 'none',
                    animation: reducedMotion ? 'none' : 'feedSlideIn 0.4s ease-out',
                  }}>{row}</div>
                ))}
              </GlassPanel>

              <GlassPanel title="Display & Accessibility" style={{ marginTop: 14 }}>
                <SliderRow label="Text Size" value={fontScale} min={0.85} max={1.3} step={0.05} onChange={setFontScale} />
                <ToggleRow label="High Contrast" value={highContrast} onChange={setHighContrast} />
                <ToggleRow label="Reduced Motion" value={reducedMotion} onChange={setReducedMotion} />
              </GlassPanel>

              <GlassPanel title="Haptic & Feedback" style={{ marginTop: 14 }}>
                <ToggleRow label="Haptic Feedback" value={haptics} onChange={setHaptics} />
                <ToggleRow label="Success Animation" value={successAnim} onChange={setSuccessAnim} />
                <ToggleRow label="Sound Feedback" value={soundFeedback} onChange={setSoundFeedback} />
              </GlassPanel>

              <div style={{ marginTop: 14, fontSize: 10, color: '#8b95a3', textAlign: 'center' }}>
                Sample data only · Security & compliance review pending backend connection
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <PoweredByNoveeOSBadge variant="card" showSubtitle animated={!reducedMotion} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProvider && (
        <POSConnectionWizard provider={activeProvider} onClose={closeWizard} onActivated={closeWizard} />
      )}
      <style>{`@keyframes feedSlideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>{children.toUpperCase()}</div>
}

function KpiTile({ label, value, accent = L_NAVY }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b95a3', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function GlassPanel({ title, children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(243,230,200,0.45) 100%)',
      backdropFilter: 'blur(8px)', border: '1px solid rgba(201,149,44,0.22)', borderRadius: 14, padding: 14,
      boxShadow: '0 1px 6px rgba(19,41,75,0.06)', ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.06em', marginBottom: 8 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 12, color: '#4a5266' }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)} aria-pressed={value} style={{
        width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
        background: value ? '#c9952c' : 'rgba(19,41,75,0.18)', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.15s',
        }} />
      </button>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4a5266', marginBottom: 4 }}>
        <span>{label}</span><span>{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#c9952c' }} />
    </div>
  )
}

function ManagePanel({ provider, onClose, onReconfigure }) {
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  const syncStatus = getSyncStatus(provider.id)
  const history = getSyncHistory(provider.id)

  function handlePause() { pauseSync(provider.id); refresh() }
  function handleResume() { activateSync(provider.id, syncStatus.syncOptions); refresh() }

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{provider.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onReconfigure} style={{ background: 'none', border: '1px solid rgba(212,168,67,0.3)', color: '#d4a843', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Reconfigure</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#cdd5df', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Back to All Providers</button>
        </div>
      </div>
      <POSSyncStatusPanel syncStatus={syncStatus} history={history} onPause={handlePause} onResume={handleResume} />
    </Card>
  )
}
