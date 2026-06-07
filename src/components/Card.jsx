export default function Card({ children, style = {}, topAccent = false }) {
  return (
    <div
      className="obsidian-glass"
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        ...(topAccent && {
          borderTop: '2px solid rgba(212,175,55,0.5)',
        }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function ModuleChip({ label, checked = true }) {
  return (
    <div className="module-chip">
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
      {checked && (
        <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: '#f2ca50' }}>
          check_circle
        </span>
      )}
    </div>
  )
}

export function SectionDivider({ label }) {
  return <div className="section-divider">{label}</div>
}

export function StatBadge({ value, sub }) {
  return (
    <div
      className="obsidian-glass"
      style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'right', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      <div className="font-caps gold-text" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.3 }}>
        {sub}
      </div>
    </div>
  )
}

export function StatusBadge({ label, active = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        className="pulse-dot"
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: active ? '#f2ca50' : 'rgba(255,255,255,0.3)',
          display: 'inline-block',
        }}
      />
      <span
        className="font-caps"
        style={{ fontSize: 11, color: active ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}
      >
        {label}
      </span>
    </div>
  )
}
