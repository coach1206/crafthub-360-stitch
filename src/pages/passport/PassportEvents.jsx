import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { playStampSound, playSuccessTone } from '../../utils/sound.js'
import { PASSPORT_EVENTS } from '../../data/passportEvents.js'
import { attendEvent, requestVipAccess, scanEventQr, unlockEventStamp } from '../../api/passportEventsApi.js'
import { getEventImage, updateEventImage, generateEventImagePrompt, requestOpenAIImageReplacement } from '../../api/imageSourceApi.js'

const FILL1 = { fontVariationSettings:"'FILL' 1" }
const FALLBACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBibwIn3K4im-7feOc6MbE0qrLgoKLyluRCrG3hjStuvfdpV18KH3A62G-Qz_6SVfNrj8RmOIz4hgjZbsiGf5vrfo17Uf0QYtARmYGCz3AONU-8UZEcE8OSFgxjJwc2qzjNic1fMb52TVcCBU_2QQ-yDTSHGdEzFFXRQYmR_R8lGcWMHEeM5hpoR4wpZFsjtro1GAI7dOrXg5xHk9gr32bXN3Vbzy7Ng-LmBNF7rU_vEhH3psYZXs9IvOT6qmbzmAV5Jtgn4Cdo8XQ'

/* ── Filter config ───────────────────────────────────────────── */
const FILTERS = [
  { id:'all',        label:'All'        },
  { id:'featured',   label:'Featured'   },
  { id:'vip',        label:'VIP Only'   },
  { id:'craft',      label:'Craft'      },
  { id:'networking', label:'Networking' },
  { id:'attending',  label:'Attending'  },
]

/* ── Badge helpers ───────────────────────────────────────────── */
const BADGE_STYLES = {
  featured:   { bg:'rgba(10,7,2,0.88)', border:'rgba(197,160,89,0.55)', color:'#e9c176', icon:'star' },
  vip:        { bg:'rgba(10,2,20,0.88)', border:'rgba(168,85,247,0.6)',  color:'#d4aaff', icon:'workspace_premium' },
  craft:      { bg:'rgba(2,10,8,0.88)',  border:'rgba(45,180,120,0.5)', color:'#6ee7b7', icon:'local_florist' },
  networking: { bg:'rgba(2,6,18,0.88)',  border:'rgba(74,158,255,0.5)', color:'#93c5fd', icon:'hub' },
}

function Badge({ type }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.craft
  const label = type === 'vip' ? 'VIP ONLY' : type.toUpperCase()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:99, background:s.bg, border:`1px solid ${s.border}` }}>
      <span className="material-symbols-outlined" style={{ fontSize:9, color:s.color, ...FILL1 }}>{s.icon}</span>
      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, fontWeight:700, color:s.color, letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</span>
    </div>
  )
}

function DateBadge({ mon, day }) {
  return (
    <div style={{ textAlign:'center', background:'rgba(6,4,2,0.9)', backdropFilter:'blur(8px)', borderRadius:10, border:'1px solid rgba(197,160,89,0.35)', padding:'5px 11px', minWidth:44, flexShrink:0 }}>
      <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, fontWeight:700, color:'#c5a059', letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:1 }}>{mon}</p>
      <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#fff', lineHeight:1, marginTop:1 }}>{day}</p>
    </div>
  )
}

