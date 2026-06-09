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

/* ─── Palette ─────────────────────────────────────────────────── */
const C = {
  bg:       '#0A0704',       /* near-black espresso */
  leather:  '#1C1108',       /* dark leather */
  leatherMid:'#241810',
  spine:    '#120C06',
  page:     '#C8A878',       /* aged parchment */
  pageLight:'#D4B990',
  pageDark: '#B8956A',
  pageText: '#1A0D04',       /* deep ink */
  pageFaint:'rgba(26,13,4,0.45)',
  gold:     '#C4922A',
  goldLight:'#E0B84A',
  goldDark: '#8B6012',
  cream:    '#F0E4C8',
  stampRed: '#8B2010',
  stampGrn: '#1A4F2A',
  stampBlu: '#1A2F5A',
  stampPur: '#3A1A5A',
  inkLine:  'rgba(26,13,4,0.18)',
  inkMed:   'rgba(26,13,4,0.12)',
  inkFaint: 'rgba(26,13,4,0.07)',
  border:   'rgba(196,146,42,0.4)',
  borderSt: 'rgba(196,146,42,0.7)',
}
const SERIF = '"Playfair Display",Georgia,serif'
const MONO  = '"JetBrains Mono","Courier New",monospace'
const SANS  = '"Hanken Grotesk",system-ui,sans-serif'
const OCR   = '"JetBrains Mono","Courier New",monospace'
const FILL1 = { fontVariationSettings:"'FILL' 1" }

/* ─── Page ruling lines ──────────────────────────────────────── */
function PageRules({ rows = 18, op = 1 }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {[...Array(rows)].map((_,i) => (
        <div key={i} style={{
          position:'absolute', left:0, right:0,
          top:`${(i + 1) * (100 / (rows + 1))}%`,
          height:'1px', background:C.inkLine, opacity:op }} />
      ))}
    </div>
  )
}

/* ─── Leather grain ──────────────────────────────────────────── */
function LeatherGrain() {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06, pointerEvents:'none' }}
      viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice">
      {[...Array(60)].map((_,i) => {
        const x = (i % 10) * 22 + (Math.floor(i/10) % 2) * 11
        const y = Math.floor(i/10) * 36
        return <ellipse key={i} cx={x} cy={y} rx={9+i%4} ry={2} fill="none" stroke="#ffffff" strokeWidth={0.4} opacity={0.4+(i%3)*0.15}/>
      })}
    </svg>
  )
}

/* ─── Emblem SVG ─────────────────────────────────────────────── */
function B360Emblem({ size = 80, color = C.goldLight, op = 1 }) {
  const cx = size / 2, r = cx - 5
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity:op }}>
      {/* Outer wreath ring */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={1.5}/>
      {/* Dashed inner ring */}
      <circle cx={cx} cy={cx} r={r-10} fill="none" stroke={color} strokeWidth={0.7} strokeDasharray="3 2"/>
      {/* Globe lines */}
      <ellipse cx={cx} cy={cx} rx={(r-14)*0.55} ry={r-14} fill="none" stroke={color} strokeWidth={0.7}/>
      {[-40,-15,10,35].map((yo,i) => (
        <line key={i} x1={5} y1={cx+yo} x2={size-5} y2={cx+yo} stroke={color} strokeWidth={0.4} opacity={0.6}/>
      ))}
      {/* Star points */}
      {[...Array(8)].map((_,i) => {
        const a = (i * 45 - 22.5) * Math.PI/180
        const x1 = cx + Math.cos(a)*(r-16), y1 = cx + Math.sin(a)*(r-16)
        const x2 = cx + Math.cos(a)*(r-6), y2 = cx + Math.sin(a)*(r-6)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.8}/>
      })}
      <circle cx={cx} cy={cx} r={11} fill={`${color}20`} stroke={color} strokeWidth={0.7}/>
      <text x={cx} y={cx-2} textAnchor="middle" fontFamily={MONO} fontSize={size*0.12} fontWeight={700} fill={color}>360</text>
      <text x={cx} y={cx+7} textAnchor="middle" fontFamily={MONO} fontSize={size*0.07} fill={color}>PP</text>
    </svg>
  )
}

