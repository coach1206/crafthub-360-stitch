import PoweredByNoveeOSBadge from '../../shared/PoweredByNoveeOSBadge.jsx'

/**
 * Shared premium tablet/kiosk command-shell primitives for POS360 / E.A.T. /
 * Venue Command Hub screens. Every major command screen composes the same
 * five zones (rail, top bar, canvas, right panel, bottom strip) from this
 * file instead of hand-rolling its own grid — this is the MVP2 structure-reset
 * fix: one shell, many screens, instead of each page drifting independently.
 *
 * Palette source of truth: public/Venue command HUb 2.png — warm ivory base,
 * deep navy rail/header contrast, champagne gold accents. Layout zones come
 * from public/TABLE MANAGEMENT SYSTEM .png, restyled into this light system.
 */

export const IVORY = '#f7f3ea'
export const IVORY_PANEL = '#fffdf8'
export const NAVY = '#13294b'
export const NAVY_SOFT = '#1c3a64'
export const GOLD = '#c9952c'
export const GOLD_DEEP = '#a87420'
export const SLATE = '#5a6b80'
export const LINE = 'rgba(19,41,75,0.12)'

export const SHELL_GRID = {
  height: '100vh', overflow: 'hidden', color: NAVY, fontFamily: 'system-ui, sans-serif',
  display: 'grid', gridTemplateColumns: '220px minmax(0,1fr) 380px', gridTemplateRows: 'auto minmax(0,1fr) auto',
  background: IVORY,
}

export const BIG_BTN = { minHeight: 56, borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }
export const NAV_BTN_HEIGHT = 44

let shellStylesInjected = false
function injectShellStyles() {
  if (shellStylesInjected || typeof document === 'undefined') return
  shellStylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    @keyframes ch-badge-ring-pulse { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.25); } }
    .ch-badge-ring--pulse { animation: ch-badge-ring-pulse 2.2s ease-in-out infinite; }
    .ch-glass-panel { transition: box-shadow 0.15s, transform 0.1s; }
    .ch-glass-panel:active { transform: translateY(1px); }
    .ch-touch-btn { transition: box-shadow 0.12s, transform 0.08s, background 0.12s; }
    .ch-touch-btn:active { transform: translateY(1px) scale(0.99); }
    @media (prefers-reduced-motion: reduce) {
      .ch-badge-ring--pulse { animation: none !important; }
      * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
    }
  `
  document.head.appendChild(style)
}

/** Outer grid. Pass the five zones as named slots — they self-position via gridRow/gridColumn. */
export function CommandAppShell({ rail, topBar, canvas, rightPanel, bottomStrip }) {
  injectShellStyles()
  return (
    <div style={SHELL_GRID}>
      {rail}
      {topBar}
      {canvas}
      {rightPanel}
      {bottomStrip}
    </div>
  )
}

/** Left navigation rail — branding, primary nav, quick launch, manager/status, NOVEE OS badge. Deep navy, matching the Venue Command Hub header bar. */
export function CommandLeftRail({ brand, venueName, monogram, navItems, activeLabel, onNavigate, quickLaunch = [], manager }) {
  return (
    <nav style={{
      gridRow: '1 / span 3', gridColumn: 1, display: 'flex', flexDirection: 'column', padding: '18px 14px', overflowY: 'auto',
      background: `linear-gradient(190deg, ${NAVY_SOFT} 0%, ${NAVY} 60%, #0e2040 100%)`, borderRight: `1px solid rgba(201,149,44,0.25)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px 4px' }}>
        <span style={{ color: GOLD, fontWeight: 800, fontSize: 18, letterSpacing: '0.04em' }}>{brand}</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, padding: '0 4px 16px', letterSpacing: '0.1em' }}>{venueName}</div>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', alignSelf: 'center', marginBottom: 16,
        background: 'radial-gradient(160deg,#1c3a64,#0e2040)', border: `1.5px solid ${GOLD}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(201,149,44,0.35)',
      }}>
        <span style={{ color: '#f3d999', fontSize: 22, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{monogram}</span>
      </div>
      {navItems.map(([label, to, icon]) => {
        const active = label === activeLabel
        return (
          <CommandTouchButton key={label} variant={active ? 'rail-active' : 'rail'} disabled={!to}
            onClick={() => to && onNavigate(to)}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>{label}
          </CommandTouchButton>
        )
      })}
      {quickLaunch.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(201,149,44,0.22)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, padding: '0 4px 8px', letterSpacing: '0.08em' }}>QUICK LAUNCH</div>
          {quickLaunch.map(([label, to, icon]) => (
            <CommandTouchButton key={label} variant="rail" onClick={() => onNavigate(to)}>
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>{label}
            </CommandTouchButton>
          ))}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        {manager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,149,44,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: GOLD }}>{manager.initials}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{manager.name}</div>
              <div style={{ fontSize: 10, color: '#7ddca0', fontWeight: 700 }}>● System Online</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 8 }}><PoweredByNoveeOSBadge variant="sidebar" compact /></div>
      </div>
    </nav>
  )
}

/** Top command bar — eyebrow + title on the left, controls/actions on the right. Light ivory, navy text. */
export function CommandTopBar({ eyebrow, title, controls }) {
  return (
    <div style={{
      gridColumn: '2 / span 2', gridRow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '16px 24px', borderBottom: `1px solid ${LINE}`, flexWrap: 'wrap', gap: 10, background: IVORY_PANEL,
    }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ fontSize: 21, fontWeight: 800, color: NAVY, marginTop: 2 }}>{title}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{controls}</div>
    </div>
  )
}

/** Center command canvas wrapper — metrics/header content (flexShrink:0) + the canvas body filling remaining height with no inner scroll. Light venue-inspired floor treatment: warm stone/marble tones, no dark bokeh. */
export function CommandCanvas({ metrics, children }) {
  return (
    <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px 18px 0', background: IVORY }}>
      {metrics && <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexShrink: 0 }}>{metrics}</div>}
      <div style={{
        flex: 1, minHeight: 0, position: 'relative', borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${LINE}`,
        background: `
          repeating-linear-gradient(120deg, rgba(19,41,75,0.035) 0px, rgba(19,41,75,0.035) 1px, transparent 1px, transparent 64px),
          repeating-linear-gradient(30deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 64px),
          radial-gradient(circle at 12% 10%, rgba(201,149,44,0.16), transparent 42%),
          radial-gradient(circle at 88% 18%, rgba(19,41,75,0.08), transparent 38%),
          radial-gradient(circle at 25% 90%, rgba(201,149,44,0.12), transparent 46%),
          radial-gradient(circle at 75% 78%, rgba(120,150,110,0.08), transparent 40%),
          linear-gradient(160deg, #fdfaf3 0%, #f4ecd9 50%, #e9dec0 100%)`,
        boxShadow: 'inset 0 0 60px rgba(19,41,75,0.08), 0 2px 18px rgba(19,41,75,0.1)',
      }}>
        {children}
      </div>
    </div>
  )
}

