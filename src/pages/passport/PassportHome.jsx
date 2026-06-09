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

/* ─── Palette — warm parchment, NOT dark ──────────────────────── */
const C = {
  bg:       '#F0E3C4',   /* warm parchment page */
  bgAlt:    '#E8D5A8',   /* slightly darker parchment */
  cover:    '#2E1A08',   /* dark leather cover (only at top) */
  coverMid: '#3D2410',
  spine:    '#1E1005',
  card:     '#FAF3E2',   /* card surface — cream white */
  cardAlt:  '#F2E8CE',
  ink:      '#1C0E02',   /* deep ink text */
  inkMed:   'rgba(28,14,2,0.5)',
  inkFaint: 'rgba(28,14,2,0.18)',
  inkLine:  'rgba(28,14,2,0.12)',
  gold:     '#C07820',   /* saturated warm gold */
  goldDk:   '#8A5510',
  goldLt:   '#E8B84A',
  goldPale: '#F5D98A',
  amber:    '#D4820A',
  teal:     '#1A6B5A',
  blue:     '#1A3E6B',
  purple:   '#4E1F7A',
  crimson:  '#8B1A1A',
  green:    '#1A5A2E',
  border:   'rgba(192,120,32,0.35)',
  borderSt: 'rgba(192,120,32,0.65)',
}
const SERIF = '"Playfair Display",Georgia,serif'
const MONO  = '"JetBrains Mono","Courier New",monospace'
const SANS  = '"Hanken Grotesk",system-ui,sans-serif'
const OCR   = '"JetBrains Mono","Courier New",monospace'
const FILL1 = { fontVariationSettings:"'FILL' 1" }

/* ─── Ruling lines ─────────────────────────────────────────────── */
function PageRules({ rows = 16, color = C.inkLine, op = 1 }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {[...Array(rows)].map((_,i) => (
        <div key={i} style={{ position:'absolute', left:0, right:0,
          top:`${(i+1) * (100/(rows+1))}%`, height:1, background:color, opacity:op }}/>
      ))}
    </div>
  )
}

/* ─── Leather grain ────────────────────────────────────────────── */
function Grain({ op = 0.05 }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:op, pointerEvents:'none' }}
      viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      {[...Array(40)].map((_,i) => (
        <ellipse key={i} cx={(i%10)*22+(Math.floor(i/10)%2)*11} cy={Math.floor(i/10)*36}
          rx={10+i%5} ry={2} fill="none" stroke="#fff" strokeWidth={0.35} opacity={0.4+(i%3)*0.15}/>
      ))}
    </svg>
  )
}

/* ─── Emblem SVG ───────────────────────────────────────────────── */
function Emblem({ size=70, color=C.goldLt, op=1 }) {
  const cx = size/2, r = cx-5
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity:op }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={1.5}/>
      <circle cx={cx} cy={cx} r={r-9} fill="none" stroke={color} strokeWidth={0.7} strokeDasharray="3 2"/>
      <ellipse cx={cx} cy={cx} rx={(r-13)*0.6} ry={r-13} fill="none" stroke={color} strokeWidth={0.8}/>
      {[-35,-12,11,34].map((yo,i) => (
        <line key={i} x1={6} y1={cx+yo} x2={size-6} y2={cx+yo} stroke={color} strokeWidth={0.4} opacity={0.55}/>
      ))}
      {[...Array(8)].map((_,i) => {
        const a=(i*45)*Math.PI/180
        return <line key={i} x1={cx+Math.cos(a)*10} y1={cx+Math.sin(a)*10}
          x2={cx+Math.cos(a)*(r-10)} y2={cx+Math.sin(a)*(r-10)} stroke={color} strokeWidth={0.6} opacity={0.6}/>
      })}
      <circle cx={cx} cy={cx} r={10} fill={`${color}18`} stroke={color} strokeWidth={0.7}/>
      <text x={cx} y={cx+3} textAnchor="middle" fontFamily={MONO} fontSize={size*0.12} fontWeight={700} fill={color}>360</text>
    </svg>
  )
}

/* ─── Ink stamp ────────────────────────────────────────────────── */
function InkStamp({ size=68, color, icon, label, earned=true, onClick, tilt=0 }) {
  const [pr, setPr] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ background:'none', border:'none', cursor:'pointer', padding:0,
        transform:`rotate(${tilt}deg) scale(${pr?0.88:1})`, transition:'transform .12s',
        opacity: earned ? 1 : 0.22 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={37} fill={`${color}10`} stroke={color} strokeWidth={2.2} strokeDasharray="4 1.5" opacity={0.9}/>
          <circle cx={40} cy={40} r={30} fill={`${color}08`} stroke={color} strokeWidth={1.1} opacity={0.7}/>
          <circle cx={40} cy={40} r={23} fill="none" stroke={color} strokeWidth={0.5} opacity={0.5}/>
          {[...Array(12)].map((_,i) => {
            const a=(i*30)*Math.PI/180
            return <line key={i} x1={40+Math.cos(a)*17} y1={40+Math.sin(a)*17}
              x2={40+Math.cos(a)*28} y2={40+Math.sin(a)*28} stroke={color} strokeWidth={0.7} opacity={0.55}/>
          })}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:1 }}>
          <span className="material-symbols-outlined" style={{ fontSize:size*0.31, color, ...FILL1 }}>{icon}</span>
          <span style={{ fontFamily:MONO, fontSize:size*0.1, color, fontWeight:700,
            letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</span>
        </div>
        {earned && (
          <div style={{ position:'absolute', top:1, right:1, width:16, height:16, borderRadius:'50%',
            background:color, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 1px 4px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:10, color:'#fff', ...FILL1 }}>check</span>
          </div>
        )}
      </div>
    </button>
  )
}

/* ─── QR graphic ───────────────────────────────────────────────── */
function QrGraphic({ size=42, color=C.ink }) {
  const s=size/7
  const pat=[[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
             [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pat.map((row,ri) => row.map((v,ci) => v
        ? <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1} fill={color} opacity={0.75}/>
        : null))}
    </svg>
  )
}

/* ─── Tap wrapper ──────────────────────────────────────────────── */
function Tap({ onClick, children, style={} }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ transform:pr?'scale(0.96)':'scale(1)', transition:'transform .1s',
        cursor:onClick?'pointer':'default', ...style }}>
      {children}
    </div>
  )
}

