import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { CrownIcon, ArrowBackIcon, EventIcon, InsightsIcon, StoreIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import { getCurrentPlayerSnapshot } from '../../services/smokecraft/smokeLeaderboardService.js'
import { getTopEligibleCategory } from '../../services/smokecraft/smokeWinnerService.js'
import { getSmokePOSHandoff, createSmokePurchaseIntent, getSmokePurchaseRewardStatus, getSmokeEATHandoffSummary, getDerivedPurchaseState } from '../../services/smokecraft/smokePOSHandoffService.js'
import { checkSmokeBackendConnectivity, getSmokeSharedStorageMode, buildSmokeStorageStatusFields } from '../../services/smokecraft/smokeSharedStorageService.js'

export default function EventChallenge() {
  const navigate = useNavigate()
  const { session, update } = useGuestSession()
  const loggedRef = useRef(false)
  const checkedStorageRef = useRef(false)

  useEffect(() => {
    if (loggedRef.current) return
    loggedRef.current = true
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          eventLog: [...existingLog, { type: 'SMOKECRAFT_EVENT_CHALLENGE_VIEWED', timestamp: Date.now() }].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (checkedStorageRef.current) return
    checkedStorageRef.current = true
    checkSmokeBackendConnectivity().then(() => {
      update(prev => {
        const existingLog = prev.smokeCraft?.eventLog || []
        const fields = buildSmokeStorageStatusFields('backend_connectivity_check', { status: getSmokeSharedStorageMode().mode })
        return {
          ...prev,
          smokeCraft: {
            ...prev.smokeCraft,
            ...fields,
            eventLog: [...existingLog,
              { type: 'SMOKECRAFT_SHARED_STORAGE_STATUS_CHECKED', timestamp: Date.now() },
              { type: 'SMOKECRAFT_BACKEND_API_CONFIG_CHECKED', timestamp: Date.now() },
            ].slice(-50),
          },
        }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshot = getCurrentPlayerSnapshot(session)
  const topCategory = getTopEligibleCategory(session)
  const goldenBoxAccepted = Boolean(session?.smokeCraft?.goldenBox?.accepted)
  const eventLog = (session?.smokeCraft?.eventLog || []).slice(-5).reverse()
  const identity = session?.profile?.nickname || session?.guestName || null

  const posHandoff = getSmokePOSHandoff(session)
  const purchaseReward = getSmokePurchaseRewardStatus(session)
  const eatSummary = getSmokeEATHandoffSummary(session)
  const storageMode = getSmokeSharedStorageMode()
  const syncStatus = session?.smokeCraft?.syncStatus || null

  function handleCreatePurchaseIntent() {
    if (posHandoff.intentId) return
    const handoff = createSmokePurchaseIntent(session, {})
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      const derived = getDerivedPurchaseState({ ...prev, smokeCraft: { ...prev.smokeCraft, posHandoff: handoff } })
      const storageFields = buildSmokeStorageStatusFields('create_purchase_intent', handoff.syncResult)
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          posHandoff: handoff,
          purchaseRewards: derived.purchaseRewards,
          eatHandoff: derived.eatHandoff,
          ...storageFields,
          eventLog: [...existingLog,
            { type: 'SMOKECRAFT_POS_PURCHASE_INTENT_CREATED', timestamp: Date.now(), payload: { intentId: handoff.intentId } },
            { type: 'SMOKECRAFT_PURCHASE_INTENT_SHARED_SAVE_ATTEMPTED', timestamp: Date.now(), payload: { intentId: handoff.intentId, result: handoff.syncResult?.status } },
            { type: 'SMOKECRAFT_REMOTE_PURCHASE_INTENT_SAVE_ATTEMPTED', timestamp: Date.now(), payload: { intentId: handoff.intentId } },
          ].slice(-50),
        },
      }
    })
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/assets/smokecraft/cropped/golden-box-hero.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/scorecard')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>

      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>Event Challenge</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">{identity ? `Active session for ${identity}.` : 'Active guest session — no profile name recorded yet.'}</p>

        <section
          className="rounded-2xl border mb-6"
          style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.35)' }}
          aria-label="Active Challenge Status"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
                <EventIcon size={20} />
              </span>
              <div>
                <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Active Challenge</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{snapshot.challengeStatus}</p>
              </div>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest rounded-full" style={{ padding: '6px 12px', color: goldenBoxAccepted ? '#e9c176' : '#6b6b6b', border: `1px solid ${goldenBoxAccepted ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
              {goldenBoxAccepted ? 'Golden Box Accepted' : 'Golden Box Not Yet Accepted'}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Protocol Progress</p>
              <p className="font-headline-md font-bold" style={{ fontSize: 22, color: '#e9c176' }}>{snapshot.completedSteps}<span className="text-primary/50 font-normal text-base"> / 17</span></p>
            </div>
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">XP / Rank</p>
              <p className="font-headline-md font-bold" style={{ fontSize: 22, color: snapshot.rankColor }}>{snapshot.xp} <span className="text-base font-normal">· {snapshot.rank}</span></p>
            </div>
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Final Score</p>
              <p className="font-headline-md font-bold" style={{ fontSize: 22, color: '#e9c176' }}>{snapshot.finalScore}</p>
            </div>
          </div>
        </section>

        <section
          className="rounded-2xl border mb-6"
          style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.35)' }}
          aria-label="Winner Category Progress"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
              <CrownIcon size={20} />
            </span>
            <div>
              <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Winner Category Progress</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {snapshot.winnerProgress.earnedCount} earned · {snapshot.winnerProgress.eligibleCount} eligible · {snapshot.winnerProgress.pendingCount} pending · {snapshot.winnerProgress.lockedCount} locked
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.025)' }}>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/60 mb-1">Top Standing</p>
            {topCategory ? (
              <p className="font-label-md text-label-md font-semibold" style={{ color: '#e9c176' }}>{topCategory.title} — {topCategory.statusLabel}</p>
            ) : (
              <p className="font-label-md text-label-md font-semibold text-on-surface-variant">Not Yet Earned — Pending Real Scoring Data</p>
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border mb-6"
          style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.35)' }}
          aria-label="Purchase Reward Handoff"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
              <StoreIcon size={20} />
            </span>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Purchase Reward Handoff</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Purchase Status</p>
              <p className="font-label-md text-label-md font-semibold text-on-surface">{posHandoff.status.replaceAll('_', ' ')}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Reward Earnable</p>
              <p className="font-label-md text-label-md font-semibold" style={{ color: purchaseReward.eligible ? '#e9c176' : 'rgba(255,255,255,0.5)' }}>{purchaseReward.eligible ? 'Yes' : 'Not Yet'}</p>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">{purchaseReward.reason}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
            {eatSummary.visibleToManagement ? 'E.A.T. can see this handoff.' : 'E.A.T. cannot see this handoff yet — no intent has been created.'}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{eatSummary.backendRequiredReason}</p>

          <div className="rounded-xl border border-outline-variant/15 mb-4" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Backend &amp; Storage Status</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Storage mode: <span className="text-on-surface font-semibold">{storageMode.mode.replaceAll('_', ' ')}</span></p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Shared leaderboard readiness: <span className="text-on-surface font-semibold">{storageMode.backendConnected ? 'Ready' : 'Not Yet Ready'}</span></p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">POS3 verification source: <span className="text-on-surface">Local session/device only</span></p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">E.A.T. visibility source: <span className="text-on-surface">Local session/device only</span></p>
            {syncStatus?.lastAttemptAt && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Last sync attempt: <span className="text-on-surface">{new Date(syncStatus.lastAttemptAt).toLocaleTimeString()}</span> · {syncStatus.lastAction} · {syncStatus.lastResult}</p>
            )}
            {!storageMode.backendConnected && (
              <p className="font-body-sm text-body-sm" style={{ color: '#e9c176' }}>Local fallback only. Other devices will not see this until backend storage is connected.</p>
            )}
          </div>

          <button onClick={handleCreatePurchaseIntent} disabled={Boolean(posHandoff.intentId)}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full"
            style={{ height: 56, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314' }}>
            {posHandoff.intentId ? 'Purchase Intent Created' : 'Create Purchase Intent'}
          </button>
        </section>

        <section
          className="rounded-2xl border mb-10"
          style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.2)' }}
          aria-label="Event Log Preview"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.1)', color: '#e9c176' }}>
              <InsightsIcon size={20} />
            </span>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Event Log Preview</p>
          </div>
          {eventLog.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No events logged yet this session.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {eventLog.map((e, i) => (
                <div key={i} className="rounded-xl border border-outline-variant/10 flex justify-between items-center" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{e.type || e.eventType}</span>
                  <span className="font-label-sm text-label-sm text-primary/60">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/smokecraft/scorecard')}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height: 60, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue SmokeCraft Session
          </button>
          <button onClick={() => navigate('/smokecraft/scorecard')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height: 56 }}>
            View Scorecard
          </button>
          <button onClick={() => navigate('/smokecraft/leaderboard')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height: 56 }}>
            View Leaderboard
          </button>
          <button onClick={() => navigate('/smokecraft')}
            className="flex items-center justify-center gap-3 text-primary/70 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/15 hover:bg-primary/5 active:scale-95 transition-all duration-300"
            style={{ height: 56 }}>
            Return to SmokeCraft Home
          </button>
        </div>
      </main>
    </div>
  )
}
