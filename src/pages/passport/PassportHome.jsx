import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '../../utils/haptics.js'
import { playStampSound, playSuccessTone } from '../../utils/sound.js'
import {
  scanPassportSource, claimStamp, verifyConnection as apiVerify,
  checkInToVenue, checkInToEvent, redeemBenefit
} from '../../api/passportScanApi.js'
import { getUpcomingEvents, rsvpToEvent } from '../../api/passportHomeApi.js'
import { STAMPS } from '../../data/stamps.js'
import { RECENT_ACTIVITY } from '../../data/recentActivity.js'
import { PASSPORT_PROFILE } from '../../data/passportProfile.js'
import { ALL_PAYLOADS } from '../../utils/qrPayloads.js'

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  cover:    '#0B1E30',
  coverMid: '#102B46',
  page:     '#F5EDD8',
  pageAlt:  '#EDE0C4',
  gold:     '#C9992A',
  goldLight:'#E4BC55',
  goldDark: '#8B6914',
  navy:     '#102B46',
  ink:      '#1A1208',
  brown:    '#6B4E1A',
  green:    '#2D5238',
  burgundy: '#6B1E1E',
  steel:    '#C8CFDA',
  mrz:      '#E8E4DC',
  border:   'rgba(201,153,42,0.5)',
  borderSt: 'rgba(201,153,42,0.75)',
}
const SERIF = '"Playfair Display",Georgia,serif'
const MONO  = '"JetBrains Mono","Courier New",monospace'
const SANS  = '"Hanken Grotesk",system-ui,sans-serif'
const OCR   = '"JetBrains Mono","Courier New",monospace'
const FILL1 = { fontVariationSettings:"'FILL' 1" }

/* ─── QR grid ────────────────────────────────────────────────── */
function QrGraphic({ size = 48 }) {
  const s = size / 7
  const pat = [[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
               [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pat.map((row,ri) => row.map((v,ci) => v
        ? <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1} fill={C.navy} opacity={0.8}/>
        : null))}
    </svg>
  )
}

/* ─── Passport emblem / globe SVG ────────────────────────────── */
function PassportEmblem({ size = 90, color = C.goldLight, opacity = 1 }) {
  const cx = size / 2, r = cx - 6
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={1.4}/>
      <circle cx={cx} cy={cx} r={r - 8} fill="none" stroke={color} strokeWidth={0.5} opacity={0.6}/>
      <ellipse cx={cx} cy={cx} rx={r * 0.52} ry={r} fill="none" stroke={color} strokeWidth={0.8}/>
      <ellipse cx={cx} cy={cx} rx={r * 0.85} ry={r * 0.45} fill="none" stroke={color} strokeWidth={0.8}/>
      {[-50,-25,0,25,50].map(deg => (
        <line key={deg} x1={cx - r} y1={cx + (deg/90)*r} x2={cx + r} y2={cx + (deg/90)*r}
          stroke={color} strokeWidth={0.4} opacity={0.5}/>
      ))}
      {[...Array(8)].map((_,i) => {
        const a = (i * 45) * Math.PI/180
        const x1 = cx + Math.cos(a) * 10, y1 = cx + Math.sin(a) * 10
        const x2 = cx + Math.cos(a) * (r - 10), y2 = cx + Math.sin(a) * (r - 10)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.6} opacity={0.6}/>
      })}
      <circle cx={cx} cy={cx} r={9} fill="none" stroke={color} strokeWidth={0.8}/>
      <text x={cx} y={cx + 4} textAnchor="middle" fontFamily={MONO} fontSize={size * 0.1} fontWeight={700} fill={color}>360</text>
    </svg>
  )
}

/* ─── Guilloche SVG band ─────────────────────────────────────── */
function Guilloche({ w = 400, h = 40, color = C.gold, op = 0.12 }) {
  const lines = []
  for (let i = 0; i <= h; i += 5) {
    const amp = 4 + (i % 10) * 0.5
    const freq = 0.022 + i * 0.0003
    let d = `M 0,${i}`
    for (let x = 0; x <= w; x += 3) { d += ` L ${x},${i + amp * Math.sin(x * freq)}` }
    lines.push(<path key={i} d={d} fill="none" stroke={color} strokeWidth={0.35} opacity={0.9}/>)
  }
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice"
      style={{ opacity: op, display:'block', pointerEvents:'none' }}>{lines}</svg>
  )
}

/* ─── Page ruling lines ──────────────────────────────────────── */
function PageLines({ rows = 14, color = C.gold, op = 0.09 }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {[...Array(rows)].map((_,i) => (
        <div key={i} style={{ position:'absolute', left:0, right:0,
          top: `${(i + 1) * (100 / (rows + 1))}%`,
          height:1, background:color, opacity: op }}/>
      ))}
    </div>
  )
}

/* ─── Folio number ───────────────────────────────────────────── */
function Folio({ n, side = 'left' }) {
  return (
    <div style={{ fontFamily:MONO, fontSize:8, color:`${C.brown}70`, letterSpacing:'0.1em',
      position:'absolute', bottom:6, [side]:10 }}>{n}</div>
  )
}

/* ─── MRZ strip ──────────────────────────────────────────────── */
function MRZStrip({ name = 'COLLINS<<JOHN<M', id = 'P360A2501' }) {
  const pad = (s, n) => s.padEnd(n, '<').slice(0, n)
  const line1 = `P<USA${pad(name, 39)}`
  const line2 = `${pad(id, 9)}0USA9512016M3112315<<<<<<<<<<<<<<<6`
  return (
    <div style={{ background:C.mrz, borderRadius:'0 0 10px 10px', padding:'8px 12px 10px',
      borderTop:`1px solid rgba(0,0,0,0.1)`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0 }}>
        <Guilloche h={28} color={C.navy} op={0.04}/>
      </div>
      <div style={{ fontFamily:OCR, fontSize:8.5, color:C.ink, letterSpacing:'0.08em',
        lineHeight:1.65, wordBreak:'break-all', position:'relative', zIndex:2 }}>
        <div>{line1}</div>
        <div>{line2}</div>
      </div>
      <div style={{ fontFamily:MONO, fontSize:6.5, color:`${C.brown}60`, marginTop:4,
        letterSpacing:'0.16em', textTransform:'uppercase' }}>MACHINE READABLE ZONE</div>
    </div>
  )
}

/* ─── Official seal stamp ────────────────────────────────────── */
function OfficialSeal({ size = 70, color = C.gold, op = 1, label = 'VERIFIED' }) {
  const cx = size / 2, r1 = cx - 3, r2 = cx - 11
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: op }}>
      <circle cx={cx} cy={cx} r={r1} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="3 2"/>
      <circle cx={cx} cy={cx} r={r2} fill="none" stroke={color} strokeWidth={0.7}/>
      {[...Array(12)].map((_,i) => {
        const a = (i / 12) * Math.PI * 2
        return <line key={i} x1={cx + Math.cos(a) * 6} y1={cx + Math.sin(a) * 6}
          x2={cx + Math.cos(a) * (r2 - 3)} y2={cx + Math.sin(a) * (r2 - 3)}
          stroke={color} strokeWidth={0.5} opacity={0.7}/>
      })}
      <text x={cx} y={cx + 3} textAnchor="middle" fontFamily={MONO} fontSize={size * 0.12}
        fontWeight={700} fill={color}>{label}</text>
    </svg>
  )
}

