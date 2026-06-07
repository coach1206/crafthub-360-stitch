import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const courses = [
  { name: 'Amuse-Bouche',      dish: 'Wagyu A5 Nigiri',        status: 'SERVED',  statusColor: '#5A9A5A', time: '7:14 PM', xp: 80  },
  { name: 'Course I',          dish: 'Black Truffle Cappellaci',status: 'SERVED',  statusColor: '#5A9A5A', time: '7:26 PM', xp: 120 },
  { name: 'Course II',         dish: 'Dry-Aged Duck Confit',    status: 'FIRING',  statusColor: '#D4AF37', time: '7:52 PM', xp: 160 },
  { name: 'Course III',        dish: 'Wagyu Tenderloin A5',     status: 'PENDING', statusColor: '#7A7A7A', time: '8:15 PM', xp: 200 },
  { name: 'Dessert',           dish: 'Miso Chocolate Tart',     status: 'PENDING', statusColor: '#7A7A7A', time: '8:40 PM', xp: 100 },
]

const tables = [
  { id: 1, emoji: '🟡', guests: 2, status: 'Dessert',   color: '#D4AF37', spend: 520 },
  { id: 2, emoji: '🟠', guests: 4, status: 'Course II', color: '#C88B3A', spend: 340 },
  { id: 3, emoji: '🟢', guests: 6, status: 'Ordering',  color: '#5A9A5A', spend: 0   },
  { id: 4, emoji: '⚫', guests: 2, status: 'Reserved',  color: '#7A7A7A', spend: 0   },
]

const sensors = [
  { label: 'Occupancy',    value: '68%',  trend: '+12%', color: '#D4AF37' },
  { label: 'Foot Traffic', value: '142',  trend: '+8%',  color: '#C88B3A' },
  { label: 'Temp',         value: '21°C', trend: '0%',   color: '#5A9A5A' },
  { label: 'Noise',        value: '62dB', trend: '+3%',  color: '#D4AF37' },
]

const pacingSteps = [
  { label: 'Arrival',    done: true  },
  { label: 'Amuse',     done: true  },
  { label: 'Courses',   done: false },
  { label: 'Dessert',   done: false },
  { label: 'Departure', done: false },
]

export default function EATCommand() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/eat-command.jpg" alt="EAT Command"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Venue Intelligence System</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>E.A.T. Command</div>
        </div>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>KITCHEN LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Sensor telemetry — 4 rings */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Live Venue Telemetry</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
            {sensors.map(({ label, value, trend, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 8px',
                  background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                  border: `2px solid ${color}44`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 16px ${color}22`,
                }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 18, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: color + '99', marginTop: 2 }}>{trend}</div>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fire order — course timeline */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Fire Order — Table 3 Active
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map(({ name, dish, status, statusColor, time, xp }) => (
            <motion.div key={name} whileTap={{ scale: 0.98 }}>
              <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: status === 'FIRING' ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(122,122,122,0.2)', boxShadow: status === 'FIRING' ? '0 0 16px rgba(212,175,55,0.1)' : 'none' }}>
                {/* Status dot */}
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  background: statusColor,
                  boxShadow: status === 'FIRING' ? `0 0 10px ${statusColor}99` : 'none',
                  animation: status === 'FIRING' ? 'gold-pulse 1.5s ease-in-out infinite' : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 16, color: '#E5E2E1' }}>{dish}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, marginBottom: 4 }}>{status}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{time}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF3799', marginTop: 2 }}>+{xp} XP</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floor map — table grid */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Floor Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tables.map(({ id, emoji, guests, status, color, spend }) => (
            <motion.div key={id} whileTap={{ scale: 0.96 }}>
              <div className="glass-card" style={{ padding: '20px 18px', cursor: 'pointer', border: `1px solid ${color}33`, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 18, color: '#E5E2E1', marginBottom: 4 }}>Table {id}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginBottom: 8 }}>{guests} guests</div>
                <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}44`, fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: spend ? 8 : 0 }}>{status}</div>
                {spend > 0 && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', display: 'block', marginTop: 8 }}>${spend}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Experience pacing arc */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Experience Arc — Pacing</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 20, right: 20, top: 11, height: 2, background: 'rgba(122,122,122,0.1)' }} />
            {pacingSteps.map(({ label, done }, i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: done ? '#D4AF37' : '#1A1A1A',
                  border: `2px solid ${done ? '#D4AF37' : 'rgba(122,122,122,0.3)'}`,
                  boxShadow: done ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                }} />
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: done ? '#D4AF37' : '#7A7A7A', textAlign: 'center' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
