import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import craftImages from '../../lib/craftImages.js'
import { CONNECTIONS, findConnection } from '../../data/connectionsData.js'
import { verifyConnection, scanConnection, getPassport } from '../../api/passportConnectionsApi.js'
import { triggerHaptic } from '../../utils/haptics.js'
import { playStampSound, playSuccessTone } from '../../utils/sound.js'

const FILL1 = { fontVariationSettings:"'FILL' 1" }

const HERO_STATS = {
  verifiedConnections: 12,
  topMatchPercent: 94,
  socialGoal: '8/10',
  newContacts: 7,
}

const TABS = [
  { id:'bestMatches', label:'Best Matches' },
  { id:'peopleMet',   label:'People You Met' },
  { id:'suggested',   label:'Suggested' },
]

/* ── Portrait ─────────────────────────────────────────────── */
function Portrait({ portraitKey, name, size = 52, ring = false }) {
  const [err, setErr] = useState(false)
  const src = craftImages.portraits[portraitKey] || craftImages.portraits.mentor
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      {ring && (
        <div style={{ position:'absolute', inset:-3, borderRadius:'50%',
          background:'linear-gradient(135deg,#8b6914,#e9c176,#c5a059)', zIndex:0 }} />
      )}
      <div style={{ position:'absolute', inset:ring?2:0, borderRadius:'50%', overflow:'hidden',
        background:'#1a0d28', zIndex:1, border:ring?'none':'2px solid rgba(197,160,89,0.25)' }}>
        {!err ? (
          <img src={src} alt={name} onError={() => setErr(true)}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.85) saturate(0.8)' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:size*0.36, color:'#c5a059' }}>
            {name?.[0]}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Gold SVG stamp ───────────────────────────────────────── */
function PassportStamp({ size = 148 }) {
  const cx = size / 2, r1 = cx - 4, r2 = cx - 14, r3 = cx - 22
  const toXY = (deg, r) => {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cx + r * Math.sin(rad) }
  }
  const arcTop = (r, from, to) => {
    const s = toXY(from, r), e = toXY(to, r)
    const large = (to - from > 180) ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }
  const gold = '#c5a059'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r1} fill="rgba(10,6,0,0.88)" stroke={gold} strokeWidth={2.5} />
      <circle cx={cx} cy={cx} r={r2} fill="none" stroke={`${gold}55`} strokeWidth={1} />
      <circle cx={cx} cy={cx} r={r3} fill="none" stroke={`${gold}30`} strokeWidth={0.8} />
      {/* Top arc text: 360 PASSPORT */}
      <path id="arcTop" d={arcTop(r1 - 9, -150, -30)} fill="none" />
      <text fontFamily="'JetBrains Mono',monospace" fontSize={9.5} fill={gold} letterSpacing={2} fontWeight={700}>
        <textPath href="#arcTop" startOffset="50%" textAnchor="middle">360 PASSPORT</textPath>
      </text>
      {/* Bottom arc text: CONNECTIONS */}
      <path id="arcBot" d={arcTop(r1 - 9, 30, 150)} fill="none" />
      <text fontFamily="'JetBrains Mono',monospace" fontSize={9.5} fill={gold} letterSpacing={2} fontWeight={700}>
        <textPath href="#arcBot" startOffset="50%" textAnchor="middle">CONNECTIONS</textPath>
      </text>
      {/* Stars */}
      {[-165, -150, 165, 150].map((deg, i) => {
        const p = toXY(deg, r1 - 9)
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={6} fill={gold}>★</text>
      })}
      {/* Center text */}
      <text x={cx} y={cx - 8} textAnchor="middle" fontFamily="'Playfair Display',serif" fontWeight={900} fontSize={17} fill={gold}>VERIFIED</text>
      <text x={cx} y={cx + 10} textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontWeight={700} fontSize={9} fill={`${gold}cc`} letterSpacing={1.5}>INTRODUCTION</text>
    </svg>
  )
}

