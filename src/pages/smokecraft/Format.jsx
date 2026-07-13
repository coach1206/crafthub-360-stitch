import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'
const DIM  = 'rgba(229,226,225,0.55)'

const FORMATS = [
  { id: 'robusto',   label: 'Robusto',   desc: '5" × 50 ring',  burnTime: '45–60 min', notes: 'The benchmark medium-size. Balanced and concentrated.' },
  { id: 'toro',      label: 'Toro',      desc: '6" × 52 ring',  burnTime: '60–75 min', notes: 'Extra length opens up the blend\'s mid-section.' },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring',  burnTime: '75–90 min', notes: 'Ring gauge keeps it refined. Long smoke, elegant evolution.' },
  { id: 'corona',    label: 'Corona',    desc: '5.5" × 42 ring', burnTime: '35–45 min', notes: 'Smaller ring focuses the wrapper\'s flavor front and center.' },
  { id: 'gordo',     label: 'Gordo',     desc: '6" × 60 ring',  burnTime: '90–120 min', notes: 'Wide ring gauge increases coolness. More complex burn.' },
  { id: 'torpedo',   label: 'Torpedo',   desc: '6.5" × 52 ring', burnTime: '70–85 min', notes: 'Tapered head concentrates draw. Distinct opening character.' },
]

export default function Format() {
  const { awardSessionRewards, setSmokeCraftFormat } = useGuestSession()
  const { journey, setFormat } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(() => journey.format?.id || null)
  const [done, setDone] = useState(false)

  // Persist to journey state whenever selection changes
  useEffect(() => {
    const fmt = FORMATS.find(f => f.id === selected)
    setFormat(fmt ? { id: fmt.id, label: fmt.label, desc: fmt.desc, burnTime: fmt.burnTime } : null)
    if (fmt) setSmokeCraftFormat({ id: fmt.id, name: fmt.label, desc: fmt.desc })
  }, [selected, setFormat, setSmokeCraftFormat])

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('format')
    awardSessionRewards('wrapper-strength')
    navigate('/smokecraft/seed-soil')
  }

  const selectedFmt = FORMATS.find(f => f.id === selected)

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.format}
        alt="SmokeCraft Format — Shape, Size & Burn Time"
        classification="DECORATIVE_BACKGROUND"
      />

      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.94)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 12px',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Choose Your Format
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {FORMATS.map(f => {
              const active = selected === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-label={`${f.label} — ${f.desc}`}
                  aria-pressed={active}
                  onClick={() => { triggerHaptic('light'); setSelected(active ? null : f.id) }}
                  style={{
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                    borderRadius: 20,
                    padding: '11px 16px',
                    minHeight: 44,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Live format summary */}
          {selectedFmt ? (
            <div style={{
              borderTop: '1px solid rgba(233,193,118,0.15)',
              paddingTop: 8,
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Size</div>
                  <div style={{ fontSize: 13, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>{selectedFmt.desc}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Burn Time</div>
                  <div style={{ fontSize: 13, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>{selectedFmt.burnTime}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: DIM, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {selectedFmt.notes}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: DIM, paddingTop: 4 }}>
              No format selected — choose one above.
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Seed & Soil →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
