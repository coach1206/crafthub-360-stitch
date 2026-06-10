import { useNavigate } from 'react-router-dom'

export function SmokeCraftAtmosphericBackground({ variant = 'lounge' }) {
  return (
    <div className={`smokecraft-premium-bg smokecraft-premium-bg-${variant}`} aria-hidden="true">
      <div className="smokecraft-premium-bg__image" />
      <div className="smokecraft-premium-bg__smoke smokecraft-premium-bg__smoke--left" />
      <div className="smokecraft-premium-bg__smoke smokecraft-premium-bg__smoke--right" />
      <div className="smokecraft-premium-bg__glow" />
      <div className="smokecraft-premium-bg__vignette" />
    </div>
  )
}

export function SmokeCraftPremiumHeader({
  step,
  sessionLabel = 'SmokeCraft Session',
  backTo,
  rightLabel = 'Grand Lounge',
  onRightClick,
  showAvatar = true,
}) {
  const navigate = useNavigate()

  function goBack() {
    if (backTo) {
      navigate(backTo)
      return
    }
    if (window.history.length > 1) navigate(-1)
    else navigate('/smokecraft')
  }

  return (
    <header className="smokecraft-premium-header">
      <div className="smokecraft-premium-header__brand">
        <button className="smokecraft-icon-button" onClick={goBack} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="material-symbols-outlined smokecraft-premium-header__shield">shield_person</span>
        <span className="smokecraft-premium-header__title">CRAFTHUB 360</span>
      </div>

      <div className="smokecraft-premium-header__meta">
        {step && <span className="smokecraft-premium-header__step">{step}</span>}
        <button
          className="smokecraft-premium-header__lounge"
          onClick={onRightClick || (() => navigate('/'))}
        >
          {rightLabel}
        </button>
        {showAvatar && (
          <div className="smokecraft-premium-header__avatar" title={sessionLabel}>
            <img alt="" src="/ch-logo.jpeg" />
          </div>
        )}
      </div>
    </header>
  )
}

export function SmokeCraftHeroSection({
  eyebrow = 'SmokeCraft 360',
  title,
  accent,
  children,
  align = 'left',
}) {
  return (
    <section className={`smokecraft-hero-section smokecraft-hero-section--${align}`}>
      <div className="smokecraft-premium-eyebrow">{eyebrow}</div>
      <h1 className="smokecraft-premium-title">
        {title}
        {accent && <><br /><em>{accent}</em></>}
      </h1>
      {children && <div className="smokecraft-premium-copy">{children}</div>}
    </section>
  )
}

export function SmokeCraftGlassPanel({ children, className = '', as: Tag = 'div', onClick }) {
  return (
    <Tag className={`smokecraft-glass-panel ${className}`} onClick={onClick}>
      {children}
    </Tag>
  )
}

export function SmokeCraftCtaButton({
  children,
  onClick,
  icon = 'arrow_forward',
  variant = 'gold',
  disabled = false,
}) {
  return (
    <button
      className={`smokecraft-cta smokecraft-cta--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon && <span className="material-symbols-outlined">{icon}</span>}
    </button>
  )
}

export function SmokeCraftInfoCard({ icon = 'auto_awesome', title, children, meta, onClick }) {
  return (
    <SmokeCraftGlassPanel as={onClick ? 'button' : 'div'} className="smokecraft-info-card" onClick={onClick}>
      <div className="smokecraft-info-card__icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        {meta && <div className="smokecraft-info-card__meta">{meta}</div>}
        <h3>{title}</h3>
        {children && <p>{children}</p>}
      </div>
    </SmokeCraftGlassPanel>
  )
}

export function SmokeCraftImagePanel({ src, title, subtitle, children }) {
  return (
    <div className="smokecraft-image-panel">
      {src && <img src={src} alt={title || ''} />}
      <div className="smokecraft-image-panel__shade" />
      <div className="smokecraft-image-panel__content">
        {subtitle && <div className="smokecraft-premium-eyebrow">{subtitle}</div>}
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function SmokeCraftProgressNav({ items = [], active }) {
  return (
    <div className="smokecraft-progress-nav">
      {items.map((item, index) => {
        const isActive = active === item.id || active === item.label
        return (
          <div key={item.id || item.label} className={`smokecraft-progress-nav__item${isActive ? ' is-active' : ''}`}>
            <div className="smokecraft-progress-nav__orb">
              <span className="material-symbols-outlined">{item.icon || 'radio_button_checked'}</span>
            </div>
            <strong>{item.number || index + 1}</strong>
            <span>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SmokeCraftBottomNav({ active = 'smokecraft' }) {
  const navigate = useNavigate()
  const items = [
    { id: 'smokecraft', icon: 'smoking_rooms', label: 'SmokeCraft', to: '/smokecraft' },
    { id: 'rewards', icon: 'emoji_events', label: 'Rewards', to: '/smokecraft/leaderboard' },
    { id: 'passport', icon: 'menu_book', label: 'Passport', to: '/passport' },
    { id: 'crafthub', icon: 'grid_view', label: 'CraftHub', to: '/crafthub' },
  ]

  return (
    <nav className="smokecraft-bottom-nav-premium">
      {items.map(item => (
        <button
          key={item.id}
          className={active === item.id ? 'is-active' : ''}
          onClick={() => navigate(item.to)}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
