import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Thermometer, Volume2, Users, Flame, CheckCircle2,
  LayoutGrid, BarChart3, Users2, MessageSquare, Plus,
  Bell, Send, RotateCcw, ChefHat, ClipboardList, UserPlus,
  MoreVertical, Clock, Radio, Utensils, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useSecurity } from '../context/SecurityContext.jsx'

const telemetry = [
  { label: 'Occupancy',    value: '68%',  change: '+12%', icon: <Users size={24} />,       tone: 'gold'  },
  { label: 'Foot Traffic', value: '142',  change: '+8%',  icon: <Users2 size={24} />,      tone: 'amber' },
  { label: 'Temp',         value: '21°C', change: '0%',   icon: <Thermometer size={24} />, tone: 'green' },
  { label: 'Noise',        value: '62dB', change: '-3%',  icon: <Volume2 size={24} />,     tone: 'gold'  },
]

const activeOrders = [
  { id: 1, title: 'Wagyu A5 Nigiri',          type: 'Amuse-Bouche', status: 'SERVED',  time: '7:14 PM', xp: '+80 XP',  image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?auto=format&fit=crop&q=90&w=600', tags: ['VIP TABLE', 'CHEF SPECIAL'] },
  { id: 2, title: 'Black Truffle Cappellaci',  type: 'Course I',     status: 'SERVED',  time: '7:26 PM', xp: '+120 XP', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=90&w=600', tags: ['TABLE 3', 'ALLERGY SAFE'] },
  { id: 3, title: 'Dry-Aged Duck Confit',      type: 'Course II',    status: 'FIRING',  time: '7:52 PM', xp: '+60 XP',  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=90&w=600', tags: ['TABLE 3', 'MEDIUM RARE'] },
]

const feedItems = [
  { label: '7 messages & 22 actions',  sub: '18 min ago', status: 'pulse'   },
  { label: 'Checkpoint made',          sub: '17 min ago', status: 'done'    },
  { label: 'Worked for 1 minute',      sub: 'now',        status: 'working' },
  { label: 'Pasted visually',          sub: '6 min ago',  status: 'doc'     },
  { label: '13 messages & 42 actions', sub: '6 min ago',  status: 'pulse'   },
  { label: 'Checkpoint made',          sub: '2 min ago',  status: 'done'    },
]

const dockActions = [
  { label: 'Floor Map',    sub: 'Live View',  icon: <LayoutGrid size={24} />    },
  { label: 'Table Status', sub: 'Real-time',  icon: <ClipboardList size={24} /> },
  { label: 'Waitlist',     sub: '8 Guests',   icon: <Users2 size={24} />        },
  { label: 'Staff Comms',  sub: 'Team Chat',  icon: <MessageSquare size={24} /> },
  { label: 'Tasks',        sub: '12 Active',  icon: <ClipboardList size={24} />  },
]

function TouchButton({ label, icon, badge, gold = false }) {
  return (
    <button className={`haptic-ready relative flex h-[64px] items-center gap-3 rounded-2xl border px-5 text-sm font-bold transition-all active:scale-95 ${
      gold
        ? 'border-[#f3cf7a]/45 bg-[#d9ad55]/20 text-[#f3cf7a] shadow-[0_0_24px_rgba(217,173,85,0.18)]'
        : 'border-white/10 bg-black/45 text-[#f7ead4] hover:border-[#d9ad55]/35 hover:text-[#f3cf7a]'
    }`}>
      <span className="text-[#f3cf7a]">{icon}</span>
      {label}
      {badge && (
        <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-[#d9ad55] text-xs font-black text-black">{badge}</span>
      )}
    </button>
  )
}

function OrderButton({ label, icon, gold = false }) {
  return (
    <button className={`haptic-ready flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-bold transition-all active:scale-95 ${
      gold
        ? 'border-[#f3cf7a]/45 bg-[#d9ad55]/15 text-[#f3cf7a]'
        : 'border-white/10 bg-black/45 text-[#f7ead4]/80 hover:border-[#d9ad55]/35 hover:text-[#f3cf7a]'
    }`}>
      {icon}
      {label}
    </button>
  )
}

export default function EATCommand() {
  const navigate   = useNavigate()
  const { role }   = useSecurity()
  const isManager  = ['manager', 'admin', 'founder_level_0'].includes(role)

  if (!isManager) {
    return (
      <div className="min-h-screen bg-[#050403] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full border border-[#d9ad55]/40 bg-[#d9ad55]/10 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-[#f3cf7a]" />
          </div>
          <h2 className="text-2xl font-bold text-[#f3cf7a] mb-3">Access Restricted</h2>
          <p className="text-[#a89b86] mb-6">E.A.T. Command requires manager-level access or higher.</p>
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl border border-[#d9ad55]/30 bg-[#d9ad55]/10 text-[#f3cf7a] font-bold transition-all hover:bg-[#d9ad55]/20 active:scale-95">
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050403] text-[#f7ead4]">

      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=90&w=2400')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(218,165,70,0.26),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.48),rgba(0,0,0,0.86)),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.92))]" />

      {/* Main 3-column frame */}
      <div className="relative z-10 grid min-h-screen grid-cols-[104px_320px_minmax(0,1fr)] gap-4 p-4 pb-6">

        {/* ── Icon Rail ─────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col items-center rounded-[28px] border border-[#d9ad55]/25 bg-black/55 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          {/* EAT logo at top of rail */}
          <div className="mt-5 mb-3 w-16 h-16 flex items-center justify-center">
            <img src="/eat-logo-nobg.png" alt="E.A.T." style={{ width: 52, height: 52, objectFit: 'contain' }} />
          </div>
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-[#d9ad55]/40 bg-[#d9ad55]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(217,173,85,0.22)]">
            <ShieldCheck className="text-[#f3cf7a]" size={22} />
          </div>

          {[<LayoutGrid size={26} />, <Utensils size={26} />, <Clock size={26} />, <Users2 size={26} />, <BarChart3 size={26} />, <MessageSquare size={26} />].map((icon, index) => (
            <button key={index} className={`haptic-ready mb-4 grid h-[72px] w-[72px] place-items-center rounded-2xl border transition-all active:scale-95 ${
              index === 0
                ? 'border-[#f3cf7a]/60 bg-[#d9ad55]/20 text-[#f3cf7a] shadow-[0_0_28px_rgba(217,173,85,0.26)]'
                : 'border-white/10 bg-white/[0.035] text-[#d8c8ad] hover:border-[#d9ad55]/40 hover:text-[#f3cf7a]'
            }`}>{icon}</button>
          ))}

          {/* Back button at bottom of rail */}
          <div className="mt-auto mb-5">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="haptic-ready grid h-[72px] w-[72px] place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-[#d8c8ad] hover:border-[#d9ad55]/40 hover:text-[#f3cf7a] transition-all active:scale-95" title="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>arrow_back</span>
            </button>
          </div>
        </aside>

        {/* ── Operations Feed ────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col rounded-[28px] border border-[#d9ad55]/25 bg-black/55 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.62)]">
          <div className="border-b border-[#d9ad55]/20 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#d9ad55]/35 bg-[#d9ad55]/15 overflow-hidden">
                <img src="/eat-logo-nobg.png" alt="EAT" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-wide text-[#f3cf7a]">E.A.T. COMMAND</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d9ad55]">Venue OS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d9ad55]">Operations Feed</p>
              <span className="flex items-center gap-2 text-xs text-[#c9f7c5]">
                <span className="h-2 w-2 rounded-full bg-[#52dd68] shadow-[0_0_16px_rgba(82,221,104,0.8)]" />
                Live
              </span>
            </div>

            <div className="space-y-3">
              {feedItems.map((item, index) => (
                <motion.button key={item.label + index}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="haptic-ready w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:border-[#d9ad55]/35 hover:bg-[#d9ad55]/10 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-full border ${
                      item.status === 'done'
                        ? 'border-green-400/30 bg-green-500/10 text-green-300'
                        : item.status === 'doc'
                        ? 'border-[#d9ad55]/30 bg-[#d9ad55]/10 text-[#f3cf7a]'
                        : 'border-white/15 bg-black/30 text-[#d8c8ad]'
                    }`}>
                      {item.status === 'done' ? <CheckCircle2 size={16} /> : item.status === 'doc' ? <ClipboardList size={16} /> : <Radio size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#f7ead4]">{item.label}</p>
                      <p className="mt-1 text-xs text-[#a89b86]">{item.sub}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <button className="haptic-ready mt-5 h-14 w-full rounded-2xl border border-[#d9ad55]/25 bg-black/35 text-sm font-bold text-[#d9ad55] transition-all hover:bg-[#d9ad55]/10 active:scale-[0.98]">
              Scroll to latest
            </button>
          </div>

          <div className="m-5 rounded-3xl border border-[#d9ad55]/25 bg-[#120d06]/75 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9ad55]">Operation Queue</p>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d9ad55]/25 text-xs font-black text-[#f3cf7a]">3</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-[#f7ead4]/80">Premium tactile command mode active. All systems nominal.</p>
            <div className="flex gap-2">
              <button className="haptic-ready h-12 flex-1 rounded-xl border border-white/10 bg-black/40 text-xs font-bold text-[#d8c8ad] active:scale-95">Plan</button>
              <button className="haptic-ready h-12 w-14 rounded-xl bg-gradient-to-br from-[#f3cf7a] to-[#9c6420] text-black shadow-[0_0_24px_rgba(217,173,85,0.28)] active:scale-95 flex items-center justify-center">
                <Send size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────────────── */}
        <main className="col-span-3 lg:col-span-2 xl:col-span-1 overflow-hidden rounded-[32px] border border-[#d9ad55]/25 bg-black/45 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.72)]">

          {/* Hero Header */}
          <header className="relative overflow-hidden border-b border-[#d9ad55]/20">
            <div className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=90&w=1800')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/35" />

            <div className="relative z-10 flex min-h-[220px] flex-col justify-between p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {/* Mobile back button */}
                  <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="xl:hidden mb-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d9ad55]/30 bg-black/50 text-[#f3cf7a] text-sm font-bold active:scale-95 transition-all">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                    BACK
                  </button>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.36em] text-[#d9ad55]">Venue Intelligence System</p>
                  <h1 className="font-serif text-5xl font-semibold leading-none text-[#fff5df] md:text-7xl">
                    E.A.T. <span className="text-[#f3cf7a]">Command</span>
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#f7ead4]/80 md:text-base">
                    <span className="h-2 w-2 rounded-full bg-[#f3cf7a]" />
                    Executive Venue Operations Dashboard
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TouchButton label="Alerts"    icon={<Bell size={18} />}      badge="3" />
                  <TouchButton label="Invite"    icon={<UserPlus size={18} />}            />
                  <TouchButton label="Republish" icon={<Sparkles size={18} />}  gold      />
                  <button className="haptic-ready grid h-[64px] w-[64px] place-items-center rounded-2xl border border-[#d9ad55]/30 bg-black/45 text-[#f3cf7a] backdrop-blur-xl active:scale-95">
                    <MoreVertical size={22} />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">● Live</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-bold text-[#f7ead4]/80">
                  {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-4 py-2 text-sm font-bold text-[#f3cf7a]">Grand Lounge</span>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5 md:p-6">

            {/* Telemetry */}
            <section className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.26em] text-[#d9ad55]">
                  <Activity size={16} /> Live Venue Telemetry
                </h2>
                <button className="haptic-ready hidden h-12 rounded-2xl border border-[#d9ad55]/25 bg-black/35 px-5 text-sm font-bold text-[#f3cf7a] active:scale-95 md:flex md:items-center md:gap-2">
                  <BarChart3 size={18} /> View Analytics
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {telemetry.map((item, i) => (
                  <motion.div key={item.label}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="haptic-ready group rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.48)] transition-all hover:border-[#d9ad55]/40 hover:bg-[#d9ad55]/10 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[#d9ad55]/30 bg-black/45 shadow-[inset_0_0_30px_rgba(217,173,85,0.12),0_0_30px_rgba(217,173,85,0.12)] flex-shrink-0">
                        <div className="absolute inset-2 rounded-full border-4 border-[#d9ad55]/35 border-t-[#f3cf7a]" />
                        <span className="font-serif text-xl font-bold text-[#f3cf7a]">{item.value}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 text-[#d9ad55]">{item.icon}</div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f7ead4]/70">{item.label}</p>
                        <p className={`mt-2 text-sm font-black ${item.change.startsWith('-') ? 'text-[#f3cf7a]' : item.change.startsWith('+') ? 'text-green-300' : 'text-[#a89b86]'}`}>
                          {item.change}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Fire Orders */}
            <section className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#d9ad55]">
                  <Flame size={16} /> Fire Order — Table 3 Active
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">3 Items</span>
                  <span className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-3 py-2 text-xs font-bold text-[#f3cf7a]">Auto Priority</span>
                </div>
              </div>

              <div className="space-y-4">
                {activeOrders.map((order, i) => (
                  <motion.article key={order.id}
                    initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                    className="group grid gap-4 rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.5)] transition-all hover:border-[#d9ad55]/35 hover:bg-[#d9ad55]/[0.07] md:grid-cols-[72px_180px_minmax(0,1fr)_150px_280px]"
                  >
                    <div className={`grid h-[72px] w-[72px] place-items-center rounded-full border text-2xl font-black flex-shrink-0 ${
                      order.status === 'FIRING'
                        ? 'border-[#f3a33a]/50 bg-[#f3a33a]/15 text-[#ffbd67] shadow-[0_0_26px_rgba(243,163,58,0.25)]'
                        : 'border-green-400/40 bg-green-500/15 text-green-300 shadow-[0_0_26px_rgba(82,221,104,0.16)]'
                    }`}>
                      {order.id}
                    </div>

                    <div className="h-[112px] overflow-hidden rounded-2xl border border-[#d9ad55]/20 bg-black/40">
                      <img src={order.image} alt={order.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>

                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9ad55]/80">{order.type}</p>
                      <h3 className="mt-1 font-serif text-2xl font-semibold text-[#fff5df]">{order.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.tags.map(tag => (
                          <span key={tag} className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f3cf7a]">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <span className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                        order.status === 'SERVED'
                          ? 'border-green-400/25 bg-green-500/10 text-green-300'
                          : 'border-[#f3a33a]/30 bg-[#f3a33a]/10 text-[#ffbd67]'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-sm text-[#a89b86]">{order.time}</p>
                      <p className="text-xs font-black text-[#d9ad55]">{order.xp}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <OrderButton label="Details"    icon={<ClipboardList size={20} />}  />
                      <OrderButton label="Message"    icon={<MessageSquare size={20} />}  />
                      <OrderButton label="Mark Again" icon={<RotateCcw size={20} />} gold />
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>

            {/* Bottom Command Dock */}
            <section className="grid gap-4 xl:grid-cols-[1fr_260px]">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {dockActions.map(action => (
                  <button key={action.label} className="haptic-ready min-h-[86px] rounded-3xl border border-[#d9ad55]/25 bg-black/50 p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-[#f3cf7a]/50 hover:bg-[#d9ad55]/10 active:scale-[0.98]">
                    <div className="mb-2 text-[#f3cf7a]">{action.icon}</div>
                    <p className="font-bold text-[#fff5df]">{action.label}</p>
                    <p className="text-xs text-[#a89b86]">{action.sub}</p>
                  </button>
                ))}
              </div>

              <button className="haptic-ready min-h-[86px] rounded-3xl border border-[#f3cf7a]/45 bg-gradient-to-br from-[#f3cf7a] via-[#d9ad55] to-[#8b5b1f] p-5 text-left text-black shadow-[0_0_40px_rgba(217,173,85,0.28)] transition-all hover:brightness-110 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <Plus size={34} />
                  <div>
                    <p className="font-serif text-2xl font-bold">New Order</p>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-black/60">Quick Create</p>
                  </div>
                </div>
              </button>
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}
