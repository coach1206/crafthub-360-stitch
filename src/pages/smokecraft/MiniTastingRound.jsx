import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD   = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const CREAM  = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS  = 'rgba(233,193,118,0.06)'

/**
 * Mini Tasting Round — /smokecraft/mini-tasting (supporting, post-Scorecard)
 *
 * SC-D086 rebuild — this route previously rendered `SC_ASSETS.miniTasting`
 * as a `SmokeCraftAssetScreen classification="DECORATIVE_BACKGROUND"` full-
 * bleed background image. That classification asserts "no essential
 * content in image," but the image itself is baked with a full mock
 * interface (3 cigar comparison cards with Select buttons, a "What To
 * Expect" panel, a Pro Tip, a progress bar, and a baked "Begin Mini
 * Tasting" button) — none of it real, none of it clickable, and the one
 * real control (the NavBar's "Complete Tasting Round") visually collided
 * with the baked "Begin Mini Tasting" button underneath it.
 *
 * Rebuilt as real live DOM using the journey's own real, already-selected
 * cigar (no fabricated second/third comparison cigar — this build does not
 * track a real 3-cigar tasting flight, so an honest single-cigar summary
 * replaces the baked 3-card comparison rather than inventing two more
 * cigars). No image asset for this screen traces to a real dedicated
 * asset key in smokecraftAssets.js, so none is used.
 */
export default function MiniTastingRound() {
  const navigate = useNavigate()
  const { awardSessionRewards, session } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const [done, setDone] = useState(false)

  const cigar = journey.selectedCigar
  const flavors = journey.flavorMemory?.selectedFlavors || []

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('mini-tasting')
    navigate('/smokecraft/visit-complete')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Georgia, serif' }}>

        {/* CSS-only decorative banner (no image asset — no approved photo
            is mapped to this screen, so composition/gradient/typography
            alone carries the premium feel, matching the mandate's "build
            without one, don't leave it looking incomplete" instruction). */}
        <div style={{
          borderRadius: 14, border: `1px solid ${BORDER}`, padding: 'clamp(20px,3.4vw,32px)',
          background: 'radial-gradient(120% 140% at 15% 20%, rgba(233,193,118,0.14), rgba(6,8,12,0.4) 60%), linear-gradient(135deg, rgba(233,193,118,0.06), rgba(11,15,24,0.9))',
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <span style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">🥃</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              SmokeCraft 360 — Supporting Module
            </div>
            <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(24px,3.4vw,34px)', color: CREAM }}>Mini Tasting Round</h1>
            <p style={{ margin: 0, fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.55, maxWidth: 640 }}>
              A short comparative check-in on the cigar you've been tasting — aroma, palate development, and how your preferences have sharpened this session.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              This Session's Cigar
            </div>
            {cigar ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 'clamp(16px,1.8vw,20px)', color: CREAM, fontWeight: 700 }}>{cigar.name}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cigar.wrapper && <span style={{ fontSize: 11, color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '3px 10px' }}>{cigar.wrapper}</span>}
                  {flavors.slice(0, 4).map(f => <span key={f} style={{ fontSize: 11, color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '3px 10px' }}>{f}</span>)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No cigar selected this journey.</div>
            )}
          </section>

          <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Session Progress
            </div>
            <div style={{ fontSize: 'clamp(22px,2.4vw,28px)', color: GOLD, fontWeight: 700 }}>{session?.xp || 0} XP</div>
            <div style={{ fontSize: 11.5, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Earned so far this journey</div>
          </section>
        </div>

        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            What To Expect
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '👃', t: 'Taste & Compare', d: 'Revisit how the flavor has shifted since the first third.' },
              { icon: '🌬️', t: 'Aromatic Check', d: 'Note any new aromas as the burn develops.' },
              { icon: '🎯', t: 'Palate Development', d: 'Confirm whether your preferences held or changed.' },
            ].map(x => (
              <div key={x.t} style={{ background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px' }}>
                <span style={{ fontSize: 22 }} aria-hidden="true">{x.icon}</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: GOLD_DIM, marginTop: 8, marginBottom: 4 }}>{x.t}</div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', lineHeight: 1.4 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Complete Tasting Round →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
