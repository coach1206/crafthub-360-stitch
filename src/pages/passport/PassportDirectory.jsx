import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const CATEGORIES = ['All', 'Entrepreneurs', 'Executives', 'Creators', 'Investors', 'Speakers', 'Artisans', 'Mentors', 'Brands', 'Vendors']

const MEMBERS = [
  { id: 1,  name: 'Marcus Webb',     role: 'Venture Partner',     company: 'Apex Capital',       city: 'Atlanta, GA',     industry: ['Investing', 'FinTech'],   cat: 'Investors',     goal: 'Deal flow in hospitality tech',  mutual: 'Founder Summit 2025', verified: true, initials: 'MW', color: '#1e3a5f' },
  { id: 2,  name: 'Soleil Fontaine', role: 'Creative Director',   company: 'Noir Studio',        city: 'Miami, FL',       industry: ['Design', 'Luxury'],       cat: 'Creators',      goal: 'Brand partnerships',             mutual: 'Grand Lounge', verified: true, initials: 'SF', color: '#2d0d1a' },
  { id: 3,  name: 'James Okafor',    role: 'Founder & CEO',       company: 'Ember Labs',         city: 'Houston, TX',     industry: ['SaaS', 'Hospitality'],    cat: 'Entrepreneurs', goal: 'Strategic intros',               mutual: 'SmokeCraft Event', verified: true, initials: 'JO', color: '#0d2818' },
  { id: 4,  name: 'Priya Sharma',    role: 'Executive Speaker',   company: 'TED / Forbes',       city: 'New York, NY',    industry: ['Media', 'Leadership'],    cat: 'Speakers',      goal: 'Speaking engagements',           mutual: null, verified: true, initials: 'PS', color: '#1a1000' },
  { id: 5,  name: 'Dante Cruz',      role: 'Master Blender',      company: 'Cruz Tobacco Co.',   city: 'Havana, Cuba',    industry: ['Tobacco', 'Luxury'],      cat: 'Artisans',      goal: 'Distribution partners',          mutual: 'Grand Lounge', verified: true, initials: 'DC', color: '#3a1a00' },
  { id: 6,  name: 'Alexis Monroe',   role: 'Partner',             company: 'Blueprint Ventures', city: 'Los Angeles, CA', industry: ['Investing', 'Consumer'],  cat: 'Investors',     goal: 'Consumer brand opportunities',   mutual: null, verified: false, initials: 'AM', color: '#1e3a5f' },
  { id: 7,  name: 'Kwame Asante',    role: 'Brand Strategist',    company: 'Prestige Group',     city: 'Chicago, IL',     industry: ['Branding', 'Events'],     cat: 'Brands',        goal: 'Co-branded event opportunities', mutual: 'SmokeCraft Event', verified: true, initials: 'KA', color: '#1a0d1a' },
  { id: 8,  name: 'Naomi Delacroix', role: 'Executive Coach',     company: 'The Delacroix Firm', city: 'Nashville, TN',   industry: ['Coaching', 'Executive'],  cat: 'Mentors',       goal: 'High-performing clients',        mutual: null, verified: false, initials: 'ND', color: '#0d2818' },
  { id: 9,  name: 'Tariq Hassan',    role: 'Event Producer',      company: 'Luxe Events Co.',    city: 'Dallas, TX',      industry: ['Events', 'Luxury'],       cat: 'Vendors',       goal: 'Venue partnerships',             mutual: 'Grand Lounge', verified: true, initials: 'TH', color: '#1a1000' },
  { id: 10, name: 'Isabelle Roux',   role: 'Luxury Consultant',   company: 'Maison Roux',        city: 'Paris, France',   industry: ['Luxury', 'Retail'],       cat: 'Executives',    goal: 'US market entry',                mutual: null, verified: true, initials: 'IR', color: '#2d0d1a' },
]