/* ─── Press handler ──────────────────────────────────────────── */
function PressBox({ onClick, children, style = {} }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={() => setPr(true)} onTouchEnd={() => setPr(false)}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)} onMouseLeave={() => setPr(false)}
      style={{ transform: pr ? 'scale(0.97)' : 'scale(1)',
        boxShadow: pr ? 'inset 0 2px 8px rgba(0,0,0,0.15)' : undefined,
        transition: 'transform .1s, box-shadow .1s', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

/* ─── Gold button ────────────────────────────────────────────── */
function GBtn({ children, onClick, outline = false, full = false, sm = false, dark = false, style = {} }) {
  const [pr, setPr] = useState(false)
  const bg = outline ? 'transparent' : dark ? C.cover : pr ? C.goldDark : C.gold
  const fg = outline ? (dark ? C.goldLight : C.gold) : '#fff'
  return (
    <button onClick={onClick}
      onTouchStart={() => setPr(true)} onTouchEnd={() => setPr(false)}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)} onMouseLeave={() => setPr(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width: full ? '100%' : 'auto', padding: sm ? '0 14px' : '0 20px',
        height: sm ? 40 : 48, borderRadius: 9,
        border: outline ? `1.5px solid ${dark ? C.goldLight : C.gold}` : 'none',
        background: bg, color: fg,
        fontFamily: SANS, fontWeight: 700, fontSize: sm ? 11 : 13, cursor: 'pointer',
        transform: pr ? 'scale(0.96)' : 'scale(1)', transition: 'all .12s',
        boxShadow: outline ? 'none' : `0 3px 12px rgba(201,153,42,0.3)`, ...style }}>
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════════ */
function ModalShell({ onClose, children }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(11,30,48,0.7)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'18px 18px 0 0', background:C.page,
          borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(11,30,48,0.25)',
          maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none',
          padding:'14px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:C.border }}/>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function CenterModal({ onClose, children, maxW = 360 }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(11,30,48,0.7)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:maxW, borderRadius:16,
          background:C.page, border:`2px solid ${C.gold}`,
          boxShadow:'0 24px 60px rgba(11,30,48,0.35)', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {children}
      </motion.div>
    </div>
  )
}

function ResultHead({ icon, iconColor, badge, title }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:14 }}>
      <div style={{ width:56, height:56, borderRadius:'50%', background:`${iconColor}12`,
        border:`1.5px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <span className="material-symbols-outlined" style={{ fontSize:28, color:iconColor, ...FILL1 }}>{icon}</span>
      </div>
      {badge && <span style={{ fontFamily:MONO, fontSize:8, color:iconColor, background:`${iconColor}10`,
        border:`1px solid ${iconColor}25`, padding:'2px 10px', borderRadius:99, marginBottom:6, letterSpacing:'0.12em' }}>{badge}</span>}
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy, textAlign:'center' }}>{title}</p>
    </div>
  )
}
function FactBox({ children }) {
  return <div style={{ background:C.pageAlt, borderRadius:10, padding:'10px 14px', border:`1px solid ${C.border}` }}>{children}</div>
}
function FactRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontFamily:MONO, fontSize:9, color:C.brown, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:12.5, fontWeight:600, color:color || C.ink }}>{value}</span>
    </div>
  )
}

/* ── Scan Modal ───────────────────────────────────────────────── */
function ScanModal({ muted, onClose, onResult }) {
  const [state, setState] = useState('idle')
  const SIMS = [
    { type:'venue',   icon:'store',             label:'Simulate Venue' },
    { type:'event',   icon:'event',             label:'Simulate Event' },
    { type:'member',  icon:'person',            label:'Simulate Member' },
    { type:'stamp',   icon:'workspace_premium', label:'Simulate Stamp' },
    { type:'benefit', icon:'redeem',            label:'Simulate Benefit' },
  ]
  async function simulate(type) {
    setState('scanning'); triggerHaptic('medium')
    const res = await scanPassportSource(ALL_PAYLOADS[type])
    setState('idle')
    if (!muted) playSuccessTone()
    triggerHaptic('success')
    onClose(); onResult(res)
  }
  return (
    <ModalShell onClose={onClose}>
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.navy, textAlign:'center', marginBottom:4 }}>Scan Passport</p>
      <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, lineHeight:1.55, textAlign:'center', marginBottom:16 }}>
        Point at any 360 Passport QR or NFC credential to verify.
      </p>
      <div style={{ width:160, height:160, margin:'0 auto 18px', borderRadius:12,
        background:`${C.navy}08`, border:`2px solid ${C.border}`, position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
          <div key={i} style={{ position:'absolute', width:18, height:18,
            top:ry ? 'auto' : 8, bottom:ry ? 8 : 'auto',
            left:rx ? 'auto' : 8, right:rx ? 8 : 'auto',
            borderTop: ry ? 'none' : `2.5px solid ${C.gold}`,
            borderBottom: ry ? `2.5px solid ${C.gold}` : 'none',
            borderLeft: rx ? 'none' : `2.5px solid ${C.gold}`,
            borderRight: rx ? `2.5px solid ${C.gold}` : 'none' }}/>
        ))}
        {state === 'scanning' && (
          <div style={{ position:'absolute', left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,
            animation:'scanLine .9s ease-in-out infinite' }}>
            <style>{`@keyframes scanLine{0%{transform:translateY(-74px)}100%{transform:translateY(74px)}}`}</style>
          </div>
        )}
        <QrGraphic size={72}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
        {SIMS.map(s => (
          <button key={s.type} onClick={() => simulate(s.type)} disabled={state === 'scanning'}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9,
              border:`1px solid ${C.border}`, background:`${C.gold}08`, cursor:'pointer',
              fontFamily:SANS, fontWeight:600, fontSize:13, color:C.navy, textAlign:'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize:17, color:C.gold }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <GBtn full outline onClick={onClose}>Close</GBtn>
    </ModalShell>
  )
}

/* ── Scan Result Modal ────────────────────────────────────────── */
function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  if (!result) return null
  const { sourceType, data } = result
  if (!result.success || sourceType === 'invalid') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="error" iconColor={C.burgundy} badge="INVALID CODE" title="Invalid Passport Code"/>
      <FactBox><p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.6, textAlign:'center', padding:'4px 0 8px' }}>This code is not connected to 360 Passport Connections.</p></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType === 'venue') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="store" iconColor={C.navy} badge="CHECK-IN" title="Venue Check-In Verified"/>
      <FactBox><FactRow label="Venue" value={data.name}/><FactRow label="Location" value={`${data.city}, ${data.state}`}/><FactRow label="Stamps" value={`${data.availableStamps?.length} available`}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose() }}>Start Passport Session</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose(); onAction('events') }}>View Events</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType === 'event') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="event" iconColor={C.navy} badge="CHECK-IN" title="Event Check-In Verified"/>
      <FactBox><FactRow label="Event" value={data.name}/><FactRow label="Venue" value={data.venue}/><FactRow label="Stamp" value={data.stampName} color={C.green}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose() }}>Claim Event Stamp</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType === 'member') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="person" iconColor={C.green} badge="MATCH FOUND" title="Connection Found"/>
      <FactBox><FactRow label="Member" value={data.name}/><FactRow label="Role" value={`${data.role} @ ${data.company}`}/><FactRow label="Match Score" value={`${data.matchScore}%`} color={C.gold}/><FactRow label="Trust" value={data.trustStatus} color={C.green}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose() }}>Verify Connection</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType === 'stamp') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="workspace_premium" iconColor={C.brown} badge="AUTHENTICATED" title="Stamp Ready to Claim"/>
      <FactBox><FactRow label="Stamp" value={data.name}/><FactRow label="Category" value={data.category?.toUpperCase()}/><FactRow label="Status" value={data.authenticated ? 'Authenticated ✓' : 'Pending'} color={data.authenticated ? C.green : C.burgundy}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await claimStamp(data.id, 'current'); onShowOverlay('stamp'); onClose() }}>Claim Stamp</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType === 'benefit') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="redeem" iconColor={C.burgundy} badge="UNLOCKED" title="Benefit Unlocked"/>
      <FactBox><FactRow label="Benefit" value={data.name}/><FactRow label="Provider" value={data.provider}/><FactRow label="Expires" value={data.expiration}/></FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>{data.redemption}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await redeemBenefit(data.id); onShowOverlay('benefit'); onClose() }}>Redeem Benefit</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  return null
}

/* ── Stamp Overlay ────────────────────────────────────────────── */
function StampOverlay({ muted, onDone }) {
  const [step, setStep] = useState('updating')
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('done')
      if (!muted) { playStampSound(); playSuccessTone() }
      triggerHaptic('success')
    }, 1300)
    return () => clearTimeout(t)
  }, [muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(11,30,48,0.8)', backdropFilter:'blur(14px)' }}/>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:270, borderRadius:18, padding:'30px 22px 26px',
          background:C.page, border:`2.5px solid ${C.gold}`,
          boxShadow:'0 20px 60px rgba(11,30,48,0.4)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step === 'updating'
            ? <motion.div key="upd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  border:`3px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'spinGold 1.2s linear infinite' }}>
                  <style>{`@keyframes spinGold{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <span className="material-symbols-outlined" style={{ fontSize:30, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy }}>Updating Passport…</p>
              </motion.div>
            : <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
                  background:`${C.gold}14`, border:`2px solid ${C.gold}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:36, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:20, color:C.navy, marginBottom:4 }}>Passport Updated</p>
                <p style={{ fontFamily:MONO, fontSize:9, color:C.gold, letterSpacing:'0.14em', marginBottom:18 }}>AUTHENTICATED</p>
                <GBtn full onClick={onDone}>Continue</GBtn>
              </motion.div>}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ── Stamp Detail ─────────────────────────────────────────────── */
