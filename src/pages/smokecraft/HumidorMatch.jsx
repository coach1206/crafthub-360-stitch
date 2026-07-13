import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'
const RED  = '#e05a5a'
const GREEN = '#5adb8e'
const AMBER = '#f0a830'

const ENVIRONMENTS = [
  { id: 'main_floor',    label: 'Main Floor Humidor' },
  { id: 'walk_in',       label: 'Walk-In Humidor' },
  { id: 'vip_lounge',   label: 'VIP Lounge Humidor' },
  { id: 'private_room', label: 'Private Room Storage' },
]

// Common cigar selections — guest picks from these or enters custom
const CIGAR_PRESETS = [
  { name: 'Oliva Serie V',       origin: 'Nicaragua',          wrapper: 'Habano Maduro',  strength: 'Full',        body: 'Full',   tastingProfile: 'Dark chocolate, leather, espresso' },
  { name: 'Arturo Fuente Opus X', origin: 'Dominican Republic', wrapper: 'Dominican',      strength: 'Full',        body: 'Full',   tastingProfile: 'Spice, cedar, roasted coffee' },
  { name: 'Padron 1964 Series',  origin: 'Nicaragua',          wrapper: 'Natural Maduro', strength: 'Medium-Full', body: 'Full',   tastingProfile: 'Cocoa, earth, toasted nuts' },
  { name: 'Macanudo Café',       origin: 'Dominican Republic', wrapper: 'Connecticut',    strength: 'Mild',        body: 'Light',  tastingProfile: 'Cream, cedar, mild spice' },
  { name: 'CAO Flathead',        origin: 'Nicaragua',          wrapper: 'Cameroon',       strength: 'Medium',      body: 'Medium', tastingProfile: 'Sweet oak, leather, black cherry' },
  { name: 'Romeo y Julieta 1875',origin: 'Dominican Republic', wrapper: 'Connecticut',    strength: 'Mild-Medium', body: 'Light',  tastingProfile: 'Toasted wood, hints of honey, smooth' },
  { name: 'My Father Le Bijou',  origin: 'Nicaragua',          wrapper: 'San Andrés',     strength: 'Full',        body: 'Full',   tastingProfile: 'Dark earth, pepper, dried fruit' },
  { name: 'Cohiba Siglo VI',     origin: 'Dominican Republic', wrapper: 'Ecuador Natural', strength: 'Medium',     body: 'Medium', tastingProfile: 'Floral, cedar, subtle pepper' },
]

const WRAPPER_OPTIONS = ['Connecticut', 'Habano', 'Maduro', 'San Andrés', 'Cameroon', 'Ecuador Natural', 'Corojo']
const STRENGTH_OPTIONS = ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full']

const MODE_LABELS = {
  not_configured: { text: 'NOT CONFIGURED', color: 'rgba(180,180,180,0.7)' },
  demo:           { text: 'DEMO MODE',      color: AMBER },
  manual:         { text: 'MANUAL ENTRY',   color: GOLD },
  offline:        { text: 'OFFLINE',        color: RED },
  live:           { text: 'LIVE',           color: GREEN },
}

const API = '/api/smokecraft/humidor/environment'

function Pill({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 800,
      letterSpacing: '0.14em', padding: '2px 8px', borderRadius: 99,
      border: `1px solid ${color}`, color, background: 'rgba(0,0,0,0.6)',
      textTransform: 'uppercase',
    }}>{label}</span>
  )
}

function StatBox({ label, value, unit, dimmed }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', color: dimmed ? 'rgba(229,226,225,0.25)' : '#fff', lineHeight: 1 }}>
        {value != null ? value : '—'}
        {value != null && <span style={{ fontSize: 12, marginLeft: 2, color: dimmed ? 'rgba(229,226,225,0.25)' : 'rgba(229,226,225,0.6)' }}>{unit}</span>}
      </div>
    </div>
  )
}

