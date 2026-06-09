import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { craftImages } from '../../lib/craftImages.js'
import { getLeaderboard, processRankingScan } from '../../api/rankingApi.js'
import { RANKING_DATA, RECENT_RANKING_ACTIVITY, BADGES_DATA } from '../../data/rankingData.js'
import {
  sessionCheckInPayload, eventEntryPayload,
  connectionVerifiedPayload, craftStampPayload, vipStampPayload,
} from '../../utils/rankingQrPayloads.js'

/* ─── palette ─── */
const G = '#C9A84C', GL = '#E8D5A3', GD = '#8A7030'
const BG = '#0C0A07', SURF = '#181410', CARD = 'rgba(255,255,255,0.045)'
const TEXT = '#F5E8C8', TEXTM = '#C8B89A', TEXTD = '#7A6B55'
const BORDER = 'rgba(201,168,76,0.18)', BORDERHI = 'rgba(201,168,76,0.45)'
const MEDAL = { 1: '#C9A84C', 2: '#B8B8B8', 3: '#A0714C' }
const TIER_COLOR = { Aficionado: G, Connoisseur: '#D4820A', Sommelier: '#B8860B', Patron: '#8B0000' }

/* ─── haptics ─── */
const haptic = {
  tap:     () => navigator.vibrate?.(25),
  success: () => navigator.vibrate?.([20, 40, 20]),
  warning: () => navigator.vibrate?.([60, 30, 60]),
  scroll:  () => navigator.vibrate?.(8),
}

/* ─── web audio sound ─── */
let _audioCtx = null
function getCtx() { if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return _audioCtx }
function beep(freq = 440, type = 'sine', dur = 0.12, vol = 0.18) {
  try {
    const ctx = getCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}
const sound = {
  tap:     (m) => !m && beep(660, 'sine',     0.08, 0.12),
  scan:    (m) => !m && beep(880, 'triangle', 0.18, 0.20),
  xpGain:  (m) => !m && [beep(660, 'sine', 0.1, 0.15), setTimeout(() => beep(880, 'sine', 0.15, 0.18), 120)],
  badge:   (m) => !m && [beep(523, 'sine', 0.12, 0.2), setTimeout(() => beep(659, 'sine', 0.15, 0.2), 140), setTimeout(() => beep(784, 'sine', 0.2, 0.22), 300)],
  rankUp:  (m) => !m && [beep(440, 'sine', 0.1, 0.15), setTimeout(() => beep(550, 'sine', 0.1, 0.18), 130), setTimeout(() => beep(660, 'sine', 0.15, 0.22), 270)],
}

/* ─── sub-components ─── */
function Avatar({ initials, hue = 45, size = 44, isUser = false, tier }) {
  const bg = isUser
    ? `linear-gradient(135deg,${G} 0%,#A07830 100%)`
    : `linear-gradient(135deg,hsl(${hue},25%,22%) 0%,hsl(${hue},20%,16%) 100%)`
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, border: isUser ? `2px solid ${G}` : `1.5px solid rgba(255,255,255,0.06)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isUser ? '#1A1200' : GL, fontWeight: 700, fontSize: size * 0.34,
      fontFamily: '"Playfair Display",serif', userSelect: 'none',
      boxShadow: isUser ? `0 0 12px rgba(201,168,76,0.4)` : 'none',
    }}>{initials}</div>
  )
}

function TierPill({ tier }) {
  const c = TIER_COLOR[tier] || G
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700,
      color: c, border: `1px solid ${c}40`, background: `${c}18`,
      borderRadius: 4, padding: '2px 6px', flexShrink: 0,
    }}>{tier}</span>
  )
}

function XpBar({ pct, color = G }) {
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},${GL})`, borderRadius: 99, transition: 'width 0.8s ease' }} />
    </div>
  )
}

