import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '../../utils/haptics.js'
import { playStampSound, playSuccessTone } from '../../utils/sound.js'
import { scanPassportSource, claimStamp, verifyConnection as apiVerify, checkInToVenue, checkInToEvent, redeemBenefit } from '../../api/passportScanApi.js'
import { getUpcomingEvents, rsvpToEvent } from '../../api/passportHomeApi.js'
import { STAMPS } from '../../data/stamps.js'
import { BENEFITS } from '../../data/benefits.js'
import { RECENT_ACTIVITY } from '../../data/recentActivity.js'
import { PASSPORT_PROFILE } from '../../data/passportProfile.js'
import { ALL_PAYLOADS } from '../../utils/qrPayloads.js'

/* ── Palette ─────────────────────────────────────────────── */
const C = {
  ivory:      '#F8F1E3',
  parchment:  '#EFE2C6',
  gold:       '#B58A3A',
  goldLight:  '#D4AA5C',
  navy:       '#15314F',
  charcoal:   '#1E1A14',
  brown:      '#6F5524',
  green:      '#2F6B45',
  burgundy:   '#8B1A2B',
  border:     'rgba(181,138,58,0.3)',
  borderDark: 'rgba(181,138,58,0.5)',
  subtle:     'rgba(21,49,79,0.08)',
}

const SERIF  = '"Playfair Display", Georgia, serif'
const MONO   = '"JetBrains Mono", monospace'
const SANS   = '"Hanken Grotesk", system-ui, sans-serif'
const FILL1  = { fontVariationSettings:"'FILL' 1" }

/* ── Section label ───────────────────────────────────────── */
function SectionLabel({ children, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:3, height:14, background:C.gold, borderRadius:2 }} />
        <span style={{ fontFamily:MONO, fontWeight:700, fontSize:10, color:C.brown, textTransform:'uppercase', letterSpacing:'0.14em' }}>{children}</span>
      </div>
      {right}
    </div>
  )
}

/* ── Card shell ──────────────────────────────────────────── */
function Card({ children, onClick, style = {}, pressed = false }) {
  const [active, setActive] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={() => setActive(true)} onTouchEnd={() => setActive(false)}
      onMouseDown={() => setActive(true)} onMouseUp={() => setActive(false)} onMouseLeave={() => setActive(false)}
      style={{ background:C.parchment, border:`1px solid ${C.border}`, borderRadius:12,
        boxShadow: active ? 'inset 0 2px 6px rgba(0,0,0,0.12)' : '0 2px 8px rgba(21,49,79,0.06)',
        transform: active ? 'scale(0.975)' : 'scale(1)', transition:'transform 0.12s, box-shadow 0.12s',
        cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

/* ── Gold button ─────────────────────────────────────────── */
function GoldBtn({ children, onClick, style = {}, outline = false, full = false }) {
  const [active, setActive] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={() => setActive(true)} onTouchEnd={() => setActive(false)}
      onMouseDown={() => setActive(true)} onMouseUp={() => setActive(false)} onMouseLeave={() => setActive(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width: full ? '100%' : 'auto',
        padding:'0 20px', height:48, borderRadius:10,
        border: outline ? `1.5px solid ${C.gold}` : 'none',
        background: outline ? 'transparent' : (active ? C.brown : C.gold),
        color: outline ? C.gold : (active ? '#fff' : '#fff'),
        fontFamily:SANS, fontWeight:700, fontSize:13, cursor:'pointer',
        transform: active ? 'scale(0.96)' : 'scale(1)', transition:'all 0.12s',
        boxShadow: outline ? 'none' : '0 3px 12px rgba(181,138,58,0.3)', ...style }}>
      {children}
    </button>
  )
}

/* ── Navy button ─────────────────────────────────────────── */
function NavyBtn({ children, onClick, style = {}, full = false }) {
  const [active, setActive] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={() => setActive(true)} onTouchEnd={() => setActive(false)}
      onMouseDown={() => setActive(true)} onMouseUp={() => setActive(false)} onMouseLeave={() => setActive(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width: full ? '100%' : 'auto',
        padding:'0 20px', height:46, borderRadius:10, border:'none',
        background: active ? '#0e2236' : C.navy, color:'#fff',
        fontFamily:SANS, fontWeight:700, fontSize:13, cursor:'pointer',
        transform: active ? 'scale(0.96)' : 'scale(1)', transition:'all 0.12s',
        boxShadow:'0 3px 12px rgba(21,49,79,0.2)', ...style }}>
      {children}
    </button>
  )
}

/* ── QR grid graphic ─────────────────────────────────────── */
function QrGraphic({ size = 56 }) {
  const s = size / 7
  const pattern = [
    [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
    [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, ri) => row.map((cell, ci) => cell ? (
        <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1} fill={C.navy} opacity={0.8} />
      ) : null))}
    </svg>
  )
}

/* ── Guilloche watermark ─────────────────────────────────── */
function GuillocheWatermark({ size = 200, opacity = 0.06 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ opacity }}>
      {[...Array(8)].map((_, i) => (
        <ellipse key={i} cx={100} cy={100} rx={20 + i*10} ry={20 + i*10}
          fill="none" stroke={C.gold} strokeWidth={0.8} transform={`rotate(${i*22.5} 100 100)`} />
      ))}
      <circle cx={100} cy={100} r={12} fill="none" stroke={C.gold} strokeWidth={2} />
      <text x={100} y={104} textAnchor="middle" fontFamily={MONO} fontSize={7} fill={C.gold} fontWeight={700}>360</text>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN MODAL
