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

/* ═══════════════════════════════════════════════════════════════
   PREMIUM PALETTE — document-grade, luxury passport
═══════════════════════════════════════════════════════════════ */
const C = {
  /* neutrals */
  ivory:    '#F7F1E4',
  parch:    '#EFE1C4',
  sand:     '#E6D5B2',
  bgPage:   '#EDE0C0',
  /* premium accents */
  gold:     '#B88A3B',
  goldDk:   '#9F742E',
  goldLt:   '#D4A85A',
  goldPale: '#F0D898',
  bronze:   '#7A5A2A',
  bronzeLt: '#A07840',
  navy:     '#112B45',
  navyMid:  '#1E3F60',
  navyLt:   '#2A5580',
  charcoal: '#241D16',
  charMid:  'rgba(36,29,22,0.55)',
  charFaint:'rgba(36,29,22,0.15)',
  charLine: 'rgba(36,29,22,0.1)',
  /* leather cover */
  cover:    '#1E1005',
  coverMid: '#2E1A08',
  coverLt:  '#3D2410',
  /* restrained accents */
  forest:   '#395E47',
  burg:     '#6B3A34',
  slate:    '#5A6C7D',
  /* whites */
  cardBg:   '#F9F3E8',
  cardAlt:  '#F2EAD6',
  border:   'rgba(184,138,59,0.3)',
  borderSt: 'rgba(184,138,59,0.6)',
}
const SERIF   = '"Playfair Display",Georgia,serif'
const SANS    = '"Hanken Grotesk",system-ui,sans-serif'
const MONO    = '"JetBrains Mono","Courier New",monospace'
const OCR     = '"JetBrains Mono","Courier New",monospace'
const FILL1   = { fontVariationSettings:"'FILL' 1" }

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVE HELPERS
═══════════════════════════════════════════════════════════════ */
function PageRules({ rows=16, color=C.charLine }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {[...Array(rows)].map((_,i) => (
        <div key={i} style={{ position:'absolute', left:0, right:0,
          top:`${(i+1)*(100/(rows+1))}%`, height:1, background:color }}/>
      ))}
    </div>
  )
}
function Grain({ op=0.06 }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:op, pointerEvents:'none' }}
      viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      {[...Array(38)].map((_,i) => (
        <ellipse key={i} cx={(i%10)*22+(Math.floor(i/10)%2)*11} cy={Math.floor(i/10)*38}
          rx={10+i%5} ry={2} fill="none" stroke="#fff" strokeWidth={0.32} opacity={0.35+(i%3)*0.12}/>
      ))}
    </svg>
  )
}
function Tap({ onClick, children, style={} }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ transform:pr?'scale(0.97)':'scale(1)', transition:'transform .1s',
        cursor:onClick?'pointer':'default', ...style }}>
      {children}
    </div>
  )
}
function GBtn({ children, onClick, outline=false, full=false, sm=false, style={} }) {
  const [pr, setPr] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        width:full?'100%':'auto', padding:sm?'0 14px':'0 22px', height:sm?36:44, borderRadius:8,
        border:outline?`1.5px solid ${C.gold}`:'none',
        background:outline?'transparent':pr?C.goldDk:C.gold, color:outline?C.gold:'#fff',
        fontFamily:SANS, fontWeight:700, fontSize:sm?12:13, cursor:'pointer',
        transform:pr?'scale(0.96)':'scale(1)', transition:'all .12s',
        letterSpacing:'0.02em',
        boxShadow:outline?'none':`0 3px 10px rgba(184,138,59,0.28)`, ...style }}>
      {children}
    </button>
  )
}
function SH({ title, right, style={} }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:13, ...style }}>
      <div style={{ width:3, height:20, borderRadius:2, background:C.gold, flexShrink:0 }}/>
      <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.charcoal }}>{title}</span>
      <div style={{ flex:1, height:1, background:C.border, marginLeft:4 }}/>
      {right}
    </div>
  )
}
function QrGraphic({ size=42, color=C.charcoal }) {
  const s=size/7
  const pat=[[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,0,0,0,0,0],
             [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pat.map((row,ri) => row.map((v,ci) => v
        ? <rect key={`${ri}-${ci}`} x={ci*s+0.5} y={ri*s+0.5} width={s-1} height={s-1} rx={1.2} fill={color} opacity={0.8}/>
        : null))}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM SVG SEALS / BADGES — no glyphs
═══════════════════════════════════════════════════════════════ */

/* Emblem watermark */
function Emblem({ size=80, color=C.goldLt, op=1 }) {
  const cx=size/2, r=cx-5
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity:op }}>
      <circle cx={cx} cy={cx} r={r}    fill="none" stroke={color} strokeWidth={1.6}/>
      <circle cx={cx} cy={cx} r={r-9}  fill="none" stroke={color} strokeWidth={0.7} strokeDasharray="3 2"/>
      <circle cx={cx} cy={cx} r={r-18} fill="none" stroke={color} strokeWidth={0.5} opacity={0.6}/>
      {[...Array(8)].map((_,i) => {
        const a=(i*45)*Math.PI/180
        return <line key={i} x1={cx+Math.cos(a)*10} y1={cx+Math.sin(a)*10}
          x2={cx+Math.cos(a)*(r-10)} y2={cx+Math.sin(a)*(r-10)} stroke={color} strokeWidth={0.6} opacity={0.5}/>
      })}
      <circle cx={cx} cy={cx} r={9} fill={`${color}18`} stroke={color} strokeWidth={0.7}/>
      <text x={cx} y={cx+3} textAnchor="middle" fontFamily={MONO} fontSize={size*0.11} fontWeight={700} fill={color}>360</text>
    </svg>
  )
}

/* ── Directory badge: ID registry seal ─────────────────────── */
function DirectorySeal({ size=64 }) {
  const c = size/2, r = c-4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="dg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.navyLt} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={C.navy} stopOpacity="0.05"/>
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#dg)" stroke={C.gold} strokeWidth={1.8}/>
      <circle cx={c} cy={c} r={r-7} fill="none" stroke={C.gold} strokeWidth={0.6} strokeDasharray="2.5 2"/>
      {/* ID card outline */}
      <rect x={c-13} y={c-10} width={26} height={19} rx={3}
        fill="none" stroke={C.goldLt} strokeWidth={1.2}/>
      {/* portrait silhouette */}
      <circle cx={c-5} cy={c-4} r={4} fill={C.goldLt} opacity={0.7}/>
      <path d={`M${c-13} ${c+9} Q${c-9} ${c+2} ${c-5} ${c+2} Q${c-1} ${c+2} ${c+3} ${c+9}`}
        fill={C.goldLt} opacity={0.55}/>
      {/* lines */}
      <line x1={c+2} y1={c-6} x2={c+12} y2={c-6} stroke={C.goldLt} strokeWidth={1.2} opacity={0.7}/>
      <line x1={c+2} y1={c-2} x2={c+10} y2={c-2} stroke={C.goldLt} strokeWidth={0.9} opacity={0.5}/>
      <line x1={c+2} y1={c+2} x2={c+8}  y2={c+2} stroke={C.goldLt} strokeWidth={0.7} opacity={0.4}/>
      {/* rim stars */}
      {[0,60,120,180,240,300].map(deg => {
        const a=deg*Math.PI/180
        return <circle key={deg} cx={c+Math.cos(a)*(r-3)} cy={c+Math.sin(a)*(r-3)} r={1} fill={C.gold} opacity={0.7}/>
      })}
    </svg>
  )
}

