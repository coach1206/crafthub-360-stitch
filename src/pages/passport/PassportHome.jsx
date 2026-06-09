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
import craftImages from '../../lib/craftImages.js'
import {
  WmGlobe, WmSeal, WmGuilloche, WmBooklet, WmStampRing,
  WmLedger, WmDotGrid, WmRosette, WmTravelLines
} from '../../lib/passportWatermarks.jsx'

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  paper:    '#F7F0DF',
  parchment:'#EFE1C3',
  goldA:    '#B98A36',
  goldB:    '#D4AA58',
  navy:     '#102B46',
  ink:      '#201A12',
  brown:    '#7A5A24',
  green:    '#315F46',
  burgundy: '#7A2E2E',
  border:   'rgba(185,138,54,0.45)',
  borderSt: 'rgba(185,138,54,0.7)',
}
const SERIF  = '"Playfair Display",Georgia,serif'
const MONO   = '"JetBrains Mono",monospace'
const SANS   = '"Hanken Grotesk",system-ui,sans-serif'
const FILL1  = { fontVariationSettings:"'FILL' 1" }

/* ─── QR grid ─────────────────────────────────────────────── */
function QrGraphic({ size = 52 }) {
  const s = size / 7
  const pat = [[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
               [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pat.map((row,ri) => row.map((v,ci) => v
        ? <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1} fill={C.navy} opacity={0.85}/>
        : null))}
    </svg>
  )
}

/* ─── Globe watermark ─────────────────────────────────────── */
function GlobeWatermark({ size = 200, opacity = 0.07 }) {
  const cx = size/2, r = cx - 4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.goldA} strokeWidth={1.5}/>
      <ellipse cx={cx} cy={cx} rx={r*.55} ry={r} fill="none" stroke={C.goldA} strokeWidth={0.8}/>
      <ellipse cx={cx} cy={cx} rx={r} ry={r*.55} fill="none" stroke={C.goldA} strokeWidth={0.8}/>
      {[0.2,0.4,0.6,0.8].map(f => (
        <line key={f} x1={cx-r} y1={cx-(r*(1-2*f))} x2={cx+r} y2={cx-(r*(1-2*f))}
          stroke={C.goldA} strokeWidth={0.5} opacity={0.6}/>
      ))}
      <text x={cx} y={cx+5} textAnchor="middle" fontFamily={MONO} fontSize={18}
        fontWeight={700} fill={C.goldA} opacity={0.7}>360</text>
    </svg>
  )
}

/* ─── Section header ──────────────────────────────────────── */
function SecHead({ children, right, sub }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:3, height:13, borderRadius:2, background:`linear-gradient(${C.goldA},${C.goldB})` }}/>
          <span style={{ fontFamily:MONO, fontWeight:700, fontSize:9.5, color:C.brown,
            textTransform:'uppercase', letterSpacing:'0.16em' }}>{children}</span>
          {sub && <span style={{ fontFamily:MONO, fontSize:8.5, color:`${C.brown}88`,
            textTransform:'uppercase', letterSpacing:'0.12em' }}>— {sub}</span>}
        </div>
        {right}
      </div>
      <div style={{ height:1, background:`linear-gradient(to right,${C.border},transparent)`, marginTop:6 }}/>
    </div>
  )
}

/* ─── Slim link ───────────────────────────────────────────── */
function Link({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{ fontFamily:MONO, fontSize:8.5, color:C.goldA, background:'none', border:'none',
        cursor:'pointer', letterSpacing:'0.08em', padding:0 }}>
      {children}
    </button>
  )
}

/* ─── Press card ──────────────────────────────────────────── */
function PCard({ children, onClick, style={} }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ background:C.parchment, border:`1px solid ${C.border}`, borderRadius:10,
        boxShadow: pr?'inset 0 2px 8px rgba(0,0,0,0.1)':'0 2px 6px rgba(16,43,70,0.07)',
        transform: pr?'scale(0.975)':'scale(1)', transition:'transform .12s,box-shadow .12s',
        cursor:onClick?'pointer':'default', ...style }}>
      {children}
    </div>
  )
}

/* ─── Gold button ─────────────────────────────────────────── */
function GBtn({ children, onClick, outline=false, full=false, sm=false, style={} }) {
  const [pr,setPr]=useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        width:full?'100%':'auto', padding:sm?'0 14px':'0 20px', height:sm?40:48,
        borderRadius:9, border:outline?`1.5px solid ${C.goldA}`:'none',
        background:outline?'transparent':(pr?C.brown:C.goldA), color:outline?(pr?C.brown:C.goldA):'#fff',
        fontFamily:SANS, fontWeight:700, fontSize:sm?11:13, cursor:'pointer',
        transform:pr?'scale(0.96)':'scale(1)', transition:'all .12s',
        boxShadow:outline?'none':`0 3px 10px rgba(185,138,54,0.32)`, ...style }}>
      {children}
    </button>
  )
}

