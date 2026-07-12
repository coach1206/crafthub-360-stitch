import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.96)'
const BORDER = 'rgba(233,193,118,0.18)'
const GREEN  = '#5adb8e'
const RED    = '#e05a5a'
const AMBER  = '#f0a830'
const BLUE   = '#5ab8db'

const LS_KEY = 'sc_connections_v1'

// ── Action catalog ────────────────────────────────────────────────────────────
const ACTIONS = [
  {
    id: 'share-passport',
    label: 'Share Passport Stamp',
    icon: '🎫',
    desc: 'Share your certified SmokeCraft stamp with others.',
    requiresConsent: false,
    requiresStamp: true,
    group: 'share',
  },
  {
    id: 'exchange-contact',
    label: 'Exchange Contact Card',
    icon: '👤',
    desc: 'Share and receive a guest contact card. Requires your explicit consent.',
    requiresConsent: true,
    requiresStamp: false,
    group: 'share',
  },
  {
    id: 'follow-venue',
    label: 'Follow This Venue',
    icon: '🏛',
    desc: 'Stay updated on events, specials, and news from this venue.',
    requiresConsent: false,
    requiresStamp: false,
    group: 'venue',
  },
  {
    id: 'save-mentor',
    label: 'Save Mentor Recommendation',
    icon: '🎓',
    desc: "Save your selected mentor's profile and recommendations.",
    requiresConsent: false,
    requiresStamp: false,
    requiresMentor: true,
    group: 'mentor',
  },
  {
    id: 'join-cigar-circle',
    label: 'Join the Cigar Circle',
    icon: '⭕',
    desc: 'Join the private community for SmokeCraft completions.',
    requiresConsent: false,
    requiresStamp: false,
    group: 'community',
  },
  {
    id: 'join-leaderboard',
    label: 'Join Grand Lounge Ranking',
    icon: '🏆',
    desc: "Add your score to the venue's Grand Lounge leaderboard.",
    requiresConsent: false,
    requiresStamp: false,
    group: 'community',
  },
  {
    id: 'qr-connect',
    label: 'Scan Guest QR Code',
    icon: '📷',
    desc: "Scan another guest's QR code to connect directly.",
    requiresConsent: false,
    requiresStamp: false,
    isQR: true,
    group: 'connect',
  },
]

