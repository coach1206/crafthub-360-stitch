import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getLeaderboard, processRankingScan, getRecentRankingActivity } from '../../api/rankingApi.js'
import { RANKING_DATA, BADGES_DATA } from '../../data/rankingData.js'
import {
  sessionCheckInPayload, eventEntryPayload,
  connectionVerifiedPayload, craftStampPayload, vipStampPayload,
} from '../../utils/rankingQrPayloads.js'
import TicketTicker from '../../components/common/TicketTicker.jsx'
import { SmokeCraftBottomNav } from '../../components/smokecraft/SmokeCraftPremium.jsx'
import { getLeaderboardSnapshot } from '../../services/smokecraft/smokeLeaderboardService.js'
import { getSmokeSharedStorageMode, saveSmokeLeaderboardEntry } from '../../services/smokecraft/smokeSharedStorageService.js'

/* ─── palette ─── */
const G = '#C9A84C', GL = '#E8D5A3', GD = '#8A7030'
const BG = '#050302', SURF = '#181410', CARD = 'rgba(255,255,255,0.045)'
const TEXT = '#F5E8C8', TEXTM = '#C8B89A', TEXTD = '#7A6B55'
const BORDER = 'rgba(201,168,76,0.18)', BORDERHI = 'rgba(201,168,76,0.45)'
const MEDAL = { 1: '#C9A84C', 2: '#B8B8B8', 3: '#A0714C' }
const TIER_COLOR = { Aficionado: G, Connoisseur: '#D4820A', Sommelier: '#B8860B', Patron: '#8B0000' }
const ROMAN = ['I', 'II', 'III', 'IV']

/* ─── haptics ─── */
const haptic = {
  tap:     () => navigator.vibrate?.(25),
  success: () => navigator.vibrate?.([20, 40, 20]),
  warning: () => navigator.vibrate?.([60, 30, 60]),
}

/* ─── web audio ─── */
let _ctx = null
function ac() { if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)(); return _ctx }
function beep(f = 440, t = 'sine', d = 0.12, v = 0.15) {
  try { const c = ac(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.start(); o.stop(c.currentTime + d) } catch {}
}
const snd = {
  tap:    (m) => !m && beep(660, 'sine',     0.08, 0.12),
  scan:   (m) => !m && beep(880, 'triangle', 0.18, 0.20),
  xp:     (m) => !m && (beep(660, 'sine', 0.1, 0.15), setTimeout(() => beep(880, 'sine', 0.15, 0.18), 120)),
  badge:  (m) => !m && (beep(523, 'sine', 0.12, 0.2), setTimeout(() => beep(659, 'sine', 0.15, 0.2), 140), setTimeout(() => beep(784, 'sine', 0.2, 0.22), 300)),
}

/* ─── helpers ─── */
function Avatar({ initials, hue = 45, size = 44, isUser = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isUser ? `linear-gradient(135deg,${G} 0%,#A07830 100%)` : `linear-gradient(135deg,hsl(${hue},25%,22%) 0%,hsl(${hue},20%,16%) 100%)`,
      border: isUser ? `2px solid ${G}` : `1.5px solid rgba(255,255,255,0.06)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isUser ? '#1A1200' : GL, fontWeight: 700, fontSize: size * 0.34,
      fontFamily: '"Playfair Display",serif', userSelect: 'none',
      boxShadow: isUser ? `0 0 12px rgba(201,168,76,0.4)` : 'none',
    }}>{initials}</div>
  )
}

function TierPill({ tier, small }) {
  const c = TIER_COLOR[tier] || G
  return (
    <span style={{
      fontSize: small ? 8 : 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
      color: c, border: `1px solid ${c}40`, background: `${c}18`,
      borderRadius: 4, padding: small ? '1px 5px' : '2px 6px', flexShrink: 0,
    }}>{tier}</span>
  )
}

function XpBar({ pct, color = G, h = 3 }) {
  return (
    <div style={{ height: h, background: 'rgba(255,255,255,0.09)', border: `1px solid rgba(201,168,76,${h > 3 ? 0.24 : 0.12})`, borderRadius: 99, overflow: 'hidden', flex: 1, minWidth: 40, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.65)' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},${GL},${color})`, borderRadius: 99, transition: 'width 0.8s ease', boxShadow: `0 0 ${h > 3 ? 18 : 10}px ${color}aa` }} />
    </div>
  )
}