/* ─── Navy button ─────────────────────────────────────────── */
function NBtn({ children, onClick, full=false, sm=false, style={} }) {
  const [pr,setPr]=useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        width:full?'100%':'auto', padding:sm?'0 12px':'0 18px', height:sm?38:46,
        borderRadius:9, border:'none', background:pr?'#0b1f32':C.navy,
        color:'#fff', fontFamily:SANS, fontWeight:700, fontSize:sm?11:13, cursor:'pointer',
        transform:pr?'scale(0.96)':'scale(1)', transition:'all .12s',
        boxShadow:'0 3px 10px rgba(16,43,70,0.25)', ...style }}>
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN MODAL
══════════════════════════════════════════════════════════════ */
function ScanModal({ muted, onClose, onResult }) {
  const [state, setState] = useState('idle')
  const [camMsg, setCamMsg] = useState('')
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  async function simulate(type) {
    setState('scanning'); triggerHaptic('medium')
    const res = await scanPassportSource(ALL_PAYLOADS[type])
    setState('idle')
    if (!muted) playSuccessTone()
    triggerHaptic('success')
    onClose(); onResult(res)
  }

  const SIMS = [
    { type:'venue',   icon:'store',              label:'Simulate Venue Scan' },
    { type:'event',   icon:'event',              label:'Simulate Event Scan' },
    { type:'member',  icon:'person',             label:'Simulate Member Scan' },
    { type:'stamp',   icon:'workspace_premium',  label:'Simulate Stamp Scan' },
    { type:'benefit', icon:'redeem',             label:'Simulate Benefit Scan' },
  ]

  return (
    <ModalShell onClose={onClose}>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:21, color:C.navy }}>Scan Passport</p>
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, lineHeight:1.55, marginTop:4 }}>
          Scan a QR code or tap an NFC credential to verify a venue, event, member, stamp, or benefit.
        </p>
      </div>
      {/* Camera frame */}
      <div style={{ width:170, height:170, margin:'0 auto 18px', borderRadius:12,
        background:'rgba(16,43,70,0.05)', border:`2px solid ${C.border}`, position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
          <div key={i} style={{ position:'absolute', width:20, height:20,
            top:ry?'auto':7, bottom:ry?7:'auto', left:rx?'auto':7, right:rx?7:'auto',
            borderTop:ry?'none':`3px solid ${C.goldA}`, borderBottom:ry?`3px solid ${C.goldA}`:'none',
            borderLeft:rx?'none':`3px solid ${C.goldA}`, borderRight:rx?`3px solid ${C.goldA}`:'none' }} />
        ))}
        {state === 'scanning' && (
          <div style={{ position:'absolute', left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${C.goldA},transparent)`,
            animation:'scanLine .9s ease-in-out infinite' }}>
            <style>{`@keyframes scanLine{0%{transform:translateY(-80px)}100%{transform:translateY(80px)}}`}</style>
          </div>
        )}
        <QrGraphic size={80}/>
        <div style={{ position:'absolute', bottom:6, left:0, right:0, textAlign:'center',
          fontFamily:MONO, fontSize:7.5, color:C.goldA, letterSpacing:'0.12em' }}>QR + NFC READY</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
        {SIMS.map(s => (
          <button key={s.type} onClick={() => simulate(s.type)} disabled={state==='scanning'}
            onTouchStart={e=>e.currentTarget.style.background=`rgba(185,138,54,0.12)`}
            onTouchEnd={e=>e.currentTarget.style.background=`rgba(185,138,54,0.05)`}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9,
              border:`1px solid ${C.border}`, background:'rgba(185,138,54,0.05)', cursor:'pointer',
              fontFamily:SANS, fontWeight:600, fontSize:13, color:C.navy, textAlign:'left', transition:'background .1s' }}>
            <span className="material-symbols-outlined" style={{ fontSize:17, color:C.goldA }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      {camMsg
        ? <p style={{ fontFamily:MONO, fontSize:9, color:C.green, textAlign:'center', marginBottom:10 }}>{camMsg}</p>
        : <button onClick={() => setCamMsg('Camera scanner placeholder ready for device API integration.')}
            style={{ width:'100%', padding:'10px', borderRadius:9, border:`1.5px dashed ${C.border}`,
              background:'transparent', fontFamily:SANS, fontSize:12, color:C.brown, cursor:'pointer', marginBottom:10 }}>
            Enable Camera Scanner
          </button>}
      <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN RESULT
══════════════════════════════════════════════════════════════ */
function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  if (!result) return null
  const { sourceType, data } = result

  if (!result.success || sourceType === 'invalid') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="error" iconColor={C.burgundy} badge="INVALID CODE" title="Invalid Passport Code"/>
      <FactBox>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.6, textAlign:'center', padding:'4px 0 8px' }}>
          This code is not connected to 360 Passport Connections.
        </p>
      </FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <NBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</NBtn>
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )

  if (sourceType === 'venue') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="store" iconColor={C.navy} badge="CHECK-IN" title="Venue Check-In Verified"/>
      <FactBox>
        <Row label="Venue" value={data.name}/>
        <Row label="Location" value={`${data.city}, ${data.state}`}/>
        <Row label="Stamps Available" value={data.availableStamps?.length + ' stamps'}/>
      </FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>
        "You're checked in at {data.name}. Available today: Event Stamp, Connection Stamp, Craft Stamp."
      </p>
      <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose(); }} style={{ marginBottom:8 }}>Start Passport Session</GBtn>
      <NBtn full onClick={()=>{ triggerHaptic('light'); onClose(); onAction('events') }} style={{ marginBottom:8 }}>View Venue Events</NBtn>
      <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )

  if (sourceType === 'event') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="event" iconColor={C.navy} badge="CHECK-IN" title="Event Check-In Verified"/>
      <FactBox>
        <Row label="Event" value={data.name}/>
        <Row label="Venue" value={data.venue}/>
        <Row label="Date & Time" value={`${data.date} · ${data.time}`}/>
        <Row label="Stamp Unlocked" value={data.stampName} color={C.green}/>
      </FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>
        "You're checked in for {data.name}. {data.stampName} unlocked."
      </p>
      <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose(); }} style={{ marginBottom:8 }}>Claim Event Stamp</GBtn>
      <NBtn full onClick={()=>{ triggerHaptic('light'); onClose(); onAction('events') }} style={{ marginBottom:8 }}>View Event Details</NBtn>
      <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )

  if (sourceType === 'member') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="person" iconColor={C.green} badge="MATCH FOUND" title="Connection Found"/>
      <FactBox>
        <Row label="Member" value={data.name}/>
        <Row label="Role" value={`${data.role} @ ${data.company}`}/>
        <Row label="Location" value={`${data.city}, ${data.state}`}/>
        <Row label="Match Score" value={`${data.matchScore}%`} color={C.goldA}/>
        <Row label="Trust Status" value={data.trustStatus} color={C.green}/>
      </FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>
        "You matched with {data.name}. {data.matchScore}% fit based on {data.sharedInterests?.join(', ')}."
      </p>
      <GBtn full onClick={async()=>{ triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose(); }} style={{ marginBottom:8 }}>Verify Connection</GBtn>
      <NBtn full onClick={()=>{ triggerHaptic('light'); onClose() }} style={{ marginBottom:8 }}>View Passport</NBtn>
      <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )

  if (sourceType === 'stamp') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="workspace_premium" iconColor={C.brown} badge="AUTHENTICATED" title="Stamp Ready to Claim"/>
      <FactBox>
        <Row label="Stamp" value={data.name}/>
        <Row label="Category" value={data.category?.toUpperCase()}/>
        <Row label="Status" value={data.authenticated ? 'Authenticated ✓' : 'Pending'} color={data.authenticated?C.green:C.burgundy}/>
      </FactBox>
      <GBtn full onClick={async()=>{ triggerHaptic('success'); await claimStamp(data.id,'current'); onShowOverlay('stamp'); onClose(); }} style={{ marginBottom:8, marginTop:14 }}>Claim Stamp</GBtn>
      <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )

  if (sourceType === 'benefit') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="redeem" iconColor={C.burgundy} badge="UNLOCKED" title="Benefit Unlocked"/>
      <FactBox>
        <Row label="Benefit" value={data.name}/>
        <Row label="Provider" value={data.provider}/>
        <Row label="Expires" value={data.expiration}/>
        <Row label="Eligibility" value={data.eligibility}/>
      </FactBox>
      <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>{data.redemption}</p>
      <GBtn full onClick={async()=>{ triggerHaptic('success'); await redeemBenefit(data.id); onShowOverlay('benefit'); onClose(); }} style={{ marginBottom:8 }}>Redeem Benefit</GBtn>
      <NBtn full onClick={()=>{ triggerHaptic('light'); onClose() }} style={{ marginBottom:8 }}>Save to Passport</NBtn>
      <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
    </ModalShell>
  )

  return null
}

/* ─ modal helpers ─────────────────────────────────────────── */
function ModalShell({ onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(16,43,70,0.55)', backdropFilter:'blur(6px)' }}/>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'18px 18px 0 0', background:C.paper, borderTop:`3px solid ${C.goldA}`,
          boxShadow:'0 -14px 40px rgba(16,43,70,0.18)', maxHeight:'88vh', overflowY:'auto',
          scrollbarWidth:'none', padding:'14px 20px 40px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:38, height:4, borderRadius:2, background:C.border }}/>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
function CenterModal({ onClose, children, maxW=360 }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(16,43,70,0.55)', backdropFilter:'blur(6px)' }}/>
      <motion.div initial={{ opacity:0, scale:0.9, y:14 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:maxW, borderRadius:16,
          background:C.paper, border:`2px solid ${C.goldA}`,
          boxShadow:'0 18px 55px rgba(16,43,70,0.22)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {children}
      </motion.div>
    </div>
  )
}
function ResultHead({ icon, iconColor, badge, title }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:12 }}>
      <div style={{ width:58, height:58, borderRadius:'50%', background:`${iconColor}12`,
        border:`1.5px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <span className="material-symbols-outlined" style={{ fontSize:28, color:iconColor, ...FILL1 }}>{icon}</span>
      </div>
      {badge && <span style={{ fontFamily:MONO, fontSize:8, color:iconColor, background:`${iconColor}10`,
        border:`1px solid ${iconColor}25`, padding:'2px 9px', borderRadius:99, marginBottom:6, letterSpacing:'0.12em' }}>{badge}</span>}
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy, textAlign:'center' }}>{title}</p>
    </div>
  )
}
function FactBox({ children }) {
  return <div style={{ background:C.parchment, borderRadius:9, padding:'10px 13px', border:`1px solid ${C.border}` }}>{children}</div>
}
function Row({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontFamily:MONO, fontSize:9, color:C.brown, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:color||C.ink }}>{value}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STAMP OVERLAY
══════════════════════════════════════════════════════════════ */
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
        style={{ position:'absolute', inset:0, background:'rgba(16,43,70,0.7)', backdropFilter:'blur(12px)' }}/>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:280, borderRadius:18, padding:'30px 22px 26px',
          background:C.paper, border:`2.5px solid ${C.goldA}`,
          boxShadow:'0 18px 55px rgba(16,43,70,0.3)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step === 'updating'
            ? <motion.div key="upd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:68, height:68, borderRadius:'50%', margin:'0 auto 16px',
                  border:`3px solid ${C.goldA}`, display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'spinGold 1.2s linear infinite' }}>
                  <style>{`@keyframes spinGold{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <span className="material-symbols-outlined" style={{ fontSize:32, color:C.goldA, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy }}>Updating Passport…</p>
                <p style={{ fontFamily:MONO, fontSize:9, color:C.brown, marginTop:6, letterSpacing:'0.12em' }}>SECURING YOUR RECORD</p>
              </motion.div>
            : <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', damping:18, stiffness:260 }}>
                <div style={{ width:74, height:74, borderRadius:'50%', margin:'0 auto 12px',
                  background:`${C.goldA}14`, border:`2px solid ${C.goldA}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:38, color:C.goldA, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:20, color:C.navy, marginBottom:4 }}>Passport Updated</p>
                <p style={{ fontFamily:MONO, fontSize:9.5, color:C.goldA, letterSpacing:'0.14em', marginBottom:18 }}>AUTHENTICATED</p>
                <GBtn full onClick={onDone}>Continue</GBtn>
              </motion.div>}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STAMP DETAIL
