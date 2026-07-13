import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const BORDER = 'rgba(233,193,118,0.18)'
const DIM    = 'rgba(229,226,225,0.55)'
const LS_KEY = 'sc_golden_box_v1'

const GOLDEN_BOX_PRINCIPLES = [
  { num: '01', title: 'Excellence in Every Draw',    body: 'Approach each cigar with intention. The ritual of preparation, lighting, and tasting is the experience itself.' },
  { num: '02', title: 'Respect the Craft',           body: 'Every cigar represents years of mastery. Honor the grower, the blender, and the roller in every session.' },
  { num: '03', title: 'Savor the Journey',           body: 'A great cigar is never rushed. Allow yourself to be fully present through each third of the experience.' },
  { num: '04', title: 'Share Knowledge Generously',  body: 'Elevate those around you. The best connoisseurs create more connoisseurs.' },
  { num: '05', title: 'Build Your Legacy',           body: 'Your SmokeCraft journey accumulates into a personal record of taste, discovery, and growth over time.' },
]

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : { acknowledged: false }
  } catch { return { acknowledged: false } }
}

export default function GoldenBox() {
  const { awardSessionRewards } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [acknowledged, setAcknowledged] = useState(() => loadSaved().acknowledged)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ acknowledged })) } catch (_) {}
  }, [acknowledged])

  function handleContinue() {
    if (!acknowledged) return
    triggerHaptic('medium')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate('/smokecraft/mentor-selection')
  }

  const guestName = journey.identity?.preferredName || journey.identity?.fullName || null

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.goldenBox}
        alt="SmokeCraft Golden Box — The Five Principles"
        classification="DECORATIVE_BACKGROUND"
      />

      {/* Acknowledgement — compact bottom panel; artwork visible above */}
      <div style={{
        position: 'fixed',
        bottom: 110,
        left: 0,
        right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(5,3,1,0.93)',
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: '14px 16px',
          maxWidth: 520,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              SmokeCraft 360
            </div>
            <div style={{ fontSize: 'clamp(15px,2.5vw,18px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1' }}>
              {guestName ? `Welcome, ${guestName}.` : 'The Golden Box Principles'}
            </div>
            {guestName && (
              <div style={{ fontSize: 14, color: DIM, fontFamily: 'Georgia, serif', marginTop: 3 }}>
                The Golden Box Principles
              </div>
            )}
          </div>

          {/* Acknowledgement */}
          <div style={{
            background: 'rgba(233,193,118,0.06)',
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
                style={{ width: 18, height: 18, accentColor: GOLD, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                color: acknowledged ? '#e5e2e1' : DIM,
                lineHeight: 1.5,
              }}>
                I have read and acknowledge the Golden Box principles. I commit to upholding the SmokeCraft 360 standard of excellence.
              </span>
            </label>
          </div>

          {!acknowledged && (
            <div style={{ fontSize: 14, color: DIM, textAlign: 'center', marginTop: 6, fontFamily: 'Georgia, serif' }}>
              Acknowledge the principles above to continue.
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Save and Continue →"
        onPrimary={handleContinue}
        primaryDisabled={!acknowledged}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
