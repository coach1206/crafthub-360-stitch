/**
 * SystemOverview — Phase 13
 * Clean internal overview of all NOVEE OS modules. Manager+.
 * No admin controls exposed. Safe to show to venue owners, partners, investors.
 * Route: /system-overview  Protected: manager+
 */

import { useNavigate } from 'react-router-dom'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

const MODULES = [
  {
    name:   'NOVEE OS',
    tag:    'Platform',
    color:  GOLD,
    desc:   'The operating system layer connecting guest experience, staff intelligence, and venue management. Runs on any modern tablet or kiosk. Deploys as a Progressive Web App — no app store required.',
    status: 'production-ready',
    features: ['Multi-role access control', 'PWA / offline mode', 'Kiosk deployment', 'Venue testing system'],
  },
  {
    name:   'CraftHub 360',
    tag:    'Experience Router',
    color:  GOLD,
    desc:   'The central hub that routes guests into craft module experiences. Guests see the modules available at their venue and choose their journey.',
    status: 'production-ready',
    features: ['SmokeCraft', 'PourCraft (coming)', 'BeerCraft (coming)', 'WineCraft (coming)'],
  },
  {
    name:   'SmokeCraft 360',
    tag:    'Guest Experience',
    color:  '#fbbf24',
    desc:   'A premium guided cigar education journey. Guests choose a mentor, learn about origins, leaves, blending, flavor profiling, and pairing. Generates a flavor profile used by POS 3.',
    status: 'production-ready',
    features: ['Mentor selection', 'Voice guidance (ElevenLabs + Web Speech)', 'Flavor DNA profiling', 'Pairing recommendations'],
  },
  {
    name:   '360 Passport Connection',
    tag:    'Relationship Engine',
    color:  '#a3e635',
    desc:   'The guest relationship data layer. Stamps, streaks, leaderboard rankings, and session history create return visit behavior without discounts or generic loyalty schemes.',
    status: 'production-ready',
    features: ['Passport stamps per session', 'Leaderboard with XP ranking', 'Session history', 'Cross-venue Passport (commercial)'],
  },
  {
    name:   'POS 3',
    tag:    'Staff Intelligence',
    color:  '#60a5fa',
    desc:   'The staff-facing companion to the guest journey. Shows active orders, table status, and recommendation previews based on what guests just experienced in SmokeCraft.',
    status: 'prototype',
    features: ['Active order feed', 'Table status', 'Pairing recommendations', 'POS integration (commercial)'],
  },
  {
    name:   'E.A.T. Command',
    tag:    'Management Layer',
    color:  '#c084fc',
    desc:   'Manager intelligence panel — Environment, Asset, Transaction. Real-time venue floor data connecting guest engagement to operational outcomes.',
    status: 'prototype',
    features: ['Environment feed', 'Asset engagement data', 'Transaction correlation', 'Session activity overview'],
  },
  {
    name:   'Mentor Voice',
    tag:    'AI Audio',
    color:  '#fb923c',
    desc:   'Guided voice narration for all SmokeCraft sessions. Uses ElevenLabs AI voice as the primary provider with Web Speech API as a built-in fallback — works offline.',
    status: 'production-ready',
    features: ['ElevenLabs AI voice', 'Web Speech fallback', 'Mute / read mode', 'Per-mentor voice personality'],
  },
  {
    name:   'Kiosk / Tablet Deployment',
    tag:    'Deployment Layer',
    color:  '#f87171',
    desc:   'Production-ready kiosk and tablet deployment system. Route locking, staff unlock, boot hardening, offline fallback, PWA install, and landscape-optimised layout.',
    status: 'production-ready',
    features: ['Kiosk route lock', 'Staff PIN unlock', '8s boot fallback', 'Offline mode', 'PWA / standalone install'],
  },
  {
    name:   'Venue Testing System',
    tag:    'Quality Assurance',
    color:  '#4ade80',
    desc:   'Structured pilot testing framework. Observer notes, issue logging, participant session tracking, readiness score 0–100. Required before any live guest-facing deployment.',
    status: 'production-ready',
    features: ['Observer note capture', 'Issue logging with severity', 'Readiness score 0–100', 'CSV/JSON export'],
  },
]