══════════════════════════════════════════════════════════════ */
function StampDetailModal({ stamp, onClose }) {
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ background:C.parchment, borderRadius:'14px 14px 0 0', padding:'22px 18px 18px', borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
        <div style={{ width:66, height:66, borderRadius:'50%', background:`${stamp.color}14`,
          border:`2px solid ${stamp.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:34, color:stamp.color, ...FILL1 }}>{stamp.icon}</span>
        </div>
        <span style={{ fontFamily:MONO, fontSize:7.5, color:stamp.color, background:`${stamp.color}12`,
          border:`1px solid ${stamp.color}30`, padding:'2px 9px', borderRadius:99, letterSpacing:'0.12em' }}>{stamp.label}</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.navy, marginTop:7 }}>{stamp.name}</p>
      </div>
      <div style={{ padding:'14px 18px 22px' }}>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.65, marginBottom:12 }}>{stamp.description}</p>
        <FactBox>
          <Row label="Requirement" value={stamp.requirement}/>
          <Row label="Status" value={stamp.earned?'Earned ✓':'Not yet earned'} color={stamp.earned?C.green:C.burgundy}/>
          {stamp.earnedDate && <Row label="Earned" value={stamp.earnedDate}/>}
        </FactBox>
        <div style={{ marginTop:14 }}>
          <GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
        </div>
      </div>
    </CenterModal>
  )
}

/* ══════════════════════════════════════════════════════════════
   EVENT DETAIL
══════════════════════════════════════════════════════════════ */
function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  async function handleRsvp() {
    setLoading(true); triggerHaptic('success')
    await rsvpToEvent(event.id)
    setRsvpd(true); setLoading(false); onRsvp(event.id)
  }
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ minWidth:52, textAlign:'center', background:C.navy, borderRadius:9, padding:'6px 8px', flexShrink:0 }}>
          <p style={{ fontFamily:MONO, fontSize:7, color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em' }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:'#fff', lineHeight:1 }}>{event.date?.split(' ')[1]}</p>
        </div>
        <div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.navy }}>{event.name}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:C.brown }}>{event.venue} · {event.city} · {event.time}</p>
        </div>
      </div>
      <FactBox>
        <Row label="Attendees" value={`${event.attendeeCount}/${event.capacity}`}/>
        <Row label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct>85?C.burgundy:C.green}/>
        <Row label="Stamp" value="Available at check-in" color={C.goldA}/>
      </FactBox>
      <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
        {rsvpd
          ? <div style={{ padding:'10px', background:`${C.green}12`, border:`1px solid ${C.green}28`, borderRadius:9, textAlign:'center' }}>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:12.5, color:C.green }}>✓ RSVP Confirmed</p>
            </div>
          : <GBtn full onClick={handleRsvp}>{loading?'Confirming…':'RSVP Now'}</GBtn>}
        <GBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
}

/* ══════════════════════════════════════════════════════════════
   GUIDE MODAL
══════════════════════════════════════════════════════════════ */
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
        <div style={{ width:60, height:60, borderRadius:'50%', background:`${C.navy}0D`, border:`1.5px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:30, color:C.navy, ...FILL1 }}>{g.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy, marginBottom:10 }}>{g.title}</p>
        <p style={{ fontFamily:SANS, fontSize:12.5, color:C.ink, lineHeight:1.7, marginBottom:20 }}>{g.body}</p>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Got It</GBtn>
      </div>
    </CenterModal>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════════════════════════════ */