/* ─── Gold button ──────────────────────────────────────────────── */
function GBtn({ children, onClick, outline=false, full=false, sm=false, style={} }) {
  const [pr, setPr] = useState(false)
  const bg = outline ? 'transparent' : pr ? C.goldDk : C.gold
  const fg = outline ? C.gold : '#fff'
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width:full?'100%':'auto', padding:sm?'0 14px':'0 20px', height:sm?38:46, borderRadius:9,
        border:outline?`1.5px solid ${C.gold}`:'none', background:bg, color:fg,
        fontFamily:SANS, fontWeight:700, fontSize:sm?12:14, cursor:'pointer',
        transform:pr?'scale(0.96)':'scale(1)', transition:'all .12s',
        boxShadow:outline?'none':`0 3px 12px rgba(192,120,32,0.32)`, ...style }}>
      {children}
    </button>
  )
}

/* ─── Section header ───────────────────────────────────────────── */
function SH({ title, right, style={} }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, ...style }}>
      <div style={{ width:4, height:18, borderRadius:2, background:C.gold, flexShrink:0 }}/>
      <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:C.ink }}>{title}</span>
      <div style={{ flex:1, height:1, background:C.border, marginLeft:4 }}/>
      {right}
    </div>
  )
}

/* ─── Vivid tile ───────────────────────────────────────────────── */
function Tile({ icon, label, sub, color, onClick, accent }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ background: pr ? `${color}20` : C.card,
        border:`1.5px solid ${color}50`,
        borderLeft:`4px solid ${color}`,
        borderRadius:12,
        padding:'14px 12px 14px',
        cursor:'pointer',
        transform: pr ? 'scale(0.96) translateY(1px)' : 'scale(1)',
        boxShadow: pr ? `0 2px 8px ${color}20` : `0 3px 12px rgba(28,14,2,0.1), 0 1px 4px ${color}18`,
        transition:'all .12s',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:8 }}>
      <div style={{ width:44, height:44, borderRadius:12,
        background:`linear-gradient(135deg,${color}20,${color}35)`,
        border:`1.5px solid ${color}50`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 2px 8px ${color}25` }}>
        <span className="material-symbols-outlined" style={{ fontSize:22, color, ...FILL1 }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.ink, lineHeight:1.2 }}>{label}</p>
        {sub && <p style={{ fontFamily:SANS, fontSize:11, color:C.inkMed, lineHeight:1.35, marginTop:2 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Nav badge ────────────────────────────────────────────────── */
function NavBadge({ label, abbr, color, onClick, active }) {
  const [pr, setPr] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'4px 2px',
        background:'none', border:'none', cursor:'pointer', minWidth:52,
        transform: pr ? 'scale(0.88)' : 'scale(1)', transition:'transform .1s' }}>
      <div style={{ width:36, height:36, borderRadius:10,
        background: active ? color : `${color}18`,
        border:`1.5px solid ${active ? color : `${color}50`}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: active ? `0 2px 8px ${color}40` : 'none',
        transition:'all .15s' }}>
        <span style={{ fontFamily:MONO, fontWeight:700, fontSize:10,
          color: active ? '#fff' : color, letterSpacing:'0.05em' }}>{abbr}</span>
      </div>
      <span style={{ fontFamily:MONO, fontSize:8, color: active ? color : C.inkMed,
        letterSpacing:'0.08em', fontWeight: active ? 700 : 400 }}>{label}</span>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════════ */
function ModalShell({ onClose, children }) {
  useEffect(() => {
    const k = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(28,14,2,0.65)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'18px 18px 0 0', background:C.card, borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(28,14,2,0.3)', maxHeight:'90vh',
          overflowY:'auto', scrollbarWidth:'none', padding:'14px 20px 48px' }}>
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
    const k = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(28,14,2,0.65)', backdropFilter:'blur(8px)' }}/>
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:maxW, borderRadius:14,
          background:C.card, border:`2px solid ${C.gold}`,
          boxShadow:'0 24px 60px rgba(28,14,2,0.35)', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {children}
      </motion.div>
    </div>
  )
}