/** Right intelligence/action panel — scrollable, holds selected-object detail + intelligence cards. White-on-ivory panel. */
export function CommandRightPanel({ children }) {
  return (
    <div style={{
      gridColumn: 3, gridRow: 2, overflowY: 'auto', padding: 18,
      background: IVORY_PANEL, borderLeft: `1px solid ${LINE}`,
    }}>
      {children}
    </div>
  )
}

/** Bottom quick-action/status strip — tabbed, fixed max height so secondary content never grows the page. */
export function CommandBottomStrip({ tabs, activeTab, onTabChange, children, maxHeight = 190 }) {
  return (
    <div style={{
      gridColumn: '2 / span 2', gridRow: 3, borderTop: `1px solid ${LINE}`,
      background: IVORY_PANEL, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px 0', overflowX: 'auto', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => onTabChange(t)} style={{
            minHeight: NAV_BTN_HEIGHT, padding: '0 16px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
            background: activeTab === t ? 'rgba(201,149,44,0.14)' : 'transparent',
            color: activeTab === t ? GOLD_DEEP : SLATE, borderBottom: activeTab === t ? `2px solid ${GOLD}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '12px 18px 16px', maxHeight, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

/** Real badge component — circular icon chip + label, gradient fill, border, shadow, color ring. Replaces flat glyph pills. */
export function CommandStatusBadge({ color, icon, children, pulse }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color,
      background: `linear-gradient(160deg, ${color}22, ${color}10)`, border: `1px solid ${color}55`,
      borderRadius: 999, padding: '3px 10px 3px 4px', boxShadow: `0 1px 4px ${color}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
    }}>
      <span className={pulse ? 'ch-badge-ring ch-badge-ring--pulse' : 'ch-badge-ring'} style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 32% 28%, ${color}, ${color}cc 70%)`, boxShadow: `0 0 0 2px ${color}25`,
      }}>
        {icon ? (
          <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#fff' }}>{icon}</span>
        ) : (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
        )}
      </span>
      {children}
    </span>
  )
}

/** Touch-ready button: rail nav item, rail quick-launch item, or a major canvas/panel action (56px). */
export function CommandTouchButton({ variant = 'action', active, disabled, onClick, children, style, ...rest }) {
  if (variant === 'rail' || variant === 'rail-active') {
    const isActive = variant === 'rail-active'
    return (
      <button type="button" onClick={onClick} disabled={disabled} className="ch-touch-btn" {...rest} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 10px', borderRadius: 10,
        fontSize: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', marginBottom: 2, minHeight: NAV_BTN_HEIGHT,
        color: isActive ? '#1c1206' : disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)',
        background: isActive ? GOLD : 'transparent', fontWeight: isActive ? 700 : 500,
        boxShadow: isActive ? '0 0 14px rgba(201,149,44,0.5)' : 'none', transition: 'background 0.12s',
        ...style,
      }}>{children}</button>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="ch-touch-btn" {...rest} style={{
      ...BIG_BTN,
      border: active ? 'none' : `1px solid ${LINE}`,
      background: active ? `linear-gradient(160deg, #e0b65a, ${GOLD} 60%, ${GOLD_DEEP})` : `linear-gradient(160deg, #ffffff, ${IVORY_PANEL})`,
      color: active ? '#1c1206' : NAVY,
      boxShadow: active ? '0 2px 10px rgba(201,149,44,0.4), inset 0 1px 0 rgba(255,255,255,0.5)' : '0 1px 3px rgba(19,41,75,0.08)',
      ...style,
    }}>{children}</button>
  )
}

/** Glassmorphic intelligence card used inside the right panel / bottom strip. Layered depth: gradient fill, inner highlight, soft shadow, gold border. */
export function CommandGlassPanel({ title, children, style }) {
  return (
    <div className="ch-glass-panel" style={{
      marginTop: 12, borderRadius: 14, padding: 14,
      background: 'linear-gradient(165deg, rgba(255,253,248,0.92), rgba(247,238,217,0.75))',
      border: '1px solid rgba(201,149,44,0.32)', backdropFilter: 'blur(6px)',
      boxShadow: '0 6px 18px rgba(19,41,75,0.1), 0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(201,149,44,0.1) inset',
      ...style,
    }}>
      {title && <div style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_DEEP, letterSpacing: '0.07em', marginBottom: 8 }}>{title.toUpperCase()}</div>}
      {children}
    </div>
  )
}