function ProfileModal({ profile, onClose }) {
  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)
  return (
    <CenterModal onClose={onClose} maxW={360}>
      <div style={{ background:C.navy, borderRadius:'14px 14px 0 0', padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-30, top:-30 }}>
          <GlobeWatermark size={180} opacity={0.12}/>
        </div>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ width:68, height:68, borderRadius:'50%', background:`${C.goldA}22`,
            border:`2.5px solid ${C.goldA}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.goldA }}>{profile.initials}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:'#fff' }}>{profile.displayName}</p>
          <p style={{ fontFamily:SANS, fontSize:11.5, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{profile.role} @ {profile.company}</p>
          <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:8, color:C.goldA,
            background:`${C.goldA}18`, border:`1px solid ${C.goldA}28`, padding:'2px 11px', borderRadius:99, letterSpacing:'0.12em' }}>
            {profile.tier?.toUpperCase()} MEMBER
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 18px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, textTransform:'uppercase' }}>Passport XP</span>
            <span style={{ fontFamily:MONO, fontSize:8.5, color:C.goldA }}>{profile.xp} / {profile.nextTierXp}</span>
          </div>
          <div style={{ height:5, borderRadius:3, background:C.parchment, border:`1px solid ${C.border}` }}>
            <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.brown},${C.goldA})` }}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[{val:profile.verifiedConnections,label:'Connections'},{val:profile.stampsEarned,label:'Stamps'},{val:profile.eventsAttended,label:'Events'}].map(s=>(
            <div key={s.label} style={{ textAlign:'center', background:C.parchment, borderRadius:8, padding:'9px 5px', border:`1px solid ${C.border}` }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.navy }}>{s.val}</p>
              <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, textTransform:'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <FactBox>
          <Row label="Passport ID" value={profile.passportId}/>
          <Row label="Member Since" value={profile.memberSince}/>
          <Row label="Status" value={profile.status} color={C.green}/>
        </FactBox>
        <div style={{ marginTop:14 }}>
          <GBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GBtn>
        </div>
      </div>
    </CenterModal>
  )
}