/* ─── Ink stamp component ────────────────────────────────────── */
function InkStamp({ size=70, color=C.stampRed, icon='workspace_premium', label='VERIFIED', earned=true, onClick, tilt=0 }) {
  const [pr, setPr] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={() => setPr(true)} onTouchEnd={() => setPr(false)}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)} onMouseLeave={() => setPr(false)}
      style={{ background:'none', border:'none', cursor:'pointer', padding:0,
        transform:`rotate(${tilt}deg) scale(${pr ? 0.88 : 1})`,
        transition:'transform .12s', opacity: earned ? 1 : 0.22 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        {/* Distressed outer ring */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={37} fill="none" stroke={color} strokeWidth={2.2}
            strokeDasharray="4 1.5" opacity={0.85}/>
          <circle cx={40} cy={40} r={31} fill={`${color}12`} stroke={color} strokeWidth={1.2} opacity={0.7}/>
          <circle cx={40} cy={40} r={25} fill="none" stroke={color} strokeWidth={0.6} opacity={0.5}/>
          {[...Array(12)].map((_,i) => {
            const a = (i * 30) * Math.PI/180
            return <line key={i} x1={40+Math.cos(a)*18} y1={40+Math.sin(a)*18}
              x2={40+Math.cos(a)*29} y2={40+Math.sin(a)*29} stroke={color} strokeWidth={0.7} opacity={0.6}/>
          })}
        </svg>
        {/* Icon */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:0 }}>
          <span className="material-symbols-outlined" style={{ fontSize:size*0.32, color, ...FILL1 }}>{icon}</span>
          <span style={{ fontFamily:MONO, fontSize:size*0.1, color, fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase', lineHeight:1 }}>{label}</span>
        </div>
        {/* Earned checkmark */}
        {earned && (
          <div style={{ position:'absolute', top:0, right:0, width:16, height:16, borderRadius:'50%',
            background:color, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:10, color:'#fff', ...FILL1 }}>check</span>
          </div>
        )}
      </div>
    </button>
  )
}

/* ─── QR graphic ─────────────────────────────────────────────── */
function QrGraphic({ size = 44, color = C.pageText }) {
  const s = size / 7
  const pat = [[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
               [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pat.map((row,ri) => row.map((v,ci) => v
        ? <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1} fill={color} opacity={0.75}/>
        : null))}
    </svg>
  )
}

/* ─── Press box ──────────────────────────────────────────────── */
function Tap({ onClick, children, style = {} }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={() => setPr(true)} onTouchEnd={() => setPr(false)}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)} onMouseLeave={() => setPr(false)}
      style={{ transform:pr?'scale(0.96)':'scale(1)', transition:'transform .1s',
        cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

/* ─── Gold button ────────────────────────────────────────────── */
function GBtn({ children, onClick, outline=false, full=false, sm=false, dark=false, style={} }) {
  const [pr, setPr] = useState(false)
  const bg = outline ? 'transparent' : dark ? C.leather : pr ? C.goldDark : C.gold
  const fg = outline ? (dark ? C.goldLight : C.gold) : '#fff'
  return (
    <button onClick={onClick}
      onTouchStart={() => setPr(true)} onTouchEnd={() => setPr(false)}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)} onMouseLeave={() => setPr(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width:full?'100%':'auto', padding:sm?'0 14px':'0 20px',
        height:sm?38:46, borderRadius:8,
        border:outline?`1.5px solid ${dark?C.goldLight:C.gold}`:'none',
        background:bg, color:fg,
        fontFamily:SANS, fontWeight:700, fontSize:sm?11:13, cursor:'pointer',
        transform:pr?'scale(0.96)':'scale(1)', transition:'all .12s',
        boxShadow:outline?'none':`0 3px 12px rgba(196,146,42,0.3)`, ...style }}>
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
        style={{ position:'absolute', inset:0, background:'rgba(10,7,4,0.82)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'18px 18px 0 0', background:C.pageLight,
          borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(10,7,4,0.4)',
          maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none', padding:'14px 20px 48px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:C.border }}/>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function CenterModal({ onClose, children, maxW=360 }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(10,7,4,0.82)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:maxW, borderRadius:14,
          background:C.pageLight, border:`2px solid ${C.gold}`,
          boxShadow:'0 24px 60px rgba(10,7,4,0.5)', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {children}
      </motion.div>
    </div>
  )
}

function FactBox({ children }) {
  return <div style={{ background:`${C.pageDark}40`, borderRadius:9, padding:'10px 14px', border:`1px solid ${C.inkLine}` }}>{children}</div>
}
function FactRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${C.inkFaint}` }}>
      <span style={{ fontFamily:MONO, fontSize:9, color:C.pageFaint, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:color||C.pageText }}>{value}</span>
    </div>
  )
}

/* ── Scan Modal ───────────────────────────────────────────────── */
function ScanModal({ muted, onClose, onResult }) {
  const [state, setState] = useState('idle')
  const SIMS = [
    { type:'venue',   icon:'store',             label:'Simulate Venue Check-In' },
    { type:'event',   icon:'event',             label:'Simulate Event Entry' },
    { type:'member',  icon:'person',            label:'Simulate Member Scan' },
    { type:'stamp',   icon:'workspace_premium', label:'Simulate Stamp Claim' },
    { type:'benefit', icon:'redeem',            label:'Simulate Benefit Unlock' },
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
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.pageText, textAlign:'center', marginBottom:4 }}>Scan Passport</p>
      <p style={{ fontFamily:SANS, fontSize:12, color:C.pageFaint, textAlign:'center', lineHeight:1.55, marginBottom:16 }}>Point at any 360 Passport QR to verify.</p>
      <div style={{ width:150, height:150, margin:'0 auto 18px', borderRadius:10,
        background:`${C.pageDark}30`, border:`2px solid ${C.border}`, position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
          <div key={i} style={{ position:'absolute', width:16, height:16,
            top:ry?'auto':8, bottom:ry?8:'auto', left:rx?'auto':8, right:rx?8:'auto',
            borderTop:ry?'none':`2.5px solid ${C.gold}`, borderBottom:ry?`2.5px solid ${C.gold}`:'none',
            borderLeft:rx?'none':`2.5px solid ${C.gold}`, borderRight:rx?`2.5px solid ${C.gold}`:'none' }}/>
        ))}
        {state==='scanning' && (
          <div style={{ position:'absolute', left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,
            animation:'scanLine .9s ease-in-out infinite' }}>
            <style>{`@keyframes scanLine{0%{transform:translateY(-74px)}100%{transform:translateY(74px)}}`}</style>
          </div>
        )}
        <QrGraphic size={68}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
        {SIMS.map(s => (
          <button key={s.type} onClick={() => simulate(s.type)} disabled={state==='scanning'}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9,
              border:`1px solid ${C.border}`, background:`${C.gold}08`, cursor:'pointer',
              fontFamily:SANS, fontWeight:600, fontSize:13, color:C.pageText, textAlign:'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize:17, color:C.gold }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <GBtn full outline onClick={onClose}>Close</GBtn>
    </ModalShell>
  )
}

/* ── Result ───────────────────────────────────────────────────── */
function ResultHead({ icon, iconColor, badge, title }) {
  return (
    <div style={{ textAlign:'center', marginBottom:14 }}>
      <div style={{ width:54, height:54, borderRadius:'50%', background:`${iconColor}14`,
        border:`1.5px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize:26, color:iconColor, ...FILL1 }}>{icon}</span>
      </div>
      {badge && <span style={{ display:'inline-block', fontFamily:MONO, fontSize:8, color:iconColor,
        background:`${iconColor}10`, border:`1px solid ${iconColor}25`, padding:'2px 10px',
        borderRadius:99, marginBottom:6, letterSpacing:'0.12em' }}>{badge}</span>}
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.pageText }}>{title}</p>
    </div>
  )
}

