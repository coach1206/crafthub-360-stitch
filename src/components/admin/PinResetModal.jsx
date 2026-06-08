/**
 * PinResetModal — Phase 9.5
 * Touchscreen-friendly PIN reset modal.
 * Never stores PIN in localStorage. Never displays PIN after submit.
 */

import { useState } from 'react'
import { resetUserPin } from '../../services/adminApiService.js'

const GOLD   = '#C9A84C'
const DARK   = '#0a0603'
const CARD   = 'rgba(18,12,5,0.99)'
const BORDER = 'rgba(201,168,76,0.18)'
const DIM    = 'rgba(201,168,76,0.45)'
const ERR    = '#E05A5A'

const ROLE_COLOR = {
  staff:           '#4ECDC4',
  manager:         '#45B7D1',
  admin:           '#96CEB4',
  founder_level_0: GOLD,
}

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']

export default function PinResetModal({ user, onClose, onSuccess }) {
  const [newPin,     setNewPin]     = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step,       setStep]       = useState('enter')   // 'enter' | 'confirm' | 'done'
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const roleColor = ROLE_COLOR[user?.role] || '#888'
  const active    = step === 'enter' ? newPin : confirmPin

  function handlePad(key) {
    if (key === '⌫') {
      if (step === 'enter')   setNewPin(p     => p.slice(0, -1))
      else                    setConfirmPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (key === '✓') {
      handleNext()
      return
    }
    if (active.length >= 8) return
    if (step === 'enter')  setNewPin(p     => p + key)
    else                   setConfirmPin(p => p + key)
    setError('')
  }

  function handleNext() {
    if (step === 'enter') {
      if (newPin.length < 4) { setError('PIN must be 4–8 digits.'); return }
      setStep('confirm')
      return
    }
    // step === 'confirm'
    if (newPin !== confirmPin) {
      setError('PINs do not match. Try again.')
      setConfirmPin('')
      setStep('enter')
      setNewPin('')
      return
    }
    handleSubmit()
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await resetUserPin(user.user_id, newPin, confirmPin)
      if (res?.success) {
        setStep('done')
        if (onSuccess) onSuccess(user)
      } else {
        setError(res?.message || 'PIN reset failed.')
        setStep('enter')
        setNewPin('')
        setConfirmPin('')
      }
    } catch {
      setError('Network error — please try again.')
      setStep('enter')
      setNewPin('')
      setConfirmPin('')
    } finally {
      setLoading(false)
    }
  }

  const displayDots = (count, filled) =>
    Array.from({ length: 8 }, (_, i) => (
      <span key={i} style={{
        width:        i < count ? '12px' : '8px',
        height:       i < count ? '12px' : '8px',
        borderRadius: '50%',
        background:   i < filled ? GOLD : 'rgba(201,168,76,0.2)',
        transition:   'background 0.15s',
      }} />
    ))

  return (
    <div style={{
      position:   'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display:    'flex', alignItems: 'center', justifyContent: 'center',
      zIndex:     10000,
      padding:    '1rem',
    }}>
      <div style={{
        background:   CARD,
        border:       `1px solid ${BORDER}`,
        borderRadius: '12px',
        padding:      'clamp(1.5rem, 4vw, 2rem)',
        width:        '100%',
        maxWidth:     '340px',
        fontFamily:   'Georgia, serif',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: DIM, fontSize: '9px', letterSpacing: '0.25em', marginBottom: '0.4rem' }}>
            NOVEE OS · PIN RESET
          </div>
          <div style={{ color: GOLD, fontSize: '14px', letterSpacing: '0.1em' }}>
            {user?.display_name || user?.user_id}
          </div>
          <div style={{ color: roleColor, fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px', textTransform: 'uppercase' }}>
            {user?.role?.replace('_', ' ')}
          </div>
        </div>

        {step === 'done' ? (
          /* ── Success ─────────────────────────────────────── */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#4CAF50', display: 'block', marginBottom: '0.75rem' }}>
              check_circle
            </span>
            <div style={{ color: '#4CAF50', fontSize: '13px', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              PIN reset successfully.
            </div>
            <div style={{ color: '#444', fontSize: '11px', marginBottom: '1.5rem' }}>
              The new PIN is active immediately.
            </div>
            <button
              onClick={onClose}
              style={{
                background:    'rgba(201,168,76,0.12)',
                border:        `1px solid ${GOLD}44`,
                borderRadius:  '6px',
                color:         GOLD,
                padding:       '10px 24px',
                cursor:        'pointer',
                letterSpacing: '0.1em',
                fontSize:      '12px',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Step label */}
            <div style={{ color: '#555', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '1rem', textAlign: 'center' }}>
              {step === 'enter' ? 'ENTER NEW PIN (4–8 DIGITS)' : 'CONFIRM NEW PIN'}
            </div>

            {/* PIN dots */}
            <div style={{
              display:        'flex', gap: '6px',
              justifyContent: 'center',
              marginBottom:   '1.25rem',
            }}>
              {displayDots(8, active.length)}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                color:         ERR,
                fontSize:      '11px',
                textAlign:     'center',
                marginBottom:  '0.75rem',
                letterSpacing: '0.04em',
              }}>
                {error}
              </div>
            )}

            {/* Keypad */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '8px',
              marginBottom:        '1rem',
            }}>
              {PAD_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => handlePad(k)}
                  disabled={loading}
                  style={{
                    background:    k === '✓' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    border:        `1px solid ${k === '✓' ? GOLD + '44' : 'rgba(201,168,76,0.12)'}`,
                    borderRadius:  '8px',
                    color:         k === '✓' ? GOLD : k === '⌫' ? '#888' : DIM,
                    fontSize:      k === '⌫' || k === '✓' ? '16px' : '20px',
                    padding:       '14px 0',
                    cursor:        'pointer',
                    fontFamily:    'Georgia, serif',
                    transition:    'background 0.15s',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                display:       'block',
                width:         '100%',
                background:    'transparent',
                border:        '1px solid rgba(100,100,100,0.2)',
                borderRadius:  '6px',
                color:         '#444',
                padding:       '10px',
                cursor:        'pointer',
                fontSize:      '11px',
                letterSpacing: '0.08em',
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
