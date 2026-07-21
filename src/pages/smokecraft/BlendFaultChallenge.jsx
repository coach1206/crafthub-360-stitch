import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// Blend Fault Identification — a real 3-step challenge, resolved from the
// 3 approved "missing challenge screen" images by reading their on-image
// titles rather than guessing from the filename.
const STEPS = [
  { key: 1, title: 'Identify the Issue', asset: 'blendFaultChallengeStep1',
    issues: ['Wrapper Damage', 'Cap Problem', 'Uneven Roll', 'Loose Wrapper', 'Soft Spots', 'Hard Spots', 'Vein Issues', 'Construction Gaps', 'Other'] },
  { key: 2, title: 'Choose the Best Solution', asset: 'blendFaultChallengeStep2',
    issues: ['Re-moisten and rest the leaf', 'Trim and reshape the cap', 'Adjust bunching and roll pressure', 'Re-apply binder or tighten roll', 'Dry boxing to reduce moisture', 'Release pressure and re-roll', 'Replace leaf section', 'Other'] },
  { key: 3, title: 'Prevent and Improve', asset: 'blendFaultChallengeStep3',
    issues: ['Re-moisten and rest the leaf', 'Trim and repair the cap', 'Adjust bunching and roll pressure', 'Re-apply binder or tighten roll', 'Box press to improve shape', 'Re-align wrapper and roll evenly', 'Hydrate and condition', 'Replace leaf section', 'Other'] },
]

export default function BlendFaultChallenge() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [selections, setSelections] = useState({}) // stepKey -> Set of chosen labels
  const [complete, setComplete] = useState(false)
  const step = STEPS[stepIndex]
  const chosen = selections[step.key] || new Set()

  function toggle(label) {
    triggerHaptic('light')
    setSelections(prev => {
      const next = new Set(prev[step.key] || [])
      next.has(label) ? next.delete(label) : next.add(label)
      return { ...prev, [step.key]: next }
    })
  }

  function handleContinue() {
    triggerHaptic('medium')
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1)
    } else {
      setComplete(true)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/challenge-hub') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Challenge Hub
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS[step.asset]} alt={`Blend Fault Identification — ${step.title}`} style={{ width: '100%', display: 'block' }} />
        </div>

        {!complete ? (
          <>
            <div style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Step {step.key} of {STEPS.length}
            </div>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 14px' }}>{step.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }} role="group" aria-label={step.title}>
              {step.issues.map(label => {
                const active = chosen.has(label)
                return (
                  <button key={label} type="button" aria-pressed={active}
                    onClick={() => toggle(label)}
                    style={{
                      minHeight: 44, padding: '10px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
                      border: `1.5px solid ${active ? GOLD : BORDER}`,
                      background: active ? 'rgba(233,193,118,0.14)' : 'transparent',
                      color: active ? GOLD : CREAM,
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>

            <button type="button" onClick={handleContinue} disabled={chosen.size === 0}
              style={{ minHeight: 48, padding: '12px 24px', borderRadius: 24, border: 'none', cursor: chosen.size === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, background: chosen.size === 0 ? 'rgba(233,193,118,0.25)' : GOLD, color: '#241605' }}>
              {stepIndex < STEPS.length - 1 ? 'Continue →' : 'Submit My Solutions'}
            </button>
          </>
        ) : (
          <div style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 12, padding: 24 }}>
            <h1 style={{ fontSize: 18, color: GOLD, margin: '0 0 10px' }}>Challenge Complete</h1>
            <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.75)', margin: '0 0 6px' }}>
              You identified and addressed issues across all 3 steps.
            </p>
            <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>
              XP and badge awards are not yet backend-connected for this challenge — completion is
              tracked locally for this session only, not persisted or scored server-side yet.
            </p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <DynamicMentorPanel guidance="A trained eye catches construction faults before they reach the humidor." />
        </div>
      </div>
    </div>
  )
}
