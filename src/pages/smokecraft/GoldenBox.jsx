import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftEntryHeaderBand from '../../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD      = '#E9C176'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const BORDER    = 'rgba(233,193,118,0.22)'
const DIM       = 'rgba(229,226,225,0.62)'
const CREAM     = '#e5e2e1'
const GLASS     = 'rgba(8,10,16,0.86)'

// Dedicated clean decorative hero — no baked interface content, unlike the
// full GOLDEN BOX RULES.png composite (which the visual reference for this
// screen, but is never rendered as the live background — see PR discussion).
const HERO_IMAGE = '/assets/smokecraft/cropped/golden-box-hero.jpg'

// Approved copy from GOLDEN BOX RULES.png — "THE GOLDEN PRINCIPLES" panel,
// recreated as real, legible React text rather than left as baked pixels.
const GOLDEN_PRINCIPLES = [
  { num: 1, title: 'Respect the Cigar',        body: 'Treat every cigar with care and appreciation.' },
  { num: 2, title: 'Respect the Environment',  body: 'Keep the lounge clean, calm, and comfortable.' },
  { num: 3, title: 'Respect Fellow Guests',    body: "Be mindful of others' experience and space." },
  { num: 4, title: 'Savor the Moment',         body: 'Slow down, disconnect, and enjoy the journey.' },
  { num: 5, title: 'Protect the Ritual',       body: 'Follow the steps, honor the process, and elevate.' },
]

// Approved copy from GOLDEN BOX RULES.png — "QUICK RULE REMINDERS" strip.
// Each thumbnail reuses existing clean, already-approved GitHub photography
// (no generated substitutes) — see the Golden Box image-source report.
const QUICK_REMINDERS = [
  { title: 'Handle With Care', image: '/assets/smokecraft/cropped/cut-toast-light-hero.jpg', position: 'center 30%' },
  { title: 'Respect Others',   image: '/assets/smokecraft/cropped/intake-whiskey-bg.jpg',     position: 'center bottom' },
  { title: 'Keep It Clean',    image: '/assets/smokecraft/cropped/discover-profile-hero.jpg', position: 'center 30%' },
  { title: 'Enjoy & Savor',    image: '/assets/smokecraft/cropped/intake-ashtray-bg.jpg',      position: 'center bottom' },
]

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
        image={HERO_IMAGE}
        imagePosition="center 40%"
        imageSize="cover"
        overlayStrength={0.78}
      />

      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px clamp(16px,4vw,40px) clamp(140px,19vh,190px)',
      }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 20,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guestName && (
              <div style={{ fontSize: 14, color: CREAM }}>Welcome, {guestName}.</div>
            )}

            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 'clamp(12px,2vw,18px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                The Golden Principles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
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

            <div style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', minHeight: 48 }}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
                  style={{ width: 22, height: 22, accentColor: GOLD, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                />
                <span style={{ fontSize: 14, color: acknowledged ? CREAM : DIM, lineHeight: 1.45 }}>
                  I have read and acknowledge the Golden Box principles. I commit to upholding the SmokeCraft 360 standard of excellence.
                </span>
              </label>
              {!acknowledged && (
                <div style={{ fontSize: 11, color: DIM, marginTop: 6 }}>
                  Acknowledge the principles above to continue.
                </div>
              )}
            </div>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 'clamp(12px,2vw,18px)', alignSelf: 'start' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Quick Rule Reminders
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {QUICK_REMINDERS.map(r => (
                <div key={r.title} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  <div style={{
                    aspectRatio: '4 / 3',
                    backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.15), rgba(6,8,16,0.75)), url(${r.image})`,
                    backgroundSize: 'cover', backgroundPosition: r.position,
                    display: 'flex', alignItems: 'flex-end', padding: 8,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: CREAM }}>
                      {r.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