function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  if (!result) return null
  const { sourceType, data } = result
  if (!result.success || sourceType === 'invalid') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="error" iconColor={C.stampRed} badge="INVALID CODE" title="Invalid Passport Code"/>
      <FactBox><p style={{ fontFamily:SANS, fontSize:12.5, color:C.pageText, lineHeight:1.6, textAlign:'center', padding:'4px 0 8px' }}>This code is not connected to 360 Passport Connections.</p></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='venue') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="store" iconColor="#2A5A3A" badge="CHECK-IN" title="Venue Check-In Verified"/>
      <FactBox><FactRow label="Venue" value={data.name}/><FactRow label="Location" value={`${data.city}, ${data.state}`}/><FactRow label="Stamps" value={`${data.availableStamps?.length} available`}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose() }}>Start Passport Session</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='event') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="event" iconColor={C.stampBlu} badge="CHECK-IN" title="Event Check-In Verified"/>
      <FactBox><FactRow label="Event" value={data.name}/><FactRow label="Venue" value={data.venue}/><FactRow label="Stamp" value={data.stampName} color={C.stampGrn}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose() }}>Claim Event Stamp</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='member') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="person" iconColor={C.stampGrn} badge="MATCH FOUND" title="Connection Found"/>
      <FactBox><FactRow label="Member" value={data.name}/><FactRow label="Role" value={`${data.role} @ ${data.company}`}/><FactRow label="Match Score" value={`${data.matchScore}%`} color={C.gold}/><FactRow label="Trust" value={data.trustStatus} color={C.stampGrn}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose() }}>Verify Connection</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='stamp') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="workspace_premium" iconColor={C.gold} badge="AUTHENTICATED" title="Stamp Ready to Claim"/>
      <FactBox><FactRow label="Stamp" value={data.name}/><FactRow label="Category" value={data.category?.toUpperCase()}/><FactRow label="Status" value={data.authenticated ? 'Authenticated ✓' : 'Pending'} color={data.authenticated ? C.stampGrn : C.stampRed}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await claimStamp(data.id,'current'); onShowOverlay('stamp'); onClose() }}>Claim Stamp</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='benefit') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="redeem" iconColor={C.stampRed} badge="UNLOCKED" title="Benefit Unlocked"/>
      <FactBox><FactRow label="Benefit" value={data.name}/><FactRow label="Provider" value={data.provider}/><FactRow label="Expires" value={data.expiration}/></FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.pageFaint, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>{data.redemption}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <GBtn full onClick={async () => { triggerHaptic('success'); await redeemBenefit(data.id); onShowOverlay('benefit'); onClose() }}>Redeem Benefit</GBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  return null
}

/* ── Stamp overlay ────────────────────────────────────────────── */
function StampOverlay({ muted, onDone }) {
  const [step, setStep] = useState('updating')
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('done'); if (!muted) { playStampSound(); playSuccessTone() }; triggerHaptic('success')
    }, 1300)
    return () => clearTimeout(t)
  }, [muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(10,7,4,0.88)', backdropFilter:'blur(14px)' }}/>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:270, borderRadius:18, padding:'30px 22px 26px',
          background:C.pageLight, border:`2.5px solid ${C.gold}`,
          boxShadow:'0 20px 60px rgba(10,7,4,0.6)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step==='updating'
            ? <motion.div key="upd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  border:`3px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'spinGold 1.2s linear infinite' }}>
                  <style>{`@keyframes spinGold{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <span className="material-symbols-outlined" style={{ fontSize:30, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.pageText }}>Updating Passport…</p>
              </motion.div>
            : <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
                  background:`${C.gold}14`, border:`2px solid ${C.gold}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:36, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:20, color:C.pageText, marginBottom:4 }}>Stamp Awarded</p>
                <p style={{ fontFamily:MONO, fontSize:9, color:C.gold, letterSpacing:'0.14em', marginBottom:18 }}>PASSPORT UPDATED</p>
                <GBtn full onClick={onDone}>Continue</GBtn>
              </motion.div>}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ── Stamp detail ─────────────────────────────────────────────── */
function StampDetailModal({ stamp, onClose }) {
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ background:`${C.pageDark}40`, borderRadius:'12px 12px 0 0', padding:'22px 18px 18px',
        borderBottom:`1px solid ${C.inkLine}`, textAlign:'center' }}>
        <div style={{ margin:'0 auto 10px', width:72, height:72, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <InkStamp size={72} color={stamp.color||C.stampRed} icon={stamp.icon} label={stamp.label} earned={stamp.earned} tilt={-3}/>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.pageText }}>{stamp.name}</p>
      </div>
      <div style={{ padding:'14px 18px 22px' }}>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.pageText, lineHeight:1.65, marginBottom:12 }}>{stamp.description}</p>
        <FactBox><FactRow label="Requirement" value={stamp.requirement}/><FactRow label="Status" value={stamp.earned?'Earned ✓':'Not yet earned'} color={stamp.earned?C.stampGrn:C.stampRed}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

/* ── Event detail ─────────────────────────────────────────────── */
function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  async function handleRsvp() { setLoading(true); triggerHaptic('success'); await rsvpToEvent(event.id); setRsvpd(true); setLoading(false); onRsvp(event.id) }
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ minWidth:50, textAlign:'center', background:C.leather, borderRadius:9, padding:'6px 8px', flexShrink:0 }}>
          <p style={{ fontFamily:MONO, fontSize:7, color:`rgba(196,146,42,0.55)` }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:C.goldLight, lineHeight:1 }}>{event.date?.split(' ')[1]}</p>
        </div>
        <div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:C.pageText }}>{event.name}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:C.pageFaint }}>{event.venue} · {event.city} · {event.time}</p>
        </div>
      </div>
      <FactBox><FactRow label="Attendees" value={`${event.attendeeCount}/${event.capacity}`}/><FactRow label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct > 85 ? C.stampRed : C.stampGrn}/></FactBox>
      <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
        {rsvpd
          ? <div style={{ padding:'10px', background:`${C.stampGrn}12`, border:`1px solid ${C.stampGrn}28`, borderRadius:9, textAlign:'center' }}>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:12.5, color:C.stampGrn }}>✓ RSVP Confirmed</p>
            </div>
          : <GBtn full onClick={handleRsvp}>{loading ? 'Confirming…' : 'RSVP Now'}</GBtn>}
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
}

