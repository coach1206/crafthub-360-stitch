const SHELL_CLASS = {
  passport:   'premium-passport-shell',
  novee:      'premium-novee-shell',
  smokecraft: 'premium-smokecraft-shell',
}

const PANEL_CLASS = {
  passport:   'premium-passport-panel',
  novee:      'premium-novee-panel',
  smokecraft: 'premium-smokecraft-panel',
}

/**
 * Theme-aware premium panel. Wired into PassportConnections (Phase 7B)
 * and PublicCraftHubLanding (Phase 7C).
 */
export default function PremiumPanel({ variant = 'passport', children, className = '', style = {} }) {
  return (
    <div className={`${PANEL_CLASS[variant]}${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  )
}

export function PremiumShell({ variant = 'passport', children, className = '', style = {} }) {
  return (
    <div className={`${SHELL_CLASS[variant]}${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  )
}

export function PremiumSidebar({ children, className = '', style = {} }) {
  return (
    <div className={`premium-passport-sidebar${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  )
}

export function PremiumGoldRule({ variant = 'passport', className = '' }) {
  const cls = variant === 'novee' ? 'premium-novee-glow-ring' : 'premium-passport-gold-rule'
  return <div className={`${cls}${className ? ' ' + className : ''}`} />
}

export function PremiumDivider({ children }) {
  return <div className="premium-divider-gold">{children}</div>
}

export function PremiumPill({ children, className = '', style = {} }) {
  return <span className={`premium-pill${className ? ' ' + className : ''}`} style={style}>{children}</span>
}

export function PremiumButton({ children, variant = 'primary', onClick, type = 'button', className = '', disabled = false }) {
  const cls = variant === 'secondary' ? 'premium-btn-secondary' : 'premium-btn-primary'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${cls}${className ? ' ' + className : ''}`}
    >
      {children}
    </button>
  )
}

/**
 * NOVEE OS module-launcher tile. status must be an honest static label
 * ("Configured" | "Available" | "Restricted" | "Coming Soon" | "Active")
 * — never a fabricated live-telemetry claim. onClick is required unless
 * disabled is true; pass a disabledReason to explain why a tile is inert.
 */
export function PremiumCommandTile({ title, desc, icon, status, onClick, disabled = false, disabledReason = '', className = '' }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className={`premium-novee-glow-card text-left w-full ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={{ padding: '1.1rem', borderRadius: '0.85rem' }}
    >
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="material-symbols-outlined" style={{ color: '#C9A84C' }}>{icon}</span>}
        {status && (
          <span className="premium-novee-status-dot" data-status={status}>{status}</span>
        )}
      </div>
      <p style={{ color: '#f6d27a', fontWeight: 700, fontSize: '15px' }}>{title}</p>
      {desc && <p style={{ color: 'rgba(246,210,122,0.55)', fontSize: '12px', marginTop: 4, lineHeight: 1.5 }}>{desc}</p>}
    </button>
  )
}

/**
 * Secure-access wrapper for PIN/login forms. Purely a visual shell —
 * does not implement or alter any auth logic itself.
 */
export function PremiumAccessPanel({ children, className = '', style = {} }) {
  return (
    <div className={`premium-novee-access-panel ${className}`} style={style}>
      {children}
    </div>
  )
}

/**
 * Left-side system-status rail for NOVEE OS shells. items is an array of
 * { label, value } pairs — callers must supply real or honest static
 * values, never fabricated live telemetry.
 */
export function PremiumSystemRail({ items = [], className = '' }) {
  return (
    <div className={`premium-novee-rail ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="premium-novee-rail-item">
          <span className="premium-novee-rail-label">{item.label}</span>
          <span className="premium-novee-rail-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
