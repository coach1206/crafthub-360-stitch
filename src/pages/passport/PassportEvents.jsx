import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'
import craftImages from '../../lib/craftImages.js'
import { getEventImage } from '../../lib/eventImages.js'

const FILL1 = { fontVariationSettings:"'FILL' 1" }

/* ── Event data ─────────────────────────────────────────────── */
const EVENTS = [
  {
    id:'cgc',
    featured:true, vip:false,
    imageCategory:'cigarCognac',
    mon:'JUN', day:'14', year:'2026', time:'7:00 PM',
    title:'Cigar & Cognac Collectors Night',
    venue:'Grand Lounge', city:'New York', state:'NY',
    category:'Craft Experience',
    type:'Craft',
    description:'An intimate evening celebrating rare cigars and aged cognacs. Expert pairings, live ratings, verified collector networking, and three exclusive stamps awarded to attendees.',
    stamps:3, attendees:48, capacity:60,
    accent:'#ffb74d', bg:'#180d00',
  },
  {
    id:'ccd',
    featured:false, vip:true,
    imageCategory:'privateDinner',
    mon:'JUN', day:'22', year:'2026', time:'6:30 PM',
    title:'Capital & Culture Private Dinner',
    venue:'Bottle House', city:'New York', state:'NY',
    category:'VIP Invite Only',
    type:'VIP',
    description:'An exclusive dinner for founders, investors, and creatives. Invitation-only event — verified passport required for entry. Four stamps awarded, curated connections included.',
    stamps:4, attendees:24, capacity:30,
    accent:'#c5a059', bg:'#0e0c00',
  },
  {
    id:'ws',
    featured:false, vip:false,
    imageCategory:'whiskeyTasting',
    mon:'JUL', day:'5', year:'2026', time:'5:00 PM',
    title:'Whiskey Society Tasting',
    venue:'Barrel Room', city:'Brooklyn', state:'NY',
    category:'Craft Experience',
    type:'Craft',
    description:'Single malt journey through Scotland, Japan, and Kentucky. Expert sommeliers guide the session. Craft stamp awarded, barrel-to-glass education, and member networking.',
    stamps:2, attendees:35, capacity:50,
    accent:'#ff8f00', bg:'#160900',
  },
  {
    id:'bm',
    featured:false, vip:false,
    imageCategory:'businessMixer',
    mon:'JUL', day:'12', year:'2026', time:'6:00 PM',
    title:'Business Mixer & Passport Kickoff',
    venue:'The Atrium', city:'Manhattan', state:'NY',
    category:'Networking Mixer',
    type:'Networking',
    description:'360 Passport Connection official mixer. Scan to connect, earn stamps, and build your professional network in one premium evening. Members from all verticals attend.',
    stamps:2, attendees:80, capacity:120,
    accent:'#4a9eff', bg:'#02060f',
  },
]

const CATS = ['All', 'Featured', 'VIP Only', 'Craft', 'Networking', 'Attending']

