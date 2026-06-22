import { CrownIcon } from './PremiumIcons.jsx'
import { getRankFromXP } from '../../constants/session.js'

// Categories this build can actually compute today, from real session data.
function scoredCategories(session) {
  const sc = session?.smokeCraft || {}
  const penaltyTotal = (sc.penalties || []).reduce((s, p) => s + p.points, 0)
  return [
    { id: 'protocol', label: 'Protocol Completion', value: (session?.completedSteps?.length || 0) * 50, max: null, note: `${session?.completedSteps?.length || 0} steps completed` },
    { id: 'pairing', label: 'Pairing Score', value: sc.pairingScore ?? null, max: null, note: sc.pairingGrade ? `Grade: ${sc.pairingGrade}` : 'Not yet scored — complete Seed & Soil' },
    { id: 'uniqueness', label: 'Unique Blend Score', value: sc.uniquenessScore ?? null, max: null, note: sc.uniquenessCategory ? `Category: ${sc.uniquenessCategory}` : 'Not yet scored — complete Seed & Soil' },
    { id: 'penalty', label: 'Penalties', value: penaltyTotal, max: null, note: `${(sc.penalties || []).length} penalty event(s) logged` },
  ]
}

// Categories required by the full spec that have no real computation yet —
// shown honestly as "Not yet scored" rather than fabricated numbers.
const PENDING_CATEGORIES = [
  'Cigar Knowledge Score', 'Wrapper Score', 'Ring Gauge / Vitola Score',
  'Construction Score', 'Tasting Accuracy Score', 'Purchase Proof Score',
  'Mentor Alignment Score', 'Passport / Networking Score',
]

export default function AdvancedScorecardPanel({ session }) {
  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)
  const categories = scoredCategories(session)
  const finalTotal = categories.reduce((s, c) => s + (c.value || 0), 0)

  return (
    <section
      className="rounded-2xl border mb-10"
      style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.35)' }}
      aria-label="Advanced Scorecard"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
            <CrownIcon size={20} />
          </span>
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Advanced Scorecard</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{rank.name} · {xp} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-headline-md font-bold" style={{ fontSize: 28, color: '#e9c176' }}>{finalTotal >= 0 ? '+' : ''}{finalTotal}</p>
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70">Final Total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {categories.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/15" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.025)' }}>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-semibold">{c.label}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{c.note}</p>
            </div>
            <span className="font-label-lg text-label-lg font-bold shrink-0" style={{ color: c.value == null ? '#6b6b6b' : c.value >= 0 ? '#e9c176' : '#d97a7a' }}>
              {c.value == null ? '—' : `${c.value >= 0 ? '+' : ''}${c.value}`}
            </span>
          </div>
        ))}
      </div>

      <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/60 mb-2">Not Yet Scored</p>
      <div className="flex flex-wrap gap-2">
        {PENDING_CATEGORIES.map(label => (
          <span key={label} className="rounded-full border font-label-sm text-label-sm" style={{ padding: '6px 12px', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
        ))}
      </div>
    </section>
  )
}
