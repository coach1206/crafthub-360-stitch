import { DiamondIcon } from './PremiumIcons.jsx'

const FIELD_LABELS = [
  ['cigarName', 'Cigar'], ['country', 'Country'], ['region', 'Region'], ['wrapper', 'Wrapper'],
  ['binder', 'Binder'], ['filler', 'Filler'], ['aging', 'Aging'], ['vitola', 'Vitola'],
  ['ringGauge', 'Ring Gauge'], ['burnTime', 'Burn Time'], ['strength', 'Strength'], ['body', 'Body'],
  ['drinkPairing', 'Drink Pairing'], ['foodPairing', 'Food Pairing'], ['soilSetting', 'Setting'],
  ['musicVibe', 'Music Vibe'], ['userMood', 'Mood'], ['occasion', 'Occasion'],
]

const CATEGORY_COLOR = {
  'Legendary Blend': '#e9c176', 'Rare Blend': '#c5a059', 'Distinct Blend': '#8d6b3a',
  'Emerging Blend': '#6b6b6b', Incomplete: '#4a4a4a',
}

export default function UniqueBlendPanel({ signature, uniqueness }) {
  if (!signature) return null
  const color = CATEGORY_COLOR[uniqueness?.category] || '#6b6b6b'

  return (
    <section
      className="rounded-2xl border mb-8"
      style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: `${color}55` }}
      aria-label="Unique Blend Signature"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: `${color}26`, color }}>
            <DiamondIcon size={20} />
          </span>
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Unique Blend Signature</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Generated from this session's choices.</p>
          </div>
        </div>
        {uniqueness && (
          <div className="text-right">
            <p className="font-headline-md font-bold" style={{ fontSize: 24, color }}>{uniqueness.score}</p>
            <p className="font-label-sm text-label-sm uppercase tracking-widest" style={{ color }}>{uniqueness.category}</p>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        {FIELD_LABELS.map(([key, label]) => (
          <div key={key} className="rounded-xl border border-outline-variant/15" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.025)' }}>
            <p className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>{label}</p>
            <p className="font-body-sm text-body-sm text-on-surface">{signature[key] || '—'}</p>
          </div>
        ))}
      </div>

      {uniqueness && (
        <div className="rounded-xl border border-outline-variant/15" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.025)' }}>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {uniqueness.filledFields} of {uniqueness.totalFields} blend fields recorded — complete more steps to raise your Unique Blend Score.
          </p>
        </div>
      )}
    </section>
  )
}
