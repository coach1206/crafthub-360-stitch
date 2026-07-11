import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const STEPS = [
  { id: 'cut',   label: 'Cut the Foot',        desc: 'Make a clean guillotine cut at the cap for optimal draw.' },
  { id: 'toast', label: 'Toast the Foot',       desc: 'Hold flame 1–2 inches away, rotate evenly for 15–20 seconds.' },
  { id: 'light', label: 'Take the First Draw',  desc: 'Draw slowly while applying flame — do not puff rapidly.' },
]

const ANIM = `@keyframes sc-ctl-check{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0deg)}}`

export default function CutToastLight() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [checked, setChecked] = useState(new Set())
  const [proceeded, setProceeded] = useState(false)
  const [pressedStep, setPressedStep] = useState(null)
  const [ctaPressed, setCtaPressed] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const allDone = checked.size === STEPS.length

  const toggleStep = useCallback((id) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleBeginTasting = useCallback(() => {
    if (!allDone || proceeded) return
    setProceeded(true)
    hapticTap('success')
    completeStep('cut-toast-light')
    addXP(75)
    navigate('/smokecraft/first-third')
  }, [allDone, proceeded, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png"
      alt="Cut, Toast and Light"
    >
      <style>{ANIM}</style>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.86) 15%,rgba(5,3,1,0.96) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.85rem', padding: '0 5% 76px', pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
          Complete each preparation step
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '80%', pointerEvents: 'auto' }}>
          {STEPS.map((step, i) => {
            const isChecked = checked.has(step.id)
            const isPressed = pressedStep === step.id
            return (
              <button
                key={step.id}
                aria-label={step.label}
                aria-pressed={isChecked}
                onPointerDown={() => { hapticTap('light'); setPressedStep(step.id) }}
                onPointerUp={() => { setPressedStep(null); toggleStep(step.id) }}
                onPointerLeave={() => setPressedStep(null)}
                onPointerCancel={() => setPressedStep(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '3.5% 4%', minHeight: 56, borderRadius: '12px', cursor: 'pointer',
                  touchAction: 'manipulation', userSelect: 'none',
                  background: isChecked ? 'linear-gradient(135deg,rgba(233,193,118,.18),rgba(201,168,76,.1))' : 'rgba(0,0,0,0.5)',
                  border: isChecked ? '1.5px solid rgba(233,193,118,0.7)' : '1.5px solid rgba(233,193,118,0.2)',
                  backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                  outline: 'none', WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                  boxShadow: isPressed ? '0 0 0 3px rgba(233,193,118,0.35)' : 'none',
                  transition: isPressed ? 'transform 0.06s ease' : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.18s, border-color 0.18s',
                }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isChecked ? 'rgba(233,193,118,0.9)' : 'rgba(233,193,118,0.15)',
                  border: isChecked ? 'none' : '1px solid rgba(233,193,118,0.35)',
                  transition: 'all 0.18s ease',
                  fontFamily: 'Georgia,serif', fontSize: '11px', fontWeight: 700,
                  color: isChecked ? '#0a0603' : 'rgba(233,193,118,0.6)',
                }}>
                  {isChecked
                    ? <span style={{ animation: 'sc-ctl-check 0.18s ease forwards' }}>✓</span>
                    : i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.2vw,12px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: isChecked ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.6)', fontWeight: 600 }}>
                    {step.label}
                  </div>
                  {isChecked && (
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(7px,0.9vw,9px)', color: 'rgba(233,193,118,0.5)', marginTop: 2, lineHeight: 1.4 }}>
                      {step.desc}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <button
          aria-label={allDone ? 'Begin First Third Tasting' : `Complete all ${STEPS.length} steps to continue`}
          disabled={!allDone || proceeded}
          onPointerDown={() => { if (allDone && !proceeded) { setCtaPressed(true); hapticTap('success') } }}
          onPointerUp={() => { setCtaPressed(false); handleBeginTasting() }}
          onPointerLeave={() => setCtaPressed(false)}
          onPointerCancel={() => setCtaPressed(false)}
          style={{
            width: '80%', padding: '3.5% 0', minHeight: 72,
            background: allDone ? 'linear-gradient(135deg,rgba(233,193,118,.3),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
            border: allDone ? '1.5px solid rgba(233,193,118,0.8)' : '1.5px solid rgba(233,193,118,0.15)',
            borderRadius: '12px', cursor: allDone ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: allDone ? 1 : 0.45, backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
            transform: ctaPressed ? 'scale(0.95)' : 'scale(1)',
            boxShadow: ctaPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
            transition: ctaPressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), all 0.22s ease',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: allDone ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
            {proceeded ? 'Beginning Tasting...' : allDone ? 'Begin First Third Tasting →' : `Complete All ${STEPS.length} Steps to Continue`}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
