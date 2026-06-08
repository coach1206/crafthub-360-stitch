import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'
import craftImages from '../../lib/craftImages.js'
import { CONNECTIONS, DEFAULT_SELECTED_ID, findConnection } from '../../data/connectionsData.js'
import { verifyConnection, scanConnection, getPassport } from '../../api/passportConnectionsApi.js'

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const FILL1 = { fontVariationSettings:"'FILL' 1" }

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(35)
}

function Portrait({ portraitKey, name, size = 56, ring = false, ringColor = '#a855f7', fallbackBg = '#1a0829' }) {
  const [err, setErr] = useState(false)
  const src = craftImages.portraits[portraitKey] || craftImages.fallbacks.mentor
  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      {ring && (
        <>
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:`conic-gradient(${ringColor}, #e9c176, ${ringColor})`, zIndex:0 }} />
          <div style={{ position:'absolute', inset:-2, borderRadius:'50%', background:'#0a0515', zIndex:1 }} />
        </>
      )}
      <div style={{ position:'absolute', inset:ring?2:0, borderRadius:'50%', overflow:'hidden', zIndex:2, background:fallbackBg }}>
        {!err ? (
          <img src={src} alt={name}
            onError={() => setErr(true)}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.82) saturate(0.75)' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:size*0.33, color:'#d4a8f0' }}>
            {name?.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}

function MatchMeter({ pct, size = 70 }) {
  const r    = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const [dash, setDash] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDash((pct / 100) * circ), 120)
    return () => clearTimeout(t)
  }, [pct, circ])

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#meterGrad)" strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
        <defs>
          <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:size*0.25, color:'#fff', lineHeight:1 }}>{pct}%</span>
        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:size*0.1, color:'rgba(192,132,252,0.7)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Match</span>
      </div>
    </div>
  )
}

function PassportStamp({ size = 120 }) {
  const cx   = size / 2
  const rOut = cx - 4
  const rTxt = cx - 14
  const topD = `M ${cx - rTxt},${cx} a ${rTxt},${rTxt} 0 0,1 ${rTxt*2},0`
  const botD = `M ${cx - rTxt},${cx} a ${rTxt},${rTxt} 0 0,0 ${rTxt*2},0`

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      {/* Gold glow */}
      <div style={{ position:'absolute', inset:-16, borderRadius:'50%', background:'radial-gradient(circle, rgba(197,160,89,0.3) 0%, transparent 65%)', pointerEvents:'none' }} />
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="sGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b5010" />
            <stop offset="35%" stopColor="#e9c176" />
            <stop offset="65%" stopColor="#f5d98a" />
            <stop offset="100%" stopColor="#c5a059" />
          </linearGradient>
          <path id="topArc" d={topD} />
          <path id="botArc" d={botD} />
        </defs>
        <circle cx={cx} cy={cx} r={rOut} fill="rgba(6,4,18,0.92)" stroke="url(#sGold)" strokeWidth={4} />
        <circle cx={cx} cy={cx} r={rOut - 7}  fill="none" stroke="rgba(197,160,89,0.28)" strokeWidth={1} />
        <circle cx={cx} cy={cx} r={rOut - 13} fill="none" stroke="rgba(197,160,89,0.12)" strokeWidth={1} strokeDasharray="4 3" />
        <text fontSize={size*0.1} fill="#e9c176" fontFamily="JetBrains Mono, monospace" fontWeight="700" letterSpacing="1.5">
          <textPath href="#topArc" startOffset="10%">360 PASSPORT</textPath>
        </text>
        <text fontSize={size*0.1} fill="#e9c176" fontFamily="JetBrains Mono, monospace" fontWeight="700" letterSpacing="1.5">
          <textPath href="#botArc" startOffset="13%">CONNECTIONS</textPath>
        </text>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:size*0.125, color:'#f0d88a', lineHeight:1.1, textAlign:'center' }}>VERIFIED</p>
        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:size*0.1, color:'rgba(233,193,118,0.75)', lineHeight:1.1, textAlign:'center' }}>INTRODUCTION</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MATCH ROW (compact list item)
