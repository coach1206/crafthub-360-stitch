import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings:"'FILL' 1" }

const EVENTS = [
  {
    id:'cgc', featured:true, vip:false,
    mon:'JUN', day:'14', year:'2026', time:'7:00 PM',
    title:'Cigar & Cognac Collectors Night',
    venue:'Grand Lounge · New York, NY',
    category:'Craft Experience',
    desc:'An intimate evening celebrating rare cigars and aged cognacs. Curated pairings, live ratings, and verified networking.',
    stamps:3, attendees:48, capacity:60,
    rsvpStatus:'attending',
    bg:'#1a0e00', accent:'#ffb74d',
  },
  {
    id:'ccd', featured:false, vip:true,
    mon:'JUN', day:'22', year:'2026', time:'6:30 PM',
    title:'Capital & Culture Private Dinner',
    venue:'Bottle House · New York, NY',
    category:'VIP Invite Only',
    desc:'An exclusive dinner for founders, investors, and creatives. Invitation-only. Verified passport required for entry.',
    stamps:4, attendees:24, capacity:30,
    rsvpStatus:'none',
    bg:'#0a1a00', accent:'#8bc34a',
  },
  {
    id:'ws', featured:false, vip:false,
    mon:'JUL', day:'5', year:'2026', time:'5:00 PM',
    title:'Whiskey Society Tasting',
    venue:'Barrel Room · Brooklyn, NY',
    category:'Craft Experience',
    desc:'Single malt journey through Scotland, Japan, and Kentucky. Sommeliers guide the session. Craft stamp awarded.',
    stamps:2, attendees:35, capacity:50,
    rsvpStatus:'none',
    bg:'#1a0a00', accent:'#ff8f00',
  },
  {
    id:'bm', featured:false, vip:false,
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

      {/* Amber lounge ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 45% at 60% 0%, rgba(140,80,10,0.18) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background:'repeating-linear-gradient(45deg,rgba(255,255,255,0.005) 0,rgba(255,255,255,0.005) 1px,transparent 0,transparent 6px)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(10,7,2,0.97)', borderColor:'rgba(255,183,77,0.2)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(255,183,77,0.08)', border:'1px solid rgba(255,183,77,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#ffb74d' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ color:'#ffd580', fontFamily:'"Playfair Display",serif' }}>Events</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(255,183,77,0.35)' }}>Upcoming passport experiences</p>
        </div>
        <button onClick={() => navigate('/passport/scan')}
          className="flex items-center gap-2 px-3 rounded-full active:opacity-70 transition-opacity"
          style={{ height:40, background:'rgba(255,183,77,0.1)', border:'1px solid rgba(255,183,77,0.25)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'#ffb74d', ...FILL1 }}>qr_code_scanner</span>
          <span className="text-[11px] font-bold" style={{ color:'#ffb74d' }}>Scan In</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* ── Invitation folder cover ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#1f1200,#281700,#1a1000)', border:'2px solid rgba(255,183,77,0.3)', boxShadow:'0 10px 40px rgba(0,0,0,0.7)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(45deg,rgba(255,255,255,0.006) 0,rgba(255,255,255,0.006) 1px,transparent 0,transparent 5px)' }} />
            <div className="h-1" style={{ background:'linear-gradient(90deg,#5c3000,#ffb74d,#ff8f00,#ffb74d,#5c3000)' }} />
            <div className="p-5 relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(255,183,77,0.1)', border:'1.5px solid rgba(255,183,77,0.3)', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:28, color:'#ffb74d', ...FILL1 }}>event</span>
              </div>
              <div>
                <p className="font-bold text-[20px] leading-none mb-1.5" style={{ color:'#ffd580', fontFamily:'"Playfair Display",serif' }}>Events</p>
                <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,183,77,0.45)' }}>
                  Events are where your passport comes alive. Attend passport-enabled experiences to meet people, earn stamps, and unlock access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filter tabs ── */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                className="flex-shrink-0 px-4 rounded-full font-bold text-[11px] uppercase tracking-wider active:scale-94 transition-all"
                style={{
                  height:36,
                  background: cat === c ? 'rgba(255,183,77,0.18)' : 'rgba(255,255,255,0.04)',
                  border: cat === c ? '1.5px solid rgba(255,183,77,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: cat === c ? '#ffb74d' : 'rgba(255,255,255,0.4)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* ── Event invitation cards ── */}
        <section className="space-y-4 pb-2">
          {filtered.map(e => (
            <div key={e.id} className="rounded-2xl overflow-hidden"
              style={{ background:`linear-gradient(155deg,${e.bg},${e.bg}dd)`, border:`1.5px solid ${e.accent}30`, boxShadow:'0 8px 32px rgba(0,0,0,0.65)' }}>

              {/* Featured/VIP badge */}
              {(e.featured || e.vip) && (
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background:`${e.accent}10`, borderBottom:`1px solid ${e.accent}20` }}>
                  <span className="material-symbols-outlined" style={{ fontSize:13, color:e.accent, ...FILL1 }}>{e.vip ? 'workspace_premium' : 'star'}</span>
                  <span className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color:e.accent }}>{e.vip ? 'VIP · Invite Only' : 'Featured Event'}</span>
                </div>
              )}

              <div className="p-4">
                {/* Date + title row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Invitation date badge */}
                  <div className="rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ width:52, height:56, background:`${e.accent}14`, border:`1.5px solid ${e.accent}40`, boxShadow:`0 2px 8px ${e.accent}20` }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider leading-none" style={{ color:e.accent }}>{e.mon}</span>
                    <span className="font-black text-[20px] leading-none" style={{ color:e.accent, fontFamily:'"Playfair Display",serif' }}>{e.day}</span>
                    <span className="text-[8px] leading-none" style={{ color:`${e.accent}70` }}>{e.year}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] leading-tight" style={{ color:'#fff5e0', fontFamily:'"Playfair Display",serif' }}>{e.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined" style={{ fontSize:11, color:`${e.accent}70` }}>location_on</span>
                      <p className="text-[10px]" style={{ color:`${e.accent}70` }}>{e.venue}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize:11, color:`${e.accent}50` }}>schedule</span>
                      <p className="text-[10px]" style={{ color:`${e.accent}55` }}>{e.time}</p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                  style={{ background:`${e.accent}10`, border:`1px solid ${e.accent}30` }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color:e.accent }}>{e.category}</span>
                </div>

                {/* Description */}
                <p className="text-[11px] leading-relaxed mb-3" style={{ color:'rgba(255,230,180,0.5)' }}>{e.desc}</p>

                {/* Stamps + attendees row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon:'workspace_premium', val:`${e.stamps} Stamps`, label:'Available' },
                    { icon:'people',            val:`${e.attendees} Going`, label:'Attending' },
                    { icon:'event_seat',        val:`${e.capacity - e.attendees} Left`, label:'Capacity' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl flex flex-col items-center justify-center gap-0.5 py-2.5"
                      style={{ background:'rgba(0,0,0,0.25)', border:`1px solid ${e.accent}18` }}>
                      <span className="material-symbols-outlined" style={{ fontSize:15, color:e.accent, ...FILL1 }}>{s.icon}</span>
                      <span className="font-bold text-[11px]" style={{ color:'#fff5e0' }}>{s.val}</span>
                      <span className="text-[8.5px] uppercase tracking-wider" style={{ color:`${e.accent}50` }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* RSVP + actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onTouchStart={x => x.currentTarget.style.transform='scale(0.95)'}
                    onTouchEnd={x => { x.currentTarget.style.transform=''; setRsvp(r => ({ ...r, [e.id]: r[e.id] === 'attending' ? 'none' : 'attending' })) }}
                    className="col-span-1 flex items-center justify-center rounded-xl font-bold text-[11px] active:scale-95 transition-all"
                    style={{
                      height:52,
                      background: rsvp[e.id] === 'attending' ? `${e.accent}22` : `linear-gradient(135deg,${e.accent},${e.accent}bb)`,
                      border: `1.5px solid ${e.accent}${rsvp[e.id] === 'attending' ? '50' : ''}`,
                      color: rsvp[e.id] === 'attending' ? e.accent : '#0a0802',
                      boxShadow: rsvp[e.id] === 'attending' ? 'none' : `0 3px 14px ${e.accent}30`,
                    }}>
                    {RSVP_LABELS[rsvp[e.id]]}
                  </button>
                  {['See Attendees','Stamps'].map(lbl => (
                    <button key={lbl}
                      onTouchStart={x => x.currentTarget.style.transform='scale(0.95)'}
                      onTouchEnd={x => x.currentTarget.style.transform=''}
                      className="flex items-center justify-center rounded-xl font-bold text-[10px] active:scale-95 transition-all"
                      style={{ height:52, background:`${e.accent}08`, border:`1px solid ${e.accent}22`, color:e.accent }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

      </main>
      <PassportBottomNav active="events" />
    </div>
  )
}