function MedalSvg({ rank, size = 32 }) {
  const c = MEDAL[rank] || TEXTD
  if (rank === 1) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="18" r="11" fill={`${c}22`} stroke={c} strokeWidth="1.5" />
      <path d="M16 8 L18.2 13.5 L24 13.5 L19.4 17 L21.2 22.5 L16 19 L10.8 22.5 L12.6 17 L8 13.5 L13.8 13.5 Z" fill={c} opacity={0.9} />
      <path d="M12 3 L14 6 L16 3 L18 6 L20 3" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="18" r="11" fill={`${c}22`} stroke={c} strokeWidth="1.5" />
      <text x="16" y="23" textAnchor="middle" fontSize="13" fontWeight="bold" fill={c} fontFamily="serif">{rank}</text>
    </svg>
  )
}

/* ─── modal shell ─── */
function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: SURF, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: wide ? 640 : 480,
        border: `1px solid ${BORDER}`, borderBottom: 'none', padding: '20px 20px 36px', maxHeight: '88vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ color: GL, fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 600 }}>{title}</span>
          <button onClick={() => { haptic.tap(); onClose() }}
            style={{ width: 32, height: 32, borderRadius: 99, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXTM, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── scan modal ─── */
function ScanModal({ open, onClose, onScan, muted }) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)

  const simulate = async (payload, label) => {
    if (scanning) return
    haptic.tap(); sound.tap(muted)
    setScanning(true); setResult(null)
    sound.scan(muted)
    const res = await onScan(payload)
    setResult({ ...res, label })
    setScanning(false)
    if (res.badgeUnlocked) sound.badge(muted)
    else sound.xpGain(muted)
    haptic.success()
  }

  const scans = [
    { payload: sessionCheckInPayload,      label: 'Session Check-In',      xp: 25 },
    { payload: eventEntryPayload,          label: 'Event Entry',            xp: 50 },
    { payload: connectionVerifiedPayload,  label: 'Connection Verified',    xp: 75 },
    { payload: craftStampPayload,          label: 'Craft Stamp Earned',     xp: 100 },
    { payload: vipStampPayload,            label: 'VIP Stamp Unlock',       xp: 150 },
  ]

  return (
    <Modal open={open} onClose={() => { setResult(null); onClose() }} title="Scan Ranking QR">
      <p style={{ color: TEXTM, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
        Scan a session, event, or activity QR code to earn SmokeCraft XP and update your ranking.
      </p>
      {/* camera frame */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxWidth: 220, margin: '0 auto 24px', borderRadius: 16, border: `2px solid ${G}`, background: '#0A0806', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center,rgba(201,168,76,0.06) 0%,transparent 70%)` }} />
        <div style={{ position: 'absolute', left: 8, top: 8, right: 8, bottom: 8, border: `1px dashed ${G}44`, borderRadius: 10 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 32 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: G, opacity: scanning ? 1 : 0.5 }}>qr_code_scanner</span>
          </div>
          <span style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{scanning ? 'Processing…' : 'QR + NFC Ready'}</span>
        </div>
        {/* scan line */}
        {scanning && (
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${G},transparent)`, animation: 'scan-line 1.2s ease-in-out infinite' }} />
        )}
      </div>
      <style>{`@keyframes scan-line { 0%{top:10%} 50%{top:90%} 100%{top:10%} }`}</style>

      {result && (
        <div style={{ background: `${G}18`, border: `1px solid ${G}44`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ color: G, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>+{result.xpAdded} XP</div>
          <div style={{ color: TEXT, fontSize: 13 }}>{result.label} processed</div>
          {result.badgeUnlocked && <div style={{ color: G, fontSize: 11, marginTop: 6 }}>🏅 Badge Unlocked: {result.badgeUnlocked.name}</div>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scans.map(({ payload, label, xp }) => (
          <button key={label} onClick={() => simulate(payload, label)} disabled={scanning}
            style={{
              padding: '14px 16px', borderRadius: 10, border: `1px solid ${BORDER}`,
              background: scanning ? 'rgba(255,255,255,0.02)' : CARD, color: TEXT,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: scanning ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: 14,
            }}>
            <span>{label}</span>
            <span style={{ color: G, fontWeight: 700, fontSize: 13 }}>+{xp} XP</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

/* ─── member detail modal ─── */
function MemberModal({ open, onClose, member }) {
  if (!member) return null
  return (
    <Modal open={open} onClose={onClose} title={member.name}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: 16, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}` }}>
        <Avatar initials={member.initials} hue={member.hue} size={56} isUser={member.isCurrentUser} />
        <div>
          <div style={{ color: TEXT, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{member.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <TierPill tier={member.tier} />
            <span style={{ color: TEXTD, fontSize: 11 }}>Rank #{member.rank}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: G, fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 22 }}>{member.xp.toLocaleString()}</div>
          <div style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.15em' }}>XP</div>
        </div>
      </div>
      <XpBar pct={member.progressPercent} />
      <div style={{ color: TEXTD, fontSize: 11, marginTop: 6, marginBottom: 20 }}>{member.progressPercent}% to next tier</div>
      <div style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Recent XP Activity</div>
      {(member.recentActions || []).map((a, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}`, color: TEXTM, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{a}</span>
        </div>
      ))}
    </Modal>
  )
}

/* ─── activity detail modal ─── */
function ActivityModal({ open, onClose, item }) {
  if (!item) return null
  const badge = BADGES_DATA.find(b => b.id === item.badgeId)
  return (
    <Modal open={open} onClose={onClose} title={item.title}>
      <div style={{ padding: 16, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <div style={{ color: GL, fontSize: 14, marginBottom: 8 }}>{item.desc}</div>
        <div style={{ color: G, fontWeight: 700, fontSize: 24, fontFamily: '"Playfair Display",serif' }}>+{item.xp} XP</div>
        <div style={{ color: TEXTD, fontSize: 12, marginTop: 4 }}>{item.ago}</div>
      </div>
      {badge && (
        <div style={{ padding: 14, background: `${badge.color}18`, border: `1px solid ${badge.color}44`, borderRadius: 12 }}>
          <div style={{ color: badge.color, fontWeight: 700, marginBottom: 4 }}>Related Badge: {badge.name}</div>
          <div style={{ color: TEXTM, fontSize: 12 }}>{badge.description}</div>
        </div>
      )}
    </Modal>
  )
}

/* ─── tier detail modal ─── */
function TierModal({ open, onClose, tier }) {
  if (!tier) return null
  return (
    <Modal open={open} onClose={onClose} title={tier.name}>
      <div style={{ padding: 16, background: `${tier.color}18`, border: `1px solid ${tier.color}44`, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ color: tier.color, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{tier.name}</div>
        <div style={{ color: TEXTM, fontSize: 13, lineHeight: 1.6 }}>{tier.description}</div>
      </div>
      <div style={{ color: TEXTD, fontSize: 12, padding: '8px 0' }}>
        XP Range: <span style={{ color: TEXT }}>{tier.minXp.toLocaleString()} – {tier.maxXp ? tier.maxXp.toLocaleString() : '∞'} XP</span>
      </div>
    </Modal>
  )
}

/* ─── admin panel ─── */
function AdminPanel({ open, onClose, onAddXp }) {
  const [xpAmount, setXpAmount] = useState(50)
  return (
    <Modal open={open} onClose={onClose} title="Ranking Admin Panel" wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Add XP to Current User', action: () => { haptic.success(); onAddXp(xpAmount); onClose() } },
          { label: 'Reset Leaderboard (Mock)',     action: () => { haptic.warning(); onClose() } },
          { label: 'Request Hero Image Update',    action: () => { haptic.tap(); alert('Image replacement request queued for secure backend generation.') } },
        ].map(({ label, action }) => (
          <button key={label} onClick={action}
            style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, textAlign: 'left', cursor: 'pointer', fontSize: 14 }}>
            {label}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <span style={{ color: TEXTM, fontSize: 13 }}>XP to add:</span>
          {[25, 50, 75, 100, 150].map(v => (
            <button key={v} onClick={() => setXpAmount(v)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${xpAmount === v ? G : BORDER}`, background: xpAmount === v ? `${G}22` : 'transparent', color: xpAmount === v ? G : TEXTM, cursor: 'pointer', fontSize: 12 }}>
              +{v}
            </button>
          ))}
        </div>
        <div style={{ color: TEXTD, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
          Real OpenAI image generation must happen on the backend. Never expose API keys in frontend code.
        </div>
      </div>
    </Modal>
  )
}

/* ─── ranking info modal ─── */
function RankingInfoModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="About Rankings">
      <p style={{ color: TEXTM, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
        Rankings in the Grand Lounge are determined by SmokeCraft XP earned across all sessions, events, and connections. The higher your XP, the deeper your access and recognition within the Brotherhood.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RANKING_DATA.tiers.map(t => (
          <div key={t.id} style={{ padding: '10px 14px', background: `${t.color}12`, border: `1px solid ${t.color}30`, borderRadius: 10 }}>
            <div style={{ color: t.color, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t.name}</div>
            <div style={{ color: TEXTD, fontSize: 11 }}>{t.minXp.toLocaleString()} – {t.maxXp ? t.maxXp.toLocaleString() : '∞'} XP · {t.description}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ─── toast ─── */
function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0, transition: 'all 0.35s ease', zIndex: 300,
      background: `linear-gradient(135deg,#1E1600,#2A1E00)`, border: `1px solid ${G}`,
      color: GL, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 99,
      boxShadow: `0 4px 24px rgba(201,168,76,0.35)`, whiteSpace: 'nowrap', pointerEvents: 'none',
    }}>{message}</div>
  )
}

/* ─── badge unlocked overlay ─── */
function BadgeOverlay({ badge, onClose }) {
  if (!badge) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ textAlign: 'center', padding: 40, animation: 'badge-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle,${badge.color}44 0%,transparent 70%)`, border: `3px solid ${badge.color}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${badge.color}66` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: badge.color }}>workspace_premium</span>
        </div>
        <div style={{ color: G, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Badge Unlocked</div>
        <div style={{ color: GL, fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 600, marginBottom: 12 }}>{badge.name}</div>
        <div style={{ color: TEXTM, fontSize: 13, maxWidth: 280, margin: '0 auto 24px' }}>{badge.description}</div>
        <div style={{ color: TEXTD, fontSize: 11 }}>Tap to continue</div>
      </div>
      <style>{`@keyframes badge-pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function Leaderboard() {
  const navigate              = useNavigate()
  const { session, addXP, completeStep } = useGuestSession()

  const [board,     setBoard]     = useState([])
  const [activity,  setActivity]  = useState(RECENT_RANKING_ACTIVITY)
  const [muted,     setMuted]     = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [animXp,    setAnimXp]    = useState(0)
  const [accepted,  setAccepted]  = useState(false)

  const [modal, setModal] = useState({ scan: false, info: false, member: null, activity: null, tier: null, admin: false })

  const [toast,         setToast]         = useState({ visible: false, message: '' })
  const [badgeOverlay,  setBadgeOverlay]  = useState(null)
  const [rankChanged,   setRankChanged]   = useState(null)

  const userRowRef    = useRef(null)
  const sectionsRef   = useRef({})
  const seenSections  = useRef(new Set())
  const toastTimer    = useRef(null)

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
    getLeaderboard().then(b => { setBoard(b); const me = b.find(u => u.isCurrentUser); if (me) setAnimXp(me.xp) })
  }, [])

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3200)
  }

  async function handleScan(payload) {
    const res = await processRankingScan(payload)
    setBoard(res.leaderboard)
    setActivity(prev => [res.activityEntry, ...prev])
    const me = res.leaderboard.find(u => u.isCurrentUser)
    if (me) setAnimXp(me.xp)
    if (res.badgeUnlocked) { sound.badge(muted); setBadgeOverlay(res.badgeUnlocked) }
    else sound.xpGain(muted)
    showToast(res.toast)
    return res
  }

  async function handleAdminAddXp(amount) {
    await handleScan({ sourceType: 'session', sourceId: 'admin-add', xpValue: amount, venueId: 'grand-lounge', issuedBy: 'admin', signature: 'admin' })
    sound.rankUp(muted); haptic.success()
  }

  function handleMyRank() {
    haptic.tap(); sound.tap(muted)
    userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    userRowRef.current?.animate([{ boxShadow: `0 0 0 3px ${G}` }, { boxShadow: `0 0 0 0px ${G}00` }], { duration: 1200, easing: 'ease-out' })
  }

  function handleContinue() {
    if (accepted) return
    setAccepted(true); haptic.success()
    addXP(25); completeStep('leaderboard')
    setTimeout(() => navigate('/smokecraft/golden-box/status'), 400)
  }

  // Scroll haptics via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !seenSections.current.has(e.target.id)) {
          seenSections.current.add(e.target.id); haptic.scroll()
        }
      })
    }, { threshold: 0.3 })
    Object.values(sectionsRef.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [mounted])

  const me    = board.find(u => u.isCurrentUser)
  const top3  = board.slice(0, 3)
  const rest  = board.slice(3)

  const s = (id) => (el) => { if (el) { el.id = id; sectionsRef.current[id] = el } }

  const LOUNGE_IMG = craftImages.fallbacks.lounge
  const CIGAR_IMG  = craftImages.fallbacks.cigar

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: 'system-ui,sans-serif', position: 'relative' }}>

      {/* ─── fixed top header ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: `rgba(12,10,7,0.92)`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`, padding: '0 16px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { haptic.tap(); navigate('/passport') }}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXTM, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <div style={{ fontSize: 9, color: TEXTD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Grand Lounge</div>
            <div style={{ fontSize: 13, color: GL, fontWeight: 600, letterSpacing: '0.05em' }}>Tonight's Ranking</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => { haptic.tap(); sound.tap(muted); setModal(m => ({ ...m, info: true })) }}
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXTM, cursor: 'pointer', fontSize: 11, letterSpacing: '0.05em' }}>
            About Rankings
          </button>
          <button onClick={handleMyRank}
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${G}55`, background: `${G}18`, color: G, cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
            My Rank
          </button>
          <button onClick={() => { haptic.tap(); sound.tap(muted); setMuted(m => !m) }}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: muted ? TEXTD : TEXTM, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{muted ? 'volume_off' : 'volume_up'}</span>
          </button>
        </div>
      </header>

      {/* ─── hero ─── */}
      <section ref={s('hero')} style={{ position: 'relative', height: 220, marginTop: 56, overflow: 'hidden' }}>
        <img src={LOUNGE_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', filter: 'brightness(0.55) saturate(1.2)' }} onError={e => e.target.style.display = 'none'} />
        <img src={CIGAR_IMG} alt="" style={{ position: 'absolute', right: 0, bottom: 0, height: '90%', objectFit: 'contain', opacity: 0.35 }} onError={e => e.target.style.display = 'none'} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(12,10,7,0.7) 0%,rgba(12,10,7,0.3) 60%,transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top,${BG},transparent)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 24px' }}>
          <div style={{ fontSize: 9, color: `${G}99`, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 6 }}>Grand Lounge · SmokeCraft 360</div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, margin: 0, lineHeight: 1.15 }}>
            Tonight's <span style={{ color: G, fontStyle: 'italic' }}>Ranking</span>
          </h1>
          <p style={{ color: TEXTM, fontSize: 12, margin: '8px 0 0', maxWidth: 320, lineHeight: 1.5 }}>
            Ranked by SmokeCraft XP earned across all sessions. You enter the Grand Lounge as a ranked member of this cigar society.
          </p>
        </div>
      </section>

      <main style={{ padding: '16px 16px 120px', maxWidth: 640, margin: '0 auto' }}>

        {/* ─── user position card ─── */}
        {me && (
          <div ref={s('position')} onClick={() => { haptic.tap(); setModal(m => ({ ...m, member: me })) }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: `1.5px solid ${G}55`, background: `linear-gradient(135deg,rgba(201,168,76,0.1) 0%,rgba(201,168,76,0.04) 100%)`, marginBottom: 20, cursor: 'pointer', boxShadow: `0 4px 20px rgba(201,168,76,0.12)`, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(8px)', transition: 'all 0.6s ease' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg,${G},#A07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#1A1200', fontWeight: 800, fontFamily: '"Playfair Display",serif', fontSize: 22 }}>{me.rank}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: `${G}88`, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Your Position</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, color: TEXT }}>
                {me.rank === 1 ? '1st' : me.rank === 2 ? '2nd' : me.rank === 3 ? '3rd' : `${me.rank}th`} in the Grand Lounge
              </div>
            </div>
            <TierPill tier={me.tier} />
          </div>
        )}

        {/* ─── top 3 podium ─── */}
        <div ref={s('top3')} id="top3">
          <div style={{ fontSize: 9, color: TEXTD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>Top Ranked Tonight</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 8, marginBottom: 20 }}>
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((m, i) => {
              const actualRank = m.rank
              const isCenter   = actualRank === 1
              return (
                <div key={m.id} onClick={() => { haptic.tap(); sound.tap(muted); setModal(mo => ({ ...mo, member: m })) }}
                  style={{
                    padding: isCenter ? '20px 12px 16px' : '16px 10px 12px',
                    borderRadius: 14, border: `1.5px solid ${MEDAL[actualRank]}44`,
                    background: `linear-gradient(180deg,${MEDAL[actualRank]}10 0%,${CARD} 100%)`,
                    textAlign: 'center', cursor: 'pointer',
                    boxShadow: isCenter ? `0 8px 32px ${MEDAL[1]}22` : 'none',
                    order: isCenter ? 0 : actualRank === 2 ? -1 : 1,
                    opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(12px)',
                    transition: `all 0.6s ease ${isCenter ? '0.1s' : '0.2s'}`,
                    position: 'relative',
                  }}>
                  {isCenter && (
                    <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />
                    </div>
                  )}
                  <MedalSvg rank={actualRank} size={isCenter ? 36 : 28} />
                  <div style={{ margin: '10px auto 8px' }}>
                    <Avatar initials={m.initials} hue={m.hue} size={isCenter ? 52 : 42} isUser={m.isCurrentUser} />
                  </div>
                  <div style={{ color: TEXT, fontWeight: 600, fontSize: isCenter ? 13 : 11, marginBottom: 4, lineHeight: 1.3 }}>{m.name}</div>
                  <TierPill tier={m.tier} />
                  <div style={{ marginTop: 10 }}>
                    <XpBar pct={m.progressPercent} color={MEDAL[actualRank]} />
                    <div style={{ color: MEDAL[actualRank], fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: isCenter ? 18 : 14, marginTop: 6 }}>
                      {m.xp.toLocaleString()} <span style={{ fontSize: 9, opacity: 0.7 }}>XP</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── full leaderboard rows 4–10 ─── */}
        <div ref={s('leaderboard')}>
          <div style={{ fontSize: 9, color: TEXTD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Full Ranking</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
            {rest.map((m, i) => {
              const isUser = m.isCurrentUser
              return (
                <div key={m.id} ref={isUser ? userRowRef : null}
                  onClick={() => { haptic.tap(); sound.tap(muted); setModal(mo => ({ ...mo, member: m })) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
                    borderRadius: 12, minHeight: 72, cursor: 'pointer',
                    border: isUser ? `1.5px solid ${G}66` : `1px solid ${BORDER}`,
                    background: isUser ? `linear-gradient(90deg,rgba(201,168,76,0.1) 0%,rgba(201,168,76,0.03) 100%)` : CARD,
                    boxShadow: isUser ? `0 2px 16px rgba(201,168,76,0.18)` : 'none',
                    opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateX(-8px)',
                    transition: `all 0.5s ease ${i * 40}ms`,
                  }}>
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0, color: TEXTD, fontSize: 13, fontWeight: 700 }}>{m.rank}</div>
                  <Avatar initials={m.initials} hue={m.hue} size={40} isUser={isUser} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ color: isUser ? GL : TEXT, fontWeight: isUser ? 600 : 400, fontSize: 14, fontFamily: isUser ? '"Playfair Display",serif' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </span>
                      {isUser && <span style={{ fontSize: 9, fontWeight: 700, color: '#1A1200', background: G, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.1em' }}>YOU</span>}
                      <TierPill tier={m.tier} />
                    </div>
                    <XpBar pct={m.progressPercent} color={isUser ? G : GD} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: isUser ? G : TEXT, fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 16 }}>{m.xp.toLocaleString()}</div>
                    <div style={{ color: TEXTD, fontSize: 9, letterSpacing: '0.12em' }}>XP</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: TEXTD, flexShrink: 0 }}>chevron_right</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── rank tier education ─── */}
        <div ref={s('tiers')} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, color: TEXT, marginBottom: 3 }}>Rank Up. Earn Recognition.</div>
              <div style={{ color: TEXTD, fontSize: 12 }}>The higher you rank, the deeper your access and experience.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {RANKING_DATA.tiers.map(t => (
              <div key={t.id} onClick={() => { haptic.tap(); setModal(m => ({ ...m, tier: t })) }}
                style={{ padding: '14px 14px', borderRadius: 12, border: `1px solid ${t.color}30`, background: `${t.color}0A`, cursor: 'pointer' }}>
                <div style={{ color: t.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
                <div style={{ color: TEXTD, fontSize: 10 }}>{t.minXp.toLocaleString()} – {t.maxXp ? t.maxXp.toLocaleString() : '∞'} XP</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── recent activity ─── */}
        <div ref={s('activity')} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, color: TEXT }}>Your Recent Activity</div>
            <button onClick={() => haptic.tap()} style={{ color: G, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View All →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activity.slice(0, 6).map(item => (
              <div key={item.id} onClick={() => { haptic.tap(); setModal(m => ({ ...m, activity: item })) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, cursor: 'pointer', minHeight: 60 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}18`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: G }}>{ item.icon }</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: TEXT, fontSize: 13, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div style={{ color: TEXTD, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: G, fontWeight: 700, fontSize: 13 }}>+{item.xp} XP</div>
                  <div style={{ color: TEXTD, fontSize: 10 }}>{item.ago}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: TEXTD, flexShrink: 0 }}>chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── profile rank card ─── */}
        <div ref={s('profile')} style={{ padding: 20, borderRadius: 16, border: `1.5px solid ${G}33`, background: `linear-gradient(135deg,rgba(201,168,76,0.08) 0%,${CARD} 100%)`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${G},#A07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1A1200', fontFamily: '"Playfair Display",serif', fontSize: 20, border: `2px solid ${G}` }}>JC</div>
            <div>
              <div style={{ color: TEXT, fontWeight: 600, fontSize: 16, marginBottom: 3 }}>John M Collins</div>
              <div style={{ color: TEXTD, fontSize: 11 }}>Aficionado Member · #1206</div>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: TEXTM, fontSize: 12 }}>Legacy Score</span>
              <span style={{ color: G, fontWeight: 700, fontSize: 12 }}>{animXp.toLocaleString()} / 2,000 XP</span>
            </div>
            <XpBar pct={Math.round((animXp / 2000) * 100)} />
            <div style={{ color: TEXTD, fontSize: 10, marginTop: 5 }}>{Math.round((animXp / 2000) * 100)}% to Connoisseur</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => haptic.tap()} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Edit Profile</button>
            <button onClick={() => { haptic.tap(); navigate('/passport/profile') }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${G}55`, background: `${G}18`, color: G, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>View Profile</button>
          </div>
        </div>

        {/* ─── golden box CTA ─── */}
        <button onClick={handleContinue} disabled={accepted}
          style={{ width: '100%', padding: '18px 0', borderRadius: 14, border: 'none', background: accepted ? GD : `linear-gradient(135deg,${G} 0%,#A07830 100%)`, color: '#1A1200', fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 17, cursor: accepted ? 'not-allowed' : 'pointer', boxShadow: accepted ? 'none' : `0 4px 24px rgba(201,168,76,0.35)`, transition: 'all 0.3s', marginBottom: 8 }}>
          {accepted ? 'Proceeding to Golden Box…' : 'Claim Your Golden Box → +25 XP'}
        </button>
        <div style={{ textAlign: 'center', color: TEXTD, fontSize: 11 }}>Unlocks Golden Box Status</div>
      </main>

      {/* ─── fixed bottom nav ─── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: `rgba(12,10,7,0.96)`, backdropFilter: 'blur(16px)', borderTop: `1px solid ${BORDER}`, padding: '6px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {[
          { label: 'HM',  icon: 'home',      full: 'Home',      route: '/passport' },
          { label: 'DIR', icon: 'grid_view',  full: 'Directory', route: '/passport/directory' },
        ].map(({ label, icon, full, route }) => (
          <button key={label} onClick={() => { haptic.tap(); navigate(route) }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', minWidth: 52, padding: '6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: TEXTD }}>{ icon }</span>
            <span style={{ fontSize: 9, color: TEXTD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{full}</span>
          </button>
        ))}

        {/* center scan */}
        <button onClick={() => { haptic.tap(); sound.tap(muted); setModal(m => ({ ...m, scan: true })) }}
          style={{ width: 58, height: 58, borderRadius: '50%', background: `linear-gradient(135deg,${G},#A07830)`, border: `2px solid ${GL}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 20px rgba(201,168,76,0.4)`, marginTop: -18 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#1A1200', fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          <span style={{ fontSize: 7, color: '#1A1200', fontWeight: 700, letterSpacing: '0.08em', marginTop: 1 }}>SCAN</span>
        </button>

        {[
          { label: 'EVT', icon: 'event',    full: 'Events',   route: '/passport/events' },
          { label: 'BNF', icon: 'card_giftcard', full: 'Benefits', route: '/passport/benefits' },
        ].map(({ label, icon, full, route }) => (
          <button key={label} onClick={() => { haptic.tap(); navigate(route) }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', minWidth: 52, padding: '6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: TEXTD }}>{ icon }</span>
            <span style={{ fontSize: 9, color: TEXTD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{full}</span>
          </button>
        ))}
      </nav>

      {/* ─── floating admin button ─── */}
      <button onClick={() => { haptic.tap(); setModal(m => ({ ...m, admin: true })) }}
        style={{ position: 'fixed', bottom: 90, right: 16, zIndex: 110, width: 40, height: 40, borderRadius: 10, background: `rgba(201,168,76,0.15)`, border: `1px solid ${G}44`, color: G, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
      </button>

      {/* ─── modals ─── */}
      <ScanModal    open={modal.scan}   onClose={() => setModal(m => ({ ...m, scan: false }))}   onScan={handleScan} muted={muted} />
      <RankingInfoModal open={modal.info}  onClose={() => setModal(m => ({ ...m, info: false }))} />
      <MemberModal  open={!!modal.member} onClose={() => setModal(m => ({ ...m, member: null }))} member={modal.member} />
      <ActivityModal open={!!modal.activity} onClose={() => setModal(m => ({ ...m, activity: null }))} item={modal.activity} />
      <TierModal    open={!!modal.tier}  onClose={() => setModal(m => ({ ...m, tier: null }))}   tier={modal.tier} />
      <AdminPanel   open={modal.admin}   onClose={() => setModal(m => ({ ...m, admin: false }))}  onAddXp={handleAdminAddXp} />

      {/* ─── overlays ─── */}
      <BadgeOverlay badge={badgeOverlay} onClose={() => { haptic.tap(); setBadgeOverlay(null) }} />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
