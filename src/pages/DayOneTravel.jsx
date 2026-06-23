import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { craftImages } from '../lib/craftImages.js'
import TicketTicker from '../components/common/TicketTicker.jsx'
import { getTrips, submitConciergeRequest, getUserStamps, claimStamp } from '../api/travelApi.js'
import { createPassportId } from '../services/passportService.js'

const NAVY = '#0B1B33', NAVY2 = '#142A4D', NAVY3 = '#1E3A66'
const G = '#C9A84C', GL = '#E8D5A3', GD = '#8A7030'
const IVORY = '#F5F1E6', IVORY_DIM = '#E4DCC4'
const TEXT = '#F5E8C8', TEXTM = '#C3CBDB', TEXTD = '#7A8AA8'
const CARD = 'rgba(255,255,255,0.045)'
const BORDER = 'rgba(201,168,76,0.22)'
const hapTap = () => navigator.vibrate?.(25)

const TRIP_IMAGES = {
  dr: craftImages.fallbacks.cigar,
  co: craftImages.fallbacks.lounge,
  atl: craftImages.fallbacks.whiskey,
}

const SERVICES = [
  { id: 'pickup',   label: 'Airport Pickup',        icon: 'local_taxi',     wired: false, reason: 'Booking gateway not connected' },
  { id: 'housing',  label: 'Housing Support',        icon: 'apartment',     wired: false, reason: 'Concierge workflow not connected yet' },
  { id: 'driver',   label: 'Private Driver',         icon: 'directions_car',wired: false, reason: 'Booking gateway not connected' },
  { id: 'sim',      label: 'SIM & Phone Setup',      icon: 'sim_card',      wired: false, reason: 'Vendor system not connected' },
  { id: 'bank',     label: 'Bank Setup Guidance',    icon: 'account_balance',wired: false, reason: 'Concierge workflow not connected yet' },
  { id: 'tour',     label: 'Local Area Tour',        icon: 'tour',          wired: false, reason: 'Booking gateway not connected' },
  { id: 'biz',      label: 'Business Introductions', icon: 'handshake',     wired: false, reason: 'Vendor system not connected' },
  { id: 'vendor',   label: 'Vendor Matchmaking',     icon: 'storefront',    wired: false, reason: 'Vendor system not connected' },
  { id: 'emergency',label: 'Emergency Support',      icon: 'emergency',     wired: false, reason: 'Concierge workflow not connected yet' },
  { id: 'docs',     label: 'Document Checklist',     icon: 'checklist',     wired: false, reason: 'Concierge workflow not connected yet' },
]