function FactBox({ children }) {
  return <div style={{ background:C.bgAlt, borderRadius:10, padding:'10px 14px', border:`1px solid ${C.border}` }}>{children}</div>
}
function FactRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.inkLine}` }}>
      <span style={{ fontFamily:MONO, fontSize:10, color:C.inkMed, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:color||C.ink }}>{value}</span>
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
    setState('idle'); if (!muted) playSuccessTone(); triggerHaptic('success'); onClose(); onResult(res)
  }
  return (
    <ModalShell onClose={onClose}>
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:C.ink, textAlign:'center', marginBottom:4 }}>Scan Passport</p>
      <p style={{ fontFamily:SANS, fontSize:14, color:C.inkMed, textAlign:'center', lineHeight:1.55, marginBottom:16 }}>
        Point at any 360 Passport QR to verify.
      </p>
      <div style={{ width:150, height:150, margin:'0 auto 18px', borderRadius:12,
        background:`${C.bgAlt}`, border:`2px solid ${C.border}`, position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
          <div key={i} style={{ position:'absolute', width:18, height:18,
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
        <QrGraphic size={70}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
        {SIMS.map(s => (
          <button key={s.type} onClick={()=>simulate(s.type)} disabled={state==='scanning'}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10,
              border:`1px solid ${C.border}`, background:`${C.gold}08`, cursor:'pointer',
              fontFamily:SANS, fontWeight:600, fontSize:14, color:C.ink, textAlign:'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <GBtn full outline onClick={onClose}>Close</GBtn>
    </ModalShell>
  )
}

function ResultHead({ icon, iconColor, badge, title }) {
  return (
    <div style={{ textAlign:'center', marginBottom:14 }}>
      <div style={{ width:58, height:58, borderRadius:'50%', background:`${iconColor}14`,
        border:`1.5px solid ${iconColor}35`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize:28, color:iconColor, ...FILL1 }}>{icon}</span>
      </div>
      {badge && <span style={{ display:'inline-block', fontFamily:MONO, fontSize:9, color:iconColor,
        background:`${iconColor}10`, border:`1px solid ${iconColor}25`, padding:'2px 12px',
        borderRadius:99, marginBottom:6, letterSpacing:'0.12em' }}>{badge}</span>}
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.ink }}>{title}</p>
    </div>
  )
}

function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  if (!result) return null
  const { sourceType, data } = result
  if (!result.success||sourceType==='invalid') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="error" iconColor={C.crimson} badge="INVALID CODE" title="Invalid Passport Code"/>
      <FactBox><p style={{ fontFamily:SANS, fontSize:14, color:C.ink, lineHeight:1.6, textAlign:'center', padding:'4px 0 8px' }}>This code is not connected to 360 Passport Connections.</p></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={()=>{ triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='venue') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="store" iconColor={C.teal} badge="CHECK-IN" title="Venue Check-In Verified"/>
      <FactBox><FactRow label="Venue" value={data.name}/><FactRow label="Location" value={`${data.city}, ${data.state}`}/><FactRow label="Stamps" value={`${data.availableStamps?.length} available`}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose() }}>Start Passport Session</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='event') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="event" iconColor={C.blue} badge="CHECK-IN" title="Event Check-In Verified"/>
      <FactBox><FactRow label="Event" value={data.name}/><FactRow label="Venue" value={data.venue}/><FactRow label="Stamp" value={data.stampName} color={C.green}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose() }}>Claim Event Stamp</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='member') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="person" iconColor={C.green} badge="MATCH FOUND" title="Connection Found"/>
      <FactBox><FactRow label="Member" value={data.name}/><FactRow label="Role" value={`${data.role} @ ${data.company}`}/><FactRow label="Match Score" value={`${data.matchScore}%`} color={C.gold}/><FactRow label="Trust" value={data.trustStatus} color={C.green}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose() }}>Verify Connection</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='stamp') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="workspace_premium" iconColor={C.amber} badge="AUTHENTICATED" title="Stamp Ready to Claim"/>
      <FactBox><FactRow label="Stamp" value={data.name}/><FactRow label="Category" value={data.category?.toUpperCase()}/><FactRow label="Status" value={data.authenticated?'Authenticated ✓':'Pending'} color={data.authenticated?C.green:C.crimson}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await claimStamp(data.id,'current'); onShowOverlay('stamp'); onClose() }}>Claim Stamp</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if (sourceType==='benefit') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="redeem" iconColor={C.crimson} badge="UNLOCKED" title="Benefit Unlocked"/>
      <FactBox><FactRow label="Benefit" value={data.name}/><FactRow label="Provider" value={data.provider}/><FactRow label="Expires" value={data.expiration}/></FactBox>
      <p style={{ fontFamily:SANS, fontSize:13, color:C.inkMed, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>{data.redemption}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await redeemBenefit(data.id); onShowOverlay('benefit'); onClose() }}>Redeem Benefit</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  return null
}

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
        style={{ position:'absolute', inset:0, background:'rgba(28,14,2,0.8)', backdropFilter:'blur(14px)' }}/>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:270, borderRadius:18, padding:'30px 22px 26px',
          background:C.card, border:`2.5px solid ${C.gold}`,
          boxShadow:'0 20px 60px rgba(28,14,2,0.4)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step==='updating'
            ? <motion.div key="upd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  border:`3px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'spinGold 1.2s linear infinite' }}>
                  <style>{`@keyframes spinGold{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <span className="material-symbols-outlined" style={{ fontSize:30, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.ink }}>Updating Passport…</p>
              </motion.div>
            : <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
                  background:`${C.gold}14`, border:`2px solid ${C.gold}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:36, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:22, color:C.ink, marginBottom:4 }}>Stamp Awarded</p>
                <p style={{ fontFamily:MONO, fontSize:10, color:C.gold, letterSpacing:'0.14em', marginBottom:18 }}>PASSPORT UPDATED</p>
                <GBtn full onClick={onDone}>Continue</GBtn>
              </motion.div>}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function StampDetailModal({ stamp, onClose }) {
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ background:C.bgAlt, borderRadius:'12px 12px 0 0', padding:'22px 18px 18px',
        borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
        <div style={{ margin:'0 auto 10px', width:72, height:72, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <InkStamp size={72} color={stamp.color||C.crimson} icon={stamp.icon} label={stamp.label} earned={stamp.earned} tilt={-3}/>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.ink }}>{stamp.name}</p>
      </div>
      <div style={{ padding:'14px 18px 22px' }}>
        <p style={{ fontFamily:SANS, fontSize:14, color:C.ink, lineHeight:1.65, marginBottom:12 }}>{stamp.description}</p>
        <FactBox><FactRow label="Requirement" value={stamp.requirement}/><FactRow label="Status" value={stamp.earned?'Earned ✓':'Not yet earned'} color={stamp.earned?C.green:C.crimson}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  async function handleRsvp() { setLoading(true); triggerHaptic('success'); await rsvpToEvent(event.id); setRsvpd(true); setLoading(false); onRsvp(event.id) }
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ minWidth:52, textAlign:'center', background:C.cover, borderRadius:10, padding:'7px 9px', flexShrink:0 }}>
          <p style={{ fontFamily:MONO, fontSize:8, color:`rgba(232,184,74,0.55)` }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.goldLt, lineHeight:1 }}>{event.date?.split(' ')[1]}</p>
        </div>
        <div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.ink }}>{event.name}</p>
          <p style={{ fontFamily:SANS, fontSize:13, color:C.inkMed }}>{event.venue} · {event.city} · {event.time}</p>
        </div>
      </div>
      <FactBox><FactRow label="Attendees" value={`${event.attendeeCount}/${event.capacity}`}/><FactRow label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct>85?C.crimson:C.green}/></FactBox>
      <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
        {rsvpd
          ? <div style={{ padding:'12px', background:`${C.green}12`, border:`1px solid ${C.green}28`, borderRadius:10, textAlign:'center' }}>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:14, color:C.green }}>✓ RSVP Confirmed</p>
            </div>
          : <GBtn full onClick={handleRsvp}>{loading?'Confirming…':'RSVP Now'}</GBtn>}
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
}

