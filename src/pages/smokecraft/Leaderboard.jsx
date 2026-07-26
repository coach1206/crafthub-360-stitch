import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { RANKS, getRankFromXP } from '../../constants/session.js'
import { getLeaderboardSnapshot } from '../../services/smokecraft/smokeLeaderboardService.js'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'

/**
 * Leaderboard — /smokecraft/leaderboard (also /grand-lounge-ranking, /leaderboard)
 *
 * FINAL APPROVED SHELLS PASS — this file replaces the hand-built CSS layout
 * that the immediately-prior pass explicitly disclosed as unfinished:
 *
 *   "Leaderboard.jsx (Rankings) is still a hand-built CSS layout. The approved
 *    LEADERBOARD 111.png is used only as a ~14vh decorative header band ...
 *    the approved image is not yet the visual foundation of this screen."
 *
 * It now is. The approved image renders intact at its true 1538x1022 aspect
 * ratio via SmokeCraftImageBoundsOverlay (object-fit:contain semantics), and
 * every baked placeholder is covered by an OPAQUE overlay carrying the user's
 * real saved value — the same technique Format.jsx and the prior pass's
 * HowItWorks.jsx fix already use.
 *
 * What was removed
 * ----------------
 *   - the `clamp(90px,14vh,140px)` decorative header band using the approved
 *     image as a cropped `background-size: cover` strip;
 *   - the entire generic dark <header>/<main> dashboard rendered beneath it
 *     (duplicate "Leaderboard" title, glass-card filter panel, glass-card
 *     entry list, honest-boundary card);
 *   - the SmokeCraftNavBar whose primary control was permanently
 *     `primaryDisabled` (the "disabled-looking bottom control").
 *
 * Baked values occluded (they are fabricated placeholders in the approved file)
 * ---------------------------------------------------------------------------
 *   sidebar : "YOUR NAME", "Aficionado Level 4", "12,450 XP", the photo circle
 *   table   : all 7 fabricated competitor rows — JAMES CARTER / 18,750 XP,
 *             SOFIA MARTINEZ, MICHAEL TORRES, DAVID NGUYEN,
 *             ALEXANDER JOHNSON, ISABELLA ROSS, WILLIAM ANDERSON
 *   strip   : "12", the stock portrait, "4,250 XP", "Enthusiast", "5", "750 XP"
 *
 * No competitor is ever invented to refill the occluded table. This build has
 * no shared ranking source (smokeLeaderboardService.getLeaderboardSnapshot
 * returns `communityEntries: []` by construction), so the table zone shows the
 * current user's own real standing and states plainly that shared rankings are
 * unavailable.
 *
 * All real behaviour from the removed layout is carried forward unchanged:
 * scope / time-range / tier filters and their session persistence, refresh +
 * staleness, offline detection, and buildCurrentUserEntry's canonical reads.
 * The filters now live on the approved image's OWN tab row and venue
 * dropdown instead of a separate React filter panel.
 */

const NAT_W = 1538
const NAT_H = 1022

const GOLD   = '#E9C176'
const CREAM  = '#e5e2e1'
const PANEL  = '#080c14'

// System Audit Prompt 3 (SC-D010) — pixel-calibrated positions for the
// approved image's baked sidebar rows (from 1538x1022 LEADERBOARD 111.png).
// LEADERBOARD itself is the current page and is intentionally excluded
// (its baked highlight reflects real navigation state, not a false default).
// Holistic Fix 2 — migrated off local hardcoded route literals onto the
// one shared smokecraftNavigationRegistry. Destinations unchanged from the
// SC-D010 fix; only the source of truth moved.
const SIDEBAR_ITEMS = [
  { key: 'lounge',     label: 'Back to SmokeCraft landing', route: NAV.LOUNGE,     top: '33.8%' },
  { key: 'journey',    label: 'Journey',                     route: NAV.JOURNEY,    top: '38.4%' },
  { key: 'cigars',     label: 'Cigars',                      route: NAV.CIGARS,     top: '43.0%' },
  { key: 'challenges', label: 'Challenges',                  route: NAV.CHALLENGES, top: '47.6%' },
  { key: 'events',     label: 'Events',                      route: NAV.EVENTS,     top: '52.2%' },
  { key: 'rewards',    label: 'Rewards',                     route: NAV.REWARDS,    top: '61.3%' },
  { key: 'passport',   label: 'Passport',                    route: NAV.PASSPORT,   top: '65.9%' },
  { key: 'settings',   label: 'Settings (not yet available)', route: null, top: '70.6%', disabled: true },
]