══════════════════════════════════════════════════════════════ */
function ScanModal({ muted, onClose, onResult }) {
  const [state, setState] = useState('idle')
  const [cameraMsg, setCameraMsg] = useState('')

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  async function simulate(type) {
    setState('scanning'); triggerHaptic('medium')
    const payload = ALL_PAYLOADS[type]
    const result = await scanPassportSource(payload)
    setState('idle')
    if (!muted) playSuccessTone()
    triggerHaptic('success')
    onClose()
    onResult(result)
  }

  const SIMS = [
    { type:'venue',   label:'Simulate Venue Scan',   icon:'store' },
    { type:'event',   label:'Simulate Event Scan',   icon:'event' },
    { type:'member',  label:'Simulate Member Scan',  icon:'person' },
    { type:'stamp',   label:'Simulate Stamp Scan',   icon:'workspace_premium' },
    { type:'benefit', label:'Simulate Benefit Scan', icon:'star' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.6)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'20px 20px 0 0', background:C.ivory, borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(21,49,79,0.18)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border }} />
        </div>
        <div style={{ padding:'16px 22px 40px' }}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:C.navy, marginBottom:4 }}>Scan Passport</p>
            <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, lineHeight:1.5 }}>
              Scan a Passport QR code or tap an NFC credential to verify a venue, event, member, stamp, or benefit.
            </p>
          </div>
          {/* Camera frame */}
          <div style={{ width:180, height:180, margin:'0 auto 22px', borderRadius:14, background:'rgba(21,49,79,0.06)',
            border:`2px solid ${C.border}`, position:'relative', overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
              <div key={i} style={{ position:'absolute', width:22, height:22,
                top:ry?'auto':8, bottom:ry?8:'auto', left:rx?'auto':8, right:rx?8:'auto',
                borderTop:ry?'none':`3px solid ${C.gold}`, borderBottom:ry?`3px solid ${C.gold}`:'none',
                borderLeft:rx?'none':`3px solid ${C.gold}`, borderRight:rx?`3px solid ${C.gold}`:'none' }} />
            ))}
            {state === 'scanning' ? (
              <div style={{ position:'absolute', left:0, right:0, height:2,
                background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,
                animation:'scanLine 0.9s ease-in-out infinite' }}>
                <style>{`@keyframes scanLine{0%{transform:translateY(-85px)}100%{transform:translateY(85px)}}`}</style>
              </div>
            ) : (
              <QrGraphic size={88} />
            )}
            <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center',
              fontFamily:MONO, fontSize:8, color:C.gold, letterSpacing:'0.1em' }}>
              QR + NFC READY
            </div>
          </div>
          {/* Simulate buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
            {SIMS.map(s => (
              <button key={s.type} onClick={() => simulate(s.type)} disabled={state === 'scanning'}
                onTouchStart={e => e.currentTarget.style.background='rgba(181,138,58,0.12)'}
                onTouchEnd={e => e.currentTarget.style.background='rgba(181,138,58,0.06)'}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10,
                  border:`1px solid ${C.border}`, background:'rgba(181,138,58,0.06)', cursor:'pointer',
                  fontFamily:SANS, fontWeight:600, fontSize:13, color:C.navy, textAlign:'left', transition:'background 0.1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          {/* Enable Camera placeholder */}
          {cameraMsg ? (
            <p style={{ fontFamily:MONO, fontSize:9, color:C.green, textAlign:'center', marginBottom:12 }}>{cameraMsg}</p>
          ) : (
            <button onClick={() => { setCameraMsg('Camera scanner placeholder ready for device API integration.') }}
              style={{ width:'100%', padding:'11px', borderRadius:10, border:`1.5px dashed ${C.border}`,
                background:'transparent', fontFamily:SANS, fontSize:12, color:C.brown, cursor:'pointer', marginBottom:12 }}>
              Enable Camera Scanner
            </button>
          )}
          <button onClick={() => { triggerHaptic('light'); onClose() }}
            style={{ width:'100%', height:44, borderRadius:10, border:`1px solid ${C.border}`, background:'rgba(21,49,79,0.05)',
              fontFamily:SANS, fontWeight:600, fontSize:13, color:C.navy, cursor:'pointer' }}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN RESULT MODAL
