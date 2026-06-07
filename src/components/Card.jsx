export default function Card({ children, style = {}, accent = false, className = '' }) {
  return (
    <div
      className={`obsidian-glass stitch-card${accent ? ' stitch-card-accent' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-label)', fontSize: 14, fontWeight: 500,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--primary)', marginBottom: 24,
    }}>
      {children}
    </h3>
  )
}

export function ManifestRow({ icon = 'check_circle', label, badge }) {
  return (
    <li className="manifest-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="material-symbols-outlined icon-fill text-primary">{icon}</span>
        <span className="text-body-md text-on-surface">{label}</span>
      </div>
      {badge && (
        <span style={{
          fontFamily: 'var(--font-label)', fontSize: 12, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--primary-container)',
        }}>
          {badge}
        </span>
      )}
    </li>
  )
}

export function StatusBadge({ label = 'System Production Online' }) {
  return (
    <div className="obsidian-glass status-badge" style={{ marginBottom: 48 }}>
      <span className="ping-dot-wrap">
        <span className="ping-dot-ring animate-ping" />
        <span className="ping-dot" />
      </span>
      <span className="text-label-caps text-primary">{label}</span>
    </div>
  )
}

export function ModuleChip({ label, done = true }) {
  return (
    <div className="module-chip">
      <span className="text-body-md text-on-surface">{label}</span>
      <span
        className="material-symbols-outlined icon-fill"
        style={{ fontSize: 20, color: done ? 'var(--primary)' : 'rgba(255,255,255,0.2)' }}
      >
        check_circle
      </span>
    </div>
  )
}

export function SectionDivider({ children }) {
  return <div className="section-divider">{children}</div>
}
