import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Thermometer, Volume2, Users, Flame, CheckCircle2,
  LayoutGrid, BarChart3, Users2, MessageSquare, Plus,
  Bell, Send, ChefHat, ClipboardList, UserPlus,
  MoreVertical, Clock, Utensils, ShieldCheck, Sparkles,
  Coffee, DoorOpen, CreditCard, Star,
} from 'lucide-react'
import { useSecurity } from '../context/SecurityContext.jsx'

const telemetry = [
  { label: 'Occupancy',    value: '68%',  change: '+12%', icon: <Users size={22} />,       tone: 'gold'  },
  { label: 'Foot Traffic', value: '142',  change: '+8%',  icon: <Users2 size={22} />,      tone: 'amber' },
  { label: 'Temp',         value: '21°C', change: '0%',   icon: <Thermometer size={22} />, tone: 'green' },
  { label: 'Noise',        value: '62dB', change: '-3%',  icon: <Volume2 size={22} />,     tone: 'gold'  },
]

const staffFeed = [
  { id: 1, staff: 'Aria Chen',    role: 'Server',    action: 'Seated Table 5',         detail: '4 guests · Section A', time: '2m ago',  type: 'seat',    active: true  },
  { id: 2, staff: 'Marcus Webb',  role: 'Server',    action: 'Fired Course II',         detail: 'Table 3 · Duck Confit', time: '5m ago',  type: 'fire',    active: true  },
  { id: 3, staff: 'Keiko Tanaka', role: 'Bartender', action: 'Bar Check Sent',          detail: 'Table 7 · 3 pours',     time: '8m ago',  type: 'bar',     active: true  },
  { id: 4, staff: 'Devon Mills',  role: 'Host',      action: 'Reservation Confirmed',   detail: 'Table 2 · 7:45 PM',     time: '11m ago', type: 'reserve', active: false },
  { id: 5, staff: 'Aria Chen',    role: 'Server',    action: 'Check Closed',            detail: 'Table 1 · $142',        time: '14m ago', type: 'close',   active: false },
  { id: 6, staff: 'Chef Torres',  role: 'Exec Chef', action: 'Course III Ready',        detail: 'Table 3 · Truffle',     time: '16m ago', type: 'ready',   active: false },
  { id: 7, staff: 'Lena Park',    role: 'Server',    action: 'Manager Override Applied',detail: 'Table 6 · 15% discount',time: '22m ago', type: 'override',active: false },
]

const floorTables = [
  { id: 'T1', num: 'T1', zone: 'Main',  seats: 2, status: 'occupied',  server: 'Aria',   check: '$142' },
  { id: 'T2', num: 'T2', zone: 'Main',  seats: 4, status: 'reserved',  server: 'Devon',  check: null   },
  { id: 'T3', num: 'T3', zone: 'VIP',   seats: 6, status: 'occupied',  server: 'Marcus', check: '$387' },
  { id: 'T4', num: 'T4', zone: 'Main',  seats: 4, status: 'available', server: null,     check: null   },
  { id: 'T5', num: 'T5', zone: 'Patio', seats: 4, status: 'occupied',  server: 'Aria',   check: '$89'  },
  { id: 'T6', num: 'T6', zone: 'Main',  seats: 6, status: 'available', server: null,     check: null   },
  { id: 'T7', num: 'T7', zone: 'Bar',   seats: 2, status: 'occupied',  server: 'Keiko',  check: '$67'  },
  { id: 'T8', num: 'T8', zone: 'Patio', seats: 6, status: 'reserved',  server: 'Devon',  check: null   },
]