function ProgressBar({ pct, accent = '#c5a059' }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped >= 100 ? '#ef4444' : clamped >= 80 ? '#ff8f00' : accent
  return (
    <div style={{ position:'relative' }}>
      <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2 }}>
        <div style={{ height:'100%', width:`${clamped}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:2, transition:'width 0.6s ease' }} />
      </div>
      <div style={{ position:'absolute', right:0, bottom:4, fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:`${color}99`, letterSpacing:'0.08em' }}>
        {clamped}% Filled
      </div>
    </div>
  )
}

function StampChip({ stamps, accent = '#c5a059', onClick }) {
  return (
    <button onClick={onClick} onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'} onTouchEnd={e => e.currentTarget.style.transform=''}
      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99, background:`${accent}12`, border:`1px solid ${accent}30`, cursor:'pointer', flexShrink:0 }}>
      <span className="material-symbols-outlined" style={{ fontSize:11, color:accent, ...FILL1 }}>workspace_premium</span>
      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color:accent }}>+{stamps} STAMPS</span>
    </button>
  )
}

function AttendingChip({ attendees, capacity, onClick }) {
  return (
    <button onClick={onClick} onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'} onTouchEnd={e => e.currentTarget.style.transform=''}
      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:99, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', flexShrink:0 }}>
      <span className="material-symbols-outlined" style={{ fontSize:11, color:'rgba(255,255,255,0.5)', ...FILL1 }}>group</span>
      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.55)' }}>{attendees}/{capacity} ATTENDING</span>
    </button>
  )
}

/* ── CTA button ──────────────────────────────────────────────── */
function CTAButton({ event, onAttend, onVip, onDetail }) {
  const { rsvpStatus, accent } = event
  if (rsvpStatus === 'soldout') {
    return (
      <div>
        <button disabled style={{ height:42, padding:'0 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(30,30,30,0.5)', cursor:'not-allowed', fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          SOLD OUT
        </button>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:4, textAlign:'center', letterSpacing:'0.06em' }}>This experience is full.</p>
      </div>
    )
  }
  if (rsvpStatus === 'vip') {
    return (
      <button onClick={() => { triggerHaptic('medium'); onVip?.() }}
        onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
        onTouchEnd={e => e.currentTarget.style.transform=''}
        style={{ height:42, padding:'0 14px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:'#fff', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap', boxShadow:'0 3px 14px rgba(124,58,237,0.4)', display:'flex', alignItems:'center', gap:6, transition:'transform 0.1s' }}>
        <span className="material-symbols-outlined" style={{ fontSize:13, color:'#fff', ...FILL1 }}>workspace_premium</span>
        REQUEST VIP ACCESS
      </button>
    )
  }
  if (rsvpStatus === 'attending') {
    return (
      <button onClick={() => { triggerHaptic('light'); onDetail?.() }}
        onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
        onTouchEnd={e => e.currentTarget.style.transform=''}
        style={{ height:42, padding:'0 16px', borderRadius:12, border:`1px solid ${accent}60`, background:`${accent}15`, cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:accent, letterSpacing:'0.1em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:6, transition:'transform 0.1s' }}>
        <span className="material-symbols-outlined" style={{ fontSize:13, color:accent, ...FILL1 }}>check_circle</span>
        ATTENDING ✓
      </button>
    )
  }
  return (
    <button onClick={() => { triggerHaptic('medium'); onAttend?.() }}
      onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
      onTouchEnd={e => e.currentTarget.style.transform=''}
      style={{ height:42, padding:'0 16px', borderRadius:12, border:`1px solid ${accent}50`, background:`${accent}18`, cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:accent, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, transition:'transform 0.1s' }}>
      <span className="material-symbols-outlined" style={{ fontSize:13, color:accent, ...FILL1 }}>calendar_add_on</span>
      ATTEND EVENT
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   FEATURED CARD (large hero, full-bleed image)
══════════════════════════════════════════════════════════════ */
function FeaturedCard({ event, rsvpState, onAttend, onVip, onDetail, onStamps, onAttendees }) {
  const status = rsvpState ?? event.rsvpStatus
  const ev = { ...event, rsvpStatus: status }
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
      style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 12px 48px rgba(0,0,0,0.8)', cursor:'pointer' }}
      onClick={() => onDetail?.()}>
      {/* Hero image + overlay */}
      <div style={{ position:'relative', minHeight:220 }}>
        <img src={event.image} alt={event.title} loading="lazy"
          onError={e => { e.currentTarget.src = FALLBACK }}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.52) saturate(0.75)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.45) 45%,rgba(0,0,0,0.92) 100%)' }} />

        {/* Content overlay */}
        <div style={{ position:'relative', padding:'14px 14px 0' }}>
          {/* Top row: badge + date */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:60 }}>
            <Badge type="featured" />
            <DateBadge mon={event.mon} day={event.day} />
          </div>

          {/* Bottom text */}
          <div>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${event.accent}cc`, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:4 }}>{event.category}</p>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#fff8ee', lineHeight:1.1, marginBottom:5 }}>{event.title}</p>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
              <span className="material-symbols-outlined" style={{ fontSize:11, color:`${event.accent}88`, ...FILL1 }}>location_on</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(255,255,255,0.38)' }}>{event.venue} · {event.city}</span>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:9 }}>·</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(255,255,255,0.38)' }}>{event.time}</span>
            </div>
            <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(255,255,255,0.48)', lineHeight:1.55, marginBottom:12 }}>{event.description}</p>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ background:`linear-gradient(0deg,${event.bg} 0%,${event.bg}ee 100%)`, padding:'6px 12px 14px' }}>
        <ProgressBar pct={event.fillPct} accent={event.accent} />
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, flexWrap:'wrap' }}
          onClick={e => e.stopPropagation()}>
          <StampChip stamps={event.stamps} accent={event.accent} onClick={onStamps} />
          <AttendingChip attendees={event.attendees} capacity={event.capacity} onClick={onAttendees} />
          <div style={{ flex:1 }} />
          <CTAButton event={ev} onAttend={onAttend} onVip={onVip} onDetail={onDetail} />
          {ev.rsvpStatus !== 'attending' && (
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(255,255,255,0.2)', whiteSpace:'nowrap' }}>Tap for details ›</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   COMPACT CARD (text left, image right)
══════════════════════════════════════════════════════════════ */
function CompactCard({ event, rsvpState, onAttend, onVip, onDetail, onStamps, onAttendees, delay = 0 }) {
  const status = rsvpState ?? event.rsvpStatus
  const ev = { ...event, rsvpStatus: status }
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay }}
      style={{ borderRadius:16, overflow:'hidden', background:`linear-gradient(155deg,${event.bg},${event.bg}f0)`,
        border:`1px solid ${event.accent}22`, boxShadow:'0 6px 28px rgba(0,0,0,0.65)', cursor:'pointer' }}
      onClick={() => onDetail?.()}>

      {/* Main row: text left, image right */}
      <div style={{ display:'flex', minHeight:140 }}>
        {/* Left text */}
        <div style={{ flex:1, padding:'12px 10px 10px 14px', minWidth:0, display:'flex', flexDirection:'column', gap:4 }}>
          {/* Badges */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {event.types.map(t => <Badge key={t} type={t} />)}
          </div>
          {/* Title */}
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:800, fontSize:15, color:'#fff0d8', lineHeight:1.2, marginTop:2 }}>{event.title}</p>
          {/* Location */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span className="material-symbols-outlined" style={{ fontSize:10, color:`${event.accent}70`, ...FILL1 }}>location_on</span>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(255,255,255,0.32)' }}>{event.venue} · {event.city} · {event.time}</span>
          </div>
          {/* Description */}
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{event.description}</p>
        </div>

        {/* Right image + date */}
        <div style={{ width:126, flexShrink:0, position:'relative', overflow:'hidden' }}>
          <img src={event.image} alt={event.title} loading="lazy"
            onError={e => { e.currentTarget.src = FALLBACK }}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6) saturate(0.7)', display:'block' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 35%)' }} />
          {/* Date badge */}
          <div style={{ position:'absolute', top:8, right:8 }}>
            <DateBadge mon={event.mon} day={event.day} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding:'0 12px' }}>
        <ProgressBar pct={event.fillPct} accent={event.accent} />
      </div>

      {/* Bottom: chips + button */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px 12px', flexWrap:'wrap' }}
        onClick={e => e.stopPropagation()}>
        <StampChip stamps={event.stamps} accent={event.accent} onClick={onStamps} />
        <AttendingChip attendees={event.attendees} capacity={event.capacity} onClick={onAttendees} />
        <div style={{ flex:1 }} />
        <CTAButton event={ev} onAttend={onAttend} onVip={onVip} onDetail={onDetail} />
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STAMP OVERLAY
══════════════════════════════════════════════════════════════ */
function StampOverlay({ event, muted, onDone }) {
  const [step, setStep] = useState('adding')
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('done')
      if (!muted) playSuccessTone()
      triggerHaptic('success')
    }, 1200)
    return () => clearTimeout(t)
  }, [muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(10px)' }} />
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:300, borderRadius:24, padding:'32px 24px 28px',
          background:'linear-gradient(155deg,#1a0e00,#0e0800)',
          border:'2px solid rgba(197,160,89,0.5)', boxShadow:'0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(197,160,89,0.15)',
          textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step === 'adding' ? (
            <motion.div key="adding" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 16px', border:'3px solid #c5a059', display:'flex', alignItems:'center', justifyContent:'center',
                animation:'spinGold 1.2s linear infinite' }}>
                <style>{`@keyframes spinGold{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                <span className="material-symbols-outlined" style={{ fontSize:32, color:'#c5a059', ...FILL1 }}>workspace_premium</span>
              </div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:18, color:'#f0d88a' }}>Adding Event to Passport…</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(197,160,89,0.45)', marginTop:6, letterSpacing:'0.12em', textTransform:'uppercase' }}>Updating your passport</p>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', damping:18, stiffness:260 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 16px', background:'linear-gradient(135deg,#8b6914,#e9c176)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(197,160,89,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:36, color:'#0a0600', ...FILL1 }}>check</span>
              </div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:20, color:'#f0d88a', marginBottom:4 }}>Event Added</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(197,160,89,0.6)', marginBottom:6, letterSpacing:'0.1em' }}>STAMP OPPORTUNITY UNLOCKED</p>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>{event?.title}</p>
              <button onClick={onDone}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:46, borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#0a0600', transition:'transform 0.1s' }}>
                View in Passport
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   EVENT DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function EventDetailModal({ event, rsvpState, muted, onAttend, onVip, onClose }) {
  const status = rsvpState ?? event.rsvpStatus
  const ev = { ...event, rsvpStatus: status }
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:26, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto', borderRadius:'22px 22px 0 0', overflow:'hidden',
          background:`linear-gradient(175deg,${event.bg === '#160c00' ? '#1a0e02' : event.bg},#080605)`,
          border:'1px solid rgba(197,160,89,0.22)', borderBottom:'none',
          boxShadow:'0 -20px 60px rgba(0,0,0,0.9)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.12)' }} />
        </div>
        {/* Hero */}
        <div style={{ position:'relative', height:200, overflow:'hidden', margin:'12px 16px 0', borderRadius:14 }}>
          <img src={event.image} alt={event.title} loading="lazy"
            onError={e => { e.currentTarget.src = FALLBACK }}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6) saturate(0.75)' }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom,${event.accent}10 0%,rgba(0,0,0,0.88) 100%)`, borderRadius:14 }} />
          <div style={{ position:'absolute', top:10, left:12, display:'flex', gap:6 }}>
            {event.types.map(t => <Badge key={t} type={t} />)}
          </div>
          <div style={{ position:'absolute', top:10, right:12 }}><DateBadge mon={event.mon} day={event.day} /></div>
          <div style={{ position:'absolute', bottom:10, left:14 }}>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${event.accent}cc`, letterSpacing:'0.12em', textTransform:'uppercase' }}>{event.category}</span>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:'16px 18px 32px' }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#fff8ee', lineHeight:1.1, marginBottom:5 }}>{event.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:12 }}>
            <span className="material-symbols-outlined" style={{ fontSize:11, color:`${event.accent}88`, ...FILL1 }}>location_on</span>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(255,255,255,0.35)' }}>{event.venue} · {event.city} · {event.time}</span>
          </div>
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.52)', lineHeight:1.65, marginBottom:16 }}>{event.description}</p>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            {[{icon:'workspace_premium', val:`+${event.stamps}`, label:'Stamps', col:event.accent}, {icon:'group', val:`${event.attendees}/${event.capacity}`, label:'Attending', col:'rgba(255,255,255,0.5)'}].map(s => (
              <div key={s.label} style={{ flex:1, padding:'10px', borderRadius:12, background:`${s.col}10`, border:`1px solid ${s.col}20`, textAlign:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:18, color:s.col, ...FILL1 }}>{s.icon}</span>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:13, color:s.col, lineHeight:1, marginTop:3 }}>{s.val}</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${s.col}70`, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <ProgressBar pct={event.fillPct} accent={event.accent} />
          <div style={{ marginTop:16 }}>
            <CTAButton event={ev} onAttend={() => { onClose(); onAttend() }} onVip={() => { onClose(); onVip() }} onDetail={() => {}} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   VIP REQUEST MODAL
