import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
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
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#060810', fontFamily: 'Georgia, serif' }}>
      {/* Approved Reward Center visual — rendered as the destination shell. */}
      <div
        role="img"
        aria-label="SmokeCraft 360 Reward Center"
        data-visual-source="reward-center"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(150px,26vh,260px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.15), rgba(6,8,16,0.92)), url(${SC_ASSETS.rewardCenter})`,
          backgroundSize: 'cover', backgroundPosition: 'center 35%', zIndex: 1,
        }}
      />

      <main style={{
        position: 'absolute', top: 'clamp(140px,24vh,240px)', bottom: 0, left: 0, right: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 clamp(16px,4vw,40px) 40px', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.24em', textTransform: 'uppercase' }}>SmokeCraft 360</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 'clamp(24px,3.6vw,36px)', color: CREAM }}>Reward Center</h1>
          </div>

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

          <button
            type="button" onClick={back}
            style={{
              alignSelf: 'flex-start', minHeight: 48, padding: '10px 24px', borderRadius: 999,
              background: 'transparent', border: `1.5px solid ${GOLD}`, color: GOLD,
              fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
              textTransform: 'uppercase', cursor: 'pointer', outline: 'none',
            }}
          >
            ← Back to Landing
          </button>
        </div>
      </main>
    </div>
  )
}
