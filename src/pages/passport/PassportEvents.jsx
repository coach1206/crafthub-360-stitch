import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const EVENTS = [
  {
    id: 1, title: 'SmokeCraft Grand Showcase',
    venue: 'The Grand Lounge',      city: 'Atlanta, GA',
    date: 'Jun 14, 2025',          time: '7:00 PM',
    type: 'Craft Experience',       stamps: 3,
    capacity: 40,                   attending: 28,
    status: 'open',                 featured: true,
    color: '#1a0e00', accent: '#ffb74d',
    desc: 'An immersive evening of premium tobacco artistry, blending masterclasses, and curated pairings with award-winning master blenders.',
  },
  {
    id: 2, title: 'Founders Networking Dinner',
    venue: 'Ember Dining Room',     city: 'Atlanta, GA',
    date: 'Jun 19, 2025',          time: '6:30 PM',
    type: 'Networking',             stamps: 2,
    capacity: 20,                   attending: 16,
    status: 'limited',              featured: false,
    color: '#0d1829', accent: '#4a9eff',
    desc: 'A private dinner for 20 founders and investors. Structured intros, curated conversations, and verified passport connections.',
  },
  {
    id: 3, title: 'VIP Lounge Access Night',
    venue: 'Reserve Rooftop',       city: 'Miami, FL',
    date: 'Jun 22, 2025',          time: '9:00 PM',
    type: 'VIP Access',             stamps: 1,
    capacity: 60,                   attending: 44,
    status: 'open',                 featured: false,
    color: '#2d0d1a', accent: '#ce93d8',
    desc: 'Exclusive rooftop experience for Gold tier and above members. Premium spirits, curated connections, and live music.',
  },
  {
    id: 4, title: 'Master Sommelier Series',
    venue: 'The Cellar',            city: 'Chicago, IL',
    date: 'Jul 5, 2025',           time: '5:00 PM',
    type: 'Education',              stamps: 4,
    capacity: 30,                   attending: 12,
    status: 'open',                 featured: false,
    color: '#0d2818', accent: '#66bb6a',
    desc: 'Three-hour deep-dive wine and cigar pairing education led by a certified master sommelier. Certificate awarded at completion.',
  },
  {
    id: 5, title: '360 Annual Passport Summit',
    venue: 'Profound HQ',          city: 'Atlanta, GA',
    date: 'Aug 12, 2025',          time: '10:00 AM',
    type: 'Summit',                 stamps: 6,
    capacity: 200,                  attending: 89,
    status: 'open',                 featured: true,
    color: '#0a0805', accent: '#e9c176',
    desc: 'The flagship annual event for all 360 Passport members. Full-day summit with panels, networking, craft experiences, and exclusive stamp reveals.',
  },
]

const STATUS_STYLES = {
  open:    { bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.35)',  color: '#4caf50',  label: 'Open'    },
  limited: { bg: 'rgba(255,152,0,0.15)',  border: 'rgba(255,152,0,0.35)',  color: '#ff9800',  label: 'Limited' },
  full:    { bg: 'rgba(239,83,80,0.15)',  border: 'rgba(239,83,80,0.35)',  color: '#ef5350',  label: 'Full'    },
}

