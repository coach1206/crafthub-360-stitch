import { InsightsIcon, FlaskIcon, CheckIcon } from './PremiumIcons.jsx'

const GRADE_COLOR = {
  Exceptional: '#e9c176', Strong: '#c5a059', Good: '#8d6b3a', Fair: '#6b6b6b', Risky: '#a13d3d', '—': '#6b6b6b',
}

export default function PairingScorePanel({ result, onKeep, onAdjust, onAskMentor, warningResolved }) {
  if (!result) return null
  const { score, grade, breakdown, warning } = result
  const color = GRADE_COLOR[grade] || '#8d6b3a'

  return (
    <section
      className="rounded-2xl border mb-8"
      style={{
        padding: '20px 24px',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)',
        borderColor: `${color}55`,
      }}
      aria-label="Pairing Score"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: `${color}26`, color }}>
            <FlaskIcon size={20} />
          </span>
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Pairing Score</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Final Pairing Grade</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-headline-md font-bold" style={{ fontSize: 28, color }}>{score >= 0 ? '+' : ''}{score}</p>
          <p className="font-label-sm text-label-sm uppercase tracking-widest" style={{ color }}>{grade}</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {breakdown.map((b, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-outline-variant/15" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.025)' }}>
              <div className="flex-1">
                <p className="font-label-sm text-label-sm text-on-surface font-semibold">{b.label}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{b.reason}</p>
              </div>
              <span className="font-label-md text-label-md font-bold shrink-0" style={{ color: b.points >= 0 ? '#7fbf7f' : '#d97a7a' }}>
                {b.points >= 0 ? '+' : ''}{b.points}
              </span>
            </div>
          ))}
        </div>
      )}

      {warning && !warningResolved && (
        <div className="mt-4 rounded-xl border" style={{ padding: '16px 18px', background: 'rgba(161,61,61,0.1)', borderColor: 'rgba(161,61,61,0.4)' }} role="alert" aria-label="Pairing Warning">
          <p className="font-label-sm text-label-sm uppercase tracking-widest mb-1" style={{ color: '#d97a7a' }}>Pairing Warning</p>
          <p className="font-body-md text-body-md text-on-surface mb-4">{warning.message}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onKeep} className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg" style={{ padding: '10px 16px', background: 'rgba(161,61,61,0.25)', color: '#f0c5c5', border: '1px solid rgba(161,61,61,0.5)' }}>Keep Pairing</button>
            <button type="button" onClick={onAdjust} className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg" style={{ padding: '10px 16px', background: 'rgba(233,193,118,0.16)', color: '#e9c176', border: '1px solid rgba(233,193,118,0.4)' }}>Adjust Pairing</button>
            <button type="button" onClick={onAskMentor} className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', color: 'inherit', border: '1px solid rgba(255,255,255,0.15)' }}>Ask Mentor</button>
          </div>
        </div>
      )}

      {warning && warningResolved === 'kept' && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border" style={{ padding: '12px 16px', background: 'rgba(161,61,61,0.08)', borderColor: 'rgba(161,61,61,0.3)' }}>
          <InsightsIcon size={18} />
          <p className="font-body-sm text-body-sm text-on-surface-variant">Pairing clash warning ignored — −50 points logged as a penalty.</p>
        </div>
      )}

      {warning && warningResolved === 'mentor' && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border" style={{ padding: '12px 16px', background: 'rgba(233,193,118,0.06)', borderColor: 'rgba(233,193,118,0.3)' }}>
          <CheckIcon size={16} />
          <p className="font-body-sm text-body-sm text-on-surface-variant">Mentor tip: try a lighter drink or richer food to balance this pairing before keeping it.</p>
        </div>
      )}
    </section>
  )
}
