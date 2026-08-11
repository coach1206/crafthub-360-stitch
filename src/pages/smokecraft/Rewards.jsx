import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { ShieldPersonIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import { RANKS, getRankFromXP } from '../../constants/session.js'
import { getSessionRewards, getSmokeCraftXP, getEarnedBadges, SMOKECRAFT_BADGES } from '../../constants/smokecraftRewards.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'
import { fetchPlayerState } from '../../services/smokecraft/playerStateApiClient.js'
import { heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle } from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftOwnerHeroBackground from '../../components/smokecraft/SmokeCraftOwnerHeroBackground.jsx'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Sessions with a real, configured XP rule that also map to one of the
// named breakdown categories the package requires (Passport XP, Pairing XP,
// Mentor XP). Everything else completed falls into general "Completed-Session
// XP" if configured, or the honest "not configured" list if it isn't.
const CATEGORY_BY_SESSION_ID = {
  'passport-stamp': 'passport',
  'pairing-lab': 'pairing',
  mentor: 'mentor',
}

// Session ids that exist in the live 27-session spine but currently have no
// entry in SESSION_REWARDS (src/constants/smokecraftRewards.js) — i.e. no
// verified XP rule exists for them yet. Listed explicitly so the honest
// "Reward criteria not configured" state can name them instead of silently
// showing 0 XP with no explanation.
const KNOWN_UNCONFIGURED_SPINE_IDS = [
  'meet-your-cigar', 'terroir', 'lighting-tutorial', 'mentor-commentary',
  'knowledge-drop', 'ai-summary', 'pairing-recommendations',
]

function buildXPBreakdown(completedSteps) {
  const totals = { session: 0, passport: 0, pairing: 0, mentor: 0, quiz: 0 }
  const unconfiguredCompleted = []
  for (const id of completedSteps) {
    const rewards = getSessionRewards(id)
    if (!rewards) {
      if (KNOWN_UNCONFIGURED_SPINE_IDS.includes(id)) unconfiguredCompleted.push(id)
      continue
    }
    const category = CATEGORY_BY_SESSION_ID[id] || 'session'
    totals[category] = (totals[category] || 0) + rewards.xp
  }
  return { totals, unconfiguredCompleted }
}

// ── Achievement catalog — every criterion is computed live from real saved
// journey/session data. No achievement is ever marked earned without direct
// evidence. Related badges reuse the existing approved SMOKECRAFT_BADGES
// catalog (src/constants/smokecraftRewards.js) rather than inventing new ones.
function buildAchievements(session, journey) {
  const steps = session?.completedSteps || []
  const has = (id) => steps.includes(id)

  const defs = [
    {
      id: 'cigar-selected', title: 'Cigar Selected', relatedSession: 'Choose Your Cigar (S2)',
      description: 'Chose a cigar to begin this SmokeCraft journey.',
      criteria: 'Complete Choose Your Cigar.',
      badge: SMOKECRAFT_BADGES.FIRST_SMOKE,
      check: () => ({ earned: has('humidor-match'), current: has('humidor-match') ? 1 : 0, total: 1 }),
    },
    {
      id: 'terroir-scholar', title: 'Terroir Scholar', relatedSession: 'Terroir (S4)',
      description: 'Explored the origin, soil, and climate behind the leaf.',
      criteria: 'Complete Terroir.',
      badge: SMOKECRAFT_BADGES.ORIGIN_KNOWLEDGE,
      check: () => ({ earned: has('terroir'), current: has('terroir') ? 1 : 0, total: 1 }),
    },
    {
      id: 'cut-and-light', title: 'Perfect Cut & Light', relatedSession: 'Choose Your Cut / Lighting Tutorial (S6–S7)',
      description: 'Completed both the cut selection and lighting tutorial.',
      criteria: 'Complete Choose Your Cut and Lighting Tutorial.',
      badge: SMOKECRAFT_BADGES.CUT_AND_LIGHT,
      check: () => {
        const current = (has('cut-toast-light') ? 1 : 0) + (has('lighting-tutorial') ? 1 : 0)
        return { earned: current === 2, current, total: 2 }
      },
    },
    {
      id: 'mentor-guided', title: 'Mentor Guided', relatedSession: 'Mentor Commentary (S14)',
      description: 'Reviewed real-time mentor commentary during the session.',
      criteria: 'Complete Mentor Commentary.',
      badge: SMOKECRAFT_BADGES.MENTOR_PAIR,
      check: () => ({ earned: has('mentor-commentary'), current: has('mentor-commentary') ? 1 : 0, total: 1 }),
    },
    {
      id: 'full-tasting-arc', title: 'Full Tasting Arc', relatedSession: 'First Draw / Flavor Evolution / Flavor Finish (S8, S12, S16)',
      description: 'Tracked flavor across all three thirds of the smoke.',
      criteria: 'Complete First Draw, Flavor Evolution, and Flavor Finish.',
      badge: SMOKECRAFT_BADGES.FINAL_THIRD,
      check: () => {
        const current = (has('first-third') ? 1 : 0) + (has('second-third') ? 1 : 0) + (has('final-third') ? 1 : 0)
        return { earned: current === 3, current, total: 3 }
      },
    },
    {
      id: 'scorecard-complete', title: 'Scorecard Complete', relatedSession: 'Rate Every Category (S19)',
      description: 'Rated every category on the scorecard.',
      criteria: 'Rate all 6 scorecard categories.',
      badge: SMOKECRAFT_BADGES.SCORECARD,
      check: () => {
        const cats = journey?.scorecard?.categories || {}
        const rated = Object.values(cats).filter(v => v !== null && v !== undefined).length
        return { earned: rated >= 6, current: rated, total: 6 }
      },
    },
    {
      id: 'passport-stamped', title: 'Passport Stamped', relatedSession: 'Passport Stamp (S23)',
      description: 'Earned an official SmokeCraft 360 Passport Stamp.',
      criteria: 'Complete Passport Stamp.',
      badge: SMOKECRAFT_BADGES.PASSPORT_STAMP,
      check: () => ({ earned: has('passport-stamp'), current: has('passport-stamp') ? 1 : 0, total: 1 }),
    },
    {
      id: 'pairing-strategist', title: 'Pairing Strategist', relatedSession: 'Personalized Pairing Recommendations (S22)',
      description: 'Saved a personalized pairing recommendation.',
      criteria: 'Save a recommendation on Personalized Pairing Recommendations.',
      badge: SMOKECRAFT_BADGES.PAIRING_EXPLORER,
      check: () => {
        const saved = !!journey?.pairingRecommendations?.savedRecommendation
        return { earned: saved, current: saved ? 1 : 0, total: 1 }
      },
    },
  ]

  return defs.map(d => {
    let result
    try {
      result = d.check()
    } catch {
      return { ...d, unconfigured: true, earned: false, current: 0, total: 1 }
    }
    return { ...d, unconfigured: false, ...result }
  })
}

// Honest placeholder — Knowledge Check / Text Quiz is explicitly not part of
// this package's scope (or the current spine at all), so no quiz-based
// achievement can be computed from real data. Shown, not hidden, per the
// package's "label unconfigured achievements honestly" requirement.
const UNCONFIGURED_ACHIEVEMENT_NOTE = {
  id: 'knowledge-check',
  title: 'Knowledge Check Achievement',
  description: 'Achievement criteria not configured — Knowledge Check / Text Quiz has not been built yet.',
}

function BadgeCrest({ label, earned, size = 56 }) {
  return (
    <div
      aria-label={`${label} badge${earned ? ' (earned)' : ' (locked)'}`}
      style={{
        width: size, height: size + 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: earned
          ? 'linear-gradient(160deg, rgba(233,193,118,0.22), rgba(10,10,10,0.9))'
          : 'rgba(255,255,255,0.03)',
        border: `2px solid ${earned ? GOLD : 'rgba(229,226,225,0.18)'}`,
        borderRadius: '10px 10px 40% 40%',
        boxShadow: earned ? '0 0 14px rgba(233,193,118,0.25)' : 'none',
      }}
    >
      <ShieldPersonIcon size={size * 0.5} style={{ color: earned ? GOLD : 'rgba(229,226,225,0.3)' }} />
    </div>
  )
}

// Canonical Runtime pass — routed through SmokeCraftScreenRenderer as
// screenId="session-25". This one component uniquely hosts TWO merged
// sessions (S25 Rewards + S26 Achievements) behind an internal `mode`
// toggle: the S25 "continue" does NOT navigate (it switches to the
// achievements view in-place), and the S26 "continue" awards a different
// completion key ('achievements') before navigating. That two-phase,
// two-completion-key, single-route flow cannot be expressed by the
// renderer's single award+navigate onComplete without changing approved
// behavior, so both completions stay internal here (idempotent awards,
// unchanged navigation). onBack is accepted for the S25-mode back button.
export default function Rewards({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode, currentSession } = useSmokeCraftProgress()
  const { journey, setRewards, setAchievements } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // S25 prerequisite — Completed Scorecard (S24 / final-review) must be done first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('final-review')) {
      navigate('/smokecraft/final-review', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState('loading') // loading | error | ready
  // Required-Interaction Closure Package F — Session 25's displayed XP/rank
  // totals must come from the canonical server record
  // (smokecraft_player_state, read via GET /api/smokecraft/player-state /
  // fetchPlayerState()), not only from the local optimistic cache
  // (session.xp). serverXpState is the fetched canonical value; when the
  // fetch fails (offline, network error), the UI honestly falls back to the
  // local cache and says so (see isOffline / usingLocalXpFallback below) —
  // it never fabricates a server value.
  const [serverXpState, setServerXpState] = useState(null) // { xpTotal, rankLabel } | null
  const [serverXpFetchFailed, setServerXpFetchFailed] = useState(false)
  const [mode, setMode] = useState(() => {
    if (journey.rewards?.activeMode) return journey.rewards.activeMode
    // completedSteps (not currentSession) drives the fallback — currentSession
    // is unreliable here in demo mode, where SmokeCraftProgressContext treats
    // every session as complete for preview purposes.
    if (session.completedSteps.includes('rewards')) return 'achievements'
    return currentSession === 26 ? 'achievements' : 'rewards'
  })
  const [claimStatus, setClaimStatus] = useState('idle') // idle | saved
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // S26 internal guard — Achievements mode requires S25 (rewards) to already
  // be complete. Same route, so this is an in-screen redirect, not an App.jsx
  // route guard. Demo mode bypasses, matching every other guard in the app.
  useEffect(() => {
    if (!isDemoMode && mode === 'achievements' && !session.completedSteps.includes('rewards')) {
      setMode('rewards')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Load the canonical server player-state (XP total, rank) once per mount.
  // This is the same fetchPlayerState() client already proven for the
  // leaderboard (smokeLeaderboardService.js) — no second reward/XP read
  // path is invented for this screen.
  useEffect(() => {
    let cancelled = false
    async function run() {
      setPhase('loading')
      const result = await fetchPlayerState()
      if (cancelled) return
      if (result.ok) {
        setServerXpState({ xpTotal: result.state.xpTotal, rankLabel: result.state.rankLabel })
        setServerXpFetchFailed(false)
      } else {
        // Honest fallback — do not block the screen, but do not silently
        // pretend the local cache is server-verified either.
        setServerXpState(null)
        setServerXpFetchFailed(true)
      }
      setPhase('ready')
    }
    run()
    return () => { cancelled = true }
  }, [])

  // Persist active mode (idempotent — only writes when it actually changed).
  useEffect(() => {
    if (journey.rewards?.activeMode === mode) return
    setRewards({ ...(journey.rewards || {}), activeMode: mode, updatedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Canonical XP source — server player-state when reachable, honest local
  // fallback (with an explicit "offline"/unsynced flag exposed for UI +
  // tests) when it isn't. The local value is never presented as
  // server-verified when it wasn't.
  const usingServerXp = serverXpState !== null
  const totalXP = usingServerXp ? serverXpState.xpTotal : (session?.xp || 0)
  const currentRank = getRankFromXP(totalXP)
  const { totals: xpTotals, unconfiguredCompleted } = useMemo(
    () => buildXPBreakdown(session?.completedSteps || []),
    [session?.completedSteps]
  )
  const completedSessionXP = getSmokeCraftXP(session?.completedSteps || [])
  const earnedSessionBadges = useMemo(() => getEarnedBadges(session?.completedSteps || []), [session?.completedSteps])

  const claimedTiers = journey.rewards?.claimedTiers || []
  const nextTier = RANKS.find(r => r.minXP > totalXP) || null

  function handleClaimTier(rank) {
    if (totalXP < rank.minXP || claimedTiers.includes(rank.name)) return
    triggerHaptic('light')
    const next = [...new Set([...claimedTiers, rank.name])]
    setRewards({ ...(journey.rewards || {}), claimedTiers: next, activeMode: mode, updatedAt: Date.now() })
    setClaimStatus('saved')
    setTimeout(() => setClaimStatus('idle'), 2000)
  }

  const achievements = useMemo(() => buildAchievements(session, journey), [session, journey])
  const earnedAchievements = journey.achievements?.earned || {}
  const claimedAchievements = journey.achievements?.claimed || []

  // Persist newly-earned achievements (idempotent — never overwrites an
  // existing earnedAt, never marks something earned without real evidence).
  useEffect(() => {
    const updates = {}
    let changed = false
    for (const a of achievements) {
      if (a.earned && !earnedAchievements[a.id]) {
        updates[a.id] = { earnedAt: Date.now() }
        changed = true
      }
    }
    if (changed) {
      setAchievements({
        ...(journey.achievements || {}),
        earned: { ...earnedAchievements, ...updates },
        updatedAt: Date.now(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievements])

  function handleClaimAchievement(id) {
    const a = achievements.find(x => x.id === id)
    if (!a?.earned || claimedAchievements.includes(id)) return
    triggerHaptic('light')
    const next = [...new Set([...claimedAchievements, id])]
    setAchievements({ ...(journey.achievements || {}), claimed: next, updatedAt: Date.now() })
    setClaimStatus('saved')
    setTimeout(() => setClaimStatus('idle'), 2000)
  }

  const handleRetry = useCallback(() => {
    setPhase('loading')
    fetchPlayerState().then(result => {
      if (result.ok) {
        setServerXpState({ xpTotal: result.state.xpTotal, rankLabel: result.state.rankLabel })
        setServerXpFetchFailed(false)
      } else {
        setServerXpState(null)
        setServerXpFetchFailed(true)
      }
      setPhase('ready')
    })
  }, [])

  // Re-reads the canonical server XP total shortly after a local award —
  // completeSessionOnServer (called inside awardSessionRewards) is
  // fire-and-forget, so this re-fetch lets the displayed total catch up to
  // the now-authoritative server record without requiring a full reload.
  // Best-effort only: a failure here just leaves the previous server
  // reading (or local fallback) in place, honestly.
  const refreshServerXp = useCallback(() => {
    setTimeout(() => {
      fetchPlayerState().then(result => {
        if (result.ok) {
          setServerXpState({ xpTotal: result.state.xpTotal, rankLabel: result.state.rankLabel })
          setServerXpFetchFailed(false)
        }
      })
    }, 250)
  }, [])

  function handleRewardsContinue() {
    // Views the Rewards section, then marks S25 complete only now — never on mount.
    awardSessionRewards('rewards')
    refreshServerXp()
    setRewards({ ...(journey.rewards || {}), activeMode: 'achievements', viewedAt: journey.rewards?.viewedAt || Date.now(), completedAt: journey.rewards?.completedAt || Date.now(), updatedAt: Date.now() })
    setMode('achievements')
  }

  function handleAchievementsBack() {
    setMode('rewards')
  }

  function handleAchievementsContinue() {
    awardSessionRewards('achievements')
    refreshServerXp()
    setAchievements({ ...(journey.achievements || {}), completedAt: journey.achievements?.completedAt || Date.now(), updatedAt: Date.now() })
    navigate('/smokecraft/session-complete')
  }

  const achievementsUnlocked = isDemoMode || session.completedSteps.includes('rewards')

  // TWO-GENERATION MIGRATION: S25 (Rewards) previously rendered through the
  // approved "session 25 rewards.png" image-shell as its full visual
  // foundation, with real content occluding its blank-value zones. Now
  // real live DOM using the shared smokecraftLiveScreenTokens system — no
  // decorative image, matching the pattern already established for
  // Mini Tasting Round / Final Review / Management Sync and this pass's
  // other conversions. S26 (Achievements) below already used real live
  // DOM (its SC_ASSETS.achievements header band is genuinely decorative —
  // no baked UI — so it is left as-is).
  if (mode === 'rewards') {
    return (
      <SmokeCraftScreenShell mode="live" status="ready">
        <SmokeCraftOwnerHeroBackground assetKey="ownerRewardsHero" label="A golden box of premium cigars" bgPosition="center" bgSize="cover" />
        <div style={{ ...pageShellStyle, position: 'relative', zIndex: 2 }}>
          <div style={heroBannerStyle}>
            <div aria-hidden="true" style={{ fontSize: 40 }}>🏆</div>
            <div>
              <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Session 25</div>
              <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Rewards</h1>
              <p style={{ margin: 0, maxWidth: 700, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
                Your real XP, rank progress, and earned badges from this journey.
              </p>
            </div>
          </div>

          {/* Package F: exposes which XP source is currently backing the
              display — 'server' (canonical smokecraft_player_state) or
              'local-fallback' (offline/unreachable). Visually hidden;
              consumed by tests and support tooling only. */}
          <span data-testid="s25-xp-source" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {usingServerXp ? 'server' : 'local-fallback'}
          </span>

          {/* Four point summary boxes, filled honestly — same disclosed
              pattern as the Rewards Center: only Available and Earned This
              Session are real, distinct numbers; Lifetime/Redeemed are not
              separately tracked by this build's loyalty model. */}
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Points</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 10 }}>
              {[
                { label: 'available', title: 'Available', value: totalXP },
                { label: 'earned', title: 'Earned This Session', value: completedSessionXP },
                { label: 'lifetime', title: 'Lifetime', value: totalXP },
                { label: 'redeemed', title: 'Redeemed', value: '—' },
              ].map(box => (
                <div key={box.label} data-testid={`s25-${box.label}`} style={{
                  background: NAVY_DEEP, borderRadius: 10, padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 10.5, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{box.title}</span>
                  <span style={{ fontWeight: 700, fontSize: 'clamp(18px,2vw,24px)', color: GOLD }}>{box.value}</span>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
              <div style={sectionLabelStyle}>Loyalty Tier</div>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 18, color: GOLD, fontWeight: 700 }}>{currentRank.name}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, background: 'rgba(233,193,118,0.15)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${nextTier ? Math.round((totalXP / nextTier.minXP) * 100) : 100}%`, background: GOLD, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginTop: 6, textAlign: 'center' }}>
                  {nextTier ? `${nextTier.minXP - totalXP} XP to ${nextTier.name}` : 'Highest rank reached'}
                </div>
              </div>
            </section>

            {/* SC-D089: venue-specific offers/redemption history genuinely
                require a venue reward catalog that does not exist in this
                build — an honest "coming soon" panel, not invented data. */}
            <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
              <div style={sectionLabelStyle}>Today At Your Venue</div>
              <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 8 }}>
                Venue-specific offers require a connected reward catalog — not available in this build yet.
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={sectionLabelStyle}>Recent Redemptions</div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 8 }}>
                  Redemption history requires a connected reward catalog — not available in this build yet.
                </div>
              </div>
            </section>
          </div>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic', marginBottom: 14 }}>
              No venue reward catalog is connected to this build yet, so featured/cigar/experience/accessory/merch offers cannot be listed. Your real XP and earned rewards are shown below.
            </div>

            <div>
              <div style={sectionLabelStyle}>XP Breakdown</div>
              {[
                ['Completed-Session XP', completedSessionXP],
                ['Passport XP', xpTotals.passport],
                ['Pairing XP', xpTotals.pairing],
                ['Mentor XP', xpTotals.mentor],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: CREAM }}>
                  <span>{label}</span><span style={{ color: GOLD_DIM }}>{val} XP</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <div style={sectionLabelStyle}>Rank Milestone Rewards</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {RANKS.map(rank => {
                  const claimed = claimedTiers.includes(rank.name)
                  const available = totalXP >= rank.minXP && !claimed
                  const locked = totalXP < rank.minXP
                  return (
                    <div key={rank.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <BadgeCrest label={rank.name} earned={!locked} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{rank.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>Requires {rank.minXP}+ XP</div>
                      </div>
                      {claimed && <span style={{ fontSize: 11.5, color: GOLD }}>✓ Claimed</span>}
                      {available && (
                        <button
                          type="button" aria-label={`Claim ${rank.name} reward`}
                          onClick={() => handleClaimTier(rank)}
                          style={{ minHeight: 36, background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 16, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12, padding: '6px 14px', cursor: 'pointer', outline: 'none' }}
                        >
                          Claim
                        </button>
                      )}
                      {locked && <span style={{ fontSize: 11.5, color: 'rgba(229,226,225,0.35)' }}>Locked</span>}
                    </div>
                  )
                })}
              </div>
              {claimStatus === 'saved' && <div style={{ marginTop: 8, fontSize: 11.5, color: GOLD }}>✓ Saved</div>}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <div style={sectionLabelStyle}>Earned Session Badges</div>
              {earnedSessionBadges.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                  {earnedSessionBadges.map(b => (
                    <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 66 }}>
                      <BadgeCrest label={b.label} earned size={40} />
                      <span style={{ fontSize: 9.5, color: CREAM, textAlign: 'center' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No badges earned yet.</p>
              )}
            </div>
          </section>

          <div style={{ height: 90 }} aria-hidden="true" />
        </div>

        <SmokeCraftNavBar
          primary="Continue to Achievements →"
          onPrimary={handleRewardsContinue}
          secondary="← Back"
          onSecondary={onBack || (() => navigate('/smokecraft/final-review'))}
        />
      </SmokeCraftScreenShell>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as a decorative header band. */}
      <div
        role="img"
        aria-label="SmokeCraft Achievements"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.achievements})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Rewards
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Rewards, XP &amp; Achievements
        </h1>
        {(isOffline || serverXpFetchFailed) && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Offline: showing your locally saved data. XP/rank will refresh once reconnected.</div>}
        <span data-testid="s25-xp-source" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {usingServerXp ? 'server' : 'local-fallback'}
        </span>

        <div role="tablist" aria-label="Rewards sections" style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button" role="tab" aria-selected={mode === 'rewards'}
            aria-label="Rewards and XP"
            onClick={() => { triggerHaptic('light'); setMode('rewards') }}
            style={{
              minWidth: 44, minHeight: 40, padding: '8px 16px', borderRadius: 20,
              border: `1.5px solid ${mode === 'rewards' ? GOLD : 'rgba(229,226,225,0.2)'}`,
              background: mode === 'rewards' ? 'rgba(233,193,118,0.12)' : 'transparent',
              color: mode === 'rewards' ? GOLD : 'rgba(229,226,225,0.7)',
              fontFamily: 'Georgia, serif', fontSize: 'clamp(11px,1.2vw,13px)', cursor: 'pointer', outline: 'none',
            }}
          >
            Rewards &amp; XP
          </button>
          <button
            type="button" role="tab" aria-selected={mode === 'achievements'}
            aria-label={`Achievements${achievementsUnlocked ? '' : ' (locked)'}`}
            aria-disabled={!achievementsUnlocked}
            onClick={() => { if (achievementsUnlocked) { triggerHaptic('light'); setMode('achievements') } }}
            style={{
              minWidth: 44, minHeight: 40, padding: '8px 16px', borderRadius: 20,
              border: `1.5px solid ${mode === 'achievements' ? GOLD : 'rgba(229,226,225,0.2)'}`,
              background: mode === 'achievements' ? 'rgba(233,193,118,0.12)' : 'transparent',
              color: !achievementsUnlocked ? 'rgba(229,226,225,0.3)' : mode === 'achievements' ? GOLD : 'rgba(229,226,225,0.7)',
              fontFamily: 'Georgia, serif', fontSize: 'clamp(11px,1.2vw,13px)',
              cursor: achievementsUnlocked ? 'pointer' : 'not-allowed', outline: 'none',
            }}
          >
            Achievements{!achievementsUnlocked ? ' 🔒' : ''}
          </button>
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(150px,20vh,190px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Safe navigation to the new supporting gamification screens —
              additive only, no change to the existing Rewards/Achievements
              flow above or the primary nav bar below. */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Challenge Hub', to: NAV.CHALLENGES },
              { label: 'Collections', to: NAV.COLLECTIONS },
              { label: 'Skill Tree', to: '/smokecraft/skill-tree' },
            ].map(link => (
              <button key={link.to} type="button" onClick={() => navigate(link.to)}
                style={{ minHeight: 40, padding: '8px 16px', borderRadius: 18, border: `1px solid ${BORDER}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                {link.label} →
              </button>
            ))}
          </div>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin3 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading your rewards…</p>
              <style>{'@keyframes sc-spin3 { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading your rewards.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && mode === 'achievements' && (
            <>
              {!achievementsUnlocked && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.65)' }}>Achievements unlock once you've viewed Rewards &amp; XP.</p>
                </div>
              )}
              {achievementsUnlocked && achievements.length === 0 && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.65)' }}>No achievements available yet.</p>
                </div>
              )}
              {achievementsUnlocked && achievements.map(a => {
                const claimed = claimedAchievements.includes(a.id)
                const earnedAt = earnedAchievements[a.id]?.earnedAt
                return (
                  <div key={a.id} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)', display: 'flex', gap: 14 }}>
                    <BadgeCrest label={a.title} earned={a.earned} size={52} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: CREAM }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{a.description}</div>
                      <div style={{ fontSize: 11, color: GOLD_DIM, marginTop: 4 }}>Criteria: {a.criteria}</div>
                      <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', marginTop: 2 }}>Related: {a.relatedSession}</div>
                      <div style={{ marginTop: 6, height: 4, background: 'rgba(233,193,118,0.15)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.round((a.current / a.total) * 100)}%`, background: a.earned ? GOLD : 'rgba(233,193,118,0.5)', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)', marginTop: 4 }}>
                        {a.earned ? `Earned${earnedAt ? ' ' + new Date(earnedAt).toLocaleDateString() : ''}` : `In progress: ${a.current}/${a.total}`}
                      </div>
                      {a.earned && !claimed && (
                        <button
                          type="button" aria-label={`Claim ${a.title} achievement`}
                          onClick={() => handleClaimAchievement(a.id)}
                          style={{ marginTop: 8, background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 16, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12, padding: '6px 14px', cursor: 'pointer', outline: 'none', minHeight: 36 }}
                        >
                          Claim
                        </button>
                      )}
                      {claimed && <div style={{ marginTop: 8, fontSize: 12, color: GOLD }}>✓ Claimed</div>}
                    </div>
                  </div>
                )
              })}
              {achievementsUnlocked && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)', opacity: 0.7 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: CREAM }}>{UNCONFIGURED_ACHIEVEMENT_NOTE.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4, fontStyle: 'italic' }}>{UNCONFIGURED_ACHIEVEMENT_NOTE.description}</div>
                </div>
              )}
              {claimStatus === 'saved' && <div style={{ fontSize: 12, color: GOLD }}>✓ Saved</div>}
            </>
          )}
        </div>
      </main>

      {mode === 'rewards' ? (
        <SmokeCraftNavBar
          primary="Continue to Achievements →"
          onPrimary={handleRewardsContinue}
          secondary="← Back"
          onSecondary={onBack || (() => navigate('/smokecraft/final-review'))}
        />
      ) : (
        <SmokeCraftNavBar
          primary="Continue to Recommended Next Journey →"
          onPrimary={handleAchievementsContinue}
          primaryDisabled={!achievementsUnlocked}
          secondary="← Back to Rewards"
          onSecondary={handleAchievementsBack}
        />
      )}
    </div>
  )
}