function StampDetailModal({ stamp, onClose }) {
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ background:C.pageAlt, borderRadius:'14px 14px 0 0', padding:'22px 18px 18px', borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`${stamp.color}12`,
          border:`2px solid ${stamp.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:32, color:stamp.color, ...FILL1 }}>{stamp.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.navy }}>{stamp.name}</p>
      </div>
      <div style={{ padding:'14px 18px 22px' }}>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.65, marginBottom:12 }}>{stamp.description}</p>
        <FactBox><FactRow label="Requirement" value={stamp.requirement}/><FactRow label="Status" value={stamp.earned ? 'Earned ✓' : 'Not yet earned'} color={stamp.earned ? C.green : C.burgundy}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

/* ── Event Detail ─────────────────────────────────────────────── */
function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  async function handleRsvp() { setLoading(true); triggerHaptic('success'); await rsvpToEvent(event.id); setRsvpd(true); setLoading(false); onRsvp(event.id) }
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ minWidth:50, textAlign:'center', background:C.navy, borderRadius:9, padding:'6px 8px', flexShrink:0 }}>
          <p style={{ fontFamily:MONO, fontSize:7, color:'rgba(255,255,255,0.5)' }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:'#fff', lineHeight:1 }}>{event.date?.split(' ')[1]}</p>
        </div>
        <div><p style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:C.navy }}>{event.name}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown }}>{event.venue} · {event.city} · {event.time}</p></div>
      </div>
      <FactBox><FactRow label="Attendees" value={`${event.attendeeCount}/${event.capacity}`}/><FactRow label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct > 85 ? C.burgundy : C.green}/></FactBox>
      <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
        {rsvpd
          ? <div style={{ padding:'10px', background:`${C.green}12`, border:`1px solid ${C.green}28`, borderRadius:9, textAlign:'center' }}>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:12.5, color:C.green }}>✓ RSVP Confirmed</p>
            </div>
          : <GBtn full onClick={handleRsvp}>{loading ? 'Confirming…' : 'RSVP Now'}</GBtn>}
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
}

/* ── Guide Modal ──────────────────────────────────────────────── */
const GUIDES = {
  1: { title:'Scan In', icon:'qr_code_scanner', body:'Enter a service or event using your QR passport. Tap Scan, point at any 360 Passport QR code, and your check-in is automatic.' },
  2: { title:'Build Profile', icon:'person_edit', body:'Share your story, interests, goals, and what matters. A richer profile means smarter matches and better introductions from the network.' },
  3: { title:'Meet People', icon:'hub', body:'Connect with verified members and better matches. The app surfaces people you should know based on shared events, goals, and industry overlap.' },
  4: { title:'Earn Stamps', icon:'workspace_premium', body:'Every verified interaction — venue check-in, connection, event — adds a passport stamp. Stamps unlock access, perks, and legacy.' },
}
function GuideModal({ step, onClose }) {
  const g = GUIDES[step] || GUIDES[1]
  return (
    <CenterModal onClose={onClose} maxW={310}>
      <div style={{ padding:'26px 20px 24px', textAlign:'center' }}>
        <div style={{ width:58, height:58, borderRadius:'50%', background:`${C.navy}0D`, border:`1.5px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:28, color:C.navy, ...FILL1 }}>{g.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy, marginBottom:10 }}>{g.title}</p>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.7, marginBottom:20 }}>{g.body}</p>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Got It</GBtn>
      </div>
    </CenterModal>
  )
}

