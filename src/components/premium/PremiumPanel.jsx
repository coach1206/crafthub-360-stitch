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
 * Theme-aware premium panel. Not wired into any live screen yet —
 * Phase 7A foundation only.
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