══════════════════════════════════════════════════════════════ */
function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  if (!result) return null

  const { sourceType, data, error } = result

  if (!result.success || sourceType === 'invalid') {
    return (
      <ResultShell title="Invalid Passport Code" icon="error" iconColor={C.burgundy} onClose={onClose}>
        <p style={{ fontFamily:SANS, fontSize:13, color:C.charcoal, marginBottom:20, textAlign:'center', lineHeight:1.6 }}>
          This code is not connected to 360 Passport Connections.
        </p>
        <NavyBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</NavyBtn>
        <div style={{ height:10 }} />
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GoldBtn>
      </ResultShell>
    )
  }

  if (sourceType === 'venue') {
    return (
      <ResultShell title="Venue Check-In Verified" icon="store" iconColor={C.navy} badge="CHECK-IN" onClose={onClose}>
        <Fact label="Venue" value={data.name} />
        <Fact label="Location" value={`${data.city}, ${data.state}`} />
        <Fact label="Active Event" value={data.activeEventId ? 'Available tonight' : 'Open session'} />
        <Fact label="Available Stamps" value={data.availableStamps?.length + ' stamps available'} />
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, fontStyle:'italic', marginBottom:18, lineHeight:1.6 }}>
          "You're checked in at {data.name}. Available today: Event Stamp, Connection Stamp, Craft Stamp."
        </p>
        <GoldBtn full onClick={async () => { triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose(); }}>
          Start Passport Session
        </GoldBtn>
        <div style={{ height:8 }} />
        <NavyBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('events') }}>View Venue Events</NavyBtn>
        <div style={{ height:8 }} />
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose(); onAction('connections') }}>Find People Here</GoldBtn>
      </ResultShell>
    )
  }

  if (sourceType === 'event') {
    return (
      <ResultShell title="Event Check-In Verified" icon="event" iconColor={C.navy} badge="CHECK-IN" onClose={onClose}>
        <Fact label="Event" value={data.name} />
        <Fact label="Venue" value={data.venue} />
        <Fact label="Date & Time" value={`${data.date} · ${data.time}`} />
        <Fact label="Attendees" value={`${data.attendeeCount}/${data.capacity}`} />
        <Fact label="Stamp Unlocked" value={data.stampName} color={C.green} />
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, fontStyle:'italic', marginBottom:18, lineHeight:1.6 }}>
          "You're checked in for {data.name}. {data.stampName} unlocked."
        </p>
        <GoldBtn full onClick={async () => { triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose(); }}>
          Claim Event Stamp
        </GoldBtn>
        <div style={{ height:8 }} />
        <NavyBtn full onClick={() => { triggerHaptic('light'); onClose(); onAction('events') }}>View Event Details</NavyBtn>
        <div style={{ height:8 }} />
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose(); onAction('connections') }}>See People Attending</GoldBtn>
      </ResultShell>
    )
  }

  if (sourceType === 'member') {
    return (
      <ResultShell title="Connection Found" icon="person" iconColor={C.green} badge="MATCH FOUND" onClose={onClose}>
        <Fact label="Member" value={data.name} />
        <Fact label="Role" value={`${data.role} @ ${data.company}`} />
        <Fact label="Location" value={`${data.city}, ${data.state}`} />
        <Fact label="Match Score" value={`${data.matchScore}%`} color={C.gold} />
        <Fact label="Trust Status" value={data.trustStatus} color={C.green} />
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, fontStyle:'italic', marginBottom:18, lineHeight:1.6 }}>
          "You matched with {data.name}. {data.matchScore}% connection fit based on {data.sharedInterests?.join(' and ')}."
        </p>
        <GoldBtn full onClick={async () => { triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose(); }}>
          Verify Connection
        </GoldBtn>
        <div style={{ height:8 }} />
        <NavyBtn full onClick={() => { triggerHaptic('light'); onClose() }}>View Passport</NavyBtn>
        <div style={{ height:8 }} />
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Message Later</GoldBtn>
      </ResultShell>
    )
  }

  if (sourceType === 'stamp') {
    return (
      <ResultShell title="Stamp Ready to Claim" icon="workspace_premium" iconColor={C.brown} badge="AUTHENTICATED" onClose={onClose}>
        <Fact label="Stamp" value={data.name} />
        <Fact label="Category" value={data.category?.toUpperCase()} />
        <Fact label="Event" value={data.eventId || data.venueId || 'Verified Session'} />
        <Fact label="Status" value={data.authenticated ? 'Authenticated ✓' : 'Pending'} color={data.authenticated ? C.green : C.burgundy} />
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, fontStyle:'italic', marginBottom:18, lineHeight:1.6 }}>
          "{data.name} unlocked. Ready to claim."
        </p>
        <GoldBtn full onClick={async () => { triggerHaptic('success'); await claimStamp(data.id, 'current'); onShowOverlay('stamp'); onClose(); }}>
          Claim Stamp
        </GoldBtn>
        <div style={{ height:8 }} />
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose(); onAction('stamps') }}>View Stamp Collection</GoldBtn>
      </ResultShell>
    )
  }

  if (sourceType === 'benefit') {
    return (
      <ResultShell title="Benefit Unlocked" icon="star" iconColor={C.burgundy} badge="UNLOCKED" onClose={onClose}>
        <Fact label="Benefit" value={data.name} />
        <Fact label="Provider" value={data.provider} />
        <Fact label="Expires" value={data.expiration} />
        <Fact label="Eligibility" value={data.eligibility} />
        <p style={{ fontFamily:SANS, fontSize:12, color:C.brown, fontStyle:'italic', marginBottom:8, lineHeight:1.6 }}>
          "{data.redemption}"
        </p>
        <GoldBtn full onClick={async () => { triggerHaptic('success'); await redeemBenefit(data.id); onShowOverlay('benefit'); onClose(); }}>
          Redeem Benefit
        </GoldBtn>
        <div style={{ height:8 }} />
        <NavyBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Save to Passport</NavyBtn>
      </ResultShell>
    )
  }

  return null
}

