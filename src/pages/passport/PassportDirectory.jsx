import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings:"'FILL' 1" }
const GOLD = {
  background:'linear-gradient(135deg,#8b6914 0%,#e9c176 40%,#f5d98a 55%,#c5a059 75%,#8b6914 100%)',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
}

const MEMBERS = [
  { init:'MR', name:'Michael Reynolds', role:'Entrepreneur',    company:'North & Co.', city:'New York, NY',       bg:'#0d1829', active:true,  tags:['Tech','Innovation','Leadership'],       goals:'Scale B2B SaaS in hospitality',   shared:'Cigar & Cognac Night'    },
  { init:'AC', name:'Alicia Chen',       role:'Investor',        company:'Vertex Capital',city:'San Francisco, CA',bg:'#0d1a10', active:true,  tags:['Venture Capital','Impact','Brands'],    goals:'Invest in culture-first brands',  shared:'Capital & Culture Dinner' },
  { init:'DH', name:'David Harper',      role:'Brand Strategist',company:'Harper Brand Co.',city:'Austin, TX',    bg:'#1a0e29', active:false, tags:['Branding','Luxury','Hospitality'],       goals:'Launch premium brand studio',    shared:'Grand Opening Night'      },
  { init:'PS', name:'Priya Shah',        role:'Marketing Lead',  company:'Meridian Group', city:'New York, NY',   bg:'#291008', active:true,  tags:['Growth','Content','Partnerships'],      goals:'Build creator partnerships',     shared:'Cigar & Cognac Night'     },
  { init:'JC', name:'James Carter',      role:'Founder',         company:'Carta Labs',     city:'Miami, FL',      bg:'#081a10', active:false, tags:['Fintech','Partnerships','Networking'],  goals:'Expand fintech footprint',       shared:'—'                        },
  { init:'EM', name:'Elena Marchetti',   role:'Creative Director',company:'Studio M',      city:'Los Angeles, CA',bg:'#1a1229', active:true,  tags:['Creative','Luxury','Spaces'],          goals:'Design luxury experience brands',shared:'Capital & Culture Dinner'  },
  { init:'DK', name:'Daniel Kim',        role:'Product Strategist',company:'KimDAO',       city:'New York, NY',   bg:'#121808', active:true,  tags:['Web3','Strategy','Community'],         goals:'Launch DAO-based membership',    shared:'Grand Opening Night'      },
  { init:'LF', name:'Lorenzo Ferrari',   role:'Cigar Sommelier',  company:'Casa di Puros', city:'New York, NY',   bg:'#1a1208', active:false, tags:['Craft','Tobacco','Luxury'],           goals:'Educate on fine tobacco culture', shared:'Cigar & Cognac Night'     },
]

const FILTERS = ['All','Active Now','Investors','Founders','Creative','Craft','Tech']