══════════════════════════════════════════════════════════════ */
function VipModal({ event, onClose }) {
  const [reason, setReason] = useState('')
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  async function submit() {
    if (reason.trim().length < 10) { setErr('Please provide at least 10 characters.'); return }
    setErr(''); setState('loading')
    triggerHaptic('medium')
    try {
      await requestVipAccess(event.id, reason)
      setState('success')
      triggerHaptic('success')
    } catch(e) { setErr(e.message); setState('idle') }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:360, borderRadius:22, padding:'28px 22px 26px',
          background:'linear-gradient(160deg,#10051e,#060310)', border:'1px solid rgba(168,85,247,0.4)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.9)' }}>
        {state === 'success' ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a855f7)', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:30, color:'#fff', ...FILL1 }}>check</span>
            </div>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#f0e8ff', marginBottom:6 }}>Request Submitted</p>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(192,132,252,0.55)', marginBottom:20, lineHeight:1.6 }}>VIP access request submitted. You will be notified within 24 hours.</p>
            <button onClick={onClose} style={{ width:'100%', height:46, borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#fff' }}>Close</button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#f0e8ff', marginBottom:4 }}>Request VIP Access</p>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(168,85,247,0.5)', marginBottom:18 }}>{event.title}</p>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color:'rgba(168,85,247,0.55)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Why should you be invited?</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell us about your background and why this event is a good fit for you..."
              style={{ width:'100%', minHeight:100, borderRadius:12, border:`1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.3)'}`, background:'rgba(168,85,247,0.06)', padding:'10px 12px', fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12.5, color:'#e8d8ff', resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:6 }} />
            {err && <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#f87171', marginBottom:8 }}>{err}</p>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
              <button onClick={onClose} style={{ height:46, borderRadius:12, border:'1px solid rgba(168,85,247,0.28)', background:'rgba(168,85,247,0.07)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#c084fc' }}>Cancel</button>
              <button onClick={submit} disabled={state === 'loading'}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ height:46, borderRadius:12, border:'none', background: state === 'loading' ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', cursor: state === 'loading' ? 'default' : 'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#fff', boxShadow:'0 3px 14px rgba(124,58,237,0.4)', transition:'transform 0.1s' }}>
                {state === 'loading' ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   QR SCAN MODAL
══════════════════════════════════════════════════════════════ */
function QrScanModal({ onClose, onCheckedIn }) {
  const [state, setState] = useState('idle')
  const [found, setFound] = useState(null)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  async function simulate() {
    setState('scanning'); triggerHaptic('medium')
    const res = await scanEventQr('simulated')
    setFound(res.event); setState('found'); triggerHaptic('success')
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:26, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:420, borderRadius:'24px 24px 0 0', padding:'28px 22px 40px',
          background:'linear-gradient(175deg,#0c0a02,#060400)', border:'1px solid rgba(197,160,89,0.3)', borderBottom:'none',
          boxShadow:'0 -20px 60px rgba(0,0,0,0.9)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(197,160,89,0.2)' }} />
        </div>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#fff8ee', textAlign:'center', marginBottom:5 }}>Scan to Connect</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(197,160,89,0.4)', textAlign:'center', marginBottom:22, letterSpacing:'0.08em' }}>Point your camera at a passport or event QR code.</p>
        {/* Camera frame */}
        <div style={{ width:190, height:190, margin:'0 auto 22px', borderRadius:16, background:'rgba(0,0,0,0.6)', border:'2px solid rgba(197,160,89,0.4)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
            <div key={i} style={{ position:'absolute', width:22, height:22, top:ry?'auto':8, bottom:ry?8:'auto', left:rx?'auto':8, right:rx?8:'auto',
              borderTop:ry?'none':'3px solid #c5a059', borderBottom:ry?'3px solid #c5a059':'none',
              borderLeft:rx?'none':'3px solid #c5a059', borderRight:rx?'3px solid #c5a059':'none' }} />
          ))}
          {state === 'scanning' && (
            <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#c5a059,transparent)',
              animation:'scanLine 1s ease-in-out infinite' }}>
              <style>{`@keyframes scanLine{0%{transform:translateY(-85px)}100%{transform:translateY(85px)}}`}</style>
            </div>
          )}
          {state === 'found' && found ? (
            <div style={{ textAlign:'center', padding:10 }}>
              <span className="material-symbols-outlined" style={{ fontSize:36, color:'#c5a059', ...FILL1 }}>check_circle</span>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#fff0d8', marginTop:6 }}>{found.title}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'#c5a059', marginTop:2 }}>Event Found!</p>
            </div>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize:70, color:'rgba(197,160,89,0.15)', ...FILL1 }}>qr_code_2</span>
          )}
        </div>
        <AnimatePresence mode="wait">
          {state === 'found' ? (
            <motion.div key="found" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <button onClick={() => { triggerHaptic('success'); onCheckedIn?.(found); onClose() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#0a0600', marginBottom:10, boxShadow:'0 4px 18px rgba(197,160,89,0.35)', transition:'transform 0.1s' }}>
                Simulate Event Check-In ✓
              </button>
              <button onClick={onClose} style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(197,160,89,0.25)', background:'rgba(197,160,89,0.06)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c5a059' }}>Close</button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <button onClick={simulate} disabled={state === 'scanning'}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none', background: state === 'scanning' ? 'rgba(197,160,89,0.3)' : 'linear-gradient(135deg,#8b6914,#c5a059)', cursor: state==='scanning'?'default':'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#0a0600', marginBottom:10, boxShadow:'0 4px 18px rgba(197,160,89,0.3)', transition:'transform 0.1s' }}>
                {state === 'scanning' ? 'Scanning…' : 'Simulate Successful Scan'}
              </button>
              <button onClick={onClose} style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(197,160,89,0.22)', background:'rgba(197,160,89,0.05)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c5a059' }}>Close</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   IMAGE MANAGER MODAL (Alt+I)
══════════════════════════════════════════════════════════════ */
function ImageManagerModal({ events, onClose }) {
  const [selId, setSelId]   = useState(events[0]?.id || '')
  const [url,   setUrl]     = useState('')
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState('')
  const event = events.find(e => e.id === selId)

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  async function generatePrompt() {
    const r = await generateEventImagePrompt(event)
    setPrompt(r.prompt); setStatus('Prompt generated.')
  }
  async function updateImg() {
    if (!url.startsWith('http')) { setStatus('Invalid URL.'); return }
    await updateEventImage(selId, url); setStatus('Image URL updated!')
  }
  async function queueOpenAI() {
    const r = await requestOpenAIImageReplacement(selId, prompt || event?.imagePrompt)
    setStatus(r.message)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)' }} />
      <div style={{ position:'relative', width:'100%', maxWidth:400, borderRadius:20, padding:'22px 20px 24px',
        background:'#0c0a06', border:'1px solid rgba(197,160,89,0.4)', boxShadow:'0 20px 60px rgba(0,0,0,0.95)' }}>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:18, color:'#e9c176', marginBottom:4 }}>Image Manager</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.35)', marginBottom:16, letterSpacing:'0.1em' }}>ALT+I · ADMIN ONLY</p>
        <select value={selId} onChange={e => setSelId(e.target.value)}
          style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'1px solid rgba(197,160,89,0.3)', background:'rgba(197,160,89,0.06)', color:'#e9c176', fontFamily:'"JetBrains Mono",monospace', fontSize:11, marginBottom:12, outline:'none' }}>
          {events.map(e => <option key={e.id} value={e.id} style={{ background:'#0c0a06' }}>{e.title}</option>)}
        </select>
        {event && (
          <div style={{ height:80, borderRadius:10, overflow:'hidden', marginBottom:12, position:'relative' }}>
            <img src={event.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6) saturate(0.7)' }} />
            <div style={{ position:'absolute', bottom:6, left:8 }}>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(197,160,89,0.6)' }}>{event.imageSource} · {event.imageVersion}</span>
            </div>
          </div>
        )}
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', marginBottom:5, letterSpacing:'0.1em', textTransform:'uppercase' }}>Current Prompt</p>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:12, lineHeight:1.5, background:'rgba(255,255,255,0.03)', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>{prompt || event?.imagePrompt}</p>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste replacement image URL…"
          style={{ width:'100%', padding:'9px 11px', borderRadius:10, border:'1px solid rgba(197,160,89,0.25)', background:'rgba(197,160,89,0.05)', color:'#fff0d8', fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, marginBottom:12, outline:'none', boxSizing:'border-box' }} />
        {status && <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#86efac', marginBottom:10 }}>{status}</p>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <button onClick={generatePrompt} style={{ height:40, borderRadius:10, border:'1px solid rgba(197,160,89,0.3)', background:'rgba(197,160,89,0.07)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#e9c176' }}>Generate Prompt</button>
          <button onClick={updateImg} style={{ height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#0a0600', fontWeight:700 }}>Update Image</button>
        </div>
        <button onClick={queueOpenAI} style={{ width:'100%', height:40, borderRadius:10, border:'1px solid rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.08)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#c084fc', marginBottom:10 }}>Queue OpenAI Replacement (Backend)</button>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(255,255,255,0.18)', lineHeight:1.5 }}>⚠ Real OpenAI image generation must happen through a secure backend endpoint. Never expose API keys in the browser.</p>
        <button onClick={onClose} style={{ width:'100%', height:42, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:12 }}>Close</button>
      </div>
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
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
          style={{ position:'fixed', bottom:115, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:'linear-gradient(135deg,#1a1200,#120d00)', border:'1px solid rgba(197,160,89,0.45)',
            borderRadius:14, padding:'12px 20px', display:'flex', alignItems:'center', gap:10,
            boxShadow:'0 8px 30px rgba(0,0,0,0.7)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'#c5a059', ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12.5, fontWeight:600, color:'#e9c176' }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PassportEvents() {
  const navigate   = useNavigate()
  const [filter,   setFilter]   = useState('all')
  const [rsvp,     setRsvp]     = useState(() => Object.fromEntries(PASSPORT_EVENTS.map(e => [e.id, e.rsvpStatus])))
  const [modal,    setModal]    = useState(null) // null | 'scan' | 'detail' | 'vip' | 'imgmgr'
  const [selEvent, setSelEvent] = useState(null)
  const [stampEvt, setStampEvt] = useState(null)
  const [toast,    setToast]    = useState({ visible:false, msg:'' })
  const [muted,    setMuted]    = useState(false)

  /* Alt+I image manager */
  useEffect(() => {
    const h = (e) => { if (e.altKey && e.key.toLowerCase() === 'i') setModal('imgmgr') }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  function showToast(msg) {
    setToast({ visible:true, msg })
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3200)
  }

  const filtered = PASSPORT_EVENTS.filter(e => {
    if (filter === 'all')        return true
    if (filter === 'featured')   return e.types.includes('featured')
    if (filter === 'vip')        return e.types.includes('vip')
    if (filter === 'craft')      return e.types.includes('craft')
    if (filter === 'networking') return e.types.includes('networking')
    if (filter === 'attending')  return rsvp[e.id] === 'attending'
    return true
  })

  const [featuredEv, ...compactEvs] = filtered

  async function handleAttend(event) {
    triggerHaptic('medium')
    if (rsvp[event.id] === 'soldout') return
    const newStatus = rsvp[event.id] === 'attending' ? 'none' : 'attending'
    setRsvp(prev => ({ ...prev, [event.id]: newStatus }))
    if (newStatus === 'attending') {
      setStampEvt(event)
      if (!muted) playStampSound()
      showToast('Passport updated. Event added.')
    }
  }

  function openDetail(event) { triggerHaptic('light'); setSelEvent(event); setModal('detail') }
  function openVip(event)    { triggerHaptic('medium'); setSelEvent(event); setModal('vip') }
  function openScan()        { triggerHaptic('medium'); setModal('scan') }
  function closeModal()      { triggerHaptic('light'); setModal(null) }

  return (
    <div style={{ minHeight:'100vh', background:'#060402', paddingBottom:108, overflowX:'hidden' }}>
      {/* Ambient bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(100,60,5,0.18) 0%, transparent 60%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 50% 30% at 80% 100%, rgba(60,30,5,0.1) 0%, transparent 60%)' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, padding:'0 14px', height:68,
        background:'rgba(6,4,2,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(197,160,89,0.15)' }}>
        <button onClick={() => navigate('/passport')}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.88)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ width:40, height:40, borderRadius:'50%', border:'1px solid rgba(197,160,89,0.22)', background:'rgba(197,160,89,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#c5a059' }}>arrow_back</span>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:17, color:'#fff0d8', lineHeight:1 }}>Passport Events</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.38)', letterSpacing:'0.1em', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Discover experiences. Earn stamps. Build trusted connections.</p>
        </div>
        <button onClick={() => { triggerHaptic('light'); setFilter('attending') }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'0 11px', height:36, borderRadius:99, border:'1px solid rgba(197,160,89,0.28)', background:'rgba(197,160,89,0.07)', cursor:'pointer', flexShrink:0, transition:'transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:13, color:'#c5a059', ...FILL1 }}>event_available</span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color:'#c5a059' }}>My Events</span>
        </button>
        <button onClick={openScan}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'0 11px', height:36, borderRadius:99, border:'none', background:'linear-gradient(135deg,#6b5010,#c5a059)', cursor:'pointer', flexShrink:0, boxShadow:'0 2px 10px rgba(197,160,89,0.3)', transition:'transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:13, color:'#0a0600', ...FILL1 }}>qr_code_scanner</span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color:'#0a0600' }}>Scan QR</span>
        </button>
      </header>

      <div style={{ position:'relative', zIndex:10 }}>
        {/* ── Filter pills ───────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'12px 14px 10px', scrollbarWidth:'none' }}>
          {FILTERS.map(f => (
            <button key={f.id}
              onClick={() => { triggerHaptic('light'); setFilter(f.id) }}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ flexShrink:0, height:34, padding:'0 14px', borderRadius:99, cursor:'pointer', transition:'all 0.18s, transform 0.1s',
                background: filter === f.id ? 'rgba(197,160,89,0.18)' : 'rgba(255,255,255,0.04)',
                border: filter === f.id ? '1.5px solid rgba(197,160,89,0.55)' : '1px solid rgba(255,255,255,0.08)',
                fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase',
                color: filter === f.id ? '#c5a059' : 'rgba(255,255,255,0.35)',
              }}>
              {f.id === 'all' && filter === 'all' ? '★ ALL' : f.label}
            </button>
          ))}
        </div>

        {/* ── Event feed ─────────────────────────────────────── */}
        <div style={{ padding:'4px 14px', display:'flex', flexDirection:'column', gap:12 }}>
          <AnimatePresence mode="wait">
            <motion.div key={filter} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.22 }} style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {filtered.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:48, color:'rgba(197,160,89,0.2)', ...FILL1 }}>event_busy</span>
                  <p style={{ fontFamily:'"Playfair Display",serif', fontSize:16, color:'rgba(197,160,89,0.35)', marginTop:12 }}>No events in this category</p>
                </div>
              )}

              {/* Featured card (first match) */}
              {featuredEv && (
                <FeaturedCard
                  event={featuredEv}
                  rsvpState={rsvp[featuredEv.id]}
                  onAttend={() => handleAttend(featuredEv)}
                  onVip={() => openVip(featuredEv)}
                  onDetail={() => openDetail(featuredEv)}
                  onStamps={() => { triggerHaptic('light'); showToast(`+${featuredEv.stamps} stamps unlocked at check-in`) }}
                  onAttendees={() => openDetail(featuredEv)}
                />
              )}

              {/* Compact cards */}
              {compactEvs.map((ev, i) => (
                <CompactCard key={ev.id} event={ev} rsvpState={rsvp[ev.id]} delay={i * 0.05}
                  onAttend={() => handleAttend(ev)}
                  onVip={() => openVip(ev)}
                  onDetail={() => openDetail(ev)}
                  onStamps={() => { triggerHaptic('light'); showToast(`+${ev.stamps} stamps unlocked at check-in`) }}
                  onAttendees={() => openDetail(ev)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'detail' && selEvent && (
          <EventDetailModal key="detail" event={selEvent} rsvpState={rsvp[selEvent.id]} muted={muted}
            onAttend={() => handleAttend(selEvent)} onVip={() => { closeModal(); setTimeout(() => openVip(selEvent), 120) }}
            onClose={closeModal} />
        )}
        {modal === 'vip' && selEvent && (
          <VipModal key="vip" event={selEvent} onClose={closeModal} />
        )}
        {modal === 'scan' && (
          <QrScanModal key="scan" onClose={closeModal}
            onCheckedIn={(ev) => { showToast(`Checked in: ${ev?.title || 'event'}`); triggerHaptic('success') }} />
        )}
        {modal === 'imgmgr' && (
          <ImageManagerModal key="imgmgr" events={PASSPORT_EVENTS} onClose={closeModal} />
        )}
        {stampEvt && (
          <StampOverlay key="stamp" event={stampEvt} muted={muted} onDone={() => setStampEvt(null)} />
        )}
      </AnimatePresence>

      <Toast msg={toast.msg} visible={toast.visible} />
      <PassportBottomNav active="events" />
    </div>
  )
}
