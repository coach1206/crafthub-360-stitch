import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { craftImages } from '../lib/craftImages.js'
import TicketTicker from '../components/common/TicketTicker.jsx'

const G = '#C9A84C', GL = '#E8D5A3', GD = '#8A7030'
const BG = '#0C0A07', SURF = '#181410', CARD = 'rgba(255,255,255,0.045)'
const TEXT = '#F5E8C8', TEXTM = '#C8B89A', TEXTD = '#7A6B55'
const BORDER = 'rgba(201,168,76,0.18)'
const hapTap = () => navigator.vibrate?.(25)

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:SURF, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, border:`1px solid ${BORDER}`, borderBottom:'none', padding:'20px 20px 40px', maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <span style={{ color:GL, fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:600 }}>{title}</span>
          <button onClick={() => { hapTap(); onClose() }} style={{ width:32, height:32, borderRadius:99, border:`1px solid ${BORDER}`, background:CARD, color:TEXTM, cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const TRIPS = [
  {
    id: 'dr', name: 'Dominican Republic', subtitle: 'Cigar Country Experience',
    desc: 'An immersive farm-to-lounge journey through the Cibao Valley — birthplace of the world\'s finest cigars. Private plantation tours, master blender sessions, and reserve tastings.',
    tags: ['Cigars', 'Culture', 'Passport Stamps'], xp: 500, img: craftImages.fallbacks.cigar,
  },
  {
    id: 'co', name: 'Colombia', subtitle: 'Cultural Immersion',
    desc: 'Coffee highlands, artisan culture, and premium tobacco. A Brotherhood journey through Medellín and the coffee-growing regions with exclusive cigar lounge experiences.',
    tags: ['Coffee', 'Cigars', 'Nightlife'], xp: 400, img: craftImages.fallbacks.lounge,
  },
  {
    id: 'atl', name: 'Atlanta Departure', subtitle: 'Local Concierge Experience',
    desc: 'Premium pre-departure concierge from Atlanta. VIP lounge access, curated pairing kits, and Brotherhood 360 passport activation for international members.',
    tags: ['VIP', 'Concierge', 'Departure'], xp: 100, img: craftImages.fallbacks.whiskey,
  },
]

export default function DayOneTravel() {
  const navigate = useNavigate()
  const [modal, setModal] = useState({ trip: null, concierge: false, stamps: false })

  return (
    <div style={{ background:BG, minHeight:'100vh', color:TEXT, fontFamily:'system-ui,sans-serif' }}>

      {/* header */}
      <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(12,10,7,0.92)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${BORDER}`, height:56, display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
        <button onClick={() => { hapTap(); navigate(-1) }} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${BORDER}`, background:CARD, color:TEXTM, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20 }}>arrow_back</span>
        </button>
        <div>
          <div style={{ fontSize:9, color:`${G}88`, letterSpacing:'0.2em', textTransform:'uppercase' }}>Brotherhood 360</div>
          <div style={{ fontSize:13, color:GL, fontWeight:600 }}>DayOne360 Travel</div>
        </div>
      </header>

      <div style={{ marginTop:56 }}>
        <TicketTicker craft="smokecraft" />
      </div>

      {/* hero */}
      <div style={{ position:'relative', height:200, overflow:'hidden' }}>
        <img src={craftImages.fallbacks.lounge} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.4) saturate(1.2)' }} onError={e=>e.target.style.display='none'} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(12,10,7,1) 0%,transparent 60%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 20px 24px' }}>
          <div style={{ fontSize:9, color:`${G}88`, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:6 }}>Passport-Connected Travel</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'clamp(26px,5vw,36px)', fontWeight:700, margin:0, lineHeight:1.2 }}>
            DayOne360 <span style={{ color:G, fontStyle:'italic' }}>Travel</span>
          </h1>
          <p style={{ color:TEXTM, fontSize:12, marginTop:6 }}>Curated travel experiences connected to your Passport.</p>
        </div>
      </div>

      <main style={{ padding:'20px 16px 120px', maxWidth:640, margin:'0 auto' }}>

        {/* CTA buttons */}
        <div style={{ display:'flex', gap:8, marginBottom:28 }}>
          {[
            { label:'Explore Trips',           action:() => { hapTap(); document.getElementById('trips')?.scrollIntoView({behavior:'smooth'}) } },
            { label:'Request Concierge',       action:() => { hapTap(); setModal(m=>({...m,concierge:true})) } },
            { label:'View Travel Stamps',      action:() => { hapTap(); setModal(m=>({...m,stamps:true})) } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{ flex:1, padding:'11px 4px', borderRadius:10, border:`1px solid ${BORDER}`, background:CARD, color:TEXT, cursor:'pointer', fontSize:12, fontWeight:500 }}>{label}</button>
          ))}
        </div>

        {/* trips */}
        <div id="trips">
          <div style={{ fontSize:9, color:TEXTD, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:12 }}>Featured Journeys</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {TRIPS.map(trip => (
              <div key={trip.id} onClick={() => { hapTap(); setModal(m=>({...m,trip})) }}
                style={{ borderRadius:14, border:`1px solid ${BORDER}`, background:CARD, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:100, position:'relative', overflow:'hidden' }}>
                  <img src={trip.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(1.2)' }} onError={e=>e.target.style.display='none'} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(12,10,7,0.7) 0%,transparent 60%)' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, padding:'0 14px 12px' }}>
                    <div style={{ color:TEXT, fontFamily:'"Playfair Display",serif', fontSize:16, fontWeight:600 }}>{trip.name}</div>
                    <div style={{ color:TEXTM, fontSize:11 }}>{trip.subtitle}</div>
                  </div>
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <p style={{ color:TEXTM, fontSize:12, lineHeight:1.6, margin:'0 0 10px' }}>{trip.desc.slice(0,120)}…</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {trip.tags.map(t => (
                        <span key={t} style={{ fontSize:9, color:G, border:`1px solid ${G}44`, background:`${G}12`, padding:'2px 6px', borderRadius:4, letterSpacing:'0.08em' }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ color:G, fontWeight:700, fontSize:12 }}>+{trip.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(12,10,7,0.96)', backdropFilter:'blur(16px)', borderTop:`1px solid ${BORDER}`, padding:'6px 16px 20px', display:'flex', alignItems:'center', justifyContent:'space-around' }}>
        {[{l:'Home',icon:'home',r:'/crafthub'},{l:'Reserve',icon:'diamond',r:'/crafthub'}].map(({l,icon,r})=>(
          <button key={l} onClick={()=>{hapTap();navigate(r)}} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',minWidth:52,padding:'6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, color:'#7A6B55' }}>{icon}</span>
            <span style={{ fontSize:9, color:'#7A6B55', letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
          </button>
        ))}
        <button onClick={()=>hapTap()} style={{ width:58,height:58,borderRadius:'50%',background:`linear-gradient(135deg,${G},#A07830)`,border:`2px solid ${GL}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:`0 4px 20px rgba(201,168,76,0.4)`,marginTop:-18 }}>
          <span className="material-symbols-outlined" style={{ fontSize:22, color:'#1A1200', fontVariationSettings:"'FILL' 1" }}>qr_code_scanner</span>
          <span style={{ fontSize:7, color:'#1A1200', fontWeight:700, marginTop:1 }}>SCAN</span>
        </button>
        {[{l:'Passport',icon:'book',r:'/passport'},{l:'Profile',icon:'person',r:'/passport/profile'}].map(({l,icon,r})=>(
          <button key={l} onClick={()=>{hapTap();navigate(r)}} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',minWidth:52,padding:'6px 4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, color:'#7A6B55' }}>{icon}</span>
            <span style={{ fontSize:9, color:'#7A6B55', letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
          </button>
        ))}
      </nav>

      {/* trip detail modal */}
      <Modal open={!!modal.trip} onClose={()=>setModal(m=>({...m,trip:null}))} title={modal.trip?.name||''}>
        {modal.trip && <>
          <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>{modal.trip.desc}</p>
          <div style={{ color:TEXTD, fontSize:11, marginBottom:16 }}>Earn <span style={{ color:G, fontWeight:700 }}>+{modal.trip.xp} XP</span> upon completion</div>
          <button onClick={()=>{hapTap();setModal(m=>({...m,trip:null}))}} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G},#A07830)`, color:'#1A1200', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            Request This Journey
          </button>
        </>}
      </Modal>

      <Modal open={modal.concierge} onClose={()=>setModal(m=>({...m,concierge:false}))} title="Request Travel Concierge">
        <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>Our DayOne360 concierge team will contact you within 24 hours to plan your Brotherhood travel experience.</p>
        <button onClick={()=>{hapTap();setModal(m=>({...m,concierge:false}))}} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G},#A07830)`, color:'#1A1200', fontWeight:700, cursor:'pointer', fontSize:14 }}>Submit Request</button>
      </Modal>

      <Modal open={modal.stamps} onClose={()=>setModal(m=>({...m,stamps:false}))} title="Travel Stamps">
        <p style={{ color:TEXTM, fontSize:13, lineHeight:1.7, marginBottom:16 }}>Complete travel experiences to earn exclusive Passport stamps and XP.</p>
        {TRIPS.map(t => (
          <div key={t.id} style={{ padding:'10px 0', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:TEXT, fontSize:13 }}>{t.name} Stamp</span>
            <span style={{ color:G, fontWeight:700, fontSize:12 }}>+{t.xp} XP</span>
          </div>
        ))}
      </Modal>
    </div>
  )
}
