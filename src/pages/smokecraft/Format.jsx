import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1586
const NAT_H = 992

const GOLD = '#E9C176'
// Root-cause fix: non-opaque background let baked image content
// (including the header brand/session zone) bleed through.
const PANEL = {
  background: '#050505',
  border: '1px solid rgba(233,193,118,0.28)',
  borderRadius: 8,
  position: 'absolute',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
}

const FORMAT_ZONES = [
  { id: 'robusto',   label: 'Robusto',   desc: '5" × 50 ring',   burnTime: '45–60 min',  drawFeel: 'Balanced', ringGauge: 50, lengthIn: 5.0, notes: 'The benchmark medium-size. Balanced and concentrated.' },
  { id: 'toro',      label: 'Toro',      desc: '6" × 52 ring',   burnTime: '60–75 min',  drawFeel: 'Open',     ringGauge: 52, lengthIn: 6.0, notes: "Extra length opens up the blend's mid-section." },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring',   burnTime: '75–90 min',  drawFeel: 'Refined',  ringGauge: 48, lengthIn: 7.0, notes: 'Ring gauge keeps it refined. Long smoke, elegant evolution.' },
  { id: 'corona',    label: 'Corona',    desc: '5.5" × 42 ring', burnTime: '35–45 min',  drawFeel: 'Focused',  ringGauge: 42, lengthIn: 5.5, notes: "Smaller ring focuses the wrapper's flavor front and center." },
  { id: 'gordo',     label: 'Gordo',     desc: '6" × 60 ring',   burnTime: '90–120 min', drawFeel: 'Cool',     ringGauge: 60, lengthIn: 6.0, notes: 'Wide ring gauge increases coolness. More complex burn.' },
  { id: 'torpedo',   label: 'Torpedo',   desc: '6.5" × 52 ring', burnTime: '70–85 min',  drawFeel: 'Distinct', ringGauge: 52, lengthIn: 6.5, notes: 'Tapered head concentrates draw. Distinct opening character.' },
]

const ZONE_POS = [
  { x: 11.9, y: 23.8, w: 14.5, h: 22.0 },
  { x: 26.6, y: 23.8, w: 13.8, h: 22.0 },
  { x: 40.6, y: 23.8, w: 14.1, h: 22.0 },
  { x: 11.9, y: 46.1, w: 14.5, h: 20.9 },
  { x: 26.6, y: 46.1, w: 13.8, h: 20.9 },
  { x: 40.6, y: 46.1, w: 14.1, h: 20.9 },
]
const ZONES_FULL = FORMAT_ZONES.map((f, i) => ({ ...f, ...ZONE_POS[i] }))

export default function Format({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setSmokeCraftFormat } = useGuestSession()
  const { journey, setFormat } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const [selected,   setSelected]   = useState(() => journey.format?.id || null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [done,       setDone]       = useState(false)

  const activeFmt = ZONES_FULL.find(f => f.id === selected) || null

  // Auto-persist selection to canonical journey state
  useEffect(() => {
    const fmt = ZONES_FULL.find(f => f.id === selected)
    setFormat(fmt ? { id: fmt.id, label: fmt.label, desc: fmt.desc, burnTime: fmt.burnTime } : null)
    if (fmt) setSmokeCraftFormat({ id: fmt.id, name: fmt.label, desc: fmt.desc })
  }, [selected, setFormat, setSmokeCraftFormat])

  function handleSave() {
    if (!selected) return
    // setFormat already called via useEffect; confirm immediately (honest — real save happened)
    setSaveStatus('saved')
    triggerHaptic('light')
    setTimeout(() => setSaveStatus('idle'), 2500)
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    // Secondary award kept as an internal side effect — the shared
    // completion service only knows about this screen's one primary
    // completionKey ('format'), same pattern as other screens with
    // extra XP/state effects beyond plain award+navigate.
    awardSessionRewards('wrapper-strength')
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('format')
    navigate('/smokecraft/request-purchase')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.format}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Format — Shape, Size & Burn Time"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {ZONES_FULL.map(f => {
          const active = selected === f.id
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.label} — ${f.desc}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => { triggerHaptic('light'); setSelected(active ? null : f.id); setSaveStatus('idle') }}
              style={{
                position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
                width: `${f.w}%`, height: `${f.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Insight panel */}
        {activeFmt && (
          <div style={{ ...PANEL, left: '58%', top: '22%', width: '38%', height: 'auto',
            padding: 'clamp(8px,1vw,14px)', pointerEvents: 'none', zIndex: 3 }}>
            <div style={{ fontSize: 'clamp(10px,0.95vw,13px)', color: GOLD, fontWeight: 700, marginBottom: 6 }}>
              {activeFmt.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginBottom: 8 }}>
              {[['Shape', activeFmt.label], ['Length', `${activeFmt.lengthIn}"`], ['Ring Gauge', `${activeFmt.ringGauge}`],
                ['Draw Feel', activeFmt.drawFeel], ['Burn Time', activeFmt.burnTime]].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                  <div style={{ fontSize: 'clamp(8px,0.72vw,10px)', color: 'rgba(229,226,225,0.82)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 'clamp(7px,0.65vw,9px)', color: 'rgba(229,226,225,0.55)', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 8 }}>
              {activeFmt.notes}
            </div>
            <div style={{ pointerEvents: 'auto' }}>
              <button
                type="button"
                aria-label="Save format selection"
                onClick={handleSave}
                style={{
                  padding: '4px 14px', borderRadius: 5,
                  border: `1px solid ${saveStatus === 'saved' ? 'rgba(233,193,118,0.5)' : GOLD}`,
                  background: saveStatus === 'saved' ? 'rgba(233,193,118,0.1)' : 'transparent',
                  color: GOLD, fontSize: 'clamp(8px,0.7vw,10px)', fontFamily: 'Georgia, serif',
                  fontWeight: 700, cursor: 'pointer', outline: 'none',
                }}
              >
                {saveStatus === 'saved' ? '✓ Format Saved' : 'Save Format'}
              </button>
            </div>
          </div>
        )}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Request / Purchase →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/terroir'))}
      />
    </>
  )
}
