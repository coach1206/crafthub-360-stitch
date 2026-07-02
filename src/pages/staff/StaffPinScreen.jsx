/**
 * StaffPinScreen — numeric PIN entry for SmokeCraft staff handoffs.
 *
 * Route: /staff/pin?target=eat|pos360
 *
 * Flow:
 *  1. Guest resume state was saved before navigation here.
 *  2. Staff enters PIN via large numeric keypad.
 *  3. PIN is verified against POST /api/auth/staff-pin-login.
 *     If backend unavailable → local-preview mode with demo PIN.
 *  4. On success: ripple dissolve → navigate to target system.
 *  5. Cancel → ripple dissolve back → restore SmokeCraft route.
 *
 * SECURITY NOTICE: Does not store PINs. Does not claim production security
 * if backend unavailable. Local-preview mode is clearly labeled.
 */
import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RippleDissolveTransition from '../../components/transitions/RippleDissolveTransition.jsx'
import { loadGuestResumeState, loadHandoffMeta } from '../../services/staffHandoffResumeService.js'

// Backend PIN verification
async function verifyPinWithBackend(pin) {
  try {
    const res = await fetch('/api/auth/staff-pin-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (!res.ok) return { ok: false, backendAvailable: true }
    const data = await res.json()
    return { ok: data.success || data.ok || false, role: data.role, backendAvailable: true }
  } catch {
    return { ok: false, backendAvailable: false }
  }
}

const LOCAL_PREVIEW_PIN = '1234'
const TARGET_ROUTES = {
  eat:    '/eat',
  pos360: '/pos3',
  pos3:   '/pos3',
}
const TARGET_LABELS = {
  eat:    'E.A.T. Management',
  pos360: 'POS 360',
  pos3:   'POS 3',
}

export default function StaffPinScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const meta = loadHandoffMeta()
  const target = searchParams.get('target') || meta?.target || 'pos360'
  const resumeState = loadGuestResumeState()
  const returnRoute = resumeState?.currentRoute || meta?.startRoute || '/smokecraft'

  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)
  const [transition, setTransition] = useState(null) // null | 'forward' | 'back'
  const [backendAvailable, setBackendAvailable] = useState(null) // null = unknown

  const targetLabel = TARGET_LABELS[target] || target
  const targetRoute = TARGET_ROUTES[target] || '/pos3'

  function appendDigit(d) {
    if (pin.length >= 8) return
    setError(null)
    setPin(p => p + d)
  }

  function clearPin() { setPin(''); setError(null) }
  function backspace() { setPin(p => p.slice(0, -1)); setError(null) }

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return }
    setChecking(true)
    setError(null)

    const result = await verifyPinWithBackend(pin)
    setBackendAvailable(result.backendAvailable)

    if (!result.backendAvailable) {
      // Local preview mode — accept demo PIN
      if (pin === LOCAL_PREVIEW_PIN) {
        setTransition('forward')
      } else {
        setError(`Invalid PIN. (Local Preview Mode: use PIN ${LOCAL_PREVIEW_PIN} to demo.)`)
      }
    } else if (result.ok) {
      setTransition('forward')
    } else {
      setError('Invalid staff PIN. Access denied.')
    }

    setChecking(false)
  }, [pin])

  function handleCancel() {
    setTransition('back')
  }

  function onTransitionComplete() {
    if (transition === 'forward') {
      navigate(targetRoute)
    } else {
      navigate(returnRoute)
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Ripple transition overlay */}
      {transition && (
        <RippleDissolveTransition
          active
          target={transition === 'forward' ? target : 'smokecraft'}
          onComplete={onTransitionComplete}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLabel}>Staff Access</div>
        <h1 style={styles.title}>Enter PIN to continue</h1>
        <div style={styles.subtitle}>Opening {targetLabel}</div>
      </div>

      {/* PIN dots */}
      <div style={styles.dotsRow}>
        {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
          <div key={i} style={{ ...styles.dot, ...(i < pin.length ? styles.dotFilled : {}) }} />
        ))}
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Local preview notice */}
      {backendAvailable === false && (
        <div style={styles.previewNotice}>
          Local Preview Mode: staff PIN is not connected to backend auth. Use PIN 1234 to demo.
        </div>
      )}

      {/* Keypad */}
      <div style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
          key === '' ? <div key={i} style={styles.keyEmpty} /> :
          key === '⌫' ? (
            <button key={i} onClick={backspace} style={styles.keyBtn}>{key}</button>
          ) : (
            <button key={i} onClick={() => appendDigit(key)} style={styles.keyBtn}>{key}</button>
          )
        ))}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={handleSubmit} disabled={checking || pin.length < 4} style={{ ...styles.submitBtn, ...(pin.length < 4 ? styles.submitBtnDisabled : {}) }}>
          {checking ? 'Verifying…' : `Open ${targetLabel}`}
        </button>
        <button onClick={clearPin} style={styles.clearBtn}>Clear</button>
        <button onClick={handleCancel} style={styles.cancelBtn}>Cancel — Return to Guest</button>
      </div>
    </div>
  )
}

const G = '#E9C176'
const styles = {
  wrap: { minHeight: '100vh', background: '#050302', color: '#f0e6d3', fontFamily: '"Georgia", serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' },
  header: { textAlign: 'center', marginBottom: 24 },
  headerLabel: { fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 400, color: G, margin: '0 0 6px', letterSpacing: '0.04em' },
  subtitle: { fontSize: 13, color: 'rgba(233,193,118,0.5)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em' },
  dotsRow: { display: 'flex', gap: 14, marginBottom: 16 },
  dot: { width: 14, height: 14, borderRadius: '50%', border: `2px solid rgba(233,193,118,0.3)`, background: 'transparent', transition: 'background 0.15s, border-color 0.15s' },
  dotFilled: { background: G, borderColor: G },
  error: { background: '#2a0808', border: '1px solid #8b2020', color: '#e06060', padding: '8px 16px', borderRadius: 8, fontSize: 13, marginBottom: 12, maxWidth: 320, textAlign: 'center' },
  previewNotice: { background: '#1a1a04', border: '1px solid #5a5a10', color: '#c0b040', padding: '8px 14px', borderRadius: 8, fontSize: 11, marginBottom: 12, maxWidth: 320, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' },
  keypad: { display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 10, marginBottom: 20 },
  keyBtn: { height: 72, borderRadius: 12, background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.2)', color: G, fontSize: 24, fontWeight: 300, cursor: 'pointer', transition: 'background 0.15s', fontFamily: '"Georgia", serif', touchAction: 'manipulation' },
  keyEmpty: { height: 72 },
  actions: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 },
  submitBtn: { padding: '14px', background: G, border: 'none', color: '#0a0600', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' },
  submitBtnDisabled: { background: 'rgba(233,193,118,0.15)', color: 'rgba(233,193,118,0.35)', cursor: 'not-allowed' },
  clearBtn: { padding: '10px', background: 'none', border: '1px solid rgba(233,193,118,0.15)', color: 'rgba(233,193,118,0.45)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
  cancelBtn: { padding: '10px', background: 'none', border: '1px solid rgba(233,193,118,0.1)', color: 'rgba(233,193,118,0.35)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
}
