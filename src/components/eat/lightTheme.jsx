/**
 * Phase 7D/7E light theme — white/off-white + navy + gold/blue.
 * Additive sibling to ui.jsx (dark navy theme). Scoped to POS3Handheld and
 * EATCommandHub only; the dark theme in ui.jsx remains the default for every
 * other POS3/E.A.T. screen and is not modified by this file.
 */
import { useNavigate } from 'react-router-dom'

export const L_NAVY = '#13294b'
export const L_GOLD = '#c9952c'
export const L_BLUE = '#2a4d8f'
export const L_BG = '#f7f6f2'

export function LightShell({ children, style }) {
  return (
    <div style={{ minHeight: '100vh', background: L_BG, color: '#1c2230', fontFamily: 'system-ui, sans-serif', ...style }}>
      {children}
    </div>
  )
}

export function LightCard({ children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 14, boxShadow: '0 1px 3px rgba(19,41,75,0.06)', ...style }}>
      {children}
    </div>
  )
}

export function LightPill({ children, tone = 'navy' }) {
  const tones = {
    navy: { bg: 'rgba(19,41,75,0.08)', fg: L_NAVY },
    gold: { bg: 'rgba(201,149,44,0.14)', fg: '#9c7320' },
    green: { bg: 'rgba(46,160,90,0.12)', fg: '#1f7a45' },
    blue: { bg: 'rgba(42,77,143,0.12)', fg: L_BLUE },
    red: { bg: 'rgba(196,60,60,0.12)', fg: '#b33b3b' },
  }
  const c = tones[tone] || tones.navy
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: c.fg, background: c.bg, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function LightHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
      <div>
        {eyebrow && <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: L_GOLD, fontWeight: 700 }}>{eyebrow}</div>}
        <div style={{ fontSize: 19, fontWeight: 800, color: L_NAVY }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#6b7385', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}

export function StaffBand({ staff, right }) {
  return (
    <div style={{ background: L_NAVY, color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
          {staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{staff.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {staff.role}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddc84', display: 'inline-block' }} />
            On Duty
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{right}</div>
    </div>
  )
}

export function LightTouchButton({ children, onClick, tone = 'navy', disabled, title, style }) {
  const tones = {
    navy:  { bg: L_NAVY, fg: '#fff' },
    gold:  { bg: L_GOLD, fg: '#1c2230' },
    ghost: { bg: 'rgba(255,255,255,0.12)', fg: '#fff' },
    outline: { bg: 'transparent', fg: L_NAVY, border: `1px solid rgba(19,41,75,0.25)` },
  }
  const c = tones[tone] || tones.navy
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? title : undefined}
      style={{
        background: c.bg, color: c.fg, border: c.border || 'none', borderRadius: 10,
        padding: '9px 14px', fontWeight: 700, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, minHeight: 40, ...style,
      }}
    >{children}</button>
  )
}

export function CategoryTile({ label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 14, padding: '16px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: 84,
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: '50%', background: L_BLUE, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} className="material-symbols-outlined">{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: L_NAVY }}>{label}</span>
    </button>
  )
}

export function LightBottomNav({ items }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, background: L_NAVY,
      display: 'flex', justifyContent: 'space-around', padding: '8px 4px', zIndex: 40,
    }}>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={it.disabled ? undefined : it.onClick}
          disabled={it.disabled}
          title={it.disabled ? it.disabledReason : undefined}
          style={{
            background: 'transparent', border: 'none', color: it.active ? L_GOLD : 'rgba(255,255,255,0.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700,
            cursor: it.disabled ? 'not-allowed' : 'pointer', opacity: it.disabled ? 0.4 : 1, position: 'relative', padding: '4px 10px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{it.icon}</span>
          {it.label}
          {it.badge ? (
            <span style={{ position: 'absolute', top: -2, right: 2, background: '#c43c3c', color: '#fff', borderRadius: 999, fontSize: 9, padding: '0 4px', minWidth: 14 }}>{it.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function useLightNavigate() {
  return useNavigate()
}
