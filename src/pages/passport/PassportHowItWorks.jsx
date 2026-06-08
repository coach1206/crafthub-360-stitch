import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const STEPS = [
  {
    n: '01',
    icon: 'qr_code_scanner',
    title: 'Scan In',
    color: '#4a9eff',
    bg: '#0d1829',
    border: 'rgba(74,158,255,0.3)',
    body: 'When you arrive at a venue or event, scan the QR code to activate your passport session.',
    happensList: [
      'Your event session opens',
      'Your profile becomes active',
      'You can discover people nearby',
      'Your passport is ready to collect stamps',
    ],
    btnLabel: 'Start Scan',
    btnTo: '/passport/scan',
  },
  {
    n: '02',
    icon: 'badge',
    title: 'Build Your Passport',
    color: '#e9c176',
    bg: '#1a1208',
    border: 'rgba(233,193,118,0.3)',
    body: 'Complete your profile so the system understands who you are, what you do, what you are looking for, and what you can offer.',
    happensList: [
      'Name · Profession · Industry',
      'City · Goals · Interests',
      'What you are looking for',
      'What you can offer',
    ],
    btnLabel: 'Complete Profile',
    btnTo: '/passport/profile',
  },
  {
    n: '03',
    icon: 'contacts',
    title: 'Discover Members',
    color: '#66bb6a',
    bg: '#0a1a0d',
    border: 'rgba(102,187,106,0.3)',
    body: 'Use Directory to find people, brands, vendors, speakers, mentors, and professionals connected to the event or ecosystem.',
    happensList: [
      'Search by industry or interest',
      'View profiles and save members',
      'Request introductions',
      'See shared events and add to passport',
    ],
    btnLabel: 'Explore Directory',
    btnTo: '/passport/directory',
  },
  {
    n: '04',
    icon: 'hub',
    title: 'Match & Connect',
    color: '#ce93d8',
    bg: '#1a0a12',
    border: 'rgba(206,147,216,0.3)',
    body: 'Use Connections to see suggested matches based on your profile, goals, interests, event attendance, and shared opportunities.',
    happensList: [
      'See why you match with someone',
      'View mutual interests and events',
      'Connect, message, or save',
      'Scan to link passports instantly',
    ],
    btnLabel: 'View Matches',
    btnTo: '/passport/connections',
  },
  {
    n: '05',
    icon: 'workspace_premium',
    title: 'Earn Stamps',
    color: '#ffb74d',
    bg: '#1a1000',
    border: 'rgba(255,183,77,0.3)',
    body: 'Stamps are verified proof of participation. They show what you attended, who you connected with, and what milestones you reached.',
    happensList: [
      'Event Stamp · Connection Stamp',
      'Craft Stamp · VIP Stamp',
      'Achievement Stamp',
      'Verified Profile Stamp',
    ],
    btnLabel: 'View My Stamps',
    btnTo: '/passport/stamps',
  },
  {
    n: '06',
    icon: 'stars',
    title: 'Unlock Access',
    color: '#e9c176',
    bg: '#0d0d0d',
    border: 'rgba(233,193,118,0.3)',
    body: 'As your passport grows, you unlock rewards, status, and private opportunities that only verified members can access.',
    happensList: [
      'VIP access · Member pricing',
      'Private lounge access',
      'Priority reservations · Exclusive events',
      'Curated introductions · Brand perks',
    ],
    btnLabel: 'See Rewards',
    btnTo: '/passport/benefits',
  },
]

const WHY_MATTERS = [
  { icon: 'bookmark',   title: 'Remember who you met',       body: 'A verified record of who you met, where, and when — forever in your passport.' },
  { icon: 'timeline',  title: 'Build your relationship record', body: 'Your passport grows with every event, connection, and stamp you earn.' },
  { icon: 'psychology', title: 'Discover better matches',     body: 'Find people who match your goals before and during events with precision.' },
  { icon: 'lock_open', title: 'Unlock rewards & status',     body: 'Real participation earns real access — VIP, private events, and partner perks.' },
]

