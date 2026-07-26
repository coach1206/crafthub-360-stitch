import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import {
  resolveSmokeCraftLandingAction,
  getSmokeCraftLandingJourneyState,
  getPrimaryActionId,
} from '../../constants/smokecraftLandingActions.js'
import { computeJourneyStatus } from '../../constants/smokecraftJourneyStatus.js'
import { RANKS, getRankFromXP, TOTAL_SESSIONS } from '../../constants/session.js'

const NAT_W = 1448
const NAT_H = 1086
const GOLD = '#E9C176'
const CREAM = '#e5e2e1'

/**
 * HowItWorks — /smokecraft/how-it-works
 *
 * APPROVED-ASSET CONTROL PLANE PASS — this file replaces a Claude-composed
 * CSS/React layout and restores the approved image as the visual foundation.
 * It explicitly supersedes the immediately-prior pass's approach.
 *
 * What the prior pass did, and why it was wrong
 * ---------------------------------------------
 * The prior pass rejected BOTH candidate images and hand-built a dark
 * gradient/glass-card screen in their place. The repo owner has explicitly
 * rejected that: React must never substitute its own layout for an approved
 * image, however well designed. That layout is deleted here.
 *
 * Which approved image, and why
 * -----------------------------
 *   (a) /assets/smokecraft-reference/approved/smokecraft-how-it-works.png is
 *       genuinely an INTERNAL DESIGN STORYBOARD ("STORYBOARD S1 -> S4",
 *       covered in S1.1/S2.1/"S1 GOAL" planning labels). Not a user screen,
 *       so not the approved user visual for this route. Its now-dead
 *       SC_ASSETS.howItWorks key is removed this pass.
 *
 *   (b) /assets/smokecraft/session-visuals/HOW IT WORKS.png is a real
 *       user-facing SmokeCraft 360 "HOW IT WORKS" screen with the product's
 *       own sidebar, 5-step explainer, "WHAT YOU CAN EARN" panel and
 *       "PROGRESS OVERVIEW" panel. This IS the approved user visual and is
 *       what this route now renders.
 *
 * The baked-stat tension, resolved WITHOUT redrawing
 * -------------------------------------------------
 * (b) has placeholder learner values baked into its pixels: "Level 2
 * Aficionado", "1,350 XP to Level 3", and a PROGRESS OVERVIEW row reading
 * "6 of 16" sessions, "12" badges, "4,250" XP, "24 of 1,248" rank.
 *
 * The prior pass treated this as an unresolvable conflict between "use only
 * approved images" and "never show fake data", and drew its own screen. That
 * was a false dilemma. Those numbers sit inside clearly-bounded VALUE ZONES —
 * exactly the regions React overlays are supposed to own, and exactly how
 * Format.jsx already handles baked text it must replace (opaque panel over
 * the baked pixels; see its PANEL const: "non-opaque background let baked
 * image content bleed through").
 *
 * So: the approved image renders intact at its true 1448x1086 aspect ratio,
 * and every baked placeholder number is covered by an OPAQUE overlay showing
 * the user's real, saved value. No artwork is redrawn, no fake number is
 * shown, and no zone displays baked pixels alongside live text. The image's
 * own title, steps and artwork are never covered.
 *
 * Session counts come from the authoritative registry (TOTAL_SESSIONS), so
 * the baked "of 16" is replaced with the real 27-session architecture rather
 * than contradicting it.
 */

// Opaque overlay panel — must fully occlude the baked placeholder pixels
// underneath, never sit translucently on top of them.
const OPAQUE = {
  position: 'absolute',
  background: '#0A1020',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Georgia, serif',
  pointerEvents: 'none',
  overflow: 'hidden',
}

// Percentage coordinates measured against the approved image's own layout:
// the PROGRESS OVERVIEW value cells and the top-right profile chip.
const ZONES = {
  profileTier:   { left: '81.5%', top: '5.2%',  width: '17.0%', height: '4.2%' },
  profileToNext: { left: '81.5%', top: '10.0%', width: '17.0%', height: '3.4%' },
  statSessions:  { left: '55.8%', top: '81.2%', width: '9.2%',  height: '7.2%' },
  statBadges:    { left: '65.8%', top: '81.2%', width: '9.2%',  height: '7.2%' },
  statXp:        { left: '75.8%', top: '81.2%', width: '10.2%', height: '7.2%' },
  statRank:      { left: '86.6%', top: '81.2%', width: '10.8%', height: '7.2%' },
}

