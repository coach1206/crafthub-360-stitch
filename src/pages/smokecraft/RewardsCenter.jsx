import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import {
  resolveSmokeCraftLandingAction,
  SMOKECRAFT_LANDING_ACTIONS,
} from '../../constants/smokecraftLandingActions.js'
import { getRankFromXP } from '../../constants/session.js'

const NAT_W = 1672
const NAT_H = 941
const GOLD = '#E9C176'
const CREAM = '#e5e2e1'

/**
 * RewardsCenter — /smokecraft/rewards-center
 *
 * APPROVED-ASSET CONTROL PLANE PASS.
 *
 * What changed and why
 * --------------------
 * The prior pass rendered the approved Reward Center.png as a capped band
 * (maxHeight 62vh) and then stacked a hand-built column of dark glass cards
 * BELOW it — the "giant black content block" the mandate calls out. That is
 * a Claude-composed layout standing beside an approved image rather than
 * live controls placed into it.
 *
 * The approved asset is, in fact, an explicit OVERLAY TEMPLATE. Its four
 * point tiles contain empty dashed circles where values belong, its "MY
 * REWARDS" panel is dotted blank lines, its tier ring is empty, and it
 * carries its own bottom navigation bar (JOURNEY / REWARDS / RANKINGS /
 * PASSPORT / CRAFTHUB). The image was drawn to be filled in, so this screen
 * now renders it at its true 1672x941 aspect ratio and places live values
 * into those designated blank zones — nothing above it, nothing below it,
 * no duplicate title (the image titles itself), no second dashboard.
 *
 * HONEST POINT REPORTING (mandate Step 7)
 * ---------------------------------------
 * The image asks for four point values: AVAILABLE POINTS, POINTS EARNED THIS
 * JOURNEY, LIFETIME POINTS, POINTS REDEEMED. The loyalty engine
 * (src/utils/smokecraftLoyaltyEngine.js) increments `loyaltyPoints`,
 * `lifetimeLoyaltyPoints` and `redeemablePoints` by the SAME amount on every
 * award and never decrements any of them. There is no redemption path in
 * this build at all.
 *
 * So there is exactly ONE real number here, not four. The prior pass printed
 * four tiles anyway — including a "Redeemed" figure computed as
 * `lifetime - available`, which is identically 0 by construction and merely
 * looks like an independently derived value.
 *
 * This screen therefore shows the one real balance in AVAILABLE, the real
 * ledger-derived total in EARNED THIS JOURNEY, and marks LIFETIME and
 * REDEEMED as not separately tracked ("—") rather than restating the same
 * number under three headings. When a real redemption/venue backend exists,
 * these become genuinely distinct; until then the screen says so plainly.
 *
 * Account XP is NOT shown as reward points — the two are separate state
 * (mandate Step 7). Rank is shown only in the image's own tier zone.
 */

// Opaque value chip dropped into one of the image's blank circles/zones.
const VALUE = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Georgia, serif',
  fontWeight: 700,
  color: GOLD,
  pointerEvents: 'none',
}

// Percentage coordinates of the approved image's own blank value circles.
const ZONES = {
  availableCircle: { left: '20.4%', top: '12.4%', width: '4.6%', height: '8.2%' },
  earnedCircle:    { left: '44.6%', top: '12.4%', width: '4.6%', height: '8.2%' },
  lifetimeCircle:  { left: '68.6%', top: '12.4%', width: '4.6%', height: '8.2%' },
  redeemedCircle:  { left: '93.0%', top: '12.4%', width: '4.6%', height: '8.2%' },
  tierRing:        { left: '65.4%', top: '2.0%',  width: '4.4%', height: '7.8%' },
}

// The image's own bottom navigation bar, made live. Each tile resolves its
// destination through the ONE canonical landing resolver — no inline routes.
const NAV_TILES = [
  { action: SMOKECRAFT_LANDING_ACTIONS.RESUME,   label: 'Journey',  left: '3.3%'  },
  { action: null,                                 label: 'Rewards',  left: '22.2%' }, // current screen
  { action: SMOKECRAFT_LANDING_ACTIONS.RANKINGS, label: 'Rankings', left: '41.4%' },
  { action: SMOKECRAFT_LANDING_ACTIONS.PASSPORT, label: 'Passport', left: '60.2%' },
  { action: SMOKECRAFT_LANDING_ACTIONS.CRAFTHUB, label: 'CraftHub', left: '79.0%' },
]