══════════════════════════════════════════════════════════════ */
function MatchRow({ person, selected, onSelect }) {
  const isActive = selected?.id === person.id
  return (
    <motion.button
      layout
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0 }}
      onClick={() => { haptic(); onSelect(person) }}
      onTouchStart={e => e.currentTarget.style.background = 'rgba(168,85,247,0.12)'}
      onTouchEnd={e => e.currentTarget.style.background = ''}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
        borderRadius:16, border:`1px solid ${isActive ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.15)'}`,
        background: isActive ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
        cursor:'pointer', textAlign:'left', transition:'background 0.15s, border 0.2s',
        boxShadow: isActive ? '0 0 0 1px rgba(168,85,247,0.3), 0 4px 20px rgba(124,58,237,0.2)' : 'none',
      }}>
      {/* Portrait */}
      <Portrait portraitKey={person.portraitKey} name={person.name} size={48}
        ring={isActive} ringColor="#a855f7" />

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#f0e8ff', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{person.name}</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(192,132,252,0.65)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{person.role} @ {person.company}</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(168,85,247,0.45)', marginTop:1 }}>{person.location}</p>
      </div>

      {/* Match % ring */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(124,58,237,0.15)', border:'2px solid rgba(168,85,247,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <span style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:13, color:'#c084fc', lineHeight:1 }}>{person.matchScore}%</span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:6.5, color:'rgba(192,132,252,0.55)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Match</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:'rgba(168,85,247,0.35)' }}>chevron_right</span>
      </div>
    </motion.button>
  )
}