const SCAN_FLOW = [
  { n: 1, icon: 'qr_code_scanner', label: 'Open Scanner',          desc: 'Tap Scan in the bottom nav'          },
  { n: 2, icon: 'person_search',   label: 'Scan Member QR',        desc: 'Point your camera at their passport' },
  { n: 3, icon: 'preview',         label: 'Preview Profile',       desc: 'Their passport identity appears'     },
  { n: 4, icon: 'handshake',       label: 'Confirm Connection',    desc: 'Tap confirm to link passports'       },
  { n: 5, icon: 'workspace_premium', label: 'Earn Stamp',          desc: 'Both earn a Connection stamp'        },
  { n: 6, icon: 'save',            label: 'Save to Passport',      desc: 'They appear in your connections'     },
]

const DIR_SAMPLES = [
  { name: 'Michael Reynolds', role: 'Entrepreneur',     company: 'New York, NY',      init: 'MR', color: '#1e3a5f', tags: ['Tech', 'SaaS']      },
  { name: 'Alicia Chen',       role: 'Investor',         company: 'San Francisco, CA', init: 'AC', color: '#0d2818', tags: ['Investing', 'Impact'] },
]

const CONN_SAMPLES = [
  { name: 'David Harper',   role: 'Founder, North & Co.', type: 'Recent Connection', init: 'DH', color: '#1a0a12', pct: 94, reason: 'Shared goals in luxury hospitality' },
  { name: 'Sophia Martinez', role: 'Creative Director',  type: 'Saved Contact',      init: 'SM', color: '#2d0d1a', pct: 88, reason: 'Brand strategy and creative alignment' },
]