// Opaque — must fully occlude the baked pixels underneath, never sit
// translucently on top of them (see Format.jsx's PANEL rationale).
const OPAQUE = {
  position: 'absolute',
  background: PANEL,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'Georgia, serif',
  pointerEvents: 'none',
  overflow: 'hidden',
}

// Percentage coordinates measured against the approved image's own layout.
const ZONES = {
  avatar:      { left: '3.4%',  top: '4.6%',  width: '6.9%',  height: '10.4%' },
  name:        { left: '1.8%',  top: '17.0%', width: '12.2%', height: '3.0%' },
  tier:        { left: '1.8%',  top: '20.3%', width: '12.2%', height: '2.9%' },
  xp:          { left: '1.8%',  top: '24.0%', width: '12.2%', height: '4.2%' },
  table:       { left: '16.4%', top: '29.2%', width: '78.9%', height: '48.4%' },
  rankNum:     { left: '18.6%', top: '83.2%', width: '5.2%',  height: '6.0%' },
  rankAvatar:  { left: '24.8%', top: '81.6%', width: '6.4%',  height: '8.8%' },
  points:      { left: '33.4%', top: '85.2%', width: '8.4%',  height: '3.8%' },
  nextRank:    { left: '44.8%', top: '85.2%', width: '6.8%',  height: '3.4%' },
  nextLevel:   { left: '52.8%', top: '82.8%', width: '4.6%',  height: '6.4%' },
  toNext:      { left: '61.5%', top: '85.2%', width: '5.6%',  height: '3.4%' },
}

// The approved image's own tab row and venue dropdown.
const TABS = {
  row:      { top: '20.6%', height: '4.9%' },
  topAf:    { left: '16.4%', width: '16.3%' },
  thisMonth:{ left: '32.7%', width: '15.4%' },
  thisWeek: { left: '48.1%', width: '15.3%' },
  allTime:  { left: '63.4%', width: '15.3%' },
  venues:   { left: '82.6%', width: '12.7%' },
}

const TIME_RANGES = [
  { id: 'weekly',   label: 'This Week',  ms: 7 * 24 * 60 * 60 * 1000 },
  { id: 'monthly',  label: 'This Month', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all-time', label: 'All Time',   ms: null },
]

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
}

function formatTimestamp(ts) {
  if (!ts) return null
  try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch { return null }
}

/**
 * Builds the current guest's leaderboard entry from real, already-canonical
 * data only — session (GuestSessionContext) + journey (SmokeCraftJourneyContext).
 * Never fabricates other players; the community board stays honestly empty
 * until a real shared backend exists (see smokeLeaderboardService.js).
 *
 * Carried forward verbatim from the removed layout — this logic was correct.
 */
function buildCurrentUserEntry(session, journey) {
  const xp = session?.xp || 0
  const tier = getRankFromXP(xp)
  const displayName = journey.identity?.preferredName || session?.profile?.nickname || 'Guest'
  const isAnonymous = displayName === 'Guest'

  const completedJourneys = (journey.previousCompletedJourneys?.length || 0)
    + (session?.completedSteps?.includes('session-complete') ? 1 : 0)

  const passportStamps = journey.passportStamp?.stamped ? 1 : 0

  const achievements = journey.achievements?.earned ? Object.keys(journey.achievements.earned).length : 0

  const kc = session?.smokeCraft?.knowledgeChecks || {}
  const quizEntries = Object.values(kc)
  const quizScore = quizEntries.reduce((sum, q) => sum + (q.score || 0), 0)
  const quizTotal = quizEntries.reduce((sum, q) => sum + (q.total || 0), 0)

  return {
    id: session?.sessionId || 'you',
    isCurrentUser: true,
    displayName,
    isAnonymous,
    xp,
    tier: tier.name,
    tierColor: tier.color,
    completedJourneys,
    passportStamps,
    achievements,
    quizScore,
    quizTotal,
    challengePoints: null, // no real challenge-scoring source exists — honestly absent, never fabricated
    venue: journey.selectedVenue?.name || null,
    lastActivityAt: journey.journeyUpdatedAt || null,
  }
}