function StatusBadge({ status }) {
  const col = status === 'production-ready' ? '#4ade80' : '#fbbf24'
  return (
    <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: col, background: `${col}12`, border: `1px solid ${col}33`, borderRadius: '4px', padding: '0.15rem 0.45rem', textTransform: 'uppercase', fontFamily: 'monospace' }}>
      {status === 'production-ready' ? 'Ready' : 'Prototype'}
    </span>
  )
}

export default function SystemOverview() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100vh', background:DARK, color:GOLD, fontFamily:'Georgia,serif', padding:'clamp(1.5rem,4vw,2.5rem)' }}>
      <div style={{ maxWidth:'800px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <button onClick={()=>window.history.length > 1 ? navigate(-1) : navigate('/')} style={{background:'transparent',border:'none',color:`${GOLD}55`,fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',padding:0,marginBottom:'0.75rem',textTransform:'uppercase'}}>← Back</button>
          <div style={{fontSize:'0.55rem',letterSpacing:'0.3em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'0.3rem'}}>NOVEE OS · System Overview</div>
          <h1 style={{margin:0,fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:400,letterSpacing:'0.04em'}}>Platform Modules</h1>
          <p style={{marginTop:'0.75rem',fontSize:'0.82rem',color:`${GOLD}77`,lineHeight:1.7,maxWidth:'560px'}}>
            NOVEE OS is a guest intelligence platform for premium hospitality. The following modules are included in the current build.
          </p>
        </div>

        {/* Module grid */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {MODULES.map(m => (
            <div key={m.name} style={{ background:CARD, border:`1px solid ${m.color}18`, borderRadius:'12px', padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr auto', gap:'0.5rem', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.4rem', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'clamp(0.9rem,2vw,1.05rem)', color:m.color, letterSpacing:'0.04em' }}>{m.name}</span>
                  <span style={{ fontSize:'0.62rem', color:`${m.color}55`, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>{m.tag}</span>
                </div>
                <p style={{ margin:'0 0 0.875rem', fontSize:'0.8rem', color:`${GOLD}aa`, lineHeight:1.7 }}>{m.desc}</p>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                  {m.features.map(f => (
                    <span key={f} style={{ fontSize:'0.63rem', color:`${m.color}66`, background:`${m.color}08`, border:`1px solid ${m.color}18`, borderRadius:'4px', padding:'0.15rem 0.5rem', fontFamily:'monospace' }}>{f}</span>
                  ))}
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ marginTop:'1.5rem', padding:'1.25rem', background:CARD, border:`1px solid ${GOLD}12`, borderRadius:'10px', display:'flex', gap:'1.5rem', flexWrap:'wrap', fontSize:'0.7rem', color:`${GOLD}55` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><span style={{color:'#4ade80',fontFamily:'monospace'}}>Ready</span><span>— full functionality in current build</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><span style={{color:'#fbbf24',fontFamily:'monospace'}}>Prototype</span><span>— simulated data; live integration in commercial version</span></div>
        </div>

        {/* Nav */}
        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:SEP, display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/venue-demo')} style={{background:'transparent',border:`1px solid ${GOLD}22`,color:`${GOLD}66`,padding:'0.75rem 1.25rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',minHeight:'48px'}}>Venue Demo</button>
          <button onClick={()=>navigate('/venue-test')} style={{background:'transparent',border:`1px solid ${GOLD}22`,color:`${GOLD}66`,padding:'0.75rem 1.25rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',minHeight:'48px'}}>Venue Test</button>
          <button onClick={()=>navigate('/')} style={{background:GOLD,color:DARK,border:'none',padding:'0.75rem 1.5rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',fontWeight:600,minHeight:'48px'}}>Return Home</button>
        </div>
      </div>
    </div>
  )
}
