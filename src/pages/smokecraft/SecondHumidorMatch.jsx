import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import {
  GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftOwnerHeroBackground from '../../components/smokecraft/SmokeCraftOwnerHeroBackground.jsx'

/**
 * Second Humidor Match — /smokecraft/second-humidor-match (supporting)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftAssetScreen
 * classification="DECORATIVE_BACKGROUND" (a full-bleed baked image with
 * no real content behind it beyond the NavBar) with real live DOM. No
 * decorative image is used, matching the Mini Tasting Round precedent
 * (same "no dedicated asset traces to this route" situation). Shows the
 * player's currently selected cigar so the screen isn't empty, rather
 * than inventing a second comparison cigar this build doesn't track.
 */
export default function SecondHumidorMatch() {
  const navigate = useNavigate()
  const { awardSessionRewards } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const [done, setDone] = useState(false)

  const cigar = journey.selectedCigar
  const pairing = journey.pairing

  const whyItHolds = cigar
    ? (cigar.strength === 'Full' || cigar.strength === 'Medium-Full'
        ? 'A full-bodied profile like this one holds its character through a second visit — the wrapper oils and aging only deepen with a little more rest.'
        : cigar.strength === 'Mild' || cigar.strength === 'Mild-Medium'
        ? "A lighter profile stays approachable for a return visit, and it's an easy recommendation if you're introducing a guest to the humidor."
        : 'A balanced medium profile is a safe, repeatable choice — consistent from one visit to the next.')
    : null

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('second-humidor-match')
    navigate('/smokecraft/mini-tasting')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftOwnerHeroBackground assetKey="ownerSecondHumidorMatchHero" label="A curated humidor of premium cigars" bgPosition="center top" bgSize="cover" />
      <div style={{ ...pageShellStyle, position: 'relative', zIndex: 2 }}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🚬</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Supporting Module</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Your Next Cigar</h1>
            <p style={{ margin: 0, maxWidth: 700, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              A moment to revisit tonight's selection before moving into the tasting round.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Selected Cigar</div>
          {cigar ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 'clamp(18px,2vw,22px)', color: CREAM, fontWeight: 700 }}>{cigar.name}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cigar.wrapper && <span style={{ fontSize: 12, color: '#E9C176', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '4px 12px' }}>{cigar.wrapper}</span>}
                {cigar.strength && <span style={{ fontSize: 12, color: '#E9C176', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '4px 12px' }}>{cigar.strength}</span>}
                {cigar.origin && <span style={{ fontSize: 12, color: '#E9C176', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '4px 12px' }}>{cigar.origin}</span>}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic', marginTop: 8 }}>No cigar selected this journey.</div>
          )}
        </section>

        {cigar && (
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Why This Holds Up for Next Time</div>
            <p style={{ margin: '8px 0 0', color: 'rgba(229,226,225,.68)', fontSize: 13, lineHeight: 1.6 }}>{whyItHolds}</p>
            {pairing && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={sectionLabelStyle}>Paired Well With</div>
                <div style={{ fontSize: 13, color: '#E9C176', marginTop: 6 }}>
                  {typeof pairing === 'object' ? (pairing.pairingType || pairing.label || null) : pairing}
                </div>
              </div>
            )}
          </section>
        )}

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Select Your Cigar →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