/* ── Connections badge: trust-network seal ─────────────────── */
function ConnectionSeal({ size=64 }) {
  const c=size/2, r=c-4
  const nodes=[{x:c,y:c-14},{x:c-12,y:c+7},{x:c+12,y:c+7}]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.navy} stopOpacity="0.12"/>
          <stop offset="100%" stopColor={C.navy} stopOpacity="0.03"/>
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#cg)" stroke={C.goldDk} strokeWidth={1.8}/>
      <circle cx={c} cy={c} r={r-7} fill="none" stroke={C.goldDk} strokeWidth={0.55} strokeDasharray="2 2.5"/>
      {/* network lines */}
      {nodes.flatMap((a,i) => nodes.slice(i+1).map((b,j) => (
        <line key={`${i}${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.goldLt} strokeWidth={1} opacity={0.6}/>
      )))}
      {/* nodes */}
      {nodes.map((n,i) => (
        <circle key={i} cx={n.x} cy={n.y} r={4.5} fill={C.goldDk} stroke={C.goldPale} strokeWidth={1}/>
      ))}
      <circle cx={c} cy={c} r={3} fill={C.goldPale} opacity={0.8}/>
      {/* rim dots */}
      {[0,45,90,135,180,225,270,315].map(d => {
        const a=d*Math.PI/180
        return <circle key={d} cx={c+Math.cos(a)*(r-3)} cy={c+Math.sin(a)*(r-3)} r={0.8} fill={C.gold} opacity={0.65}/>
      })}
    </svg>
  )
}

/* ── Events badge: admission / invitation seal ─────────────── */
function EventSeal({ size=64 }) {
  const c=size/2, r=c-4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="eg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.navy} stopOpacity="0.14"/>
          <stop offset="100%" stopColor={C.navy} stopOpacity="0.03"/>
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#eg)" stroke={C.gold} strokeWidth={1.8}/>
      <circle cx={c} cy={c} r={r-7} fill="none" stroke={C.gold} strokeWidth={0.55} strokeDasharray="2.5 2"/>
      {/* Ticket / invitation frame */}
      <rect x={c-14} y={c-11} width={28} height={22} rx={3}
        fill="none" stroke={C.goldLt} strokeWidth={1.1}/>
      {/* perforation notches */}
      <circle cx={c-14} cy={c} r={3} fill={C.bgPage}/>
      <circle cx={c+14} cy={c} r={3} fill={C.bgPage}/>
      {/* dashed line */}
      <line x1={c-11} y1={c} x2={c+11} y2={c} stroke={C.goldLt} strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.7}/>
      {/* star */}
      {[...Array(5)].map((_,i) => {
        const a=(i*72-90)*Math.PI/180
        const b=((i*72-90)+36)*Math.PI/180
        return <polygon key={i} points={`${c+Math.cos(a)*6},${c+Math.sin(a)*6} ${c+Math.cos(b)*3},${c+Math.sin(b)*3}`}/>
      })}
      <polygon points={`
        ${c+0},${c-7} ${c+1.8},${c-2.5} ${c+6.8},${c-2.5}
        ${c+2.8},${c+1} ${c+4.2},${c+6.5} ${c+0},${c+3.5}
        ${c-4.2},${c+6.5} ${c-2.8},${c+1} ${c-6.8},${c-2.5}
        ${c-1.8},${c-2.5}`}
        fill={C.goldLt} opacity={0.85}/>
      {/* rim dots */}
      {[0,60,120,180,240,300].map(d => {
        const a=d*Math.PI/180
        return <circle key={d} cx={c+Math.cos(a)*(r-3)} cy={c+Math.sin(a)*(r-3)} r={0.9} fill={C.gold} opacity={0.7}/>
      })}
    </svg>
  )
}

/* ── Benefits badge: privilege medallion ───────────────────── */
function BenefitSeal({ size=64 }) {
  const c=size/2, r=c-4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="bg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.goldLt} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={C.gold} stopOpacity="0.04"/>
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#bg2)" stroke={C.goldDk} strokeWidth={1.8}/>
      <circle cx={c} cy={c} r={r-7} fill="none" stroke={C.goldDk} strokeWidth={0.55} strokeDasharray="2.5 2"/>
      {/* ribbon */}
      <path d={`M${c-8},${c-2} L${c},${c-10} L${c+8},${c-2} L${c+5},${c+12} L${c},${c+9} L${c-5},${c+12} Z`}
        fill={C.goldLt} stroke={C.goldDk} strokeWidth={0.8} opacity={0.85}/>
      <circle cx={c} cy={c-3} r={6} fill={C.goldDk} stroke={C.goldPale} strokeWidth={1}/>
      <text x={c} y={c} textAnchor="middle" fontFamily={MONO} fontSize={6} fontWeight={900} fill={C.ivory} dy="2">VIP</text>
      {/* rim dash */}
      {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map(d => {
        const a=d*Math.PI/180
        return <line key={d} x1={c+Math.cos(a)*(r-4)} y1={c+Math.sin(a)*(r-4)}
          x2={c+Math.cos(a)*(r-1)} y2={c+Math.sin(a)*(r-1)} stroke={C.gold} strokeWidth={1} opacity={0.7}/>
      })}
    </svg>
  )
}

/* ── Scan badge: QR credential ─────────────────────────────── */
function ScanBadge({ size=54 }) {
  const c=size/2, r=c-3
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={C.gold} stopOpacity="0.03"/>
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#sg)" stroke={C.gold} strokeWidth={1.5}/>
      <circle cx={c} cy={c} r={r-6} fill="none" stroke={C.gold} strokeWidth={0.5} opacity={0.6}/>
      <g transform={`translate(${c-12},${c-12})`}>
        {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i) => (
          <rect key={i} x={rx*16+1} y={ry*16+1} width={8} height={8} rx={1.5}
            fill="none" stroke={C.goldDk} strokeWidth={1.4}/>
        ))}
        <rect x={10} y={10} width={4} height={4} rx={1} fill={C.goldDk} opacity={0.7}/>
        <line x1={0} y1={12} x2={8} y2={12} stroke={C.gold} strokeWidth={1} opacity={0.6}/>
        <line x1={16} y1={12} x2={24} y2={12} stroke={C.gold} strokeWidth={1} opacity={0.6}/>
        <line x1={12} y1={0} x2={12} y2={8} stroke={C.gold} strokeWidth={1} opacity={0.6}/>
        <line x1={12} y1={16} x2={12} y2={24} stroke={C.gold} strokeWidth={1} opacity={0.6}/>
      </g>
    </svg>
  )
}

/* ── Premium passport section card ─────────────────────────── */
function PremiumPassportCard({ seal, title, desc, onClick, watermarkEl, accentColor=C.navy }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{
        position:'relative', borderRadius:16, overflow:'hidden', cursor:'pointer',
        background:`linear-gradient(145deg,${C.ivory} 0%,${C.parch} 45%,${C.sand} 100%)`,
        border:`1.5px solid rgba(184,138,59,0.35)`,
        boxShadow: pr
          ? `0 2px 8px rgba(36,29,22,0.15), inset 0 1px 3px rgba(36,29,22,0.08)`
          : `0 6px 22px rgba(36,29,22,0.12), 0 2px 6px rgba(36,29,22,0.07), inset 0 1px 0 rgba(255,255,255,0.6)`,
        transform: pr ? 'scale(0.97) translateY(1px)' : 'scale(1)',
        transition:'all .12s',
      }}>
      {/* gold inner line */}
      <div style={{ position:'absolute', inset:4, borderRadius:12,
        border:`1px solid rgba(184,138,59,0.18)`, pointerEvents:'none', zIndex:2 }}/>
      {/* watermark background */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        opacity:0.06, pointerEvents:'none', zIndex:1 }}>
        {watermarkEl}
      </div>
      {/* horizontal ruling lines */}
      <PageRules rows={12} color="rgba(36,29,22,0.07)"/>
      {/* content */}
      <div style={{ position:'relative', zIndex:3, padding:'18px 14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ flexShrink:0 }}>{seal}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:16, color:C.charcoal, lineHeight:1.2 }}>{title}</p>
          <p style={{ fontFamily:SANS, fontSize:12, color:C.charMid, lineHeight:1.45, marginTop:3 }}>{desc}</p>
        </div>
        <svg width={22} height={22} viewBox="0 0 22 22" fill="none" style={{ flexShrink:0 }}>
          <circle cx={11} cy={11} r={10} stroke={C.border} strokeWidth={1.2}/>
          <path d="M8.5 7L13.5 11L8.5 15" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* bottom edge accent */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${C.gold}35,transparent)` }}/>
    </div>
  )
}

/* ── Premium action module (Start Here) ─────────────────────── */
function ActionModule({ seal, label, sub, onClick, accent=C.navy }) {
  const [pr, setPr] = useState(false)
  return (
    <div onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{
        position:'relative', borderRadius:14, overflow:'hidden', cursor:'pointer',
        background:`linear-gradient(160deg,${C.ivory} 0%,${C.parch} 80%,${C.sand} 100%)`,
        border:`1.5px solid rgba(184,138,59,0.28)`,
        boxShadow: pr
          ? `0 2px 6px rgba(36,29,22,0.12), inset 0 1px 2px rgba(36,29,22,0.06)`
          : `0 4px 14px rgba(36,29,22,0.1), inset 0 1px 0 rgba(255,255,255,0.55)`,
        transform: pr ? 'scale(0.95) translateY(1px)' : 'scale(1)',
        transition:'all .12s',
        display:'flex', flexDirection:'column', alignItems:'center',
        textAlign:'center', padding:'16px 10px 14px', gap:8,
      }}>
      <div style={{ position:'absolute', inset:3, borderRadius:11,
        border:`1px solid rgba(184,138,59,0.14)`, pointerEvents:'none' }}/>
      <PageRules rows={10} color="rgba(36,29,22,0.06)"/>
      <div style={{ position:'relative', zIndex:2 }}>{seal}</div>
      <div style={{ position:'relative', zIndex:2 }}>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12.5, color:C.charcoal, lineHeight:1.2 }}>{label}</p>
        {sub && <p style={{ fontFamily:SANS, fontSize:10.5, color:C.charMid, lineHeight:1.35, marginTop:2 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Premium collectible stamp seal ─────────────────────────── */
function StampSeal({ stamp, size=72, paletteIdx=0, onClick }) {
  const [pr, setPr] = useState(false)
  const PALETTES=[
    { ring:C.navy,  inner:C.navyMid, label:C.goldLt, icon:C.goldLt, bg:`${C.navy}10`     }, // navy/gold
    { ring:C.goldDk,inner:C.bronze,  label:C.charcoal,icon:C.goldLt, bg:`${C.gold}10`     }, // antique gold
    { ring:C.navy,  inner:C.navyLt,  label:C.goldPale,icon:C.goldLt, bg:`${C.navyMid}10`  }, // deep navy seal
    { ring:C.bronze,inner:C.bronzeLt,label:C.charcoal,icon:C.goldLt, bg:`${C.bronze}10`   }, // bronze
    { ring:C.goldLt,inner:C.gold,    label:C.charcoal,icon:C.ivory,   bg:`${C.goldLt}14`   }, // champagne/ivory
  ]
  const pal = PALETTES[paletteIdx%5]
  const c=size/2, r=c-4
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0,
        transform:`rotate(${stamp.tilt||0}deg) scale(${pr?0.88:1})`,
        transition:'transform .12s', opacity: stamp.earned ? 1 : 0.35 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg style={{ position:'absolute', inset:0 }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* outer embossed ring */}
          <circle cx={c} cy={c} r={r} fill={pal.bg} stroke={pal.ring} strokeWidth={2.4}/>
          {/* inner dashed ring */}
          <circle cx={c} cy={c} r={r-8} fill="none" stroke={pal.ring} strokeWidth={0.9} strokeDasharray="3 1.8" opacity={0.8}/>
          {/* fine detail ring */}
          <circle cx={c} cy={c} r={r-14} fill="none" stroke={pal.ring} strokeWidth={0.45} opacity={0.5}/>
          {/* rim tick marks */}
          {[...Array(24)].map((_,i) => {
            const a=(i*15)*Math.PI/180
            const long=i%6===0
            return <line key={i}
              x1={c+Math.cos(a)*(r-3)} y1={c+Math.sin(a)*(r-3)}
              x2={c+Math.cos(a)*(r-(long?8:5))} y2={c+Math.sin(a)*(r-(long?8:5))}
              stroke={pal.ring} strokeWidth={long?1:0.6} opacity={long?0.9:0.5}/>
          })}
        </svg>
        {/* icon */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:2 }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:size*0.29, color:pal.icon, ...FILL1 }}>{stamp.icon}</span>
          <span style={{ fontFamily:MONO, fontSize:size*0.095, color:pal.label, fontWeight:700,
            letterSpacing:'0.07em', textTransform:'uppercase', lineHeight:1 }}>{stamp.label}</span>
        </div>
        {/* earned check */}
        {stamp.earned && (
          <div style={{ position:'absolute', top:1, right:1, width:16, height:16, borderRadius:'50%',
            background:pal.ring, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 1px 4px rgba(0,0,0,0.22)' }}>
            <svg width={9} height={9} viewBox="0 0 9 9">
              <path d="M2 4.5L4 6.5L7 3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Nav badge ──────────────────────────────────────────────── */
function NavBadge({ label, abbr, color, onClick, active }) {
  const [pr, setPr] = useState(false)
  return (
    <button onClick={onClick}
      onTouchStart={()=>setPr(true)} onTouchEnd={()=>setPr(false)}
      onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
        padding:'2px 4px', background:'none', border:'none', cursor:'pointer', minWidth:58,
        transform:pr?'scale(0.88)':'scale(1)', transition:'transform .1s' }}>
      <div style={{
        width:50, height:40, borderRadius:12,
        background: active ? color : C.ivory,
        border: active ? `2px solid ${color}` : `1.5px solid rgba(36,29,22,0.28)`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
        boxShadow: active
          ? `0 3px 10px ${color}50, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 2px 6px rgba(36,29,22,0.12), inset 0 1px 0 rgba(255,255,255,0.7)`,
        transition:'all .15s' }}>
        <span style={{ fontFamily:MONO, fontWeight:800, fontSize:11,
          color: active ? '#fff' : C.charcoal,
          letterSpacing:'0.05em', lineHeight:1 }}>{abbr}</span>
      </div>
      <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:'0.07em', fontWeight:600,
        color: active ? color : C.charMid, lineHeight:1 }}>{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════════ */
function ModalShell({ onClose, children }) {
  useEffect(() => {
    const k=e=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',k); return()=>window.removeEventListener('keydown',k)
  },[onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:160, display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(17,43,69,0.7)', backdropFilter:'blur(9px)' }}/>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        style={{ position:'relative', width:'100%', maxWidth:480, margin:'0 auto',
          borderRadius:'18px 18px 0 0', background:C.ivory, borderTop:`3px solid ${C.gold}`,
          boxShadow:'0 -16px 48px rgba(17,43,69,0.25)', maxHeight:'90vh',
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
    const k=e=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',k); return()=>window.removeEventListener('keydown',k)
  },[onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:170, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'absolute', inset:0, background:'rgba(17,43,69,0.65)', backdropFilter:'blur(9px)' }}/>
      <motion.div initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        transition={{ type:'spring', damping:22, stiffness:290 }}
        style={{ position:'relative', width:'100%', maxWidth:maxW, borderRadius:14,
          background:C.ivory, border:`2px solid ${C.gold}`,
          boxShadow:'0 24px 60px rgba(17,43,69,0.3)', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none' }}>
        {children}
      </motion.div>
    </div>
  )
}
function FactBox({ children }) {
  return (
    <div style={{ background:C.parch, borderRadius:10, padding:'10px 14px',
      border:`1px solid ${C.border}`, boxShadow:'inset 0 1px 3px rgba(36,29,22,0.04)' }}>
      {children}
    </div>
  )
}
function FactRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'6px 0', borderBottom:`1px solid ${C.charLine}` }}>
      <span style={{ fontFamily:MONO, fontSize:10, color:C.charMid, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
      <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:color||C.charcoal }}>{value}</span>
    </div>
  )
}

/* ── Scan modal ─────────────────────────────────────────────── */
function ScanModal({ muted, onClose, onResult }) {
  const [state, setState] = useState('idle')
  const SIMS=[
    {type:'venue',  icon:'store',             label:'Simulate Venue Check-In'},
    {type:'event',  icon:'event',             label:'Simulate Event Entry'},
    {type:'member', icon:'person',            label:'Simulate Member Scan'},
    {type:'stamp',  icon:'workspace_premium', label:'Simulate Stamp Claim'},
    {type:'benefit',icon:'redeem',            label:'Simulate Benefit Unlock'},
  ]
  async function simulate(type) {
    setState('scanning'); triggerHaptic('medium')
    const res = await scanPassportSource(ALL_PAYLOADS[type])
    setState('idle'); if(!muted) playSuccessTone(); triggerHaptic('success'); onClose(); onResult(res)
  }
  return (
    <ModalShell onClose={onClose}>
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:22, color:C.charcoal, textAlign:'center', marginBottom:4 }}>Scan Passport</p>
      <p style={{ fontFamily:SANS, fontSize:14, color:C.charMid, textAlign:'center', lineHeight:1.55, marginBottom:16 }}>
        Point at any 360 Passport QR to verify.
      </p>
      <div style={{ width:150, height:150, margin:'0 auto 18px', borderRadius:12,
        background:C.parch, border:`2px solid ${C.border}`, position:'relative',
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
              border:`1px solid ${C.border}`, background:C.parch, cursor:'pointer',
              fontFamily:SANS, fontWeight:600, fontSize:14, color:C.charcoal, textAlign:'left' }}>
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
      <div style={{ width:58, height:58, borderRadius:'50%', background:`${iconColor}12`,
        border:`1.5px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize:28, color:iconColor, ...FILL1 }}>{icon}</span>
      </div>
      {badge && <span style={{ display:'inline-block', fontFamily:MONO, fontSize:9, color:iconColor,
        background:`${iconColor}10`, border:`1px solid ${iconColor}22`, padding:'2px 12px',
        borderRadius:99, marginBottom:6, letterSpacing:'0.12em' }}>{badge}</span>}
      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.charcoal }}>{title}</p>
    </div>
  )
}

function ScanResultModal({ result, muted, onClose, onAction, onShowOverlay }) {
  if(!result) return null
  const { sourceType, data } = result
  if(!result.success||sourceType==='invalid') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="error" iconColor={C.burg} badge="INVALID CODE" title="Invalid Passport Code"/>
      <FactBox><p style={{ fontFamily:SANS, fontSize:14, color:C.charcoal, lineHeight:1.6, textAlign:'center', padding:'4px 0 8px' }}>
        This code is not connected to 360 Passport Connections.</p></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={()=>{ triggerHaptic('light'); onClose(); onAction('reopen-scan') }}>Try Again</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if(sourceType==='venue') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="store" iconColor={C.navy} badge="CHECK-IN" title="Venue Check-In Verified"/>
      <FactBox><FactRow label="Venue" value={data.name}/><FactRow label="Location" value={`${data.city}, ${data.state}`}/><FactRow label="Stamps" value={`${data.availableStamps?.length} available`}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToVenue(data.id); onShowOverlay('check-in'); onClose() }}>Start Passport Session</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if(sourceType==='event') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="event" iconColor={C.navyMid} badge="CHECK-IN" title="Event Check-In Verified"/>
      <FactBox><FactRow label="Event" value={data.name}/><FactRow label="Venue" value={data.venue}/><FactRow label="Stamp" value={data.stampName} color={C.forest}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await checkInToEvent(data.id); onShowOverlay('stamp'); onClose() }}>Claim Event Stamp</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if(sourceType==='member') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="person" iconColor={C.forest} badge="MATCH FOUND" title="Connection Found"/>
      <FactBox><FactRow label="Member" value={data.name}/><FactRow label="Role" value={`${data.role} @ ${data.company}`}/><FactRow label="Match Score" value={`${data.matchScore}%`} color={C.gold}/><FactRow label="Trust" value={data.trustStatus} color={C.forest}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await apiVerify(data.id); onShowOverlay('verify'); onClose() }}>Verify Connection</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if(sourceType==='stamp') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="workspace_premium" iconColor={C.goldDk} badge="AUTHENTICATED" title="Stamp Ready to Claim"/>
      <FactBox><FactRow label="Stamp" value={data.name}/><FactRow label="Category" value={data.category?.toUpperCase()}/><FactRow label="Status" value={data.authenticated?'Authenticated ✓':'Pending'} color={data.authenticated?C.forest:C.burg}/></FactBox>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        <GBtn full onClick={async()=>{ triggerHaptic('success'); await claimStamp(data.id,'current'); onShowOverlay('stamp'); onClose() }}>Claim Stamp</GBtn>
        <GBtn full outline onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn>
      </div>
    </ModalShell>
  )
  if(sourceType==='benefit') return (
    <ModalShell onClose={onClose}>
      <ResultHead icon="redeem" iconColor={C.burg} badge="UNLOCKED" title="Benefit Unlocked"/>
      <FactBox><FactRow label="Benefit" value={data.name}/><FactRow label="Provider" value={data.provider}/><FactRow label="Expires" value={data.expiration}/></FactBox>
      <p style={{ fontFamily:SANS, fontSize:13, color:C.charMid, fontStyle:'italic', lineHeight:1.6, margin:'10px 0 14px' }}>{data.redemption}</p>
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
  useEffect(()=>{
    const t=setTimeout(()=>{ setStep('done'); if(!muted){playStampSound();playSuccessTone()} ; triggerHaptic('success') },1300)
    return()=>clearTimeout(t)
  },[muted])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0, background:'rgba(17,43,69,0.82)', backdropFilter:'blur(14px)' }}/>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:'spring', damping:20, stiffness:280 }}
        style={{ position:'relative', width:'100%', maxWidth:270, borderRadius:18, padding:'30px 22px 26px',
          background:C.ivory, border:`2.5px solid ${C.gold}`,
          boxShadow:'0 20px 60px rgba(17,43,69,0.35)', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {step==='updating'
            ? <motion.div key="upd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  border:`3px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'spinGold 1.2s linear infinite' }}>
                  <style>{`@keyframes spinGold{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <span className="material-symbols-outlined" style={{ fontSize:30, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.charcoal }}>Updating Passport…</p>
              </motion.div>
            : <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
                  background:`${C.gold}12`, border:`2px solid ${C.gold}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:36, color:C.gold, ...FILL1 }}>verified</span>
                </div>
                <p style={{ fontFamily:SERIF, fontWeight:900, fontSize:22, color:C.charcoal, marginBottom:4 }}>Stamp Awarded</p>
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
      <div style={{ background:C.parch, borderRadius:'12px 12px 0 0', padding:'22px 18px 18px',
        borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
        <div style={{ margin:'0 auto 10px', width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <StampSeal stamp={{ ...stamp, tilt:-3 }} size={80} paletteIdx={0} onClick={()=>{}}/>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.charcoal }}>{stamp.name}</p>
      </div>
      <div style={{ padding:'14px 18px 22px' }}>
        <p style={{ fontFamily:SANS, fontSize:14, color:C.charcoal, lineHeight:1.65, marginBottom:12 }}>{stamp.description}</p>
        <FactBox><FactRow label="Requirement" value={stamp.requirement}/><FactRow label="Status" value={stamp.earned?'Earned ✓':'Not yet earned'} color={stamp.earned?C.forest:C.burg}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

function EventDetailModal({ event, onClose, onRsvp }) {
  const [rsvpd, setRsvpd] = useState(event.rsvpd)
  const [loading, setLoading] = useState(false)
  async function handleRsvp(){ setLoading(true); triggerHaptic('success'); await rsvpToEvent(event.id); setRsvpd(true); setLoading(false); onRsvp(event.id) }
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ minWidth:52, textAlign:'center', background:C.cover, borderRadius:10, padding:'7px 9px', flexShrink:0 }}>
          <p style={{ fontFamily:MONO, fontSize:8, color:`rgba(212,168,90,0.5)` }}>{event.date?.split(' ')[0]?.toUpperCase()}</p>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.goldLt, lineHeight:1 }}>{event.date?.split(' ')[1]}</p>
        </div>
        <div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.charcoal }}>{event.name}</p>
          <p style={{ fontFamily:SANS, fontSize:13, color:C.charMid }}>{event.venue} · {event.city} · {event.time}</p>
        </div>
      </div>
      <FactBox><FactRow label="Attendees" value={`${event.attendeeCount}/${event.capacity}`}/><FactRow label="Capacity" value={`${event.fillPct}% Filled`} color={event.fillPct>85?C.burg:C.forest}/></FactBox>
      <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
        {rsvpd
          ? <div style={{ padding:'12px', background:`${C.forest}10`, border:`1px solid ${C.forest}28`, borderRadius:10, textAlign:'center' }}>
              <p style={{ fontFamily:SANS, fontWeight:700, fontSize:14, color:C.forest }}>RSVP Confirmed</p>
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
  const g=GUIDES[step]||GUIDES[1]
  return (
    <CenterModal onClose={onClose} maxW={320}>
      <div style={{ padding:'28px 22px 26px', textAlign:'center' }}>
        <div style={{ width:62, height:62, borderRadius:'50%', background:C.parch, border:`1.5px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:30, color:C.charcoal, ...FILL1 }}>{g.icon}</span>
        </div>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.charcoal, marginBottom:10 }}>{g.title}</p>
        <p style={{ fontFamily:SANS, fontSize:14, color:C.charcoal, lineHeight:1.7, marginBottom:22 }}>{g.body}</p>
        <GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Got It</GBtn>
      </div>
    </CenterModal>
  )
}

function ProfileModal({ profile, onClose }) {
  const xpPct=Math.round((profile.xp/profile.nextTierXp)*100)
  return (
    <CenterModal onClose={onClose} maxW={360}>
      <div style={{ background:C.cover, borderRadius:'12px 12px 0 0', padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <Grain op={0.07}/>
        <div style={{ position:'absolute', right:-20, top:-20, opacity:0.09 }}><Emblem size={160} color={C.goldLt}/></div>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ width:66, height:66, borderRadius:'50%', background:`${C.gold}22`,
            border:`2.5px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
            <span style={{ fontFamily:SERIF, fontWeight:700, fontSize:24, color:C.gold }}>{profile.initials}</span>
          </div>
          <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.goldLt }}>{profile.displayName}</p>
          <p style={{ fontFamily:SANS, fontSize:12, color:`rgba(212,168,90,0.55)`, marginTop:2 }}>{profile.role} @ {profile.company}</p>
          <span style={{ display:'inline-block', marginTop:8, fontFamily:MONO, fontSize:9, color:C.gold,
            background:`${C.gold}18`, border:`1px solid ${C.gold}28`, padding:'3px 12px', borderRadius:99, letterSpacing:'0.12em' }}>
            {profile.tier?.toUpperCase()} MEMBER
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 18px 24px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:C.charMid, textTransform:'uppercase' }}>Legacy Score</span>
            <span style={{ fontFamily:MONO, fontSize:10, color:C.gold }}>{profile.xp} / {profile.nextTierXp}</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:C.sand, border:`1px solid ${C.border}` }}>
            <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${C.goldDk},${C.gold})` }}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[{val:profile.verifiedConnections,label:'Connections'},{val:profile.stampsEarned,label:'Stamps'},{val:profile.eventsAttended,label:'Events'}].map(s => (
            <div key={s.label} style={{ textAlign:'center', background:C.parch, borderRadius:9, padding:'10px 5px', border:`1px solid ${C.border}` }}>
              <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:20, color:C.charcoal }}>{s.val}</p>
              <p style={{ fontFamily:MONO, fontSize:8.5, color:C.charMid, textTransform:'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <FactBox><FactRow label="Passport ID" value={profile.passportId}/><FactRow label="Member Since" value={profile.memberSince}/><FactRow label="Status" value={profile.status} color={C.forest}/></FactBox>
        <div style={{ marginTop:14 }}><GBtn full onClick={()=>{ triggerHaptic('light'); onClose() }}>Close</GBtn></div>
      </div>
    </CenterModal>
  )
}

function AdminPanel({ onClose }) {
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const ITEMS=[
    {label:'Edit venue data',icon:'store',action:()=>setStatus('Edit src/data/venues.js')},
    {label:'Edit event data',icon:'event',action:()=>setStatus('Edit src/api/passportHomeApi.js')},
    {label:'Edit member data',icon:'people',action:()=>setStatus('Edit src/data/members.js')},
    {label:'Edit stamp data',icon:'workspace_premium',action:()=>setStatus('Edit src/data/stamps.js')},
    {label:'Edit benefit data',icon:'redeem',action:()=>setStatus('Edit src/data/benefits.js')},
  ]
  async function queueOpenAI(){
    const { requestOpenAIImageReplacement } = await import('../../api/passportScanApi.js')
    const res = await requestOpenAIImageReplacement('passport-hero', prompt||'Professional passport dashboard hero')
    setStatus(res.message)
  }
  return (
    <CenterModal onClose={onClose} maxW={400}>
      <div style={{ background:C.sand, borderRadius:'12px 12px 0 0', padding:'16px 18px', borderBottom:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', gap:9 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:C.gold, ...FILL1 }}>admin_panel_settings</span>
        <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.charcoal }}>Admin Source Panel</p>
      </div>
      <div style={{ padding:'14px 18px 24px' }}>
        {ITEMS.map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px',
              borderRadius:9, border:`1px solid ${C.border}`, background:C.parch, cursor:'pointer',
              marginBottom:7, textAlign:'left', fontFamily:SANS, fontSize:13, color:C.charcoal }}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:13, marginTop:6 }}>
          <p style={{ fontFamily:MONO, fontSize:9, color:C.charMid, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>OpenAI Image Replacement</p>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Image prompt…"
            style={{ width:'100%', padding:'9px 11px', borderRadius:9, border:`1px solid ${C.border}`,
              background:C.ivory, color:C.charcoal, fontFamily:SANS, fontSize:13, marginBottom:8, outline:'none', boxSizing:'border-box' }}/>
          <button onClick={queueOpenAI}
            style={{ width:'100%', padding:'11px', borderRadius:9, border:`1px solid ${C.gold}`, background:`${C.gold}0A`,
              fontFamily:SANS, fontWeight:700, fontSize:13, color:C.gold, cursor:'pointer', marginBottom:8 }}>
            Queue OpenAI Request
          </button>
          {status && <p style={{ fontFamily:MONO, fontSize:9, color:C.forest }}>{status}</p>}
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
            background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:12, padding:'11px 20px',
            display:'flex', alignItems:'center', gap:9, boxShadow:'0 8px 28px rgba(17,43,69,0.14)', whiteSpace:'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:C.gold, ...FILL1 }}>check_circle</span>
          <span style={{ fontFamily:SANS, fontSize:14, fontWeight:600, color:C.charcoal }}>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Bottom nav ─────────────────────────────────────────────── */
function BottomNav({ onScan }) {
  const navigate = useNavigate()
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90 }}>
      <div style={{ maxWidth:640, margin:'0 auto',
        background:C.ivory, borderTop:`2px solid ${C.border}`,
        borderRadius:'20px 20px 0 0',
        boxShadow:'0 -6px 28px rgba(17,43,69,0.10)',
        paddingBottom:'env(safe-area-inset-bottom,10px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'12px 6px 8px' }}>
          <NavBadge label="HOME"      abbr="HM"  color={C.goldDk}  onClick={()=>{ triggerHaptic('light'); navigate('/passport') }}            active={true}/>
          <NavBadge label="DIRECTORY" abbr="DIR" color={C.navy}    onClick={()=>{ triggerHaptic('light'); navigate('/passport/directory') }}/>
          {/* centre QR scan — raised gold pill */}
          <button onClick={()=>{ triggerHaptic('medium'); onScan() }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0,
              background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <div style={{ width:60, height:56, borderRadius:16,
              background:`linear-gradient(150deg,${C.goldLt},${C.goldDk})`,
              border:`2.5px solid ${C.gold}`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
              transform:'translateY(-12px)',
              boxShadow:`0 8px 22px rgba(184,138,59,0.48), 0 0 0 5px ${C.ivory}, 0 0 0 7px ${C.border}`,
              transition:'transform .1s' }}>
              <span style={{ fontFamily:MONO, fontWeight:900, fontSize:13, color:'#fff', letterSpacing:'0.04em', lineHeight:1 }}>QR</span>
              <span style={{ fontFamily:MONO, fontWeight:700, fontSize:9,  color:'rgba(255,255,255,0.85)', letterSpacing:'0.07em' }}>SCAN</span>
            </div>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.07em', marginTop:-6 }}>SCAN</span>
          </button>
          <NavBadge label="EVENTS"   abbr="EVT" color={C.navyMid} onClick={()=>{ triggerHaptic('light'); navigate('/passport/events') }}/>
          <NavBadge label="BENEFITS" abbr="BNF" color={C.burg}    onClick={()=>{ triggerHaptic('light'); navigate('/passport/benefits') }}/>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
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
    const h=e=>{ if(e.altKey&&(e.key==='a'||e.key==='A')){ triggerHaptic('light'); setModal('admin') } }
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h)
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
    if(action==='reopen-scan'){ setModal('scan'); return }
    const routes={events:'/passport/events',connections:'/passport/connections',stamps:'/passport/stamps',directory:'/passport/directory',benefits:'/passport/benefits'}
    if(routes[action]) navigate(routes[action])
  }

  const xpPct=Math.round((profile.xp/profile.nextTierXp)*100)

  /* passport sections */
  const SECTIONS=[
    { title:'Directory',    desc:'Verified members, brands & more',                  Seal:DirectorySeal, route:'/passport/directory',    wm:<Emblem size={220} color={C.navy} op={1}/> },
    { title:'Connections',  desc:'Your trusted network & conversations',              Seal:ConnectionSeal,route:'/passport/connections',  wm:<Emblem size={220} color={C.navy} op={1}/> },
    { title:'Events',       desc:'Curated experiences & private invitations',         Seal:EventSeal,     route:'/passport/events',        wm:<Emblem size={220} color={C.navy} op={1}/> },
    { title:'Benefits',     desc:'Access privileges, perks & rewards',               Seal:BenefitSeal,   route:'/passport/benefits',      wm:<Emblem size={220} color={C.gold} op={1}/> },
  ]

  /* start here modules */
  const ACTIONS=[
    { Seal:ScanBadge, label:'Scan to Connect', sub:'Events & venues', action:()=>{ triggerHaptic('medium'); setModal('scan') } },
    { Seal:DirectorySeal, label:'Explore Directory', sub:'Verified members', action:()=>navigate('/passport/directory'), size:54 },
    { Seal:ConnectionSeal, label:'View Matches', sub:'Top connections', action:()=>navigate('/passport/connections'), size:54 },
    { Seal:EventSeal, label:'Join an Event', sub:'RSVP & meet in person', action:()=>navigate('/passport/events'), size:54 },
    { Seal:BenefitSeal, label:'Explore Benefits', sub:'Unlock rewards', action:()=>navigate('/passport/benefits'), size:54 },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bgPage, paddingBottom:120 }}>

      {/* ════════════════════════════════════════════════════
          DARK LEATHER COVER — top section only
      ════════════════════════════════════════════════════ */}
      <div style={{ background:`linear-gradient(180deg,${C.cover} 0%,${C.coverMid} 100%)`,
        position:'relative', overflow:'hidden', paddingBottom:20 }}>
        <Grain op={0.06}/>

        {/* top bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 10px', position:'relative', zIndex:3 }}>
          <button onClick={()=>{ triggerHaptic('light'); navigate('/crafthub') }}
            style={{ width:40, height:40, borderRadius:11, border:`1.5px solid ${C.gold}55`,
              background:`${C.gold}20`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
              boxShadow:`0 2px 8px rgba(184,138,59,0.18)` }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10L13 16" stroke={C.goldLt} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:MONO, fontSize:8, color:`${C.goldLt}60`, letterSpacing:'0.2em' }}>BY PROFOUND INNOVATIONS</p>
            <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:15, color:C.goldLt, letterSpacing:'0.05em' }}>360 LEGACY PASSPORT™</p>
          </div>
          <button onClick={()=>{ triggerHaptic('light'); setMuted(m=>!m) }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:99,
              border:`1px solid ${muted?'#e88':C.gold}40`, background:muted?`rgba(180,40,40,0.12)`:`${C.gold}10`,
              cursor:'pointer', fontFamily:MONO, fontSize:8.5, color:muted?'#e88':C.goldLt }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color:muted?'#e88':C.gold, ...FILL1 }}>
              {muted?'volume_off':'volume_up'}
            </span>
            {muted?'Muted':'Mute'}
          </button>
        </div>

        {/* passport booklet */}
        <div style={{ margin:'0 14px', position:'relative', zIndex:3 }}>
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
            {/* Identity page — open booklet interior */}
            <div style={{ display:'flex', background:'#1A0E05' }}>
              <div style={{ width:10, background:`linear-gradient(90deg,rgba(0,0,0,0.6),rgba(0,0,0,0.15))`, flexShrink:0 }}/>
              <div style={{ flex:1, background:`linear-gradient(150deg,${C.ivory} 0%,${C.parch} 60%,${C.sand} 100%)`,
                position:'relative', overflow:'hidden', padding:'14px 16px 18px' }}>
                <PageRules rows={18}/>
                <div style={{ position:'absolute', right:-12, bottom:-12, opacity:0.05, pointerEvents:'none' }}>
                  <Emblem size={130} color={C.goldDk}/>
                </div>
                <div style={{ position:'relative', zIndex:2 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:11 }}>
                    <div>
                      <p style={{ fontFamily:MONO, fontSize:8, color:C.charMid, letterSpacing:'0.18em' }}>PASSPORT IDENTITY</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:17, color:C.charcoal }}>{profile.displayName}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontFamily:MONO, fontSize:8, color:C.charMid }}>PASSPORT No.</p>
                      <p style={{ fontFamily:MONO, fontWeight:700, fontSize:11, color:C.charcoal }}>{profile.passportId}</p>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', marginBottom:12 }}>
                    {[
                      {label:'Tier',         value:profile.tier?.toUpperCase()},
                      {label:'Member Since',  value:profile.memberSince},
                      {label:'Legacy Score',  value:`${profile.xp} pts`},
                      {label:'Status',        value:profile.status},
                    ].map(f => (
                      <div key={f.label} style={{ borderBottom:`1px solid ${C.charLine}`, paddingBottom:4 }}>
                        <p style={{ fontFamily:MONO, fontSize:8, color:C.charMid, letterSpacing:'0.12em', textTransform:'uppercase' }}>{f.label}</p>
                        <p style={{ fontFamily:SERIF, fontWeight:600, fontSize:13, color:C.charcoal }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom:11 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontFamily:MONO, fontSize:8, color:C.charMid, letterSpacing:'0.1em' }}>LEGACY SCORE</span>
                      <span style={{ fontFamily:MONO, fontSize:8, color:C.gold }}>{xpPct}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:C.charLine, border:`1px solid ${C.charFaint}` }}>
                      <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:3,
                        background:`linear-gradient(90deg,${C.goldDk},${C.goldLt})` }}/>
                    </div>
                  </div>
                  <Tap onClick={()=>{ triggerHaptic('medium'); setModal('scan') }}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px',
                      background:`rgba(36,29,22,0.04)`, border:`1px solid ${C.charLine}`, borderRadius:9 }}>
                    <QrGraphic size={34}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:SANS, fontWeight:700, fontSize:13, color:C.charcoal }}>360 Passport Connection</p>
                      <p style={{ fontFamily:MONO, fontSize:9, color:C.charMid }}>Scan to connect · Active session</p>
                    </div>
                    <div style={{ padding:'6px 14px', borderRadius:8, background:C.gold,
                      boxShadow:`0 2px 6px rgba(184,138,59,0.28)` }}>
                      <span style={{ fontFamily:SANS, fontWeight:700, fontSize:12, color:'#fff' }}>SCAN</span>
                    </div>
                  </Tap>
                  <div style={{ marginTop:9, borderTop:`1px solid ${C.charLine}`, paddingTop:6 }}>
                    <div style={{ fontFamily:OCR, fontSize:9, color:C.charMid, letterSpacing:'0.05em', lineHeight:1.65 }}>
                      <div>P&lt;USA{profile.displayName?.toUpperCase().replace(' ','<<').padEnd(39,'<').slice(0,39)}</div>
                      <div>{profile.passportId?.padEnd(9,'<')}0USA9512016M</div>
                    </div>
                    <p style={{ fontFamily:MONO, fontSize:7.5, color:`${C.charMid}80`, marginTop:2, letterSpacing:'0.16em' }}>MACHINE READABLE ZONE</p>
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
          OPEN PARCHMENT — premium sections below cover
      ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'22px 14px 0' }}>

        {/* HOW IT WORKS */}
        <SH title="How It Works"
          right={
            <button onClick={()=>{ triggerHaptic('light'); setGuideStep(1) }}
              style={{ fontFamily:SANS, fontWeight:600, fontSize:13, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
              Full guide →
            </button>
          }/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, marginBottom:24 }}>
          {[
            {num:1,icon:'qr_code_scanner',title:'Scan In',       sub:'Enter events with your QR passport.'},
            {num:2,icon:'person_edit',     title:'Build Profile', sub:'Share your story and goals.'},
            {num:3,icon:'hub',            title:'Meet People',   sub:'Connect with verified members.'},
            {num:4,icon:'workspace_premium',title:'Earn Stamps', sub:'Collect stamps and grow legacy.'},
          ].map((s,idx) => (
            <Tap key={s.num} onClick={()=>{ triggerHaptic('light'); setGuideStep(s.num) }}
              style={{ position:'relative', borderRadius:14, overflow:'hidden', cursor:'pointer',
                background:`linear-gradient(150deg,${C.ivory} 0%,${C.parch} 100%)`,
                border:`1.5px solid rgba(184,138,59,0.28)`,
                boxShadow:'0 4px 14px rgba(36,29,22,0.09), inset 0 1px 0 rgba(255,255,255,0.55)',
                padding:'14px 10px 14px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:7 }}>
              <PageRules rows={10} color="rgba(36,29,22,0.06)"/>
              <div style={{ position:'absolute', inset:3, borderRadius:11, border:`1px solid rgba(184,138,59,0.12)`, pointerEvents:'none' }}/>
              <div style={{ position:'relative', zIndex:2, width:30, height:30, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.cover},${C.coverLt})`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:MONO, fontWeight:700, fontSize:13, color:C.goldLt }}>{s.num}</span>
              </div>
              <span className="material-symbols-outlined" style={{ position:'relative', zIndex:2, fontSize:22, color:C.navy, ...FILL1 }}>{s.icon}</span>
              <p style={{ position:'relative', zIndex:2, fontFamily:SERIF, fontWeight:700, fontSize:13, color:C.charcoal, lineHeight:1.2 }}>{s.title}</p>
              <p style={{ position:'relative', zIndex:2, fontFamily:SANS, fontSize:10.5, color:C.charMid, lineHeight:1.4 }}>{s.sub}</p>
            </Tap>
          ))}
        </div>

        {/* START HERE — premium action modules */}
        <SH title="Start Here"
          right={<span style={{ fontFamily:MONO, fontSize:10, color:C.charMid, letterSpacing:'0.12em' }}>YOUR NEXT ACTIONS</span>}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:9, marginBottom:24 }}>
          {ACTIONS.map(a => (
            <ActionModule key={a.label}
              seal={<a.Seal size={a.size||54}/>}
              label={a.label} sub={a.sub}
              onClick={()=>{ triggerHaptic('medium'); a.action() }}/>
          ))}
        </div>

        {/* PASSPORT SECTIONS — premium document cards */}
        <SH title="Passport Sections"/>
        <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:24 }}>
          {SECTIONS.map(s => (
            <PremiumPassportCard key={s.title}
              seal={<s.Seal size={64}/>}
              title={s.title} desc={s.desc}
              watermarkEl={s.wm}
              onClick={()=>{ triggerHaptic('medium'); navigate(s.route) }}/>
          ))}
        </div>

        {/* DIGITAL STAMPS — collectible seal archive */}
        <SH title="Achievement Stamps"
          right={
            <button onClick={()=>{ triggerHaptic('light'); navigate('/passport/stamps') }}
              style={{ fontFamily:SANS, fontWeight:600, fontSize:13, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
              View All →
            </button>
          }/>
        <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:24,
          background:`linear-gradient(150deg,${C.ivory} 0%,${C.parch} 50%,${C.sand} 100%)`,
          border:`1.5px solid rgba(184,138,59,0.28)`,
          boxShadow:'0 6px 22px rgba(36,29,22,0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <PageRules rows={16}/>
          {/* margin rule */}
          <div style={{ position:'absolute', left:24, top:0, bottom:0, width:1, background:'rgba(220,0,0,0.12)', pointerEvents:'none', zIndex:2 }}/>
          <div style={{ position:'absolute', inset:5, borderRadius:11, border:`1px solid rgba(184,138,59,0.14)`, pointerEvents:'none', zIndex:3 }}/>
          {/* centre watermark */}
          <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', opacity:0.04, pointerEvents:'none', zIndex:1 }}>
            <Emblem size={240} color={C.goldDk}/>
          </div>
          <div style={{ position:'relative', zIndex:4, padding:'18px 18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <p style={{ fontFamily:SERIF, fontSize:13, color:C.charMid }}>Authentication Record</p>
              <span style={{ fontFamily:MONO, fontSize:10, color:C.gold }}>
                {STAMPS.filter(s=>s.earned).length} / {STAMPS.length} EARNED
              </span>
            </div>
            <div style={{ height:1, background:`linear-gradient(90deg,${C.border},transparent)`, marginBottom:18 }}/>
            {/* Earned stamps row */}
            <p style={{ fontFamily:MONO, fontSize:8.5, color:C.charMid, letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:10 }}>
              Authenticated
            </p>
            <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:12, marginBottom:14 }}>
              {STAMPS.filter(s=>s.earned).map((stamp,i) => (
                <StampSeal key={stamp.id} stamp={{ ...stamp, tilt:(i%2===0?2:-2) }}
                  size={76} paletteIdx={i} onClick={()=>{ triggerHaptic('light'); setSelStamp(stamp) }}/>
              ))}
            </div>
            {/* Locked stamps */}
            {STAMPS.filter(s=>!s.earned).length > 0 && (
              <>
                <div style={{ height:1, background:C.charLine, margin:'6px 0 12px' }}/>
                <p style={{ fontFamily:MONO, fontSize:8.5, color:C.charMid, letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:10 }}>
                  Locked
                </p>
                <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:12, marginBottom:14 }}>
                  {STAMPS.filter(s=>!s.earned).map((stamp,i) => (
                    <StampSeal key={stamp.id} stamp={{ ...stamp, tilt:(i%2===0?-1.5:1.5) }}
                      size={64} paletteIdx={i+2} onClick={()=>{ triggerHaptic('light'); setSelStamp(stamp) }}/>
                  ))}
                </div>
              </>
            )}
            <div style={{ borderTop:`1px solid ${C.charLine}`, paddingTop:12 }}>
              <GBtn full outline onClick={()=>{ triggerHaptic('light'); navigate('/passport/stamps') }}>
                View My Stamp Collection
              </GBtn>
            </div>
          </div>
        </div>

        {/* EVENTS + ACTIVITY side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>

          {/* Upcoming Events */}
          <div>
            <SH title="Upcoming Events"
              right={
                <button onClick={()=>{ triggerHaptic('light'); navigate('/passport/events') }}
                  style={{ fontFamily:SANS, fontWeight:600, fontSize:12, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>
                  See All →
                </button>
              }/>
            <div style={{ position:'relative', borderRadius:14, overflow:'hidden',
              background:`linear-gradient(150deg,${C.ivory},${C.parch})`,
              border:`1.5px solid rgba(184,138,59,0.25)`,
              boxShadow:'0 4px 14px rgba(36,29,22,0.08), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              <PageRules rows={14}/>
              <div style={{ position:'absolute', inset:4, borderRadius:10, border:`1px solid rgba(184,138,59,0.12)`, pointerEvents:'none', zIndex:2 }}/>
              <div style={{ position:'relative', zIndex:3, padding:'12px 12px' }}>
                {events.map((ev,i) => (
                  <Tap key={ev.id} onClick={()=>{ triggerHaptic('light'); setSelEvent(ev) }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0',
                      borderBottom:i<events.length-1?`1px solid ${C.charLine}`:'none' }}>
                    <div style={{ minWidth:38, textAlign:'center', background:C.cover,
                      borderRadius:8, padding:'4px 6px', flexShrink:0 }}>
                      <p style={{ fontFamily:MONO, fontSize:7, color:`rgba(212,168,90,0.5)` }}>{ev.date?.split(' ')[0]?.toUpperCase()}</p>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:18, color:C.goldLt, lineHeight:1 }}>{ev.date?.split(' ')[1]}</p>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:12, color:C.charcoal, lineHeight:1.2 }}>{ev.name}</p>
                      <p style={{ fontFamily:SANS, fontSize:10, color:C.charMid }}>{ev.venue}</p>
                    </div>
                    {(rsvpdIds.has(ev.id)||ev.rsvpd)
                      ? <span style={{ fontFamily:MONO, fontSize:9, color:C.forest, fontWeight:700 }}>RSVP'd</span>
                      : <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                          <path d="M6 3L11 8L6 13" stroke={`${C.gold}90`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                  </Tap>
                ))}
                <button onClick={async()=>{
                  triggerHaptic('success')
                  await Promise.all(events.map(e=>rsvpToEvent(e.id)))
                  setRsvpdIds(new Set(events.map(e=>e.id)))
                  showToast('RSVP confirmed for all events.')
                }} style={{ width:'100%', marginTop:10, padding:'8px', borderRadius:9,
                  border:`1.5px solid ${C.navy}30`, background:`${C.navy}07`,
                  fontFamily:MONO, fontWeight:700, fontSize:9.5, color:C.navy, cursor:'pointer',
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  RSVP TO ALL EVENTS
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <SH title="Recent Activity"/>
            <div style={{ position:'relative', borderRadius:14, overflow:'hidden',
              background:`linear-gradient(150deg,${C.ivory},${C.parch})`,
              border:`1.5px solid rgba(184,138,59,0.25)`,
              boxShadow:'0 4px 14px rgba(36,29,22,0.08), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              <PageRules rows={14}/>
              {/* red margin rule */}
              <div style={{ position:'absolute', left:26, top:0, bottom:0, width:1, background:'rgba(200,0,0,0.1)', pointerEvents:'none', zIndex:2 }}/>
              <div style={{ position:'absolute', inset:4, borderRadius:10, border:`1px solid rgba(184,138,59,0.12)`, pointerEvents:'none', zIndex:3 }}/>
              <div style={{ position:'relative', zIndex:4, padding:'12px 12px 12px 32px' }}>
                {RECENT_ACTIVITY.map((a,i) => (
                  <Tap key={a.id} onClick={()=>triggerHaptic('light')}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                      borderBottom:i<RECENT_ACTIVITY.length-1?`1px solid ${C.charLine}`:'none' }}>
                    <div style={{ width:27, height:27, borderRadius:'50%', background:`${C.navy}10`,
                      border:`1.5px solid ${C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:13, color:C.goldDk, ...FILL1 }}>{a.icon}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SERIF, fontWeight:700, fontSize:11.5, color:C.charcoal }}>{a.label}</p>
                      <p style={{ fontFamily:SANS, fontSize:9.5, color:C.charMid, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.detail}</p>
                    </div>
                    <span style={{ fontFamily:MONO, fontSize:9, color:C.charMid, flexShrink:0 }}>{a.time}</span>
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
            boxShadow:'0 6px 22px rgba(17,43,69,0.2)', overflow:'hidden', position:'relative' }}>
            <Grain op={0.06}/>
            <div style={{ position:'absolute', right:-18, top:'50%', transform:'translateY(-50%)', opacity:0.08 }}>
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
                <div style={{ height:4, borderRadius:2, background:`${C.gold}18`, marginTop:6 }}>
                  <div style={{ width:`${xpPct}%`, height:'100%', borderRadius:2,
                    background:`linear-gradient(90deg,${C.goldDk},${C.goldLt})` }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <GBtn sm style={{ background:`${C.gold}16`, border:`1px solid ${C.gold}45`, color:C.goldLt }}
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

        <p style={{ fontFamily:MONO, fontSize:8, color:`${C.charMid}55`, textAlign:'center',
          letterSpacing:'0.2em', marginBottom:6 }}>
          PROFOUND INNOVATIONS LLC · 360 PASSPORT CONNECTIONS
        </p>

      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
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
