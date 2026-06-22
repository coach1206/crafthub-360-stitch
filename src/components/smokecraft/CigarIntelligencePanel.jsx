import { useState } from 'react'
import { LeafIcon, DiamondIcon, CompassIcon, FlameIcon, InsightsIcon, CheckIcon } from './PremiumIcons.jsx'

// Wrapper Intelligence — 11 canonical wrapper types with strength/body scoring used by the
// Wrapper Score Panel and by pairing logic elsewhere in SmokeCraft.
export const WRAPPER_TYPES = [
  { id: 'connecticut-shade', name: 'Connecticut Shade', tone: '#d9c79a', strength: 1, note: 'Mild, creamy, nutty — the classic shade-grown wrapper.' },
  { id: 'ecuador-connecticut', name: 'Ecuador Connecticut', tone: '#e0cf9e', strength: 1, note: 'Slightly richer than US Connecticut, still mild and smooth.' },
  { id: 'cameroon', name: 'Cameroon', tone: '#c9a96b', strength: 2, note: 'Toothy texture, light spice, subtle sweetness.' },
  { id: 'habano', name: 'Habano', tone: '#b9893f', strength: 3, note: 'Spicy, leathery, classic Cuban-seed character.' },
  { id: 'corojo', name: 'Corojo', tone: '#a8762f', strength: 3, note: 'Peppery and earthy with a bold finish.' },
  { id: 'criollo', name: 'Criollo', tone: '#9c6c2e', strength: 2, note: 'Earthy, woody, balanced medium body.' },
  { id: 'sumatra', name: 'Sumatra', tone: '#8a5a28', strength: 2, note: 'Spicy-sweet with dried fruit undertones.' },
  { id: 'san-andres-maduro', name: 'San Andrés Maduro', tone: '#5c4226', strength: 3, note: 'Dark cocoa, espresso, natural sweetness.' },
  { id: 'broadleaf-maduro', name: 'Broadleaf Maduro', tone: '#4a3420', strength: 4, note: 'Thick, oily, rich molasses and dark fruit.' },
  { id: 'oscuro', name: 'Oscuro', tone: '#2e2014', strength: 4, note: 'Near-black, intensely aged, heavy roasted notes.' },
  { id: 'candela', name: 'Candela', tone: '#5a7a3a', strength: 1, note: 'Flash-cured green wrapper, grassy and mild.' },
]

// Ring Gauge tiers used for Ring Gauge Strategy + the Ring Gauge Strategist winner category.
export const RING_GAUGE_TIERS = [
  { id: 'small', label: 'Small', range: '32–42', desc: 'Concentrated wrapper flavor, faster burn, crisper draw.' },
  { id: 'medium', label: 'Medium', range: '43–50', desc: 'The balanced default — even draw and steady evolution.' },
  { id: 'large', label: 'Large', range: '51–60', desc: 'More filler volume, cooler smoke, slower-building body.' },
  { id: 'extra-large', label: 'Extra Large', range: '61+', desc: 'Maximum smoke volume — long lounge sessions only.' },
]

// Burn-time tiers used for Burn-Time Strategy + session pacing.
export const BURN_TIME_TIERS = [
  { id: 'quick', label: 'Quick', range: '< 30 min', desc: 'Best for a short break or a quick palate cleanse.' },
  { id: 'standard', label: 'Standard', range: '30–60 min', desc: 'The everyday session length — easy to plan around.' },
  { id: 'long', label: 'Long', range: '60–90 min', desc: 'A full pairing session with room for flavor to evolve.' },
  { id: 'event', label: 'Event / Lounge', range: '90+ min', desc: 'Reserved for celebrations and extended lounge nights.' },
]

function ringGaugeTierFor(ringGauge) {
  const n = parseInt(ringGauge, 10)
  if (!Number.isFinite(n)) return null
  if (n <= 42) return 'small'
  if (n <= 50) return 'medium'
  if (n <= 60) return 'large'
  return 'extra-large'
}

const TABS = [
  { id: 'wrapper', label: 'Wrapper Scoring', Icon: LeafIcon },
  { id: 'ring', label: 'Ring Gauge & Vitola', Icon: DiamondIcon },
  { id: 'burn', label: 'Burn-Time Strategy', Icon: FlameIcon },
]

export default function CigarIntelligencePanel({ activeRingGauge }) {
  const [tab, setTab] = useState('wrapper')
  const activeTier = ringGaugeTierFor(activeRingGauge)

  return (
    <section
      className="rounded-3xl border border-primary/15 backdrop-blur-xl mb-10"
      style={{
        padding: 24,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.12) 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      aria-label="Cigar Intelligence"
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
          <InsightsIcon size={20} />
        </span>
        <div>
          <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Cigar Intelligence</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Wrapper, ring gauge and burn-time strategy explained.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5 mb-5">
        {TABS.map(t => {
          const on = tab === t.id
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="flex items-center gap-2 rounded-full border font-label-sm text-label-sm transition-all duration-200"
              style={{ padding: '8px 16px', background: on ? 'rgba(233,193,118,0.16)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.5)' : 'rgba(255,255,255,0.08)', color: on ? '#e9c176' : 'inherit' }}>
              <t.Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'wrapper' && (
        <div className="grid sm:grid-cols-2 gap-3" aria-label="Wrapper Scoring">
          {WRAPPER_TYPES.map(w => (
            <div key={w.id} className="flex items-center gap-3 rounded-2xl border border-outline-variant/20" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)' }}>
              <span className="rounded-full shrink-0" style={{ width: 28, height: 28, background: w.tone, border: '1.5px solid rgba(255,255,255,0.25)' }} aria-hidden="true" />
              <div className="flex-1">
                <p className="font-label-md text-label-md text-on-surface font-semibold">{w.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{w.note}</p>
              </div>
              <span className="font-label-sm text-label-sm shrink-0" style={{ color: '#e9c176' }}>{'●'.repeat(w.strength)}{'○'.repeat(4 - w.strength)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'ring' && (
        <div className="flex flex-col gap-3" aria-label="Ring Gauge and Vitola Strategy">
          {RING_GAUGE_TIERS.map(r => {
            const on = r.id === activeTier
            return (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl border" style={{ padding: '14px 16px', background: on ? 'rgba(233,193,118,0.1)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: Math.min(20 + (RING_GAUGE_TIERS.indexOf(r) * 6), 44), height: Math.min(20 + (RING_GAUGE_TIERS.indexOf(r) * 6), 44), background: 'rgba(233,193,118,0.12)', color: '#e9c176' }}>
                  <DiamondIcon size={16} />
                </span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface font-semibold">{r.label} <span className="text-primary/60 font-normal">— {r.range}</span></p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{r.desc}</p>
                </div>
                {on && (
                  <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 20, height: 20, background: '#e9c176', color: '#131314' }}>
                    <CheckIcon size={13} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'burn' && (
        <div className="flex flex-col gap-3" aria-label="Burn-Time Strategy">
          {BURN_TIME_TIERS.map(b => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-outline-variant/20" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)' }}>
              <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 36, height: 36, background: 'rgba(233,193,118,0.12)', color: '#e9c176' }}>
                <FlameIcon size={18} />
              </span>
              <div className="flex-1">
                <p className="font-label-md text-label-md text-on-surface font-semibold">{b.label} <span className="text-primary/60 font-normal">— {b.range}</span></p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
