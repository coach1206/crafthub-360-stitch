import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'
import craftImages from '../../lib/craftImages.js'

const FILL1 = { fontVariationSettings:"'FILL' 1" }

const EVENT_IMGS = {
  cgc: craftImages.events.cigarcognac,
  ccd: craftImages.fallbacks.food,
  ws:  craftImages.events.whiskey,
  bm:  craftImages.events.mixer,
}

const EVENTS = [
  { id:'cgc', featured:true, vip:false,
    mon:'JUN', day:'14', year:'2026', time:'7:00 PM',
    title:'Cigar & Cognac Collectors Night',
    venue:'Grand Lounge · New York, NY',
    category:'Craft Experience',
    desc:'An intimate evening celebrating rare cigars and aged cognacs. Curated pairings, live ratings, and verified networking.',
    stamps:3, attendees:48, capacity:60,
    rsvpStatus:'attending',
    bg:'#1a0e00', accent:'#ffb74d',
  },
  { id:'ccd', featured:false, vip:true,
    mon:'JUN', day:'22', year:'2026', time:'6:30 PM',
    title:'Capital & Culture Private Dinner',
    venue:'Bottle House · New York, NY',
    category:'VIP Invite Only',
    desc:'An exclusive dinner for founders, investors, and creatives. Invitation-only. Verified passport required for entry.',
    stamps:4, attendees:24, capacity:30,
    rsvpStatus:'none',
    bg:'#0a1a00', accent:'#8bc34a',
  },
  { id:'ws', featured:false, vip:false,
    mon:'JUL', day:'5', year:'2026', time:'5:00 PM',
    title:'Whiskey Society Tasting',
    venue:'Barrel Room · Brooklyn, NY',
    category:'Craft Experience',
    desc:'Single malt journey through Scotland, Japan, and Kentucky. Sommeliers guide the session. Craft stamp awarded.',
    stamps:2, attendees:35, capacity:50,
    rsvpStatus:'none',
    bg:'#1a0a00', accent:'#ff8f00',
  },
  { id:'bm', featured:false, vip:false,
    mon:'JUL', day:'12', year:'2026', time:'6:00 PM',
    title:'Business Mixer & Passport Kickoff',
    venue:'The Atrium · Manhattan, NY',
    category:'Networking Mixer',
    desc:'360 Passport Connection official mixer. Scan to connect, earn stamps, and build your network in one evening.',
    stamps:2, attendees:80, capacity:120,
    rsvpStatus:'none',
    bg:'#0a0a1a', accent:'#4a9eff',
  },
]

const CATS = ['All', 'Featured', 'VIP Only', 'Craft', 'Networking', 'Attending']
const RSVP_COLORS = { attending:'#66bb6a', waitlist:'#ffb74d', none:'rgba(255,183,77,0.5)' }
const RSVP_LABELS = { attending:'Attending ✓', waitlist:'Waitlisted', none:'RSVP Now' }