const JOURNEY_PHASES = ['Plan', 'Pre-Arrival', 'In-Country', 'Return']

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:NAVY2, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, border:`1px solid ${BORDER}`, borderBottom:'none', padding:'20px 20px 40px', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <span style={{ color:GL, fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:600 }}>{title}</span>
          <button onClick={() => { hapTap(); onClose() }} style={{ width:32, height:32, borderRadius:99, border:`1px solid ${BORDER}`, background:CARD, color:TEXTM, cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.05)', color:TEXT, fontSize:13, marginBottom:10, boxSizing:'border-box' }
const labelStyle = { fontSize:10, color:TEXTD, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, display:'block' }

export default function DayOneTravel() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [modal, setModal] = useState({ trip: null, concierge: false, stamps: false, prefillTripId: null })
  const [form, setForm] = useState({ tripId: '', name: '', contact: '', purpose: '', budget: '', notes: '' })
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' })
  const [stampsState, setStampsState] = useState({ stamps: [], totalXp: 0, loading: false })
  const userId = createPassportId()

  useEffect(() => { getTrips().then(setTrips) }, [])

  function openConcierge(prefillTripId = null) {
    hapTap()
    setForm(f => ({ ...f, tripId: prefillTripId || f.tripId }))
    setSubmitState({ status: 'idle', message: '' })
    setModal(m => ({ ...m, concierge: true, prefillTripId }))
  }

  function openStamps() {
    hapTap()
    setModal(m => ({ ...m, stamps: true }))
    setStampsState(s => ({ ...s, loading: true }))
    getUserStamps(userId).then(data => setStampsState({ stamps: data.stamps || [], totalXp: data.totalXp || 0, loading: false }))
  }

  async function handleSubmitConcierge(e) {
    e.preventDefault()
    if (!form.tripId || !form.name || !form.contact) {
      setSubmitState({ status: 'error', message: 'Destination, name, and contact are required.' })
      return
    }
    setSubmitState({ status: 'submitting', message: '' })
    const notesParts = [form.notes]
    if (form.purpose) notesParts.push(`Purpose: ${form.purpose}`)
    if (form.budget)  notesParts.push(`Budget: ${form.budget}`)
    try {
      const result = await submitConciergeRequest({
        userId, tripId: form.tripId, name: form.name, contact: form.contact,
        notes: notesParts.filter(Boolean).join(' · '),
      })
      setSubmitState({ status: 'success', message: result?.message || 'Request saved locally — concierge team will follow up.' })
    } catch {
      setSubmitState({ status: 'error', message: 'Request could not be sent. Please try again.' })
    }
  }

  async function handleClaimStamp(tripId) {
    hapTap()
    const result = await claimStamp({ userId, tripId })
    if (result?.alreadyClaimed) {
      setStampsState(s => ({ ...s }))
    } else {
      const data = await getUserStamps(userId)
      setStampsState({ stamps: data.stamps || [], totalXp: data.totalXp || 0, loading: false })
    }
  }

  const earnedTripIds = new Set(stampsState.stamps.map(s => s.tripId))

  return (
    <div style={{ background:NAVY, minHeight:'100vh', color:TEXT, fontFamily:'system-ui,sans-serif' }}>

      {/* header */}
      <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(11,27,51,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${BORDER}`, height:56, display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
        <button onClick={() => { hapTap(); navigate(-1) }} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${BORDER}`, background:CARD, color:TEXTM, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20 }}>arrow_back</span>
        </button>
        <div>
          <div style={{ fontSize:9, color:`${G}99`, letterSpacing:'0.2em', textTransform:'uppercase' }}>Brotherhood 360</div>
          <div style={{ fontSize:13, color:GL, fontWeight:600 }}>DayOne360 Concierge</div>
        </div>
      </header>

      <div style={{ marginTop:56 }}>
        <TicketTicker craft="smokecraft" />
      </div>

      {/* hero */}
      <div style={{ position:'relative', height:200, overflow:'hidden' }}>
        <img src={craftImages.fallbacks.lounge} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.35) saturate(1.1)' }} onError={e=>e.target.style.display='none'} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${NAVY} 0%, rgba(11,27,51,0.2) 60%)` }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 20px 24px' }}>
          <div style={{ fontSize:9, color:`${G}99`, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:6 }}>Passport-Connected Travel & Relocation</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'clamp(26px,5vw,36px)', fontWeight:700, margin:0, lineHeight:1.2, color:IVORY }}>
            DayOne360 <span style={{ color:G, fontStyle:'italic' }}>Concierge</span>
          </h1>
          <p style={{ color:TEXTM, fontSize:12, marginTop:6 }}>Travel, relocation, and lifestyle support — connected to your Passport.</p>
        </div>
      </div>

      <main style={{ padding:'20px 16px 120px', maxWidth:680, margin:'0 auto' }}>

        {/* primary actions */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {[
            { label:'Plan Travel',        action:() => { hapTap(); document.getElementById('destinations')?.scrollIntoView({behavior:'smooth'}) } },
            { label:'Request Concierge',  action:() => openConcierge() },
            { label:'View Passport',      action:() => navigate('/passport') },
            { label:'Travel Stamps',      action:openStamps },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{ flex:'1 1 130px', padding:'11px 4px', borderRadius:10, border:`1px solid ${BORDER}`, background:CARD, color:TEXT, cursor:'pointer', fontSize:12, fontWeight:500 }}>{label}</button>
          ))}
        </div>

        {/* journey tracker */}
        <div style={{ marginBottom:28, padding:16, borderRadius:14, border:`1px solid ${BORDER}`, background:CARD }}>
          <div style={{ fontSize:9, color:TEXTD, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:10 }}>Passport Journey Tracker</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {JOURNEY_PHASES.map((phase, i) => (
              <div key={phase} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: i===0 ? `linear-gradient(135deg,${G},#A07830)` : 'rgba(255,255,255,0.06)',
                  border: i===0 ? 'none' : `1px solid ${BORDER}`,
                  color: i===0 ? '#1A1200' : TEXTD, fontSize:13,
                }} className={i!==0 ? 'material-symbols-outlined' : ''}>
                  {i===0 ? (i+1) : 'lock'}
                </div>
                <span style={{ fontSize:10, color: i===0 ? GL : TEXTD, fontWeight: i===0 ? 600 : 400, textAlign:'center' }}>{phase}</span>
              </div>
            ))}
          </div>
          <p style={{ color:TEXTD, fontSize:10.5, marginTop:12, lineHeight:1.5 }}>Demo tracker — phases advance once a real booking workflow is connected. No travel has been marked confirmed.</p>
        </div>

        {/* destinations */}
        <div id="destinations" style={{ marginBottom:28 }}>
          <div style={{ fontSize:9, color:TEXTD, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:12 }}>Destinations</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {trips.map(trip => (
              <div key={trip.id} onClick={() => { hapTap(); setModal(m=>({...m,trip})) }}
                style={{ borderRadius:14, border:`1px solid ${BORDER}`, background:CARD, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:100, position:'relative', overflow:'hidden' }}>
                  <img src={TRIP_IMAGES[trip.id] || craftImages.fallbacks.lounge} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.5) saturate(1.1)' }} onError={e=>e.target.style.display='none'} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${NAVY}CC 0%, transparent 60%)` }} />
                  <div style={{ position:'absolute', bottom:0, left:0, padding:'0 14px 12px' }}>
                    <div style={{ color:IVORY, fontFamily:'"Playfair Display",serif', fontSize:16, fontWeight:600 }}>{trip.name}</div>
                    <div style={{ color:TEXTM, fontSize:11 }}>{trip.subtitle}</div>
                  </div>
                  <span style={{ position:'absolute', top:10, right:10, fontSize:9, color:'#1A1200', background:G, padding:'2px 8px', borderRadius:99, fontWeight:700, textTransform:'uppercase' }}>{trip.status}</span>
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <p style={{ color:TEXTM, fontSize:12, lineHeight:1.6, margin:'0 0 10px' }}>{trip.desc.slice(0,120)}…</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {trip.tags.map(t => (
                        <span key={t} style={{ fontSize:9, color:G, border:`1px solid ${G}44`, background:`${G}12`, padding:'2px 6px', borderRadius:4, letterSpacing:'0.08em' }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ color:G, fontWeight:700, fontSize:12 }}>+{trip.xpReward} XP</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:TEXTD, marginBottom:10 }}>
                    <span>{trip.duration} · {trip.seats} seats</span>
                    <span>{earnedTripIds.has(trip.id) ? 'Stamp earned' : ''}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openConcierge(trip.id) }} style={{ width:'100%', padding:'9px 0', borderRadius:8, border:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.04)', color:GL, fontWeight:600, fontSize:12, cursor:'pointer' }}>Request This Destination</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* service grid */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:9, color:TEXTD, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:12 }}>Concierge Services</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {SERVICES.map(s => (
              <button
                key={s.id}
                disabled={!s.wired}
                title={!s.wired ? s.reason : undefined}
                onClick={s.wired ? () => {} : undefined}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, padding:'14px 12px',
                  borderRadius:12, border:`1px solid ${BORDER}`, background:CARD,
                  cursor: s.wired ? 'pointer' : 'not-allowed', opacity: s.wired ? 1 : 0.5, textAlign:'left',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize:20, color:G }}>{s.icon}</span>
                <span style={{ fontSize:12, color:TEXT, fontWeight:600 }}>{s.label}</span>
                {!s.wired && <span style={{ fontSize:9, color:TEXTD }}>{s.reason}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* vendor network note */}
        <div style={{ padding:14, borderRadius:12, border:`1px solid ${BORDER}`, background:CARD, fontSize:11.5, color:TEXTM, lineHeight:1.6 }}>
          <strong style={{ color:GL }}>Vendor & Partner Network: </strong>
          Direct vendor contacts are not shared from this screen. Submit a concierge request and the DayOne360 team will connect you — vendor matching is not automated yet.
        </div>
      </main>

      {/* bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(11,27,51,0.97)', backdropFilter:'blur(16px)', borderTop:`1px solid ${BORDER}`, padding:'6px 16px 20px', display:'flex', alignItems:'center', justifyContent:'space-around' }}>
        {[{l:'Home',icon:'home',r:'/crafthub'},{l:'Reserve',icon:'diamond',r:'/crafthub'}].map(({l,icon,r})=>(
          <button key={l} onClick={()=>{hapTap();navigate(r)}} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',minWidth:52,padding:'6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, color:TEXTD }}>{icon}</span>
            <span style={{ fontSize:9, color:TEXTD, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
          </button>
        ))}
        <button onClick={()=>{hapTap();openConcierge()}} style={{ width:58,height:58,borderRadius:'50%',background:`linear-gradient(135deg,${G},#A07830)`,border:`2px solid ${GL}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:`0 4px 20px rgba(201,168,76,0.4)`,marginTop:-18 }}>
          <span className="material-symbols-outlined" style={{ fontSize:22, color:'#1A1200', fontVariationSettings:"'FILL' 1" }}>support_agent</span>
          <span style={{ fontSize:7, color:'#1A1200', fontWeight:700, marginTop:1 }}>CONCIERGE</span>
        </button>
        {[{l:'Passport',icon:'book',r:'/passport'},{l:'Profile',icon:'person',r:'/passport/profile'}].map(({l,icon,r})=>(
          <button key={l} onClick={()=>{hapTap();navigate(r)}} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',minWidth:52,padding:'6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, color:TEXTD }}>{icon}</span>
            <span style={{ fontSize:9, color:TEXTD, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
          </button>
        ))}
      </nav>

      {/* destination detail modal */}
      <Modal open={!!modal.trip} onClose={()=>setModal(m=>({...m,trip:null}))} title={modal.trip?.name||''}>
        {modal.trip && <>
          <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>{modal.trip.desc}</p>
          <div style={{ color:TEXTD, fontSize:11, marginBottom:16 }}>Earn <span style={{ color:G, fontWeight:700 }}>+{modal.trip.xpReward} XP</span> upon a claimed stamp · {modal.trip.duration} · {modal.trip.seats} seats</div>
          <button onClick={()=>{hapTap();const id=modal.trip.id;setModal(m=>({...m,trip:null}));openConcierge(id)}} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G},#A07830)`, color:'#1A1200', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            Request This Journey
          </button>
        </>}
      </Modal>

      {/* concierge request form */}
      <Modal open={modal.concierge} onClose={()=>setModal(m=>({...m,concierge:false}))} title="Request Travel Concierge">
        {submitState.status === 'success' ? (
          <>
            <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>{submitState.message}</p>
            <button onClick={()=>{hapTap();setModal(m=>({...m,concierge:false}))}} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G},#A07830)`, color:'#1A1200', fontWeight:700, cursor:'pointer', fontSize:14 }}>Done</button>
          </>
        ) : (
          <form onSubmit={handleSubmitConcierge}>
            <label style={labelStyle}>Destination</label>
            <select value={form.tripId} onChange={e=>setForm(f=>({...f,tripId:e.target.value}))} style={inputStyle}>
              <option value="">Select a destination…</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label style={labelStyle}>Your Name</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="Full name" />
            <label style={labelStyle}>Contact (email or phone)</label>
            <input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={inputStyle} placeholder="you@example.com" />
            <label style={labelStyle}>Travel Purpose</label>
            <select value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))} style={inputStyle}>
              <option value="">Select purpose…</option>
              <option value="Leisure">Leisure</option>
              <option value="Relocation">Relocation</option>
              <option value="Business">Business</option>
            </select>
            <label style={labelStyle}>Budget Range</label>
            <select value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} style={inputStyle}>
              <option value="">Select range…</option>
              <option value="$1,000-$3,000">$1,000–$3,000</option>
              <option value="$3,000-$7,000">$3,000–$7,000</option>
              <option value="$7,000+">$7,000+</option>
            </select>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...inputStyle, minHeight:70, resize:'vertical'}} placeholder="Housing needed? Airport pickup? Anything else the concierge should know." />
            {submitState.status === 'error' && <p style={{ color:'#d97777', fontSize:12, marginBottom:10 }}>{submitState.message}</p>}
            <button type="submit" disabled={submitState.status==='submitting'} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G},#A07830)`, color:'#1A1200', fontWeight:700, cursor:'pointer', fontSize:14, opacity: submitState.status==='submitting' ? 0.6 : 1 }}>
              {submitState.status==='submitting' ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        )}
      </Modal>

      {/* passport travel stamps */}
      <Modal open={modal.stamps} onClose={()=>setModal(m=>({...m,stamps:false}))} title="Travel Stamps">
        <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>
          {stampsState.totalXp > 0 ? `${stampsState.totalXp} XP earned from travel stamps.` : 'No travel stamps earned yet — claim a stamp for any destination below.'}
        </p>
        {trips.map(trip => {
          const earned = earnedTripIds.has(trip.id)
          return (
            <div key={trip.id} style={{ padding:'10px 0', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:TEXT, fontSize:13 }}>{trip.name} Stamp</div>
                <div style={{ color:TEXTD, fontSize:10 }}>{earned ? 'Earned' : 'Not yet awarded'}</div>
              </div>
              {earned ? (
                <span style={{ color:G, fontWeight:700, fontSize:12 }}>+{trip.xpReward} XP</span>
              ) : (
                <button onClick={()=>handleClaimStamp(trip.id)} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.05)', color:GL, fontSize:11, fontWeight:600, cursor:'pointer' }}>Claim Stamp</button>
              )}
            </div>
          )
        })}
      </Modal>
    </div>
  )
}
