import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { RANKS, getRankFromXP } from '../../constants/session.js'

const GOLD  = '#E9C176'
const CREAM = '#e5e2e1'
const GLASS = 'rgba(8,10,16,0.86)'
const BORDER = 'rgba(233,193,118,0.22)'

/**
 * RewardsCenter — the landing "Rewards" destination card target.
 *
 * Root-cause fix (Live Landing & Destinations pass): the landing Rewards
 * card previously routed to /smokecraft/humidor-match, which for any real
 * (fresh or partially-progressed) user bounced straight to /smokecraft/enroll
 * via the session-2 entry guard — the approved Reward Center visual the repo
 * owner uploaded was never shown at all. This screen is landing-accessible
 * (no session guard), renders the approved Reward Center.png as its visual
 * shell, and shows ONLY real, saved data:
 *   - Real XP balance and rank (guest session xp / getRankFromXP).
 *   - Real loyalty-point fields already tracked on the guest session
 *     (available / lifetime / redeemable) — never fabricated.
 * There is no real venue-specific rewards backend in this build, so the
 * venue-rewards section is an honest empty state, never invented offers,
 * codes, or balances. When a real venue-rewards source exists, populate it
 * here — do not bake fake rewards to fill the gap.
 */
export default function RewardsCenter() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)
  const nextTier = RANKS.find(r => r.minXP > xp) || null
  const available = session?.redeemablePoints ?? 0
  const lifetime = session?.lifetimeLoyaltyPoints ?? 0
  const current = session?.loyaltyPoints ?? 0

  function back() {
    triggerHaptic('light')
    navigate('/smokecraft')
  }

  const pointField = (label, value) => (
    <div style={{ flex: '1 1 130px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: GOLD }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )

  return (
    <div
      data-testid="smokecraft-rewards-center"
      style={{ position: 'fixed', inset: 0, overflowX: 'hidden', overflowY: 'auto', background: '#060810', fontFamily: 'Georgia, serif' }}
    >
      {/*
        Layout root-cause fix (Single Build & Live Runtime pass). Previously
        this approved visual was cropped into a fixed band
        (height: clamp(150px,26vh,260px), backgroundSize: cover,
        backgroundPosition: center 35%) while <main> was absolutely
        positioned starting at clamp(140px,24vh,240px) with a HIGHER z-index.
        Three real defects followed, all reproduced in a real browser and all
        matching the reported live symptoms:
          1. `main` started ~10-20px ABOVE the band's bottom edge and painted
             over it — live content literally covered the approved artwork.
          2. `cover` + `center 35%` sliced the approved reward cards through
             their middles and pushed the image's own top navigation off
             screen, so the approved layout read as broken/inaccessible.
          3. The rgba(6,8,16,0.92) gradient stop plus the fixed-height band
             left a large black region below the image before content began.
        Now: one normal-flow scrolling document. The visual keeps its real
        1672x941 aspect ratio with backgroundSize `contain`, so it is never
        cropped and no approved card is ever sliced; content flows BELOW it
        rather than over it, making overlap structurally impossible; and the
        duplicate live "Reward Center" title is dropped (the approved image
        already titles the screen) in favour of a screen-reader-only h1.
        Bottom navigation is the standard SmokeCraftNavBar, which the screen
        previously lacked entirely.
      */}
      <div
        role="img"
        aria-label="SmokeCraft 360 Reward Center"
        data-visual-source="reward-center"
        style={{
          width: '100%', aspectRatio: '1672 / 941', maxHeight: '62vh',
          backgroundImage: `url(${SC_ASSETS.rewardCenter})`,
          backgroundSize: 'contain', backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat', backgroundColor: '#060810',
        }}
      />

      <main style={{ padding: '0 clamp(16px,4vw,40px) 140px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24 }}>
          <h1 style={{
            position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
            overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
          }}>SmokeCraft 360 Reward Center</h1>

          {/* Real XP + rank */}
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Your Standing</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 700, color: GOLD }}>{xp}</span>
              <span style={{ fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>Total XP</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginTop: 4 }}>
              Rank: <span style={{ color: GOLD }}>{rank.name}</span>
              {nextTier ? ` — ${nextTier.minXP - xp} XP to ${nextTier.name}` : ' — highest rank reached'}
            </div>
          </div>

          {/* Real loyalty points */}
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Reward Points</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {pointField('Available', available)}
              {pointField('Journey', current)}
              {pointField('Redeemed', Math.max(0, lifetime - available))}
              {pointField('Lifetime', lifetime)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)', marginTop: 10, fontStyle: 'italic' }}>
              Points are earned as you complete your SmokeCraft journey. This build tracks one continuous local journey.
            </div>
          </div>

          {/* Honest empty state — no real venue-rewards backend exists. */}
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Venue Rewards</div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(229,226,225,0.6)', lineHeight: 1.6 }}>
              Venue-specific rewards are not yet available. When your venue connects its reward
              catalog, redeemable offers will appear in each category below. No sample or
              placeholder offers are shown — only real rewards will ever be listed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Drink specials', 'Cigar & smoke specials', 'Food specials', 'Pairing specials', 'Venue perks'].map(cat => (
                <div key={cat} data-reward-category={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontSize: 13, color: CREAM }}>{cat}</span>
                  <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>None configured</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Bottom navigation — the standard approved bar this screen previously
          lacked (the only way back was an inline button buried at the end of
          the scroll, which is why the live report noted a missing bottom nav). */}
      <SmokeCraftNavBar
        secondary="← Back to Landing"
        onSecondary={back}
      />
    </div>
  )
}