export default function PassportDirectory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = MEMBERS.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q))
    const matchFilter = filter === 'All' || (filter === 'Active Now' && m.active)
      || m.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()))
      || m.role.toLowerCase().includes(filter.toLowerCase())
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#050e06,#081208,#040904)' }}>

      {/* Forest green leather ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 80% 50% at 30% 0%, rgba(20,80,30,0.2) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.005) 0,rgba(255,255,255,0.005) 1px,transparent 0,transparent 6px)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(4,10,5,0.96)', borderColor:'rgba(102,187,106,0.2)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(102,187,106,0.08)', border:'1px solid rgba(102,187,106,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#66bb6a' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ color:'#a8e6ac', fontFamily:'"Playfair Display",serif' }}>Directory</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(168,230,172,0.35)' }}>Discover verified members</p>
        </div>
        <div className="px-3 py-1.5 rounded-full"
          style={{ background:'rgba(102,187,106,0.1)', border:'1px solid rgba(102,187,106,0.25)' }}>
          <span className="font-bold text-[11px]" style={{ color:'#66bb6a' }}>View All (248)</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* ── Dossier cover ── */}
        <section>
          <div className="rounded-2xl overflow-hidden relative"
            style={{
              background:'linear-gradient(155deg,#081a09,#0a1e0b,#061408)',
              border:'2px solid rgba(102,187,106,0.3)',
              boxShadow:'0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(102,187,106,0.07)',
            }}>
            {/* Leather grain */}
            <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(45deg,rgba(255,255,255,0.008) 0,rgba(255,255,255,0.008) 1px,transparent 0,transparent 5px)' }} />
            {/* Gold top strip */}
            <div className="h-1" style={{ background:'linear-gradient(90deg,#2d5c14,#8bc34a,#66bb6a,#8bc34a,#2d5c14)' }} />
            <div className="p-5 relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(102,187,106,0.1)', border:'1.5px solid rgba(102,187,106,0.3)', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:28, color:'#66bb6a', ...FILL1 }}>contacts</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[20px] leading-none mb-1" style={{ color:'#a8e6ac', fontFamily:'"Playfair Display",serif' }}>Member Directory</p>
                <p className="text-[11px] leading-relaxed" style={{ color:'rgba(168,230,172,0.45)' }}>
                  Discover verified members, brands, vendors, speakers, mentors, and professionals who match your goals and share your world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Search bar ── */}
        <section>
          <div className="rounded-xl flex items-center gap-3 px-4"
            style={{ height:52, background:'rgba(102,187,106,0.06)', border:'1.5px solid rgba(102,187,106,0.2)' }}>
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize:20, color:'rgba(102,187,106,0.5)' }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, industry, role…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color:'#d4f0d6', caretColor:'#66bb6a' }} />
            {search && (
              <button onClick={() => setSearch('')} className="active:scale-90 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize:18, color:'rgba(102,187,106,0.4)' }}>close</span>
              </button>
            )}
          </div>
        </section>

        {/* ── Filter chips ── */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                className="flex-shrink-0 px-4 rounded-full font-bold text-[11px] uppercase tracking-wider active:scale-94 transition-all"
                style={{
                  height:36,
                  background: filter === f ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.04)',
                  border: filter === f ? '1.5px solid rgba(102,187,106,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: filter === f ? '#66bb6a' : 'rgba(255,255,255,0.4)',
                }}>
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* ── Member dossier cards ── */}
        <section className="space-y-3 pb-2">
          {filtered.map(m => (
            <div key={m.name} className="rounded-2xl overflow-hidden"
              style={{ background:`linear-gradient(155deg,${m.bg},${m.bg}dd)`, border:'1px solid rgba(102,187,106,0.18)', boxShadow:'0 6px 24px rgba(0,0,0,0.55)' }}>
              {/* Active badge strip */}
              {m.active && <div className="h-0.5" style={{ background:'linear-gradient(90deg,transparent,rgba(102,187,106,0.6),transparent)' }} />}
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-[18px]"
                      style={{ background:`${m.bg}`, color:'#d4f0d6', border:'2px solid rgba(102,187,106,0.25)', fontFamily:'"Playfair Display",serif', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                      {m.init}
                    </div>
                    {m.active && (
                      <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-2"
                        style={{ width:16, height:16, background:'#4caf50', borderColor:'rgba(4,10,5,0.8)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[15px] leading-tight" style={{ color:'#d4f0d6', fontFamily:'"Playfair Display",serif' }}>{m.name}</p>
                      <span className="material-symbols-outlined" style={{ fontSize:14, color:'#66bb6a', ...FILL1 }}>verified</span>
                    </div>
                    <p className="text-[11px]" style={{ color:'rgba(168,230,172,0.55)' }}>{m.role} · {m.company}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize:10, color:'rgba(102,187,106,0.4)' }}>location_on</span>
                      <p className="text-[10px]" style={{ color:'rgba(168,230,172,0.35)' }}>{m.city}</p>
                    </div>
                  </div>
                  {m.active && (
                    <div className="flex-shrink-0 px-2 py-1 rounded-full"
                      style={{ background:'rgba(102,187,106,0.12)', border:'1px solid rgba(102,187,106,0.3)' }}>
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#66bb6a' }}>Active Now</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {m.tags.map(t => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold"
                      style={{ background:'rgba(102,187,106,0.1)', border:'1px solid rgba(102,187,106,0.22)', color:'rgba(168,230,172,0.65)' }}>{t}</span>
                  ))}
                </div>

                {/* Goals + shared event */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg px-3 py-2" style={{ background:'rgba(0,0,0,0.2)' }}>
                    <p className="text-[8.5px] uppercase tracking-wider mb-0.5" style={{ color:'rgba(102,187,106,0.35)' }}>Goal</p>
                    <p className="text-[10px] leading-tight" style={{ color:'rgba(168,230,172,0.55)' }}>{m.goals}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ background:'rgba(0,0,0,0.2)' }}>
                    <p className="text-[8.5px] uppercase tracking-wider mb-0.5" style={{ color:'rgba(102,187,106,0.35)' }}>Shared Event</p>
                    <p className="text-[10px] leading-tight" style={{ color:'rgba(168,230,172,0.55)' }}>{m.shared}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label:'View Profile',  icon:'person'         },
                    { label:'Save',          icon:'bookmark'       },
                    { label:'Intro',         icon:'record_voice_over' },
                    { label:'Connect',       icon:'hub'            },
                  ].map(btn => (
                    <button key={btn.label}
                      onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                      onTouchEnd={e => e.currentTarget.style.transform=''}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl active:scale-93 transition-all"
                      style={{ height:56, background:'rgba(102,187,106,0.08)', border:'1px solid rgba(102,187,106,0.2)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:16, color:'#66bb6a', ...FILL1 }}>{btn.icon}</span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color:'rgba(168,230,172,0.6)' }}>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined" style={{ fontSize:40, color:'rgba(102,187,106,0.25)', ...FILL1 }}>search_off</span>
              <p className="mt-3 font-bold text-[14px]" style={{ color:'rgba(168,230,172,0.4)' }}>No members found</p>
              <p className="text-[11px] mt-1" style={{ color:'rgba(168,230,172,0.25)' }}>Try a different search or filter</p>
            </div>
          )}
        </section>

      </main>
      <PassportBottomNav active="directory" />
    </div>
  )
}
