import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'

// 8 flavor note zones in horizontal row (y≈29.3–43.5%)
const FLAVOR_ZONES = [
  { id: 'earth',  label: 'Earth',  x: 10.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'wood',   label: 'Wood',   x: 21.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'spice',  label: 'Spice',  x: 31.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'cocoa',  label: 'Cocoa',  x: 42.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'coffee', label: 'Coffee', x: 52.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'sweet',  label: 'Sweet',  x: 63.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'nuts',   label: 'Nuts',   x: 73.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'floral', label: 'Floral', x: 84.0, y: 29.3, w: 9.7, h: 14.2 },
]

const EMPTY_STATE = {
  selectedFlavors: [],
  intensity: 3, body: 3, strength: 3,
  aromaNotes: [], pairingRecall: '', personalNotes: '',
  savedAt: null,
}

// Live SVG radar chart — 8-axis polygon
function RadarChart({ flavors }) {
  const SIZE = 100
  const CX = 50, CY = 50, R = 38
  const axes = FLAVOR_ZONES.map(z => z.id)
  const N = axes.length

  function polarPoint(i, r) {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0]

  // Data polygon
  const pts = axes.map((ax, i) => {
    const val = flavors.includes(ax) ? 1.0 : 0.1
    return polarPoint(i, R * val)
  })
  const polygon = pts.map(p => p.join(',')).join(' ')

  // Axis lines and labels
  const axisLines = axes.map((_, i) => {
    const [x, y] = polarPoint(i, R)
    return { x1: CX, y1: CY, x2: x, y2: y }
  })

  const labels = axes.map((ax, i) => {
    const [x, y] = polarPoint(i, R + 9)
    return { x, y, text: FLAVOR_ZONES[i].label }
  })

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%" height="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="Flavor memory radar chart"
    >
      {/* Grid rings */}
      {rings.map((r, ri) => {
        const pts = axes.map((_, i) => polarPoint(i, R * r).join(',')).join(' ')
        return (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="rgba(233,193,118,0.18)"
            strokeWidth={0.4}
          />
        )
      })}

      {/* Axis lines */}
      {axisLines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(233,193,118,0.22)" strokeWidth={0.4} />
      ))}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(233,193,118,0.25)"
        stroke={GOLD}
        strokeWidth={0.8}
      />

      {/* Data points */}
      {pts.map(([x, y], i) => (
        flavors.includes(axes[i]) && (
          <circle key={i} cx={x} cy={y} r={1.4} fill={GOLD} />
        )
      ))}

      {/* Axis labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x} y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={4.5}
          fill="rgba(229,226,225,0.75)"
          style={{ userSelect: 'none', fontFamily: 'Georgia, serif' }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  )
}

export default function FlavorMemory() {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey, setFlavorMemory } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [fm, setFm] = useState(() => {
    const saved = journey.flavorMemory
    return saved ? { ...EMPTY_STATE, ...saved } : { ...EMPTY_STATE }
  })
  const [done, setDone] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setFlavorMemory(fm)
  }, [fm]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFlavor(id) {
    triggerHaptic('light')
    setFm(prev => ({
      ...prev,
      selectedFlavors: prev.selectedFlavors.includes(id)
        ? prev.selectedFlavors.filter(x => x !== id)
        : [...prev.selectedFlavors, id],
    }))
  }

  const saveToBackend = useCallback(async (data) => {
    try {
      await fetch('/api/modules/smokecraft/pairing/flavor-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          userId: session?.guestId || 'guest',
          flavorNotes: data.selectedFlavors,
          aromaNotes: data.aromaNotes,
          strengthPerception: data.strength,
          bodyPerception: data.body,
          finishLength: data.intensity,
          memoryTags: data.selectedFlavors,
        }),
      })
    } catch {}
  }, [session])

  const saveToPassport = useCallback(async (data) => {
    try {
      await fetch('/api/passport-360/smokecraft/flavor-memory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: session?.guestId || 'guest',
          sourceSessionId: session?.sessionId || 'local-session',
          tasteTags: data.selectedFlavors,
          tastingNotes: data.personalNotes,
          flavorProfileSource: 'guest_interactive',
          dataQualityStatus: data.selectedFlavors.length > 0 ? 'valid' : 'empty',
        }),
      })
    } catch {}
  }, [session])

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')

    const snapshot = { ...fm, savedAt: Date.now() }
    setFm(prev => ({ ...prev, savedAt: snapshot.savedAt }))

    try {
      sessionStorage.setItem('smokecraftFlavorMemory', JSON.stringify({
        status: fm.selectedFlavors.length > 0 ? 'guest_input_collected' : 'skipped',
        source: 'interactive',
        backendConnected: true,
        tasteTags: fm.selectedFlavors,
        aromaNotes: fm.aromaNotes,
        strengthPerception: fm.strength,
        bodyPerception: fm.body,
        intensity: fm.intensity,
        pairingRecall: fm.pairingRecall,
        personalNotes: fm.personalNotes,
        savedAt: snapshot.savedAt,
      }))
    } catch {}

    await Promise.all([saveToBackend(snapshot), saveToPassport(snapshot)])
    awardSessionRewards('flavor-memory')
    navigate('/smokecraft/final-third')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.flavorMemory}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Flavor Memory — Capture Your Sensory Experience"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Flavor zone selectors */}
        {FLAVOR_ZONES.map(zone => {
          const active = fm.selectedFlavors.includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label} flavor${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleFlavor(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: `2.5px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
                outline: 'none',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 5,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Live SVG radar chart — left side of lower half */}
        <div
          aria-label="flavor radar chart"
          style={{
            position: 'absolute',
            left: '5%', top: '52%',
            width: '42%', height: '42%',
            pointerEvents: 'none',
          }}
        >
          <RadarChart flavors={fm.selectedFlavors} />
        </div>

        {/* Perception sliders — right side */}
        <div style={{
          position: 'absolute',
          left: '51%', top: '52%', width: '44%', height: '26%',
          background: 'rgba(5,5,5,0.88)',
          border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 6, boxSizing: 'border-box',
          padding: 'clamp(5px,0.8vw,10px)',
          pointerEvents: 'auto',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Perception
          </div>
          {[
            { key: 'intensity', label: 'Intensity' },
            { key: 'body',      label: 'Body' },
            { key: 'strength',  label: 'Strength' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 'clamp(7px,0.62vw,9px)', color: 'rgba(229,226,225,0.55)', width: 52, flexShrink: 0 }}>{label}</span>
              <input
                type="range"
                min={1} max={5}
                value={fm[key]}
                aria-label={`${label} perception`}
                onChange={e => {
                  triggerHaptic('light')
                  setFm(prev => ({ ...prev, [key]: Number(e.target.value) }))
                }}
                style={{ flex: 1, accentColor: GOLD, cursor: 'pointer', height: 4 }}
              />
              <span style={{ fontSize: 'clamp(7px,0.62vw,9px)', color: GOLD, fontWeight: 700, width: 16, textAlign: 'right' }}>
                {fm[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Personal notes — right side, below sliders */}
        <div style={{
          position: 'absolute',
          left: '51%', top: '81%', width: '44%', height: '13%',
          background: 'rgba(5,5,5,0.88)',
          border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 6, boxSizing: 'border-box',
          padding: 'clamp(4px,0.6vw,7px)',
          display: 'flex', flexDirection: 'column', gap: 3,
          pointerEvents: 'auto',
          fontFamily: 'Georgia, serif',
        }}>
          <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Personal Notes
          </span>
          <textarea
            value={fm.personalNotes}
            onChange={e => setFm(prev => ({ ...prev, personalNotes: e.target.value }))}
            placeholder="Your sensory memory in your own words…"
            aria-label="Flavor memory personal notes"
            style={{
              flex: 1, resize: 'none',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(229,226,225,0.8)',
              fontSize: 'clamp(8px,0.72vw,10px)',
              fontFamily: 'Georgia, serif', lineHeight: 1.4,
            }}
          />
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Final Third →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
