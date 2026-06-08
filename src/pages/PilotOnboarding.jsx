/**
 * PilotOnboarding — Phase 13
 * Admin+ form to register a pilot partner venue.
 * No payment processing. Pricing is placeholder only.
 * Route: /pilot-onboarding  Protected: admin+
 */

import { useState }        from 'react'
import { useNavigate }     from 'react-router-dom'
import PrototypeDisclosure from '../components/demo/PrototypeDisclosure.jsx'
import { PILOT_TIERS, PILOT_REQUIREMENTS, DEMO_MODULES } from '../config/demoModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
      width: '100%', boxSizing: 'border-box',
      background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
      color: GOLD, padding: '0.65rem 0.875rem', borderRadius: '7px',
      fontFamily: 'Georgia, serif', fontSize: '0.82rem',
    }} />
  )
}

export default function PilotOnboarding() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    venueName: '', contactName: '', contactEmail: '', contactPhone: '',
    city: '', state: '', pilotTier: 'single_tablet',
    posProvider: '', wifiAvail: false, staffCount: '', managerName: '',
    selectedModules: ['SmokeCraft 360', '360 Passport Connection'],
    notes: '', complianceAck: false,
  })
  const [checklist,   setChecklist]   = useState({})
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(null)
  const [error,       setError]       = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleModule(m) {
    setForm(f => ({
      ...f,
      selectedModules: f.selectedModules.includes(m)
        ? f.selectedModules.filter(x => x !== m)
        : [...f.selectedModules, m],
    }))
  }

  function toggleCheck(k) { setChecklist(c => ({ ...c, [k]: !c[k] })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.venueName.trim()) { setError('Venue name is required.'); return }
    if (!form.complianceAck)   { setError('Please acknowledge the compliance reminder.'); return }
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/pilot/partners', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName:    form.venueName,
          contactName:  form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          city:         form.city,
          state:        form.state,
          pilotTier:    form.pilotTier,
          notes: {
            posProvider:      form.posProvider,
            wifiAvail:        form.wifiAvail,
            staffCount:       form.staffCount,
            managerName:      form.managerName,
            selectedModules:  form.selectedModules,
            notes:            form.notes,
            checklistState:   checklist,
          },
        }),
      })
      const d = await r.json()
      if (d.success) setSaved(d.data)
      else setError(d.message || 'Submission failed')
    } catch { setError('Network error — please try again') }
    finally { setSaving(false) }
  }

  if (saved) return (
    <div style={{ minHeight:'100vh', background:DARK, color:GOLD, fontFamily:'Georgia,serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ maxWidth:'500px', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>✓</div>
        <div style={{ fontSize:'0.55rem', letterSpacing:'0.3em', color:`${GOLD}44`, textTransform:'uppercase', marginBottom:'0.5rem' }}>Pilot Partner Registered</div>
        <div style={{ fontSize:'1.1rem', marginBottom:'1rem', letterSpacing:'0.04em' }}>{saved.venue_name}</div>
        <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:`${GOLD}55`, marginBottom:'1.5rem' }}>{saved.partner_id}</div>
        <div style={{ fontSize:'0.78rem', color:`${GOLD}88`, lineHeight:1.7, marginBottom:'2rem' }}>
          Venue has been added to the pilot partner list. The NOVEE OS team will follow up to confirm pilot terms and schedule the setup session.
        </div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/system-overview')} style={{ background:'transparent', border:`1px solid ${GOLD}22`, color:`${GOLD}66`, padding:'0.75rem 1.25rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', minHeight:'48px' }}>System Overview</button>
          <button onClick={()=>navigate('/')} style={{ background:GOLD, color:DARK, border:'none', padding:'0.75rem 1.25rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', fontWeight:600, minHeight:'48px' }}>Return Home</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:DARK, color:GOLD, fontFamily:'Georgia,serif', padding:'clamp(1.5rem,4vw,2.5rem)' }}>
      <div style={{ maxWidth:'680px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <button onClick={()=>navigate(-1)} style={{background:'transparent',border:'none',color:`${GOLD}55`,fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',padding:0,marginBottom:'0.75rem',textTransform:'uppercase'}}>← Back</button>
          <div style={{fontSize:'0.55rem',letterSpacing:'0.3em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'0.3rem'}}>NOVEE OS · Pilot Partner Onboarding</div>
          <h1 style={{margin:0,fontSize:'clamp(1.3rem,3vw,1.8rem)',fontWeight:400,letterSpacing:'0.04em'}}>Venue Pilot Registration</h1>
          <div style={{marginTop:'0.875rem'}}><PrototypeDisclosure compact /></div>
        </div>

        <form onSubmit={submit}>
          {/* Venue info */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Venue Information</div>
            <Field label="Venue Name *"><Input value={form.venueName} onChange={e=>set('venueName',e.target.value)} placeholder="e.g. The Grand Lounge" /></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <Field label="City"><Input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="City" /></Field>
              <Field label="State"><Input value={form.state} onChange={e=>set('state',e.target.value)} placeholder="State" /></Field>
            </div>
            <Field label="Current POS Provider"><Input value={form.posProvider} onChange={e=>set('posProvider',e.target.value)} placeholder="e.g. Toast, Square, Lightspeed, Other" /></Field>
            <Field label="Approx. Staff Count"><Input value={form.staffCount} onChange={e=>set('staffCount',e.target.value)} placeholder="e.g. 8" /></Field>
            <label style={{display:'flex',alignItems:'center',gap:'0.75rem',cursor:'pointer',fontSize:'0.78rem',color:`${GOLD}77`}}>
              <input type="checkbox" checked={form.wifiAvail} onChange={e=>set('wifiAvail',e.target.checked)} style={{width:'16px',height:'16px'}}/>
              Stable Wi-Fi available on premises
            </label>
          </div>

          {/* Contact */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Contact Information</div>
            <Field label="Contact Name"><Input value={form.contactName} onChange={e=>set('contactName',e.target.value)} placeholder="Name" /></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <Field label="Email"><Input value={form.contactEmail} onChange={e=>set('contactEmail',e.target.value)} placeholder="email@venue.com" type="email" /></Field>
              <Field label="Phone"><Input value={form.contactPhone} onChange={e=>set('contactPhone',e.target.value)} placeholder="+1 (555) 000-0000" /></Field>
            </div>
            <Field label="Manager Name (for E.A.T. walkthrough)"><Input value={form.managerName} onChange={e=>set('managerName',e.target.value)} placeholder="Manager name" /></Field>
          </div>

          {/* Pilot tier */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Pilot Tier</div>
            <div style={{marginBottom:'0.5rem',fontSize:'0.68rem',color:`${GOLD}44`}}>Pricing for all tiers is placeholder — contact the NOVEE OS team for commercial terms.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {PILOT_TIERS.map(t=>(
                <label key={t.value} style={{display:'flex',alignItems:'flex-start',gap:'0.875rem',padding:'0.875rem',borderRadius:'7px',cursor:'pointer',border:`1px solid ${form.pilotTier===t.value?GOLD:`${GOLD}18`}`,background:form.pilotTier===t.value?`${GOLD}08`:'transparent'}}>
                  <input type="radio" name="pilotTier" value={t.value} checked={form.pilotTier===t.value} onChange={()=>set('pilotTier',t.value)} style={{marginTop:'0.15rem',flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:'0.8rem',color:GOLD,marginBottom:'0.2rem'}}>{t.label}</div>
                    <div style={{fontSize:'0.72rem',color:`${GOLD}66`,lineHeight:1.5}}>{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Module selection */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Modules Requested</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {DEMO_MODULES.map(m=>(
                <button key={m.key} type="button" onClick={()=>toggleModule(m.label)} style={{
                  padding:'0.45rem 0.9rem', borderRadius:'5px', fontSize:'0.7rem', cursor:'pointer',
                  fontFamily:'Georgia,serif', minHeight:'36px', border:'none',
                  background: form.selectedModules.includes(m.label) ? `${m.color}18` : 'rgba(201,168,76,0.04)',
                  color: form.selectedModules.includes(m.label) ? m.color : `${GOLD}55`,
                  outline: form.selectedModules.includes(m.label) ? `1px solid ${m.color}44` : 'none',
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* Readiness checklist */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Pilot Readiness Checklist</div>
            {PILOT_REQUIREMENTS.map(r=>(
              <label key={r.key} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.5rem 0',borderBottom:SEP,cursor:'pointer'}}>
                <input type="checkbox" checked={!!checklist[r.key]} onChange={()=>toggleCheck(r.key)} style={{width:'16px',height:'16px',flexShrink:0}}/>
                <span style={{fontSize:'0.78rem',color:checklist[r.key]?`${GOLD}66`:GOLD,textDecoration:checklist[r.key]?'line-through':'none'}}>{r.label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div style={{ background:CARD, border:`1px solid ${GOLD}18`, borderRadius:'10px', padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'1rem'}}>Additional Notes</div>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any specific requirements, timeline expectations, or questions for the NOVEE OS team…" rows={4} style={{ width:'100%',boxSizing:'border-box',resize:'vertical',background:'rgba(201,168,76,0.04)',border:`1px solid ${GOLD}22`,color:GOLD,padding:'0.65rem 0.875rem',borderRadius:'7px',fontFamily:'Georgia,serif',fontSize:'0.82rem',lineHeight:1.55 }}/>
          </div>

          {/* Compliance */}
          <div style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.25rem' }}>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',color:'rgba(251,191,36,0.55)',textTransform:'uppercase',marginBottom:'0.75rem'}}>Compliance Reminder</div>
            <p style={{margin:'0 0 0.875rem',fontSize:'0.78rem',color:'rgba(251,191,36,0.8)',lineHeight:1.7}}>
              NOVEE OS is a prototype system providing tasting guidance and education content only. No live payments are processed. Venues must comply with all applicable local tobacco and alcohol laws. Staff controls all actual service decisions. NOVEE OS does not provide legal or health advice.
            </p>
            <label style={{display:'flex',alignItems:'center',gap:'0.75rem',cursor:'pointer'}}>
              <input type="checkbox" checked={form.complianceAck} onChange={e=>set('complianceAck',e.target.checked)} style={{width:'16px',height:'16px'}}/>
              <span style={{fontSize:'0.78rem',color:'rgba(251,191,36,0.7)'}}>I acknowledge the above compliance requirements.</span>
            </label>
          </div>

          {error && <div style={{marginBottom:'0.875rem',padding:'0.75rem',background:'rgba(248,113,113,0.08)',borderRadius:'6px',fontSize:'0.75rem',color:'#f87171'}}>{error}</div>}

          <button type="submit" disabled={saving} style={{
            width:'100%', padding:'0.875rem', borderRadius:'7px', border:'none',
            background: saving ? `${GOLD}22` : GOLD, color: saving ? `${GOLD}44` : DARK,
            fontFamily:'Georgia,serif', fontSize:'0.82rem', letterSpacing:'0.15em',
            textTransform:'uppercase', fontWeight:600, cursor: saving?'default':'pointer', minHeight:'52px',
          }}>
            {saving ? 'Submitting…' : 'Submit Pilot Registration'}
          </button>

          <div style={{marginTop:'0.75rem',textAlign:'center',fontSize:'0.68rem',color:`${GOLD}44`}}>
            No payment is collected at this stage. The NOVEE OS team will follow up to confirm pilot terms.
          </div>
        </form>

        <div style={{ marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:SEP }}>
          <button onClick={()=>navigate('/')} style={{background:'transparent',border:`1px solid ${GOLD}22`,color:`${GOLD}66`,padding:'0.75rem 1.5rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',minHeight:'48px'}}>Return Home</button>
        </div>
      </div>
    </div>
  )
}