function MiniChart({ data }) {
  if (!data || data.length === 0) return null
  const temps = data.map(d => d.temp)
  const humids = data.map(d => d.humidity)
  const minT = Math.min(...temps), maxT = Math.max(...temps) + 0.01
  const minH = Math.min(...humids), maxH = Math.max(...humids) + 0.01
  const W = 260, H = 36

  const pts = (arr, mn, mx) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * W},${H - ((v - mn) / (mx - mn)) * H}`).join(' ')

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
        24-Hour Trend
      </div>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        <polyline points={pts(temps, minT, maxT)} fill="none" stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" />
        <polyline points={pts(humids, minH, maxH)} fill="none" stroke="#7ec8e3" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 2" />
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <span style={{ fontSize: 9, color: GOLD }}>— Temp</span>
        <span style={{ fontSize: 9, color: '#7ec8e3' }}>- - Humidity</span>
      </div>
    </div>
  )
}

export default function HumidorMatch() {
  const { awardSessionRewards, setHumidorMatchSelection, setSelectedHumidorRecommendation } = useGuestSession()
  const { journey, setSelectedCigar } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [env, setEnv] = useState(null)            // API response
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [viewMode, setViewMode] = useState('status') // 'status' | 'manual' | 'mode'
  const [manualTemp, setManualTemp] = useState('')
  const [manualHumidity, setManualHumidity] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState(null)

  const [selectedEnv, setSelectedEnv] = useState(() =>
    localStorage.getItem('sc_humidor_env') || null
  )
  const [done, setDone] = useState(false)

  // Cigar selection state — restored from journey
  const [cigarMode, setCigarMode] = useState('preset') // 'preset' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const saved = journey.selectedCigar
    if (!saved) return null
    return CIGAR_PRESETS.find(c => c.name === saved.name) || null
  })
  const [customCigar, setCustomCigar] = useState(() => {
    const saved = journey.selectedCigar
    if (!saved || CIGAR_PRESETS.find(c => c.name === saved.name)) return { name: '', origin: '', wrapper: '', strength: '' }
    return { name: saved.name || '', origin: saved.origin || '', wrapper: saved.wrapper || '', strength: saved.strength || '' }
  })

  const activeCigar = cigarMode === 'preset'
    ? (selectedPreset || null)
    : (customCigar.name.trim() ? customCigar : null)

  // Persist cigar to journey context whenever it changes
  useEffect(() => {
    if (activeCigar) {
      setSelectedCigar({
        name:           activeCigar.name,
        origin:         activeCigar.origin || '',
        wrapper:        activeCigar.wrapper || '',
        strength:       activeCigar.strength || '',
        body:           activeCigar.body || '',
        format:         journey.format?.label || '',
        tastingProfile: activeCigar.tastingProfile || '',
        description:    activeCigar.description || '',
      })
      // Also write to GuestSessionContext selectedHumidorRecommendation
      setSelectedHumidorRecommendation({
        recommendationType: 'guest_selected',
        cigarId:     activeCigar.name.toLowerCase().replace(/\s+/g, '_'),
        cigarName:   activeCigar.name,
        cigarCountry: activeCigar.origin || '',
        cigarType:   activeCigar.format || journey.format?.label || '',
        wrapper:     activeCigar.wrapper || '',
        strength:    activeCigar.strength || '',
        burnTime:    journey.format?.burnTime || '',
        pairingSuggestion: journey.pairing?.recommendation || '',
        mentorNote:  '',
        matchScore:  null,
      })
    } else {
      setSelectedCigar(null)
    }
  }, [activeCigar?.name, activeCigar?.origin, activeCigar?.wrapper]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEnv = useCallback(async () => {
    try {
      const r = await fetch(API)
      if (!r.ok) throw new Error(`API ${r.status}`)
      const data = await r.json()
      setEnv(data)
      setError(null)
    } catch (e) {
      setError(e.message)
      setEnv({ mode: 'offline', connectionStatus: 'offline', currentTemp: null, currentHumidity: null, dataSource: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEnv() }, [fetchEnv])

  async function submitManual() {
    setManualError(null)
    const t = parseFloat(manualTemp)
    const h = parseFloat(manualHumidity)
    if (isNaN(t) || isNaN(h)) { setManualError('Enter valid numbers for both fields.'); return }
    if (t < 55 || t > 85) { setManualError('Temperature must be 55°F – 85°F.'); return }
    if (h < 50 || h > 90) { setManualError('Humidity must be 50% – 90%.'); return }
    setManualSaving(true)
    try {
      const r = await fetch(`${API}/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp: t, humidity: h }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Save failed')
      setEnv(data)
      setViewMode('status')
    } catch (e) {
      setManualError(e.message)
    } finally {
      setManualSaving(false)
    }
  }

  async function switchMode(mode) {
    const r = await fetch(`${API}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const data = await r.json()
    setEnv(data)
    setViewMode('status')
  }

  async function selectEnvironment(envId) {
    triggerHaptic('light')
    setSelectedEnv(envId)
    localStorage.setItem('sc_humidor_env', envId)
    await fetch(`${API}/selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: envId }),
    }).catch(() => {})
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    if (selectedEnv) {
      const envLabel = ENVIRONMENTS.find(e => e.id === selectedEnv)?.label || selectedEnv
      setHumidorMatchSelection({ id: selectedEnv, label: envLabel, desc: `Environment: ${envLabel}` })
    }
    awardSessionRewards('humidor-match')
    navigate('/smokecraft/request-purchase')
  }

  const modeInfo = MODE_LABELS[env?.mode] || MODE_LABELS.not_configured
  const isNotConfigured = !env || env.mode === 'not_configured'
  const hasData = env?.currentTemp != null && env?.currentHumidity != null

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.humidorMatch}
        alt="SmokeCraft Humidor Match — Select Your Cigar"
      />

      {/* Mask strip — covers baked values in image */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 200,
        background: 'linear-gradient(to top, rgba(10,6,3,0.97) 0%, rgba(10,6,3,0.72) 55%, rgba(10,6,3,0.10) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Main overlay panel */}
      <div style={{
        position: 'fixed', bottom: 110, left: 0, right: 0,
        zIndex: 400, padding: '0 16px', pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.96)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '12px 14px',
          maxWidth: 500,
          margin: '0 auto',
        }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Humidor Conditions
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Pill label={loading ? 'Loading…' : modeInfo.text} color={modeInfo.color} />
              {env?.isStale && <Pill label="STALE" color={RED} />}
            </div>
          </div>

          {/* Status view */}
          {viewMode === 'status' && (
            <>
              {/* Current readings */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <StatBox label="Temp (Current)" value={hasData ? env.currentTemp : null} unit="°F" dimmed={!hasData} />
                <div style={{ width: 1, background: 'rgba(233,193,118,0.15)' }} />
                <StatBox label="Humidity (Current)" value={hasData ? env.currentHumidity : null} unit="%" dimmed={!hasData} />
                <div style={{ width: 1, background: 'rgba(233,193,118,0.15)' }} />
                <StatBox label="Target Temp" value={hasData ? env.targetTemp : null} unit="°F" dimmed={!hasData} />
                <div style={{ width: 1, background: 'rgba(233,193,118,0.15)' }} />
                <StatBox label="Target RH" value={hasData ? env.targetHumidity : null} unit="%" dimmed={!hasData} />
              </div>

              {/* Device info */}
              <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.5)', marginBottom: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Device: <span style={{ color: 'rgba(229,226,225,0.8)' }}>{env?.deviceName || '—'}</span></span>
                <span>ID: <span style={{ color: 'rgba(229,226,225,0.8)' }}>{env?.deviceId || '—'}</span></span>
                <span>Provider: <span style={{ color: 'rgba(229,226,225,0.8)' }}>{env?.provider || '—'}</span></span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.5)', marginBottom: 8 }}>
                Last Sync: <span style={{ color: 'rgba(229,226,225,0.8)' }}>
                  {env?.lastSyncAt ? new Date(env.lastSyncAt).toLocaleTimeString() : '—'}
                </span>
              </div>

              {/* Data source label — always shown */}
              {env?.dataSource && (
                <div style={{
                  fontSize: 9, color: AMBER, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'rgba(240,168,48,0.08)', border: '1px solid rgba(240,168,48,0.25)',
                  borderRadius: 6, padding: '4px 8px', marginBottom: 8,
                }}>
                  {env.dataSource}
                </div>
              )}

              {/* Not configured message */}
              {isNotConfigured && !error && (
                <div style={{
                  fontSize: 10, color: 'rgba(229,226,225,0.5)',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 6,
                  padding: '6px 10px', marginBottom: 8,
                }}>
                  No humidor device has been configured. Use Demo or Manual Entry mode to continue.
                </div>
              )}

              {/* Stale warning */}
              {env?.staleWarning && (
                <div style={{
                  fontSize: 9, color: RED, fontWeight: 600,
                  background: 'rgba(224,90,90,0.08)', border: '1px solid rgba(224,90,90,0.25)',
                  borderRadius: 6, padding: '4px 8px', marginBottom: 8,
                }}>
                  ⚠ {env.staleWarning}
                </div>
              )}

              {/* API error */}
              {error && (
                <div style={{ fontSize: 9, color: RED, marginBottom: 8 }}>
                  Backend error: {error} — showing offline state.
                </div>
              )}

              {/* 24h chart */}
              {env?.chart24h?.length > 0 && <MiniChart data={env.chart24h} />}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { triggerHaptic('light'); setViewMode('manual') }}
                  style={btnStyle('outline')}>Manual Entry</button>
                <button type="button" onClick={() => { triggerHaptic('light'); setViewMode('mode') }}
                  style={btnStyle('outline')}>Switch Mode</button>
                <button type="button" onClick={() => { triggerHaptic('light'); fetchEnv() }}
                  style={btnStyle('ghost')}>Refresh</button>
              </div>
            </>
          )}

          {/* Manual entry view */}
          {viewMode === 'manual' && (
            <>
              <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.6)', marginBottom: 8 }}>
                Enter staff-observed readings. Values are labeled as MANUAL ENTRY and not presented as live sensor data.
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Temp (°F)</div>
                  <input type="number" min={55} max={85} step={0.1} value={manualTemp} onChange={e => setManualTemp(e.target.value)}
                    placeholder="68.5"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px', fontFamily: 'Georgia, serif' }} />
                </label>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Humidity (%)</div>
                  <input type="number" min={50} max={90} step={0.1} value={manualHumidity} onChange={e => setManualHumidity(e.target.value)}
                    placeholder="70.0"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px', fontFamily: 'Georgia, serif' }} />
                </label>
              </div>
              {manualError && <div style={{ fontSize: 10, color: RED, marginBottom: 6 }}>{manualError}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={submitManual} disabled={manualSaving}
                  style={{ ...btnStyle('primary'), opacity: manualSaving ? 0.6 : 1 }}>
                  {manualSaving ? 'Saving…' : 'Save Reading'}
                </button>
                <button type="button" onClick={() => { setViewMode('status'); setManualError(null) }}
                  style={btnStyle('outline')}>Cancel</button>
              </div>
            </>
          )}

          {/* Mode selector view */}
          {viewMode === 'mode' && (
            <>
              <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.6)', marginBottom: 8 }}>
                Choose data source. No mode claims live or connected status unless a real device is verified.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { id: 'not_configured', label: 'Not Configured', desc: 'No device. Values will show as —' },
                  { id: 'demo', label: 'Demo Mode', desc: 'Synthetic values. Clearly labeled. Not real data.' },
                  { id: 'manual', label: 'Manual Entry', desc: 'Staff-entered readings. Enter values on next screen.' },
                  { id: 'offline', label: 'Offline', desc: 'Device registered but not syncing.' },
                ].map(m => (
                  <button key={m.id} type="button" onClick={() => { triggerHaptic('light'); switchMode(m.id) }}
                    style={{
                      background: env?.mode === m.id ? 'rgba(233,193,118,0.12)' : 'transparent',
                      border: `1px solid ${env?.mode === m.id ? GOLD : 'rgba(233,193,118,0.2)'}`,
                      borderRadius: 8, padding: '7px 10px', color: '#fff', textAlign: 'left', cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)', marginTop: 1 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setViewMode('status')} style={{ ...btnStyle('ghost'), marginTop: 8 }}>Back</button>
            </>
          )}

          {/* Environment selection — always visible below */}
          {viewMode === 'status' && (
            <div style={{ borderTop: '1px solid rgba(233,193,118,0.12)', marginTop: 10, paddingTop: 10 }}>
              <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Environment Selection
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ENVIRONMENTS.map(e => {
                  const active = selectedEnv === e.id
                  return (
                    <button key={e.id} type="button" onClick={() => selectEnvironment(e.id)}
                      style={{
                        background: active ? GOLD : 'transparent',
                        color: active ? DARK : GOLD,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.35)'}`,
                        borderRadius: 20, padding: '11px 14px', minHeight: 44,
                        fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif',
                        cursor: 'pointer', letterSpacing: '0.03em',
                      }}
                      data-env={e.id}
                    >
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Cigar Selection ─────────────────────────────────────── */}
          {viewMode === 'status' && (
            <div style={{ borderTop: '1px solid rgba(233,193,118,0.12)', marginTop: 10, paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Cigar Selection
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['preset', 'custom'].map(m => (
                    <button key={m} type="button" onClick={() => { triggerHaptic('light'); setCigarMode(m) }}
                      style={{
                        background: cigarMode === m ? GOLD : 'transparent',
                        color: cigarMode === m ? DARK : GOLD,
                        border: `1px solid ${cigarMode === m ? GOLD : 'rgba(233,193,118,0.35)'}`,
                        borderRadius: 14, padding: '5px 10px', fontSize: 9, fontWeight: 700,
                        fontFamily: 'Georgia, serif', cursor: 'pointer', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >{m === 'preset' ? 'Common Cigars' : 'Custom Entry'}</button>
                  ))}
                </div>
              </div>

              {cigarMode === 'preset' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {CIGAR_PRESETS.map(c => {
                    const active = selectedPreset?.name === c.name
                    return (
                      <button key={c.name} type="button"
                        onClick={() => { triggerHaptic('light'); setSelectedPreset(active ? null : c) }}
                        aria-pressed={active}
                        style={{
                          background: active ? 'rgba(233,193,118,0.12)' : 'transparent',
                          border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.2)'}`,
                          borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: active ? GOLD : '#e5e2e1', fontFamily: 'Georgia, serif' }}>{c.name}</span>
                          <span style={{ fontSize: 9, color: 'rgba(233,193,118,0.55)', letterSpacing: '0.06em' }}>{c.strength}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>
                          {c.origin} · {c.wrapper} · {c.tastingProfile}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {cigarMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label>
                    <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Cigar Name *</div>
                    <input type="text" value={customCigar.name} placeholder="e.g. Cohiba Behike 54"
                      onChange={e => setCustomCigar(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(233,193,118,0.3)', borderRadius: 6, color: '#fff', fontSize: 13, padding: '7px 10px', fontFamily: 'Georgia, serif' }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Origin</div>
                      <input type="text" value={customCigar.origin} placeholder="e.g. Cuba"
                        onChange={e => setCustomCigar(prev => ({ ...prev, origin: e.target.value }))}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(233,193,118,0.3)', borderRadius: 6, color: '#fff', fontSize: 13, padding: '7px 10px', fontFamily: 'Georgia, serif' }} />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Wrapper</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {WRAPPER_OPTIONS.map(w => (
                        <button key={w} type="button" onClick={() => { triggerHaptic('light'); setCustomCigar(prev => ({ ...prev, wrapper: prev.wrapper === w ? '' : w })) }}
                          style={{
                            background: customCigar.wrapper === w ? GOLD : 'transparent',
                            color: customCigar.wrapper === w ? DARK : GOLD,
                            border: `1px solid ${customCigar.wrapper === w ? GOLD : 'rgba(233,193,118,0.3)'}`,
                            borderRadius: 16, padding: '6px 10px', fontSize: 10, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer',
                          }}
                        >{w}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Strength</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {STRENGTH_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => { triggerHaptic('light'); setCustomCigar(prev => ({ ...prev, strength: prev.strength === s ? '' : s })) }}
                          style={{
                            background: customCigar.strength === s ? GOLD : 'transparent',
                            color: customCigar.strength === s ? DARK : GOLD,
                            border: `1px solid ${customCigar.strength === s ? GOLD : 'rgba(233,193,118,0.3)'}`,
                            borderRadius: 16, padding: '6px 10px', fontSize: 10, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer',
                          }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Selected cigar summary */}
              {activeCigar && (
                <div style={{
                  marginTop: 8, background: 'rgba(233,193,118,0.06)',
                  border: '1px solid rgba(233,193,118,0.2)', borderRadius: 8, padding: '8px 10px',
                }}>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Selected Cigar
                  </div>
                  <div style={{ fontSize: 13, color: '#e5e2e1', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
                    {activeCigar.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.65)', marginTop: 2 }}>
                    {[activeCigar.origin, activeCigar.wrapper, activeCigar.strength].filter(Boolean).join(' · ')}
                  </div>
                  {activeCigar.tastingProfile && (
                    <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.5)', fontStyle: 'italic', marginTop: 2 }}>
                      {activeCigar.tastingProfile}
                    </div>
                  )}
                </div>
              )}
              {!activeCigar && (
                <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.45)', marginTop: 6, fontStyle: 'italic' }}>
                  Select a cigar above. This selection carries forward to Request Purchase.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Request Purchase →"
        onPrimary={handleContinue}
      />

      <SmokeCraftMenuButton label="View Menu" />
    </>
  )
}

function btnStyle(variant) {
  const base = {
    borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Georgia, serif',
    cursor: 'pointer', letterSpacing: '0.04em', padding: '11px 14px', minHeight: 44,
  }
  if (variant === 'primary') return { ...base, background: GOLD, color: DARK, border: 'none' }
  if (variant === 'outline') return { ...base, background: 'transparent', color: GOLD, border: `1px solid rgba(233,193,118,0.5)` }
  return { ...base, background: 'transparent', color: 'rgba(229,226,225,0.5)', border: '1px solid rgba(229,226,225,0.2)' }
}