function MemberCard({ member, onConnect }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: `${member.color}cc`, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>

      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[16px]"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[15px] leading-tight" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>{member.name}</p>
            {member.verified && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4caf50', ...FILL1 }}>verified</span>}
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{member.role}</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{member.company} · {member.city}</p>
        </div>
        <button onClick={() => setSaved(s => !s)}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onTouchEnd={e => e.currentTarget.style.transform = ''}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
          style={{ background: saved ? 'rgba(233,193,118,0.2)' : 'rgba(255,255,255,0.08)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: saved ? '#e9c176' : 'rgba(255,255,255,0.4)', ...(saved ? FILL1 : {}) }}>bookmark</span>
        </button>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {member.industry.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>{tag}</span>
        ))}
        {member.mutual && (
          <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
            style={{ background: 'rgba(76,175,80,0.2)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)' }}>
            Met at {member.mutual}
          </span>
        )}
      </div>

      {/* Goal */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Goal · </span>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{member.goal}</span>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {[
          { icon: 'person',           label: 'Profile',   action: 'view'    },
          { icon: 'people',           label: 'Request',   action: 'intro'   },
          { icon: 'add_to_photos',    label: 'Add',       action: 'add'     },
        ].map(btn => (
          <button key={btn.action}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onTouchEnd={e => { e.currentTarget.style.transform = ''; onConnect(member, btn.action) }}
            onClick={() => onConnect(member, btn.action)}
            className="rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            style={{ height: 56, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>{btn.icon}</span>
            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PassportDirectory() {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('All')
  const [toast, setToast]     = useState(null)

  const filtered = MEMBERS.filter(m => {
    const matchesCat    = cat === 'All' || m.cat === cat
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase()) || m.company.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  function handleConnect(member, action) {
    const msgs = { view: `Viewing ${member.name}'s profile`, intro: `Intro request sent to ${member.name}`, add: `${member.name} added to your Passport` }
    setToast(msgs[action] || `Action: ${action}`)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1a0d 0%, #050e06 100%)' }}>

      {/* Forest green ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-80 h-80 rounded-full blur-[120px]" style={{ background: 'rgba(26,90,40,0.2)' }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 z-[100] rounded-xl px-5 py-3 text-[13px] font-bold shadow-2xl"
          style={{ transform: 'translateX(-50%)', background: 'rgba(30,80,30,0.95)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.4)', backdropFilter: 'blur(12px)' }}>
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex flex-col px-5 backdrop-blur-xl border-b"
        style={{ background: 'rgba(5,14,6,0.9)', borderColor: 'rgba(76,175,80,0.2)' }}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
              style={{ color: '#66bb6a', minWidth: 44, minHeight: 44 }}>arrow_back</button>
            <div>
              <p className="font-bold text-[15px] leading-none" style={{ color: '#66bb6a', fontFamily: '"Playfair Display", serif' }}>Member Directory</p>
              <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(102,187,106,0.5)' }}>{filtered.length} members · Live</p>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4caf50', boxShadow: '0 0 8px #4caf50' }} />
        </div>

        {/* Search */}
        <div className="pb-3 flex items-center gap-3 rounded-xl px-4"
          style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.15)', height: 48, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'rgba(102,187,106,0.5)' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, or company…"
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: '#f0e6d0' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="material-symbols-outlined active:scale-90" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>close</button>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-5">

        {/* ── What this does ─────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(102,187,106,0.6)' }}>What this is</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Discover members, brands, and professionals that match your interests and goals. Request introductions, save contacts, and add people to your Passport network.
          </p>
        </div>

        {/* ── Category tabs ─────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; setCat(c) }}
              className="flex-shrink-0 rounded-full px-4 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                height: 36,
                background: cat === c ? '#4caf50' : 'rgba(76,175,80,0.1)',
                color: cat === c ? '#fff' : 'rgba(102,187,106,0.7)',
                border: `1px solid ${cat === c ? '#4caf50' : 'rgba(76,175,80,0.2)'}`,
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* ── Member Cards ─────────────────────────────────── */}
        {filtered.length > 0
          ? filtered.map(m => <MemberCard key={m.id} member={m} onConnect={handleConnect} />)
          : (
            <div className="rounded-xl p-12 flex flex-col items-center text-center"
              style={{ background: 'rgba(76,175,80,0.05)', border: '1px dashed rgba(76,175,80,0.15)' }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: 40, color: 'rgba(102,187,106,0.3)' }}>search_off</span>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No members found for "{search}"</p>
            </div>
          )
        }
      </main>

      <PassportBottomNav active="directory" />
    </div>
  )
}