function StepCard({ step }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: step.bg, border: `1px solid ${step.border}`, boxShadow: `0 4px 32px ${step.color}0a` }}>

      {/* Step header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        onTouchStart={e => e.currentTarget.style.opacity = '0.8'}
        onTouchEnd={e => { e.currentTarget.style.opacity = ''; setOpen(o => !o) }}
        className="w-full flex items-center gap-4 px-5 active:opacity-80 transition-opacity"
        style={{ minHeight: 80 }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${step.color}18`, border: `2px solid ${step.color}45` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: step.color, ...FILL1 }}>{step.icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest" style={{ color: `${step.color}70` }}>STEP {step.n}</span>
          </div>
          <p className="font-bold text-[16px] leading-tight" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display",serif' }}>{step.title}</p>
        </div>
        <span className="material-symbols-outlined flex-shrink-0 transition-transform duration-300"
          style={{ fontSize: 20, color: `${step.color}60`, transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-5 pt-2 space-y-4">
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{step.body}</p>

          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
            {step.happensList.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(step.btnTo)}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(step.btnTo) }}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-[0.97] transition-all"
            style={{
              height: 64,
              background: `linear-gradient(135deg, ${step.color}30, ${step.color}18)`,
              border: `1px solid ${step.color}50`,
              color: step.color,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, ...FILL1 }}>{step.icon}</span>
            {step.btnLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default function PassportHowItWorks() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0805 0%, #100c06 50%, #080604 100%)' }}>

      {/* Warm ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'rgba(180,100,20,0.08)' }} />
      </div>

      {/* Background hero image — very subtle */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/passport-hero.png" alt="" className="w-full h-full object-cover object-top"
          style={{ opacity: 0.06, filter: 'blur(4px) saturate(0.5)' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(8,6,4,0.92)' }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-2xl border-b"
        style={{ height: 72, background: 'rgba(8,5,2,0.92)', borderColor: 'rgba(233,193,118,0.18)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')}
            className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
            style={{ color: '#e9c176', minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>How It Works</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>360 Passport Connection</p>
          </div>
        </div>
        <button onClick={() => navigate('/passport/scan')}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/scan') }}
          className="flex items-center gap-2 px-4 rounded-full active:scale-95 transition-all"
          style={{ height: 44, background: 'linear-gradient(135deg, #e9c176, #c5a059)', color: '#0a0805', fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, ...FILL1 }}>qr_code_scanner</span>
          <span className="text-[12px] uppercase tracking-wider">Scan Now</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── Hero intro ───────────────────────────────────── */}
        <section>
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, #1a1005, #2a1c0e)', border: '1px solid rgba(233,193,118,0.25)', boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #8b6914, #e9c176, #c5a059, #e9c176, #8b6914)' }} />
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(233,193,118,0.1)', border: '2px solid rgba(233,193,118,0.25)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#e9c176', ...FILL1 }}>public</span>
              </div>
              <h1 className="font-bold text-[26px] leading-tight mb-3" style={{ fontFamily: '"Playfair Display",serif', color: '#f0e6d0' }}>
                How 360 Passport Connection Works
              </h1>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '0 auto 16px' }}>
                360 Passport Connection helps you turn live event moments into verified connections, collectible stamps, profile history, rewards, and future opportunities.
              </p>
              {/* Value strip */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{ background: 'rgba(233,193,118,0.1)', border: '1px solid rgba(233,193,118,0.25)' }}>
                <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#e9c176' }}>Scan in · Meet people · Earn stamps · Unlock access</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── What is it box ──────────────────────────────── */}
        <section className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(233,193,118,0.5)' }}>What is 360 Passport Connection?</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            360 Passport Connection is your digital networking passport. It gives each member a living record of who they meet, where they connected, what events they attended, what experiences they completed, and what access they unlocked.
          </p>
        </section>

        {/* ── 6 Step Cards ───────────────────────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Your Journey · 6 Steps</p>
          <div className="space-y-3">
            {STEPS.map(step => <StepCard key={step.n} step={step} />)}
          </div>
        </section>

        {/* ── Why It Matters ──────────────────────────────── */}
        <section>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(18,12,5,0.9)', border: '1px solid rgba(233,193,118,0.18)' }}>
            <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(233,193,118,0.1)' }}>
              <p className="font-bold text-[18px] leading-none mb-2" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>Why This Matters</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Most networking dies after the handshake. 360 Passport Connection turns those moments into verified relationship history, follow-up opportunities, event memories, and unlockable access.
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y" style={{ '--tw-divide-color': 'rgba(233,193,118,0.08)' }}>
              {WHY_MATTERS.map((item) => (
                <div key={item.title} className="p-4">
                  <span className="material-symbols-outlined mb-2 block" style={{ fontSize: 22, color: '#e9c176', ...FILL1 }}>{item.icon}</span>
                  <p className="font-bold text-[13px] leading-tight mb-1" style={{ color: '#f0e6d0' }}>{item.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Scan to Connect Flow ────────────────────────── */}
        <section>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,15,25,0.9)', border: '1px solid rgba(74,158,255,0.2)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(74,158,255,0.1)' }}>
              <p className="font-bold text-[16px] leading-none" style={{ color: '#4a9eff', fontFamily: '"Playfair Display",serif' }}>Scan to Connect Flow</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Six steps from open to linked passport</p>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {SCAN_FLOW.map((s) => (
                <div key={s.n} className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center relative"
                    style={{ background: 'rgba(74,158,255,0.1)', border: '2px solid rgba(74,158,255,0.3)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#4a9eff', ...FILL1 }}>{s.icon}</span>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#4a9eff', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                      {s.n}
                    </div>
                  </div>
                  <p className="font-bold text-[11px] leading-tight" style={{ color: '#f0e6d0' }}>{s.label}</p>
                  <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/scan') }}
                className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-[0.97] transition-all"
                style={{ height: 64, background: 'linear-gradient(135deg, #4a9eff, #2d7ae0)', color: '#fff', boxShadow: '0 4px 20px rgba(74,158,255,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, ...FILL1 }}>qr_code_scanner</span>
                Start Scan Now
              </button>
            </div>
          </div>
        </section>

        {/* ── Directory — Live Sample ─────────────────────── */}
        <section>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,20,10,0.9)', border: '1px solid rgba(102,187,106,0.2)' }}>
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(102,187,106,0.1)' }}>
              <div>
                <p className="font-bold text-[16px] leading-none" style={{ color: '#66bb6a', fontFamily: '"Playfair Display",serif' }}>Directory</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Discover verified members near you</p>
              </div>
              <button onClick={() => navigate('/passport/directory')}
                onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
                onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate('/passport/directory') }}
                className="text-[11px] uppercase tracking-wider active:opacity-70"
                style={{ color: 'rgba(102,187,106,0.7)' }}>
                Browse all →
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              {DIR_SAMPLES.map(m => (
                <div key={m.name} className="rounded-xl flex items-center gap-4 px-4"
                  style={{ background: `${m.color}cc`, border: '1px solid rgba(102,187,106,0.15)', minHeight: 76 }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#f0e6d0', fontFamily: '"Playfair Display",serif' }}>{m.init}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px]" style={{ color: '#f0e6d0' }}>{m.name}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{m.role} · {m.company}</p>
                    <div className="flex gap-1.5 mt-1">
                      {m.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider"
                          style={{ background: 'rgba(102,187,106,0.15)', color: '#66bb6a', border: '1px solid rgba(102,187,106,0.25)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {['View Profile', 'Save'].map(lbl => (
                      <button key={lbl}
                        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
                        onTouchEnd={e => e.currentTarget.style.transform = ''}
                        onClick={() => navigate('/passport/directory')}
                        className="px-3 rounded-lg active:scale-90 transition-all text-[10px] font-bold uppercase tracking-wider"
                        style={{ height: 28, background: 'rgba(102,187,106,0.15)', border: '1px solid rgba(102,187,106,0.3)', color: '#66bb6a' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Connections — Live Sample ───────────────────── */}
        <section>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(20,8,14,0.9)', border: '1px solid rgba(206,147,216,0.2)' }}>
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(206,147,216,0.1)' }}>
              <div>
                <p className="font-bold text-[16px] leading-none" style={{ color: '#ce93d8', fontFamily: '"Playfair Display",serif' }}>Connections</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Your best matches right now</p>
              </div>
              <button onClick={() => navigate('/passport/connections')}
                onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
                onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate('/passport/connections') }}
                className="text-[11px] uppercase tracking-wider active:opacity-70"
                style={{ color: 'rgba(206,147,216,0.7)' }}>
                View all →
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              {CONN_SAMPLES.map(m => (
                <div key={m.name} className="rounded-xl overflow-hidden"
                  style={{ background: `${m.color}cc`, border: '1px solid rgba(206,147,216,0.15)' }}>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#f0e6d0', fontFamily: '"Playfair Display",serif' }}>{m.init}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] leading-tight" style={{ color: '#f0e6d0' }}>{m.name}</p>
                      <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(206,147,216,0.7)' }}>{m.type}</p>
                      <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[16px]" style={{ color: '#ce93d8', fontFamily: '"Playfair Display",serif' }}>{m.pct}%</p>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(206,147,216,0.5)' }}>Match</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 grid grid-cols-4 gap-2">
                    {['Connect', 'Message', 'Scan to Link', 'Save'].map(lbl => (
                      <button key={lbl}
                        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
                        onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/connections') }}
                        onClick={() => navigate('/passport/connections')}
                        className="rounded-lg flex items-center justify-center active:scale-90 transition-all text-[9px] font-bold uppercase tracking-wider text-center"
                        style={{ height: 40, background: 'rgba(206,147,216,0.12)', border: '1px solid rgba(206,147,216,0.25)', color: '#ce93d8' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────── */}
        <section className="pb-2">
          <div className="rounded-2xl p-6 text-center"
            style={{ background: 'linear-gradient(145deg, #1a1005, #2a1c0e)', border: '1px solid rgba(233,193,118,0.3)', boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
            <p className="font-bold text-[20px] leading-tight mb-2" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>Ready to start?</p>
            <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>Scan in, meet people, earn stamps, and unlock access — your passport is waiting.</p>
            <div className="space-y-3">
              <button onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/scan') }}
                className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[14px] uppercase tracking-wider active:scale-[0.97] transition-all"
                style={{ height: 72, background: 'linear-gradient(135deg, #e9c176, #c5a059)', color: '#0a0805', boxShadow: '0 4px 24px rgba(233,193,118,0.35)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, ...FILL1 }}>qr_code_scanner</span>
                Start Passport Session
              </button>
              <button onClick={() => navigate('/passport')}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport') }}
                className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-[0.97] transition-all"
                style={{ height: 56, background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.25)', color: '#e9c176' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>home</span>
                Back to Passport Hub
              </button>
            </div>
          </div>
        </section>

      </main>

      <PassportBottomNav active="hub" />
    </div>
  )
}