const GUIDES={
  1:{title:'Scan In',icon:'qr_code_scanner',body:'Enter a service or event using your QR passport. Tap Scan, point at any 360 Passport QR code, and your check-in is automatic.'},
  2:{title:'Build Profile',icon:'person_edit',body:'Share your story, interests, goals, and what matters. A richer profile means smarter matches and better introductions.'},
  3:{title:'Meet People',icon:'hub',body:'Connect with verified members and better matches. The app surfaces people based on shared events, goals, and industry overlap.'},
  4:{title:'Earn Stamps',icon:'workspace_premium',body:'Every verified interaction — venue check-in, connection, event — adds a passport stamp. Stamps unlock access, perks, and legacy.'},
}
function GuideModal({ step, onClose }) {
  const g = GUIDES[step]||GUIDES[1]
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ padding:'28px 22px 26px', textAlign:'center' }}>
        <div style={{ width:62, height:62, borderRadius:'50%', background:`${C.bgAlt}`, border:`1.5px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:30, color:C.ink, ...FILL1 }}>{g.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.ink, marginBottom:10 }}>{g.title}</p>
        <p style={{ fontFamily:SANS, fontSize:14, color:C.ink, lineHeight:1.7, marginBottom:22 }}>{g.body}</p>
        <GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Got It</GBtn>
      </div>
    </CenterModal>
  )
}

function ProfileModal({ profile, onClose }) {
  const xpPct = Math.round((profile.xp/profile.nextTierXp)*100)
  return (
    <CenterModal onClose={onClose} maxW={360}>
      <div style={{ background:C.cover, borderRadius:'12px 12px 0 0', padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <Grain op={0.07}/>
        <div style={{ position:'absolute', right:-20, top:-20, opacity:0.1 }}><Emblem size={160} color={C.goldLt}/></div>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ width:66, height:66, borderRadius:'50%', background:`${C.gold}22`,
            border:`2.5px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.gold }}>{profile.initials}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.goldLt }}>{profile.displayName}</p>
          <p style={{ fontFamily:SANS, fontSize:12, color:`rgba(232,184,74,0.55)`, marginTop:2 }}>{profile.role} @ {profile.company}</p>
          <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:9, color:C.gold,
            background:`${C.gold}18`, border:`1px solid ${C.gold}28`, padding:'3px 12px', borderRadius:99, letterSpacing:'0.12em' }}>
            {profile.tier?.toUpperCase()} MEMBER
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 18px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:C.inkMed, textTransform:'uppercase' }}>Legacy Score</span>
            <span style={{ fontFamily:MONO, fontSize:10, color:C.gold }}>{profile.xp} / {profile.nextTierXp}</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:C.bgAlt, border:`1px solid ${C.border}` }}>
            <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.goldDk},${C.gold})` }}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[{val:profile.verifiedConnections,label:'Connections'},{val:profile.stampsEarned,label:'Stamps'},{val:profile.eventsAttended,label:'Events'}].map(s => (
            <div key={s.label} style={{ textAlign:'center', background:C.bgAlt, borderRadius:9, padding:'10px 5px', border:`1px solid ${C.border}` }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.ink }}>{s.val}</p>
              <p style={{ fontFamily:MONO, fontSize:8.5, color:C.inkMed, textTransform:'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <FactBox><FactRow label="Passport ID" value={profile.passportId}/><FactRow label="Member Since" value={profile.memberSince}/><FactRow label="Status" value={profile.status} color={C.green}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

function AdminPanel({ onClose }) {
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const ITEMS = [
    {label:'Edit venue data',icon:'store',action:()=>setStatus('Edit src/data/venues.js')},
    {label:'Edit event data',icon:'event',action:()=>setStatus('Edit src/api/passportHomeApi.js')},
    {label:'Edit member data',icon:'people',action:()=>setStatus('Edit src/data/members.js')},
    {label:'Edit stamp data',icon:'workspace_premium',action:()=>setStatus('Edit src/data/stamps.js')},
    {label:'Edit benefit data',icon:'redeem',action:()=>setStatus('Edit src/data/benefits.js')},
  ]
  async function queueOpenAI() {
    const { requestOpenAIImageReplacement } = await import('../../api/passportScanApi.js')
    const res = await requestOpenAIImageReplacement('passport-hero', prompt||'Professional passport dashboard hero')
    setStatus(res.message)
  }
  return (
    <CenterModal onClose={onClose} maxW={400}>
      <div style={{ background:C.bgAlt, borderRadius:'12px 12px 0 0', padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:9 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold, ...FILL1 }}>admin_panel_settings</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.ink }}>Admin Source Panel</p>
      </div>
      <div style={{ padding:'14px 18px 24px' }}>
        {ITEMS.map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px',
              borderRadius:9, border:`1px solid ${C.border}`, background:C.bgAlt, cursor:'pointer',
              marginBottom:7, textAlign:'left', fontFamily:SANS, fontSize:13, color:C.ink }}
            onMouseEnter={e=>e.currentTarget.style.background=`${C.gold}10`}
            onMouseLeave={e=>e.currentTarget.style.background=C.bgAlt}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:13, marginTop:6 }}>
          <p style={{ fontFamily:MONO, fontSize:9, color:C.inkMed, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Image prompt…"
            style={{ width:'100%', padding:'9px 11px', borderRadius:9, border:`1px solid ${C.border}`,
              background:'#fff', color:C.ink, fontFamily:SANS, fontSize:13, marginBottom:8, outline:'none', boxSizing:'border-box' }}/>
          <button onClick={queueOpenAI}
            style={{ width:'100%', padding:'11px', borderRadius:9, border:`1px solid ${C.gold}`, background:`${C.gold}0A`,
              fontFamily:SANS, fontWeight:700, fontSize:13, color:C.gold, cursor:'pointer', marginBottom:8 }}>
            Queue OpenAI Request
          </button>
          {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.green, marginBottom:8 }}>{status}</p>}
        </div>
        <GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }} style={{ marginTop:13 }}>Close</GBtn>
      </div>
    </CenterModal>
  )
}

function Toast({ msg, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
          style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:C.card, border:`1.5px solid ${C.gold}`, borderRadius:12, padding:'11px 20px',
            display:'flex', alignItems:'center', gap:9, boxShadow:'0 8px 28px rgba(28,14,2,0.18)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:14, fontWeight:600, color:C.ink }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Bottom Nav with BADGES ───────────────────────────────────── */
function BottomNav({ onScan }) {
  const navigate = useNavigate()
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:640, margin:'0 auto',
        background:C.card, borderTop:`2px solid ${C.border}`,
        borderRadius:'20px 20px 0 0',
        boxShadow:'0 -6px 28px rgba(28,14,2,0.14)',
        paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'10px 8px 5px' }}>
          <NavBadge label="HOME" abbr="HM" color={C.gold} onClick={()=>{ triggerHaptic('light'); navigate('/passport') }} active={true}/>
          <NavBadge label="DIRECTORY" abbr="DIR" color={C.teal} onClick={()=>{ triggerHaptic('light'); navigate('/passport/directory') }}/>
          {/* Center scan badge */}
          <button onClick={()=>{ triggerHaptic('medium'); onScan() }}
            onTouchStart={e=>e.currentTarget.style.transform='scale(0.9) translateY(-8px)'}
            onTouchEnd={e=>e.currentTarget.style.transform='translateY(-14px)'}
            style={{ width:58, height:58, borderRadius:16, border:`2.5px solid ${C.gold}`,
              background:`linear-gradient(135deg,${C.gold},${C.amber})`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
              cursor:'pointer', flexShrink:0,
              transform:'translateY(-14px)',
              boxShadow:`0 6px 20px rgba(192,120,32,0.45), 0 0 0 5px ${C.card}, 0 0 0 6.5px ${C.border}`,
              transition:'transform .1s' }}>
            <span style={{ fontFamily:MONO, fontWeight:900, fontSize:11, color:'#fff', letterSpacing:'0.04em', lineHeight:1 }}>QR</span>
            <span style={{ fontFamily:MONO, fontWeight:700, fontSize:8, color:'rgba(255,255,255,0.8)', letterSpacing:'0.06em' }}>SCAN</span>
          </button>
          <NavBadge label="EVENTS" abbr="EVT" color={C.blue} onClick={()=>{ triggerHaptic('light'); navigate('/passport/events') }}/>
          <NavBadge label="BENEFITS" abbr="BNF" color={C.crimson} onClick={()=>{ triggerHaptic('light'); navigate('/passport/benefits') }}/>
        </div>
      </div>
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

  useEffect(()=>{ getUpcomingEvents().then(setEvents) },[])
  useEffect(()=>{
    const h = e=>{ if (e.altKey&&(e.key==='a'||e.key==='A')){ triggerHaptic('light'); setModal('admin') } }
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)
  },[])

  function showToast(msg){ setToast({visible:true,msg}); setTimeout(()=>setToast(t=>({...t,visible:false})),3000) }
  function closeModal(){ triggerHaptic('light'); setModal(null) }
  function handleScanResult(r){ setScanResult(r); setModal('scan-result') }
  function handleOverlay(type){
    setOverlayOn(true)
    const msgs={stamp:'Stamp claimed.',verify:'Connection verified.','check-in':'Check-in confirmed.',benefit:'Benefit saved.'}
    setTimeout(()=>showToast(msgs[type]||'Passport updated.'),1400)
  }
  function handleAction(action){
    if(action==='reopen-scan'){setModal('scan');return}
    const routes={events:'/passport/events',connections:'/passport/connections',stamps:'/passport/stamps',directory:'/passport/directory',benefits:'/passport/benefits'}
    if(routes[action]) navigate(routes[action])
  }

  const xpPct = Math.round((profile.xp/profile.nextTierXp)*100)

  const STAMP_COLORS = [C.crimson, C.teal, C.blue, C.purple, C.amber]

  const SECTION_TILES = [
    { icon:'contact_page',    label:'Directory',   sub:'Verified members, brands & more', color:C.teal,   route:'/passport/directory' },
    { icon:'hub',             label:'Connections', sub:'Your network & conversations',    color:C.purple, route:'/passport/connections' },
    { icon:'event',           label:'Events',      sub:'Curated experiences & invites',   color:C.blue,   route:'/passport/events' },
    { icon:'redeem',          label:'Benefits',    sub:'Perks, access & privileges',      color:C.crimson,route:'/passport/benefits' },
  ]
  const ACTION_TILES = [
    { icon:'qr_code_scanner', label:'Scan to Connect', sub:'Find events & venues',       color:C.gold,   action:()=>{ triggerHaptic('medium'); setModal('scan') } },
    { icon:'contact_page',    label:'Explore Directory',sub:'Verified members',           color:C.teal,   action:()=>navigate('/passport/directory') },
    { icon:'hub',             label:'View Matches',     sub:'Top connections',            color:C.purple, action:()=>navigate('/passport/connections') },
    { icon:'event',           label:'Join an Event',    sub:'RSVP & meet in person',      color:C.blue,   action:()=>navigate('/passport/events') },
    { icon:'redeem',          label:'Explore Benefits', sub:'Unlock rewards & perks',     color:C.crimson,action:()=>navigate('/passport/benefits') },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:120 }}>

      {/* ════════════════════════════════════════════════════
          LEATHER COVER — top strip only, not full page
      ════════════════════════════════════════════════════ */}
      <div style={{ background:`linear-gradient(180deg,${C.cover} 0%,${C.coverMid} 100%)`,
        position:'relative', overflow:'hidden', paddingBottom:20 }}>
        <Grain op={0.06}/>

        {/* TOP BAR — back + title + mute */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 10px', position:'relative', zIndex:3 }}>
          {/* Back button */}
          <button onClick={()=>{ triggerHaptic('light'); navigate(-1) }}
            style={{ width:36, height:36, borderRadius:10, border:`1px solid ${C.gold}40`,
              background:`${C.gold}14`, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', flexShrink:0 }}>
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke={C.goldLt} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:MONO, fontSize:8, color:`${C.goldLt}60`, letterSpacing:'0.2em' }}>BY PROFOUND INNOVATIONS</p>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.goldLt, letterSpacing:'0.05em' }}>360 LEGACY PASSPORT™</p>
          </div>
          <button onClick={()=>{ triggerHaptic('light'); setMuted(m=>!m) }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:99,
              border:`1px solid ${muted?'#e88':C.gold}40`, background:muted?`rgba(200,50,50,0.12)`:`${C.gold}10`,
              cursor:'pointer', fontFamily:MONO, fontSize:8.5, color:muted?'#e88':C.goldLt }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color:muted?'#e88':C.gold, ...FILL1 }}>
              {muted?'volume_off':'volume_up'}
            </span>
            {muted?'Muted':'Mute'}
          </button>
        </div>

        {/* ── PASSPORT BOOKLET ─────────────────────────────── */}
        <div style={{ margin:'0 14px', position:'relative', zIndex:3 }}>
          {/* Drop shadow */}
          <div style={{ position:'absolute', bottom:-10, left:10, right:10, height:20,
            borderRadius:'50%', background:'rgba(0,0,0,0.3)', filter:'blur(10px)' }}/>

          <div style={{ borderRadius:12, overflow:'hidden',
            boxShadow:'0 10px 36px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.2)',
            border:`1px solid ${C.gold}20` }}>

            {/* Cover embossed strip */}
            <div style={{ background:`linear-gradient(180deg,#2E1A08 0%,${C.cover} 100%)`,
              padding:'16px 18px 12px', position:'relative', overflow:'hidden' }}>
              <Grain op={0.07}/>
              <div style={{ position:'absolute', inset:6, border:`1px solid ${C.gold}25`, borderRadius:5, pointerEvents:'none' }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, position:'relative', zIndex:2 }}>
                <Emblem size={52} color={C.goldLt}/>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:20, color:C.goldLt, letterSpacing:'0.1em', lineHeight:1 }}>BROTHERHOOD</p>
                  <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:28, color:C.gold, letterSpacing:'0.06em', lineHeight:1.1, margin:'1px 0' }}>360</p>
                  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:'5px 0' }}/>
                  <p style={{ fontFamily:MONO, fontSize:8, color:`${C.goldLt}65`, letterSpacing:'0.24em' }}>LEGACY PASSPORT</p>
                </div>
                <Tap onClick={()=>{ triggerHaptic('medium'); setModal('scan') }}>
                  <QrGraphic size={44} color={C.goldLt}/>
                </Tap>
              </div>
            </div>

            {/* Open interior — identity page */}
            <div style={{ display:'flex', background:'#1A0E05' }}>
              <div style={{ width:10, background:`linear-gradient(90deg,rgba(0,0,0,0.6),rgba(0,0,0,0.15))`, flexShrink:0 }}/>
              <div style={{ flex:1, background:`linear-gradient(150deg,${C.card} 0%,${C.bg} 60%,${C.bgAlt} 100%)`,
                position:'relative', overflow:'hidden', padding:'14px 16px 18px' }}>
                <PageRules rows={18} color={C.inkLine} op={0.9}/>
                <div style={{ position:'absolute', right:-12, bottom:-12, opacity:0.05, pointerEvents:'none' }}>
                  <Emblem size={130} color={C.goldDk}/>
                </div>
                <div style={{ position:'relative', zIndex:2 }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:11 }}>
                    <div>
                      <p style={{ fontFamily:MONO, fontSize:8, color:C.inkMed, letterSpacing:'0.18em' }}>PASSPORT IDENTITY</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.ink }}>{profile.displayName}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontFamily:MONO, fontSize:8, color:C.inkMed }}>PASSPORT No.</p>
                      <p style={{ fontFamily:MONO, fontWeight:700, fontSize:11, color:C.ink }}>{profile.passportId}</p>
                    </div>
                  </div>
                  {/* Fields */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', marginBottom:12 }}>
                    {[
                      {label:'Tier',        value:profile.tier?.toUpperCase()},
                      {label:'Member Since', value:profile.memberSince},
                      {label:'Legacy Score', value:`${profile.xp} pts`},
                      {label:'Status',       value:profile.status},
                    ].map(f => (
                      <div key={f.label} style={{ borderBottom:`1px solid ${C.inkLine}`, paddingBottom:4 }}>
                        <p style={{ fontFamily:MONO, fontSize:8, color:C.inkMed, letterSpacing:'0.12em', textTransform:'uppercase' }}>{f.label}</p>
                        <p style={{ fontFamily:SERIF, fontWeight:600, fontSize:13, color:C.ink }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* XP bar */}
                  <div style={{ marginBottom:11 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontFamily:MONO, fontSize:8, color:C.inkMed, letterSpacing:'0.1em' }}>LEGACY SCORE</span>
                      <span style={{ fontFamily:MONO, fontSize:8, color:C.gold }}>{xpPct}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:C.inkLine, border:`1px solid ${C.inkFaint}` }}>
                      <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3,
                        background:`linear-gradient(90deg,${C.goldDk},${C.gold})` }}/>
                    </div>
                  </div>
                  {/* Scan row */}
                  <Tap onClick={()=>{ triggerHaptic('medium'); setModal('scan') }}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px',
                      background:`rgba(28,14,2,0.05)`, border:`1px solid ${C.inkLine}`, borderRadius:9 }}>
                    <QrGraphic size={34} color={C.ink}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.ink }}>360 Passport Connection</p>
                      <p style={{ fontFamily:MONO, fontSize:9, color:C.inkMed }}>Scan to connect · Active session</p>
                    </div>
                    <div style={{ padding:'6px 14px', borderRadius:8, background:C.gold, cursor:'pointer',
                      boxShadow:`0 2px 6px rgba(192,120,32,0.3)` }}>
                      <span style={{ fontFamily:SANS, fontWeight:700, fontSize:12, color:'#fff' }}>SCAN</span>
                    </div>
                  </Tap>
                  {/* MRZ */}
                  <div style={{ marginTop:9, borderTop:`1px solid ${C.inkLine}`, paddingTop:6 }}>
                    <div style={{ fontFamily:OCR, fontSize:9, color:C.inkMed, letterSpacing:'0.05em', lineHeight:1.65 }}>
                      <div>P&lt;USA{profile.displayName?.toUpperCase().replace(' ','<<').padEnd(39,'<').slice(0,39)}</div>
                      <div>{profile.passportId?.padEnd(9,'<')}0USA9512016M</div>
                    </div>
                    <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.inkMed}80`, marginTop:2, letterSpacing:'0.16em' }}>MACHINE READABLE ZONE</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <p style={{ textAlign:'center', fontFamily:MONO, fontSize:8, color:`${C.goldLt}35`,
          letterSpacing:'0.22em', padding:'18px 0 0', position:'relative', zIndex:3 }}>
          YOUR JOURNEY · YOUR STAMP · YOUR LEGACY
        </p>
      </div>

      {/* ════════════════════════════════════════════════════
          OPEN PASSPORT — warm parchment sections
      ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'20px 14px 0' }}>

        {/* HOW IT WORKS */}
        <SH title="How It Works" style={{ marginBottom:12 }}
          right={
            <button onClick={()=>{ triggerHaptic('light'); setGuideStep(1) }}
              style={{ fontFamily:SANS, fontWeight:600, fontSize:13, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
              Full guide →
            </button>
          }/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, marginBottom:22 }}>
          {[
            {num:1,icon:'qr_code_scanner',title:'Scan In',       sub:'Enter events with your QR passport.',color:C.gold},
            {num:2,icon:'person_edit',     title:'Build Profile', sub:'Share your story and goals.',        color:C.teal},
            {num:3,icon:'hub',            title:'Meet People',   sub:'Connect with verified members.',     color:C.blue},
            {num:4,icon:'workspace_premium',title:'Earn Stamps', sub:'Collect stamps and grow legacy.',    color:C.purple},
          ].map(s => (
            <Tap key={s.num} onClick={()=>{ triggerHaptic('light'); setGuideStep(s.num) }}
              style={{ background:C.card, border:`1.5px solid ${s.color}35`, borderTop:`3px solid ${s.color}`,
                borderRadius:12, padding:'13px 10px 14px',
                boxShadow:`0 3px 12px rgba(28,14,2,0.08), 0 1px 4px ${s.color}12`,
                display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:7 }}>
              <div style={{ width:32, height:32, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.cover},${C.coverMid})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 2px 6px rgba(0,0,0,0.2)` }}>
                <span style={{ fontFamily:MONO, fontWeight:700, fontSize:13, color:s.color }}>{s.num}</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize:22, color:s.color, ...FILL1 }}>{s.icon}</span>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.ink, lineHeight:1.2 }}>{s.title}</p>
              <p style={{ fontFamily:SANS, fontSize:11, color:C.inkMed, lineHeight:1.4 }}>{s.sub}</p>
            </Tap>
          ))}
        </div>

        {/* START HERE */}
        <SH title="Start Here" style={{ marginBottom:12 }}
          right={<span style={{ fontFamily:MONO, fontSize:10, color:C.inkMed, letterSpacing:'0.12em' }}>YOUR NEXT ACTIONS</span>}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:22 }}>
          {ACTION_TILES.map(a => (
            <Tile key={a.label} icon={a.icon} label={a.label} color={a.color} onClick={a.action}/>
          ))}
        </div>

        {/* PASSPORT SECTIONS */}
        <SH title="Passport Sections" style={{ marginBottom:12 }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
          {SECTION_TILES.map(s => (
            <Tap key={s.label} onClick={()=>{ triggerHaptic('light'); navigate(s.route) }}
              style={{ background:C.card,
                border:`1.5px solid ${s.color}40`,
                borderLeft:`5px solid ${s.color}`,
                borderRadius:12, overflow:'hidden',
                boxShadow:`0 4px 14px rgba(28,14,2,0.09), 0 1px 4px ${s.color}15`,
                display:'flex', alignItems:'center', gap:12, padding:'14px 13px 14px 12px' }}>
              <div style={{ width:46, height:46, borderRadius:13, flexShrink:0,
                background:`linear-gradient(135deg,${s.color}18,${s.color}30)`,
                border:`1.5px solid ${s.color}45`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 2px 8px ${s.color}25` }}>
                <span className="material-symbols-outlined" style={{ fontSize:24, color:s.color, ...FILL1 }}>{s.icon}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.ink }}>{s.label}</p>
                <p style={{ fontFamily:SANS, fontSize:11, color:C.inkMed, lineHeight:1.35, marginTop:2 }}>{s.sub}</p>
              </div>
              <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <path d="M7 4L12 9L7 14" stroke={`${s.color}90`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Tap>
          ))}
        </div>

        {/* STAMPS */}
        <SH title="Achievement Stamps" style={{ marginBottom:12 }}
          right={
            <button onClick={()=>{ triggerHaptic('light'); navigate('/passport/stamps') }}
              style={{ fontFamily:SANS, fontWeight:600, fontSize:13, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
              View All →
            </button>
          }/>
        <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${C.border}`,
          boxShadow:'0 4px 14px rgba(28,14,2,0.09)', overflow:'hidden', marginBottom:22, position:'relative' }}>
          <PageRules rows={14} color={C.inkLine} op={0.8}/>
          <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', opacity:0.04, pointerEvents:'none' }}>
            <Emblem size={220} color={C.goldDk}/>
          </div>
          <div style={{ position:'relative', zIndex:2, padding:'14px 16px 18px' }}>
            <p style={{ fontFamily:SERIF, fontSize:14, color:C.inkMed, textAlign:'center', marginBottom:4 }}>
              {STAMPS.filter(s=>s.earned).length} of {STAMPS.length} Stamps Earned
            </p>
            <div style={{ height:1, background:C.inkLine, marginBottom:16 }}/>
            <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:14 }}>
              {STAMPS.map((stamp,i) => (
                <InkStamp key={stamp.id}
                  size={64} color={STAMP_COLORS[i%STAMP_COLORS.length]}
                  icon={stamp.icon} label={stamp.label} earned={stamp.earned}
                  tilt={(i%2===0?1:-1)*(i%3+1)}
                  onClick={()=>{ triggerHaptic('light'); setSelStamp(stamp) }}/>
              ))}
            </div>
            <div style={{ marginTop:16, borderTop:`1px solid ${C.inkLine}`, paddingTop:10 }}>
              <GBtn full outline onClick={()=>{ triggerHaptic('light'); navigate('/passport/stamps') }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, ...FILL1 }}>workspace_premium</span>
                View My Stamp Collection
              </GBtn>
            </div>
          </div>
        </div>

        {/* EVENTS + ACTIVITY */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:22 }}>

          {/* Events */}
          <div>
            <SH title="Upcoming Events" style={{ marginBottom:10 }}
              right={
                <button onClick={()=>{ triggerHaptic('light'); navigate('/passport/events') }}
                  style={{ fontFamily:SANS, fontWeight:600, fontSize:12, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
                  See All →
                </button>
              }/>
            <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${C.blue}30`,
              borderLeft:`4px solid ${C.blue}`,
              boxShadow:`0 3px 12px rgba(28,14,2,0.08), 0 1px 4px ${C.blue}12`, overflow:'hidden', position:'relative' }}>
              <PageRules rows={14} color={C.inkLine} op={0.7}/>
              <div style={{ position:'relative', zIndex:2, padding:'11px 12px' }}>
                {events.map((ev,i) => (
                  <Tap key={ev.id} onClick={()=>{ triggerHaptic('light'); setSelEvent(ev) }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0',
                      borderBottom:i<events.length-1?`1px solid ${C.inkLine}`:'none' }}>
                    <div style={{ minWidth:38, textAlign:'center', background:C.cover,
                      borderRadius:8, padding:'4px 6px', flexShrink:0 }}>
                      <p style={{ fontFamily:MONO, fontSize:7, color:`${C.goldLt}55` }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.goldLt, lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.ink, lineHeight:1.2 }}>{ev.name}</p>
                      <p style={{ fontFamily:SANS, fontSize:10, color:C.inkMed }}>{ev.venue}</p>
                    </div>
                    {(rsvpdIds.has(ev.id)||ev.rsvpd)
                      ? <span style={{ fontFamily:MONO, fontSize:9, color:C.green, fontWeight:700 }}>RSVP'd</span>
                      : <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                          <path d="M6 3L11 8L6 13" stroke={`${C.gold}80`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                  </Tap>
                ))}
                <button onClick={async()=>{
                  triggerHaptic('success')
                  await Promise.all(events.map(e=>rsvpToEvent(e.id)))
                  setRsvpdIds(new Set(events.map(e=>e.id)))
                  showToast('RSVP confirmed for all events.')
                }} style={{ width:'100%', marginTop:10, padding:'8px', borderRadius:9,
                  border:`1.5px solid ${C.blue}40`, background:`${C.blue}08`,
                  fontFamily:MONO, fontWeight:700, fontSize:9.5, color:C.blue, cursor:'pointer',
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  RSVP TO ALL EVENTS
                </button>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div>
            <SH title="Recent Activity" style={{ marginBottom:10 }}/>
            <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${C.teal}30`,
              borderLeft:`4px solid ${C.teal}`,
              boxShadow:`0 3px 12px rgba(28,14,2,0.08), 0 1px 4px ${C.teal}12`, overflow:'hidden', position:'relative' }}>
              <PageRules rows={14} color={C.inkLine} op={0.7}/>
              {/* Margin rule */}
              <div style={{ position:'absolute', left:24, top:0, bottom:0, width:1, background:C.inkLine, pointerEvents:'none', zIndex:1 }}/>
              <div style={{ position:'relative', zIndex:2, padding:'11px 12px 11px 30px' }}>
                {RECENT_ACTIVITY.map((a,i) => (
                  <Tap key={a.id} onClick={()=>triggerHaptic('light')}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                      borderBottom:i<RECENT_ACTIVITY.length-1?`1px solid ${C.inkLine}`:'none' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${a.color}18`,
                      border:`1.5px solid ${a.color}35`,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:14, color:a.color, ...FILL1 }}>{a.icon}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:11.5, color:C.ink }}>{a.label}</p>
                      <p style={{ fontFamily:SANS, fontSize:9.5, color:C.inkMed, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.detail}</p>
                    </div>
                    <span style={{ fontFamily:MONO, fontSize:9, color:C.inkMed, flexShrink:0 }}>{a.time}</span>
                  </Tap>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE STRIP */}
        <Tap onClick={()=>{ triggerHaptic('light'); setModal('profile') }} style={{ marginBottom:10 }}>
          <div style={{ background:`linear-gradient(135deg,${C.cover} 0%,${C.coverMid} 100%)`,
            borderRadius:12, border:`1.5px solid ${C.gold}40`,
            boxShadow:'0 4px 16px rgba(28,14,2,0.2)', overflow:'hidden', position:'relative' }}>
            <Grain op={0.06}/>
            <div style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', opacity:0.09 }}>
              <Emblem size={120} color={C.goldLt}/>
            </div>
            <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:13, padding:'13px 15px' }}>
              <div style={{ width:50, height:56, borderRadius:7, flexShrink:0,
                background:`${C.gold}18`, border:`1.5px solid ${C.gold}55`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.gold }}>{profile.initials}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:C.goldLt }}>{profile.displayName}</p>
                <p style={{ fontFamily:MONO, fontSize:9, color:`${C.goldLt}55`, letterSpacing:'0.07em' }}>
                  {profile.tier?.toUpperCase()} MEMBER · #{profile.passportId?.slice(-6)}
                </p>
                <div style={{ height:4, borderRadius:2, background:`${C.gold}20`, marginTop:6 }}>
                  <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2,
                    background:`linear-gradient(90deg,${C.goldDk},${C.gold})` }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <GBtn sm style={{ background:`${C.gold}18`, border:`1px solid ${C.gold}50`, color:C.goldLt }}
                  onClick={e=>{ e.stopPropagation(); triggerHaptic('light'); navigate('/passport/profile') }}>
                  Edit
                </GBtn>
                <GBtn sm onClick={e=>{ e.stopPropagation(); triggerHaptic('light'); setModal('profile') }}>
                  View
                </GBtn>
              </div>
            </div>
            <div style={{ borderTop:`1px solid ${C.gold}18`, padding:'4px 15px', background:'rgba(0,0,0,0.15)' }}>
              <div style={{ fontFamily:OCR, fontSize:8.5, color:`${C.goldLt}35`, letterSpacing:'0.06em' }}>
                P&lt;USA{profile.displayName?.toUpperCase().replace(' ','<<')}&lt;&lt;&lt;&lt;{profile.passportId}0USA
              </div>
            </div>
          </div>
        </Tap>

        <p style={{ fontFamily:MONO, fontSize:8, color:`${C.inkMed}60`, textAlign:'center',
          letterSpacing:'0.2em', marginBottom:6 }}>
          PROFOUND INNOVATIONS LLC · 360 PASSPORT CONNECTIONS
        </p>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal==='scan' && (
          <ScanModal key="scan" muted={muted} onClose={()=>setModal(null)}
            onResult={r=>{ setModal(null); setTimeout(()=>handleScanResult(r),60) }}/>
        )}
        {modal==='scan-result' && scanResult && (
          <ScanResultModal key="sr" result={scanResult} muted={muted}
            onClose={closeModal} onAction={handleAction}
            onShowOverlay={type=>{ closeModal(); setTimeout(()=>handleOverlay(type),60) }}/>
        )}
        {overlayOn && <StampOverlay key="overlay" muted={muted} onDone={()=>setOverlayOn(false)}/>}
        {modal==='profile' && <ProfileModal key="profile" profile={profile} onClose={closeModal}/>}
        {modal==='admin' && <AdminPanel key="admin" onClose={closeModal}/>}
        {guideStep && <GuideModal key={`g${guideStep}`} step={guideStep} onClose={()=>setGuideStep(null)}/>}
        {selStamp && <StampDetailModal key={`s${selStamp.id}`} stamp={selStamp} onClose={()=>setSelStamp(null)}/>}
        {selEvent && (
          <EventDetailModal key={`e${selEvent.id}`} event={selEvent}
            onClose={()=>setSelEvent(null)}
            onRsvp={id=>{ setRsvpdIds(s=>new Set([...s,id])); showToast('RSVP confirmed.') }}/>
        )}
      </AnimatePresence>

      <Toast msg={toast.msg} visible={toast.visible}/>
      <BottomNav onScan={()=>{ triggerHaptic('medium'); setModal('scan') }}/>
    </div>
  )
}