export default function PassportEvents() {
  const navigate = useNavigate()
  const [cat, setCat] = useState('All')
  const [rsvp, setRsvp] = useState({ cgc:'attending', ccd:'none', ws:'none', bm:'none' })

  const filtered = EVENTS.filter(e => {
    if (cat === 'All') return true
    if (cat === 'Featured') return e.featured
    if (cat === 'VIP Only') return e.vip
    if (cat === 'Craft') return e.category.includes('Craft')
    if (cat === 'Networking') return e.category.includes('Networking')
    if (cat === 'Attending') return rsvp[e.id] === 'attending'
    return true
  })

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#0e0a02,#140e04,#0a0802)' }}>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 45% at 60% 0%, rgba(140,80,10,0.18) 0%, transparent 65%)' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(12,8,2,0.97)', borderColor:'rgba(255,183,77,0.2)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(255,183,77,0.08)', border:'1px solid rgba(255,183,77,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#ffb74d' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ color:'#ffe0b2', fontFamily:'"Playfair Display",serif' }}>Events</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(255,224,178,0.35)' }}>Curated Experiences</p>
        </div>
        <div className="px-3 py-1.5 rounded-full"
          style={{ background:'rgba(255,183,77,0.1)', border:'1px solid rgba(255,183,77,0.25)' }}>
          <span className="font-bold text-[11px]" style={{ color:'#ffb74d' }}>4 Upcoming</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Category filters */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                className="flex-shrink-0 px-4 rounded-full font-bold text-[11px] uppercase tracking-wider active:scale-94 transition-all"
                style={{
                  height:36,
                  background: cat === c ? 'rgba(255,183,77,0.2)' : 'rgba(255,255,255,0.04)',
                  border: cat === c ? '1.5px solid rgba(255,183,77,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: cat === c ? '#ffb74d' : 'rgba(255,255,255,0.4)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Event cards */}
        <section className="space-y-4 pb-2">
          {filtered.map(e => (
            <div key={e.id} className="rounded-2xl overflow-hidden"
              style={{ background:`linear-gradient(155deg,${e.bg},${e.bg}dd)`, border:`1px solid ${e.accent}35`, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>

              {/* Event hero image */}
              <div style={{ position:'relative', height: e.featured ? 200 : 140, overflow:'hidden' }}>
                <img
                  src={EVENT_IMGS[e.id]}
                  alt={e.title}
                  loading="lazy"
                  onError={ev => { ev.currentTarget.src = craftImages.fallbacks.lounge }}
                  style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.7) saturate(0.8)' }}
                />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, ${e.accent}15 0%, rgba(6,4,2,0.88) 100%)` }} />

                {/* Top badges */}
                <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6 }}>
                  {e.featured && (
                    <div style={{ padding:'3px 10px', borderRadius:20, background:'rgba(6,4,2,0.82)', backdropFilter:'blur(8px)', border:`1px solid ${e.accent}66` }}>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:e.accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>Featured</span>
                    </div>
                  )}
                  {e.vip && (
                    <div style={{ padding:'3px 10px', borderRadius:20, background:'rgba(6,4,2,0.82)', backdropFilter:'blur(8px)', border:'1px solid rgba(233,193,118,0.5)' }}>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'#e9c176', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>VIP Only</span>
                    </div>
                  )}
                </div>

                {/* Date badge */}
                <div style={{ position:'absolute', top:10, right:12, textAlign:'center' }}>
                  <div style={{ background:'rgba(6,4,2,0.85)', backdropFilter:'blur(8px)', borderRadius:10, border:`1px solid ${e.accent}44`, padding:'5px 10px', minWidth:50 }}>
                    <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:e.accent, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>{e.mon}</div>
                    <div style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:22, color:'#fff', lineHeight:1 }}>{e.day}</div>
                  </div>
                </div>

                {/* Category */}
                <div style={{ position:'absolute', bottom:10, left:12 }}>
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:`${e.accent}cc`, letterSpacing:'0.1em', textTransform:'uppercase' }}>{e.category}</span>
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding:'16px 16px 18px' }}>
                <p className="font-bold text-[17px] leading-tight mb-1" style={{ color:'#fff0d8', fontFamily:'"Playfair Display",serif' }}>{e.title}</p>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize:12, color:`${e.accent}88` }}>location_on</span>
                  <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.4)' }}>{e.venue} · {e.time}</p>
                </div>
                <p className="text-[12px] leading-relaxed mb-4" style={{ color:'rgba(255,255,255,0.5)' }}>{e.desc}</p>

                {/* Stats row */}
                <div className="flex gap-3 mb-4">
                  {[
                    { icon:'workspace_premium', val:`+${e.stamps}`, label:'Stamps' },
                    { icon:'group', val:`${e.attendees}/${e.capacity}`, label:'Attending' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background:`${e.accent}10`, border:`1px solid ${e.accent}25` }}>
                      <span className="material-symbols-outlined" style={{ fontSize:13, color:e.accent, ...FILL1 }}>{s.icon}</span>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:11, color:e.accent }}>{s.val}</span>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:`${e.accent}80`, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* RSVP button */}
                <button
                  onClick={() => setRsvp(prev => ({ ...prev, [e.id]: prev[e.id] === 'none' ? 'attending' : 'none' }))}
                  onTouchStart={ev => ev.currentTarget.style.transform='scale(0.97)'}
                  onTouchEnd={ev => ev.currentTarget.style.transform=''}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-[12px] uppercase tracking-wider active:scale-97 transition-all"
                  style={{
                    height:52,
                    background: rsvp[e.id] === 'attending'
                      ? `linear-gradient(135deg,rgba(102,187,106,0.8),rgba(76,175,80,0.9))`
                      : `linear-gradient(135deg,${e.accent}cc,${e.accent})`,
                    color: '#0a0605',
                    boxShadow: `0 4px 16px ${rsvp[e.id] === 'attending' ? 'rgba(102,187,106,0.35)' : e.accent + '44'}`,
                    border: 'none',
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize:18, ...FILL1 }}>
                    {rsvp[e.id] === 'attending' ? 'check_circle' : 'calendar_add_on'}
                  </span>
                  {RSVP_LABELS[rsvp[e.id]]}
                </button>
              </div>
            </div>
          ))}
        </section>

      </main>
      <PassportBottomNav active="events" />
    </div>
  )
}
