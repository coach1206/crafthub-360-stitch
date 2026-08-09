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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Georgia, serif' }}>
        <header>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SmokeCraft 360 — Supporting Module
          </div>
          <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(22px,3vw,30px)', color: CREAM }}>Mini Tasting Round</h1>
          <p style={{ margin: 0, fontSize: 'clamp(12px,1.3vw,14px)', color: 'rgba(229,226,225,0.6)', lineHeight: 1.5 }}>
            A short comparative check-in on the cigar you've been tasting — aroma, palate development, and how your preferences have sharpened this session.
          </p>
        </header>

        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            This Session's Cigar
          </div>
          {cigar ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: CREAM }}>
              <div>Cigar: <span style={{ color: GOLD_DIM }}>{cigar.name}</span></div>
              {cigar.wrapper && <div>Wrapper: <span style={{ color: GOLD_DIM }}>{cigar.wrapper}</span></div>}
              {flavors.length > 0 && <div>Flavor notes: <span style={{ color: GOLD_DIM }}>{flavors.join(', ')}</span></div>}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No cigar selected this journey.</div>
          )}
        </section>

        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            What To Expect
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { t: 'Taste & Compare', d: 'Revisit how the flavor has shifted since the first third.' },
              { t: 'Aromatic Check', d: 'Note any new aromas as the burn develops.' },
              { t: 'Palate Development', d: 'Confirm whether your preferences held or changed.' },
            ].map(x => (
              <div key={x.t} style={{ background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_DIM, marginBottom: 4 }}>{x.t}</div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', lineHeight: 1.4 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.35)', fontStyle: 'italic' }}>
          Session XP so far: {session?.xp || 0}
        </div>

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