function StatValue({ zone, value, sub, testid }) {
  return (
    <div style={{ ...OPAQUE, ...zone }}>
      <span data-testid={testid} style={{ fontSize: 'clamp(15px,2.1vw,30px)', color: CREAM, lineHeight: 1.05 }}>
        {value}
      </span>
      {sub ? (
        <span style={{ fontSize: 'clamp(8px,0.95vw,13px)', color: 'rgba(229,226,225,0.6)', marginTop: 2 }}>{sub}</span>
      ) : null}
    </div>
  )
}

export default function HowItWorks() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  // One journey-state read, one canonical resolver — the same pair the
  // Landing screen uses. This screen never re-derives its own CTA decision.
  const journeyState = getSmokeCraftLandingJourneyState()
  const primary = resolveSmokeCraftLandingAction(getPrimaryActionId(journeyState), journeyState)

  // Real, saved values only. Every one of these replaces a baked placeholder.
  const completedSteps = Array.isArray(session?.completedSteps) ? session.completedSteps : []
  const status = computeJourneyStatus(completedSteps)
  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)
  const nextTier = RANKS.find(r => r.minXP > xp) || null
  const badges = Array.isArray(session?.badges) ? session.badges.length : 0

  function handlePrimary() {
    triggerHaptic('medium')
    navigate(primary.route)
  }

  function handleBack() {
    triggerHaptic('light')
    navigate('/smokecraft')
  }

  return (
        <SmokeCraftScreenShell
      mode="image-shell"
      status="ready"
      imageProps={{ src: SC_ASSETS.howItWorksUser, naturalW: NAT_W, naturalH: NAT_H, alt: "SmokeCraft 360 — How It Works", bottomOffset: 0 }}
    >
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 — How It Works</h1>

      {/* ── Baked profile chip: "Level 2 Aficionado" / "1,350 XP to Level 3" ── */}
      <div style={{ ...OPAQUE, ...ZONES.profileTier, alignItems: 'flex-start', paddingLeft: '2%' }}>
        <span data-testid="hiw-rank" style={{ fontSize: 'clamp(10px,1.25vw,17px)', color: CREAM }}>
          {rank.name}
        </span>
      </div>
      <div style={{ ...OPAQUE, ...ZONES.profileToNext, alignItems: 'flex-end', paddingRight: '2%' }}>
        <span data-testid="hiw-to-next" style={{ fontSize: 'clamp(8px,0.95vw,13px)', color: 'rgba(229,226,225,0.75)' }}>
          {nextTier ? `${nextTier.minXP - xp} XP to ${nextTier.name}` : 'Highest rank reached'}
        </span>
      </div>

      {/* ── Baked PROGRESS OVERVIEW numbers: 6 of 16 / 12 / 4,250 / 24 of 1,248 ── */}
      <StatValue testid="hiw-sessions" zone={ZONES.statSessions} value={status.completedSessionCount} sub={`of ${TOTAL_SESSIONS}`} />
      <StatValue testid="hiw-badges"   zone={ZONES.statBadges}   value={badges}                        sub="Total" />
      <StatValue testid="hiw-xp"       zone={ZONES.statXp}       value={xp.toLocaleString()}           sub="Total" />
      {/* No shared/multi-user ranking source exists in this build, so a
          numeric community rank ("24 of 1,248") cannot be produced honestly.
          The zone is occluded and marked unavailable rather than showing the
          baked placeholder or an invented number. */}
      <StatValue testid="hiw-rank-position" zone={ZONES.statRank} value="—" sub="Not ranked yet" />

      {/* ── Live control over the baked "VIEW FULL PROGRESS" button ── */}
      <button
        type="button"
        data-testid="hiw-primary"
        onClick={handlePrimary}
        style={{
          position: 'absolute', left: '57.3%', top: '89.4%', width: '38.4%', height: '4.4%',
          background: `linear-gradient(180deg, #F3D48E, ${GOLD})`,
          color: '#241605', border: 'none', borderRadius: 6,
          fontFamily: 'Georgia, serif', fontWeight: 700,
          fontSize: 'clamp(10px,1.15vw,16px)', letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {primary.label}
      </button>

      {/* ── Live control over the baked sidebar "HOME" item ── */}
      <button
        type="button"
        aria-label="Back to SmokeCraft landing"
        data-testid="hiw-back"
        onClick={handleBack}
        style={{
          position: 'absolute', left: '1.0%', top: '15.6%', width: '8.7%', height: '4.0%',
          background: 'transparent', border: '1.5px solid transparent', borderRadius: 6,
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
        onFocus={e => { e.currentTarget.style.borderColor = GOLD }}
        onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
      />
    </SmokeCraftScreenShell>
  )
}