/* ── Match badge ──────────────────────────────────────────── */
function MatchBadge({ pct, onClick }) {
  return (
    <button onClick={onClick}
      onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
      onTouchEnd={e => e.currentTarget.style.transform=''}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        width:60, height:60, borderRadius:'50%', flexShrink:0, cursor:'pointer',
        border:'1.5px solid rgba(197,160,89,0.45)', background:'rgba(10,7,2,0.9)',
        boxShadow:'0 0 12px rgba(197,160,89,0.12)', transition:'transform 0.1s' }}>
      <span style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:15, color:'#e9c176', lineHeight:1 }}>{pct}%</span>
      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, color:'rgba(197,160,89,0.55)', letterSpacing:'0.1em', textTransform:'uppercase' }}>MATCH</span>
    </button>
  )
}

/* ── Connection row ───────────────────────────────────────── */
function ConnectionRow({ person, selected, onSelect, onMatchClick, delay = 0 }) {
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay }}
      onClick={() => { triggerHaptic('light'); onSelect(person) }}
      onTouchStart={e => e.currentTarget.style.background='rgba(197,160,89,0.06)'}
      onTouchEnd={e => e.currentTarget.style.background=''}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', cursor:'pointer',
        background: selected ? 'rgba(197,160,89,0.07)' : 'rgba(14,9,24,0.7)',
        border:`1px solid ${selected ? 'rgba(197,160,89,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius:14, backdropFilter:'blur(10px)', transition:'background 0.15s, border-color 0.15s',
        boxShadow: selected ? '0 0 20px rgba(197,160,89,0.08)' : 'none' }}>
      {/* Avatar */}
      <Portrait portraitKey={person.portraitKey} name={person.name} size={54} ring={person.verified} />
      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:16, color:'#fff8ee', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{person.name}</p>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(197,160,89,0.6)', marginBottom:1 }}>{person.role} @ {person.company}</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.04em' }}>{person.location}</p>
      </div>
      {/* Match badge + chevron */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <MatchBadge pct={person.matchScore} onClick={e => { e.stopPropagation(); triggerHaptic('light'); onMatchClick(person) }} />
        <span className="material-symbols-outlined" style={{ fontSize:18, color:'rgba(197,160,89,0.35)' }}>chevron_right</span>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN TO CONNECT MODAL
══════════════════════════════════════════════════════════════ */
function ScanModal({ muted, onClose, onConnected }) {
  const [state, setState] = useState('idle')
  const [found, setFound] = useState(null)
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  async function simulate() {
    setState('scanning'); triggerHaptic('medium')
    const res = await scanConnection('simulated')
    setFound(res.person); setState('found'); triggerHaptic('success')
    if (!muted) playSuccessTone()
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:26, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:460, margin:'0 auto',
          borderRadius:'24px 24px 0 0', padding:'24px 22px 40px',
          background:'linear-gradient(175deg,#0e0a02,#060400)',
          border:'1px solid rgba(197,160,89,0.28)', borderBottom:'none', boxShadow:'0 -20px 60px rgba(0,0,0,0.9)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(197,160,89,0.2)' }} />
        </div>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#fff8ee', textAlign:'center', marginBottom:5 }}>Scan to Connect</p>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.38)', textAlign:'center', marginBottom:24 }}>Point your camera at a guest Passport QR code to connect.</p>
        {/* Camera frame */}
        <div style={{ width:190, height:190, margin:'0 auto 24px', borderRadius:16, background:'rgba(0,0,0,0.65)',
          border:'2px solid rgba(197,160,89,0.4)', position:'relative', overflow:'hidden',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
            <div key={i} style={{ position:'absolute', width:24, height:24,
              top:ry?'auto':8, bottom:ry?8:'auto', left:rx?'auto':8, right:rx?8:'auto',
              borderTop:ry?'none':'3px solid #c5a059', borderBottom:ry?'3px solid #c5a059':'none',
              borderLeft:rx?'none':'3px solid #c5a059', borderRight:rx?'3px solid #c5a059':'none' }} />
          ))}
          {state === 'scanning' && (
            <div style={{ position:'absolute', left:0, right:0, height:2,
              background:'linear-gradient(90deg,transparent,#c5a059,transparent)',
              animation:'scanLine 1s ease-in-out infinite' }}>
              <style>{`@keyframes scanLine{0%{transform:translateY(-85px)}100%{transform:translateY(85px)}}`}</style>
            </div>
          )}
          {state === 'found' && found ? (
            <div style={{ textAlign:'center', padding:12 }}>
              <span className="material-symbols-outlined" style={{ fontSize:40, color:'#c5a059', ...FILL1 }}>verified</span>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#fff0d8', marginTop:6 }}>{found.name}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'#c5a059', marginTop:2 }}>Match Found</p>
            </div>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize:72, color:'rgba(197,160,89,0.12)', ...FILL1 }}>qr_code_2</span>
          )}
        </div>
        <AnimatePresence mode="wait">
          {state === 'found' ? (
            <motion.div key="found" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <button onClick={() => { triggerHaptic('success'); onConnected(found); onClose() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#0a0600', marginBottom:10, transition:'transform 0.1s', boxShadow:'0 4px 18px rgba(197,160,89,0.35)' }}>
                Connection Verified ✓
              </button>
              <button onClick={onClose} style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(197,160,89,0.25)', background:'rgba(197,160,89,0.06)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c5a059' }}>Close</button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <button onClick={simulate} disabled={state === 'scanning'}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none', background: state === 'scanning' ? 'rgba(197,160,89,0.3)' : 'linear-gradient(135deg,#8b6914,#c5a059)', cursor: state==='scanning'?'default':'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#0a0600', marginBottom:10, transition:'transform 0.1s' }}>
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
   WHY YOU MATCH MODAL
══════════════════════════════════════════════════════════════ */
function WhyMatchModal({ person, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:360, borderRadius:22, padding:'28px 22px 26px',
          background:'linear-gradient(160deg,#100818,#080410)', border:'1px solid rgba(197,160,89,0.35)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.92)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <Portrait portraitKey={person.portraitKey} name={person.name} size={52} ring={person.verified} />
          <div>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:18, color:'#fff8ee' }}>{person.name}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#e9c176' }}>{person.matchScore}%</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(197,160,89,0.5)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Match</span>
            </div>
          </div>
        </div>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.45)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>Why You Match</p>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6, marginBottom:16 }}>{person.whyYouMatch}</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.45)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Shared Interests</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
          {person.sharedInterests?.map(i => (
            <span key={i} style={{ padding:'4px 11px', borderRadius:99, background:'rgba(197,160,89,0.1)', border:'1px solid rgba(197,160,89,0.25)', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#c5a059' }}>{i}</span>
          ))}
        </div>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.45)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>Suggested Intro</p>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12.5, color:'rgba(255,255,255,0.42)', lineHeight:1.6, marginBottom:20 }}>{person.bestNextMove}</p>
        <button onClick={() => { triggerHaptic('light'); onClose() }}
          style={{ width:'100%', height:46, borderRadius:12, border:'1px solid rgba(197,160,89,0.3)', background:'rgba(197,160,89,0.08)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c5a059' }}>
          Close
        </button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   CONNECTION DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function DetailModal({ person, muted, onClose, onViewPassport, onConnect }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const src = craftImages.portraits[person.portraitKey] || craftImages.portraits.mentor
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:26, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto', borderRadius:'22px 22px 0 0',
          background:'linear-gradient(175deg,#100a1c,#080410)', border:'1px solid rgba(197,160,89,0.22)', borderBottom:'none',
          boxShadow:'0 -20px 60px rgba(0,0,0,0.9)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.12)' }} />
        </div>
        {/* Hero image */}
        <div style={{ position:'relative', height:180, margin:'12px 16px 0', borderRadius:14, overflow:'hidden' }}>
          <img src={src} alt={person.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', filter:'brightness(0.7) saturate(0.8)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 30%,rgba(8,4,16,0.95) 100%)' }} />
          <div style={{ position:'absolute', bottom:14, left:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              {person.verified && (
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'#c5a059', background:'rgba(197,160,89,0.12)', border:'1px solid rgba(197,160,89,0.3)', padding:'2px 8px', borderRadius:99 }}>✓ VERIFIED</span>
              )}
            </div>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#fff8ee' }}>{person.name}</p>
          </div>
          <div style={{ position:'absolute', top:12, right:14 }}>
            <MatchBadge pct={person.matchScore} onClick={() => {}} />
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:'16px 18px 36px' }}>
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:14, color:'rgba(197,160,89,0.65)', marginBottom:2 }}>{person.role} @ {person.company}</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:16, letterSpacing:'0.06em' }}>{person.location}</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>Why You Match</p>
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.65, marginBottom:14 }}>{person.whyYouMatch}</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Shared Interests</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:14 }}>
            {person.sharedInterests?.map(i => (
              <span key={i} style={{ padding:'4px 11px', borderRadius:99, background:'rgba(197,160,89,0.08)', border:'1px solid rgba(197,160,89,0.22)', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#c5a059' }}>{i}</span>
            ))}
          </div>
          {person.sharedEvent && (
            <>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>Shared Event</p>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:14 }}>{person.sharedEvent.title} · {person.sharedEvent.date}</p>
            </>
          )}
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6 }}>Best Next Move</p>
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:22 }}>{person.bestNextMove}</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={() => { triggerHaptic('light'); onViewPassport(person) }}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ height:50, borderRadius:14, border:'1px solid rgba(197,160,89,0.35)', background:'rgba(197,160,89,0.08)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#c5a059', transition:'transform 0.1s' }}>
              View Passport
            </button>
            <button onClick={() => { triggerHaptic('success'); onConnect(person) }}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ height:50, borderRadius:14, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#0a0600', boxShadow:'0 3px 14px rgba(197,160,89,0.35)', transition:'transform 0.1s' }}>
              Connect Now
            </button>
          </div>
          <button onClick={() => { triggerHaptic('light'); onClose() }}
            style={{ width:'100%', height:46, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:10 }}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PASSPORT MODAL
══════════════════════════════════════════════════════════════ */
function PassportModal({ person, passportData, onClose, onConnect }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.84)', backdropFilter:'blur(8px)' }} />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.92 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:360, borderRadius:22, overflow:'hidden',
          background:'linear-gradient(160deg,#12090a,#080408)', border:'1px solid rgba(197,160,89,0.4)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.94)' }}>
        {/* Header strip */}
        <div style={{ background:'linear-gradient(135deg,#1a0d02,#0e0800)', padding:'20px 20px 16px', borderBottom:'1px solid rgba(197,160,89,0.15)', textAlign:'center' }}>
          <PassportStamp size={120} />
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:18, color:'#fff8ee', marginTop:12 }}>360 Passport Connections</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(197,160,89,0.45)', letterSpacing:'0.1em' }}>VERIFIED INTRODUCTION</p>
        </div>
        {/* Body */}
        <div style={{ padding:'18px 20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <Portrait portraitKey={person.portraitKey} name={person.name} size={50} ring={person.verified} />
            <div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:16, color:'#fff8ee' }}>{person.name}</p>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(197,160,89,0.55)' }}>{person.role} @ {person.company}</p>
            </div>
          </div>
          {[
            { label:'Status', value: passportData?.owner?.passportStatus === 'verified' ? 'Verified Introduction' : 'Pending Verification' },
            { label:'Last Event', value: person.sharedEvent?.title || 'Grand Opening Night' },
            { label:'Relationship Score', value: passportData?.relationshipValue || 'High' },
            { label:'Passport ID', value: passportData?.passportId || '360-PP-...' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(197,160,89,0.45)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{r.label}</span>
              <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(255,255,255,0.55)' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:18 }}>
            <button onClick={() => { triggerHaptic('light'); onClose() }}
              style={{ height:46, borderRadius:12, border:'1px solid rgba(197,160,89,0.25)', background:'rgba(197,160,89,0.07)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c5a059' }}>
              Close
            </button>
            <button onClick={() => { triggerHaptic('success'); onConnect(person) }}
              style={{ height:46, borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#0a0600' }}>
              Connect Now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   VERIFY OVERLAY
══════════════════════════════════════════════════════════════ */
function VerifyOverlay({ person, muted, onDone }) {
  const [step, setStep] = useState('verifying')
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('done')
      if (!muted) { playStampSound(); playSuccessTone() }
      triggerHaptic('success')
    }, 1400)
    return () => clearTimeout(t)
  }, [muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)' }} />
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:300, borderRadius:24, padding:'32px 24px 28px',
          background:'linear-gradient(155deg,#1a0e00,#0e0800)', border:'2px solid rgba(197,160,89,0.5)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(197,160,89,0.12)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step === 'verifying' ? (
            <motion.div key="verifying" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ width:76, height:76, borderRadius:'50%', margin:'0 auto 18px', border:'3px solid #c5a059',
                display:'flex', alignItems:'center', justifyContent:'center',
                animation:'spinGold 1.2s linear infinite' }}>
                <style>{`@keyframes spinGold{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                <span className="material-symbols-outlined" style={{ fontSize:36, color:'#c5a059', ...FILL1 }}>verified</span>
              </div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#f0d88a' }}>Verifying Connection…</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(197,160,89,0.4)', marginTop:8, letterSpacing:'0.12em' }}>UPDATING YOUR PASSPORT</p>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', damping:18, stiffness:260 }}>
              <PassportStamp size={100} />
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#f0d88a', marginTop:12, marginBottom:4 }}>Connection Verified</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(197,160,89,0.55)', marginBottom:6, letterSpacing:'0.1em' }}>PASSPORT UPDATED</p>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:22 }}>Connected with {person?.name}</p>
              <button onClick={onDone}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:48, borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#0a0600', transition:'transform 0.1s' }}>
                View Connection
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ADMIN PANEL MODAL
══════════════════════════════════════════════════════════════ */
function AdminModal({ onClose }) {
  const [selId, setSelId] = useState('david-harper')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')
  const allPeople = [
    ...CONNECTIONS.bestMatches, ...CONNECTIONS.peopleMet, ...CONNECTIONS.suggested
  ]
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const ITEMS = [
    { icon:'bar_chart', label:'Edit connection stats', action: () => setStatus('Edit stats — connect to real API to persist.') },
    { icon:'view_list', label:'Edit tab data', action: () => setStatus('Tab data — edit src/data/connectionsData.js') },
    { icon:'person_edit', label:'Edit displayed people', action: () => setStatus('Edit src/data/connectionsData.js to change people.') },
    { icon:'image', label:'Replace connection images', action: () => setStatus('Paste replacement URL below.') },
    { icon:'verified', label:'Update hero stamp', action: () => setStatus('Hero stamp is SVG — edit PassportStamp component.') },
  ]
  async function queueOpenAI() {
    setStatus('Image replacement request queued for backend generation.')
  }
  function updateImage() {
    if (!url.startsWith('http')) { setStatus('Invalid URL.'); return }
    setStatus(`Image URL updated for ${selId}.`)
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.88)' }} />
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:16 }}
        style={{ position:'relative', width:'100%', maxWidth:400, borderRadius:20, padding:'22px 20px 24px',
          background:'#0a0810', border:'1px solid rgba(197,160,89,0.4)', boxShadow:'0 20px 60px rgba(0,0,0,0.95)',
          maxHeight:'85vh', overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
          <span className="material-symbols-outlined" style={{ fontSize:18, color:'#c5a059', ...FILL1 }}>admin_panel_settings</span>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:18, color:'#e9c176' }}>Admin Panel</p>
        </div>
        {ITEMS.map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'1px solid rgba(197,160,89,0.12)', background:'rgba(197,160,89,0.04)', cursor:'pointer', marginBottom:8, transition:'background 0.15s', textAlign:'left' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(197,160,89,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(197,160,89,0.04)'}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:'#c5a059' }}>{item.icon}</span>
            <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.6)' }}>{item.label}</span>
          </button>
        ))}
        <div style={{ borderTop:'1px solid rgba(197,160,89,0.1)', paddingTop:14, marginTop:6 }}>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Image Replacement</p>
          <select value={selId} onChange={e => setSelId(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'1px solid rgba(197,160,89,0.25)', background:'rgba(197,160,89,0.05)', color:'#e9c176', fontFamily:'"JetBrains Mono",monospace', fontSize:11, marginBottom:8, outline:'none' }}>
            {allPeople.map(p => <option key={p.id} value={p.id} style={{ background:'#0a0810' }}>{p.name}</option>)}
          </select>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste replacement image URL…"
            style={{ width:'100%', padding:'9px 11px', borderRadius:10, border:'1px solid rgba(197,160,89,0.22)', background:'rgba(197,160,89,0.04)', color:'#fff0d8', fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, marginBottom:8, outline:'none', boxSizing:'border-box' }} />
          {status && <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#86efac', marginBottom:8 }}>{status}</p>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <button onClick={updateImage} style={{ height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#0a0600', fontWeight:700 }}>Update Image</button>
            <button onClick={queueOpenAI} style={{ height:40, borderRadius:10, border:'1px solid rgba(168,85,247,0.3)', background:'rgba(168,85,247,0.07)', cursor:'pointer', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#c084fc' }}>Queue OpenAI</button>
          </div>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, color:'rgba(255,255,255,0.15)', lineHeight:1.5 }}>Real OpenAI image generation must happen through a secure backend endpoint. Never expose API keys in frontend code.</p>
        </div>
        <button onClick={onClose}
          style={{ width:'100%', height:44, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:14 }}>
          Close
        </button>
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
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
          style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', zIndex:190,
            background:'linear-gradient(135deg,#1a1200,#120d00)', border:'1px solid rgba(197,160,89,0.45)',
            borderRadius:14, padding:'12px 22px', display:'flex', alignItems:'center', gap:10,
            boxShadow:'0 8px 30px rgba(0,0,0,0.7)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'#c5a059', ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, fontWeight:600, color:'#e9c176' }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════
   BOTTOM NAV (matches screenshot: 5 items + admin)
══════════════════════════════════════════════════════════════ */
function BottomNav({ active, onScan, onAdmin }) {
  const navigate = useNavigate()
  const NAV = [
    { id:'home',     icon:'home',            label:'Home',    route:'/' },
    { id:'passport', icon:'book',            label:'Passport', route:'/passport' },
    { id:'scan',     icon:'qr_code_scanner', label:'',         scan:true },
    { id:'network',  icon:'hub',             label:'Network',  route:'/passport/connections' },
    { id:'profile',  icon:'person',          label:'Profile',  route:'/passport/profile' },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:600, margin:'0 auto', position:'relative',
        background:'rgba(6,4,10,0.97)', backdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(197,160,89,0.12)', paddingBottom:'env(safe-area-inset-bottom,12px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'8px 8px 4px' }}>
          {NAV.map(item => {
            const isActive = active === item.id
            if (item.scan) {
              return (
                <button key="scan" onClick={() => { triggerHaptic('medium'); onScan() }}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                  onTouchEnd={e => e.currentTarget.style.transform=''}
                  style={{ width:58, height:58, borderRadius:'50%', border:'none',
                    background:'linear-gradient(135deg,#8b6914,#c5a059)',
                    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                    boxShadow:'0 4px 20px rgba(197,160,89,0.45), 0 0 0 4px rgba(197,160,89,0.1)',
                    transform:'translateY(-10px)', flexShrink:0, transition:'transform 0.1s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:26, color:'#0a0600', ...FILL1 }}>qr_code_scanner</span>
                </button>
              )
            }
            return (
              <button key={item.id}
                onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.88)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:52, padding:'4px 0',
                  background:'none', border:'none', cursor:'pointer', transition:'transform 0.1s' }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize:24, color: isActive ? '#c5a059' : 'rgba(255,255,255,0.3)', ...( isActive ? FILL1 : {}) }}>
                  {item.icon}
                </span>
                {item.label && (
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, letterSpacing:'0.06em',
                    color: isActive ? '#c5a059' : 'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>
                    {item.label}
                  </span>
                )}
                {isActive && <div style={{ width:20, height:2, borderRadius:1, background:'#c5a059', marginTop:1 }} />}
              </button>
            )
          })}
        </div>
      </div>
      {/* Admin button */}
      <button onClick={() => { triggerHaptic('medium'); onAdmin() }}
        onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
        onTouchEnd={e => e.currentTarget.style.transform=''}
        style={{ position:'absolute', bottom:14, right:16, display:'flex', alignItems:'center', gap:6,
          padding:'9px 14px', borderRadius:99, border:'1px solid rgba(197,160,89,0.3)',
          background:'rgba(10,7,2,0.95)', backdropFilter:'blur(10px)', cursor:'pointer',
          boxShadow:'0 4px 18px rgba(0,0,0,0.6)', transition:'transform 0.1s' }}>
        <span className="material-symbols-outlined" style={{ fontSize:14, color:'#c5a059', ...FILL1 }}>admin_panel_settings</span>
        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:'#c5a059', letterSpacing:'0.1em' }}>Admin</span>
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PassportConnections() {
  const navigate   = useNavigate()
  const [tab,      setTab]       = useState('peopleMet')
  const [modal,    setModal]     = useState(null)
  const [selPerson, setSelPerson] = useState(null)
  const [passportData, setPassportData] = useState(null)
  const [verifyPerson, setVerifyPerson] = useState(null)
  const [muted,    setMuted]     = useState(false)
  const [toast,    setToast]     = useState({ visible:false, msg:'' })

  function showToast(msg) {
    setToast({ visible:true, msg })
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3200)
  }
  function closeModal() { triggerHaptic('light'); setModal(null) }

  const displayList = CONNECTIONS[tab] || []

  const allPeopleMet = CONNECTIONS.peopleMet
  const avatarStack = allPeopleMet.slice(0, 5)

  async function openDetail(person) {
    setSelPerson(person); setModal('detail')
  }
  async function openPassport(person) {
    const data = await getPassport(person.id)
    setPassportData(data); setSelPerson(person); setModal('passport')
  }
  async function openVerify(person) {
    setVerifyPerson(person); setModal('verify')
  }
  function handleScanned(person) {
    showToast(`Connection verified. Passport updated.`)
    triggerHaptic('success')
  }
  function handleVerifyDone() {
    closeModal()
    showToast('Connection verified. Passport updated.')
  }

  const HERO_BG = craftImages.fallbacks.lounge

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(170deg,#070509,#050308,#060208)', paddingBottom:100, overflowX:'hidden' }}>
      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 35% at 50% 0%,rgba(80,30,120,0.1) 0%,transparent 60%)' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, padding:'0 14px', height:62,
        background:'rgba(5,3,8,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(197,160,89,0.1)' }}>
        <button onClick={() => { triggerHaptic('light'); window.history.length > 1 ? window.history.back() : navigate('/') }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.88)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ width:38, height:38, borderRadius:'50%', border:'1px solid rgba(197,160,89,0.2)', background:'rgba(197,160,89,0.06)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:19, color:'#c5a059' }}>arrow_back</span>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:16, color:'#fff8ee', lineHeight:1 }}>360 Passport Connections</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.35)', letterSpacing:'0.08em', marginTop:2 }}>Grow your trusted network</p>
        </div>
        {/* Mute */}
        <button onClick={() => { triggerHaptic('light'); setMuted(m => !m) }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'0 11px', height:34, borderRadius:99,
            border:'1px solid rgba(197,160,89,0.22)', background: muted ? 'rgba(239,68,68,0.1)' : 'rgba(197,160,89,0.07)',
            cursor:'pointer', flexShrink:0, transition:'all 0.15s, transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:14, color: muted ? '#f87171' : '#c5a059', ...FILL1 }}>
            {muted ? 'volume_off' : 'volume_up'}
          </span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, color: muted ? '#f87171' : '#c5a059' }}>
            {muted ? 'Muted' : 'Mute'}
          </span>
        </button>
        {/* Scan CTA */}
        <button onClick={() => { triggerHaptic('medium'); setModal('scan') }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:36, borderRadius:99, border:'none',
            background:'linear-gradient(135deg,#8b6914,#c5a059)', cursor:'pointer', flexShrink:0,
            boxShadow:'0 2px 12px rgba(197,160,89,0.3)', transition:'transform 0.1s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:14, color:'#0a0600', ...FILL1 }}>qr_code_scanner</span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, color:'#0a0600' }}>Scan to Connect</span>
        </button>
      </header>

      <div style={{ position:'relative', zIndex:10, padding:'14px 14px 0' }}>
        {/* ── Hero card ───────────────────────────────────── */}
        <div style={{ borderRadius:18, overflow:'hidden', border:'1px solid rgba(197,160,89,0.2)', boxShadow:'0 12px 48px rgba(0,0,0,0.8)', marginBottom:16 }}>
          <div style={{ position:'relative', display:'flex', minHeight:200, background:'rgba(8,5,14,0.95)' }}>
            {/* Background image (right side) */}
            <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'55%', overflow:'hidden' }}>
              <img src={HERO_BG} alt="lounge" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35) saturate(0.5)' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(8,5,14,1) 0%,rgba(8,5,14,0.4) 50%,transparent 100%)' }} />
            </div>
            {/* Left content */}
            <div style={{ position:'relative', flex:1, padding:'20px 18px 20px', zIndex:2 }}>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:24, color:'#fff8ee', lineHeight:1, marginBottom:4 }}>Connections</p>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(197,160,89,0.5)', marginBottom:16, lineHeight:1.4 }}>Turns introductions into verified relationships.</p>
              {/* Stats */}
              <div style={{ display:'flex', gap:18, marginBottom:16 }}>
                {[
                  { val: HERO_STATS.verifiedConnections, label:'VERIFIED\nCONNECTIONS' },
                  { val: `${HERO_STATS.topMatchPercent}%`, label:'TOP\nMATCH' },
                  { val: HERO_STATS.socialGoal, label:'SOCIAL\nGOAL' },
                ].map(s => (
                  <div key={s.label} style={{ flexShrink:0 }}>
                    <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#e9c176', lineHeight:1 }}>{s.val}</p>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, color:'rgba(197,160,89,0.38)', letterSpacing:'0.1em', lineHeight:1.4, marginTop:2, whiteSpace:'pre-line' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Avatar stack */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex' }}>
                  {avatarStack.map((p, i) => (
                    <button key={p.id} onClick={() => { triggerHaptic('light'); openDetail(p) }}
                      style={{ marginLeft: i === 0 ? 0 : -12, cursor:'pointer', background:'none', border:'none', padding:0, position:'relative', zIndex: avatarStack.length - i, transition:'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform=''}>
                      <Portrait portraitKey={p.portraitKey} name={p.name} size={34} />
                    </button>
                  ))}
                </div>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(197,160,89,0.5)', fontWeight:700 }}>+{HERO_STATS.newContacts} New Contacts</span>
              </div>
            </div>
            {/* Right: gold stamp */}
            <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 16px 16px 0', flexShrink:0 }}>
              <PassportStamp size={148} />
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderRadius:12, overflow:'hidden',
          border:'1px solid rgba(197,160,89,0.14)', background:'rgba(14,9,24,0.6)', marginBottom:16 }}>
          {TABS.map((t, i) => (
            <button key={t.id}
              onClick={() => { triggerHaptic('light'); setTab(t.id) }}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ padding:'13px 4px', border:'none', background: tab === t.id ? 'rgba(50,28,72,0.95)' : 'transparent',
                borderLeft: i > 0 ? '1px solid rgba(197,160,89,0.1)' : 'none',
                cursor:'pointer', transition:'all 0.18s, transform 0.1s',
                fontFamily:'"Hanken Grotesk",sans-serif', fontWeight: tab === t.id ? 700 : 400, fontSize:13,
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.38)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Section label ─────────────────────────────── */}
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, fontWeight:700, color:'rgba(197,160,89,0.4)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:12 }}>Top Matches For You</p>

        {/* ── Connection rows ──────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
            style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {displayList.map((person, i) => (
              <ConnectionRow key={person.id} person={person} selected={selPerson?.id === person.id}
                onSelect={openDetail} onMatchClick={p => { setSelPerson(p); setModal('whymatch') }}
                delay={i * 0.06} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'scan' && (
          <ScanModal key="scan" muted={muted} onClose={closeModal} onConnected={handleScanned} />
        )}
        {modal === 'detail' && selPerson && (
          <DetailModal key="detail" person={selPerson} muted={muted}
            onClose={closeModal}
            onViewPassport={p => { closeModal(); setTimeout(() => openPassport(p), 120) }}
            onConnect={p => { closeModal(); setTimeout(() => openVerify(p), 120) }} />
        )}
        {modal === 'whymatch' && selPerson && (
          <WhyMatchModal key="whymatch" person={selPerson} onClose={closeModal} />
        )}
        {modal === 'passport' && selPerson && (
          <PassportModal key="passport" person={selPerson} passportData={passportData}
            onClose={closeModal}
            onConnect={p => { closeModal(); setTimeout(() => openVerify(p), 120) }} />
        )}
        {modal === 'verify' && verifyPerson && (
          <VerifyOverlay key="verify" person={verifyPerson} muted={muted} onDone={handleVerifyDone} />
        )}
        {modal === 'admin' && (
          <AdminModal key="admin" onClose={closeModal} />
        )}
      </AnimatePresence>

      <Toast msg={toast.msg} visible={toast.visible} />
      <BottomNav active="network" onScan={() => { triggerHaptic('medium'); setModal('scan') }} onAdmin={() => { triggerHaptic('medium'); setModal('admin') }} />
    </div>
  )
}