/* ── Profile Modal ────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }) {
  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)
  return (
    <CenterModal onClose={onClose} maxW={360}>
      <div style={{ background:C.navy, borderRadius:'14px 14px 0 0', padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-20, top:-20, opacity:0.1 }}>
          <PassportEmblem size={160} color={C.goldLight}/>
        </div>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ width:66, height:66, borderRadius:'50%', background:`${C.gold}22`,
            border:`2.5px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.gold }}>{profile.initials}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:'#fff' }}>{profile.displayName}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{profile.role} @ {profile.company}</p>
          <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:8, color:C.gold,
            background:`${C.gold}18`, border:`1px solid ${C.gold}28`, padding:'2px 11px', borderRadius:99, letterSpacing:'0.12em' }}>
            {profile.tier?.toUpperCase()} MEMBER
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 18px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, textTransform:'uppercase' }}>Passport XP</span>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.gold }}>{profile.xp} / {profile.nextTierXp}</span>
          </div>
          <div style={{ height:5, borderRadius:3, background:C.pageAlt, border:`1px solid ${C.border}` }}>
            <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[{val:profile.verifiedConnections,label:'Connections'},{val:profile.stampsEarned,label:'Stamps'},{val:profile.eventsAttended,label:'Events'}].map(s => (
            <div key={s.label} style={{ textAlign:'center', background:C.pageAlt, borderRadius:8, padding:'9px 5px', border:`1px solid ${C.border}` }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy }}>{s.val}</p>
              <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, textTransform:'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <FactBox><FactRow label="Passport ID" value={profile.passportId}/><FactRow label="Member Since" value={profile.memberSince}/><FactRow label="Status" value={profile.status} color={C.green}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

/* ── Admin Panel ──────────────────────────────────────────────── */
function AdminPanel({ onClose }) {
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const ITEMS = [
    { label:'Edit venue data', icon:'store', action:() => setStatus('Edit src/data/venues.js') },
    { label:'Edit event data', icon:'event', action:() => setStatus('Edit src/api/passportHomeApi.js') },
    { label:'Edit member data', icon:'people', action:() => setStatus('Edit src/data/members.js') },
    { label:'Edit stamp data', icon:'workspace_premium', action:() => setStatus('Edit src/data/stamps.js') },
    { label:'Edit benefit data', icon:'redeem', action:() => setStatus('Edit src/data/benefits.js') },
  ]
  async function queueOpenAI() {
    const { requestOpenAIImageReplacement } = await import('../../api/passportScanApi.js')
    const res = await requestOpenAIImageReplacement('passport-hero', prompt || 'Professional passport dashboard hero')
    setStatus(res.message)
  }
  return (
    <CenterModal onClose={onClose} maxW={400}>
      <div style={{ background:C.pageAlt, borderRadius:'14px 14px 0 0', padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:9 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold, ...FILL1 }}>admin_panel_settings</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.navy }}>Admin Source Panel</p>
      </div>
      <div style={{ padding:'14px 18px 24px' }}>
        {ITEMS.map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:9, border:`1px solid ${C.border}`, background:C.pageAlt, cursor:'pointer',
              marginBottom:7, textAlign:'left', fontFamily:SANS, fontSize:12.5, color:C.ink }}
            onMouseEnter={e => e.currentTarget.style.background = `${C.gold}12`}
            onMouseLeave={e => e.currentTarget.style.background = C.pageAlt}>
            <span className="material-symbols-outlined" style={{ fontSize:15, color:C.gold }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:13, marginTop:6 }}>
          <p style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
          <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Image prompt…"
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`,
              background:'#fff', color:C.ink, fontFamily:SANS, fontSize:12, marginBottom:8, outline:'none', boxSizing:'border-box' }}/>
          <button onClick={queueOpenAI}
            style={{ width:'100%', padding:'10px', borderRadius:9, border:`1px solid ${C.gold}`, background:`${C.gold}0A`,
              fontFamily:SANS, fontWeight:700, fontSize:12, color:C.gold, cursor:'pointer', marginBottom:8 }}>
            Queue OpenAI Request
          </button>
          {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.green, marginBottom:8 }}>{status}</p>}
          <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}70`, lineHeight:1.5 }}>Real OpenAI image generation runs on the backend only.</p>
        </div>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose() }} style={{ marginTop:13 }}>Close</GBtn>
      </div>
    </CenterModal>
  )
}