function ResultShell({ title, icon, iconColor, badge, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.55)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'20px 20px 0 0', background:C.ivory, borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(21,49,79,0.2)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border }} />
        </div>
        <div style={{ padding:'16px 22px 40px' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:18 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:`${iconColor}15`,
              border:`2px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
              <span className="material-symbols-outlined" style={{ fontSize:32, color:iconColor, ...FILL1 }}>{icon}</span>
            </div>
            {badge && <span style={{ fontFamily:MONO, fontSize:8, color:iconColor, background:`${iconColor}10`,
              border:`1px solid ${iconColor}30`, padding:'2px 10px', borderRadius:99, marginBottom:8, letterSpacing:'0.12em' }}>{badge}</span>}
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.navy, textAlign:'center' }}>{title}</p>
          </div>
          <div style={{ background:C.parchment, borderRadius:10, padding:'14px 16px', marginBottom:18, border:`1px solid ${C.border}` }}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Fact({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontFamily:MONO, fontSize:9, color:C.brown, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color: color || C.charcoal }}>{value}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STAMP OVERLAY — "Updating Passport…" → "Authenticated"
══════════════════════════════════════════════════════════════ */
function StampOverlay({ type, muted, onDone }) {
  const [step, setStep] = useState('updating')
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('done')
      if (!muted) { playStampSound(); playSuccessTone() }
      triggerHaptic('success')
    }, 1200)
    return () => clearTimeout(t)
  }, [muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.7)', backdropFilter:'blur(12px)' }} />
      <motion.div initial={{ scale:0.82, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:300, borderRadius:20, padding:'32px 24px 28px',
          background:C.ivory, border:`2.5px solid ${C.gold}`,
          boxShadow:'0 20px 60px rgba(21,49,79,0.25)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step === 'updating' ? (
            <motion.div key="updating" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 18px', border:`3px solid ${C.gold}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                animation:'spinGold 1.2s linear infinite' }}>
                <style>{`@keyframes spinGold{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                <span className="material-symbols-outlined" style={{ fontSize:34, color:C.gold, ...FILL1 }}>verified</span>
              </div>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.navy }}>Updating Passport…</p>
              <p style={{ fontFamily:MONO, fontSize:9, color:C.brown, marginTop:8, letterSpacing:'0.12em' }}>SECURING YOUR RECORD</p>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', damping:18, stiffness:260 }}>
              <div style={{ width:80, height:80, borderRadius:'50%', margin:'0 auto 14px', background:`${C.gold}15`, border:`2px solid ${C.gold}`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:42, color:C.gold, ...FILL1 }}>verified</span>
              </div>
              <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:22, color:C.navy, marginBottom:4 }}>Passport Updated</p>
              <p style={{ fontFamily:MONO, fontSize:10, color:C.gold, letterSpacing:'0.14em', marginBottom:18 }}>AUTHENTICATED</p>
              <GoldBtn full onClick={onDone}>Continue</GoldBtn>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STAMP DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function StampDetailModal({ stamp, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.5)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:340, borderRadius:18, background:C.ivory,
          border:`2px solid ${C.gold}`, boxShadow:'0 20px 60px rgba(21,49,79,0.18)' }}>
        {/* Header strip */}
        <div style={{ background:C.parchment, borderRadius:'16px 16px 0 0', padding:'24px 20px 20px',
          borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:`${stamp.color}18`,
            border:`2px solid ${stamp.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:36, color:stamp.color, ...FILL1 }}>{stamp.icon}</span>
          </div>
          <span style={{ fontFamily:MONO, fontSize:8, color:stamp.color, background:`${stamp.color}12`,
            border:`1px solid ${stamp.color}30`, padding:'2px 10px', borderRadius:99, letterSpacing:'0.12em' }}>{stamp.label}</span>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.navy, marginTop:8 }}>{stamp.name}</p>
        </div>
        <div style={{ padding:'16px 20px 24px' }}>
          <p style={{ fontFamily:SANS, fontSize:13, color:C.charcoal, lineHeight:1.65, marginBottom:14 }}>{stamp.description}</p>
          <Fact label="Requirement" value={stamp.requirement} />
          <Fact label="Status" value={stamp.earned ? 'Earned ✓' : 'Not yet earned'} color={stamp.earned ? C.green : C.burgundy} />
          {stamp.earnedDate && <Fact label="Earned" value={stamp.earnedDate} />}
          <div style={{ marginTop:18 }}>
            <GoldBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GoldBtn>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   EVENT DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  async function handleRsvp() {
    setLoading(true); triggerHaptic('success')
    await rsvpToEvent(event.id)
    setRsvpd(true); setLoading(false)
    onRsvp(event.id)
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.5)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'20px 20px 0 0', background:C.ivory, borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(21,49,79,0.18)', padding:'14px 22px 40px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{ minWidth:56, textAlign:'center', background:C.navy, borderRadius:10, padding:'8px 10px' }}>
            <p style={{ fontFamily:MONO, fontSize:8, color:'rgba(255,255,255,0.6)', letterSpacing:'0.1em' }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:'#fff' }}>{event.date?.split(' ')[1]}</p>
          </div>
          <div>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.navy }}>{event.name}</p>
            <p style={{ fontFamily:SANS, fontSize:12, color:C.brown }}>{event.venue} · {event.city} · {event.time}</p>
          </div>
        </div>
        <div style={{ background:C.parchment, borderRadius:10, padding:'12px 14px', marginBottom:16, border:`1px solid ${C.border}` }}>
          <Fact label="Attendees" value={`${event.attendeeCount}/${event.capacity}`} />
          <Fact label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct > 85 ? C.burgundy : C.green} />
          <Fact label="Stamp Opportunity" value="Available at check-in" color={C.gold} />
        </div>
        {rsvpd ? (
          <div style={{ padding:'12px', background:`${C.green}12`, border:`1px solid ${C.green}30`, borderRadius:10, textAlign:'center', marginBottom:12 }}>
            <span className="material-symbols-outlined" style={{ fontSize:20, color:C.green, ...FILL1 }}>check_circle</span>
            <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.green }}>RSVP Confirmed</p>
          </div>
        ) : (
          <GoldBtn full onClick={handleRsvp} style={{ marginBottom:10 }}>
            {loading ? 'Confirming…' : 'RSVP Now'}
          </GoldBtn>
        )}
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); onClose() }}>Close</GoldBtn>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════════════════════════════ */
function ProfileModal({ profile, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const xpPct = Math.round((profile.xp / profile.nextTierXp) * 100)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.55)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.92 }}
        style={{ position:'relative', width:'100%', maxWidth:360, borderRadius:20, background:C.ivory,
          border:`2px solid ${C.gold}`, boxShadow:'0 20px 60px rgba(21,49,79,0.22)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {/* Header */}
        <div style={{ background:C.navy, borderRadius:'18px 18px 0 0', padding:'28px 20px 24px', textAlign:'center', position:'relative' }}>
          <GuillocheWatermark size={180} opacity={0.12} />
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:`${C.gold}22`, border:`2.5px solid ${C.gold}`,
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:26, color:C.gold }}>{profile.initials}</span>
            </div>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:'#fff' }}>{profile.displayName}</p>
            <p style={{ fontFamily:SANS, fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{profile.role} @ {profile.company}</p>
            <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:8, color:C.gold,
              background:`${C.gold}18`, border:`1px solid ${C.gold}30`, padding:'2px 12px', borderRadius:99, letterSpacing:'0.12em' }}>
              {profile.tier?.toUpperCase()} MEMBER
            </span>
          </div>
        </div>
        <div style={{ padding:'18px 20px 28px' }}>
          {/* XP bar */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:MONO, fontSize:9, color:C.brown, textTransform:'uppercase' }}>Passport XP</span>
              <span style={{ fontFamily:MONO, fontSize:9, color:C.gold }}>{profile.xp} / {profile.nextTierXp}</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:C.parchment, border:`1px solid ${C.border}` }}>
              <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.brown},${C.gold})` }} />
            </div>
          </div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { val: profile.verifiedConnections, label:'Connections' },
              { val: profile.stampsEarned, label:'Stamps' },
              { val: profile.eventsAttended, label:'Events' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', background:C.parchment, borderRadius:8, padding:'10px 6px', border:`1px solid ${C.border}` }}>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.navy }}>{s.val}</p>
                <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, textTransform:'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <Fact label="Passport ID" value={profile.passportId} />
          <Fact label="Member Since" value={profile.memberSince} />
          <Fact label="Status" value={profile.status} color={C.green} />
          <div style={{ marginTop:18 }}>
            <GoldBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Close</GoldBtn>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   GUIDE MODAL
══════════════════════════════════════════════════════════════ */
function GuideModal({ step, onClose }) {
  const GUIDE = {
    1: { title:'Scan In', icon:'qr_code_scanner', body:'Enter a service or event using your QR passport. Tap Scan in the app, point at any 360 Passport QR code, and your check-in is automatic.' },
    2: { title:'Build Profile', icon:'person_edit', body:'Share your story, interests, goals, and what matters. A richer profile means smarter matches and better introductions from the network.' },
    3: { title:'Meet People', icon:'hub', body:'Connect with verified members and better matches. The app surfaces people you should know based on shared events, goals, and industry overlap.' },
    4: { title:'Earn Stamps', icon:'workspace_premium', body:'Collect stamps, gain access, perks, and grow legacy. Every verified interaction — venue check-in, connection, event — adds a stamp to your Passport.' },
  }
  const g = GUIDE[step] || GUIDE[1]
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.5)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.92 }}
        style={{ position:'relative', width:'100%', maxWidth:320, borderRadius:18, background:C.ivory,
          border:`2px solid ${C.gold}`, boxShadow:'0 16px 48px rgba(21,49,79,0.18)', padding:'28px 22px 26px' }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:`${C.navy}10`, border:`2px solid ${C.border}`,
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:32, color:C.navy, ...FILL1 }}>{g.icon}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.navy }}>{g.title}</p>
        </div>
        <p style={{ fontFamily:SANS, fontSize:13, color:C.charcoal, lineHeight:1.7, marginBottom:20, textAlign:'center' }}>{g.body}</p>
        <GoldBtn full onClick={() => { triggerHaptic('light'); onClose() }}>Got It</GoldBtn>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ADMIN SOURCE PANEL
══════════════════════════════════════════════════════════════ */
function AdminPanel({ onClose }) {
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  async function queueOpenAI(assetId) {
    const { requestOpenAIImageReplacement } = await import('../../api/passportScanApi.js')
    const res = await requestOpenAIImageReplacement(assetId, prompt || 'Professional passport-style portrait')
    setStatus(res.message)
  }
  const ITEMS = [
    { label:'Edit venue data', icon:'store', action: () => setStatus('Edit src/data/venues.js') },
    { label:'Edit event data', icon:'event', action: () => setStatus('Edit src/api/passportHomeApi.js or add to data/events.js') },
    { label:'Edit member data', icon:'people', action: () => setStatus('Edit src/data/members.js') },
    { label:'Edit stamp data', icon:'workspace_premium', action: () => setStatus('Edit src/data/stamps.js') },
    { label:'Edit benefit data', icon:'star', action: () => setStatus('Edit src/data/benefits.js') },
    { label:'Replace hero image', icon:'image', action: () => setStatus('Update craftImages.backgrounds.passport in src/lib/craftImages.js') },
  ]
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(21,49,79,0.6)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:16 }}
        style={{ position:'relative', width:'100%', maxWidth:400, borderRadius:18, background:C.ivory,
          border:`2px solid ${C.gold}`, boxShadow:'0 20px 60px rgba(21,49,79,0.28)',
          maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ background:C.parchment, borderRadius:'16px 16px 0 0', padding:'18px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:C.gold, ...FILL1 }}>admin_panel_settings</span>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.navy }}>Admin Source Panel</p>
        </div>
        <div style={{ padding:'16px 20px 24px' }}>
          {ITEMS.map(item => (
            <button key={item.label} onClick={item.action}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                borderRadius:10, border:`1px solid ${C.border}`, background:C.parchment, cursor:'pointer',
                marginBottom:8, textAlign:'left', transition:'background 0.12s', fontFamily:SANS, fontSize:13, color:C.charcoal }}
              onMouseEnter={e => e.currentTarget.style.background=`${C.gold}12`}
              onMouseLeave={e => e.currentTarget.style.background=C.parchment}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginTop:6 }}>
            <p style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Image prompt for OpenAI…"
              style={{ width:'100%', padding:'9px 11px', borderRadius:10, border:`1px solid ${C.border}`,
                background:'#fff', color:C.charcoal, fontFamily:SANS, fontSize:12, marginBottom:8, outline:'none', boxSizing:'border-box' }} />
            <button onClick={() => queueOpenAI('passport-hero')}
              style={{ width:'100%', height:42, borderRadius:10, border:`1px solid ${C.border}`, background:C.navy,
                color:'#fff', fontFamily:SANS, fontWeight:700, fontSize:12, cursor:'pointer', marginBottom:8 }}>
              Queue OpenAI Request
            </button>
            {/* Real OpenAI image generation must happen on the backend. Never expose API keys in browser code. */}
            {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.green, marginBottom:8 }}>{status}</p>}
            <p style={{ fontFamily:MONO, fontSize:7.5, color:'rgba(111,85,36,0.5)', lineHeight:1.5 }}>
              Real OpenAI image generation must happen on the backend. Never expose API keys in browser code.
            </p>
          </div>
          <GoldBtn full onClick={() => { triggerHaptic('light'); onClose() }} style={{ marginTop:14 }}>Close</GoldBtn>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function Toast({ msg, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
          style={{ position:'fixed', bottom:104, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:12, padding:'11px 20px',
            display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 24px rgba(21,49,79,0.2)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:C.navy }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════════════════════════════ */
function BottomNav({ active, onScan }) {
  const navigate = useNavigate()
  const NAV = [
    { id:'home',      icon:'home',             label:'Home',      route:'/' },
    { id:'directory', icon:'contact_page',      label:'Directory', route:'/passport/directory' },
    { id:'scan',      icon:'qr_code_scanner',  label:'',          scan:true },
    { id:'events',    icon:'event',             label:'Events',    route:'/passport/events' },
    { id:'benefits',  icon:'redeem',            label:'Benefits',  route:'/passport/benefits' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:600, margin:'0 auto',
        background:C.ivory, borderTop:`2px solid ${C.border}`,
        boxShadow:'0 -4px 20px rgba(21,49,79,0.08)', paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'8px 6px 4px' }}>
          {NAV.map(item => {
            const isActive = active === item.id
            if (item.scan) return (
              <button key="scan" onClick={() => { triggerHaptic('medium'); onScan() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.91)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:56, height:56, borderRadius:'50%', border:'none', background:C.gold,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  boxShadow:`0 4px 18px rgba(181,138,58,0.4), 0 0 0 4px ${C.ivory}, 0 0 0 5px ${C.border}`,
                  transform:'translateY(-10px)', flexShrink:0, transition:'transform 0.1s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:24, color:'#fff', ...FILL1 }}>qr_code_scanner</span>
              </button>
            )
            return (
              <button key={item.id}
                onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.88)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:52, padding:'4px 0',
                  background:'none', border:'none', cursor:'pointer', transition:'transform 0.1s' }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize:22, color: isActive ? C.gold : 'rgba(21,49,79,0.35)', ...( isActive ? FILL1 : {}) }}>
                  {item.icon}
                </span>
                <span style={{ fontFamily:MONO, fontSize:8.5, letterSpacing:'0.06em',
                  color: isActive ? C.gold : 'rgba(21,49,79,0.35)', textTransform:'uppercase' }}>
                  {item.label}
                </span>
                {isActive && <div style={{ width:18, height:2, borderRadius:1, background:C.gold }} />}
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
  const [overlayType, setOverlayType] = useState(null)
  const [guideStep, setGuideStep]   = useState(null)
  const [muted, setMuted]           = useState(false)
  const [events, setEvents]         = useState([])
  const [rsvpdIds, setRsvpdIds]     = useState(new Set())
  const [toast, setToast]           = useState({ visible:false, msg:'' })

  useEffect(() => {
    getUpcomingEvents().then(setEvents)
  }, [])

  useEffect(() => {
    const handler = e => {
      if (e.altKey && e.key === 'a') { triggerHaptic('light'); setModal('admin') }
      if (e.altKey && e.key === 'A') { triggerHaptic('light'); setModal('admin') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function showToast(msg) {
    setToast({ visible:true, msg })
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3000)
  }

  function handleScanResult(result) {
    setScanResult(result)
    setModal('scan-result')
  }

  function handleOverlay(type) {
    setOverlayType(type)
    setModal('overlay')
    const msg = type === 'stamp' ? 'Stamp claimed. Passport updated.' :
                type === 'verify' ? 'Connection verified. Passport updated.' :
                type === 'check-in' ? 'Venue check-in verified.' :
                type === 'benefit' ? 'Benefit saved to Passport.' : 'Passport updated.'
    setTimeout(() => showToast(msg), 1400)
  }

  function handleAction(action) {
    if (action === 'reopen-scan') { setModal('scan'); return }
    if (action === 'events') navigate('/passport/events')
    if (action === 'connections') navigate('/passport/connections')
    if (action === 'stamps') navigate('/passport/stamps')
    if (action === 'directory') navigate('/passport/directory')
    if (action === 'benefits') navigate('/passport/benefits')
  }

  const profile = PASSPORT_PROFILE

  return (
    <div style={{ minHeight:'100vh', background:C.ivory, paddingBottom:110, overflowX:'hidden' }}>

      {/* ── Top header ───────────────────────────────────── */}
      <div style={{ background:C.ivory, borderBottom:`1px solid ${C.border}`, padding:'20px 18px 16px', position:'relative', overflow:'hidden' }}>
        {/* Watermark */}
        <div style={{ position:'absolute', right:-20, top:-20, pointerEvents:'none' }}>
          <GuillocheWatermark size={180} opacity={0.07} />
        </div>
        <div style={{ position:'relative', zIndex:2 }}>
          {/* Logo row */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
            <div style={{ width:48, height:48, borderRadius:10, background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative', overflow:'hidden' }}>
              <span className="material-symbols-outlined" style={{ fontSize:26, color:C.gold, ...FILL1 }}>book</span>
              <div style={{ position:'absolute', bottom:3, right:3, fontFamily:MONO, fontSize:6, color:`${C.gold}99`, fontWeight:700 }}>360</div>
            </div>
            <div>
              <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:19, color:C.navy, lineHeight:1, letterSpacing:'0.01em' }}>360 PASSPORT</p>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:19, color:C.gold, lineHeight:1, letterSpacing:'0.01em' }}>CONNECTIONS</p>
              <p style={{ fontFamily:MONO, fontSize:7.5, color:C.brown, letterSpacing:'0.16em', marginTop:4, textTransform:'uppercase' }}>Your digital passport to verified connections</p>
            </div>
          </div>
          {/* Tagline */}
          <p style={{ fontFamily:SANS, fontSize:11.5, color:'rgba(21,49,79,0.5)', lineHeight:1.55, fontStyle:'italic' }}>
            Building meaningful connections and a legacy of trust, impact, and opportunity.
          </p>
          {/* Mute toggle */}
          <button onClick={() => { triggerHaptic('light'); setMuted(m => !m) }}
            style={{ position:'absolute', top:0, right:0, display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
              borderRadius:99, border:`1px solid ${C.border}`, background: muted ? `${C.burgundy}10` : 'rgba(181,138,58,0.08)',
              cursor:'pointer', fontFamily:MONO, fontSize:9, color: muted ? C.burgundy : C.brown }}>
            <span className="material-symbols-outlined" style={{ fontSize:14, color: muted ? C.burgundy : C.gold, ...FILL1 }}>
              {muted ? 'volume_off' : 'volume_up'}
            </span>
            {muted ? 'Muted' : 'Mute'}
          </button>
        </div>
      </div>

      <div style={{ padding:'14px 16px 0' }}>

        {/* ── Scan card ─────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:C.parchment,
          border:`1px solid ${C.border}`, borderRadius:14, marginBottom:18,
          boxShadow:'0 2px 10px rgba(21,49,79,0.06)' }}>
          <div onClick={() => { triggerHaptic('medium'); setModal('scan') }} style={{ cursor:'pointer', flexShrink:0 }}>
            <QrGraphic size={52} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:SANS, fontWeight:700, fontSize:14, color:C.navy }}>360 Passport Connection</p>
            <p style={{ fontFamily:MONO, fontSize:9, color:C.brown, letterSpacing:'0.06em' }}>Scan to connect — Active session</p>
          </div>
          <GoldBtn onClick={() => { triggerHaptic('medium'); setModal('scan') }} style={{ height:40, padding:'0 18px', fontSize:12 }}>
            SCAN
          </GoldBtn>
        </div>

        {/* ── Security line ──────────────────────────────── */}
        <div style={{ fontFamily:MONO, fontSize:7.5, color:`${C.brown}60`, letterSpacing:'0.22em', textAlign:'center', marginBottom:18, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
          EVERY STAMP TELLS A STORY · EVERY CONNECTION BUILDS LEGACY
        </div>

        {/* ── How It Works ──────────────────────────────── */}
        <SectionLabel right={
          <button onClick={() => { triggerHaptic('light'); setGuideStep(1) }}
            style={{ fontFamily:MONO, fontSize:9, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>
            Full guide →
          </button>
        }>How It Works</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
          {[
            { num:1, icon:'qr_code_scanner', title:'Scan In',       sub:'Enter a service or event using your QR passport.' },
            { num:2, icon:'person_edit',     title:'Build Profile',  sub:'Share your story, interests, goals, and what matters.' },
            { num:3, icon:'hub',             title:'Meet People',    sub:'Connect with verified members and better matches.' },
            { num:4, icon:'workspace_premium',title:'Earn Stamps',   sub:'Collect stamps, gain access, perks, and grow legacy.' },
          ].map(s => (
            <Card key={s.num} onClick={() => { triggerHaptic('light'); setGuideStep(s.num) }}
              style={{ padding:'12px 10px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:6 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold, ...FILL1 }}>{s.icon}</span>
              </div>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:11, color:C.navy }}>{s.title}</p>
              <p style={{ fontFamily:SANS, fontSize:9.5, color:C.brown, lineHeight:1.45 }}>{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* ── Start Here ────────────────────────────────── */}
        <SectionLabel right={<span style={{ fontFamily:MONO, fontSize:9, color:C.brown, letterSpacing:'0.06em' }}>YOUR NEXT ACTIONS</span>}>
          Start Here
        </SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 }}>
          {[
            { icon:'qr_code_scanner', label:'Scan to Connect',    sub:'Find events and venues nearby',     action:() => { triggerHaptic('medium'); setModal('scan') } },
            { icon:'contact_page',   label:'Explore Directory',   sub:'Discover verified members',          action:() => { triggerHaptic('light'); navigate('/passport/directory') } },
            { icon:'hub',            label:'View Matches',        sub:'See your top connections',           action:() => { triggerHaptic('light'); navigate('/passport/connections') } },
            { icon:'event',          label:'Join an Event',       sub:'RSVP & meet in person',              action:() => { triggerHaptic('light'); navigate('/passport/events') } },
            { icon:'redeem',         label:'Explore Benefits',    sub:'Unlock rewards, perks & access',     action:() => { triggerHaptic('light'); navigate('/passport/benefits') } },
          ].map(a => (
            <Card key={a.label} onClick={a.action}
              style={{ padding:'12px 8px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:5 }}>
              <span className="material-symbols-outlined" style={{ fontSize:24, color:C.gold, ...FILL1 }}>{a.icon}</span>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:10, color:C.navy, lineHeight:1.3 }}>{a.label}</p>
              <p style={{ fontFamily:SANS, fontSize:8.5, color:C.brown, lineHeight:1.4 }}>{a.sub}</p>
            </Card>
          ))}
        </div>

        {/* ── Passport Sections ─────────────────────────── */}
        <SectionLabel>Passport Sections</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { icon:'contact_page',  label:'Directory',    sub:'Verified members, brands & more', route:'/passport/directory',    color:C.navy },
            { icon:'hub',           label:'Connections',  sub:'Your network & conversations',    route:'/passport/connections',  color:C.green },
            { icon:'event',         label:'Events',       sub:'Curated experiences & invites',   route:'/passport/events',       color:C.brown },
            { icon:'redeem',        label:'Benefits',     sub:'Access perks & privileges',       route:'/passport/benefits',     color:C.burgundy },
          ].map(s => (
            <Card key={s.label} onClick={() => { triggerHaptic('light'); navigate(s.route) }}
              style={{ padding:'16px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:`${s.color}14`, border:`1px solid ${s.color}25`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:20, color:s.color, ...FILL1 }}>{s.icon}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.navy }}>{s.label}</p>
                <p style={{ fontFamily:SANS, fontSize:10, color:C.brown, lineHeight:1.35 }}>{s.sub}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:`${C.gold}80` }}>chevron_right</span>
            </Card>
          ))}
        </div>

        {/* ── Digital Stamps ────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionLabel>Digital Stamps</SectionLabel>
          <button onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }}
            style={{ fontFamily:MONO, fontSize:9, color:C.gold, background:'none', border:'none', cursor:'pointer', marginBottom:12, letterSpacing:'0.06em' }}>
            VIEW ALL
          </button>
        </div>
        <Card style={{ padding:'16px 14px', marginBottom:10 }}>
          <p style={{ fontFamily:MONO, fontSize:8, color:C.brown, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12 }}>
            COLLECT · EARN · UNLOCK
          </p>
          <div style={{ display:'flex', justifyContent:'space-around', marginBottom:6 }}>
            {STAMPS.map(stamp => (
              <button key={stamp.id} onClick={() => { triggerHaptic('light'); setSelStamp(stamp) }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.91)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', transition:'transform 0.1s', opacity: stamp.earned ? 1 : 0.4 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:`${stamp.color}14`,
                  border:`1.5px solid ${stamp.color}${stamp.earned ? '55' : '25'}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:20, color:stamp.earned ? stamp.color : `${stamp.color}80`, ...FILL1 }}>{stamp.icon}</span>
                </div>
                <span style={{ fontFamily:MONO, fontSize:7.5, color: stamp.earned ? stamp.color : C.brown, textTransform:'uppercase', letterSpacing:'0.08em' }}>{stamp.label}</span>
              </button>
            ))}
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8, textAlign:'center',
            fontFamily:MONO, fontSize:7.5, color:C.brown, letterSpacing:'0.12em' }}>
            AUTHENTICATED
          </div>
        </Card>
        <GoldBtn full outline onClick={() => { triggerHaptic('light'); navigate('/passport/stamps') }} style={{ marginBottom:20, height:44 }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, ...FILL1 }}>workspace_premium</span>
          View My Stamp Collection
        </GoldBtn>

        {/* ── Upcoming Events ───────────────────────────── */}
        <SectionLabel right={
          <button onClick={() => { triggerHaptic('light'); navigate('/passport/events') }}
            style={{ fontFamily:MONO, fontSize:9, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>See All →</button>
        }>Upcoming Events</SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
          {events.map(ev => (
            <Card key={ev.id} onClick={() => { triggerHaptic('light'); setSelEvent(ev) }}
              style={{ padding:'14px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ minWidth:50, textAlign:'center', background:C.navy, borderRadius:8, padding:'6px 8px', flexShrink:0 }}>
                <p style={{ fontFamily:MONO, fontSize:7, color:'rgba(255,255,255,0.6)', letterSpacing:'0.1em' }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:'#fff', lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.navy, lineHeight:1.3 }}>{ev.name}</p>
                <p style={{ fontFamily:SANS, fontSize:11, color:C.brown }}>{ev.venue} · {ev.city} · {ev.time}</p>
              </div>
              {(rsvpdIds.has(ev.id) || ev.rsvpd) ? (
                <span style={{ fontFamily:MONO, fontSize:8, color:C.green, background:`${C.green}10`,
                  border:`1px solid ${C.green}30`, padding:'3px 9px', borderRadius:99, flexShrink:0 }}>RSVP'd</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize:18, color:`${C.gold}80` }}>chevron_right</span>
              )}
            </Card>
          ))}
        </div>
        <GoldBtn full outline onClick={async () => {
          triggerHaptic('success')
          await Promise.all(events.map(e => rsvpToEvent(e.id)))
          setRsvpdIds(new Set(events.map(e => e.id)))
          showToast('RSVP confirmed for all upcoming events.')
        }} style={{ marginBottom:20, height:44 }}>
          RSVP to All Upcoming Events
        </GoldBtn>

        {/* ── Recent Activity ───────────────────────────── */}
        <SectionLabel right={
          <button style={{ fontFamily:MONO, fontSize:9, color:C.gold, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em' }}>All →</button>
        }>Recent Activity</SectionLabel>
        <Card style={{ padding:'6px 14px', marginBottom:24 }}>
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={a.id} onClick={() => triggerHaptic('light')}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0',
                borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none', cursor:'pointer' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:`${a.color}14`,
                border:`1px solid ${a.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:a.color, ...FILL1 }}>{a.icon}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:SANS, fontWeight:700, fontSize:12, color:C.navy }}>{a.label}</p>
                <p style={{ fontFamily:SANS, fontSize:10.5, color:C.brown, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.detail}</p>
              </div>
              <span style={{ fontFamily:MONO, fontSize:9, color:`${C.brown}70`, flexShrink:0 }}>{a.time}</span>
            </div>
          ))}
        </Card>

        {/* ── Profile card ──────────────────────────────── */}
        <Card onClick={() => { triggerHaptic('light'); setModal('profile') }}
          style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            border:`2px solid ${C.gold}` }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.gold }}>{profile.initials}</span>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:14, color:C.navy }}>{profile.displayName}</p>
            <p style={{ fontFamily:MONO, fontSize:8.5, color:C.brown, letterSpacing:'0.06em' }}>
              {profile.tier?.toUpperCase()} MEMBER · #{profile.passportId.slice(-4)}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={e => { e.stopPropagation(); triggerHaptic('light'); navigate('/passport/profile') }}
              onTouchStart={e => { e.stopPropagation(); e.currentTarget.style.transform='scale(0.93)' }}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ padding:'7px 14px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'rgba(21,49,79,0.06)',
                fontFamily:SANS, fontWeight:600, fontSize:11, color:C.navy, cursor:'pointer', transition:'transform 0.1s' }}>
              Edit
            </button>
            <GoldBtn onClick={e => { e.stopPropagation(); triggerHaptic('light'); setModal('profile') }}
              style={{ height:36, padding:'0 14px', fontSize:11 }}>
              View Profile
            </GoldBtn>
          </div>
        </Card>

        <p style={{ fontFamily:MONO, fontSize:8, color:`${C.brown}50`, textAlign:'center', letterSpacing:'0.16em', marginBottom:8 }}>
          EPIC TO NEXT RANK ↑
        </p>

      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'scan' && (
          <ScanModal key="scan" muted={muted} onClose={() => setModal(null)}
            onResult={result => { setModal(null); setTimeout(() => handleScanResult(result), 60) }} />
        )}
        {modal === 'scan-result' && scanResult && (
          <ScanResultModal key="scan-result" result={scanResult} muted={muted}
            onClose={() => setModal(null)} onAction={handleAction} onShowOverlay={handleOverlay} />
        )}
        {modal === 'overlay' && (
          <StampOverlay key="overlay" type={overlayType} muted={muted} onDone={() => setModal(null)} />
        )}
        {modal === 'profile' && (
          <ProfileModal key="profile" profile={profile} onClose={() => { triggerHaptic('light'); setModal(null) }} />
        )}
        {modal === 'admin' && (
          <AdminPanel key="admin" onClose={() => { triggerHaptic('light'); setModal(null) }} />
        )}
        {guideStep && (
          <GuideModal key={`guide-${guideStep}`} step={guideStep} onClose={() => setGuideStep(null)} />
        )}
        {selStamp && (
          <StampDetailModal key={`stamp-${selStamp.id}`} stamp={selStamp} onClose={() => setSelStamp(null)} />
        )}
        {selEvent && (
          <EventDetailModal key={`event-${selEvent.id}`} event={selEvent}
            onClose={() => setSelEvent(null)}
            onRsvp={id => { setRsvpdIds(s => new Set([...s, id])); showToast('RSVP confirmed.') }} />
        )}
      </AnimatePresence>

      <Toast msg={toast.msg} visible={toast.visible} />
      <BottomNav active="home" onScan={() => { triggerHaptic('medium'); setModal('scan') }} />
    </div>
  )
}
