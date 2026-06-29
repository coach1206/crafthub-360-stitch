import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
import PoweredByNoveeOSBadge from '../../components/shared/PoweredByNoveeOSBadge.jsx'
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

const NOT_YET_AVAILABLE = ['Korona POS', 'Micros Simphony', 'Oracle Hospitality', 'PAX']

const SYNC_HEALTH_ROWS = [
  ['Menu Sync', '30s ago'], ['Table Sync', '45s ago'], ['Order Routing', '15s ago'],
  ['Payments Reconciliation', '1m ago'], ['Staff Mapping', '2m ago'],
  ['Customer/Member Mapping', '2m ago'], ['Analytics Import', '3m ago'],
]

const FOOTER_STRIP = [
  ['verified', 'Unified Design System', 'Consistent · Premium · Timeless'],
  ['touch_app', 'Touch-First Experience', 'Built for speed and hospitality'],
  ['insights', 'Real-Time Intelligence', 'Data that drives decisions'],
  ['shield', 'Secure & Managed', 'Enterprise grade control'],
  ['storefront', 'Built for Hospitality', 'Elevated experiences always'],
]

/** POS3 External Integration Hub — manage all 13 provider connections (local sample data, see posSyncService.js). */
export default function POSIntegrationHub() {
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [syncSensitivity, setSyncSensitivity] = useState(1)
  const [autoRecovery, setAutoRecovery] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const providers = getPosProviders()
  const configs = getAllConfigs()
  const [activeProvider, setActiveProvider] = useState(null)
  const [managingProvider, setManagingProvider] = useState(null)


  function openProvider(provider) {
    const cfg = configs[provider.id]
    if (cfg && (cfg.status === 'connected' || cfg.status === 'sync_active' || cfg.status === 'needs_credentials')) {
      setManagingProvider(provider)
    } else {
      setActiveProvider(provider)
    }
  }
  function closeWizard() { setActiveProvider(null); refresh() }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif',
      background: '#f7f6f0', color: '#1c2230', fontSize: 13,
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

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: L_GOLD, fontWeight: 700 }}>POS3</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>Integrations Hub</div>
            <div style={{ fontSize: 11.5, color: '#9c7320', fontWeight: 700 }}>The Vault Lounge</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input placeholder="Search providers, systems…" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.14)', fontSize: 12, width: 200 }} />
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

        <div style={{ padding: 22, flex: 1 }}>
          {/* Sync Engine hero — locked visual layer: exact crop from the approved
              target image public/smokecraft/images/POS 3 Intergration hub.png
              (src/assets/pos3-integration-crops/sync-hero.png). The image is a
              photographic background, so any text painted on top of it cannot
              be masked cleanly — only fully transparent click hot-zones are
              layered on top, the pixels themselves are left untouched. */}
          <div style={{
            position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 22,
            boxShadow: '0 22px 48px rgba(0,0,0,0.4), 0 2px 0 rgba(201,149,44,0.5) inset',
            border: '1px solid rgba(201,149,44,0.4)', lineHeight: 0,
          }}>
            <img src="/assets/pos3-integration/sync-hero.png" alt="POS3 Sync Engine" style={{ display: 'block', width: '100%', height: 'auto' }} />

            {/* transparent overlay: View All Integrations button hot-zone */}
            <button
              type="button"
              onClick={() => window.alert('View All Integrations — full integrations directory, backend pending.')}
              style={{
                position: 'absolute', left: '3.1%', top: '40.4%', width: '20%', height: '7.7%',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
              aria-label="View All Integrations"
            />

            {/* transparent overlay: provider node hot-zones for click affordance, positioned via the same radial math used in the target image */}
            <ProviderRingHotzones providers={providers} configs={configs} onOpen={openProvider} />
          </div>

          <div style={{ display: 'flex', gap: 18 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
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
                        background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderTop: '3px solid rgba(201,149,44,0.3)', borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(19,41,75,0.06)',
                      }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{name}</span>
                        <span title="Backend pending — TODO: connect to real integration provider API." style={{ fontSize: 10, color: '#8b95a3', fontWeight: 700 }}>Soon</span>
                      </div>
                    ))}
                  </div>

                  {/* Live Integration Activity + Integration Tools — dark navy panels, mapped from target */}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <DarkPanel title="Live Integration Activity" badge="Live" style={{ flex: 1, minWidth: 280 }}>
                      {[
                        ['inventory_2', 'Square: Menu updated', '2 sec ago'],
                        ['receipt_long', 'Clover: Order #1028 completed', '18 sec ago'],
                        ['badge', 'Toast: Staff clock-in sync', '45 sec ago'],
                        ['credit_card', 'Stripe Terminal: Payment captured', '1 min ago'],
                      ].map(([icon, text, time], i) => (
                        <div key={text} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                          borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          animation: reducedMotion ? 'none' : 'feedSlideIn 0.4s ease-out',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c9952c' }}>{icon}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', flex: 1 }}>{text}</span>
                          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{time}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#5fd98a', background: 'rgba(95,217,138,0.12)', borderRadius: 999, padding: '2px 8px' }}>Synced</span>
                        </div>
                      ))}
                    </DarkPanel>

                    <DarkPanel title="Integration Tools" style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                          <span>Sync Sensitivity</span>
                        </div>
                        <input type="range" min={0} max={2} step={1} value={syncSensitivity} onChange={(e) => setSyncSensitivity(Number(e.target.value))} style={{ width: '100%', accentColor: '#c9952c' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(255,255,255,0.4)' }}>
                          <span>Relaxed</span><span>Balanced</span><span>Strict</span>
                        </div>
                      </div>
                      <DarkToggleRow label="Auto-Recovery" note="Automatically retry failed syncs" value={autoRecovery} onChange={setAutoRecovery} />
                      <DarkToggleRow label="Maintenance Mode" note="Pause all non-critical syncs" value={maintenanceMode} onChange={setMaintenanceMode} />
                      <button type="button" onClick={() => window.alert('Advanced Settings — backend pending, TODO.')} style={{
                        marginTop: 10, width: '100%', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#fff',
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        Advanced Settings
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                      </button>
                    </DarkPanel>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 300, flexShrink: 0 }}>
              <RightPanel title="System Health" chip="All Systems Operational">
                {SYNC_HEALTH_ROWS.map(([row, time]) => (
                  <div key={row} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '7px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
                    <div>
                      <div style={{ color: L_NAVY, fontWeight: 600 }}>{row}</div>
                      <div style={{ color: '#9aa3b2', fontSize: 10.5 }}>Last sync: {time}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1f7a45', background: 'rgba(46,160,90,0.12)', borderRadius: 999, padding: '3px 9px' }}>Healthy</span>
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => navigate('/pos3/settings')} style={{ fontSize: 12, fontWeight: 700, padding: '10px 12px', borderRadius: 10, border: 'none', background: L_NAVY, color: '#fff', cursor: 'pointer' }}>Go to POS3 Bridge</button>
                  <button type="button" onClick={() => window.alert('Full sync dashboard — backend pending, TODO: connect POS3 Bridge backend.')} style={{ fontSize: 12, fontWeight: 700, padding: '10px 12px', borderRadius: 10, border: `1px solid ${L_GOLD}`, background: 'transparent', color: '#9c7320', cursor: 'pointer' }}>View Full Sync Dashboard</button>
                </div>
              </RightPanel>

              <div style={{ marginTop: 14, fontSize: 10, color: '#8b95a3', textAlign: 'center' }}>
                Local demo data only · Security & compliance review pending backend connection
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <PoweredByNoveeOSBadge variant="card" showSubtitle animated={!reducedMotion} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer command strip */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px', background: L_NAVY, marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
            {FOOTER_STRIP.map(([icon, title, sub]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: L_GOLD }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: L_GOLD, letterSpacing: '0.06em' }}>E.A.T. COMMAND</div>
        </div>
      </div>

      {activeProvider && (
        <POSConnectionWizard provider={activeProvider} onClose={closeWizard} onActivated={closeWizard} />
      )}
      <style>{`
        @keyframes feedSlideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        button:active { transform: translateY(1px); }
      `}</style>
    </div>
  )
}

/** Transparent click hot-zones over each provider node baked into the locked sync-hero image, positioned by the same radial layout the target image uses. */
function ProviderRingHotzones({ providers, configs, onOpen }) {
  const total = providers.length
  return (
    <div style={{ position: 'absolute', left: '20%', top: '4%', width: '60%', height: '78%' }}>
      {providers.slice(0, 11).map((p, i) => {
        const angle = (i / Math.min(total, 11)) * 2 * Math.PI - Math.PI / 2
        const x = 50 + Math.cos(angle) * 42
        const y = 48 + Math.sin(angle) * 42
        return (
          <button key={p.id} type="button" onClick={() => onOpen?.(p)}
            title={`${p.name} — ${configs[p.id]?.status ? configs[p.id].status.replace('_', ' ') : 'not connected'}`}
            style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
              width: 64, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 999,
            }} />
        )
      })}
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>{children.toUpperCase()}</div>
}

function RightPanel({ title, chip, children }) {
  return (
    <div style={{
      background: 'linear-gradient(165deg, #ffffff 0%, #fbf8f1 100%)', border: '1px solid rgba(19,41,75,0.08)',
      borderTop: `3px solid ${L_GOLD}`, borderRadius: 18, padding: 18,
      boxShadow: '0 16px 32px rgba(19,41,75,0.14), 0 2px 4px rgba(19,41,75,0.06), 0 1px 0 rgba(255,255,255,0.7) inset',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: L_NAVY, letterSpacing: '0.04em' }}>{title.toUpperCase()}</div>
        {chip && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#1f7a45', background: 'rgba(46,160,90,0.12)', borderRadius: 999, padding: '2px 8px' }}>{chip}</span>}
      </div>
      {children}
    </div>
  )
}

function DarkPanel({ title, badge, children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #20273a 0%, #0a0d12 100%)', borderRadius: 18, padding: 18,
      border: '1px solid rgba(201,149,44,0.22)',
      boxShadow: '0 18px 36px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset',
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>{title.toUpperCase()}</div>
        {badge && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#5fd98a', background: 'rgba(95,217,138,0.12)', borderRadius: 999, padding: '2px 8px' }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function DarkToggleRow({ label, note, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{note}</div>}
      </div>
      <button type="button" onClick={() => onChange(!value)} aria-pressed={value} style={{
        width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: value ? '#c9952c' : 'rgba(255,255,255,0.18)', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.15s',
        }} />
      </button>
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
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, border: '1px solid rgba(19,41,75,0.08)', borderTop: `3px solid ${L_GOLD}`, boxShadow: '0 6px 16px rgba(19,41,75,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: L_NAVY }}>{provider.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onReconfigure} style={{ background: 'none', border: `1px solid ${L_GOLD}`, color: '#9c7320', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Reconfigure</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(19,41,75,0.14)', color: L_NAVY, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Back to All Providers</button>
        </div>
      </div>
      <POSSyncStatusPanel syncStatus={syncStatus} history={history} onPause={handlePause} onResume={handleResume} />
    </div>
  )
}