/* ══════════════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════════════ */
function AdminPanel({ onClose }) {
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const ITEMS = [
    { label:'Edit venue data',   icon:'store',              action:()=>setStatus('Edit src/data/venues.js') },
    { label:'Edit event data',   icon:'event',              action:()=>setStatus('Edit src/api/passportHomeApi.js') },
    { label:'Edit member data',  icon:'people',             action:()=>setStatus('Edit src/data/members.js') },
    { label:'Edit stamp data',   icon:'workspace_premium',  action:()=>setStatus('Edit src/data/stamps.js') },
    { label:'Edit benefit data', icon:'redeem',             action:()=>setStatus('Edit src/data/benefits.js') },
    { label:'Replace hero image',icon:'image',              action:()=>setStatus('Update craftImages.backgrounds.passport') },
  ]
  async function queueOpenAI() {
    const { requestOpenAIImageReplacement } = await import('../../api/passportScanApi.js')
    const res = await requestOpenAIImageReplacement('passport-hero', prompt||'Professional passport dashboard hero')
    setStatus(res.message)
  }
  return (
    <CenterModal onClose={onClose} maxW={400}>
      <div style={{ background:C.parchment, borderRadius:'14px 14px 0 0', padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:9 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:C.goldA, ...FILL1 }}>admin_panel_settings</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.navy }}>Admin Source Panel</p>
      </div>
      <div style={{ padding:'14px 18px 24px' }}>
        {ITEMS.map(item=>(
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:9, border:`1px solid ${C.border}`, background:C.parchment, cursor:'pointer',
              marginBottom:7, textAlign:'left', fontFamily:SANS, fontSize:12.5, color:C.ink, transition:'background .1s' }}
            onMouseEnter={e=>e.currentTarget.style.background=`${C.goldA}12`}
            onMouseLeave={e=>e.currentTarget.style.background=C.parchment}>
            <span className="material-symbols-outlined" style={{ fontSize:15, color:C.goldA }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:13, marginTop:6 }}>
          <p style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Image prompt…"
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`,
              background:'#fff', color:C.ink, fontFamily:SANS, fontSize:12, marginBottom:8, outline:'none', boxSizing:'border-box' }}/>
          <NBtn full sm onClick={queueOpenAI} style={{ marginBottom:8 }}>Queue OpenAI Request</NBtn>
          {/* Real OpenAI image generation must happen on the backend. Never expose API keys in browser code. */}
          {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.green, marginBottom:8 }}>{status}</p>}
          <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}70`, lineHeight:1.5 }}>
            Real OpenAI image generation must happen on the backend. Never expose API keys in browser code.
          </p>
        </div>
        <GBtn full onClick={() => { triggerHaptic('light'); onClose() }} style={{ marginTop:13 }}>Close</GBtn>
      </div>
    </CenterModal>
  )
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function Toast({ msg, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
          style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:C.paper, border:`1.5px solid ${C.goldA}`, borderRadius:11, padding:'10px 18px',
            display:'flex', alignItems:'center', gap:9,
            boxShadow:'0 7px 24px rgba(16,43,70,0.2)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:15, color:C.goldA, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:12.5, fontWeight:600, color:C.navy }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════════════════════════════ */
function BottomNav({ onScan }) {
  const navigate = useNavigate()
  const NAV = [
    { id:'home',      icon:'home',          label:'Home',      route:'/' },
    { id:'directory', icon:'contact_page',  label:'Directory', route:'/passport/directory' },
    { id:'scan',      scan:true },
    { id:'events',    icon:'event',         label:'Events',    route:'/passport/events' },
    { id:'benefits',  icon:'redeem',        label:'Benefits',  route:'/passport/benefits' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:640, margin:'0 auto', position:'relative',
        background:C.paper, borderTop:`2px solid ${C.border}`,
        borderRadius:'16px 16px 0 0', boxShadow:'0 -4px 20px rgba(16,43,70,0.1)',
        paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'8px 6px 4px' }}>
          {NAV.map(item => {
            if (item.scan) return (
              <button key="scan" onClick={() => { triggerHaptic('medium'); onScan() }}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.91)'}
                onTouchEnd={e=>e.currentTarget.style.transform=''}
                style={{ width:54, height:54, borderRadius:'50%', border:'none', background:C.goldA,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
                  boxShadow:`0 4px 16px rgba(185,138,54,0.4),0 0 0 4px ${C.paper},0 0 0 5px ${C.border}`,
                  transform:'translateY(-10px)', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:24, color:'#fff', ...FILL1 }}>qr_code_scanner</span>
              </button>
            )
            return (
              <button key={item.id}
                onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.88)'}
                onTouchEnd={e=>e.currentTarget.style.transform=''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:52, padding:'3px 0',
                  background:'none', border:'none', cursor:'pointer', transition:'transform .1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:22, color:'rgba(16,43,70,0.35)' }}>{item.icon}</span>
                <span style={{ fontFamily:MONO, fontSize:8.5, letterSpacing:'0.05em', color:'rgba(16,43,70,0.35)', textTransform:'uppercase' }}>{item.label}</span>
              </button>
            )
          })}
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

  useEffect(() => { getUpcomingEvents().then(setEvents) }, [])

  useEffect(() => {
    const h = e => {
      if ((e.altKey) && (e.key === 'a' || e.key === 'A')) {
        triggerHaptic('light'); setModal('admin')
      }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  function showToast(msg) {
    setToast({ visible:true, msg })
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3000)
  }
  function closeModal() { triggerHaptic('light'); setModal(null) }

  function handleScanResult(result) { setScanResult(result); setModal('scan-result') }
  function handleOverlay(type) {
    setOverlayOn(true)
    const msgs = { stamp:'Stamp claimed. Passport updated.', verify:'Connection verified.', 'check-in':'Venue check-in confirmed.', benefit:'Benefit saved to Passport.' }
    setTimeout(() => showToast(msgs[type] || 'Passport updated.'), 1400)
  }
  function handleAction(action) {
    if (action === 'reopen-scan') { setModal('scan'); return }
    const routes = { events:'/passport/events', connections:'/passport/connections', stamps:'/passport/stamps', directory:'/passport/directory', benefits:'/passport/benefits' }
    if (routes[action]) navigate(routes[action])
  }

  /* ─ section accent colors ──────────────────────────────── */
  const SEC_COLORS = {
    scan:      C.goldA,
    directory: C.green,
    matches:   '#6B4D8A',
    events:    '#B8731A',
    benefits:  C.navy,
  }
  const SECTION_ITEMS = [
    { key:'scan',      icon:'qr_code_scanner', label:'Scan to Connect',   sub:'Find events and venues nearby',     action:()=>{ triggerHaptic('medium'); setModal('scan') } },
    { key:'directory', icon:'contact_page',    label:'Explore Directory', sub:'Discover verified members',          action:()=>{ triggerHaptic('light'); navigate('/passport/directory') } },
    { key:'matches',   icon:'hub',             label:'View Matches',      sub:'See your top connections',           action:()=>{ triggerHaptic('light'); navigate('/passport/connections') } },
    { key:'events',    icon:'event',           label:'Join an Event',     sub:'RSVP & meet in person',              action:()=>{ triggerHaptic('light'); navigate('/passport/events') } },
    { key:'benefits',  icon:'redeem',          label:'Explore Benefits',  sub:'Unlock rewards & perks',             action:()=>{ triggerHaptic('light'); navigate('/passport/benefits') } },
  ]

  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)

  return (
    <div style={{ minHeight:'100vh', background:C.paper, paddingBottom:112, overflowX:'hidden', position:'relative' }}>
      {/* ── Page-wide dot grid watermark ──────────────── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <WmDotGrid opacity={0.04}/>
      </div>

      {/* ── Centered container ──────────────────────────── */}
      <div style={{ maxWidth:920, margin:'0 auto', padding:'0 16px', position:'relative', zIndex:1 }}>

        {/* ══ HERO CREDENTIAL CARD ══════════════════════ */}
        <div style={{ margin:'16px 0', position:'relative', borderRadius:14, overflow:'hidden',
          border:`1.5px solid ${C.borderSt}`,
          boxShadow:'0 6px 28px rgba(16,43,70,0.12), inset 0 0 0 1px rgba(255,255,255,0.4)' }}>
          {/* Paper texture + guilloche lines */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(160deg,${C.paper} 0%,${C.parchment} 100%)`,
            backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 22px,rgba(185,138,54,0.06) 22px,rgba(185,138,54,0.06) 23px)` }}/>
          {/* Guilloche security lines across the bottom of hero */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, pointerEvents:'none', overflow:'hidden', height:56 }}>
            <WmGuilloche width={960} height={56} opacity={0.055}/>
          </div>
          {/* Globe watermark — large, top right */}
          <div style={{ position:'absolute', right:-18, top:-18, pointerEvents:'none' }}>
            <WmGlobe size={230} opacity={0.09}/>
          </div>
          {/* Passport seal — behind scan row, bottom left area */}
          <div style={{ position:'absolute', left:-30, bottom:-30, pointerEvents:'none' }}>
            <WmSeal size={160} opacity={0.07}/>
          </div>
          {/* Passport booklet outline — center right */}
          <div style={{ position:'absolute', right:120, top:8, pointerEvents:'none' }}>
            <WmBooklet width={120} height={90} opacity={0.06}/>
          </div>
          {/* Inner gold border */}
          <div style={{ position:'absolute', inset:5, border:`1px solid ${C.border}`, borderRadius:10, pointerEvents:'none' }}/>

          <div style={{ position:'relative', zIndex:2, padding:'18px 18px 0' }}>
            {/* Top row */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:10 }}>
              {/* Logo badge */}
              <div style={{ width:52, height:52, borderRadius:10, background:C.navy, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 3px 10px rgba(16,43,70,0.25)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:22, color:C.goldA, ...FILL1 }}>book</span>
                <span style={{ fontFamily:MONO, fontSize:6.5, color:`${C.goldA}BB`, fontWeight:700, letterSpacing:'0.06em' }}>360</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:20, color:C.navy, lineHeight:1.05, letterSpacing:'0.01em' }}>360 PASSPORT</p>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.goldA, lineHeight:1.05, letterSpacing:'0.01em' }}>CONNECTIONS</p>
                <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, letterSpacing:'0.16em', marginTop:4, textTransform:'uppercase' }}>Your digital passport to verified connections</p>
                <p style={{ fontFamily:MONO, fontSize:6.5, color:`${C.brown}80`, letterSpacing:'0.1em', marginTop:1 }}>By Profound Innovations LLC</p>
              </div>
              {/* Mute */}
              <button onClick={() => { triggerHaptic('light'); setMuted(m => !m) }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99,
                  border:`1px solid ${C.border}`, background: muted?`${C.burgundy}12`:`${C.goldA}10`,
                  cursor:'pointer', fontFamily:MONO, fontSize:8.5, color:muted?C.burgundy:C.brown, flexShrink:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:13, color:muted?C.burgundy:C.goldA, ...FILL1 }}>
                  {muted?'volume_off':'volume_up'}
                </span>
                {muted?'Muted':'Mute'}
              </button>
            </div>

            <p style={{ fontFamily:SANS, fontSize:11.5, color:`${C.ink}99`, lineHeight:1.55, fontStyle:'italic', marginBottom:14 }}>
              Building meaningful connections and a legacy of trust, impact, and opportunity.
            </p>

            {/* QR scan row */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 13px',
              background:C.parchment, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:14 }}>
              <div onClick={() => { triggerHaptic('medium'); setModal('scan') }} style={{ cursor:'pointer', flexShrink:0 }}>
                <QrGraphic size={46}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.navy }}>360 Passport Connection</p>
                <p style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, letterSpacing:'0.05em' }}>Scan to connect · Active session</p>
              </div>
              <GBtn sm onClick={() => { triggerHaptic('medium'); setModal('scan') }} style={{ flexShrink:0 }}>SCAN</GBtn>
            </div>

            {/* Security footer line */}
            <div style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}60`, letterSpacing:'0.2em',
              textAlign:'center', paddingBottom:13, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
              EVERY STAMP TELLS A STORY · EVERY CONNECTION BUILDS LEGACY
            </div>
          </div>
        </div>

        {/* ══ HOW IT WORKS ══════════════════════════════ */}
        <div style={{ marginBottom:18 }}>
          <SecHead right={<Link onClick={() => { triggerHaptic('light'); setGuideStep(1) }}>Full guide →</Link>}>
            How It Works
          </SecHead>
          {/* Guilloche background behind the 4 cards */}
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden', padding:'1px', background:`linear-gradient(${C.border},${C.border})` }}>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:12 }}>
              <WmGuilloche width={960} height={160} opacity={0.06}/>
            </div>
            <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <WmRosette size={72} opacity={0.07}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, padding:8, background:`${C.paper}E8`, borderRadius:11, position:'relative', zIndex:2 }}>
            {[
              { num:1, icon:'qr_code_scanner', title:'Scan In',       sub:'Enter a service or event using your QR passport.' },
              { num:2, icon:'person_edit',     title:'Build Profile',  sub:'Share your story, interests, goals, and what matters.' },
              { num:3, icon:'hub',             title:'Meet People',    sub:'Connect with verified members and better matches.' },
              { num:4, icon:'workspace_premium',title:'Earn Stamps',  sub:'Collect stamps, gain access, perks, and grow legacy.' },
            ].map(s => (
              <PCard key={s.num} onClick={() => { triggerHaptic('light'); setGuideStep(s.num) }}
                style={{ padding:'11px 9px 12px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:7 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:MONO, fontWeight:700, fontSize:11, color:C.goldA }}>{s.num}</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize:20, color:C.goldA, ...FILL1 }}>{s.icon}</span>
                <p style={{ fontFamily:SANS, fontWeight:700, fontSize:11.5, color:C.navy, lineHeight:1.2 }}>{s.title}</p>
                <p style={{ fontFamily:SANS, fontSize:9, color:C.brown, lineHeight:1.45 }}>{s.sub}</p>
              </PCard>
            ))}
            </div>{/* /inner grid */}
          </div>{/* /guilloche wrapper */}
        </div>

        {/* ══ START HERE ════════════════════════════════ */}
        <div style={{ marginBottom:18 }}>
          <SecHead sub="Your Next Actions">Start Here</SecHead>
          {/* Credential-line background + travel routes watermark */}
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              <WmTravelLines width={960} height={110} opacity={0.05}/>
            </div>
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
              <WmRosette size={90} opacity={0.04}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, position:'relative', zIndex:2 }}>
            {SECTION_ITEMS.map(a => {
              const ac = SEC_COLORS[a.key] || C.navy
              return (
                <PCard key={a.key} onClick={a.action}
                  style={{ padding:'11px 8px 12px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:6 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${ac}14`, border:`1px solid ${ac}25`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:20, color:ac, ...FILL1 }}>{a.icon}</span>
                  </div>
                  <p style={{ fontFamily:SANS, fontWeight:700, fontSize:10.5, color:C.navy, lineHeight:1.25 }}>{a.label}</p>
                  <p style={{ fontFamily:SANS, fontSize:8.5, color:C.brown, lineHeight:1.4 }}>{a.sub}</p>
                </PCard>
              )
            })}
            </div>
          </div>
        </div>

        {/* ══ PASSPORT SECTIONS ════════════════════════ */}
        <div style={{ marginBottom:18 }}>
          <SecHead>Passport Sections</SecHead>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:'contact_page', label:'Directory',   sub:'Verified members, brands & more', route:'/passport/directory', color:C.green,   img: craftImages.portraits?.member1 },
              { icon:'hub',          label:'Connections', sub:'Your network & conversations',    route:'/passport/connections', color:'#6B4D8A', img: craftImages.portraits?.member4 },
              { icon:'event',        label:'Events',      sub:'Curated experiences & invites',   route:'/passport/events', color:C.brown,       img: craftImages.fallbacks?.cigar },
              { icon:'redeem',       label:'Benefits',    sub:'Access perks & privileges',       route:'/passport/benefits', color:C.navy,      img: craftImages.fallbacks?.whiskey },
            ].map((s, si) => (
              <PCard key={s.label} onClick={() => { triggerHaptic('light'); navigate(s.route) }}
                style={{ padding:'0', overflow:'hidden', minHeight:88 }}>
                <div style={{ position:'relative', height:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 12px' }}>
                  {/* Faint photo watermark */}
                  {s.img && (
                    <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'45%', overflow:'hidden' }}>
                      <img src={s.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', filter:'saturate(0) brightness(1.1) opacity(0.12)' }}/>
                    </div>
                  )}
                  {/* SVG watermark per card */}
                  <div style={{ position:'absolute', right:si%2===0?8:12, bottom:si<2?-6:-10, pointerEvents:'none', zIndex:1 }}>
                    {si === 0 && <WmBooklet width={80} height={60} opacity={0.1} color={s.color}/>}
                    {si === 1 && <WmTravelLines width={120} height={60} opacity={0.09} color={s.color}/>}
                    {si === 2 && <WmStampRing size={60} opacity={0.1} color={s.color} label="EVENT"/>}
                    {si === 3 && <WmSeal size={70} opacity={0.09} color={s.color}/>}
                  </div>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${s.color}14`, border:`1px solid ${s.color}25`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative', zIndex:2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:19, color:s.color, ...FILL1 }}>{s.icon}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0, position:'relative', zIndex:2 }}>
                    <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.navy }}>{s.label}</p>
                    <p style={{ fontFamily:SANS, fontSize:10, color:C.brown, lineHeight:1.35 }}>{s.sub}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize:15, color:`${C.goldA}70`, position:'relative', zIndex:2 }}>chevron_right</span>
                </div>
              </PCard>
            ))}
          </div>
        </div>

        {/* ══ DIGITAL STAMPS ═══════════════════════════ */}
        <div style={{ marginBottom:18 }}>
          <SecHead right={<Link onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}>VIEW ALL</Link>}>
            Digital Stamps
          </SecHead>
          <PCard style={{ padding:'14px 12px 12px', position:'relative', overflow:'hidden' }}>
            {/* Stamp page watermark layers */}
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              <WmGuilloche width={960} height={120} opacity={0.05}/>
            </div>
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
              <WmSeal size={130} opacity={0.06}/>
            </div>
            <div style={{ position:'absolute', right:-10, top:-10, pointerEvents:'none' }}>
              <WmStampRing size={80} opacity={0.08} label="AUTH"/>
            </div>
            <div style={{ position:'absolute', left:-10, bottom:-10, pointerEvents:'none' }}>
              <WmRosette size={60} opacity={0.07}/>
            </div>
            <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:13, textAlign:'center', position:'relative', zIndex:2 }}>
              COLLECT · EARN · UNLOCK
            </p>
            {/* Stamp row */}
            <div style={{ display:'flex', justifyContent:'space-around', marginBottom:10, position:'relative', zIndex:2 }}>
              {STAMPS.map(stamp => (
                <button key={stamp.id} onClick={() => { triggerHaptic('light'); setSelStamp(stamp) }}
                  onTouchStart={e=>e.currentTarget.style.transform='scale(0.9)'}
                  onTouchEnd={e=>e.currentTarget.style.transform=''}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    background:'none', border:'none', cursor:'pointer', transition:'transform .1s',
                    opacity: stamp.earned ? 1 : 0.38, padding:'2px 4px' }}>
                  {/* Circular stamp seal */}
                  <div style={{ width:48, height:48, borderRadius:'50%', position:'relative',
                    background:`${stamp.color}0F`, border:`2px solid ${stamp.color}${stamp.earned?'55':'25'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: stamp.earned?`0 0 0 3px ${C.parchment},0 0 0 4px ${stamp.color}20`:'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:22, color:stamp.earned?stamp.color:`${stamp.color}80`, ...FILL1 }}>{stamp.icon}</span>
                    {stamp.earned && (
                      <div style={{ position:'absolute', inset:-1, borderRadius:'50%',
                        border:`1px dashed ${stamp.color}40` }}/>
                    )}
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:7.5, color:stamp.earned?stamp.color:C.brown,
                    textTransform:'uppercase', letterSpacing:'0.08em' }}>{stamp.label}</span>
                </button>
              ))}
            </div>
            {/* Horizontal passport lines */}
            <div style={{ position:'relative', zIndex:2 }}>
              {[...Array(3)].map((_,i) => (
                <div key={i} style={{ height:'1px', background:`${C.border}50`, marginBottom:4 }}/>
              ))}
              <div style={{ textAlign:'center', paddingTop:4, fontFamily:MONO, fontSize:7.5, color:C.brown, letterSpacing:'0.14em', marginBottom:10 }}>
                AUTHENTICATED
              </div>
            </div>
          </PCard>
          <GBtn full outline onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}
            style={{ marginTop:8, height:42 }}>
            <span className="material-symbols-outlined" style={{ fontSize:15, ...FILL1 }}>workspace_premium</span>
            View My Stamp Collection
          </GBtn>
        </div>

        {/* ══ EVENTS + ACTIVITY (2-column) ══════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {/* Upcoming Events */}
          <div>
            <SecHead right={<Link onClick={() => { triggerHaptic('light'); navigate('/passport/events') }}>See All →</Link>}>
              Upcoming Events
            </SecHead>
            <PCard style={{ padding:'10px 11px', position:'relative', overflow:'hidden' }}>
              {/* Travel-card watermark behind events */}
              <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                <WmTravelLines width={460} height={180} opacity={0.06}/>
              </div>
              <div style={{ position:'absolute', right:-8, bottom:-8, pointerEvents:'none' }}>
                <WmStampRing size={66} opacity={0.08} label="RSVP"/>
              </div>
              {events.map((ev, i) => (
                <div key={ev.id} onClick={() => { triggerHaptic('light'); setSelEvent(ev) }}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 0',
                    borderBottom: i < events.length-1 ? `1px solid ${C.border}` : 'none', cursor:'pointer' }}>
                  <div style={{ minWidth:38, textAlign:'center', background:C.navy, borderRadius:7, padding:'4px 6px', flexShrink:0 }}>
                    <p style={{ fontFamily:MONO, fontSize:6.5, color:'rgba(255,255,255,0.55)', letterSpacing:'0.08em' }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                    <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:'#fff', lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:SANS, fontWeight:700, fontSize:11, color:C.navy, lineHeight:1.25 }}>{ev.name}</p>
                    <p style={{ fontFamily:SANS, fontSize:9.5, color:C.brown }}>{ev.venue} · {ev.city} · {ev.time}</p>
                  </div>
                  {(rsvpdIds.has(ev.id)||ev.rsvpd)
                    ? <span style={{ fontFamily:MONO, fontSize:7.5, color:C.green, flexShrink:0 }}>RSVP'd</span>
                    : <span className="material-symbols-outlined" style={{ fontSize:15, color:`${C.goldA}70`, flexShrink:0 }}>chevron_right</span>}
                </div>
              ))}
              <button onClick={async()=>{
                triggerHaptic('success')
                await Promise.all(events.map(e=>rsvpToEvent(e.id)))
                setRsvpdIds(new Set(events.map(e=>e.id)))
                showToast('RSVP confirmed for all upcoming events.')
              }} style={{ width:'100%', marginTop:8, padding:'9px', borderRadius:9, border:`1.5px solid ${C.goldA}`,
                background:`${C.goldA}0A`, fontFamily:SANS, fontWeight:700, fontSize:11, color:C.goldA, cursor:'pointer' }}>
                RSVP TO ALL UPCOMING EVENTS
              </button>
            </PCard>
          </div>

          {/* Recent Activity */}
          <div>
            <SecHead right={<Link>All →</Link>}>Recent Activity</SecHead>
            <PCard style={{ padding:'10px 11px', position:'relative', overflow:'hidden' }}>
              {/* Credential ledger watermark */}
              <WmLedger height={220} opacity={0.055}/>
              <div style={{ position:'absolute', right:-12, top:'30%', pointerEvents:'none' }}>
                <WmRosette size={66} opacity={0.08}/>
              </div>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={a.id} onClick={() => triggerHaptic('light')}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                    borderBottom: i < RECENT_ACTIVITY.length-1 ? `1px solid ${C.border}` : 'none', cursor:'pointer' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:`${a.color}12`,
                    border:`1px solid ${a.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:14, color:a.color, ...FILL1 }}>{a.icon}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:SANS, fontWeight:700, fontSize:10.5, color:C.navy }}>{a.label}</p>
                    <p style={{ fontFamily:SANS, fontSize:9, color:C.brown, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.detail}</p>
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:8, color:`${C.brown}60`, flexShrink:0 }}>{a.time}</span>
                </div>
              ))}
            </PCard>
          </div>
        </div>

        {/* ══ PROFILE STRIP ════════════════════════════ */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
          background:C.parchment, border:`1.5px solid ${C.borderSt}`, borderRadius:12,
          boxShadow:'0 2px 8px rgba(16,43,70,0.08)', marginBottom:8, position:'relative', overflow:'hidden' }}>
          {/* Security pattern + seal behind profile name area */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            <WmGuilloche width={960} height={68} opacity={0.045}/>
          </div>
          <div style={{ position:'absolute', right:120, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <WmRosette size={55} opacity={0.07}/>
          </div>
          <div style={{ position:'absolute', right:16, top:0, bottom:0, pointerEvents:'none', display:'flex', alignItems:'center' }}>
            <WmSeal size={52} opacity={0.06}/>
          </div>
          {/* Initials badge */}
          <div style={{ width:46, height:46, borderRadius:'50%', background:C.navy, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${C.goldA}` }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.goldA }}>{profile.initials}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:14, color:C.navy }}>{profile.displayName}</p>
            <p style={{ fontFamily:MONO, fontSize:8, color:C.brown, letterSpacing:'0.06em' }}>
              PARTICIPANT MEMBER · {profile.tier?.toUpperCase()} · #{profile.passportId.slice(-6)}
            </p>
            {/* Slim XP bar */}
            <div style={{ height:3, borderRadius:2, background:`${C.border}55`, marginTop:5 }}>
              <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2, background:`linear-gradient(90deg,${C.brown},${C.goldA})` }}/>
            </div>
          </div>
          <GBtn sm onClick={() => { triggerHaptic('light'); navigate('/passport/profile') }} outline style={{ flexShrink:0 }}>Edit</GBtn>
          <GBtn sm onClick={() => { triggerHaptic('light'); setModal('profile') }} style={{ flexShrink:0 }}>View Profile</GBtn>
        </div>

        <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}50`, textAlign:'center', letterSpacing:'0.18em', marginBottom:6 }}>
          EPIC TO NEXT RANK ↑
        </p>

      </div>{/* /container */}

      {/* ── Modals ──────────────────────────────────────── */}
      <AnimatePresence>
        {modal==='scan' && (
          <ScanModal key="scan" muted={muted} onClose={()=>setModal(null)}
            onResult={r=>{ setModal(null); setTimeout(()=>handleScanResult(r),60) }}/>
        )}
        {modal==='scan-result' && scanResult && (
          <ScanResultModal key="sr" result={scanResult} muted={muted}
            onClose={closeModal} onAction={handleAction} onShowOverlay={type=>{ closeModal(); setTimeout(()=>handleOverlay(type),60) }}/>
        )}
        {overlayOn && (
          <StampOverlay key="overlay" muted={muted} onDone={()=>setOverlayOn(false)}/>
        )}
        {modal==='profile' && (
          <ProfileModal key="profile" profile={profile} onClose={closeModal}/>
        )}
        {modal==='admin' && (
          <AdminPanel key="admin" onClose={closeModal}/>
        )}
        {guideStep && (
          <GuideModal key={`g${guideStep}`} step={guideStep} onClose={()=>setGuideStep(null)}/>
        )}
        {selStamp && (
          <StampDetailModal key={`s${selStamp.id}`} stamp={selStamp} onClose={()=>setSelStamp(null)}/>
        )}
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
