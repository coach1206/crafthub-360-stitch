import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import { useSecurity } from '../context/SecurityContext.jsx'
import { getEATFeed } from '../services/pos3IntegrationApiService.js'

const FADE    = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
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

const pressureColor = { HIGH: '#E05A5A', MEDIUM: '#D4AF37', LOW: '#5A9A5A', STRETCHED: '#E05A5A', BUSY: '#D4AF37', NORMAL: '#5A9A5A', LIGHT: '#5A9A5A', UNKNOWN: '#7A7A7A' }

export default function EATCommand() {
  const navigate = useNavigate()
  const { role } = useSecurity()
  const isManager = ['manager','admin','founder_level_0'].includes(role)

  const [eatFeed,    setEatFeed]    = useState(null)
  const [feedLoading, setFeedLoading] = useState(false)

  useEffect(() => {
    if (!isManager) return
    setFeedLoading(true)
    getEATFeed('prototype')
      .then(r => setEatFeed(r?.success ? r : null))
      .catch(() => setEatFeed(null))
      .finally(() => setFeedLoading(false))
  }, [role])

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260, background: '#050302', overflow: 'hidden' }}>
        <img src="/eat-logo-nobg.png" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', opacity: 0.28 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Venue Intelligence System</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>E.A.T. Command</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>KITCHEN LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* ── Sensor telemetry (unchanged) ─────────────────────────────── */}
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

      {/* ── Fire order (unchanged) ───────────────────────────────────── */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Fire Order — Table 3 Active
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map(({ name, dish, status, statusColor, time, xp }) => (
            <motion.div key={name} whileTap={{ scale: 0.98 }}>
              <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: status === 'FIRING' ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(122,122,122,0.2)', boxShadow: status === 'FIRING' ? '0 0 16px rgba(212,175,55,0.1)' : 'none' }}>
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

      {/* ── Floor map (unchanged) ────────────────────────────────────── */}
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

      {/* ── Experience pacing arc (unchanged) ───────────────────────── */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Experience Arc — Pacing</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 20, right: 20, top: 11, height: 2, background: 'rgba(122,122,122,0.1)' }} />
            {pacingSteps.map(({ label, done }) => (
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

      {/* ══════════════════════════════════════════════════════════════════
          PHASE 9 POS 3 FEED SECTIONS — Manager+ only
      ══════════════════════════════════════════════════════════════════ */}

      {isManager && (
        <>
          {/* ── POS 3 Feed Header ────────────────────────────────────── */}
          <motion.div variants={FADE} style={{ margin: '24px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 16 }}>point_of_sale</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase' }}>POS 3 Live Feed</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.15)', marginLeft: 8 }} />
            </div>
          </motion.div>

          {feedLoading && (
            <motion.div variants={FADE} style={{ margin: '0 16px' }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', padding: '16px 0' }}>Loading POS 3 feed…</div>
            </motion.div>
          )}

          {eatFeed && !feedLoading && (
            <>
              {/* ── Venue Opportunity Score ──────────────────────────── */}
              <motion.div variants={FADE} style={{ margin: '0 16px 0' }}>
                <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Venue Opportunity Score</div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 52, color: '#D4AF37', lineHeight: 1 }}>
                        {eatFeed.opportunityScore}<span style={{ fontSize: 18, color: '#D4AF3799' }}>/100</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Active Recs',  value: eatFeed.transactions?.upsellOpportunities || 0, color: '#D4AF37' },
                        { label: 'Inv Alerts',   value: eatFeed.assets?.lowStockCount              || 0, color: '#E07B39' },
                        { label: 'Open Checks',  value: eatFeed.transactions?.openCheckCount        || 0, color: '#5A9A5A' },
                        { label: 'Occupancy',    value: `${eatFeed.environment?.occupancyPct || 0}%`, color: '#C88B3A' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', textAlign: 'center' }}>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 16, color, marginBottom: 2 }}>{value}</div>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Environment Feed ─────────────────────────────────── */}
              <motion.div variants={FADE} style={{ margin: '12px 16px 0' }}>
                <div className="glass-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 16 }}>sensors</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Environment</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Tables',   value: `${eatFeed.environment?.occupiedTables}/${eatFeed.environment?.tableCount}` },
                      { label: 'Staff',    value: `${eatFeed.environment?.activeStaff}/${eatFeed.environment?.totalStaff}` },
                      { label: 'Pressure', value: eatFeed.environment?.venuePressure, color: pressureColor[eatFeed.environment?.venuePressure] },
                      { label: 'Pace',     value: eatFeed.environment?.servicePace,   color: pressureColor[eatFeed.environment?.servicePace] },
                      { label: 'Reserved', value: eatFeed.environment?.reservedTables || 0 },
                      { label: 'Occ %',    value: `${eatFeed.environment?.occupancyPct || 0}%`, color: '#D4AF37' },
                    ].map(({ label, value, color = '#E5E2E1' }) => (
                      <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(122,122,122,0.12)', textAlign: 'center' }}>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14, color, marginBottom: 2 }}>{value}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {eatFeed.environment?.zoneBreakdown && (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(eatFeed.environment.zoneBreakdown).map(([zone, data]) => (
                        <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', width: 90 }}>{zone}</div>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(122,122,122,0.15)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#D4AF37', width: `${data.total > 0 ? (data.occupied / data.total) * 100 : 0}%`, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', width: 36, textAlign: 'right' }}>{data.occupied}/{data.total}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ── Asset Feed ───────────────────────────────────────── */}
              <motion.div variants={FADE} style={{ margin: '12px 16px 0' }}>
                <div className="glass-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 16 }}>inventory_2</span>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Asset Feed</span>
                    </div>
                    {eatFeed.assets?.lowStockCount > 0 && (
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#E07B39', background: 'rgba(224,123,57,0.12)', padding: '2px 10px', borderRadius: 12, border: '1px solid rgba(224,123,57,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {eatFeed.assets.lowStockCount} Alerts
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(eatFeed.assets?.reorderAlerts || []).slice(0, 4).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(224,123,57,0.05)', border: '1px solid rgba(224,123,57,0.15)' }}>
                        <div>
                          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#E5E2E1' }}>{item.name}</div>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>{item.category}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 16, color: item.stock <= 2 ? '#E05A5A' : '#E07B39' }}>{item.stock}</div>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>min {item.threshold}</div>
                        </div>
                      </div>
                    ))}
                    {eatFeed.assets?.featuredItems?.slice(0, 2).map((item, i) => (
                      <div key={`feat-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(90,154,90,0.04)', border: '1px solid rgba(90,154,90,0.12)' }}>
                        <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 11, color: '#9A9A9A' }}>{item.name}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>{item.currentStock} left</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Transaction Feed ─────────────────────────────────── */}
              <motion.div variants={FADE} style={{ margin: '12px 16px 0' }}>
                <div className="glass-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 16 }}>payments</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Transaction Feed</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Open Checks',    value: eatFeed.transactions?.openCheckCount,           color: '#E5E2E1' },
                      { label: 'Open Value',     value: `$${eatFeed.transactions?.totalOpenValue || 0}`, color: '#D4AF37' },
                      { label: 'Avg Check',      value: `$${eatFeed.transactions?.averageCheckValue || 0}`, color: '#C88B3A' },
                      { label: 'High Value',     value: eatFeed.transactions?.highValueOrders,           color: '#5A9A5A' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(122,122,122,0.12)' }}>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 18, color, marginBottom: 4 }}>{value}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {(eatFeed.transactions?.upsellDetails || []).map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', marginBottom: 2 }}>Table {u.table}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>Upsell opportunity</div>
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14, color: '#D4AF37' }}>${u.currentTotal}</div>
                    </div>
                  ))}
                  {(eatFeed.transactions?.staffOpportunities || []).map(s => (
                    <div key={s.staffId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(90,154,90,0.04)', border: '1px solid rgba(90,154,90,0.1)', marginBottom: 4 }}>
                      <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#E5E2E1' }}>{s.staffName}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>${s.totalValue}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>{s.orderCount} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {!feedLoading && !eatFeed && (
            <motion.div variants={FADE} style={{ margin: '0 16px' }}>
              <div className="glass-card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#7A7A7A', marginBottom: 10, display: 'block' }}>cloud_off</span>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>POS 3 feed unavailable</div>
              </div>
            </motion.div>
          )}
        </>
      )}

      <div style={{ height: 32 }} />
    </motion.div>
  )
}
