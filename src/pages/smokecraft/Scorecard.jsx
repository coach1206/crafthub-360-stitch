import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { ArrowBackIcon, ArrowForwardIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import AdvancedScorecardPanel from '../../components/smokecraft/AdvancedScorecardPanel.jsx'
import WinnerCriteriaPanel from '../../components/smokecraft/WinnerCriteriaPanel.jsx'
import { calculateWinnerEligibility, assignWinnerCategory, getPendingWinnerCategories, getLockedWinnerCategories, getWinnerProgress } from '../../services/smokecraft/smokeWinnerService.js'
import { StoreIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import { getSmokePOSHandoff, createSmokePurchaseIntent, getSmokePurchaseRewardStatus, getDerivedPurchaseState } from '../../services/smokecraft/smokePOSHandoffService.js'
import { checkSmokeBackendConnectivity, getSmokeSharedStorageMode, buildSmokeStorageStatusFields, saveSmokeSessionSnapshot } from '../../services/smokecraft/smokeSharedStorageService.js'
import SmokeBackendReadinessPanel from '../../components/smokecraft/SmokeBackendReadinessPanel.jsx'

const CATEGORIES = [
  { id:'appearance',   label:'Appearance',   desc:'Wrapper color, sheen, seam quality' },
  { id:'construction', label:'Construction',  desc:'Draw resistance, ash firmness, burn evenness' },
  { id:'flavor',       label:'Flavor',        desc:'Complexity, balance, evolution across thirds' },
  { id:'overall',      label:'Overall',       desc:'Your complete impression of the experience' },
]
const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function Scorecard() {
  const navigate = useNavigate()
  const { completeStep, addXP, session, update } = useGuestSession()
  const [scores, setScores] = useState({})
  const [done, setDone] = useState(false)
  const loggedEligibilityRef = useRef(false)
  const checkedStorageRef = useRef(false)

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
              { type: 'SMOKECRAFT_BACKEND_SCHEMA_FOUNDATION_VIEWED', timestamp: Date.now() },
            ].slice(-50),
          },
        }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshotSavedRef = useRef(false)

  useEffect(() => {
    if (snapshotSavedRef.current) return
    snapshotSavedRef.current = true
    const result = saveSmokeSessionSnapshot(session)
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          eventLog: [...existingLog,
            { type: 'SMOKECRAFT_SESSION_SNAPSHOT_SAVE_ATTEMPTED', timestamp: Date.now(), payload: { result: result?.status } },
            { type: 'SMOKECRAFT_REMOTE_SESSION_SAVE_ATTEMPTED', timestamp: Date.now() },
          ].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  const maxTotal = CATEGORIES.length * 10

  function setScore(id, v) { triggerHaptic('light'); setScores(prev => ({ ...prev, [id]: v })) }

  useEffect(() => {
    if (loggedEligibilityRef.current) return
    loggedEligibilityRef.current = true
    const eligibility = calculateWinnerEligibility(session)
    const earned = assignWinnerCategory(session)
    const pending = getPendingWinnerCategories(session)
    const locked = getLockedWinnerCategories(session)
    const progress = getWinnerProgress(session)
    const now = Date.now()

    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      const events = [{
        type: 'SMOKECRAFT_WINNER_ELIGIBILITY_UPDATED',
        timestamp: now,
        payload: { progress },
      }]
      if (earned) {
        events.push({ type: 'SMOKECRAFT_WINNER_CATEGORY_ASSIGNED', timestamp: now, payload: { categoryId: earned.id, title: earned.title } })
      }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          winnerEligibility: eligibility,
          winnerCategory: earned ? earned.id : null,
          winnerProgress: progress,
          pendingWinnerCategories: pending.map(c => c.id),
          lockedWinnerCategories: locked.map(c => c.id),
          earnedWinnerCategories: eligibility.filter(c => c.earned).map(c => c.id),
          eventLog: [...existingLog, ...events].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        scorecard: { scores, total, maxTotal },
      },
    }))
    completeStep('scorecard')
    addXP(100)
    navigate('/smokecraft/passport-stamp')
  }

  const posHandoff = getSmokePOSHandoff(session)
  const purchaseReward = getSmokePurchaseRewardStatus(session)
  const storageMode = getSmokeSharedStorageMode()
  const syncStatus = session?.smokeCraft?.syncStatus || null

  function handleCreatePurchaseIntent() {
    if (posHandoff.intentId) return
    triggerHaptic('light')
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
          ].slice(-50),
        },
      }
    })
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/scorecard-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/final-third')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 12 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'70.6%' }} /></div>
          <span>Scorecard</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>SmokeCraft Scorecard</h2>

        <AdvancedScorecardPanel session={session} />

        <WinnerCriteriaPanel session={session} />

        <button onClick={() => navigate('/smokecraft/event-challenge')}
          className="w-full flex items-center justify-between gap-3 text-left rounded-2xl border border-primary/30 hover:bg-primary/5 active:scale-[0.99] transition-all duration-300 mb-8"
          style={{ padding:'16px 20px', background:'rgba(233,193,118,0.04)' }}>
          <span>
            <span className="block font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">Event Challenge</span>
            <span className="block font-body-sm text-body-sm text-on-surface-variant">View your active challenge status, winner category progress, and event log.</span>
          </span>
          <ArrowForwardIcon size={20} />
        </button>

        <section className="rounded-2xl border border-outline-variant/30 mb-8" style={{ padding: '20px 24px', background: 'rgba(233,193,118,0.04)' }} aria-label="POS3 Purchase Rewards">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
              <StoreIcon size={20} />
            </span>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">POS3 Purchase Rewards</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Purchase Handoff Status</p>
              <p className="font-label-md text-label-md font-semibold text-on-surface">{posHandoff.status.replaceAll('_', ' ')}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/15" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Reward Eligibility</p>
              <p className="font-label-md text-label-md font-semibold" style={{ color: purchaseReward.eligible ? '#e9c176' : 'rgba(255,255,255,0.5)' }}>{purchaseReward.eligible ? 'Eligible' : 'Not Yet Eligible'}</p>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{purchaseReward.reason}</p>

          <div className="rounded-xl border border-outline-variant/15 mb-4" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Backend &amp; Storage Status</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Storage mode: <span className="text-on-surface font-semibold">{storageMode.mode.replaceAll('_', ' ')}</span></p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Shared venue storage: <span className="text-on-surface font-semibold">{storageMode.backendConnected ? 'Active' : 'Not Yet Active'}</span></p>
            {syncStatus?.lastAttemptAt && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Last sync attempt: <span className="text-on-surface">{new Date(syncStatus.lastAttemptAt).toLocaleTimeString()}</span> · {syncStatus.lastAction} · {syncStatus.lastResult}</p>
            )}
            {!storageMode.backendConnected && (
              <p className="font-body-sm text-body-sm" style={{ color: '#e9c176' }}>Local fallback active. Shared venue storage pending.</p>
            )}
          </div>

          <div className="mb-4">
            <SmokeBackendReadinessPanel compact />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleCreatePurchaseIntent} disabled={Boolean(posHandoff.intentId)}
              className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40"
              style={{ height: 56, paddingInline: 24, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314' }}>
              {posHandoff.intentId ? 'Purchase Intent Created' : 'Create Purchase Intent'}
            </button>
            <button onClick={() => navigate('/smokecraft/event-challenge')}
              className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
              style={{ height: 56, paddingInline: 24 }}>
              View Event Challenge
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <button onClick={() => navigate('/pos3')}
              className="flex items-center justify-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-[0.15em] rounded-xl border border-primary/15 hover:bg-primary/5 active:scale-95 transition-all duration-300"
              style={{ height: 48, paddingInline: 20 }}>
              Open POS3 (Staff Access)
            </button>
            <button onClick={() => navigate('/eat')}
              className="flex items-center justify-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-[0.15em] rounded-xl border border-primary/15 hover:bg-primary/5 active:scale-95 transition-all duration-300"
              style={{ height: 48, paddingInline: 20 }}>
              Open E.A.T. Summary (Staff Access)
            </button>
          </div>
        </section>

        <div className="rounded-2xl border border-outline-variant/30 p-6 mb-8" style={{ background:'rgba(233,193,118,0.04)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-lg text-label-lg text-primary uppercase tracking-widest">Total Score</span>
            <span className="font-headline-md text-headline-md text-primary">{total}<span className="text-primary/50 font-normal text-lg"> / {maxTotal}</span></span>
          </div>
          <div className="h-2 rounded-full bg-outline-variant/30">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: maxTotal ? `${(total/maxTotal)*100}%` : '0%' }} />
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-12">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="rounded-2xl border border-outline-variant/20 p-5" style={{ background:'rgba(255,255,255,0.02)' }}>
              <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{cat.label}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">{cat.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(v => {
                  const on = (scores[cat.id] || 0) >= v
                  return (
                    <button key={v} onClick={() => setScore(cat.id, v)}
                      className="sc-tactile w-9 h-9 rounded-lg border font-label-lg text-label-lg transition-all duration-200 active:scale-90"
                      style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.15)', background: on ? 'rgba(233,193,118,0.2)' : 'transparent', color: on ? '#e9c176' : 'rgba(255,255,255,0.4)', fontSize:13 }}>
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Passport Stamp <ArrowForwardIcon size={20} />
          </button>
          <button onClick={() => navigate('/smokecraft/final-third')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <ArrowBackIcon size={20} /> Back
          </button>
        </div>
      </main>
    </div>
  )
}