function PointValue({ zone, value, testid }) {
  return (
    <div style={{ ...VALUE, ...zone }}>
      <span data-testid={testid} style={{ fontSize: 'clamp(11px,1.5vw,24px)' }}>{value}</span>
    </div>
  )
}

export default function RewardsCenter() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)

  // Real balance and real ledger — the only two honest numbers available.
  const available = session?.loyaltyPoints ?? 0
  const ledger = Array.isArray(session?.loyaltyLedger) ? session.loyaltyLedger : []
  const earnedThisJourney = ledger.reduce((sum, e) => sum + (e?.pointsAwarded || 0), 0)

  function goAction(actionId) {
    if (!actionId) return
    triggerHaptic('light')
    navigate(resolveSmokeCraftLandingAction(actionId).route)
  }

  function backToJourney() {
    triggerHaptic('light')
    navigate('/smokecraft')
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.rewardCenter}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 Reward Center"
      bottomOffset={0}
    >
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 Reward Center</h1>

      {/* ── The four blank point circles, filled honestly ── */}
      <PointValue testid="rc-available" zone={ZONES.availableCircle} value={available} />
      <PointValue testid="rc-earned"    zone={ZONES.earnedCircle}    value={earnedThisJourney} />
      {/* Not separately tracked — see the header note. Never a restated number. */}
      <PointValue testid="rc-lifetime"  zone={ZONES.lifetimeCircle}  value="—" />
      <PointValue testid="rc-redeemed"  zone={ZONES.redeemedCircle}  value="—" />

      {/* ── The image's empty tier ring ── */}
      <div style={{ ...ZONES.tierRing, ...VALUE, flexDirection: 'column' }}>
        <span data-testid="rc-tier" style={{ fontSize: 'clamp(7px,0.8vw,12px)', color: CREAM, textAlign: 'center' }}>
          {rank.name}
        </span>
      </div>

      {/* ── Live control over the baked "Back to Journey" button ── */}
      <button
        type="button"
        data-testid="rc-back"
        aria-label="Back to Journey"
        onClick={backToJourney}
        style={{
          position: 'absolute', left: '82.9%', top: '2.6%', width: '15.4%', height: '6.4%',
          background: 'transparent', border: '1.5px solid transparent', borderRadius: 8,
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
        onFocus={e => { e.currentTarget.style.borderColor = GOLD }}
        onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
      />

      {/* ── The image's own bottom nav bar, made live ── */}
      {NAV_TILES.map(tile => (
        <button
          key={tile.label}
          type="button"
          aria-label={tile.label}
          data-testid={`rc-nav-${tile.label.toLowerCase()}`}
          aria-current={tile.action === null ? 'page' : undefined}
          disabled={tile.action === null}
          onClick={() => goAction(tile.action)}
          style={{
            position: 'absolute', left: tile.left, top: '89.4%', width: '17.6%', height: '8.4%',
            background: 'transparent', border: '1.5px solid transparent', borderRadius: 10,
            cursor: tile.action === null ? 'default' : 'pointer',
            pointerEvents: 'auto', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { if (tile.action) e.currentTarget.style.borderColor = GOLD }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
          onFocus={e => { if (tile.action) e.currentTarget.style.borderColor = GOLD }}
          onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
        />
      ))}

      {/* Honest status line placed in the image's own empty "MY REWARDS" detail
          zone (the dotted placeholder lines the artwork leaves blank to be
          filled in). Rendered OPAQUE so it occupies that zone cleanly instead
          of overlapping the dotted rules underneath. No invented offers, codes
          or balances are ever shown. The approved artwork already states "No
          venue rewards are currently available", so this adds only the reason,
          never a duplicate claim. */}
      <div
        data-testid="rc-venue-status"
        style={{
          position: 'absolute', left: '70.6%', top: '44.4%', width: '26.4%', height: '12.2%',
          background: '#0A1020', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 1%', textAlign: 'center',
          fontFamily: 'Georgia, serif', fontSize: 'clamp(7px,0.78vw,12px)',
          color: 'rgba(229,226,225,0.68)', lineHeight: 1.45, pointerEvents: 'none',
        }}
      >
        No venue reward catalog is connected to this build yet, so no offers can be listed.
      </div>
    </SmokeCraftImageBoundsOverlay>
  )
}
