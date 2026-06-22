import { CrownIcon, DiamondIcon, CheckIcon } from './PremiumIcons.jsx'

const STATUS_STYLE = {
  earned:        { color: '#e9c176', border: 'rgba(233,193,118,0.5)', bg: 'rgba(233,193,118,0.12)' },
  eligible:      { color: '#9fd6a0', border: 'rgba(159,214,160,0.4)', bg: 'rgba(159,214,160,0.08)' },
  close:         { color: '#c5a059', border: 'rgba(197,160,89,0.4)',  bg: 'rgba(197,160,89,0.08)' },
  partial:       { color: '#8d8d8d', border: 'rgba(255,255,255,0.15)', bg: 'rgba(255,255,255,0.03)' },
  pending:       { color: '#6b6b6b', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.02)' },
  locked:        { color: '#5a5a5a', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.015)' },
  not_qualified: { color: '#d97a7a', border: 'rgba(217,122,122,0.3)', bg: 'rgba(217,122,122,0.06)' },
}

export default function WinnerCategoryCard({ category }) {
  const style = STATUS_STYLE[category.status] || STATUS_STYLE.locked
  const Icon = category.status === 'earned' ? CrownIcon : DiamondIcon

  return (
    <div
      className="rounded-2xl border flex flex-col gap-3"
      style={{ padding: '16px 18px', borderColor: style.border, background: style.bg }}
      aria-label={`Winner category: ${category.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 32, height: 32, background: `${style.color}26`, color: style.color }}>
            {category.status === 'earned' ? <CheckIcon size={16} /> : <Icon size={16} />}
          </span>
          <p className="font-label-md text-label-md text-on-surface font-semibold">{category.title}</p>
        </div>
        <span
          className="font-label-sm text-label-sm uppercase tracking-widest rounded-full shrink-0"
          style={{ padding: '4px 10px', color: style.color, border: `1px solid ${style.border}` }}
        >
          {category.statusLabel}
        </span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{category.description}</p>
      <div className="rounded-xl border border-outline-variant/10" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.15)' }}>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{category.reason}</p>
      </div>
      <p className="font-label-sm text-label-sm text-primary/70">Next: {category.nextAction}</p>
    </div>
  )
}