function EventCard({ event }) {
  const [rsvp, setRsvp]     = useState(false)
  const [saved, setSaved]   = useState(false)
  const ss = STATUS_STYLES[event.status] || STATUS_STYLES.open
  const spotsLeft = event.capacity - event.attending

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: `${event.color}ee`, border: `1px solid ${event.accent}25`, boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>

      {/* Top bar */}
      {event.featured && (
        <div className="px-4 py-1.5 flex items-center gap-2"
          style={{ background: `${event.accent}20`, borderBottom: `1px solid ${event.accent}25` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: event.accent, ...FILL1 }}>stars</span>
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: event.accent }}>Featured Event</span>
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
                style={{ background: `${event.accent}15`, color: event.accent, border: `1px solid ${event.accent}30` }}>
                {event.type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
                style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                {ss.label}
              </span>
            </div>
            <h3 className="font-bold text-[16px] leading-tight" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>
              {event.title}
            </h3>
          </div>
          <button onClick={() => setSaved(s => !s)}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.88)'}
            onTouchEnd={e => e.currentTarget.style.transform = ''}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{ background: saved ? `${event.accent}20` : 'rgba(255,255,255,0.08)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: saved ? event.accent : 'rgba(255,255,255,0.4)', ...(saved ? FILL1 : {}) }}>bookmark</span>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-3">
          {[
            { icon: 'event',       text: `${event.date} · ${event.time}` },
            { icon: 'location_on', text: `${event.venue} · ${event.city}` },
            { icon: 'people',      text: `${event.attending}/${event.capacity} attending${spotsLeft <= 5 ? ` · ${spotsLeft} spots left!` : ''}` },
          ].map(d => (
            <div key={d.icon} className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: `${event.accent}70` }}>{d.icon}</span>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{d.text}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.desc}</p>

        {/* Stamps available */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(233,193,118,0.1)', border: '1px solid rgba(233,193,118,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#e9c176', ...FILL1 }}>workspace_premium</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#e9c176' }}>{event.stamps} stamps available</span>
          </div>
        </div>

        {/* RSVP button */}
        <button
          onClick={() => setRsvp(r => !r)}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onTouchEnd={e => { e.currentTarget.style.transform = ''; setRsvp(r => !r) }}
          disabled={event.status === 'full'}
          className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider transition-all duration-300 active:scale-[0.97]"
          style={{
            height: 64,
            background: rsvp
              ? 'rgba(76,175,80,0.2)'
              : event.status === 'full'
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, ${event.accent}, ${event.accent}bb)`,
            color: rsvp ? '#4caf50' : event.status === 'full' ? 'rgba(255,255,255,0.25)' : '#0a0805',
            border: rsvp ? '2px solid rgba(76,175,80,0.4)' : 'none',
            boxShadow: (!rsvp && event.status !== 'full') ? `0 4px 20px ${event.accent}40` : 'none',
          }}>
          <span className="material-symbols-outlined" style={{ ...FILL1 }}>{rsvp ? 'check_circle' : event.status === 'full' ? 'block' : 'event_available'}</span>
          {rsvp ? 'RSVP Confirmed' : event.status === 'full' ? 'Event Full' : 'RSVP Now'}
        </button>
      </div>
    </div>
  )
}

export default function PassportEvents() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Craft Experience', 'Networking', 'VIP Access', 'Education', 'Summit']
  const filtered = filter === 'All' ? EVENTS : EVENTS.filter(e => e.type === filter)

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #1a1000 0%, #0a0800 100%)' }}>

      {/* Amber glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bottom-1/3 right-0 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'rgba(180,100,0,0.12)' }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex flex-col px-5 backdrop-blur-xl border-b"
        style={{ background: 'rgba(10,8,0,0.9)', borderColor: 'rgba(255,183,77,0.2)' }}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
              style={{ color: '#ffb74d', minWidth: 44, minHeight: 44 }}>arrow_back</button>
            <div>
              <p className="font-bold text-[15px] leading-none" style={{ color: '#ffb74d', fontFamily: '"Playfair Display", serif' }}>Events</p>
              <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(255,183,77,0.5)' }}>{EVENTS.length} upcoming</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 rounded-full"
            style={{ height: 36, background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb74d', ...FILL1 }}>workspace_premium</span>
            <span className="text-[11px] font-bold" style={{ color: '#ffb74d' }}>16 stamps available</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; setFilter(f) }}
              className="flex-shrink-0 rounded-full px-4 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                height: 34,
                background: filter === f ? '#ffb74d' : 'rgba(255,183,77,0.1)',
                color: filter === f ? '#0a0800' : 'rgba(255,183,77,0.7)',
                border: `1px solid ${filter === f ? '#ffb74d' : 'rgba(255,183,77,0.2)'}`,
              }}>
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ── What this does ─────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,183,77,0.07)', border: '1px solid rgba(255,183,77,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,183,77,0.5)' }}>Upcoming Experiences</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            RSVP to exclusive experiences, earn multiple stamps per event, and unlock access to VIP sessions, private dinners, and member summits.
          </p>
        </div>

        {/* ── Event Cards ─────────────────────────────────────── */}
        {filtered.map(e => <EventCard key={e.id} event={e} />)}

      </main>

      <PassportBottomNav active="events" />
    </div>
  )
}