/* ── Toast ────────────────────────────────────────────────────── */
function Toast({ msg, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
          style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:C.page, border:`1.5px solid ${C.gold}`, borderRadius:11, padding:'10px 18px',
            display:'flex', alignItems:'center', gap:9, boxShadow:'0 8px 28px rgba(11,30,48,0.2)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:15, color:C.gold, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:12.5, fontWeight:600, color:C.navy }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Bottom Nav ───────────────────────────────────────────────── */
function BottomNav({ onScan }) {
  const navigate = useNavigate()
  const NAV = [
    { id:'home',      icon:'home',         label:'Home',      route:'/passport' },
    { id:'directory', icon:'contact_page', label:'Directory', route:'/passport/directory' },
    { id:'scan',      scan:true },
    { id:'events',    icon:'event',        label:'Events',    route:'/passport/events' },
    { id:'benefits',  icon:'redeem',       label:'Benefits',  route:'/passport/benefits' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:640, margin:'0 auto',
        background:C.page, borderTop:`2px solid ${C.border}`,
        borderRadius:'16px 16px 0 0', boxShadow:'0 -4px 24px rgba(11,30,48,0.12)',
        paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'8px 6px 4px' }}>
          {NAV.map(item => {
            if (item.scan) return (
              <button key="scan" onClick={() => { triggerHaptic('medium'); onScan() }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onTouchEnd={e => e.currentTarget.style.transform = ''}
                style={{ width:54, height:54, borderRadius:'50%', border:'none', background:C.gold,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
                  boxShadow:`0 4px 18px rgba(201,153,42,0.4), 0 0 0 4px ${C.page}, 0 0 0 5.5px ${C.border}`,
                  transform:'translateY(-10px)', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:24, color:'#fff', ...FILL1 }}>qr_code_scanner</span>
              </button>
            )
            return (
              <button key={item.id} onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.87)'}
                onTouchEnd={e => e.currentTarget.style.transform = ''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:52, padding:'3px 0',
                  background:'none', border:'none', cursor:'pointer', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:22, color:`${C.navy}50` }}>{item.icon}</span>
                <span style={{ fontFamily:MONO, fontSize:8, letterSpacing:'0.05em', color:`${C.navy}50`, textTransform:'uppercase' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PASSPORT PAGE WRAPPER — reusable "passport page" container
══════════════════════════════════════════════════════════════ */
function PassportPage({ children, folio, style = {} }) {
  return (
    <div style={{ position:'relative', background:C.page, borderRadius:10,
      border:`1px solid rgba(0,0,0,0.12)`,
      boxShadow:'0 2px 10px rgba(11,30,48,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)',
      overflow:'hidden', ...style }}>
      <PageLines rows={16} color={C.gold} op={0.07}/>
      {folio && <Folio n={folio} side="left"/>}
      <div style={{ position:'relative', zIndex:2 }}>{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PassportHome() {
  const navigate = useNavigate()
  const [modal, setModal]           = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [selStamp, setSelStamp]     = useState(null)
  const [selEvent, setSelEvent]     = useState(null)
  const [overlayOn, setOverlayOn]   = useState(false)
  const [guideStep, setGuideStep]   = useState(null)
  const [muted, setMuted]           = useState(false)
  const [events, setEvents]         = useState([])
  const [rsvpdIds, setRsvpdIds]     = useState(new Set())
  const [toast, setToast]           = useState({ visible:false, msg:'' })
  const profile = PASSPORT_PROFILE

  useEffect(() => { getUpcomingEvents().then(setEvents) }, [])
  useEffect(() => {
    const h = e => { if (e.altKey && (e.key === 'a' || e.key === 'A')) { triggerHaptic('light'); setModal('admin') } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  function showToast(msg) { setToast({ visible:true, msg }); setTimeout(() => setToast(t => ({ ...t, visible:false })), 3000) }
  function closeModal() { triggerHaptic('light'); setModal(null) }
  function handleScanResult(result) { setScanResult(result); setModal('scan-result') }
  function handleOverlay(type) {
    setOverlayOn(true)
    const msgs = { stamp:'Stamp claimed.', verify:'Connection verified.', 'check-in':'Check-in confirmed.', benefit:'Benefit saved.' }
    setTimeout(() => showToast(msgs[type] || 'Passport updated.'), 1400)
  }
  function handleAction(action) {
    if (action === 'reopen-scan') { setModal('scan'); return }
    const routes = { events:'/passport/events', connections:'/passport/connections', stamps:'/passport/stamps', directory:'/passport/directory', benefits:'/passport/benefits' }
    if (routes[action]) navigate(routes[action])
  }

  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)

  /* ─── SECTION DATA ─────────────────────────────────────────── */
  const SECTIONS = [
    { icon:'contact_page', label:'Directory',   sub:'Verified members, brands & more', route:'/passport/directory',  color:C.green,   pg:'01' },
    { icon:'hub',          label:'Connections', sub:'Your network & conversations',    route:'/passport/connections', color:'#7B4F9E', pg:'02' },
    { icon:'event',        label:'Events',      sub:'Curated experiences & invites',   route:'/passport/events',      color:C.goldDark,pg:'03' },
    { icon:'redeem',       label:'Benefits',    sub:'Access perks & privileges',       route:'/passport/benefits',    color:C.burgundy,pg:'04' },
  ]
  const ACTIONS = [
    { icon:'qr_code_scanner', label:'Scan to Connect', sub:'Find events and venues nearby', color:C.gold,    action:() => { triggerHaptic('medium'); setModal('scan') } },
    { icon:'contact_page',    label:'Explore Directory',sub:'Discover verified members',     color:C.green,   action:() => { triggerHaptic('light'); navigate('/passport/directory') } },
    { icon:'hub',             label:'View Matches',    sub:'See your top connections',       color:'#7B4F9E', action:() => { triggerHaptic('light'); navigate('/passport/connections') } },
    { icon:'event',           label:'Join an Event',   sub:'RSVP & meet in person',          color:C.goldDark,action:() => { triggerHaptic('light'); navigate('/passport/events') } },
    { icon:'redeem',          label:'Explore Benefits',sub:'Unlock rewards & perks',          color:C.burgundy,action:() => { triggerHaptic('light'); navigate('/passport/benefits') } },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.cover, paddingBottom:112 }}>

      {/* ════════════════════════════════════════════════════════
          PASSPORT COVER
      ════════════════════════════════════════════════════════ */}
      <div style={{ background:`linear-gradient(175deg,${C.cover} 0%,#0d2438 100%)`,
        padding:'0 0 28px', position:'relative', overflow:'hidden' }}>
        {/* Embossed pattern */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.06 }}>
          <Guilloche h={280} color={C.goldLight} op={1}/>
        </div>
        {/* Large emblem watermark */}
        <div style={{ position:'absolute', right:-30, top:10, opacity:0.07, pointerEvents:'none' }}>
          <PassportEmblem size={220} color={C.goldLight}/>
        </div>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0', position:'relative', zIndex:3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:`${C.gold}18`,
              border:`1.5px solid ${C.gold}50`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:20, color:C.goldLight, ...FILL1 }}>book</span>
            </div>
            <div>
              <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.goldLight}80`, letterSpacing:'0.18em' }}>UNITED STATES OF AMERICA</p>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:13, color:C.goldLight, letterSpacing:'0.04em' }}>PASSPORT · 360 CONNECTIONS</p>
            </div>
          </div>
          <button onClick={() => { triggerHaptic('light'); setMuted(m => !m) }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99,
              border:`1px solid ${C.gold}40`, background: muted ? `${C.burgundy}20` : `${C.gold}12`,
              cursor:'pointer', fontFamily:MONO, fontSize:8.5, color: muted ? '#e88' : C.goldLight }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color: muted ? '#e88' : C.gold, ...FILL1 }}>
              {muted ? 'volume_off' : 'volume_up'}
            </span>
            {muted ? 'Muted' : 'Mute'}
          </button>
        </div>

        {/* ── BIOGRAPHIC / DATA PAGE ───────────────────────── */}
        <div style={{ margin:'16px 16px 0', position:'relative', zIndex:3 }}>
          <div style={{ borderRadius:'12px 12px 0 0', overflow:'hidden',
            border:`1.5px solid ${C.gold}50`,
            boxShadow:'0 8px 32px rgba(0,0,0,0.35)' }}>

            {/* Page header stripe */}
            <div style={{ background:C.navy, padding:'8px 14px 6px',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLight}70`, letterSpacing:'0.2em' }}>TYPE · P     CODE · USA</p>
                <p style={{ fontFamily:MONO, fontSize:8.5, color:C.goldLight, fontWeight:700, letterSpacing:'0.08em' }}>PASSPORT · DATA PAGE</p>
              </div>
              <div style={{ opacity:0.7 }}><PassportEmblem size={36} color={C.goldLight}/></div>
            </div>

            {/* Page body */}
            <div style={{ background:C.page, position:'relative', overflow:'hidden' }}>
              <PageLines rows={18} color={C.gold} op={0.08}/>
              {/* Security pattern top-right */}
              <div style={{ position:'absolute', right:-20, top:-20, opacity:0.06, pointerEvents:'none' }}>
                <PassportEmblem size={160} color={C.goldDark}/>
              </div>
              <div style={{ position:'absolute', right:8, top:8, opacity:0.08, pointerEvents:'none' }}>
                <OfficialSeal size={60} color={C.gold}/>
              </div>

              <div style={{ position:'relative', zIndex:2, padding:'14px 14px 10px' }}>
                {/* Identity row */}
                <div style={{ display:'flex', gap:12, marginBottom:12 }}>
                  {/* Photo box */}
                  <div style={{ width:68, height:84, borderRadius:6, flexShrink:0,
                    background:`linear-gradient(145deg,${C.coverMid},${C.cover})`,
                    border:`1.5px solid ${C.gold}50`,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`${C.gold}20`,
                      border:`1.5px solid ${C.gold}60`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.goldLight }}>{profile.initials}</span>
                    </div>
                    <span style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLight}70`, letterSpacing:'0.06em' }}>PHOTO</span>
                  </div>
                  {/* Fields */}
                  <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px' }}>
                    {[
                      { label:'Surname', value:profile.displayName?.split(' ')[1] || 'COLLINS' },
                      { label:'Given Names', value:profile.displayName?.split(' ')[0] + ' M' || 'JOHN M' },
                      { label:'Nationality', value:'USA / PROFOUND' },
                      { label:'Date of Issue', value:profile.memberSince },
                      { label:'Passport No.', value:profile.passportId },
                      { label:'Tier', value:profile.tier?.toUpperCase() },
                    ].map(f => (
                      <div key={f.label} style={{ borderBottom:`1px solid ${C.gold}25`, paddingBottom:3 }}>
                        <p style={{ fontFamily:MONO, fontSize:7, color:`${C.brown}80`, textTransform:'uppercase', letterSpacing:'0.1em' }}>{f.label}</p>
                        <p style={{ fontFamily:MONO, fontWeight:700, fontSize:10, color:C.ink, letterSpacing:'0.04em' }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scan credential row */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                  background:C.pageAlt, border:`1px solid ${C.gold}35`, borderRadius:8, marginBottom:8 }}>
                  <div onClick={() => { triggerHaptic('medium'); setModal('scan') }} style={{ cursor:'pointer', flexShrink:0 }}>
                    <QrGraphic size={40}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontFamily:SANS, fontWeight:700, fontSize:12.5, color:C.navy }}>360 Passport Connection</p>
                    <p style={{ fontFamily:MONO, fontSize:8, color:C.brown, letterSpacing:'0.04em' }}>Scan to connect · Active session</p>
                  </div>
                  <button onClick={() => { triggerHaptic('medium'); setModal('scan') }}
                    onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
                    onTouchEnd={e => e.currentTarget.style.transform = ''}
                    style={{ padding:'0 16px', height:36, borderRadius:7, border:'none', background:C.gold,
                      color:'#fff', fontFamily:SANS, fontWeight:700, fontSize:12, cursor:'pointer',
                      boxShadow:`0 2px 8px rgba(201,153,42,0.3)`, transition:'transform .1s', flexShrink:0 }}>
                    SCAN
                  </button>
                </div>

                {/* XP progress */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}80`, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>PASSPORT XP</span>
                  <div style={{ flex:1, height:4, borderRadius:2, background:`${C.gold}20` }}>
                    <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2, background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:7.5, color:C.gold, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{profile.xp} XP</span>
                </div>
              </div>
            </div>

            {/* MRZ */}
            <MRZStrip name={`${profile.displayName?.split(' ')[1] || 'COLLINS'}<<${profile.displayName?.split(' ')[0] || 'JOHN'}<M`} id={profile.passportId}/>
          </div>

          {/* Security footer ribbon */}
          <div style={{ background:`${C.navy}EE`, padding:'5px 14px', borderRadius:'0 0 10px 10px',
            border:`1px solid ${C.gold}35`, borderTop:'none',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Guilloche w={600} h={16} color={C.goldLight} op={0.35}/>
          </div>
        </div>

        {/* ── TAGLINE ───────────────────────────────────────── */}
        <div style={{ padding:'14px 20px 0', position:'relative', zIndex:3, textAlign:'center' }}>
          <p style={{ fontFamily:MONO, fontSize:8, color:`${C.goldLight}60`, letterSpacing:'0.22em', textTransform:'uppercase' }}>
            EVERY STAMP TELLS A STORY · EVERY CONNECTION BUILDS LEGACY
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PASSPORT BODY — open pages below the cover
      ════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'0 14px 0' }}>

        {/* ── INSTRUCTIONS PAGE ─────────────────────────────── */}
        <div style={{ margin:'20px 0 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingLeft:2 }}>
            <div style={{ width:2, height:12, borderRadius:1, background:C.gold }}/>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.goldLight, letterSpacing:'0.18em', textTransform:'uppercase' }}>How It Works</span>
            <div style={{ flex:1, height:'1px', background:`${C.gold}30`, marginLeft:4 }}/>
            <button onClick={() => { triggerHaptic('light'); setGuideStep(1) }}
              style={{ fontFamily:MONO, fontSize:8.5, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>
              Full guide →
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { num:1, icon:'qr_code_scanner', title:'Scan In',      sub:'Enter a service or event using your QR passport.' },
              { num:2, icon:'person_edit',     title:'Build Profile', sub:'Share your story, interests, and goals.' },
              { num:3, icon:'hub',             title:'Meet People',   sub:'Connect with verified members and matches.' },
              { num:4, icon:'workspace_premium',title:'Earn Stamps',  sub:'Collect stamps, gain access, perks, and grow legacy.' },
            ].map(s => (
              <PressBox key={s.num} onClick={() => { triggerHaptic('light'); setGuideStep(s.num) }}
                style={{ background:C.page, border:`1px solid rgba(0,0,0,0.12)`, borderRadius:9,
                  padding:'11px 9px 12px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:6,
                  boxShadow:'0 2px 8px rgba(11,30,48,0.07)', overflow:'hidden', position:'relative' }}>
                <PageLines rows={8} color={C.gold} op={0.06}/>
                <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:C.navy,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:MONO, fontWeight:700, fontSize:11, color:C.gold }}>{s.num}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold, ...FILL1 }}>{s.icon}</span>
                  <p style={{ fontFamily:SANS, fontWeight:700, fontSize:11, color:C.navy, lineHeight:1.2 }}>{s.title}</p>
                  <p style={{ fontFamily:SANS, fontSize:8.5, color:C.brown, lineHeight:1.4 }}>{s.sub}</p>
                </div>
              </PressBox>
            ))}
          </div>
        </div>

        {/* ── ENDORSEMENTS PAGE (Start Here) ────────────────── */}
        <PassportPage folio="ENDORSEMENTS · PAGE 05" style={{ marginBottom:14 }}>
          <div style={{ padding:'10px 14px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:2, height:12, borderRadius:1, background:C.gold }}/>
              <span style={{ fontFamily:MONO, fontSize:9, color:C.brown, letterSpacing:'0.18em', textTransform:'uppercase' }}>Start Here</span>
              <div style={{ flex:1, height:'1px', background:`${C.gold}25`, marginLeft:4 }}/>
              <span style={{ fontFamily:MONO, fontSize:8, color:`${C.brown}80`, letterSpacing:'0.1em' }}>YOUR NEXT ACTIONS</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7 }}>
              {ACTIONS.map(a => (
                <PressBox key={a.label} onClick={a.action}
                  style={{ background:C.pageAlt, border:`1px solid ${C.gold}30`, borderRadius:8,
                    padding:'10px 7px 11px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:5 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${a.color}16`,
                    border:`1.5px solid ${a.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:a.color, ...FILL1 }}>{a.icon}</span>
                  </div>
                  <p style={{ fontFamily:SANS, fontWeight:700, fontSize:9.5, color:C.navy, lineHeight:1.2 }}>{a.label}</p>
                  <p style={{ fontFamily:SANS, fontSize:8, color:C.brown, lineHeight:1.35 }}>{a.sub}</p>
                </PressBox>
              ))}
            </div>
          </div>
        </PassportPage>

        {/* ── VISA PAGES (Passport Sections) ────────────────── */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingLeft:2 }}>
            <div style={{ width:2, height:12, borderRadius:1, background:C.gold }}/>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.goldLight, letterSpacing:'0.18em', textTransform:'uppercase' }}>Passport Sections</span>
            <div style={{ flex:1, height:'1px', background:`${C.gold}30`, marginLeft:4 }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SECTIONS.map(s => (
              <PressBox key={s.label} onClick={() => { triggerHaptic('light'); navigate(s.route) }}
                style={{ background:C.page, border:`1px solid rgba(0,0,0,0.12)`, borderRadius:10,
                  overflow:'hidden', position:'relative',
                  boxShadow:'0 2px 10px rgba(11,30,48,0.08)' }}>
                {/* Page ruling lines */}
                <PageLines rows={12} color={C.gold} op={0.07}/>
                {/* Page number tab */}
                <div style={{ position:'absolute', top:8, right:8, zIndex:3,
                  background:C.navy, borderRadius:5, padding:'2px 7px' }}>
                  <span style={{ fontFamily:MONO, fontSize:7, color:C.gold, fontWeight:700, letterSpacing:'0.1em' }}>{s.pg}</span>
                </div>
                {/* Faint section seal */}
                <div style={{ position:'absolute', right:-12, bottom:-12, zIndex:1, opacity:0.1 }}>
                  <OfficialSeal size={70} color={s.color}/>
                </div>
                <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:10, padding:'14px 12px' }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:`${s.color}14`,
                    border:`1.5px solid ${s.color}35`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:20, color:s.color, ...FILL1 }}>{s.icon}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:13.5, color:C.navy }}>{s.label}</p>
                    <p style={{ fontFamily:SANS, fontSize:10, color:C.brown, lineHeight:1.35 }}>{s.sub}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:`${C.gold}80` }}>chevron_right</span>
                </div>
              </PressBox>
            ))}
          </div>
        </div>

        {/* ── STAMPS PAGE ───────────────────────────────────── */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingLeft:2 }}>
            <div style={{ width:2, height:12, borderRadius:1, background:C.gold }}/>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.goldLight, letterSpacing:'0.18em', textTransform:'uppercase' }}>Digital Stamps</span>
            <div style={{ flex:1, height:'1px', background:`${C.gold}30`, marginLeft:4 }}/>
            <button onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}
              style={{ fontFamily:MONO, fontSize:8.5, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>
              View All →
            </button>
          </div>

          {/* The stamp page itself */}
          <div style={{ background:C.page, borderRadius:10, border:`1px solid rgba(0,0,0,0.12)`,
            boxShadow:'0 2px 10px rgba(11,30,48,0.08)', overflow:'hidden', position:'relative' }}>
            <PageLines rows={16} color={C.gold} op={0.08}/>
            {/* Corner folio */}
            <Folio n="VISA · STAMPS · PAGE 06" side="left"/>
            {/* Large faint emblem center */}
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', opacity:0.05, pointerEvents:'none' }}>
              <PassportEmblem size={220} color={C.goldDark}/>
            </div>

            {/* Stamps header */}
            <div style={{ position:'relative', zIndex:2, padding:'12px 14px 8px',
              borderBottom:`1px solid ${C.gold}20`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontFamily:MONO, fontWeight:700, fontSize:9.5, color:C.brown, letterSpacing:'0.18em' }}>COLLECT · EARN · UNLOCK</p>
              </div>
              <div style={{ opacity:0.6 }}><OfficialSeal size={28} color={C.gold} label="✓"/></div>
            </div>

            {/* Stamp seals row */}
            <div style={{ position:'relative', zIndex:2, display:'flex', justifyContent:'space-around', padding:'16px 10px 12px' }}>
              {STAMPS.map(stamp => (
                <button key={stamp.id}
                  onClick={() => { triggerHaptic('light'); setSelStamp(stamp) }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.88)'}
                  onTouchEnd={e => e.currentTarget.style.transform = ''}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    background:'none', border:'none', cursor:'pointer', transition:'transform .12s',
                    opacity: stamp.earned ? 1 : 0.35, padding:'2px 4px' }}>
                  {/* Multi-ring stamp seal */}
                  <div style={{ position:'relative', width:54, height:54 }}>
                    {/* Outer dashed ring */}
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%',
                      border:`1.5px dashed ${stamp.color}${stamp.earned ? '60' : '30'}` }}/>
                    {/* Inner solid ring */}
                    <div style={{ position:'absolute', inset:4, borderRadius:'50%',
                      border:`1.5px solid ${stamp.color}${stamp.earned ? '50' : '20'}`,
                      background:`${stamp.color}08`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: stamp.earned ? `inset 0 1px 4px ${stamp.color}20` : 'none' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:20, color:stamp.earned ? stamp.color : `${stamp.color}60`, ...FILL1 }}>{stamp.icon}</span>
                    </div>
                    {/* Earned: tiny verified dot */}
                    {stamp.earned && (
                      <div style={{ position:'absolute', bottom:1, right:1, width:14, height:14, borderRadius:'50%',
                        background:stamp.color, display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize:9, color:'#fff', ...FILL1 }}>check</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:7.5, color:stamp.earned ? stamp.color : C.brown,
                    textTransform:'uppercase', letterSpacing:'0.1em' }}>{stamp.label}</span>
                </button>
              ))}
            </div>

            {/* Stamp page footer */}
            <div style={{ position:'relative', zIndex:2, borderTop:`1px solid ${C.gold}20`, padding:'7px 14px',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}60`, letterSpacing:'0.12em' }}>AUTHENTICATED · 360 PASSPORT CONNECTIONS</span>
              <button onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}
                style={{ fontFamily:MONO, fontSize:8, color:C.gold, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <span className="material-symbols-outlined" style={{ fontSize:12, ...FILL1 }}>workspace_premium</span>
                VIEW COLLECTION
              </button>
            </div>
          </div>
        </div>

        {/* ── TRAVEL RECORD + LOG (2 col) ───────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>

          {/* Upcoming Events — travel record page */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, paddingLeft:2 }}>
              <div style={{ width:2, height:10, borderRadius:1, background:C.gold }}/>
              <span style={{ fontFamily:MONO, fontSize:8.5, color:C.goldLight, letterSpacing:'0.15em', textTransform:'uppercase' }}>Upcoming Events</span>
              <div style={{ flex:1, height:'1px', background:`${C.gold}25`, marginLeft:3 }}/>
              <button onClick={() => { triggerHaptic('light'); navigate('/passport/events') }}
                style={{ fontFamily:MONO, fontSize:8, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>See All →</button>
            </div>
            <div style={{ background:C.page, borderRadius:10, border:`1px solid rgba(0,0,0,0.12)`,
              boxShadow:'0 2px 8px rgba(11,30,48,0.07)', overflow:'hidden', position:'relative' }}>
              <PageLines rows={14} color={C.gold} op={0.07}/>
              <Folio n="PAGE 07" side="right"/>
              <div style={{ position:'relative', zIndex:2, padding:'10px 11px' }}>
                {events.map((ev, i) => (
                  <div key={ev.id} onClick={() => { triggerHaptic('light'); setSelEvent(ev) }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                      borderBottom: i < events.length - 1 ? `1px solid ${C.gold}18` : 'none', cursor:'pointer' }}>
                    <div style={{ minWidth:36, textAlign:'center', background:C.navy, borderRadius:6, padding:'3px 5px', flexShrink:0 }}>
                      <p style={{ fontFamily:MONO, fontSize:6, color:`rgba(255,255,255,0.45)`, letterSpacing:'0.06em' }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:'#fff', lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SANS, fontWeight:700, fontSize:10.5, color:C.navy, lineHeight:1.2 }}>{ev.name}</p>
                      <p style={{ fontFamily:SANS, fontSize:9, color:C.brown }}>{ev.venue} · {ev.city}</p>
                    </div>
                    {(rsvpdIds.has(ev.id) || ev.rsvpd)
                      ? <span style={{ fontFamily:MONO, fontSize:7, color:C.green }}>RSVP'd</span>
                      : <span className="material-symbols-outlined" style={{ fontSize:14, color:`${C.gold}70` }}>chevron_right</span>}
                  </div>
                ))}
                <button onClick={async () => {
                  triggerHaptic('success')
                  await Promise.all(events.map(e => rsvpToEvent(e.id)))
                  setRsvpdIds(new Set(events.map(e => e.id)))
                  showToast('RSVP confirmed for all events.')
                }} style={{ width:'100%', marginTop:9, padding:'8px', borderRadius:8,
                  border:`1px solid ${C.gold}45`, background:`${C.gold}08`,
                  fontFamily:MONO, fontWeight:700, fontSize:9, color:C.gold, cursor:'pointer',
                  letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  RSVP TO ALL UPCOMING EVENTS
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity — credential log page */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, paddingLeft:2 }}>
              <div style={{ width:2, height:10, borderRadius:1, background:C.gold }}/>
              <span style={{ fontFamily:MONO, fontSize:8.5, color:C.goldLight, letterSpacing:'0.15em', textTransform:'uppercase' }}>Recent Activity</span>
              <div style={{ flex:1, height:'1px', background:`${C.gold}25`, marginLeft:3 }}/>
            </div>
            <div style={{ background:C.page, borderRadius:10, border:`1px solid rgba(0,0,0,0.12)`,
              boxShadow:'0 2px 8px rgba(11,30,48,0.07)', overflow:'hidden', position:'relative' }}>
              <PageLines rows={14} color={C.gold} op={0.07}/>
              <Folio n="PAGE 08" side="right"/>
              {/* Left margin line like a real ledger */}
              <div style={{ position:'absolute', left:22, top:0, bottom:0, width:1, background:`${C.gold}22`, pointerEvents:'none', zIndex:1 }}/>
              <div style={{ position:'relative', zIndex:2, padding:'10px 11px 10px 28px' }}>
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={a.id} onClick={() => triggerHaptic('light')}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 0',
                      borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${C.gold}18` : 'none', cursor:'pointer' }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:`${a.color}14`,
                      border:`1px solid ${a.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:13, color:a.color, ...FILL1 }}>{a.icon}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SANS, fontWeight:700, fontSize:10, color:C.navy }}>{a.label}</p>
                      <p style={{ fontFamily:SANS, fontSize:8.5, color:C.brown, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.detail}</p>
                    </div>
                    <span style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}60`, flexShrink:0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── IDENTITY STRIP (Profile) ───────────────────────── */}
        <div style={{ background:C.page, borderRadius:10, border:`1px solid rgba(0,0,0,0.12)`,
          boxShadow:'0 2px 8px rgba(11,30,48,0.08)', overflow:'hidden', position:'relative', marginBottom:8 }}>
          <PageLines rows={8} color={C.gold} op={0.07}/>
          <div style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', opacity:0.06, pointerEvents:'none' }}>
            <PassportEmblem size={110} color={C.goldDark}/>
          </div>
          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:12, padding:'10px 14px' }}>
            {/* Passport photo badge */}
            <div style={{ width:46, height:56, borderRadius:5, flexShrink:0,
              background:`linear-gradient(145deg,${C.coverMid},${C.cover})`,
              border:`1.5px solid ${C.gold}50`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:`${C.gold}20`,
                border:`1.5px solid ${C.gold}60`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.goldLight }}>{profile.initials}</span>
              </div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:14, color:C.navy }}>{profile.displayName}</p>
              <p style={{ fontFamily:MONO, fontSize:8, color:C.brown, letterSpacing:'0.06em' }}>
                PARTICIPANT MEMBER · {profile.tier?.toUpperCase()} · #{profile.passportId?.slice(-6)}
              </p>
              <div style={{ height:3, borderRadius:2, background:`${C.gold}20`, marginTop:5 }}>
                <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2, background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:7, flexShrink:0 }}>
              <GBtn sm outline onClick={() => { triggerHaptic('light'); navigate('/passport/profile') }}>Edit</GBtn>
              <GBtn sm onClick={() => { triggerHaptic('light'); setModal('profile') }}>View Profile</GBtn>
            </div>
          </div>
          {/* MRZ-style footer */}
          <div style={{ borderTop:`1px solid ${C.gold}18`, padding:'4px 14px',
            background:`${C.pageAlt}CC`, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontFamily:OCR, fontSize:7.5, color:`${C.brown}55`, letterSpacing:'0.08em' }}>P&lt;USA{(profile.displayName || '').toUpperCase().replace(' ','<<')}</span>
            <span style={{ fontFamily:OCR, fontSize:7.5, color:`${C.brown}55`, letterSpacing:'0.08em' }}>{profile.passportId}0USA</span>
          </div>
        </div>

        <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.goldLight}30`, textAlign:'center', letterSpacing:'0.2em', marginBottom:6 }}>
          PROFOUND INNOVATIONS LLC · 360 PASSPORT CONNECTIONS
        </p>

      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'scan' && (
          <ScanModal key="scan" muted={muted} onClose={() => setModal(null)}
            onResult={r => { setModal(null); setTimeout(() => handleScanResult(r), 60) }}/>
        )}
        {modal === 'scan-result' && scanResult && (
          <ScanResultModal key="sr" result={scanResult} muted={muted}
            onClose={closeModal} onAction={handleAction}
            onShowOverlay={type => { closeModal(); setTimeout(() => handleOverlay(type), 60) }}/>
        )}
        {overlayOn && <StampOverlay key="overlay" muted={muted} onDone={() => setOverlayOn(false)}/>}
        {modal === 'profile' && <ProfileModal key="profile" profile={profile} onClose={closeModal}/>}
        {modal === 'admin' && <AdminPanel key="admin" onClose={closeModal}/>}
        {guideStep && <GuideModal key={`g${guideStep}`} step={guideStep} onClose={() => setGuideStep(null)}/>}
        {selStamp && <StampDetailModal key={`s${selStamp.id}`} stamp={selStamp} onClose={() => setSelStamp(null)}/>}
        {selEvent && (
          <EventDetailModal key={`e${selEvent.id}`} event={selEvent}
            onClose={() => setSelEvent(null)}
            onRsvp={id => { setRsvpdIds(s => new Set([...s, id])); showToast('RSVP confirmed.') }}/>
        )}
      </AnimatePresence>

      <Toast msg={toast.msg} visible={toast.visible}/>
      <BottomNav onScan={() => { triggerHaptic('medium'); setModal('scan') }}/>
    </div>
  )
}