/* ══════════════════════════════════════════════════════════════
   DETAIL CARD (right panel / bottom sheet)
══════════════════════════════════════════════════════════════ */
function DetailCard({ person, onVerify, onPassport }) {
  if (!person) return null
  return (
    <div style={{
      borderRadius:22, overflow:'hidden',
      background:'linear-gradient(160deg,rgba(25,10,55,0.96),rgba(15,6,35,0.98))',
      border:'1px solid rgba(168,85,247,0.28)',
      boxShadow:'0 20px 60px rgba(0,0,0,0.8)',
      backdropFilter:'blur(20px)',
    }}>
      {/* Top glow strip */}
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,#a855f7,#7c3aed,transparent)' }} />

      <div style={{ padding:'20px 18px 22px' }}>
        {/* Verified badge */}
        {person.verified && (
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:14 }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color:'#e9c176', ...FILL1 }}>verified</span>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, fontWeight:700, color:'#e9c176', letterSpacing:'0.25em', textTransform:'uppercase' }}>Verified</span>
          </div>
        )}

        {/* Portrait + name + match meter */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <Portrait portraitKey={person.portraitKey} name={person.name} size={72}
            ring ringColor="#a855f7" />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:20, color:'#f0e8ff', lineHeight:1.1 }}>{person.name}</p>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10.5, color:'rgba(192,132,252,0.7)', marginTop:3 }}>{person.role} @ {person.company}</p>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
              <span className="material-symbols-outlined" style={{ fontSize:11, color:'rgba(168,85,247,0.5)', ...FILL1 }}>location_on</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(168,85,247,0.5)' }}>{person.location}</span>
            </div>
          </div>
          <MatchMeter pct={person.matchScore} size={72} />
        </div>

        {/* Why You Match */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, fontWeight:700, color:'rgba(168,85,247,0.5)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:5 }}>Why You Match</p>
          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(240,232,255,0.7)', lineHeight:1.6, fontStyle:'italic' }}>{person.whyYouMatch}</p>
        </div>

        {/* Shared Interests */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, fontWeight:700, color:'rgba(168,85,247,0.5)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:7 }}>Shared Interests</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {person.sharedInterests.map(i => (
              <span key={i} style={{ padding:'4px 10px', borderRadius:99, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.28)', fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'#c084fc' }}>{i}</span>
            ))}
          </div>
        </div>

        {/* Shared Event + Best Next Move */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
          <div style={{ padding:12, borderRadius:14, background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.18)' }}>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, fontWeight:700, color:'rgba(168,85,247,0.45)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>Shared Event</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                <img src={craftImages.events.cigarcognac} alt="event"
                  onError={e => { e.currentTarget.src = craftImages.fallbacks.lounge }}
                  style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.7) saturate(0.7)' }} />
              </div>
              <div>
                <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:10.5, color:'#e8d0ff', lineHeight:1.2 }}>{person.sharedEvent?.title}</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(168,85,247,0.45)', marginTop:1 }}>{person.sharedEvent?.date}</p>
              </div>
            </div>
          </div>
          <div style={{ padding:12, borderRadius:14, background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.18)' }}>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, fontWeight:700, color:'rgba(168,85,247,0.45)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>Best Next Move</p>
            <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:18, color:'rgba(168,85,247,0.5)', ...FILL1, flexShrink:0, marginTop:1 }}>handshake</span>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:10.5, color:'rgba(200,170,255,0.75)', lineHeight:1.4 }}>{person.bestNextMove}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button
            onClick={() => { haptic(); onPassport() }}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
            onTouchEnd={e => e.currentTarget.style.transform=''}
            style={{ height:50, borderRadius:14, border:'1.5px solid rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'transform 0.12s' }}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:'#c084fc', ...FILL1 }}>book</span>
            <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#c084fc' }}>View Passport</span>
          </button>
          <button
            onClick={() => { haptic(); onVerify() }}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
            onTouchEnd={e => e.currentTarget.style.transform=''}
            style={{ height:50, borderRadius:14, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(124,58,237,0.45)', transition:'transform 0.12s' }}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:'#fff', ...FILL1 }}>hub</span>
            <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#fff' }}>Connect Now</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   VERIFY MODAL
══════════════════════════════════════════════════════════════ */
function VerifyModal({ person, muted, onClose }) {
  const [step, setStep] = useState('verifying')

  useEffect(() => {
    const t = setTimeout(async () => {
      try { await verifyConnection(person.id) } catch (_) {}
      setStep('verified')
      if (!muted) {
        try {
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 440; osc.type = 'sine'
          gain.gain.setValueAtTime(0.15, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
          osc.start(); osc.stop(ctx.currentTime + 0.5)
        } catch (_) {}
      }
      haptic()
    }, 1400)
    return () => clearTimeout(t)
  }, [person.id, muted])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:180, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)' }} />
      <motion.div
        initial={{ opacity:0, scale:0.88, y:24 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.9, y:16 }}
        transition={{ type:'spring', damping:22, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:340, borderRadius:24, overflow:'hidden',
          background:'linear-gradient(155deg,#1a0840,#0e0520)',
          border:'1px solid rgba(168,85,247,0.4)',
          boxShadow:'0 24px 80px rgba(0,0,0,0.9), 0 0 60px rgba(124,58,237,0.2)',
          padding:'36px 28px 32px', textAlign:'center' }}>

        <AnimatePresence mode="wait">
          {step === 'verifying' ? (
            <motion.div key="verifying" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {/* Spinning gold ring */}
              <div style={{ position:'relative', width:90, height:90, margin:'0 auto 20px' }}>
                <svg width={90} height={90} style={{ position:'absolute', inset:0, animation:'spin 1.2s linear infinite' }}>
                  <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                  <circle cx={45} cy={45} r={38} fill="none" stroke="url(#vGold)" strokeWidth={5}
                    strokeDasharray="60 140" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="vGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e9c176" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:36, color:'#c084fc', ...FILL1 }}>hub</span>
                </div>
              </div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#f0e8ff', marginBottom:6 }}>Verifying Connection…</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(192,132,252,0.5)', textTransform:'uppercase', letterSpacing:'0.15em' }}>Passport updating</p>
            </motion.div>
          ) : (
            <motion.div key="verified"
              initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              transition={{ type:'spring', damping:18, stiffness:280 }}>
              {/* Stamp seal */}
              <PassportStamp size={110} />
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#f0e8ff', margin:'16px 0 4px' }}>Connection Verified</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, color:'#e9c176', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{person.name}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(192,132,252,0.5)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:22 }}>Passport Updated ✓</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={onClose}
                  onTouchStart={e => e.currentTarget.style.opacity='0.7'}
                  onTouchEnd={e => e.currentTarget.style.opacity=''}
                  style={{ height:46, borderRadius:12, border:'1px solid rgba(168,85,247,0.3)', background:'rgba(168,85,247,0.08)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#c084fc' }}>
                  Close
                </button>
                <button onClick={onClose}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                  onTouchEnd={e => e.currentTarget.style.transform=''}
                  style={{ height:46, borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#fff', boxShadow:'0 4px 16px rgba(124,58,237,0.4)', transition:'transform 0.12s' }}>
                  View Passport
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCAN MODAL
══════════════════════════════════════════════════════════════ */
function ScanModal({ onClose, onFound }) {
  const [scanState, setScanState] = useState('idle')
  const [found, setFound] = useState(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function simulate() {
    setScanState('scanning')
    haptic()
    try {
      const result = await scanConnection('simulated-qr')
      setFound(result.person)
      setScanState('found')
      haptic()
    } catch (_) { setScanState('idle') }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:180, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' }} />
      <motion.div
        initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:26, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:420, borderRadius:'24px 24px 0 0', overflow:'hidden',
          background:'linear-gradient(175deg,#14062e,#0a0420)',
          border:'1px solid rgba(168,85,247,0.35)', borderBottom:'none',
          boxShadow:'0 -20px 60px rgba(0,0,0,0.9)',
          padding:'28px 24px 40px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(168,85,247,0.25)' }} />
        </div>

        <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#f0e8ff', textAlign:'center', marginBottom:6 }}>Scan to Connect</p>
        <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(192,132,252,0.5)', textAlign:'center', marginBottom:24, letterSpacing:'0.08em' }}>Point your camera at a guest passport QR code.</p>

        {/* Camera frame */}
        <div style={{ position:'relative', width:200, height:200, margin:'0 auto 24px', borderRadius:16,
          background:'rgba(0,0,0,0.5)', border:'2px solid rgba(168,85,247,0.4)',
          overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* Corner marks */}
          {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry], i) => (
            <div key={i} style={{ position:'absolute', width:20, height:20,
              top: ry ? 'auto' : 8, bottom: ry ? 8 : 'auto',
              left: rx ? 'auto' : 8, right: rx ? 8 : 'auto',
              borderTop: ry ? 'none' : '3px solid #a855f7',
              borderBottom: ry ? '3px solid #a855f7' : 'none',
              borderLeft: rx ? 'none' : '3px solid #a855f7',
              borderRight: rx ? '3px solid #a855f7' : 'none',
              borderRadius: rx === 0 && ry === 0 ? '2px 0 0 0' : rx === 1 && ry === 0 ? '0 2px 0 0' : rx === 0 && ry === 1 ? '0 0 0 2px' : '0 0 2px 0',
            }} />
          ))}
          {/* Scanning line */}
          {scanState === 'scanning' && (
            <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#a855f7,transparent)',
              animation:'scanLine 1.2s ease-in-out infinite', top:'50%' }}>
              <style>{`@keyframes scanLine { 0%{transform:translateY(-90px)} 100%{transform:translateY(90px)} }`}</style>
            </div>
          )}
          {scanState === 'found' && found ? (
            <div style={{ textAlign:'center', padding:8 }}>
              <Portrait portraitKey={found.portraitKey} name={found.name} size={64} ring ringColor="#a855f7" />
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#f0e8ff', marginTop:8 }}>{found.name}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'#a855f7', marginTop:2 }}>Connection Found!</p>
            </div>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize:64, color:'rgba(168,85,247,0.2)', ...FILL1 }}>qr_code_2</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {scanState === 'found' && found ? (
            <motion.div key="found" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <button onClick={() => { onFound(found); onClose() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#fff', boxShadow:'0 4px 20px rgba(124,58,237,0.4)', marginBottom:10, transition:'transform 0.12s' }}>
                Verify Connection
              </button>
              <button onClick={onClose}
                style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(168,85,247,0.28)', background:'rgba(168,85,247,0.07)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c084fc' }}>
                Close
              </button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <button onClick={simulate} disabled={scanState === 'scanning'}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:52, borderRadius:14, border:'none',
                  background: scanState === 'scanning' ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  cursor: scanState === 'scanning' ? 'default' : 'pointer',
                  fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, color:'#fff',
                  boxShadow:'0 4px 20px rgba(124,58,237,0.4)', marginBottom:10, transition:'transform 0.12s' }}>
                {scanState === 'scanning' ? 'Scanning…' : 'Simulate Successful Scan'}
              </button>
              <button onClick={onClose}
                style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(168,85,247,0.25)', background:'rgba(168,85,247,0.06)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#c084fc' }}>
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PASSPORT MODAL
══════════════════════════════════════════════════════════════ */
function PassportModal({ person, onClose, onConnect }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:180, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)' }} />
      <motion.div
        initial={{ opacity:0, scale:0.9, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92, y:16 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:360, borderRadius:24, overflow:'hidden',
          background:'linear-gradient(160deg,#fdf8ec,#f0e6cc)',
          border:'2px solid rgba(160,115,55,0.4)',
          boxShadow:'0 24px 80px rgba(0,0,0,0.9)' }}>
        {/* Ruled lines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(120,80,30,0.055) 20px,rgba(120,80,30,0.055) 21px)' }} />
        {/* Gold top strip */}
        <div style={{ height:3, background:'linear-gradient(90deg,#4a3008,#e9c176,#c5a059,#f0d070,#4a3008)' }} />

        <div style={{ padding:'20px 20px 24px', position:'relative' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, fontWeight:700, color:'rgba(80,45,10,0.45)', textTransform:'uppercase', letterSpacing:'0.2em' }}>360 Passport Connection</p>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:18, color:'#2d1a08', marginTop:2 }}>Professional Passport</p>
            </div>
            <WaxSealMini />
          </div>

          {/* Person */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <Portrait portraitKey={person.portraitKey} name={person.name} size={60} ring ringColor="#c5a059" fallbackBg="#f0e6cc" />
            <div>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:16, color:'#2d1a08' }}>{person.name}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(80,45,10,0.55)', marginTop:2 }}>{person.role} @ {person.company}</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(80,45,10,0.4)', marginTop:1 }}>{person.location}</p>
            </div>
          </div>

          {/* Passport details */}
          {[
            { label:'Stamp',              value:'Verified Introduction' },
            { label:'Event',              value: person.sharedEvent?.title || 'Grand Opening Night' },
            { label:'Status',             value:'Verified Introduction' },
            { label:'Relationship Value', value:'High' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:8, marginBottom:8, borderBottom:'1px solid rgba(140,95,40,0.15)' }}>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(80,45,10,0.4)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{r.label}</span>
              <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:11, color:'#3d2510' }}>{r.value}</span>
            </div>
          ))}

          {/* Buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
            <button onClick={onClose}
              style={{ height:46, borderRadius:12, border:'1.5px solid rgba(80,45,10,0.3)', background:'rgba(80,45,10,0.06)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#4a2e08' }}>
              Close
            </button>
            {!person.verified && (
              <button onClick={() => { onClose(); onConnect() }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ height:46, borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#fff', boxShadow:'0 3px 12px rgba(124,58,237,0.35)', transition:'transform 0.12s' }}>
                Connect Now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function WaxSealMini({ size = 46 }) {
  const cx = size / 2, r = cx - 3, rT = cx - 10
  const arc = `M ${cx-rT},${cx} a ${rT},${rT} 0 1,1 ${rT*2},0`
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id="wMini" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9b2020" />
            <stop offset="100%" stopColor="#5c0f0f" />
          </radialGradient>
          <path id="wMiniArc" d={arc} />
        </defs>
        <circle cx={cx} cy={cx} r={r} fill="url(#wMini)" stroke="rgba(139,20,20,0.5)" strokeWidth={2} />
        <text fontSize={size*0.1} fill="rgba(255,200,200,0.6)" fontFamily="JetBrains Mono, monospace">
          <textPath href="#wMiniArc" startOffset="5%">360 PASSPORT</textPath>
        </text>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:4 }}>
        <span className="material-symbols-outlined" style={{ fontSize:size*0.35, color:'rgba(255,200,200,0.8)', ...FILL1 }}>public</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id:'matches',   label:'Best Matches',   list: CONNECTIONS.bestMatches  },
  { id:'met',       label:'People You Met', list: CONNECTIONS.peopleMet    },
  { id:'suggested', label:'Suggested',      list: CONNECTIONS.suggested    },
]

export default function PassportConnections() {
  const navigate   = useNavigate()
  const [tab,      setTab]      = useState('met')
  const [selected, setSelected] = useState(() => findConnection(DEFAULT_SELECTED_ID))
  const [expanded, setExpanded] = useState(false)
  const [muted,    setMuted]    = useState(false)
  const [modal,    setModal]    = useState(null) // null | 'scan' | 'verify' | 'passport'
  const allPortraits = [...CONNECTIONS.bestMatches, ...CONNECTIONS.peopleMet].slice(0, 5)

  const currentTab  = TABS.find(t => t.id === tab)
  const visibleList = expanded ? currentTab?.list : currentTab?.list.slice(0, 3)

  function openVerify() { setModal('verify') }
  function openScan()   { setModal('scan')   }
  function openPassport(){ setModal('passport') }
  function closeModal() { setModal(null) }

  function handleScanFound(person) {
    setSelected(person)
    setTimeout(() => setModal('verify'), 200)
  }

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden" style={{ background:'#050312' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(88,28,135,0.35) 0%, transparent 60%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 40% at 80% 100%, rgba(109,40,217,0.2) 0%, transparent 55%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 100% 50% at 50% 50%, rgba(30,0,60,0.5) 0%, transparent 70%)' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:12, padding:'0 16px', height:68,
        background:'rgba(5,3,18,0.97)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(168,85,247,0.18)' }}>
        <button onClick={() => navigate('/passport')}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.88)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          aria-label="Back"
          style={{ width:40, height:40, borderRadius:'50%', border:'1px solid rgba(168,85,247,0.28)', background:'rgba(168,85,247,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'transform 0.12s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#c084fc' }}>arrow_back</span>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:17, color:'#f0e8ff', lineHeight:1 }}>360 Passport Connections</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(192,132,252,0.4)', letterSpacing:'0.12em', marginTop:2 }}>Grow your trusted network</p>
        </div>
        {/* Mute */}
        <button onClick={() => setMuted(m => !m)}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          aria-label={muted ? 'Sound On' : 'Mute'}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'0 12px', height:36, borderRadius:99, border:'1px solid rgba(168,85,247,0.25)', background: muted ? 'rgba(100,100,100,0.12)' : 'rgba(168,85,247,0.08)', cursor:'pointer', flexShrink:0, transition:'transform 0.12s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:15, color: muted ? 'rgba(255,255,255,0.3)' : '#c084fc', ...FILL1 }}>
            {muted ? 'volume_off' : 'volume_up'}
          </span>
          <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color: muted ? 'rgba(255,255,255,0.3)' : '#c084fc', fontWeight:700 }}>
            {muted ? 'Muted' : 'Mute'}
          </span>
        </button>
        {/* Scan CTA */}
        <button onClick={() => { haptic(); openScan() }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          aria-label="Scan to Connect"
          style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:38, borderRadius:99, border:'none', background:'linear-gradient(135deg,#7c3aed,#a855f7)', cursor:'pointer', flexShrink:0, boxShadow:'0 3px 14px rgba(124,58,237,0.4)', transition:'transform 0.12s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:15, color:'#fff', ...FILL1 }}>qr_code_scanner</span>
          <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#fff' }}>Scan to Connect</span>
        </button>
      </header>

      {/* ── Two-column layout (desktop) / single col (mobile) ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-5"
        style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>

        {/* ═══ LEFT COLUMN ═══════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Hero stats card */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            style={{ borderRadius:22, overflow:'hidden', background:'linear-gradient(155deg,rgba(30,12,70,0.95),rgba(15,6,40,0.98))',
              border:'1px solid rgba(168,85,247,0.3)', boxShadow:'0 12px 48px rgba(0,0,0,0.7)', backdropFilter:'blur(20px)' }}>
            <div style={{ height:2, background:'linear-gradient(90deg,transparent,#7c3aed,#a855f7,#7c3aed,transparent)' }} />
            <div style={{ padding:'20px 20px 18px', display:'flex', alignItems:'flex-start', gap:16 }}>
              {/* Left: info */}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#f0e8ff', lineHeight:1, marginBottom:5 }}>Connections</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(192,132,252,0.5)', marginBottom:16 }}>Turns introductions into verified relationships.</p>
                <div style={{ display:'flex', gap:20 }}>
                  {[{ v:'12', l:'Verified Connections' }, { v:'94%', l:'Top Match' }, { v:'8/10', l:'Social Goal' }].map(s => (
                    <div key={s.l}>
                      <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:18, color:'#c084fc', lineHeight:1 }}>{s.v}</p>
                      <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(168,85,247,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                {/* Profile stack */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:16 }}>
                  <div style={{ display:'flex' }}>
                    {allPortraits.map((p, i) => (
                      <div key={p.id || i} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: allPortraits.length - i }}>
                        <Portrait portraitKey={p.portraitKey} name={p.name} size={36} ring ringColor="rgba(168,85,247,0.6)" />
                      </div>
                    ))}
                  </div>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(168,85,247,0.1)', border:'1px dashed rgba(168,85,247,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, fontWeight:700, color:'rgba(168,85,247,0.6)' }}>+7</span>
                  </div>
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, color:'rgba(168,85,247,0.4)', marginLeft:4 }}>New Contacts</span>
                </div>
              </div>
              {/* Right: passport stamp */}
              <PassportStamp size={116} />
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.1 }}
            style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderRadius:18, padding:6,
              background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.15)' }}>
            {TABS.map(t => (
              <button key={t.id}
                onClick={() => { setTab(t.id); setExpanded(false) }}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{ height:44, borderRadius:12, cursor:'pointer', transition:'all 0.2s, transform 0.12s',
                  background: tab === t.id ? 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(168,85,247,0.3))' : 'transparent',
                  border: tab === t.id ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent',
                  fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12,
                  color: tab === t.id ? '#e0b8ff' : 'rgba(168,85,247,0.4)',
                  boxShadow: tab === t.id ? '0 2px 12px rgba(124,58,237,0.2)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </motion.div>

          {/* Match list */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.15 }}
            style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, fontWeight:700, color:'rgba(168,85,247,0.38)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:4, paddingLeft:2 }}>
              Top Matches For You
            </p>
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:8 }}
                transition={{ duration:0.22 }}
                style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {visibleList?.map(p => (
                  <MatchRow key={p.id} person={p} selected={selected} onSelect={setSelected} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* View All */}
            {(currentTab?.list?.length || 0) > 3 && (
              <button
                onClick={() => setExpanded(e => !e)}
                onTouchStart={ev => ev.currentTarget.style.opacity='0.7'}
                onTouchEnd={ev => ev.currentTarget.style.opacity=''}
                style={{ width:'100%', height:46, borderRadius:14, border:'1px solid rgba(168,85,247,0.22)', background:'rgba(168,85,247,0.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:2 }}>
                <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'rgba(168,85,247,0.6)' }}>
                  {expanded ? 'Show Less' : `View All Matches`}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:'rgba(168,85,247,0.4)', transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>expand_more</span>
              </button>
            )}
          </motion.div>

          {/* Detail card — SHOWN IN SINGLE COLUMN BELOW LIST */}
          <div className="block" style={{ '--tw-block':'block' }}>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.3 }}>
                <DetailCard person={selected} onVerify={openVerify} onPassport={openPassport} />
              </motion.div>
            )}
          </div>

          {/* Passport reminder */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.25 }}
            style={{ borderRadius:18, display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:8,
              background:'rgba(124,58,237,0.08)', border:'1px solid rgba(168,85,247,0.2)' }}>
            <WaxSealMini size={40} />
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(192,132,252,0.65)', lineHeight:1.5 }}>Your passport is your professional reputation.<br/>Every connection adds value.</p>
            </div>
            <button onClick={openPassport}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{ padding:'0 14px', height:38, borderRadius:12, border:'1px solid rgba(168,85,247,0.3)', background:'rgba(168,85,247,0.1)', cursor:'pointer', fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:11, color:'#c084fc', flexShrink:0, transition:'transform 0.12s' }}>
              See Passport
            </button>
          </motion.div>

        </div>{/* end left column */}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === 'verify' && selected && (
          <VerifyModal key="verify" person={selected} muted={muted} onClose={closeModal} />
        )}
        {modal === 'scan' && (
          <ScanModal key="scan" onClose={closeModal} onFound={handleScanFound} />
        )}
        {modal === 'passport' && selected && (
          <PassportModal key="passport" person={selected} onClose={closeModal} onConnect={openVerify} />
        )}
      </AnimatePresence>

      <PassportBottomNav active="connections" />
    </div>
  )
}
