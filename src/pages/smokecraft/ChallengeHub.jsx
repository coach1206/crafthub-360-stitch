import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import * as api from '../../services/smokecraft/challengeHubApiClient.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// Holistic Fix 5C-1A — this comment previously (incorrectly) claimed
// Blend Fault Identification had no server-side scoring or persistence.
// It does: migration 089's smokecraft_blend_fault_attempts/answers
// tables back a fully server-authoritative, transactional scoring
// engine (blendFaultService.js — real answer key, real idempotent
// attempt tracking, real pass/fail). It simply tracks its own attempt
// state separately from smokecraft_challenge_learner_state (the
// Daily/Weekly instance-based state machine below), since it is a
// repeatable practice assessment rather than a dated period challenge.
// Both now emit the same canonical challenge_started/_submitted/
// _scored/_completed event vocabulary (challengeEventService.js).
const STATIC_PRACTICE_CHALLENGE = { id: 'blend-fault-identification', label: 'Blend Fault Identification', category: 'Practice', route: '/smokecraft/challenges/blend-fault-identification' }

function formatRemaining(msRemaining) {
  if (msRemaining <= 0) return 'Expired'
  const totalMinutes = Math.floor(msRemaining / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

const STATE_LABEL = { available: 'Available', in_progress: 'In Progress', completed: 'Completed', expired: 'Expired' }
const STATE_COLOR = { available: 'rgba(229,226,225,0.6)', in_progress: GOLD, completed: '#7fd0a3', expired: 'rgba(229,170,100,0.75)' }

export default function ChallengeHub() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error | offline
  const [challenges, setChallenges] = useState([])
  const [activeKey, setActiveKey] = useState(null)
  const [activeDetail, setActiveDetail] = useState(null)
  const [starting, setStarting] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Ticks the display only — the deadline itself always comes from the
  // server's effectiveEnd timestamp, never invented client-side.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  async function load() {
    setStatus('loading')
    const res = await api.getHub()
    if (!res.ok) { setStatus(res.error === 'offline' ? 'offline' : 'error'); return }
    setChallenges(res.challenges); setStatus('ready')
  }

  useEffect(() => { load() }, [])

  async function openChallenge(challengeKey) {
    triggerHaptic('light')
    setActiveKey(challengeKey)
    setActiveDetail(null)
    const res = await api.getChallenge(challengeKey)
    if (res.ok) setActiveDetail(res.challenge)
  }

  async function handleStart(challengeKey) {
    triggerHaptic('medium')
    setStarting(true)
    const res = await api.startChallenge(challengeKey)
    setStarting(false)
    if (res.ok) {
      setActiveDetail(res.challenge)
      setChallenges(prev => prev.map(c => c.challengeKey === challengeKey ? res.challenge : c))
    }
  }

  // Holistic Fix 2A — adopts SmokeCraftScreenShell's live mode as the outer
  // contract. status stays "ready" here (not wired to this screen's own
  // `status` state) for the same reason as VenueSelect: this screen already
  // implements its own real, server-driven loading/error/offline copy and
  // Retry behavior inline (verified via real browser test in Prompt 3E-3) —
  // delegating to the shell's generic panel would silently change that
  // proven behavior rather than just relocate where it renders from.
  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        {/* Not NAV.REWARDS (that's /smokecraft/rewards-center, a different
            screen) — this Back control genuinely targets the S25 curriculum
            Rewards screen it was opened from, confirmed via source read. */}
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/rewards') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Rewards
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.challengeHubBackground} alt="Daily and Weekly Challenge Hub" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>Daily &amp; Weekly Challenge Hub</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 6px' }}>
          Real Daily and Weekly challenges tracked from your actual activity — progress and completion
          are evaluated on the server, never invented on this screen.
        </p>

        {isOffline && <div role="status" style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>Offline — showing your last loaded state.</div>}

        {status === 'loading' && (
          <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center', marginBottom: 20 }}>
            <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin-ch 0.9s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading your challenges…</p>
            <style>{'@keyframes sc-spin-ch { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {(status === 'error' || status === 'offline') && (
          <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center', marginBottom: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
              {status === 'offline' ? "You're offline — can't load challenges right now." : 'Something went wrong loading challenges.'}
            </p>
            <button type="button" onClick={load} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
              {challenges.map(c => {
                const end = new Date(c.instance.effectiveEnd).getTime()
                const remaining = end - nowTick
                return (
                  <button key={c.challengeKey} type="button"
                    onClick={() => openChallenge(c.challengeKey)}
                    aria-pressed={activeKey === c.challengeKey}
                    aria-label={`${c.title} — ${STATE_LABEL[c.participationState] || c.participationState} (${c.cadence} challenge)`}
                    style={{
                      textAlign: 'left', minHeight: 100, padding: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: CREAM,
                      background: activeKey === c.challengeKey ? 'rgba(233,193,118,0.14)' : GLASS,
                      border: `1.5px solid ${activeKey === c.challengeKey ? GOLD : BORDER}`,
                    }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)', marginBottom: 4 }}>{c.cadence === 'daily' ? 'Daily' : 'Weekly'} · {c.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: STATE_COLOR[c.participationState] || CREAM, marginBottom: 4 }}>
                      {STATE_LABEL[c.participationState] || c.participationState}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', marginBottom: 4 }}>{c.progress} / {c.targetValue}</div>
                    {c.timeStatus === 'active' && <div style={{ fontSize: 10.5, color: 'rgba(229,226,225,0.5)' }}>{formatRemaining(remaining)}</div>}
                    {c.timeStatus === 'expired' && <div style={{ fontSize: 10.5, color: 'rgba(229,170,100,0.75)' }}>Period ended</div>}
                  </button>
                )
              })}

              <button type="button"
                onClick={() => { triggerHaptic('light'); navigate(STATIC_PRACTICE_CHALLENGE.route) }}
                aria-label={`Start ${STATIC_PRACTICE_CHALLENGE.label} (practice activity)`}
                style={{ textAlign: 'left', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, cursor: 'pointer', color: CREAM, fontFamily: 'inherit', minHeight: 100 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>{STATIC_PRACTICE_CHALLENGE.category}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{STATIC_PRACTICE_CHALLENGE.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Available — tap to begin</div>
              </button>
            </div>

            {activeKey && activeDetail && (
              <div role="region" aria-live="polite" style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 4 }}>{activeDetail.title}</div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: STATE_COLOR[activeDetail.participationState] || CREAM, marginBottom: 10 }}>
                  {STATE_LABEL[activeDetail.participationState] || activeDetail.participationState}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{activeDetail.description}</p>
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', margin: '0 0 10px' }}>Progress: {activeDetail.progress} / {activeDetail.targetValue}</p>
                {activeDetail.goldenBoxRelevance && (
                  <p style={{ fontSize: 12, color: 'rgba(233,193,118,0.75)', margin: '0 0 10px' }}>Golden Box relevance: {activeDetail.goldenBoxRelevance}</p>
                )}
                {activeDetail.missingRequirements?.length > 0 && (
                  <p style={{ fontSize: 11, color: 'rgba(229,170,100,0.85)', margin: '0 0 10px' }}>{activeDetail.missingRequirements[0]}</p>
                )}
                {activeDetail.timeStatus === 'active' && (
                  <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', margin: '0 0 10px' }}>
                    {formatRemaining(new Date(activeDetail.instance.effectiveEnd).getTime() - nowTick)}
                  </p>
                )}
                {activeDetail.timeStatus === 'active' && activeDetail.participationState === 'available' && (
                  <button type="button" disabled={starting} onClick={() => handleStart(activeDetail.challengeKey)}
                    style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: starting ? 'default' : 'pointer', minHeight: 40, opacity: starting ? 0.6 : 1 }}>
                    {starting ? 'Starting…' : 'Start Challenge'}
                  </button>
                )}
                {activeDetail.xpReward === 0 && (
                  <p style={{ fontSize: 10.5, color: 'rgba(229,226,225,0.4)', margin: '10px 0 0' }}>
                    No XP reward is configured for this challenge yet — completion is tracked honestly regardless.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Holistic Fix 5B-2A-1: real, server-computed, context-aware
            guidance (via the shared mentor-guidance service) replaces
            the previous hardcoded string. */}
        <DynamicMentorPanel context="challenge-hub" />
        <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', marginTop: 16 }}>
          Streaks and leaderboards are not yet backend-connected for this hub — this screen shows real,
          live-tracked Daily and Weekly challenges rather than fabricated rankings.
        </p>
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
