import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftEntryHeaderBand from '../../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD   = '#E9C176'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const BORDER = 'rgba(233,193,118,0.22)'
const DIM    = 'rgba(229,226,225,0.62)'
const CREAM  = '#e5e2e1'
const GLASS  = 'rgba(8,10,16,0.86)'

// Approved copy from GOLDEN BOX RULES.png — "THE GOLDEN PRINCIPLES" panel.
// Recreated as real, legible React text (the printed panel is small and
// would be illegible if left as baked pixels at header-band scale) rather
// than invented content.
const GOLDEN_PRINCIPLES = [
  { num: 1, title: 'Respect the Cigar',        body: 'Treat every cigar with care and appreciation.' },
  { num: 2, title: 'Respect the Environment',  body: 'Keep the lounge clean, calm, and comfortable.' },
  { num: 3, title: 'Respect Fellow Guests',    body: "Be mindful of others' experience and space." },
  { num: 4, title: 'Savor the Moment',         body: 'Slow down, disconnect, and enjoy the journey.' },
  { num: 5, title: 'Protect the Ritual',       body: 'Follow the steps, honor the process, and elevate.' },
]

// The approved GOLDEN BOX RULES.png hero photo (cigar box + glass, top-right
// of the composite) is the only genuinely clean decorative sub-region — the
// rest of that composite bakes in an unrelated Identity form, a Venue
// Settings form, and a staff-only guest table that belong to other already-
// built routes and must not be duplicated here.
const HERO_CROP = { x: 730, y: 95, w: 715, h: 315 }
const NAT_W = 1456
const NAT_H = 1080
const heroBgSize = `${(NAT_W / HERO_CROP.w) * 100}% ${(NAT_H / HERO_CROP.h) * 100}%`
const heroBgPos = `${(HERO_CROP.x / (NAT_W - HERO_CROP.w)) * 100}% ${(HERO_CROP.y / (NAT_H - HERO_CROP.h)) * 100}%`

export default function GoldenBox() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setGoldenBox } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [acknowledged, setAcknowledged] = useState(() => journey.goldenBox?.acknowledged ?? false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setGoldenBox({ acknowledged })
  }, [acknowledged]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (!acknowledged) return
    triggerHaptic('medium')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate('/smokecraft/mentor-selection')
  }

  const guestName = journey.identity?.preferredName || journey.identity?.fullName || null

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      <SmokeCraftEntryHeaderBand
        eyebrow="SmokeCraft Journey"
        title="Golden Box Rules"
        subtitle="Honor the Leaf. Respect the Craft. Elevate the Experience."
        image={SC_ASSETS.goldenBox}
        imagePosition={heroBgPos}
        imageSize={heroBgSize}
        overlayStrength={0.82}
      />

      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '20px clamp(16px,4vw,40px) clamp(150px,20vh,190px)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {guestName && (
            <div style={{ fontSize: 15, color: CREAM }}>Welcome, {guestName}.</div>
          )}

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 'clamp(16px,2.4vw,24px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              The Golden Principles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GOLDEN_PRINCIPLES.map(p => (
                <div key={p.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    border: `1.5px solid ${GOLD}`, color: GOLD, fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{p.num}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: CREAM }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: DIM, marginTop: 2 }}>{p.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', minHeight: 48 }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
                style={{ width: 22, height: 22, accentColor: GOLD, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{ fontSize: 15, color: acknowledged ? CREAM : DIM, lineHeight: 1.55 }}>
                I have read and acknowledge the Golden Box principles. I commit to upholding the SmokeCraft 360 standard of excellence.
              </span>
            </label>
            {!acknowledged && (
              <div style={{ fontSize: 12, color: DIM, marginTop: 10 }}>
                Acknowledge the principles above to continue.
              </div>
            )}
          </div>
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Save and Continue →"
        onPrimary={handleContinue}
        primaryDisabled={!acknowledged}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