function RewardsAtmosphere() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: BG }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(90deg,rgba(5,3,2,0.98) 0%,rgba(5,3,2,0.74) 35%,rgba(5,3,2,0.62) 62%,rgba(5,3,2,0.97) 100%), linear-gradient(180deg,rgba(5,3,2,0.7) 0%,rgba(5,3,2,0.2) 38%,rgba(5,3,2,0.96) 100%), url(/assets/smokecraft/cropped/golden-box-hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'saturate(1.14) contrast(1.14) brightness(0.64)',
      }} />
      <div style={{
        position: 'absolute',
        right: '7%',
        top: '7%',
        width: '32%',
        maxWidth: 380,
        aspectRatio: '1.2',
        borderRadius: 28,
        backgroundImage: 'linear-gradient(90deg,rgba(5,3,2,0.52),rgba(5,3,2,0.12)), url(/assets/smokecraft/cropped/scorecard-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.24,
        filter: 'blur(1px) saturate(1.18) brightness(0.92)',
        boxShadow: `0 0 90px rgba(201,168,76,0.18)`,
      }} />
      <div style={{
        position: 'absolute',
        left: '-12%',
        top: '8%',
        width: '42%',
        height: '78%',
        background: 'radial-gradient(ellipse at center, rgba(232,213,163,0.16), rgba(201,168,76,0.08) 32%, transparent 68%)',
        filter: 'blur(38px)',
      }} />
      <div style={{
        position: 'absolute',
        right: '-10%',
        top: '10%',
        width: '38%',
        height: '72%',
        background: 'radial-gradient(ellipse at center, rgba(201,118,34,0.22), rgba(201,168,76,0.08) 34%, transparent 70%)',
        filter: 'blur(42px)',
      }} />
      <div style={{
        position: 'absolute',
        left: '18%',
        top: '6%',
        width: '58%',
        height: '36%',
        background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.2), rgba(201,168,76,0.08) 36%, transparent 70%)',
        filter: 'blur(34px)',
      }} />
      <div style={{
        position: 'absolute',
        inset: '-8% -2%',
        opacity: 0.34,
        backgroundImage: 'radial-gradient(ellipse at 12% 34%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 18%, transparent 43%), radial-gradient(ellipse at 92% 28%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 18%, transparent 43%), radial-gradient(ellipse at 50% 88%, rgba(201,168,76,0.11) 0%, transparent 46%)',
        filter: 'blur(22px)',
        mixBlendMode: 'screen',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 48%, rgba(0,0,0,0.74) 100%), linear-gradient(180deg,rgba(0,0,0,0.42),transparent 24%,rgba(0,0,0,0.68) 100%)',
      }} />
    </div>
  )
}