/* ── Toast ──────────────────────────────────────────────────── */
function Toast({ msg, visible }) {
  return (
    <div style={{
      position:'fixed', bottom:112, left:'50%', transform:`translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0, transition:'all 0.3s ease',
      background:'linear-gradient(135deg,#1a3a1a,#0f2e0f)',
      border:'1px solid rgba(102,187,106,0.4)', borderRadius:14, padding:'12px 20px',
      display:'flex', alignItems:'center', gap:10, zIndex:200,
      boxShadow:'0 8px 32px rgba(0,0,0,0.7)',
      whiteSpace:'nowrap', maxWidth:'90vw',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize:18, color:'#66bb6a', ...FILL1 }}>check_circle</span>
      <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, fontWeight:600, color:'#a8e6ac' }}>{msg}</span>
    </div>
  )
}

/* ── Event detail drawer ────────────────────────────────────── */
function EventDrawer({ event, rsvpState, onRsvp, onClose }) {
  const [closing, setClosing] = useState(false)
  if (!event) return null

  const img   = getEventImage(event)
  const isGoing = rsvpState === 'attending'

  function close() {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:150,
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={close}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)' }} />

      {/* Sheet */}
      <div style={{
        position:'relative', zIndex:1,
        background:'linear-gradient(175deg,#110e08,#0a0805)',
        borderTopLeftRadius:24, borderTopRightRadius:24,
        border:'1px solid rgba(233,193,118,0.18)',
        boxShadow:'0 -20px 60px rgba(0,0,0,0.8)',
        maxHeight:'88vh', overflowY:'auto',
        transform: closing ? 'translateY(100%)' : 'translateY(0)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        scrollbarWidth:'none',
      }}>
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Hero image */}
        <div style={{ position:'relative', height:240, overflow:'hidden', margin:'12px 16px 0', borderRadius:16 }}>
          <img src={img.imageUrl} alt={img.alt} loading="lazy"
            onError={e => { e.currentTarget.src = img.fallback }}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75) saturate(0.85)' }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, ${event.accent}10 0%, rgba(6,4,2,0.9) 100%)`, borderRadius:16 }} />

          {/* Badges top */}
          <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6 }}>
            {event.featured && (
              <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(6,4,2,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${event.accent}55` }}>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:event.accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>Featured</span>
              </div>
            )}
            {event.vip && (
              <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(6,4,2,0.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(197,160,89,0.5)' }}>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'#e9c176', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>VIP Only</span>
              </div>
            )}
          </div>

          {/* Date badge */}
          <div style={{ position:'absolute', top:12, right:12, background:'rgba(6,4,2,0.88)', backdropFilter:'blur(8px)', borderRadius:12, border:`1px solid ${event.accent}44`, padding:'6px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:event.accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>{event.mon}</div>
            <div style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:24, color:'#fff', lineHeight:1 }}>{event.day}</div>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(255,255,255,0.4)' }}>{event.year}</div>
          </div>

          {/* Category bottom */}
          <div style={{ position:'absolute', bottom:12, left:14 }}>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${event.accent}cc`, letterSpacing:'0.12em', textTransform:'uppercase' }}>{event.category}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'18px 18px 32px' }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#f5ead0', lineHeight:1.1, marginBottom:6 }}>{event.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
            <span className="material-symbols-outlined" style={{ fontSize:13, color:`${event.accent}80`, ...FILL1 }}>location_on</span>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(255,255,255,0.4)' }}>{event.venue} · {event.city}, {event.state} · {event.time}</span>
          </div>

          <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:18 }}>{event.description}</p>

          {/* Stats */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {[
              { icon:'workspace_premium', val:`+${event.stamps}`, label:'Stamps Available', color:event.accent },
              { icon:'group',             val:`${event.attendees}/${event.capacity}`, label:'Attending',       color:'#66bb6a' },
            ].map(s => (
              <div key={s.label} style={{ flex:1, padding:'12px', borderRadius:14, background:`${s.color}0e`, border:`1px solid ${s.color}28`, textAlign:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20, color:s.color, ...FILL1 }}>{s.icon}</span>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:14, color:s.color, lineHeight:1, marginTop:4 }}>{s.val}</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${s.color}70`, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Primary RSVP */}
          <button
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e => { e.currentTarget.style.transform=''; onRsvp() }}
            onTouchCancel={e => e.currentTarget.style.transform=''}
            onClick={onRsvp}
            style={{
              width:'100%', height:58, display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              borderRadius:16, border:'none', cursor:'pointer',
              background: isGoing
                ? 'linear-gradient(135deg,rgba(102,187,106,0.85),rgba(76,175,80,0.9))'
                : `linear-gradient(135deg,${event.accent}dd,${event.accent})`,
              color:'#050300',
              fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:15, letterSpacing:'0.04em', textTransform:'uppercase',
              boxShadow: isGoing ? '0 4px 20px rgba(102,187,106,0.35)' : `0 4px 20px ${event.accent}44`,
              transition:'transform 0.12s',
              marginBottom:10,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize:20, ...FILL1 }}>
              {isGoing ? 'check_circle' : 'calendar_add_on'}
            </span>
            {isGoing ? 'Attending ✓' : 'RSVP Now'}
          </button>

          {/* Secondary buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <button
              onTouchStart={e => e.currentTarget.style.opacity='0.7'}
              onTouchEnd={e => e.currentTarget.style.opacity=''}
              style={{ height:46, borderRadius:14, border:`1px solid ${event.accent}28`, background:`${event.accent}0a`, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:event.accent, ...FILL1 }}>group</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:event.accent, fontWeight:700 }}>See Attendees</span>
            </button>
            <button
              onTouchStart={e => e.currentTarget.style.opacity='0.7'}
              onTouchEnd={e => e.currentTarget.style.opacity=''}
              style={{ height:46, borderRadius:14, border:`1px solid ${event.accent}28`, background:`${event.accent}0a`, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:event.accent, ...FILL1 }}>workspace_premium</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:event.accent, fontWeight:700 }}>Stamp Rewards</span>
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button
              onTouchStart={e => e.currentTarget.style.opacity='0.7'}
              onTouchEnd={e => e.currentTarget.style.opacity=''}
              style={{ height:46, borderRadius:14, border:`1px solid ${event.accent}28`, background:`${event.accent}0a`, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:event.accent, ...FILL1 }}>qr_code_scanner</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:event.accent, fontWeight:700 }}>Scan at Event</span>
            </button>
            <button
              onTouchStart={e => e.currentTarget.style.opacity='0.7'}
              onTouchEnd={e => e.currentTarget.style.opacity=''}
              style={{ height:46, borderRadius:14, border:`1px solid ${event.accent}28`, background:`${event.accent}0a`, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:event.accent, ...FILL1 }}>event_available</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:event.accent, fontWeight:700 }}>Add to Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function PassportEvents() {
  const navigate = useNavigate()
  const [cat,      setCat]      = useState('All')
  const [rsvp,     setRsvp]     = useState({ cgc:'attending', ccd:'none', ws:'none', bm:'none' })
  const [selected, setSelected] = useState(null)
  const [toast,    setToast]    = useState({ visible:false, msg:'' })

  function showToast(msg) {
    setToast({ visible:true, msg })
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3200)
  }

  function toggleRsvp(eventId) {
    const e   = EVENTS.find(ev => ev.id === eventId)
    const was = rsvp[eventId]
    const now = was === 'attending' ? 'none' : 'attending'
    setRsvp(prev => ({ ...prev, [eventId]: now }))
    if (now === 'attending') {
      showToast(`You're attending ${e?.title || 'this event'}. Added to your Passport journey.`)
    }
  }

  const filtered = EVENTS.filter(e => {
    if (cat === 'All')       return true
    if (cat === 'Featured')  return e.featured
    if (cat === 'VIP Only')  return e.vip
    if (cat === 'Craft')     return e.category.includes('Craft')
    if (cat === 'Networking')return e.category.includes('Networking')
    if (cat === 'Attending') return rsvp[e.id] === 'attending'
    return true
  })

  const selectedEvent = selected ? EVENTS.find(e => e.id === selected) : null

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#0e0a02,#140e04,#0a0802)' }}>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 45% at 60% 0%, rgba(140,80,10,0.18) 0%, transparent 65%)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(12,8,2,0.97)', borderColor:'rgba(255,183,77,0.2)' }}>
        <button onClick={() => navigate('/passport')}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.9)'}
          onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport') }}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(255,183,77,0.08)', border:'1px solid rgba(255,183,77,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#ffb74d' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[17px] leading-none" style={{ color:'#ffe0b2', fontFamily:'"Playfair Display",serif' }}>Events</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(255,224,178,0.35)' }}>Curated Experiences</p>
        </div>
        <div className="px-3 py-1.5 rounded-full"
          style={{ background:'rgba(255,183,77,0.1)', border:'1px solid rgba(255,183,77,0.25)' }}>
          <span className="font-bold text-[11px]" style={{ color:'#ffb74d' }}>{filtered.length} Upcoming</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Category filters */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {CATS.map(c => (
              <button key={c}
                onClick={() => setCat(c)}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                className="flex-shrink-0 px-4 rounded-full font-bold text-[11px] uppercase tracking-wider active:scale-92 transition-all"
                style={{
                  height:36, cursor:'pointer',
                  background: cat === c ? 'rgba(255,183,77,0.18)' : 'rgba(255,255,255,0.04)',
                  border: cat === c ? '1.5px solid rgba(255,183,77,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: cat === c ? '#ffb74d' : 'rgba(255,255,255,0.4)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Event cards */}
        <section className="space-y-5 pb-2">
          {filtered.map(ev => {
            const img     = getEventImage(ev)
            const isGoing = rsvp[ev.id] === 'attending'

            return (
              <div key={ev.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background:`linear-gradient(155deg,${ev.bg},${ev.bg}ee)`,
                  border:`1px solid ${ev.accent}30`,
                  boxShadow:`0 10px 40px rgba(0,0,0,0.65)`,
                }}>

                {/* Hero image — tap opens drawer */}
                <button
                  onClick={() => setSelected(ev.id)}
                  onTouchStart={e => e.currentTarget.style.opacity='0.9'}
                  onTouchEnd={e => { e.currentTarget.style.opacity=''; setSelected(ev.id) }}
                  onTouchCancel={e => e.currentTarget.style.opacity=''}
                  style={{ display:'block', width:'100%', border:'none', padding:0, cursor:'pointer',
                    position:'relative', height: ev.featured ? 240 : 180, overflow:'hidden',
                    transition:'opacity 0.1s',
                  }}>
                  <img
                    src={img.imageUrl}
                    alt={img.alt}
                    loading="lazy"
                    onError={e => { e.currentTarget.src = img.fallback }}
                    style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.7) saturate(0.82)', display:'block' }}
                  />
                  <div style={{ position:'absolute', inset:0,
                    background:`linear-gradient(to bottom, ${ev.accent}18 0%, transparent 35%, rgba(6,4,2,0.88) 100%)` }} />

                  {/* Top badges */}
                  <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6 }}>
                    {ev.featured && (
                      <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(6,4,2,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${ev.accent}55` }}>
                        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:ev.accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>Featured</span>
                      </div>
                    )}
                    {ev.vip && (
                      <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(6,4,2,0.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(197,160,89,0.55)' }}>
                        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'#e9c176', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>VIP Only</span>
                      </div>
                    )}
                  </div>

                  {/* Date badge */}
                  <div style={{ position:'absolute', top:10, right:12, background:'rgba(6,4,2,0.88)', backdropFilter:'blur(8px)', borderRadius:12, border:`1px solid ${ev.accent}44`, padding:'6px 12px', textAlign:'center' }}>
                    <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:ev.accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>{ev.mon}</div>
                    <div style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:24, color:'#fff', lineHeight:1 }}>{ev.day}</div>
                  </div>

                  {/* Category + "tap" hint bottom */}
                  <div style={{ position:'absolute', bottom:10, left:14, right:80, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${ev.accent}cc`, letterSpacing:'0.1em', textTransform:'uppercase' }}>{ev.category}</span>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em' }}>Tap for details ›</span>
                  </div>
                </button>

                {/* Card body */}
                <div style={{ padding:'16px 18px 18px' }}>
                  <button onClick={() => setSelected(ev.id)} style={{ background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left', width:'100%' }}>
                    <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:18, color:'#fff0d8', lineHeight:1.2, marginBottom:5 }}>{ev.title}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:12, color:`${ev.accent}88`, ...FILL1 }}>location_on</span>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, color:'rgba(255,255,255,0.38)' }}>{ev.venue} · {ev.city}, {ev.state} · {ev.time}</span>
                    </div>
                  </button>

                  <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12.5, color:'rgba(255,255,255,0.48)', lineHeight:1.6, marginBottom:16 }}>{ev.description}</p>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                    {[
                      { icon:'workspace_premium', val:`+${ev.stamps}`, label:'Stamps' },
                      { icon:'group',             val:`${ev.attendees}/${ev.capacity}`, label:'Attending' },
                    ].map(s => (
                      <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:12, background:`${ev.accent}0e`, border:`1px solid ${ev.accent}22` }}>
                        <span className="material-symbols-outlined" style={{ fontSize:14, color:ev.accent, ...FILL1 }}>{s.icon}</span>
                        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:12, color:ev.accent }}>{s.val}</span>
                        <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${ev.accent}70`, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* RSVP */}
                  <button
                    onClick={() => toggleRsvp(ev.id)}
                    onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                    onTouchEnd={e => { e.currentTarget.style.transform=''; toggleRsvp(ev.id) }}
                    onTouchCancel={e => e.currentTarget.style.transform=''}
                    style={{
                      width:'100%', height:54, display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                      borderRadius:16, border:'none', cursor:'pointer',
                      background: isGoing
                        ? 'linear-gradient(135deg,rgba(102,187,106,0.82),rgba(76,175,80,0.88))'
                        : `linear-gradient(135deg,${ev.accent}cc,${ev.accent})`,
                      color:'#050300',
                      fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, letterSpacing:'0.05em', textTransform:'uppercase',
                      boxShadow: isGoing ? '0 4px 18px rgba(102,187,106,0.3)' : `0 4px 18px ${ev.accent}40`,
                      transition:'transform 0.12s',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize:18, ...FILL1 }}>
                      {isGoing ? 'check_circle' : 'calendar_add_on'}
                    </span>
                    {isGoing ? 'Attending ✓' : 'RSVP Now'}
                  </button>
                </div>
              </div>
            )
          })}
        </section>

      </main>

      {/* Event detail drawer */}
      {selectedEvent && (
        <EventDrawer
          event={selectedEvent}
          rsvpState={rsvp[selectedEvent.id]}
          onRsvp={() => toggleRsvp(selectedEvent.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Toast */}
      <Toast msg={toast.msg} visible={toast.visible} />

      <PassportBottomNav active="events" />
    </div>
  )
}
