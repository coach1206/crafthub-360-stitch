/**
 * FounderDemo — Phase 13
 * Founder-only demo launch pad with audience selector, talking points,
 * module jump buttons, and pilot readiness dashboard.
 * Route: /founder-demo  Protected: founder_level_0
 */

import { useState, useEffect } from 'react'
import { useNavigate }          from 'react-router-dom'
import PrototypeDisclosure      from '../components/demo/PrototypeDisclosure.jsx'
import PilotReadinessDashboard  from '../components/demo/PilotReadinessDashboard.jsx'
import { DEMO_TYPES, AUDIENCE_TYPES, DEMO_MODULES, DEMO_SECTIONS, PROTOTYPE_DISCLOSURE_TEXT } from '../config/demoModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

function Section({ title, children, accent }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${accent||GOLD}18`, borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${accent||GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>{title}</div>
      {children}
    </div>
  )
}

function Btn({ children, onClick, color = GOLD, small = false, disabled = false, fullWidth = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '0.5rem 0.875rem' : '0.875rem 1.5rem',
      borderRadius: '6px', border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: disabled ? `${color}18` : color === GOLD ? GOLD : color,
      color: disabled ? `${color}44` : color === GOLD ? DARK : '#fff',
      fontFamily: 'Georgia, serif', fontSize: small ? '0.7rem' : '0.78rem',
      letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
      minHeight: small ? '36px' : '48px', width: fullWidth ? '100%' : 'auto',
    }}>{children}</button>
  )
}

const TALKING_POINTS = {
  what: [
    'NOVEE OS is a guest intelligence platform for premium hospitality venues.',
    'It connects the guest experience — what they taste, learn, and feel — to the operational layer of the venue.',
    'Unlike a POS or a loyalty app, NOVEE OS creates a relationship between the guest and the venue through education and engagement.',
  ],
  guest: [
    'Guests approach a dedicated tablet or kiosk.',
    'They enter a craft experience — SmokeCraft, PourCraft, BeerCraft, WineCraft.',
    'The experience is guided, branded, and premium — not a gamified quiz.',
    'At the end, they receive a Passport stamp and are added to the leaderboard.',
  ],
  smokecraft: [
    'SmokeCraft is the flagship module — a premium cigar education journey.',
    'Guests choose a mentor, learn about origins, leaves, blending, flavor, and pairing.',
    'A mentor voice guides them — ElevenLabs AI or Web Speech fallback.',
    'The session generates a flavor profile used by POS 3 for staff recommendations.',
  ],
  passport: [
    'The 360 Passport captures the guest relationship across visits.',
    'Stamps, streaks, and leaderboard rankings create return behavior.',
    'This is the data layer — it turns a one-time guest into a known relationship.',
    'No personal data is required from the guest to earn stamps.',
  ],
  pos3: [
    'POS 3 connects the guest session data to the staff-facing order system.',
    'Staff see active orders, table status, and pairing recommendations based on what the guest just experienced.',
    'This closes the loop between engagement and transaction.',
  ],
  eat: [
    'E.A.T. Command is the manager intelligence layer.',
    'Environment: ambient data, table occupancy, session activity.',
    'Asset: which products, blends, and mentors are driving engagement.',
    'Transaction: does SmokeCraft session completion correlate to POS 3 orders?',
  ],
  kiosk: [
    'NOVEE OS is designed for tablet and kiosk deployment.',
    'Kiosk mode locks routes, prevents accidental navigation, and supports staff unlock.',
    'Landscape orientation, PWA install, offline fallback.',
    'Boot hardening — if the boot screen hangs, a Continue button appears automatically.',
  ],
  testing: [
    'Phase 12 built a complete venue testing system.',
    'Observer notes, issue logging, participant session tracking.',
    'Readiness score 0–100 calculated from issues, completion rate, and test coverage.',
    'A score of 75+ is required before advancing to a live pilot.',
  ],
  ask: [
    'We are looking for [X] pilot venue partners.',
    'Pilot tiers from single-tablet demo through full venue intelligence.',
    'What we need: a table, a device, 30 minutes with your staff.',
    'What you get: real guest engagement data from day one.',
  ],
}

export default function FounderDemo() {
  const navigate = useNavigate()

  const [demoType,    setDemoType]    = useState('founder_walkthrough')
  const [audience,    setAudience]    = useState('founder_only')
  const [venueName,   setVenueName]   = useState('')
  const [presenter,   setPresenter]   = useState('')
  const [activeDemo,  setActiveDemo]  = useState(null)
  const [showDiscl,   setShowDiscl]   = useState(false)
  const [activeSection, setActiveSection] = useState('what')
  const [tab,         setTab]         = useState('launch')
  const [busy,        setBusy]        = useState(null)
  const [resetMsg,    setResetMsg]    = useState(null)

  useEffect(() => {
    fetch('/api/demo/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success && d.data.activeDemo) setActiveDemo(d.data.activeDemo) })
      .catch(() => {})
  }, [])

  async function startDemo() {
    setBusy('start')
    try {
      const r = await fetch('/api/demo/start', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoType, audienceType: audience, venueName, presenterName: presenter }),
      })
      const d = await r.json()
      if (d.success) setActiveDemo(d.data)
    } finally { setBusy(null) }
  }

  async function endDemo() {
    if (!activeDemo?.demo_id) return
    setBusy('end')
    try {
      await fetch('/api/demo/end', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demoId: activeDemo.demo_id }) })
      setActiveDemo(null)
    } finally { setBusy(null) }
  }

  async function resetDemoData() {
    setBusy('reset')
    setResetMsg(null)
    try {
      const r = await fetch('/api/demo/reset', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demoId: activeDemo?.demo_id, includeVenueTest: false }) })
      const d = await r.json()
      if (d.success) { setActiveDemo(null); setResetMsg('Demo data reset complete.') }
    } finally { setBusy(null) }
  }

  async function trackNav(route, moduleName) {
    if (activeDemo?.demo_id) {
      fetch('/api/demo/event', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId: activeDemo.demo_id, eventType: 'module_jump', screenName: route, moduleName }),
      }).catch(() => {})
    }
    navigate(route)
  }

  const TABS = [
    { key: 'launch',    label: 'Launch' },
    { key: 'talking',   label: 'Talking Points' },
    { key: 'modules',   label: 'Module Jump' },
    { key: 'readiness', label: 'Readiness' },
    { key: 'investor',  label: 'Investor View' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: GOLD, fontFamily: 'Georgia, serif', padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} style={{ background: 'transparent', border: 'none', color: `${GOLD}55`, fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', textTransform: 'uppercase' }}>← Back</button>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '0.3rem' }}>NOVEE OS · Phase 13</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 400, letterSpacing: '0.04em' }}>Founder Demo Panel</h1>
          {activeDemo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: '0.7rem', color: '#4ade80', letterSpacing: '0.12em' }}>Live Demo · {activeDemo.audience_type?.replace(/_/g,' ')} · {activeDemo.demo_type?.replace(/_/g,' ')}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.5rem 0.875rem', borderRadius: '5px', fontSize: '0.7rem', fontFamily: 'Georgia, serif',
              letterSpacing: '0.1em', cursor: 'pointer', minHeight: '36px',
              border: `1px solid ${tab===t.key ? GOLD : `${GOLD}22`}`,
              background: tab===t.key ? `${GOLD}12` : 'transparent',
              color: tab===t.key ? GOLD : `${GOLD}55`,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── LAUNCH ───────────────────────────────────────────────── */}
        {tab === 'launch' && (
          <>
            {!activeDemo ? (
              <Section title="Start Demo Session">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Demo Type</div>
                    <select value={demoType} onChange={e=>setDemoType(e.target.value)} style={{ width:'100%', background:'rgba(201,168,76,0.04)', border:`1px solid ${GOLD}22`, color:GOLD, padding:'0.6rem 0.75rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.8rem' }}>
                      {DEMO_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Audience</div>
                    <select value={audience} onChange={e=>setAudience(e.target.value)} style={{ width:'100%', background:'rgba(201,168,76,0.04)', border:`1px solid ${GOLD}22`, color:GOLD, padding:'0.6rem 0.75rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.8rem' }}>
                      {AUDIENCE_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Venue / Location</div>
                    <input value={venueName} onChange={e=>setVenueName(e.target.value)} placeholder="e.g. SmokeCraft Lounge" style={{ width:'100%', boxSizing:'border-box', background:'rgba(201,168,76,0.04)', border:`1px solid ${GOLD}22`, color:GOLD, padding:'0.6rem 0.75rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.8rem' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Presenter</div>
                    <input value={presenter} onChange={e=>setPresenter(e.target.value)} placeholder="Your name" style={{ width:'100%', boxSizing:'border-box', background:'rgba(201,168,76,0.04)', border:`1px solid ${GOLD}22`, color:GOLD, padding:'0.6rem 0.75rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.8rem' }}/>
                  </div>
                </div>
                <Btn onClick={startDemo} color="#4ade80" fullWidth disabled={busy==='start'}>
                  {busy==='start' ? 'Starting…' : 'Start Demo Session'}
                </Btn>
              </Section>
            ) : (
              <Section title="Active Demo" accent="#4ade80">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1.25rem', fontSize:'0.8rem' }}>
                  {[['Type', activeDemo.demo_type?.replace(/_/g,' ')],['Audience', activeDemo.audience_type?.replace(/_/g,' ')],['Venue', activeDemo.venue_name || '—'],['Presenter', activeDemo.presenter_name || '—']].map(([k,v])=>(
                    <div key={k}><div style={{fontSize:'0.6rem',color:`${GOLD}44`,letterSpacing:'0.12em',marginBottom:'0.15rem'}}>{k}</div><div style={{color:GOLD}}>{v}</div></div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  <Btn onClick={endDemo} color="#f87171" small disabled={busy==='end'}>{busy==='end'?'Ending…':'End Demo'}</Btn>
                  <Btn onClick={resetDemoData} color="#f97316" small disabled={busy==='reset'}>{busy==='reset'?'Resetting…':'Reset Demo Data'}</Btn>
                </div>
                {resetMsg && <div style={{marginTop:'0.6rem',fontSize:'0.72rem',color:'#4ade80'}}>{resetMsg}</div>}
              </Section>
            )}

            <Section title="5-Minute Demo Sections">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0.5rem' }}>
                {DEMO_SECTIONS.map(s=>(
                  <div key={s.id} style={{ padding:'0.875rem', background:'rgba(201,168,76,0.04)', borderRadius:'7px', border:`1px solid ${GOLD}15`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.78rem', color:GOLD }}>{s.label}</span>
                    <span style={{ fontSize:'0.65rem', color:`${GOLD}44`, fontFamily:'monospace' }}>{s.duration}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Disclosure">
              <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', marginBottom:'0.75rem' }}>
                <input type="checkbox" checked={showDiscl} onChange={e=>setShowDiscl(e.target.checked)} style={{width:'16px',height:'16px'}}/>
                <span style={{ fontSize:'0.78rem', color:`${GOLD}77` }}>Show prototype disclosure</span>
              </label>
              {showDiscl && <PrototypeDisclosure />}
            </Section>
          </>
        )}

        {/* ── TALKING POINTS ───────────────────────────────────────── */}
        {tab === 'talking' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem' }}>
            <div>
              {Object.keys(TALKING_POINTS).map(key=>(
                <button key={key} onClick={()=>setActiveSection(key)} style={{
                  display:'block', width:'100%', textAlign:'left', padding:'0.6rem 0.875rem', borderRadius:'6px', marginBottom:'0.35rem',
                  border:`1px solid ${activeSection===key?GOLD:`${GOLD}18`}`,
                  background: activeSection===key ? `${GOLD}10` : 'transparent',
                  color: activeSection===key ? GOLD : `${GOLD}55`,
                  fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.1em', cursor:'pointer',
                  textTransform:'capitalize', minHeight:'40px',
                }}>
                  {key === 'what' ? 'What It Is' : key === 'ask' ? 'The Ask' : key.replace(/_/g,' ')}
                </button>
              ))}
            </div>
            <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem' }}>
              <div style={{ fontSize:'0.55rem', letterSpacing:'0.25em', color:`${GOLD}44`, textTransform:'uppercase', marginBottom:'1rem' }}>Talking Points</div>
              <ul style={{ margin:0, padding:'0 0 0 1.2rem' }}>
                {(TALKING_POINTS[activeSection]||[]).map((pt,i)=>(
                  <li key={i} style={{ fontSize:'0.82rem', color:`${GOLD}cc`, lineHeight:1.7, marginBottom:'0.3rem' }}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── MODULE JUMP ──────────────────────────────────────────── */}
        {tab === 'modules' && (
          <Section title="Module Jump Buttons">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.75rem' }}>
              {DEMO_MODULES.map(m=>(
                <button key={m.key} onClick={()=>trackNav(m.route, m.label)} style={{
                  padding:'1rem 1.25rem', borderRadius:'8px', border:`1px solid ${m.color}33`,
                  background:`${m.color}0c`, color:m.color, fontFamily:'Georgia,serif', fontSize:'0.78rem',
                  letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', minHeight:'56px', textAlign:'left',
                }}>
                  <div style={{ marginBottom:'0.2rem' }}>{m.label}</div>
                  <div style={{ fontSize:'0.6rem', color:`${m.color}66`, fontFamily:'monospace' }}>{m.route}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              <Btn onClick={()=>navigate('/')} small>Home</Btn>
              <Btn onClick={()=>navigate('/boot')} small>Boot Screen</Btn>
              <Btn onClick={()=>navigate('/system-overview')} small>System Overview</Btn>
            </div>
          </Section>
        )}

        {/* ── READINESS ────────────────────────────────────────────── */}
        {tab === 'readiness' && (
          <Section title="Pilot Readiness (Phase 12 Data)">
            <PilotReadinessDashboard />
          </Section>
        )}

        {/* ── INVESTOR ─────────────────────────────────────────────── */}
        {tab === 'investor' && (
          <>
            <Section title="Investor Value Highlights" accent="#a3e635">
              {[
                ['Guest Engagement Layer', 'NOVEE OS turns a passive venue visit into an active, data-generating experience.'],
                ['Passport = Relationship Data', 'Unlike a loyalty punch card, the Passport captures behavioral intelligence — what guests taste, choose, and return for.'],
                ['Staff Intelligence Close', 'POS 3 + E.A.T. connect guest engagement to transaction — measurable venue ROI.'],
                ['Platform Extensibility', 'SmokeCraft is the first module. PourCraft, BeerCraft, WineCraft expand the addressable market.'],
                ['SaaS Recurring Revenue', 'Venue subscription per module tier (pricing placeholder — contact for terms).'],
                ['Hardware Independence', 'Works on any modern iPad or Android tablet. No proprietary hardware lock-in.'],
              ].map(([t,d])=>(
                <div key={t} style={{ padding:'0.75rem 0', borderBottom:SEP }}>
                  <div style={{ fontSize:'0.78rem', color:GOLD, marginBottom:'0.25rem' }}>{t}</div>
                  <div style={{ fontSize:'0.73rem', color:`${GOLD}88`, lineHeight:1.6 }}>{d}</div>
                </div>
              ))}
            </Section>
            <Section title="Venue Value Highlights" accent="#60a5fa">
              {[
                ['Guest Return Behavior', 'Leaderboard and Passport stamps drive repeat visits without discounts or gimmicks.'],
                ['Staff Efficiency', 'POS 3 gives staff recommendation context without requiring product knowledge training.'],
                ['Manager Clarity', 'E.A.T. Command shows which products are driving engagement and which tables are underperforming.'],
                ['Zero Hardware Cost', 'Venue uses their own tablet. NOVEE OS installs as a PWA — no app store required.'],
              ].map(([t,d])=>(
                <div key={t} style={{ padding:'0.75rem 0', borderBottom:SEP }}>
                  <div style={{ fontSize:'0.78rem', color:'#60a5fa', marginBottom:'0.25rem' }}>{t}</div>
                  <div style={{ fontSize:'0.73rem', color:`${GOLD}88`, lineHeight:1.6 }}>{d}</div>
                </div>
              ))}
            </Section>
            <PrototypeDisclosure />
          </>
        )}

        {/* Back home */}
        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:SEP, display:'flex', gap:'0.5rem' }}>
          <Btn onClick={()=>navigate('/')} small>Return Home</Btn>
          <Btn onClick={()=>navigate('/investor-demo')} small color="#a3e635">Investor Demo →</Btn>
        </div>
      </div>
    </div>
  )
}