// ── Persistence ───────────────────────────────────────────────────────────────
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : { selected: [], completed: [], consent: false, qrState: 'idle' }
  } catch { return { selected: [], completed: [], consent: false, qrState: 'idle' } }
}
function saveLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readStampId() {
  try {
    const sc = JSON.parse(localStorage.getItem('sc_passport_stamp_v1') || 'null')
    return sc?.stamp?.stampId || null
  } catch { return null }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SL({ children }) {
  return <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>
}
function HR() { return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0' }} /> }

function StatusPill({ status }) {
  const map = {
    idle:      { label: 'Ready',       color: DIM },
    selected:  { label: 'Selected',    color: GOLD },
    pending:   { label: 'Pending…',    color: AMBER },
    success:   { label: 'Done',        color: GREEN },
    duplicate: { label: 'Already Done', color: GREEN },
    error:     { label: 'Failed',      color: RED },
    denied:    { label: 'Permission Needed', color: AMBER },
    offline:   { label: 'Offline',     color: AMBER },
  }
  const { label, color } = map[status] || map.idle
  return (
    <span style={{
      fontSize: 9, color, fontWeight: 700, letterSpacing: '0.08em',
      background: `${color}14`, border: `1px solid ${color}44`,
      borderRadius: 10, padding: '2px 8px',
    }}>{label}</span>
  )
}

function ConsentGate({ onAccept, onDecline }) {
  return (
    <div style={{
      background: 'rgba(233,193,118,0.07)', border: `1px solid rgba(233,193,118,0.3)`,
      borderRadius: 10, padding: '12px 14px', marginTop: 8,
    }} data-section="consent-gate">
      <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginBottom: 6 }}>Privacy Permission Required</div>
      <div style={{ fontSize: 10, color: DIM, lineHeight: 1.5, marginBottom: 10 }}>
        Exchanging a contact card will share your guest profile information (name, email if provided)
        with another guest. Only do this with people you choose to connect with.
        <br /><br />
        <span style={{ color: AMBER }}>Your details will not be shared until you confirm below.</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onAccept}
          style={{ flex: 1, background: GOLD, color: DARK, border: 'none', borderRadius: 20, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          I Consent — Exchange
        </button>
        <button type="button" onClick={onDecline}
          style={{ flex: 1, background: 'transparent', color: DIM, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '8px', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function QRPanel({ qrState, onStartScan, onCancel }) {
  return (
    <div style={{
      background: 'rgba(90,184,219,0.06)', border: `1px solid rgba(90,184,219,0.25)`,
      borderRadius: 10, padding: '12px 14px', marginTop: 8,
    }} data-section="qr-panel">
      <div style={{ fontSize: 11, color: BLUE, fontWeight: 700, marginBottom: 6 }}>QR Code Scanner</div>
      {qrState === 'idle' && (
        <>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 10, lineHeight: 1.5 }}>
            Point your camera at another guest's QR code to connect directly.
            Camera access is required.
          </div>
          <button type="button" onClick={onStartScan} data-action="start-qr-scan"
            style={{ width: '100%', background: BLUE, color: DARK, border: 'none', borderRadius: 20, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Open Camera
          </button>
        </>
      )}
      {qrState === 'requesting' && (
        <div style={{ fontSize: 10, color: DIM, textAlign: 'center', padding: '8px 0' }}>Requesting camera access…</div>
      )}
      {qrState === 'scanning' && (
        <div style={{ fontSize: 10, color: BLUE, textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
          Camera active — position QR code in frame
          <br />
          <span style={{ fontSize: 9, color: DIM }}>(Demo mode: camera stream not available in preview)</span>
        </div>
      )}
      {qrState === 'denied' && (
        <div style={{ fontSize: 10, color: AMBER, padding: '4px 0', lineHeight: 1.5 }}>
          Camera access was denied. To scan QR codes, allow camera access in your browser settings and try again.
        </div>
      )}
      {qrState === 'unavailable' && (
        <div style={{ fontSize: 10, color: AMBER, padding: '4px 0', lineHeight: 1.5 }}>
          Camera not available on this device or browser. Use a device with a camera to scan QR codes.
        </div>
      )}
      {qrState !== 'idle' && qrState !== 'requesting' && (
        <button type="button" onClick={onCancel}
          style={{ marginTop: 8, width: '100%', background: 'transparent', color: DIM, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '7px', fontSize: 11, cursor: 'pointer' }}>
          Cancel
        </button>
      )}
    </div>
  )
}

function ActionCard({ action, status, onToggle, onExpand, isExpanded, mentorName, stampId }) {
  const isCompleted = status === 'success' || status === 'duplicate'
  const isSelected  = status === 'selected' || status === 'pending'
  const needsMentor = action.requiresMentor && !mentorName
  const needsStamp  = action.requiresStamp && !stampId
  const isBlocked   = needsMentor || needsStamp

  return (
    <div data-action-card={action.id} style={{
      border: `1px solid ${isCompleted ? 'rgba(90,219,142,0.35)' : isSelected ? BORDER : 'rgba(233,193,118,0.1)'}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
      background: isCompleted ? 'rgba(90,219,142,0.05)' : isSelected ? 'rgba(233,193,118,0.06)' : 'rgba(255,255,255,0.02)',
      opacity: isBlocked ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{action.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: isCompleted ? GREEN : GOLD, fontWeight: 700 }}>{action.label}</div>
          <div style={{ fontSize: 9, color: DIM, marginTop: 1 }}>{action.desc}</div>
          {isBlocked && (
            <div style={{ fontSize: 9, color: AMBER, marginTop: 2 }}>
              {needsMentor ? 'No mentor selected in this session' : 'No passport stamp claimed yet'}
            </div>
          )}
          {action.requiresMentor && mentorName && (
            <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>Mentor: <span style={{ color: GOLD }}>{mentorName}</span></div>
          )}
          {action.requiresStamp && stampId && (
            <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>Stamp: <span style={{ color: GOLD }}>{stampId}</span></div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <StatusPill status={status} />
          {!isCompleted && !isBlocked && (
            <button type="button"
              data-action-toggle={action.id}
              onClick={() => onToggle(action.id)}
              style={{
                background: isSelected ? GOLD : 'transparent',
                color: isSelected ? DARK : GOLD,
                border: `1px solid ${GOLD}`,
                borderRadius: 14, padding: '4px 12px', fontSize: 10,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>
              {isSelected ? 'Deselect' : 'Select'}
            </button>
          )}
        </div>
      </div>

      {/* Expand detail for QR / consent when selected */}
      {isSelected && !isCompleted && (
        <div style={{ marginTop: 6 }}>
          {action.isQR && <span data-qr-toggle style={{ cursor: 'pointer', fontSize: 9, color: BLUE }} onClick={() => onExpand(action.id)}>
            {isExpanded ? 'Hide QR panel ▲' : 'Open QR scanner ▼'}
          </span>}
          {action.requiresConsent && <span data-consent-toggle style={{ cursor: 'pointer', fontSize: 9, color: AMBER }} onClick={() => onExpand(action.id)}>
            {isExpanded ? 'Hide consent ▲' : 'Review privacy consent ▼'}
          </span>}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Connections() {
  const { awardSessionRewards, session } = useGuestSession()
  const navigate = useNavigate()

  const smokeCraft     = session?.smokeCraft || {}
  const mentorId       = smokeCraft?.selectedMentor || null
  const mentorName     = smokeCraft?.mentors?.find?.(m => m.id === mentorId)?.name
                      || (mentorId ? String(mentorId) : null)
  const sessionId      = session?.sessionId || 'local-session'
  const stampId        = readStampId()

  const [local, setLocal]           = useState(loadLocal)
  const [actionStatus, setActionStatus] = useState({})  // actionId → status string
  const [expandedAction, setExpandedAction] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')  // idle|syncing|synced|error
  const [done, setDone]             = useState(false)
  const [qrState, setQrState]       = useState('idle')
  const apiRef = useRef({})

  // Load persisted state
  useEffect(() => {
    const saved = loadLocal()
    const statusMap = {}
    for (const id of saved.completed || []) statusMap[id] = 'success'
    for (const id of (saved.selected || [])) { if (!statusMap[id]) statusMap[id] = 'selected' }
    setActionStatus(statusMap)
    setQrState(saved.qrState || 'idle')
  }, [])

  // Sync with server on mount
  useEffect(() => {
    fetch(`/api/smokecraft/connections/status/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.actions?.length) {
          setActionStatus(prev => {
            const next = { ...prev }
            for (const a of data.actions) next[a] = 'success'
            return next
          })
        }
      })
      .catch(() => {})
  }, [sessionId])

  function persistLocal(newStatus, newQr) {
    const completed = Object.entries(newStatus).filter(([, s]) => s === 'success' || s === 'duplicate').map(([id]) => id)
    const selected  = Object.entries(newStatus).filter(([, s]) => s === 'selected').map(([id]) => id)
    const saved = { selected, completed, consent: local.consent, qrState: newQr ?? qrState }
    saveLocal(saved)
    setLocal(saved)
  }

  function toggleSelect(actionId) {
    triggerHaptic('light')
    setActionStatus(prev => {
      const cur = prev[actionId]
      if (cur === 'success' || cur === 'duplicate') return prev
      const next = { ...prev, [actionId]: cur === 'selected' ? 'idle' : 'selected' }
      persistLocal(next, null)
      return next
    })
    setExpandedAction(null)
  }

  function toggleExpand(actionId) {
    setExpandedAction(prev => prev === actionId ? null : actionId)
  }

  const submitAction = useCallback(async (actionId, extraPayload = {}) => {
    if (apiRef.current[actionId]) return
    apiRef.current[actionId] = true
    setActionStatus(prev => ({ ...prev, [actionId]: 'pending' }))

    const action = ACTIONS.find(a => a.id === actionId)
    const payload = {
      ...(action?.requiresStamp ? { stampId } : {}),
      ...(action?.requiresMentor ? { mentorId, mentorName } : {}),
      ...(action?.requiresConsent ? { consentGiven: true } : {}),
      ...extraPayload,
    }

    try {
      const r = await fetch('/api/smokecraft/connections/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: actionId, guestId: session?.guestId || 'guest', payload }),
      })
      const data = await r.json()

      if (r.status === 409 || data.duplicate) {
        setActionStatus(prev => {
          const next = { ...prev, [actionId]: 'duplicate' }
          persistLocal(next, null)
          return next
        })
      } else if (!r.ok) {
        setActionStatus(prev => ({ ...prev, [actionId]: r.status === 403 ? 'denied' : 'error' }))
        apiRef.current[actionId] = false
      } else {
        setSyncStatus('synced')
        setActionStatus(prev => {
          const next = { ...prev, [actionId]: 'success' }
          persistLocal(next, null)
          return next
        })
      }
    } catch {
      const offline = !navigator.onLine
      setActionStatus(prev => ({ ...prev, [actionId]: offline ? 'offline' : 'error' }))
      apiRef.current[actionId] = false
    }
  }, [sessionId, session, stampId, mentorId, mentorName])

  const submitAllSelected = useCallback(async () => {
    const selected = Object.entries(actionStatus).filter(([, s]) => s === 'selected').map(([id]) => id)
    for (const id of selected) {
      const action = ACTIONS.find(a => a.id === id)
      if (action?.requiresConsent && !local.consent) {
        setExpandedAction(id)
        return
      }
    }
    setSyncStatus('syncing')
    for (const id of selected) await submitAction(id)
    setSyncStatus(selected.length > 0 ? 'synced' : 'idle')
  }, [actionStatus, local.consent, submitAction])

  async function handleQRStart() {
    setQrState('requesting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setQrState('unavailable')
        persistLocal(actionStatus, 'unavailable')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      setQrState('scanning')
      persistLocal(actionStatus, 'scanning')
    } catch (e) {
      const state = e.name === 'NotAllowedError' ? 'denied' : 'unavailable'
      setQrState(state)
      persistLocal(actionStatus, state)
    }
  }

  function handleQRCancel() {
    setQrState('idle')
    persistLocal(actionStatus, 'idle')
  }

  function handleConsentAccept(actionId) {
    setLocal(prev => {
      const next = { ...prev, consent: true }
      saveLocal(next)
      return next
    })
    setExpandedAction(null)
    submitAction(actionId, { consentGiven: true })
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('connections')
    navigate('/smokecraft/management-sync')
  }

  const selectedCount  = Object.values(actionStatus).filter(s => s === 'selected').length
  const completedCount = Object.values(actionStatus).filter(s => s === 'success' || s === 'duplicate').length
  const hasSelected    = selectedCount > 0

  const syncLabel = syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'synced' ? '✓ Synced to Passport 360' : syncStatus === 'error' ? 'Sync error' : null

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/cropped/connections-hero.jpg"
        alt="SmokeCraft Connections"
      />

      {/* Gradient mask */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(10,6,3,0.99) 0%, rgba(10,6,3,0.80) 45%, rgba(10,6,3,0.15) 100%)',
      }} />

      {/* Session strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 401,
        padding: '8px 16px',
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.94) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Connections — Session 22
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {syncLabel && <span style={{ fontSize: 9, color: syncStatus === 'synced' ? GREEN : AMBER }}>{syncLabel}</span>}
            <span style={{ fontSize: 9, color: DIM }}>{completedCount} completed</span>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div style={{
        position: 'fixed', bottom: 110, left: 0, right: 0,
        zIndex: 400, padding: '0 16px',
        maxHeight: 'calc(100vh - 190px)', overflowY: 'auto',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '14px 14px',
          maxWidth: 500, margin: '0 auto',
        }}>

          {/* ── Header ──────────────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, fontFamily: 'Georgia, serif', lineHeight: 1.2, marginBottom: 3 }}>
              SmokeCraft Connections
            </div>
            <div style={{ fontSize: 10, color: DIM }}>
              Select the connections you'd like to make. Select multiple — confirm when ready.
            </div>
          </div>

          {/* ── Passport Sync Status ─────────────────── */}
          <div data-section="passport-sync" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8, marginBottom: 10,
            background: stampId ? 'rgba(90,219,142,0.06)' : 'rgba(233,193,118,0.05)',
            border: `1px solid ${stampId ? 'rgba(90,219,142,0.2)' : BORDER}`,
          }}>
            <span style={{ fontSize: 14 }}>{stampId ? '✓' : '○'}</span>
            <div style={{ flex: 1, fontSize: 9, color: DIM }}>
              Passport Stamp:{' '}
              {stampId
                ? <span style={{ color: GREEN }}>Claimed — {stampId}</span>
                : <span style={{ color: AMBER, fontStyle: 'italic' }}>Not yet claimed — some actions require a stamp</span>
              }
            </div>
          </div>

          {/* ── Action Cards ─────────────────────────── */}
          <SL>Choose Connections</SL>
          {ACTIONS.map(action => (
            <div key={action.id}>
              <ActionCard
                action={action}
                status={actionStatus[action.id] || 'idle'}
                onToggle={toggleSelect}
                onExpand={toggleExpand}
                isExpanded={expandedAction === action.id}
                mentorName={action.requiresMentor ? mentorName : null}
                stampId={action.requiresStamp ? stampId : null}
              />

              {/* Inline consent gate */}
              {expandedAction === action.id && action.requiresConsent && !local.consent && (
                <ConsentGate
                  onAccept={() => handleConsentAccept(action.id)}
                  onDecline={() => setExpandedAction(null)}
                />
              )}

              {/* Inline QR panel */}
              {expandedAction === action.id && action.isQR && (
                <QRPanel
                  qrState={qrState}
                  onStartScan={handleQRStart}
                  onCancel={handleQRCancel}
                />
              )}
            </div>
          ))}

          {/* ── Confirm Selected ─────────────────────── */}
          {hasSelected && (
            <>
              <HR />
              <button type="button" data-action="confirm-connections"
                onClick={submitAllSelected}
                disabled={syncStatus === 'syncing'}
                style={{
                  width: '100%', background: syncStatus === 'syncing' ? 'rgba(233,193,118,0.3)' : GOLD,
                  color: DARK, border: 'none', borderRadius: 28,
                  padding: '12px', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: syncStatus === 'syncing' ? 'default' : 'pointer',
                }}>
                {syncStatus === 'syncing' ? 'Saving…' : `Confirm ${selectedCount} Connection${selectedCount > 1 ? 's' : ''}`}
              </button>
              <div style={{ fontSize: 9, color: DIM, textAlign: 'center', marginTop: 4 }}>
                Saves to your Passport 360 record
              </div>
            </>
          )}

          {/* ── Completed Summary ────────────────────── */}
          {completedCount > 0 && (
            <>
              <HR />
              <div data-section="completed-summary">
                <SL>Completed Connections ({completedCount})</SL>
                {ACTIONS.filter(a => actionStatus[a.id] === 'success' || actionStatus[a.id] === 'duplicate').map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: GREEN }}>✓</span>
                    <span style={{ fontSize: 10, color: DIM }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Privacy Note ─────────────────────────── */}
          <HR />
          <div data-section="privacy-note" style={{ fontSize: 9, color: DIM, lineHeight: 1.5 }}>
            <span style={{ color: GOLD, fontWeight: 700 }}>Privacy: </span>
            Your personal information is never shared without your explicit consent.
            Contact card exchange requires separate approval. You can skip any or all connections.
          </div>

          {/* ── Passport 360 Sync ────────────────────── */}
          <HR />
          <div data-section="passport360-sync">
            <SL>Passport 360 Sync</SL>
            <div style={{ fontSize: 10, color: syncStatus === 'synced' ? GREEN : DIM }}>
              {syncStatus === 'synced'
                ? 'All connections recorded in Passport 360'
                : syncStatus === 'syncing'
                  ? 'Syncing connections…'
                  : syncStatus === 'error'
                    ? 'Sync error — data retained locally'
                    : 'Connections will sync to Passport 360 when confirmed'
              }
            </div>
          </div>

        </div>
      </div>

      <SmokeCraftMenuButton label="View Menu" />

      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/passport-stamp')}
        primary="Continue to Management Sync →"
        onPrimary={handleContinue}
      />
    </>
  )
}