function MedalIcon({ rank, size = 28 }) {
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
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: SURF, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, border: `1px solid ${BORDER}`, borderBottom: 'none', padding: '20px 20px 40px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ color: GL, fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 600 }}>{title}</span>
          <button onClick={() => { haptic.tap(); onClose() }} style={{ width: 32, height: 32, borderRadius: 99, border: `1px solid ${BORDER}`, background: CARD, color: TEXTM, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ScanModal({ open, onClose, onScan, muted }) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const scans = [
    { payload: sessionCheckInPayload,     label: 'Simulate Session Check-In',   xp: 25  },
    { payload: eventEntryPayload,         label: 'Simulate Event Entry',         xp: 50  },
    { payload: connectionVerifiedPayload, label: 'Simulate Connection Verified', xp: 75  },
    { payload: craftStampPayload,         label: 'Simulate Craft Stamp Earned',  xp: 100 },
    { payload: vipStampPayload,           label: 'Simulate VIP Stamp Unlock',    xp: 150 },
  ]
  async function simulate(payload, label) {
    if (scanning) return
    haptic.tap(); snd.scan(muted); setScanning(true); setResult(null)
    const res = await onScan(payload)
    setResult({ ...res, label }); setScanning(false)
    res.badgeUnlocked ? snd.badge(muted) : snd.xp(muted)
    haptic.success()
  }
  return (
    <Modal open={open} onClose={() => { setResult(null); onClose() }} title="Scan Ranking QR">
      <p style={{ color: TEXTM, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>Scan a session, event, or activity QR code to earn SmokeCraft XP and update your ranking.</p>
      <div style={{ position: 'relative', width: 200, aspectRatio: '1', margin: '0 auto 20px', borderRadius: 14, border: `2px solid ${G}`, background: '#0A0806', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 52, color: G, opacity: scanning ? 1 : 0.5 }}>qr_code_scanner</span>
        <span style={{ color: TEXTD, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{scanning ? 'Processing…' : 'QR + NFC Ready'}</span>
        {scanning && <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${G},transparent)`, animation: 'scan-ln 1.2s ease-in-out infinite' }} />}
      </div>
      <style>{`@keyframes scan-ln{0%{top:10%}50%{top:90%}100%{top:10%}}`}</style>
      {result && (
        <div style={{ background: `${G}18`, border: `1px solid ${G}44`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ color: G, fontWeight: 700, fontSize: 22 }}>+{result.xpAdded} XP</div>
          <div style={{ color: TEXT, fontSize: 13 }}>{result.label} complete</div>
          {result.badgeUnlocked && <div style={{ color: G, fontSize: 11, marginTop: 6 }}>Badge Unlocked: {result.badgeUnlocked.name}</div>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scans.map(({ payload, label, xp }) => (
          <button key={label} onClick={() => simulate(payload, label)} disabled={scanning}
            style={{ padding: '13px 16px', borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: scanning ? 'not-allowed' : 'pointer', fontSize: 13 }}>
            <span>{label}</span><span style={{ color: G, fontWeight: 700 }}>+{xp} XP</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function MemberModal({ open, onClose, member }) {
  if (!member) return null
  return (
    <Modal open={open} onClose={onClose} title={member.name}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: 14, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}` }}>
        <Avatar initials={member.initials} hue={member.hue} size={52} isUser={member.isCurrentUser} />
        <div style={{ flex: 1 }}>
          <div style={{ color: TEXT, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{member.name}</div>
          <div style={{ display: 'flex', gap: 8 }}><TierPill tier={member.tier} /><span style={{ color: TEXTD, fontSize: 11 }}>Rank #{member.rank}</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: G, fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 22 }}>{member.xp.toLocaleString()}</div>
          <div style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.1em' }}>XP</div>
        </div>
      </div>
      <XpBar pct={member.progressPercent} />
      <div style={{ color: TEXTD, fontSize: 11, marginTop: 6, marginBottom: 18 }}>{member.progressPercent}% to next tier</div>
      <div style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Activity</div>
      {(member.recentActions || []).map((a, i) => (
        <div key={i} style={{ padding: '9px 0', borderBottom: `1px solid ${BORDER}`, color: TEXTM, fontSize: 13 }}>{a}</div>
      ))}
    </Modal>
  )
}

function ActivityModal({ open, onClose, item }) {
  if (!item) return null
  const badge = BADGES_DATA.find(b => b.id === item.badgeId)
  return (
    <Modal open={open} onClose={onClose} title={item.title}>
      <div style={{ padding: 14, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 14 }}>
        <div style={{ color: GL, fontSize: 14, marginBottom: 8 }}>{item.desc}</div>
        <div style={{ color: G, fontWeight: 700, fontSize: 24, fontFamily: '"Playfair Display",serif' }}>+{item.xp} XP</div>
        <div style={{ color: TEXTD, fontSize: 12, marginTop: 4 }}>{item.ago}</div>
      </div>
      {badge && <div style={{ padding: 12, background: `${badge.color}18`, border: `1px solid ${badge.color}44`, borderRadius: 12 }}>
        <div style={{ color: badge.color, fontWeight: 700, marginBottom: 4 }}>Badge: {badge.name}</div>
        <div style={{ color: TEXTM, fontSize: 12 }}>{badge.description}</div>
      </div>}
    </Modal>
  )
}

function ActivityListModal({ open, onClose, activity, onSelect }) {
  return (
    <Modal open={open} onClose={onClose} title="All Recent Activity">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {activity.map(item => (
          <button key={item.id} onClick={() => onSelect(item)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 58, padding: '10px 12px', borderRadius: 12, border: `1px solid rgba(201,168,76,0.28)`, background: 'rgba(12,9,6,0.86)', color: TEXT, cursor: 'pointer', textAlign: 'left', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${G}18`, border: `1px solid ${G}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: G }}>{item.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
              <div style={{ color: TEXTD, fontSize: 11, lineHeight: 1.35 }}>{item.desc}</div>
            </div>
            <div style={{ color: G, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>+{item.xp} XP</div>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function TierModal({ open, onClose, tier }) {
  if (!tier) return null
  return (
    <Modal open={open} onClose={onClose} title={tier.name}>
      <div style={{ padding: 14, background: `${tier.color}18`, border: `1px solid ${tier.color}44`, borderRadius: 12, marginBottom: 14 }}>
        <div style={{ color: tier.color, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{tier.name}</div>
        <div style={{ color: TEXTM, fontSize: 13, lineHeight: 1.6 }}>{tier.description}</div>
      </div>
      <div style={{ color: TEXTD, fontSize: 12 }}>XP Range: <span style={{ color: TEXT }}>{tier.minXp.toLocaleString()} – {tier.maxXp ? tier.maxXp.toLocaleString() : '∞'} XP</span></div>
    </Modal>
  )
}

function RankingInfoModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="About Rankings">
      <p style={{ color: TEXTM, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>Rankings are determined by SmokeCraft XP earned across sessions, events, and connections. Higher XP = deeper access and recognition.</p>
      {RANKING_DATA.tiers.map(t => (
        <div key={t.id} style={{ padding: '10px 12px', background: `${t.color}12`, border: `1px solid ${t.color}30`, borderRadius: 10, marginBottom: 8 }}>
          <div style={{ color: t.color, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{t.name}</div>
          <div style={{ color: TEXTD, fontSize: 11 }}>{t.minXp.toLocaleString()} – {t.maxXp ? t.maxXp.toLocaleString() : '∞'} XP</div>
        </div>
      ))}
    </Modal>
  )
}

function AdminPanel({ open, onClose, onAddXp }) {
  const [amt, setAmt] = useState(50)
  return (
    <Modal open={open} onClose={onClose} title="Ranking Admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: TEXTD, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Bottom Nav: Home · Reserve · Scan · Passport · Profile ✓</div>
        {[
          { l: 'Add XP to Current User', a: () => { haptic.success(); onAddXp(amt); onClose() } },
          { l: 'Reset Leaderboard (Mock)', a: () => { haptic.warning(); onClose() } },
          { l: 'Request Hero Image Update', a: () => { haptic.tap(); alert('Image replacement queued for backend generation.') } },
        ].map(({ l, a }) => (
          <button key={l} onClick={a} style={{ padding: '13px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>{l}</button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ color: TEXTM, fontSize: 12 }}>XP amount:</span>
          {[25, 50, 75, 100, 150].map(v => (
            <button key={v} onClick={() => setAmt(v)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${amt === v ? G : BORDER}`, background: amt === v ? `${G}22` : 'transparent', color: amt === v ? G : TEXTM, cursor: 'pointer', fontSize: 11 }}>+{v}</button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

function BadgeOverlay({ badge, onClose }) {
  if (!badge) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div style={{ textAlign: 'center', padding: 40, animation: 'bp 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle,${badge.color}44 0%,transparent 70%)`, border: `3px solid ${badge.color}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${badge.color}66` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: badge.color }}>workspace_premium</span>
        </div>
        <div style={{ color: G, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Badge Unlocked</div>
        <div style={{ color: GL, fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 600, marginBottom: 10 }}>{badge.name}</div>
        <div style={{ color: TEXTM, fontSize: 13, maxWidth: 280, margin: '0 auto 20px' }}>{badge.description}</div>
        <div style={{ color: TEXTD, fontSize: 11 }}>Tap to continue</div>
      </div>
      <style>{`@keyframes bp{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

function Toast({ message, visible }) {
  return (
    <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`, opacity: visible ? 1 : 0, transition: 'all 0.35s ease', zIndex: 300, background: 'linear-gradient(135deg,#1E1600,#2A1E00)', border: `1px solid ${G}`, color: GL, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 99, boxShadow: `0 4px 24px rgba(201,168,76,0.35)`, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{message}</div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Leaderboard() {
  const navigate = useNavigate()
  const { session, addXP, completeStep, update } = useGuestSession()
  const loggedRef = useRef(false)
  const sharedLoadRef = useRef(false)

  useEffect(() => {
    if (loggedRef.current) return
    loggedRef.current = true
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          eventLog: [...existingLog, { type: 'SMOKECRAFT_LEADERBOARD_VIEWED', timestamp: Date.now() }].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshot = getLeaderboardSnapshot(session)
  const storageMode = getSmokeSharedStorageMode()

  useEffect(() => {
    if (sharedLoadRef.current) return
    sharedLoadRef.current = true
    saveSmokeLeaderboardEntry(session, snapshot.currentPlayer)
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          eventLog: [...existingLog, { type: 'SMOKECRAFT_LEADERBOARD_SHARED_LOAD_ATTEMPTED', timestamp: Date.now() }].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [board,    setBoard]    = useState([])
  const [activity, setActivity] = useState([])
  const [muted,    setMuted]    = useState(false)
  const [mounted,  setMounted]  = useState(false)
  const [animXp,   setAnimXp]   = useState(950)
  const [accepted, setAccepted] = useState(false)
  const [modal,    setModal]    = useState({ scan: false, info: false, member: null, activity: null, activityList: false, tier: null, admin: false })
  const [toast,    setToast]    = useState({ visible: false, message: '' })
  const [badge,    setBadge]    = useState(null)

  const userRowRef = useRef(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
    getLeaderboard()
      .then(b => { setBoard(b); const me = b.find(u => u.isCurrentUser); if (me) setAnimXp(me.xp) })
      .catch(() => {})
    getRecentRankingActivity()
      .then(entries => setActivity(entries))
      .catch(() => {})
  }, [])

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast({ visible: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3200)
  }

  async function handleScan(payload) {
    const res = await processRankingScan(payload)
    setBoard(res.leaderboard)
    setActivity(prev => [res.activityEntry, ...prev])
    const me = res.leaderboard.find(u => u.isCurrentUser)
    if (me) setAnimXp(me.xp)
    if (res.badgeUnlocked) { snd.badge(muted); setBadge(res.badgeUnlocked) } else snd.xp(muted)
    showToast(res.toast)
    return res
  }

  async function handleAdminAddXp(amount) {
    await handleScan({ sourceType: 'session', sourceId: 'admin-add', xpValue: amount, venueId: 'grand-lounge', issuedBy: 'admin', signature: 'admin' })
    haptic.success()
  }

  function handleMyRank() {
    haptic.tap(); snd.tap(muted)
    userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    userRowRef.current?.animate([{ boxShadow: `0 0 0 3px ${G}` }, { boxShadow: `0 0 0 0px ${G}00` }], { duration: 1400, easing: 'ease-out' })
  }

  function handleContinue() {
    if (accepted) return
    setAccepted(true); haptic.success()
    addXP(25); completeStep('leaderboard')
    setTimeout(() => navigate('/smokecraft/golden-box/status'), 400)
  }

  function handleActivityListSelect(item) {
    haptic.tap()
    setModal(m => ({ ...m, activityList: false, activity: item }))
  }

  const me   = board.find(u => u.isCurrentUser)
  const top3 = board.slice(0, 3)
  const rest  = board.slice(3)

  return (
    <div className="smokecraft-premium-page" style={{ background: BG, color: TEXT, fontFamily: 'system-ui,sans-serif' }}>
      <RewardsAtmosphere />

      <style>{`
        @media (max-width: 720px) {
          .smokecraft-ranking-header { min-height: 56px !important; padding: 0 10px !important; gap: 8px; flex-wrap: nowrap !important; overflow-x: auto; scrollbar-width: none; }
          .smokecraft-ranking-header::-webkit-scrollbar { display: none; }
          .smokecraft-ranking-actions { gap: 5px !important; flex-shrink: 0; }
          .smokecraft-ranking-action-label { display: none; }
        }
        @media (max-width: 520px) {
          .smokecraft-ranking-podium { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── fixed header ── */}
      <header className="smokecraft-ranking-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'linear-gradient(180deg,rgba(8,5,2,0.96),rgba(8,5,2,0.88))', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDERHI}`, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexWrap: 'wrap', boxShadow: '0 8px 30px rgba(0,0,0,0.34)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={() => { haptic.tap(); navigate('/smokecraft') }} style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${G}66`, background: 'radial-gradient(circle,rgba(201,168,76,0.18),rgba(5,3,2,0.8))', color: G, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px rgba(201,168,76,0.2)` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <div style={{ fontSize: 8, color: G, letterSpacing: '0.2em', textTransform: 'uppercase' }}>SmokeCraft Rewards</div>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, color: GL, fontWeight: 800, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>CraftHub 360</div>
          </div>
        </div>
        <div className="smokecraft-ranking-actions" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button onClick={() => { haptic.tap(); snd.tap(muted); setModal(m => ({ ...m, info: true })) }}
            style={{ minHeight: 38, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 11px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.045)', color: TEXTM, cursor: 'pointer', fontSize: 11 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>info</span><span className="smokecraft-ranking-action-label">About</span>
          </button>
          <button onClick={handleMyRank}
            style={{ minHeight: 38, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 11px', borderRadius: 10, border: `1px solid ${G}66`, background: `${G}1f`, color: G, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span><span className="smokecraft-ranking-action-label">My Rank</span>
          </button>
          <button onClick={() => { haptic.tap(); snd.tap(muted); setModal(m => ({ ...m, scan: true })) }}
            style={{ minHeight: 38, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 11px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.045)', color: TEXTM, cursor: 'pointer', fontSize: 11 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>qr_code</span><span className="smokecraft-ranking-action-label">Scan QR</span>
          </button>
          <button onClick={() => setMuted(m => !m)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.045)', color: muted ? TEXTD : TEXTM, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{muted ? 'volume_off' : 'volume_up'}</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button onClick={() => { haptic.tap(); navigate('/grand-lounge-ranking') }} style={{ minHeight: 38, padding: '8px 13px', borderRadius: 99, border: `1px solid ${G}55`, background: 'linear-gradient(135deg,rgba(201,168,76,0.18),rgba(201,168,76,0.06))', color: GL, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>Grand Lounge</button>
          <button onClick={() => me && setModal(m => ({ ...m, member: me }))} style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${G}88`, background: 'linear-gradient(135deg,#3A2B0A,#120C04)', color: GL, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px rgba(201,168,76,0.24)`, overflow: 'hidden' }}>
            <span style={{ fontFamily: '"Playfair Display",serif', fontWeight: 800, fontSize: 13 }}>JC</span>
          </button>
        </div>
      </header>

      {/* ── fixed ticker ── */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99 }}>
        <TicketTicker craft="all" muted={muted} />
      </div>

      {/* ── main content — 2-column grid ── */}
      <main className="smokecraft-ranking-main" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 148 }}>
        {/* ── Your SmokeCraft Session — real session data, separate from the demo board below ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto 18px', padding: '0 16px' }}>
          <div style={{ borderRadius: 16, border: `1px solid ${BORDERHI}`, background: 'linear-gradient(160deg,rgba(201,168,76,0.08),rgba(8,5,2,0.7))', padding: '18px 20px' }}>
            <div style={{ fontSize: 10, color: G, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>Your SmokeCraft Session (Real Data)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: TEXTM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>XP / Rank</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: snapshot.currentPlayer.rankColor }}>{snapshot.currentPlayer.xp} · {snapshot.currentPlayer.rank}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: TEXTM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protocol Steps</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: GL }}>{snapshot.currentPlayer.completedSteps} / 17</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: TEXTM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Final Score</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: GL }}>{snapshot.currentPlayer.finalScore}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: TEXTM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: GL }}>{snapshot.currentPlayer.challengeStatus}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: TEXTM, marginBottom: 4 }}>
              {snapshot.currentPlayer.earnedWinnerCategories.length > 0 ? (
                <span>Winner categories earned: {snapshot.currentPlayer.earnedWinnerCategories.join(', ')}</span>
              ) : (
                <span>Winner categories: Not Yet Earned — Pending Real Scoring Data</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: TEXTD }}>{snapshot.communityMessage}</div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: TEXTM, lineHeight: 1.6 }}>
              <div>Ranking scope: <strong style={{ color: TEXT }}>{storageMode.backendConnected ? 'Shared community' : 'Local/session only'}</strong></div>
              <div>Backend status: <strong style={{ color: TEXT }}>{storageMode.backendConnected ? 'Connected' : 'Not connected'}</strong></div>
              <div>Community leaderboard below: <strong style={{ color: TEXT }}>Demo / illustrative — not live shared data</strong></div>
            </div>
            <button onClick={() => navigate('/smokecraft/event-challenge')}
              style={{ marginTop: 12, minHeight: 38, padding: '8px 14px', borderRadius: 10, border: `1px solid ${G}66`, background: `${G}1f`, color: G, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              View Event Challenge
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 14,
          maxWidth: 1100,
          margin: '0 auto',
          alignItems: 'start',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ padding: '16px 4px 16px 16px' }}>

            {/* hero */}
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', marginBottom: 16, minHeight: 220, border: `1px solid ${BORDERHI}`, boxShadow: '0 18px 46px rgba(0,0,0,0.48), 0 0 42px rgba(201,168,76,0.18)' }}>
              <img src="/assets/smokecraft/cropped/golden-box-hero.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', filter: 'brightness(0.38) saturate(1.2) contrast(1.16)' }} onError={e => e.target.style.display = 'none'} />
              <img src="/assets/smokecraft/cropped/scorecard-bg.jpg" alt="" style={{ position: 'absolute', right: -26, top: -44, width: '54%', height: '125%', objectFit: 'cover', opacity: 0.62, filter: 'brightness(0.8) saturate(1.16)', borderRadius: 22 }} onError={e => e.target.style.display = 'none'} />
              <div style={{ position: 'absolute', right: '12%', top: 0, width: 2, height: '100%', background: 'linear-gradient(180deg,transparent,rgba(232,213,163,0.6),transparent)', filter: 'blur(1px)', boxShadow: `0 0 40px ${G}` }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 76% 16%,rgba(232,213,163,0.28),transparent 24%), radial-gradient(circle at 70% 54%,rgba(201,118,34,0.18),transparent 36%), linear-gradient(120deg,rgba(5,3,2,0.94) 0%,rgba(12,8,5,0.72) 54%,rgba(5,3,2,0.3) 100%)' }} />
              <div style={{ position: 'relative', padding: '28px 22px 24px' }}>
                <div style={{ fontSize: 8, color: `${G}99`, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 10 }}>SmokeCraft 360</div>
                <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, margin: '0 0 10px', lineHeight: 1.15 }}>
                  Tonight's <span style={{ color: G, fontStyle: 'italic' }}>Ranking</span>
                </h1>
                <p style={{ color: TEXTM, fontSize: 12, margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
                  Ranked by SmokeCraft XP earned across all sessions. You enter the Grand Lounge as a ranked member of this cigar society.
                </p>
              </div>
            </div>

            {/* top 3 podium */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 8, color: TEXTD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Top Ranked Tonight</div>
              <div className="smokecraft-ranking-podium" style={{ display: 'grid', gridTemplateColumns: '1fr 1.12fr 1fr', gap: 8 }}>
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((m) => {
                  const r = m.rank, isC = r === 1
                  return (
                    <div key={m.id} onClick={() => { haptic.tap(); snd.tap(muted); setModal(mo => ({ ...mo, member: m })) }}
                      style={{ padding: isC ? '18px 10px 14px' : '14px 8px 12px', borderRadius: 12, border: `1.5px solid ${MEDAL[r]}77`, background: isC ? `radial-gradient(circle at 50% 0%,${MEDAL[r]}38,transparent 42%), linear-gradient(180deg,rgba(201,168,76,0.22) 0%,rgba(14,9,5,0.92) 100%)` : `linear-gradient(180deg,${MEDAL[r]}1f 0%,rgba(12,8,5,0.9) 100%)`, textAlign: 'center', cursor: 'pointer', boxShadow: isC ? `0 6px 28px ${MEDAL[1]}38, inset 0 1px 0 rgba(255,255,255,0.08)` : `0 0 18px ${MEDAL[r]}18`, position: 'relative', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)', transition: `all 0.5s ease ${isC ? '0.1s' : '0.2s'}` }}>
                      {isC && <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: G, boxShadow: `0 0 6px ${G}` }} />}
                      <MedalIcon rank={r} size={isC ? 32 : 26} />
                      <div style={{ margin: '8px auto 6px' }}>
                        <Avatar initials={m.initials} hue={m.hue} size={isC ? 48 : 38} isUser={m.isCurrentUser} />
                      </div>
                      <div style={{ color: TEXT, fontWeight: 600, fontSize: isC ? 12 : 10, marginBottom: 4, lineHeight: 1.3, wordBreak: 'break-word' }}>{m.name}</div>
                      <TierPill tier={m.tier} small />
                      <div style={{ marginTop: 8 }}>
                        <XpBar pct={m.progressPercent} color={MEDAL[r]} />
                        <div style={{ color: MEDAL[r], fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: isC ? 16 : 13, marginTop: 5 }}>
                          {m.xp.toLocaleString()} <span style={{ fontSize: 9, opacity: 0.7 }}>XP</span>
                        </div>
                        <div style={{ color: TEXTD, fontSize: 9, marginTop: 2 }}>{m.progressPercent}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* leaderboard rows 4–10 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {rest.map((m, i) => {
                const isUser = m.isCurrentUser
                return (
                  <div key={m.id} ref={isUser ? userRowRef : null}
                    onClick={() => { haptic.tap(); snd.tap(muted); setModal(mo => ({ ...mo, member: m })) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, minHeight: 60, cursor: 'pointer', border: isUser ? `1.5px solid ${G}88` : `1px solid rgba(201,168,76,0.24)`, background: isUser ? `linear-gradient(90deg,rgba(201,168,76,0.28) 0%,rgba(201,168,76,0.1) 100%)` : 'rgba(12,9,6,0.82)', boxShadow: isUser ? `0 0 24px rgba(201,168,76,0.28), inset 0 1px 0 rgba(255,255,255,0.08)` : '0 8px 22px rgba(0,0,0,0.16)', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateX(-6px)', transition: `all 0.45s ease ${i * 35}ms` }}>
                    <div style={{ width: 24, textAlign: 'center', flexShrink: 0, color: TEXTD, fontSize: 12, fontWeight: 700 }}>{m.rank}</div>
                    <Avatar initials={m.initials} hue={m.hue} size={36} isUser={isUser} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ color: isUser ? GL : TEXT, fontWeight: isUser ? 600 : 400, fontSize: 13, fontFamily: isUser ? '"Playfair Display",serif' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        {isUser && <span style={{ fontSize: 8, fontWeight: 700, color: '#1A1200', background: G, padding: '2px 6px', borderRadius: 99, letterSpacing: '0.1em', flexShrink: 0 }}>YOU</span>}
                        <TierPill tier={m.tier} small />
                      </div>
                      <XpBar pct={m.progressPercent} color={isUser ? G : GD} h={2} />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                      <div style={{ color: isUser ? G : TEXT, fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 14 }}>{m.xp.toLocaleString()}</div>
                      <div style={{ color: TEXTD, fontSize: 9, letterSpacing: '0.08em' }}>XP</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: TEXTD, flexShrink: 0 }}>chevron_right</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ padding: '16px 16px 16px 4px' }}>

            {/* user position card */}
            {me && (
              <div onClick={() => { haptic.tap(); setModal(m => ({ ...m, member: me })) }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 13, border: `1.5px solid ${G}70`, background: `radial-gradient(circle at 12% 50%,rgba(232,213,163,0.18),transparent 36%), linear-gradient(135deg,rgba(201,168,76,0.2) 0%,rgba(18,12,6,0.86) 100%)`, marginBottom: 14, cursor: 'pointer', boxShadow: `0 0 26px rgba(201,168,76,0.22), inset 0 1px 0 rgba(255,255,255,0.08)`, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(8px)', transition: 'all 0.6s ease' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${G},#A07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#1A1200', fontWeight: 800, fontFamily: '"Playfair Display",serif', fontSize: 20 }}>{me.rank}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: `${G}88`, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Your Position</div>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, color: TEXT }}>
                    {me.rank === 1 ? '1st' : me.rank === 2 ? '2nd' : me.rank === 3 ? '3rd' : `${me.rank}th`} in the Grand Lounge
                  </div>
                </div>
                <TierPill tier={me.tier} />
              </div>
            )}

            {/* recent activity */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, color: TEXT }}>Your Recent Activity</div>
                <button onClick={() => { haptic.tap(); setModal(m => ({ ...m, activityList: true })) }} style={{ minHeight: 34, color: G, fontSize: 11, background: `${G}10`, border: `1px solid ${G}26`, borderRadius: 999, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activity.slice(0, 5).map(item => (
                  <div key={item.id} onClick={() => { haptic.tap(); setModal(m => ({ ...m, activity: item })) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1px solid rgba(201,168,76,0.24)`, background: 'rgba(12,9,6,0.84)', cursor: 'pointer', minHeight: 52, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${G}18`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: G }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: TEXT, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ color: TEXTD, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: G, fontWeight: 700, fontSize: 12 }}>+{item.xp} XP</div>
                      <div style={{ color: TEXTD, fontSize: 9 }}>{item.ago}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: TEXTD, flexShrink: 0 }}>chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* profile rank card */}
            <div style={{ position: 'relative', padding: '16px 18px', borderRadius: 16, border: `1px solid ${G}66`, background: `radial-gradient(circle at 86% 18%,rgba(232,213,163,0.2),transparent 34%), linear-gradient(135deg,rgba(201,168,76,0.15) 0%,rgba(12,8,5,0.91) 100%)`, marginBottom: 14, boxShadow: '0 0 34px rgba(201,168,76,0.22), inset 0 1px 0 rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div aria-hidden="true" style={{ position: 'absolute', right: -18, top: -26, width: 118, height: 118, borderRadius: '50%', border: `1px solid ${G}40`, background: 'radial-gradient(circle,rgba(201,168,76,0.2),transparent 66%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: G, fontSize: 54, opacity: 0.38 }}>workspace_premium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg,${G},#A07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1A1200', fontFamily: '"Playfair Display",serif', fontSize: 18, border: `2px solid ${G}`, flexShrink: 0 }}>JC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: TEXT, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>John M Collins</div>
                  <div style={{ color: TEXTD, fontSize: 11 }}>Aficionado Member · #1206</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <XpBar pct={Math.round((animXp / 2000) * 100)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ color: TEXTD, fontSize: 10 }}>{animXp.toLocaleString()} / 2,000 XP</span>
                  <span style={{ color: TEXTD, fontSize: 10 }}>{Math.round((animXp / 2000) * 100)}% to next tier</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => haptic.tap()} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span> Edit Profile
                </button>
                <button onClick={() => { haptic.tap(); navigate('/passport/profile') }} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${G}55`, background: `${G}18`, color: G, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span> View Profile
                </button>
              </div>
            </div>

            {/* rank up tier section */}
            <div style={{ padding: '14px 16px', borderRadius: 13, border: `1px solid ${BORDER}`, background: CARD }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, color: TEXT, marginBottom: 2 }}>Rank Up. Earn Recognition.</div>
                  <div style={{ color: TEXTD, fontSize: 10, lineHeight: 1.4 }}>The higher you rank, the deeper your access and experience.</div>
                </div>
                <button onClick={() => { haptic.tap(); setModal(m => ({ ...m, info: true })) }} style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: TEXTM, cursor: 'pointer', fontSize: 10, whiteSpace: 'nowrap' }}>How Rankings Work</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {RANKING_DATA.tiers.map((t, i) => (
                  <div key={t.id} onClick={() => { haptic.tap(); setModal(m => ({ ...m, tier: t })) }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${t.color}66`, background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${t.color}22` }}>
                      <span style={{ color: t.color, fontFamily: '"Playfair Display",serif', fontWeight: 700, fontSize: 14 }}>{ROMAN[i]}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: t.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.name}</div>
                      <div style={{ color: TEXTD, fontSize: 8 }}>{t.minXp === 0 ? '0' : `${(t.minXp / 1000).toFixed(0)}K`}–{t.maxXp ? `${(t.maxXp / 1000).toFixed(1)}K` : '∞'} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* golden box CTA */}
            <button onClick={handleContinue} disabled={accepted}
              style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', background: accepted ? GD : `linear-gradient(135deg,${G} 0%,#A07830 100%)`, color: '#1A1200', fontWeight: 700, fontFamily: '"Playfair Display",serif', fontSize: 15, cursor: accepted ? 'not-allowed' : 'pointer', boxShadow: accepted ? 'none' : `0 4px 20px rgba(201,168,76,0.3)`, transition: 'all 0.3s', marginTop: 12 }}>
              {accepted ? 'Proceeding…' : 'Claim Your Golden Box  +25 XP →'}
            </button>
          </div>
        </div>
      </main>

      <SmokeCraftBottomNav active="rewards" />

      {/* ── floating admin ── */}
      <button onClick={() => { haptic.tap(); setModal(m => ({ ...m, admin: true })) }}
        style={{ position: 'fixed', bottom: 86, right: 14, zIndex: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 11, background: `rgba(201,168,76,0.14)`, border: `1px solid ${G}44`, color: G, cursor: 'pointer' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
        <span style={{ fontSize: 8, letterSpacing: '0.05em', marginTop: 1 }}>Admin</span>
      </button>

      {/* ── modals ── */}
      <ScanModal    open={modal.scan}        onClose={() => setModal(m => ({ ...m, scan: false }))}    onScan={handleScan} muted={muted} />
      <RankingInfoModal open={modal.info}    onClose={() => setModal(m => ({ ...m, info: false }))} />
      <MemberModal  open={!!modal.member}    onClose={() => setModal(m => ({ ...m, member: null }))}   member={modal.member} />
      <ActivityModal open={!!modal.activity} onClose={() => setModal(m => ({ ...m, activity: null }))} item={modal.activity} />
      <ActivityListModal open={modal.activityList} onClose={() => setModal(m => ({ ...m, activityList: false }))} activity={activity} onSelect={handleActivityListSelect} />
      <TierModal    open={!!modal.tier}      onClose={() => setModal(m => ({ ...m, tier: null }))}     tier={modal.tier} />
      <AdminPanel   open={modal.admin}       onClose={() => setModal(m => ({ ...m, admin: false }))}   onAddXp={handleAdminAddXp} />

      <BadgeOverlay badge={badge} onClose={() => { haptic.tap(); setBadge(null) }} />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