const activeOrders = [
  { id: 1, title: 'Wagyu A5 Nigiri',         type: 'Amuse-Bouche', status: 'SERVED',  table: 'T3', time: '7:14 PM', xp: '+80 XP',  image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?auto=format&fit=crop&q=90&w=600', tags: ['VIP TABLE','CHEF SPECIAL'] },
  { id: 2, title: 'Black Truffle Cappellaci', type: 'Course I',     status: 'SERVED',  table: 'T3', time: '7:26 PM', xp: '+120 XP', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=90&w=600', tags: ['TABLE 3','ALLERGY SAFE'] },
  { id: 3, title: 'Dry-Aged Duck Confit',     type: 'Course II',    status: 'FIRING',  table: 'T3', time: '7:52 PM', xp: '+60 XP',  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=90&w=600', tags: ['TABLE 3','MEDIUM RARE'] },
]

const statusColors = {
  occupied:  { border: 'rgba(212,175,55,0.5)',  bg: 'rgba(212,175,55,0.1)',  text: '#D4AF37', dot: '#D4AF37' },
  available: { border: 'rgba(90,154,90,0.5)',   bg: 'rgba(90,154,90,0.1)',   text: '#5A9A5A', dot: '#5A9A5A' },
  reserved:  { border: 'rgba(120,120,200,0.4)', bg: 'rgba(120,120,200,0.08)',text: '#9090D0', dot: '#9090D0' },
}

const feedTypeStyle = {
  seat:     { color: '#5A9A5A',  icon: <DoorOpen size={15} /> },
  fire:     { color: '#E07B39',  icon: <Flame size={15} />    },
  bar:      { color: '#7BA7D4',  icon: <Coffee size={15} />   },
  reserve:  { color: '#9090D0',  icon: <Clock size={15} />    },
  close:    { color: '#D4AF37',  icon: <CreditCard size={15} />},
  ready:    { color: '#52dd68',  icon: <ChefHat size={15} />  },
  override: { color: '#E05A5A',  icon: <ShieldCheck size={15} />},
}

const TABS = [
  { key: 'floor', label: 'Floor Overview', icon: <LayoutGrid size={15} /> },
  { key: 'fire',  label: 'Fire Orders',    icon: <Flame size={15} />      },
  { key: 'staff', label: 'Staff Activity', icon: <Users2 size={15} />     },
]

function TouchButton({ label, icon, badge, gold = false, onClick }) {
  return (
    <button onClick={onClick} className={`haptic-ready relative flex h-[64px] items-center gap-3 rounded-2xl border px-5 text-sm font-bold transition-all active:scale-95 ${
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

export default function EATCommand() {
  const navigate  = useNavigate()
  const { role }  = useSecurity()
  const isManager = ['manager','admin','founder_level_0'].includes(role)

  const [activeTab, setActiveTab]         = useState('floor')
  const [selectedTable, setSelectedTable] = useState(null)
  const [alertsOpen, setAlertsOpen]       = useState(false)
  const [alerts, setAlerts]               = useState([
    { id: 1, msg: 'Table 3 — Course III due in 4 min', read: false },
    { id: 2, msg: 'Noise level above 70dB threshold',  read: false },
    { id: 3, msg: 'Waitlist: 3 parties (est. 25 min)', read: false },
  ])
  const unread = alerts.filter(a => !a.read).length

  function dismissAlert(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

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

      <div className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=90&w=2400')" }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(218,165,70,0.26),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.48),rgba(0,0,0,0.86)),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.92))]" />

      <div className="relative z-10 grid min-h-screen grid-cols-[104px_320px_minmax(0,1fr)] gap-4 p-4 pb-6">

        {/* ── Icon Rail ─────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col items-center rounded-[28px] border border-[#d9ad55]/25 bg-black/55 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <div className="mt-5 mb-3 w-16 h-16 flex items-center justify-center">
            <img src="/eat-logo-nobg.png" alt="E.A.T." style={{ width: 52, height: 52, objectFit: 'contain' }} />
          </div>
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-[#d9ad55]/40 bg-[#d9ad55]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(217,173,85,0.22)]">
            <ShieldCheck className="text-[#f3cf7a]" size={22} />
          </div>

          {[
            { icon: <LayoutGrid size={26} />, tab: 'floor' },
            { icon: <Utensils size={26} />,   tab: 'fire'  },
            { icon: <Clock size={26} />,       tab: null    },
            { icon: <Users2 size={26} />,      tab: 'staff' },
            { icon: <BarChart3 size={26} />,   tab: null    },
            { icon: <MessageSquare size={26} />,tab: null   },
          ].map(({ icon, tab }, index) => (
            <button key={index}
              onClick={() => tab && setActiveTab(tab)}
              className={`haptic-ready mb-4 grid h-[72px] w-[72px] place-items-center rounded-2xl border transition-all active:scale-95 ${
                (tab && activeTab === tab)
                  ? 'border-[#f3cf7a]/60 bg-[#d9ad55]/20 text-[#f3cf7a] shadow-[0_0_28px_rgba(217,173,85,0.26)]'
                  : 'border-white/10 bg-white/[0.035] text-[#d8c8ad] hover:border-[#d9ad55]/40 hover:text-[#f3cf7a]'
              }`}>{icon}
            </button>
          ))}

          <div className="mt-auto mb-5">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="haptic-ready grid h-[72px] w-[72px] place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-[#d8c8ad] hover:border-[#d9ad55]/40 hover:text-[#f3cf7a] transition-all active:scale-95" title="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>arrow_back</span>
            </button>
          </div>
        </aside>

        {/* ── Staff Activity Sidebar ─────────────────────────── */}
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

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d9ad55]">Staff Activity</p>
              <span className="flex items-center gap-2 text-xs text-[#c9f7c5]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#52dd68] shadow-[0_0_16px_rgba(82,221,104,0.8)]" />
                Live
              </span>
            </div>

            <div className="space-y-3">
              {staffFeed.map((item, index) => {
                const style = feedTypeStyle[item.type] || feedTypeStyle.seat
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="grid h-9 w-9 place-items-center rounded-full border"
                          style={{ borderColor: style.color + '40', background: style.color + '15', color: style.color }}>
                          {style.icon}
                        </div>
                        {item.active && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#52dd68] border-2 border-black animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#f7ead4]">{item.action}</p>
                        <p className="text-xs text-[#a89b86] mt-0.5">{item.detail}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: style.color }}>{item.staff}</span>
                          <span className="text-[10px] text-[#5a5a5a]">·</span>
                          <span className="text-[10px] text-[#5a5a5a]">{item.role}</span>
                          <span className="ml-auto text-[10px] text-[#5a5a5a]">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="m-5 rounded-3xl border border-[#d9ad55]/25 bg-[#120d06]/75 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9ad55]">On Floor Now</p>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d9ad55]/25 text-xs font-black text-[#f3cf7a]">4</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Aria', 'Marcus', 'Keiko', 'Devon'].map(name => (
                <span key={name} className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-3 py-1 text-[10px] font-bold text-[#f3cf7a]">{name}</span>
              ))}
            </div>
            <button className="haptic-ready mt-4 h-12 w-full rounded-xl border border-[#d9ad55]/25 bg-black/35 text-xs font-bold text-[#d9ad55] flex items-center justify-center gap-2 active:scale-95">
              <MessageSquare size={14} /> Message Team
            </button>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────── */}
        <main className="col-span-3 lg:col-span-2 xl:col-span-1 overflow-y-auto rounded-[32px] border border-[#d9ad55]/25 bg-black/45 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.72)]">

          {/* Hero Header */}
          <header className="relative overflow-hidden border-b border-[#d9ad55]/20">
            <div className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=90&w=1800')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/35" />

            <div className="relative z-10 flex min-h-[200px] flex-col justify-between p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="xl:hidden mb-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d9ad55]/30 bg-black/50 text-[#f3cf7a] text-sm font-bold active:scale-95 transition-all">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                    BACK
                  </button>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.36em] text-[#d9ad55]">Venue Intelligence System</p>
                  <h1 className="font-serif text-5xl font-semibold leading-none text-[#fff5df] md:text-7xl">
                    E.A.T. <span className="text-[#f3cf7a]">Command</span>
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TouchButton label="Alerts" icon={<Bell size={18} />} badge={unread > 0 ? unread : null} onClick={() => setAlertsOpen(true)} />
                  <TouchButton label="Invite" icon={<UserPlus size={18} />} />
                  <TouchButton label="Republish" icon={<Sparkles size={18} />} gold />
                  <button className="haptic-ready grid h-[64px] w-[64px] place-items-center rounded-2xl border border-[#d9ad55]/30 bg-black/45 text-[#f3cf7a] backdrop-blur-xl active:scale-95">
                    <MoreVertical size={22} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">● Live</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-bold text-[#f7ead4]/80">
                  {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-4 py-2 text-sm font-bold text-[#f3cf7a]">Grand Lounge</span>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5 md:p-6">

            {/* Live Telemetry */}
            <section className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.26em] text-[#d9ad55]">
                  <Activity size={16} /> Live Venue Telemetry
                </h2>
                <button className="haptic-ready hidden h-10 rounded-xl border border-[#d9ad55]/25 bg-black/35 px-4 text-xs font-bold text-[#f3cf7a] active:scale-95 md:flex md:items-center md:gap-2">
                  <BarChart3 size={15} /> Analytics
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {telemetry.map((item, i) => (
                  <motion.div key={item.label}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="group rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.48)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative grid h-20 w-20 flex-shrink-0 place-items-center rounded-full border border-[#d9ad55]/30 bg-black/45 shadow-[inset_0_0_30px_rgba(217,173,85,0.12)]">
                        <div className="absolute inset-2 rounded-full border-4 border-[#d9ad55]/35 border-t-[#f3cf7a]" />
                        <span className="font-serif text-lg font-bold text-[#f3cf7a]">{item.value}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 text-[#d9ad55]">{item.icon}</div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7ead4]/70">{item.label}</p>
                        <p className={`mt-1 text-sm font-black ${item.change.startsWith('-') ? 'text-[#f3cf7a]' : item.change.startsWith('+') ? 'text-green-300' : 'text-[#a89b86]'}`}>
                          {item.change}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Tab selector */}
            <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`haptic-ready flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-[0.18em] transition-all active:scale-95 ${
                    activeTab === t.key
                      ? 'bg-[#d9ad55]/20 border border-[#f3cf7a]/40 text-[#f3cf7a] shadow-[0_0_18px_rgba(217,173,85,0.18)]'
                      : 'text-[#a89b86] hover:text-[#f3cf7a]'
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── Floor Overview Tab ─────────────────────────── */}
            <AnimatePresence mode="wait">
              {activeTab === 'floor' && (
                <motion.section key="floor"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 backdrop-blur-2xl"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#d9ad55]">
                      <LayoutGrid size={16} /> Floor Status Overview
                    </h2>
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1.5 text-[#D4AF37]"><span className="h-2 w-2 rounded-full bg-[#D4AF37]" />Occupied</span>
                      <span className="flex items-center gap-1.5 text-[#5A9A5A]"><span className="h-2 w-2 rounded-full bg-[#5A9A5A]" />Available</span>
                      <span className="flex items-center gap-1.5 text-[#9090D0]"><span className="h-2 w-2 rounded-full bg-[#9090D0]" />Reserved</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {floorTables.map((t, i) => {
                      const sc = statusColors[t.status] || statusColors.available
                      const isSelected = selectedTable?.id === t.id
                      return (
                        <motion.button key={t.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedTable(isSelected ? null : t)}
                          className="haptic-ready rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
                          style={{
                            border: isSelected ? `2px solid ${sc.dot}` : `1px solid ${sc.border}`,
                            background: isSelected ? sc.bg + 'cc' : sc.bg,
                            boxShadow: isSelected ? `0 0 20px ${sc.dot}33` : 'none',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-base font-black" style={{ color: sc.text }}>{t.num}</span>
                            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: sc.dot }} />
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: sc.text + 'aa' }}>{t.zone}</div>
                          <div className="mt-1 text-[9px] text-[#5a5a5a]">{t.seats} seats</div>
                          {t.server && <div className="mt-1 text-[9px] text-[#7a7a7a]">{t.server}</div>}
                          {t.check && <div className="mt-1.5 text-xs font-black text-[#f3cf7a]">{t.check}</div>}
                          <div className="mt-2 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] inline-block"
                            style={{ background: sc.dot + '20', color: sc.dot }}>
                            {t.status}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Table detail expand */}
                  <AnimatePresence>
                    {selectedTable && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden rounded-2xl border border-[#d9ad55]/30 bg-[#0d0a05]/80 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d9ad55] mb-1">
                              {selectedTable.num} · {selectedTable.zone} Zone
                            </p>
                            <h3 className="font-serif text-2xl font-bold text-[#fff5df]">
                              {selectedTable.status === 'occupied' ? 'Table In Use' : selectedTable.status === 'reserved' ? 'Upcoming Reservation' : 'Table Available'}
                            </h3>
                            {selectedTable.server && (
                              <p className="mt-1 text-sm text-[#a89b86]">Server: <span className="text-[#f3cf7a] font-bold">{selectedTable.server}</span></p>
                            )}
                            {selectedTable.check && (
                              <p className="mt-1 text-sm text-[#a89b86]">Current Check: <span className="text-[#f3cf7a] font-bold">{selectedTable.check}</span></p>
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a89b86] mb-2">Seats</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: selectedTable.seats }, (_, i) => (
                                <div key={i} className="grid h-9 w-9 place-items-center rounded-full border border-[#d9ad55]/30 bg-[#d9ad55]/10 text-xs font-black text-[#f3cf7a]">
                                  {i + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedTable.status === 'available' && (
                            <button className="haptic-ready h-10 rounded-xl border border-[#d9ad55]/30 bg-[#d9ad55]/15 px-4 text-xs font-black text-[#f3cf7a] active:scale-95">
                              + Open Check
                            </button>
                          )}
                          {selectedTable.status === 'occupied' && (
                            <>
                              <button className="haptic-ready h-10 rounded-xl border border-[#f3a33a]/30 bg-[#f3a33a]/10 px-4 text-xs font-black text-[#ffbd67] active:scale-95 flex items-center gap-2">
                                <Flame size={13} /> Fire Next Course
                              </button>
                              <button className="haptic-ready h-10 rounded-xl border border-[#d9ad55]/25 bg-black/30 px-4 text-xs font-black text-[#d9ad55] active:scale-95 flex items-center gap-2">
                                <CreditCard size={13} /> View Check
                              </button>
                            </>
                          )}
                          {selectedTable.status === 'reserved' && (
                            <button className="haptic-ready h-10 rounded-xl border border-[#9090D0]/30 bg-[#9090D0]/10 px-4 text-xs font-black text-[#9090D0] active:scale-95">
                              Seat Reservation
                            </button>
                          )}
                          <button onClick={() => setSelectedTable(null)} className="haptic-ready h-10 rounded-xl border border-white/10 bg-black/30 px-4 text-xs font-black text-[#a89b86] active:scale-95 ml-auto">
                            Close ✕
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floor summary */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Occupied', count: floorTables.filter(t => t.status === 'occupied').length,  color: '#D4AF37' },
                      { label: 'Available',count: floorTables.filter(t => t.status === 'available').length, color: '#5A9A5A' },
                      { label: 'Reserved', count: floorTables.filter(t => t.status === 'reserved').length,  color: '#9090D0' },
                    ].map(s => (
                      <div key={s.label} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                        <div className="text-3xl font-black" style={{ color: s.color }}>{s.count}</div>
                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#a89b86]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Fire Orders Tab ─────────────────────────── */}
              {activeTab === 'fire' && (
                <motion.section key="fire"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 backdrop-blur-2xl"
                >
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
                        initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="group grid gap-4 rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-4 transition-all hover:border-[#d9ad55]/35 md:grid-cols-[72px_160px_minmax(0,1fr)_140px_240px]"
                      >
                        <div className={`grid h-[72px] w-[72px] place-items-center rounded-full border text-2xl font-black flex-shrink-0 ${
                          order.status === 'FIRING'
                            ? 'border-[#f3a33a]/50 bg-[#f3a33a]/15 text-[#ffbd67] shadow-[0_0_26px_rgba(243,163,58,0.25)]'
                            : 'border-green-400/40 bg-green-500/15 text-green-300'
                        }`}>{order.id}</div>

                        <div className="h-[100px] overflow-hidden rounded-2xl border border-[#d9ad55]/20 bg-black/40">
                          <img src={order.image} alt={order.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>

                        <div className="flex min-w-0 flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9ad55]/80">{order.type}</p>
                          <h3 className="mt-1 font-serif text-xl font-semibold text-[#fff5df]">{order.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.tags.map(tag => (
                              <span key={tag} className="rounded-full border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#f3cf7a]">{tag}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black uppercase ${
                            order.status === 'SERVED' ? 'border-green-400/25 bg-green-500/10 text-green-300' : 'border-[#f3a33a]/30 bg-[#f3a33a]/10 text-[#ffbd67]'
                          }`}>{order.status}</span>
                          <p className="text-sm text-[#a89b86]">{order.time}</p>
                          <p className="text-xs font-black text-[#d9ad55]">{order.xp}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Details', icon: <ClipboardList size={18} /> },
                            { label: 'Message', icon: <MessageSquare size={18} /> },
                            { label: order.status === 'FIRING' ? 'Mark Served' : 'Re-Fire', icon: <Flame size={18} />, gold: order.status === 'FIRING' },
                          ].map(btn => (
                            <button key={btn.label} className={`haptic-ready flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 text-[10px] font-bold transition-all active:scale-95 ${
                              btn.gold
                                ? 'border-[#f3cf7a]/45 bg-[#d9ad55]/15 text-[#f3cf7a]'
                                : 'border-white/10 bg-black/45 text-[#f7ead4]/80 hover:border-[#d9ad55]/35'
                            }`}>
                              {btn.icon}{btn.label}
                            </button>
                          ))}
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  <button className="haptic-ready mt-4 h-14 w-full rounded-2xl border border-[#d9ad55]/30 bg-gradient-to-r from-[#d9ad55]/20 to-[#d9ad55]/10 text-sm font-black text-[#f3cf7a] flex items-center justify-center gap-2 active:scale-[0.99]">
                    <Plus size={18} /> Fire New Order
                  </button>
                </motion.section>
              )}

              {/* ── Staff Activity Tab ─────────────────────────── */}
              {activeTab === 'staff' && (
                <motion.section key="staff"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  className="rounded-[28px] border border-[#d9ad55]/25 bg-black/50 p-5 backdrop-blur-2xl"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#d9ad55]">
                      <Users2 size={16} /> Staff Activity Feed
                    </h2>
                    <span className="flex items-center gap-2 text-xs text-green-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#52dd68]" />4 on floor
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {staffFeed.map((item, i) => {
                      const style = feedTypeStyle[item.type] || feedTypeStyle.seat
                      return (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="grid h-10 w-10 place-items-center rounded-full border"
                                style={{ borderColor: style.color + '50', background: style.color + '18', color: style.color }}>
                                {style.icon}
                              </div>
                              {item.active && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#52dd68] border-2 border-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-[#f7ead4]">{item.staff}</p>
                                <span className="text-[10px] text-[#5a5a5a]">{item.time}</span>
                              </div>
                              <p className="text-[10px] uppercase tracking-[0.1em] mt-0.5 font-black" style={{ color: style.color }}>{item.action}</p>
                              <p className="text-xs text-[#a89b86] mt-1">{item.detail}</p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Staff on floor grid */}
                  <div className="mt-5 rounded-2xl border border-[#d9ad55]/20 bg-black/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9ad55] mb-3">Current Floor Staff</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        { name: 'Aria Chen',    role: 'Server',    zone: 'Section A', active: true  },
                        { name: 'Marcus Webb',  role: 'Server',    zone: 'VIP',       active: true  },
                        { name: 'Keiko Tanaka', role: 'Bartender', zone: 'Bar',       active: true  },
                        { name: 'Devon Mills',  role: 'Host',      zone: 'Entry',     active: true  },
                        { name: 'Chef Torres',  role: 'Exec Chef', zone: 'Kitchen',   active: true  },
                        { name: 'Lena Park',    role: 'Server',    zone: 'Patio',     active: false },
                      ].map(s => (
                        <div key={s.name} className="rounded-xl border border-white/8 bg-black/30 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.active ? 'bg-[#52dd68] animate-pulse' : 'bg-[#5a5a5a]'}`} />
                            <span className="text-xs font-bold text-[#f7ead4] truncate">{s.name}</span>
                          </div>
                          <div className="text-[9px] text-[#7a7a7a]">{s.role}</div>
                          <div className="text-[9px] text-[#5a5a5a]">{s.zone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Bottom Dock */}
            <section className="grid gap-4 xl:grid-cols-[1fr_260px]">
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {[
                  { label: 'Floor Map',    sub: 'Live View',  icon: <LayoutGrid size={22} />,    tab: 'floor' },
                  { label: 'Fire Orders',  sub: 'Real-time',  icon: <Flame size={22} />,         tab: 'fire'  },
                  { label: 'Waitlist',     sub: '8 Guests',   icon: <Users2 size={22} />,        tab: 'staff' },
                  { label: 'Staff Comms',  sub: 'Team Chat',  icon: <MessageSquare size={22} />, tab: 'staff' },
                  { label: 'Analytics',    sub: '12 Active',  icon: <BarChart3 size={22} />,     tab: null    },
                ].map(action => (
                  <button key={action.label}
                    onClick={() => action.tab && setActiveTab(action.tab)}
                    className={`haptic-ready min-h-[86px] rounded-3xl border p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all active:scale-[0.98] ${
                      action.tab && activeTab === action.tab
                        ? 'border-[#f3cf7a]/40 bg-[#d9ad55]/15'
                        : 'border-[#d9ad55]/25 bg-black/50 hover:border-[#f3cf7a]/50 hover:bg-[#d9ad55]/10'
                    }`}>
                    <div className="mb-2 text-[#f3cf7a]">{action.icon}</div>
                    <p className="font-bold text-[#fff5df] text-sm">{action.label}</p>
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

      {/* ── Alerts Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {alertsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAlertsOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-[28px] border border-[#d9ad55]/30 bg-[#0d0a05] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-xl font-bold text-[#f3cf7a]">Venue Alerts</h3>
                <button onClick={() => setAlertsOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-[#a89b86]">✕</button>
              </div>
              <div className="space-y-3">
                {alerts.map(a => (
                  <div key={a.id} className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                    a.read ? 'border-white/8 opacity-50' : 'border-[#f3a33a]/30 bg-[#f3a33a]/5'
                  }`}>
                    <Bell size={16} className={a.read ? 'text-[#5a5a5a]' : 'text-[#ffbd67]'} />
                    <p className={`flex-1 text-sm ${a.read ? 'text-[#5a5a5a]' : 'text-[#f7ead4]'}`}>{a.msg}</p>
                    {!a.read && (
                      <button onClick={() => dismissAlert(a.id)}
                        className="haptic-ready h-8 rounded-lg border border-[#d9ad55]/25 bg-[#d9ad55]/10 px-3 text-xs font-bold text-[#f3cf7a] active:scale-95">
                        Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 pb-safe">
                <button onClick={() => { setAlerts(a => a.map(x => ({ ...x, read: true }))); setAlertsOpen(false) }}
                  className="haptic-ready h-14 w-full rounded-2xl bg-gradient-to-r from-[#d9ad55]/20 to-[#d9ad55]/10 border border-[#d9ad55]/25 text-sm font-black text-[#f3cf7a] active:scale-[0.99]">
                  Dismiss All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