/* ── Guide modal ──────────────────────────────────────────────── */
const GUIDES = {
  1:{ title:'Scan In',      icon:'qr_code_scanner', body:'Enter a service or event using your QR passport. Tap Scan, point at any 360 Passport QR code, and your check-in is automatic.' },
  2:{ title:'Build Profile',icon:'person_edit',     body:'Share your story, interests, goals, and what matters. A richer profile means smarter matches and better introductions.' },
  3:{ title:'Meet People',  icon:'hub',             body:'Connect with verified members and better matches. The app surfaces people based on shared events, goals, and industry overlap.' },
  4:{ title:'Earn Stamps',  icon:'workspace_premium',body:'Every verified interaction — venue check-in, connection, event — adds a passport stamp. Stamps unlock access, perks, and legacy.' },
}
function GuideModal({ step, onClose }) {
  const g = GUIDES[step] || GUIDES[1]
  return (
    <CenterModal onClose={onClose} maxW={310}>
      <div style={{ padding:'26px 20px 24px', textAlign:'center' }}>
        <div style={{ width:58, height:58, borderRadius:'50%', background:`${C.pageDark}30`, border:`1.5px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:28, color:C.pageText, ...FILL1 }}>{g.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.pageText, marginBottom:10 }}>{g.title}</p>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.pageText, lineHeight:1.7, marginBottom:20 }}>{g.body}</p>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Got It</GBtn>
      </div>
    </CenterModal>
  )
}

/* ── Profile modal ────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }) {
  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)
  return (
    <CenterModal onClose={onClose} maxW={360}>
      <div style={{ background:C.leather, borderRadius:'12px 12px 0 0', padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <LeatherGrain/>
        <div style={{ position:'absolute', right:-20, top:-20, opacity:0.1 }}><B360Emblem size={160} color={C.goldLight}/></div>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ width:66, height:66, borderRadius:'50%', background:`${C.gold}20`,
            border:`2.5px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.gold }}>{profile.initials}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.goldLight }}>{profile.displayName}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:'rgba(196,146,42,0.55)', marginTop:2 }}>{profile.role} @ {profile.company}</p>
          <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:8, color:C.gold,
            background:`${C.gold}18`, border:`1px solid ${C.gold}28`, padding:'2px 11px', borderRadius:99, letterSpacing:'0.12em' }}>
            {profile.tier?.toUpperCase()} MEMBER
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 18px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.pageFaint, textTransform:'uppercase' }}>Legacy Score</span>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.gold }}>{profile.xp} / {profile.nextTierXp}</span>
          </div>
          <div style={{ height:5, borderRadius:3, background:`${C.pageDark}30`, border:`1px solid ${C.inkLine}` }}>
            <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[{val:profile.verifiedConnections,label:'Connections'},{val:profile.stampsEarned,label:'Stamps'},{val:profile.eventsAttended,label:'Events'}].map(s => (
            <div key={s.label} style={{ textAlign:'center', background:`${C.pageDark}25`, borderRadius:8, padding:'9px 5px', border:`1px solid ${C.inkLine}` }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.pageText }}>{s.val}</p>
              <p style={{ fontFamily:MONO, fontSize:7.5, color:C.pageFaint, textTransform:'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <FactBox><FactRow label="Passport ID" value={profile.passportId}/><FactRow label="Member Since" value={profile.memberSince}/><FactRow label="Status" value={profile.status} color={C.stampGrn}/></FactBox>
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
      <div style={{ background:`${C.pageDark}30`, borderRadius:'12px 12px 0 0', padding:'16px 18px', borderBottom:`1px solid ${C.inkLine}`, display:'flex', alignItems:'center', gap:9 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold, ...FILL1 }}>admin_panel_settings</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.pageText }}>Admin Source Panel</p>
      </div>
      <div style={{ padding:'14px 18px 24px' }}>
        {ITEMS.map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:9, border:`1px solid ${C.inkLine}`, background:`${C.pageDark}15`, cursor:'pointer',
              marginBottom:7, textAlign:'left', fontFamily:SANS, fontSize:12.5, color:C.pageText }}
            onMouseEnter={e => e.currentTarget.style.background = `${C.gold}12`}
            onMouseLeave={e => e.currentTarget.style.background = `${C.pageDark}15`}>
            <span className="material-symbols-outlined" style={{ fontSize:15, color:C.gold }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop:`1px solid ${C.inkLine}`, paddingTop:13, marginTop:6 }}>
          <p style={{ fontFamily:MONO, fontSize:8.5, color:C.pageFaint, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
          <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Image prompt…"
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.inkLine}`,
              background:'rgba(255,255,255,0.6)', color:C.pageText, fontFamily:SANS, fontSize:12, marginBottom:8, outline:'none', boxSizing:'border-box' }}/>
          <button onClick={queueOpenAI}
            style={{ width:'100%', padding:'10px', borderRadius:9, border:`1px solid ${C.gold}`, background:`${C.gold}0A`,
              fontFamily:SANS, fontWeight:700, fontSize:12, color:C.gold, cursor:'pointer', marginBottom:8 }}>
            Queue OpenAI Request
          </button>
          {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.stampGrn, marginBottom:8 }}>{status}</p>}
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
            background:C.pageLight, border:`1.5px solid ${C.gold}`, borderRadius:11, padding:'10px 18px',
            display:'flex', alignItems:'center', gap:9, boxShadow:'0 8px 28px rgba(10,7,4,0.3)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:15, color:C.gold, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:12.5, fontWeight:600, color:C.pageText }}>{msg}</span>
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
    { id:'scan', scan:true },
    { id:'events',    icon:'event',        label:'Events',    route:'/passport/events' },
    { id:'benefits',  icon:'redeem',       label:'Benefits',  route:'/passport/benefits' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:640, margin:'0 auto',
        background:C.leatherMid, borderTop:`1px solid ${C.border}`,
        borderRadius:'16px 16px 0 0', boxShadow:'0 -4px 24px rgba(10,7,4,0.4)',
        paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'8px 6px 4px' }}>
          {NAV.map(item => {
            if (item.scan) return (
              <button key="scan" onClick={() => { triggerHaptic('medium'); onScan() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.9)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:54, height:54, borderRadius:'50%', border:'none', background:C.gold,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
                  boxShadow:`0 4px 18px rgba(196,146,42,0.4), 0 0 0 4px ${C.leatherMid}, 0 0 0 5.5px ${C.border}`,
                  transform:'translateY(-10px)', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:24, color:'#fff', ...FILL1 }}>qr_code_scanner</span>
              </button>
            )
            return (
              <button key={item.id} onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.87)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:52, padding:'3px 0',
                  background:'none', border:'none', cursor:'pointer', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:22, color:`${C.goldLight}55` }}>{item.icon}</span>
                <span style={{ fontFamily:MONO, fontSize:8, letterSpacing:'0.05em', color:`${C.goldLight}45`, textTransform:'uppercase' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PASSPORT PAGE — a physical page wrapper
══════════════════════════════════════════════════════════════ */
function BookPage({ children, side='right', folio, style={} }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${C.pageLight} 0%, ${C.page} 45%, ${C.pageDark} 100%)`,
      borderRadius: side==='left' ? '6px 2px 2px 6px' : '2px 6px 6px 2px',
      position:'relative', overflow:'hidden',
      boxShadow: side==='left'
        ? 'inset -4px 0 12px rgba(10,7,4,0.18), inset 4px 0 6px rgba(255,255,255,0.06)'
        : 'inset 4px 0 12px rgba(10,7,4,0.18), inset -4px 0 6px rgba(255,255,255,0.06)',
      ...style }}>
      <PageRules rows={20} op={0.85}/>
      {/* Left margin rule */}
      {side==='right' && (
        <div style={{ position:'absolute', left:26, top:0, bottom:0, width:1, background:C.inkMed, pointerEvents:'none', zIndex:1 }}/>
      )}
      {folio && (
        <div style={{ position:'absolute', bottom:6,
          [side==='left'?'left':'right']:10, fontFamily:MONO, fontSize:7.5,
          color:`${C.pageText}40`, letterSpacing:'0.1em', zIndex:2 }}>{folio}</div>
      )}
      <div style={{ position:'relative', zIndex:2 }}>{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER (ruled line style)
══════════════════════════════════════════════════════════════ */
function PageSection({ title, sub, right, children, style={} }) {
  return (
    <div style={{ ...style }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:C.gold }}/>
        <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:13, color:C.goldLight, letterSpacing:'0.02em' }}>{title}</span>
        {sub && <span style={{ fontFamily:MONO, fontSize:8, color:`${C.goldLight}60`, letterSpacing:'0.12em' }}>— {sub}</span>}
        <div style={{ flex:1, height:1, background:`${C.gold}25`, marginLeft:4 }}/>
        {right}
      </div>
      {children}
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
    const h = e => { if (e.altKey && (e.key==='a'||e.key==='A')) { triggerHaptic('light'); setModal('admin') } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  function showToast(msg) { setToast({ visible:true, msg }); setTimeout(() => setToast(t => ({ ...t, visible:false })), 3000) }
  function closeModal() { triggerHaptic('light'); setModal(null) }
  function handleScanResult(r) { setScanResult(r); setModal('scan-result') }
  function handleOverlay(type) {
    setOverlayOn(true)
    const msgs = { stamp:'Stamp claimed.', verify:'Connection verified.', 'check-in':'Check-in confirmed.', benefit:'Benefit saved.' }
    setTimeout(() => showToast(msgs[type]||'Passport updated.'), 1400)
  }
  function handleAction(action) {
    if (action==='reopen-scan') { setModal('scan'); return }
    const routes = { events:'/passport/events', connections:'/passport/connections', stamps:'/passport/stamps', directory:'/passport/directory', benefits:'/passport/benefits' }
    if (routes[action]) navigate(routes[action])
  }

  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)

  const STAMP_COLORS = [C.stampRed, C.stampGrn, C.stampBlu, C.stampPur, C.goldDark]
  const TOCS = [
    { num:'01', label:'Identity',      icon:'badge',          route:'/passport/profile' },
    { num:'02', label:'Connections',   icon:'hub',            route:'/passport/connections' },
    { num:'03', label:'Directory',     icon:'contact_page',   route:'/passport/directory' },
    { num:'04', label:'Stamps',        icon:'workspace_premium', route:'/passport/stamps' },
    { num:'05', label:'Legacy Record', icon:'history_edu',    route:'/passport/benefits' },
  ]
  const ACTIONS = [
    { icon:'qr_code_scanner', label:'Scan to Connect', color:C.gold,    action:() => { triggerHaptic('medium'); setModal('scan') } },
    { icon:'contact_page',    label:'Explore Directory',color:C.stampGrn,action:() => navigate('/passport/directory') },
    { icon:'hub',             label:'View Matches',    color:C.stampPur, action:() => navigate('/passport/connections') },
    { icon:'event',           label:'Join an Event',   color:C.stampBlu, action:() => navigate('/passport/events') },
    { icon:'redeem',          label:'Benefits',        color:C.stampRed, action:() => navigate('/passport/benefits') },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:112 }}>

      {/* ════════════════════════════════════════════════════
          LEATHER COVER
      ════════════════════════════════════════════════════ */}
      <div style={{ background:`linear-gradient(180deg,${C.leather} 0%,${C.leatherMid} 100%)`,
        padding:'0 0 0', position:'relative', overflow:'hidden' }}>

        {/* Leather grain overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <LeatherGrain/>
        </div>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px 12px', position:'relative', zIndex:3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8,
              background:`${C.gold}18`, border:`1.5px solid ${C.gold}50`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:19, color:C.gold, ...FILL1 }}>menu_book</span>
            </div>
            <div>
              <p style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLight}60`, letterSpacing:'0.2em' }}>BY PROFOUND INNOVATIONS</p>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:13, color:C.goldLight, letterSpacing:'0.06em' }}>360 LEGACY PASSPORT™</p>
            </div>
          </div>
          <button onClick={() => { triggerHaptic('light'); setMuted(m => !m) }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99,
              border:`1px solid ${C.gold}35`, background:muted?`${C.stampRed}18`:`${C.gold}10`,
              cursor:'pointer', fontFamily:MONO, fontSize:8.5, color:muted?'#e88':C.goldLight }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color:muted?'#e88':C.gold, ...FILL1 }}>
              {muted?'volume_off':'volume_up'}
            </span>
            {muted?'Muted':'Mute'}
          </button>
        </div>

        {/* ── PHYSICAL PASSPORT BOOK ─────────────────────── */}
        <div style={{ margin:'0 12px 16px', position:'relative', zIndex:3 }}>
          {/* Book shadow */}
          <div style={{ position:'absolute', bottom:-8, left:6, right:6, height:20,
            borderRadius:'50%', background:'rgba(0,0,0,0.35)', filter:'blur(8px)' }}/>

          {/* The book */}
          <div style={{ borderRadius:8, overflow:'hidden',
            boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
            border:`1px solid ${C.gold}25` }}>

            {/* Book cover stripe */}
            <div style={{ background:`linear-gradient(180deg,#2A1C0A 0%,${C.leather} 100%)`,
              padding:'18px 16px 14px', position:'relative', overflow:'hidden' }}>
              <LeatherGrain/>
              {/* Embossed border */}
              <div style={{ position:'absolute', inset:6, border:`1px solid ${C.gold}30`, borderRadius:4, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', inset:9, border:`0.5px solid ${C.gold}18`, borderRadius:2, pointerEvents:'none' }}/>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, position:'relative', zIndex:2 }}>
                {/* Left: emblem */}
                <div style={{ opacity:0.9 }}><B360Emblem size={54} color={C.goldLight}/></div>

                {/* Center text */}
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:18, color:C.goldLight,
                    letterSpacing:'0.1em', lineHeight:1 }}>BROTHERHOOD</p>
                  <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:22, color:C.gold,
                    letterSpacing:'0.06em', lineHeight:1, margin:'2px 0' }}>360</p>
                  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:'4px 0' }}/>
                  <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.goldLight}70`,
                    letterSpacing:'0.22em', textTransform:'uppercase' }}>LEGACY PASSPORT</p>
                  <p style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLight}40`,
                    letterSpacing:'0.14em', marginTop:2 }}>by Profound Innovations</p>
                </div>

                {/* Right: QR + scan */}
                <Tap onClick={() => { triggerHaptic('medium'); setModal('scan') }}
                  style={{ opacity:0.85 }}>
                  <QrGraphic size={44} color={C.goldLight}/>
                </Tap>
              </div>
            </div>

            {/* ── Open book interior: identity page ─────── */}
            <div style={{ display:'flex', minHeight:200, background:C.spine }}>
              {/* Spine shadow */}
              <div style={{ width:8, background:`linear-gradient(90deg,rgba(0,0,0,0.5),rgba(0,0,0,0.1))`, flexShrink:0 }}/>

              {/* Right page — identity */}
              <div style={{ flex:1, background:`linear-gradient(150deg,${C.pageLight} 0%,${C.page} 60%,${C.pageDark} 100%)`,
                position:'relative', overflow:'hidden', padding:'12px 14px 18px' }}>
                <PageRules rows={18} op={0.8}/>
                {/* Watermark */}
                <div style={{ position:'absolute', right:-14, bottom:-14, opacity:0.06, pointerEvents:'none' }}>
                  <B360Emblem size={130} color={C.goldDark}/>
                </div>

                <div style={{ position:'relative', zIndex:2 }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <p style={{ fontFamily:MONO, fontSize:7, color:C.pageFaint, letterSpacing:'0.18em' }}>PASSPORT IDENTITY</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:14, color:C.pageText }}>
                        {profile.displayName}
                      </p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontFamily:MONO, fontSize:7, color:C.pageFaint, letterSpacing:'0.1em' }}>PASSPORT No.</p>
                      <p style={{ fontFamily:MONO, fontWeight:700, fontSize:9, color:C.pageText }}>{profile.passportId}</p>
                    </div>
                  </div>

                  {/* Fields grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 14px', marginBottom:10 }}>
                    {[
                      { label:'Tier',        value:profile.tier?.toUpperCase() },
                      { label:'Member Since', value:profile.memberSince },
                      { label:'Legacy Score', value:`${profile.xp} pts` },
                      { label:'Status',       value:profile.status },
                    ].map(f => (
                      <div key={f.label} style={{ borderBottom:`1px solid ${C.inkLine}`, paddingBottom:3 }}>
                        <p style={{ fontFamily:MONO, fontSize:6.5, color:C.pageFaint, letterSpacing:'0.12em', textTransform:'uppercase' }}>{f.label}</p>
                        <p style={{ fontFamily:SERIF, fontWeight:600, fontSize:11.5, color:C.pageText }}>{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* XP bar */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontFamily:MONO, fontSize:7, color:C.pageFaint, letterSpacing:'0.1em' }}>LEGACY SCORE</span>
                      <span style={{ fontFamily:MONO, fontSize:7, color:C.gold }}>{xpPct}%</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:C.inkFaint, border:`1px solid ${C.inkMed}` }}>
                      <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2,
                        background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
                    </div>
                  </div>

                  {/* Scan row */}
                  <Tap onClick={() => { triggerHaptic('medium'); setModal('scan') }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                      background:`rgba(0,0,0,0.06)`, border:`1px solid ${C.inkMed}`, borderRadius:7 }}>
                    <QrGraphic size={32} color={C.pageText}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:SANS, fontWeight:700, fontSize:11.5, color:C.pageText }}>360 Passport Connection</p>
                      <p style={{ fontFamily:MONO, fontSize:7.5, color:C.pageFaint }}>Scan to connect · Active session</p>
                    </div>
                    <div style={{ padding:'5px 12px', borderRadius:6, background:C.gold, cursor:'pointer',
                      boxShadow:`0 2px 6px rgba(196,146,42,0.3)` }}>
                      <span style={{ fontFamily:SANS, fontWeight:700, fontSize:11, color:'#fff' }}>SCAN</span>
                    </div>
                  </Tap>

                  {/* MRZ */}
                  <div style={{ marginTop:8, borderTop:`1px solid ${C.inkMed}`, paddingTop:6 }}>
                    <div style={{ fontFamily:OCR, fontSize:8, color:C.pageFaint, letterSpacing:'0.06em', lineHeight:1.6 }}>
                      <div>P&lt;USA{profile.displayName?.toUpperCase().replace(' ','<<').padEnd(39,'<').slice(0,39)}</div>
                      <div>{profile.passportId?.padEnd(9,'<')}0USA9512016M</div>
                    </div>
                    <p style={{ fontFamily:MONO, fontSize:6.5, color:`${C.pageFaint}60`, letterSpacing:'0.16em', marginTop:2 }}>MACHINE READABLE ZONE</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ textAlign:'center', fontFamily:MONO, fontSize:7.5, color:`${C.goldLight}35`,
          letterSpacing:'0.22em', padding:'0 0 14px', position:'relative', zIndex:3 }}>
          YOUR JOURNEY · YOUR STAMP · YOUR LEGACY
        </p>
      </div>

      {/* ════════════════════════════════════════════════════
          OPEN PASSPORT BODY
      ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'16px 12px 0' }}>

        {/* ── HOW IT WORKS ────────────────────────────────── */}
        <PageSection title="How It Works"
          right={
            <button onClick={() => { triggerHaptic('light'); setGuideStep(1) }}
              style={{ fontFamily:MONO, fontSize:8.5, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>
              Full guide →
            </button>
          }
          style={{ marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { num:1, icon:'qr_code_scanner', title:'Scan In',       sub:'Enter a service or event using your QR passport.' },
              { num:2, icon:'person_edit',     title:'Build Profile',  sub:'Share your story, interests, and goals.' },
              { num:3, icon:'hub',             title:'Meet People',    sub:'Connect with verified members.' },
              { num:4, icon:'workspace_premium',title:'Earn Stamps',   sub:'Collect stamps, gain access, perks, and grow legacy.' },
            ].map(s => (
              <Tap key={s.num} onClick={() => { triggerHaptic('light'); setGuideStep(s.num) }}>
                <BookPage side="right" style={{ padding:'11px 9px 13px' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:5 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:C.leather,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontFamily:MONO, fontWeight:700, fontSize:10, color:C.gold }}>{s.num}</span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:C.goldDark, ...FILL1 }}>{s.icon}</span>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:10.5, color:C.pageText, lineHeight:1.2 }}>{s.title}</p>
                    <p style={{ fontFamily:SANS, fontSize:8, color:C.pageFaint, lineHeight:1.4 }}>{s.sub}</p>
                  </div>
                </BookPage>
              </Tap>
            ))}
          </div>
        </PageSection>

        {/* ── TABLE OF CONTENTS + QUICK ACTIONS ───────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:10, marginBottom:14 }}>

          {/* TOC page */}
          <BookPage side="left" folio="PAGE 01" style={{ padding:'12px 14px 20px' }}>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.pageText, textAlign:'center',
              marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase' }}>Pages</p>
            <div style={{ height:1, background:C.inkLine, marginBottom:10 }}/>
            {TOCS.map(t => (
              <Tap key={t.num} onClick={() => { triggerHaptic('light'); navigate(t.route) }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                  borderBottom:`1px solid ${C.inkFaint}` }}>
                <span style={{ fontFamily:MONO, fontWeight:700, fontSize:10, color:C.gold, minWidth:20 }}>{t.num}</span>
                <span className="material-symbols-outlined" style={{ fontSize:14, color:C.pageFaint, ...FILL1 }}>{t.icon}</span>
                <span style={{ fontFamily:SERIF, fontSize:12, color:C.pageText, flex:1 }}>{t.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize:13, color:`${C.pageFaint}60` }}>chevron_right</span>
              </Tap>
            ))}
          </BookPage>

          {/* Quick actions page */}
          <BookPage side="right" folio="START HERE" style={{ padding:'12px 14px 20px' }}>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.pageText, textAlign:'center',
              marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase' }}>Your Next Actions</p>
            <div style={{ height:1, background:C.inkLine, marginBottom:10 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              {ACTIONS.map(a => (
                <Tap key={a.label} onClick={a.action}
                  style={{ padding:'9px 9px 10px', background:`rgba(0,0,0,0.05)`,
                    border:`1px solid ${a.color}25`, borderRadius:8,
                    display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:4 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${a.color}14`,
                    border:`1px solid ${a.color}30`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:17, color:a.color, ...FILL1 }}>{a.icon}</span>
                  </div>
                  <span style={{ fontFamily:SANS, fontWeight:700, fontSize:9.5, color:C.pageText, lineHeight:1.2 }}>{a.label}</span>
                </Tap>
              ))}
            </div>
          </BookPage>
        </div>

        {/* ── STAMPS PAGE ──────────────────────────────────── */}
        <PageSection title="Achievement Stamps"
          right={
            <button onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}
              style={{ fontFamily:MONO, fontSize:8.5, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
              View All →
            </button>
          }
          style={{ marginBottom:14 }}>
          <BookPage side="right" folio="STAMPS · PAGE 04" style={{ padding:'16px 14px 22px' }}>
            {/* Large faint emblem */}
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', opacity:0.04, pointerEvents:'none', zIndex:0 }}>
              <B360Emblem size={200} color={C.goldDark}/>
            </div>
            <div style={{ position:'relative', zIndex:2 }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.pageText,
                textAlign:'center', marginBottom:4, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {STAMPS.filter(s=>s.earned).length} of {STAMPS.length} Stamps Earned
              </p>
              <div style={{ height:1, background:C.inkLine, marginBottom:16 }}/>
              {/* Stamp grid — 5 across */}
              <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                {STAMPS.map((stamp, i) => (
                  <InkStamp key={stamp.id}
                    size={62}
                    color={STAMP_COLORS[i % STAMP_COLORS.length]}
                    icon={stamp.icon}
                    label={stamp.label}
                    earned={stamp.earned}
                    tilt={(i%2===0 ? 1 : -1) * (i%3+1)}
                    onClick={() => { triggerHaptic('light'); setSelStamp(stamp) }}/>
                ))}
              </div>
              <div style={{ marginTop:16, borderTop:`1px solid ${C.inkLine}`, paddingTop:10, textAlign:'center' }}>
                <p style={{ fontFamily:MONO, fontSize:7, color:`${C.pageFaint}70`,
                  letterSpacing:'0.18em', textTransform:'uppercase' }}>
                  AUTHENTICATED · BROTHERHOOD 360 · PROFOUND INNOVATIONS LLC
                </p>
              </div>
            </div>
          </BookPage>
        </PageSection>

        {/* ── EVENTS + ACTIVITY ────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>

          {/* Events */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <div style={{ width:3, height:12, borderRadius:2, background:C.gold }}/>
              <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.goldLight }}>Upcoming Events</span>
              <div style={{ flex:1, height:1, background:`${C.gold}20` }}/>
              <button onClick={() => { triggerHaptic('light'); navigate('/passport/events') }}
                style={{ fontFamily:MONO, fontSize:8, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>See All →</button>
            </div>
            <BookPage side="left" folio="PAGE 07" style={{ padding:'10px 12px 20px' }}>
              {events.map((ev, i) => (
                <Tap key={ev.id} onClick={() => { triggerHaptic('light'); setSelEvent(ev) }}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 0',
                    borderBottom: i<events.length-1 ? `1px solid ${C.inkFaint}` : 'none' }}>
                  <div style={{ minWidth:34, textAlign:'center', background:C.leather,
                    borderRadius:6, padding:'3px 5px', flexShrink:0 }}>
                    <p style={{ fontFamily:MONO, fontSize:6, color:`${C.goldLight}50` }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.goldLight, lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:11, color:C.pageText, lineHeight:1.2 }}>{ev.name}</p>
                    <p style={{ fontFamily:SANS, fontSize:8.5, color:C.pageFaint }}>{ev.venue} · {ev.city}</p>
                  </div>
                  {(rsvpdIds.has(ev.id)||ev.rsvpd)
                    ? <span style={{ fontFamily:MONO, fontSize:7, color:C.stampGrn }}>RSVP'd</span>
                    : <span className="material-symbols-outlined" style={{ fontSize:13, color:`${C.gold}70` }}>chevron_right</span>}
                </Tap>
              ))}
              <button onClick={async () => {
                triggerHaptic('success')
                await Promise.all(events.map(e => rsvpToEvent(e.id)))
                setRsvpdIds(new Set(events.map(e => e.id)))
                showToast('RSVP confirmed for all events.')
              }} style={{ width:'100%', marginTop:10, padding:'7px', borderRadius:7,
                border:`1px solid ${C.gold}40`, background:`${C.gold}08`,
                fontFamily:MONO, fontWeight:700, fontSize:8, color:C.gold, cursor:'pointer',
                letterSpacing:'0.1em', textTransform:'uppercase' }}>
                RSVP TO ALL EVENTS
              </button>
            </BookPage>
          </div>

          {/* Activity */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <div style={{ width:3, height:12, borderRadius:2, background:C.gold }}/>
              <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.goldLight }}>Recent Activity</span>
              <div style={{ flex:1, height:1, background:`${C.gold}20` }}/>
            </div>
            <BookPage side="right" folio="PAGE 08" style={{ padding:'10px 12px 10px 28px' }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <Tap key={a.id} onClick={() => triggerHaptic('light')}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 0',
                    borderBottom: i<RECENT_ACTIVITY.length-1 ? `1px solid ${C.inkFaint}` : 'none' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:`${a.color}14`,
                    border:`1px solid ${a.color}25`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:13, color:a.color, ...FILL1 }}>{a.icon}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:10, color:C.pageText }}>{a.label}</p>
                    <p style={{ fontFamily:SANS, fontSize:8, color:C.pageFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.detail}</p>
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:7.5, color:`${C.pageFaint}80`, flexShrink:0 }}>{a.time}</span>
                </Tap>
              ))}
            </BookPage>
          </div>
        </div>

        {/* ── PROFILE / IDENTITY STRIP ─────────────────────── */}
        <Tap onClick={() => { triggerHaptic('light'); setModal('profile') }}
          style={{ marginBottom:10 }}>
          <div style={{ background:`linear-gradient(135deg,${C.leatherMid} 0%,${C.leather} 100%)`,
            borderRadius:10, border:`1px solid ${C.gold}40`,
            boxShadow:'0 4px 16px rgba(10,7,4,0.3)', overflow:'hidden', position:'relative' }}>
            <LeatherGrain/>
            <div style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', opacity:0.08 }}>
              <B360Emblem size={110} color={C.goldLight}/>
            </div>
            <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
              {/* Photo badge */}
              <div style={{ width:46, height:52, borderRadius:5, flexShrink:0,
                background:`${C.gold}18`, border:`1.5px solid ${C.gold}50`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.gold }}>{profile.initials}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.goldLight }}>{profile.displayName}</p>
                <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.goldLight}55`, letterSpacing:'0.08em' }}>
                  {profile.tier?.toUpperCase()} MEMBER · PASSPORT #{profile.passportId?.slice(-6)}
                </p>
                <div style={{ height:3, borderRadius:2, background:`${C.gold}20`, marginTop:5 }}>
                  <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2,
                    background:`linear-gradient(90deg,${C.goldDark},${C.gold})` }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                <GBtn sm dark outline onClick={e => { e.stopPropagation(); triggerHaptic('light'); navigate('/passport/profile') }}>Edit</GBtn>
                <GBtn sm dark onClick={e => { e.stopPropagation(); triggerHaptic('light'); setModal('profile') }}>View</GBtn>
              </div>
            </div>
            {/* MRZ footer */}
            <div style={{ borderTop:`1px solid ${C.gold}20`, padding:'4px 14px', background:'rgba(0,0,0,0.2)' }}>
              <div style={{ fontFamily:OCR, fontSize:7.5, color:`${C.goldLight}40`, letterSpacing:'0.07em' }}>
                P&lt;USA{profile.displayName?.toUpperCase().replace(' ','<<')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;{profile.passportId}0USA
              </div>
            </div>
          </div>
        </Tap>

        <p style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLight}22`, textAlign:'center',
          letterSpacing:'0.22em', marginBottom:6 }}>
          PROFOUND INNOVATIONS LLC · 360 PASSPORT CONNECTIONS · ALL RIGHTS RESERVED
        </p>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modal==='scan' && (
          <ScanModal key="scan" muted={muted} onClose={() => setModal(null)}
            onResult={r => { setModal(null); setTimeout(() => handleScanResult(r), 60) }}/>
        )}
        {modal==='scan-result' && scanResult && (
          <ScanResultModal key="sr" result={scanResult} muted={muted}
            onClose={closeModal} onAction={handleAction}
            onShowOverlay={type => { closeModal(); setTimeout(() => handleOverlay(type), 60) }}/>
        )}
        {overlayOn && <StampOverlay key="overlay" muted={muted} onDone={() => setOverlayOn(false)}/>}
        {modal==='profile' && <ProfileModal key="profile" profile={profile} onClose={closeModal}/>}
        {modal==='admin' && <AdminPanel key="admin" onClose={closeModal}/>}
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