function Occlude({ zone, children, testid, style }) {
  return <div data-testid={testid} style={{ ...OPAQUE, ...zone, ...style }}>{children}</div>
}

function Tab({ zone, active, label, onClick, testid }) {
  return (
    <button
      type="button"
      data-testid={testid}
      aria-pressed={active}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: zone.left, width: zone.width, top: TABS.row.top, height: TABS.row.height,
        background: active ? 'linear-gradient(180deg, #F3D48E, #C79A4B)' : PANEL,
        color: active ? '#241605' : 'rgba(229,226,225,0.72)',
        border: active ? 'none' : '1px solid rgba(233,193,118,0.22)',
        fontFamily: 'Georgia, serif',
        fontWeight: active ? 700 : 400,
        fontSize: 'clamp(9px,1.02vw,15px)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

export default function Leaderboard() {
  const { session, update } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const prefs = session?.smokeCraft?.leaderboardPrefs || {}

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [scope, setScope] = useState(prefs.scope || 'global')
  const [timeRange, setTimeRange] = useState(prefs.timeRange || 'all-time')
  const [tierFilter, setTierFilter] = useState(prefs.tierFilter ?? null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    try {
      const t = setTimeout(() => setPhase('ready'), 200)
      return () => clearTimeout(t)
    } catch {
      setPhase('error')
    }
  }, [])

  // Persist filter selections to the existing canonical session record — no
  // new storage key, reusing the same free-form smokeCraft bucket already
  // used elsewhere (e.g. Package O's knowledgeChecks).
  useEffect(() => {
    if (phase !== 'ready') return
    const p = session?.smokeCraft?.leaderboardPrefs
    if (p?.scope === scope && p?.timeRange === timeRange && p?.tierFilter === tierFilter) return
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        leaderboardPrefs: { ...(prev.smokeCraft?.leaderboardPrefs || {}), scope, timeRange, tierFilter },
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scope, timeRange, tierFilter])

  const snapshot = useMemo(() => getLeaderboardSnapshot(session), [session])
  const currentEntry = useMemo(() => buildCurrentUserEntry(session, journey), [session, journey])

  // The only real entries available are the current guest's own — the
  // community board is honestly empty until a shared backend exists
  // (smokeLeaderboardService.js). Filters are applied for real against this
  // one real entry, so a filter can genuinely include or exclude it.
  const filteredEntries = useMemo(() => {
    return [currentEntry].filter(e => {
      if (scope === 'venue' && !e.venue) return false
      if (tierFilter && e.tier !== tierFilter) return false
      const range = TIME_RANGES.find(r => r.id === timeRange)
      if (range?.ms && e.lastActivityAt) {
        if (Date.now() - e.lastActivityAt > range.ms) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tierFilter, timeRange, currentEntry])

  function handleRefresh() {
    triggerHaptic('light')
    setRefreshing(true)
    const now = Date.now()
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        leaderboardPrefs: { ...(prev.smokeCraft?.leaderboardPrefs || {}), lastRefreshedAt: now },
      },
    }))
    setTimeout(() => setRefreshing(false), 400)
  }

  function handleRetry() {
    triggerHaptic('light')
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  const lastRefreshedAt = session?.smokeCraft?.leaderboardPrefs?.lastRefreshedAt || null
  const isStale = lastRefreshedAt ? (Date.now() - lastRefreshedAt) > (24 * 60 * 60 * 1000) : false

  const rank = getRankFromXP(currentEntry.xp)
  const nextTier = RANKS.find(r => r.minXP > currentEntry.xp) || null

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.leaderboard}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — Leaderboard"
      bottomOffset={0}
    >
      {/* Single accessible page title. The approved image carries the visible
          "LEADERBOARD" wordmark, so this is visually hidden — no duplicate. */}
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 — Leaderboard</h1>

      {/* ── Baked sidebar identity chip ─────────────────────────────────── */}
      <Occlude zone={ZONES.avatar} style={{ borderRadius: '50%', justifyContent: 'center', border: `1.5px solid ${GOLD}` }}>
        <span data-testid="lb-avatar-initials" style={{ fontSize: 'clamp(11px,1.4vw,20px)', fontWeight: 700, color: GOLD }}>
          {initials(currentEntry.displayName)}
        </span>
      </Occlude>
      <Occlude zone={ZONES.name} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-name" style={{ fontSize: 'clamp(9px,1.1vw,16px)', fontWeight: 700, color: CREAM, letterSpacing: '0.05em' }}>
          {currentEntry.isAnonymous ? 'GUEST' : currentEntry.displayName.toUpperCase()}
        </span>
      </Occlude>
      <Occlude zone={ZONES.tier} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-tier" style={{ fontSize: 'clamp(8px,0.95vw,14px)', color: GOLD }}>
          {rank.name}
        </span>
      </Occlude>
      <Occlude zone={ZONES.xp} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-xp" style={{ fontSize: 'clamp(11px,1.45vw,21px)', color: GOLD }}>
          {currentEntry.xp.toLocaleString()} XP
        </span>
      </Occlude>

      {/* ── Live filters on the approved image's own tab row ─────────────── */}
      <Tab
        testid="lb-tab-top" zone={TABS.topAf} label="Top Aficionados"
        active={!tierFilter}
        onClick={() => { triggerHaptic('light'); setTierFilter(null) }}
      />
      <Tab
        testid="lb-tab-month" zone={TABS.thisMonth} label="This Month"
        active={timeRange === 'monthly'}
        onClick={() => { triggerHaptic('light'); setTimeRange('monthly') }}
      />
      <Tab
        testid="lb-tab-week" zone={TABS.thisWeek} label="This Week"
        active={timeRange === 'weekly'}
        onClick={() => { triggerHaptic('light'); setTimeRange('weekly') }}
      />
      <Tab
        testid="lb-tab-alltime" zone={TABS.allTime} label="All Time"
        active={timeRange === 'all-time'}
        onClick={() => { triggerHaptic('light'); setTimeRange('all-time') }}
      />

      {/* Venue / global scope — the approved image's own "ALL VENUES" control */}
      <select
        data-testid="lb-scope"
        aria-label="Leaderboard venue scope"
        value={scope}
        onChange={e => { triggerHaptic('light'); setScope(e.target.value) }}
        style={{
          position: 'absolute',
          left: TABS.venues.left, width: TABS.venues.width, top: TABS.row.top, height: TABS.row.height,
          background: PANEL, color: CREAM, border: `1px solid ${GOLD}`, borderRadius: 4,
          fontFamily: 'Georgia, serif', fontSize: 'clamp(9px,1.0vw,14px)',
          padding: '0 6px', cursor: 'pointer', pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <option value="global">All Venues</option>
        <option value="venue">{currentEntry.venue || 'My Venue'}</option>
      </select>

      {/* ── Baked 7-row competitor table, fully occluded ─────────────────── */}
      <Occlude
        zone={ZONES.table}
        testid="lb-table"
        style={{
          flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
          border: '1px solid rgba(233,193,118,0.22)', borderRadius: 6,
          padding: 'clamp(6px,1.1vw,16px)', gap: 'clamp(4px,0.7vw,10px)',
          pointerEvents: 'auto',
        }}
      >
        {phase === 'loading' && (
          <div role="status" aria-live="polite" style={{ margin: 'auto', textAlign: 'center', color: 'rgba(229,226,225,0.7)', fontSize: 'clamp(10px,1.1vw,15px)' }}>
            Loading leaderboard…
          </div>
        )}

        {phase === 'error' && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: 'clamp(10px,1.1vw,15px)', color: 'rgba(229,170,100,0.9)' }}>
              Something went wrong loading the leaderboard.
            </p>
            <button type="button" onClick={handleRetry} style={{
              background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD,
              fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40,
            }}>Retry</button>
          </div>
        )}

        {phase === 'ready' && (
          <>
            {isOffline && (
              <div style={{ fontSize: 'clamp(8px,0.85vw,12px)', color: 'rgba(229,226,225,0.6)' }}>
                Offline: showing your locally saved data.
              </div>
            )}
            {!isOffline && isStale && (
              <div style={{ fontSize: 'clamp(8px,0.85vw,12px)', color: 'rgba(229,170,100,0.85)' }}>
                Data may be stale — last refreshed {formatTimestamp(lastRefreshedAt)}.
              </div>
            )}

            {filteredEntries.length === 0 ? (
              <div data-testid="lb-empty" style={{ margin: 'auto', textAlign: 'center', fontSize: 'clamp(10px,1.05vw,15px)', color: 'rgba(229,226,225,0.6)' }}>
                No entries match the current filters{scope === 'venue' ? ' — select a venue to see venue rankings.' : '.'}
              </div>
            ) : (
              <div role="list" aria-label="Leaderboard rankings" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredEntries.map((e, i) => (
                  <div
                    key={e.id} role="listitem" data-testid="lb-row"
                    aria-current={e.isCurrentUser ? 'true' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'clamp(6px,1vw,14px)',
                      padding: 'clamp(5px,0.8vw,12px) clamp(8px,1.2vw,18px)',
                      background: 'rgba(233,193,118,0.12)',
                      border: `1.5px solid ${GOLD}`, borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 'clamp(11px,1.3vw,19px)', fontWeight: 700, color: GOLD, width: '6%' }}>{i + 1}</span>
                    <span aria-hidden="true" style={{
                      width: 'clamp(22px,2.6vw,40px)', height: 'clamp(22px,2.6vw,40px)', borderRadius: '50%',
                      background: 'rgba(233,193,118,0.15)', border: `1.5px solid ${GOLD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(9px,1vw,14px)', fontWeight: 700, color: GOLD, flexShrink: 0,
                    }}>{initials(e.displayName)}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 'clamp(10px,1.15vw,17px)', fontWeight: 700, color: CREAM }}>
                      {e.displayName} <span style={{ fontSize: 'clamp(8px,0.8vw,11px)', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '0 5px' }}>You</span>
                    </span>
                    <span style={{ fontSize: 'clamp(9px,1vw,14px)', color: 'rgba(229,226,225,0.7)', width: '18%' }}>{e.tier}</span>
                    <span style={{ fontSize: 'clamp(10px,1.2vw,18px)', color: GOLD, width: '16%', textAlign: 'right' }}>{e.xp.toLocaleString()} XP</span>
                    <span style={{ fontSize: 'clamp(8px,0.85vw,12px)', color: 'rgba(229,226,225,0.5)', width: '16%', textAlign: 'right' }}>
                      {e.achievements} badges
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Honest boundary — replaces, never refills, the occluded
                fabricated rows. No competitor is invented. */}
            <div data-testid="lb-shared-unavailable" style={{
              marginTop: 'auto', fontSize: 'clamp(8px,0.88vw,13px)',
              color: 'rgba(229,226,225,0.55)', lineHeight: 1.4,
            }}>
              Shared rankings unavailable. {snapshot.communityMessage}
            </div>
          </>
        )}
      </Occlude>

      {/* ── Baked "YOUR RANK" strip values ───────────────────────────────── */}
      <Occlude zone={ZONES.rankNum} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-your-rank" style={{ fontSize: 'clamp(13px,1.8vw,26px)', color: GOLD }}>
          {filteredEntries.length > 0 ? 1 : '—'}
        </span>
      </Occlude>
      <Occlude zone={ZONES.rankAvatar} style={{ borderRadius: '50%', justifyContent: 'center', border: `1.5px solid ${GOLD}` }}>
        <span aria-hidden="true" style={{ fontSize: 'clamp(10px,1.2vw,18px)', fontWeight: 700, color: GOLD }}>
          {initials(currentEntry.displayName)}
        </span>
      </Occlude>
      <Occlude zone={ZONES.points} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-your-points" style={{ fontSize: 'clamp(11px,1.4vw,20px)', color: GOLD }}>
          {currentEntry.xp.toLocaleString()} XP
        </span>
      </Occlude>
      <Occlude zone={ZONES.nextRank} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-next-rank" style={{ fontSize: 'clamp(9px,1.05vw,16px)', color: CREAM }}>
          {nextTier ? nextTier.name : 'Top rank'}
        </span>
      </Occlude>
      <Occlude zone={ZONES.nextLevel} style={{ borderRadius: '50%', justifyContent: 'center' }}>
        <span aria-hidden="true" style={{ fontSize: 'clamp(10px,1.3vw,19px)', color: GOLD }}>
          {nextTier ? RANKS.indexOf(nextTier) + 1 : '—'}
        </span>
      </Occlude>
      <Occlude zone={ZONES.toNext} style={{ justifyContent: 'center' }}>
        <span data-testid="lb-to-next" style={{ fontSize: 'clamp(9px,1.1vw,16px)', color: GOLD }}>
          {nextTier ? `${(nextTier.minXP - currentEntry.xp).toLocaleString()} XP` : '—'}
        </span>
      </Occlude>

      {/* ── Live control over the baked "VIEW FULL LEADERBOARD" button.
             Replaces the removed permanently-disabled nav-bar primary. ──── */}
      <button
        type="button"
        data-testid="lb-refresh"
        onClick={handleRefresh}
        style={{
          position: 'absolute', left: '76.8%', top: '83.2%', width: '17.7%', height: '6.4%',
          background: `linear-gradient(180deg, #F3D48E, ${GOLD})`,
          color: '#241605', border: 'none', borderRadius: 6,
          fontFamily: 'Georgia, serif', fontWeight: 700,
          fontSize: 'clamp(9px,1.05vw,15px)', letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {refreshing ? 'Refreshing…' : 'Refresh Rankings'}
      </button>

      {/* ── Live controls over the approved sidebar's baked items ──────────
          System Audit Prompt 3 (SC-D010): previously only "LOUNGE" had a
          live control — the other 8 baked labels (JOURNEY, CIGARS,
          CHALLENGES, EVENTS, LEADERBOARD, REWARDS, PASSPORT, SETTINGS) were
          DEAD VISUAL CONTROLS. LEADERBOARD itself is the current page (its
          baked highlight is honest, not a false default) so it gets no
          separate control. SETTINGS has no real SmokeCraft settings screen
          to route to (only unrelated POS3/E.A.T. settings exist) — it is
          wired as a real, focusable button with an honest "not yet
          available" accessible name rather than either a silent dead
          hotspot or a route that doesn't actually exist. */}
      {SIDEBAR_ITEMS.map(item => (
        <button
          key={item.key}
          type="button"
          aria-label={item.label}
          data-testid={`lb-sidebar-${item.key}`}
          disabled={item.disabled}
          onClick={item.disabled ? undefined : () => { triggerHaptic('light'); navigate(item.route) }}
          style={{
            position: 'absolute', left: '2.0%', top: item.top, width: '11.6%', height: '4.6%',
            background: 'transparent', border: '1.5px solid transparent', borderRadius: 6,
            cursor: item.disabled ? 'default' : 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.borderColor = GOLD }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
          onFocus={e => { if (!item.disabled) e.currentTarget.style.borderColor = GOLD }}
          onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
        />
      ))}
    </SmokeCraftImageBoundsOverlay>
  )
}
