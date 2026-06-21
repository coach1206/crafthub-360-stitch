/**
 * TouchButton — touch-first action button. Min 48px height, press-scale
 * animation, tone-based color, optional haptic tap on press.
 */
import { GOLD } from '../eat/ui.jsx'
import { selectionTap } from '../../services/shared/haptics.js'

const TONES = {
  primary: { bg: `linear-gradient(135deg,${GOLD},#b88f2f)`, fg: '#0f1419' },
  success: { bg: '#2f9e5b', fg: '#fff' },
  warning: { bg: '#d9822b', fg: '#fff' },
  danger:  { bg: '#c0443a', fg: '#fff' },
  neutral: { bg: '#2a3340', fg: '#cdd5df' },
}

export default function TouchButton({
  children, onClick, tone = 'primary', disabled = false, hapticFn = selectionTap, style, title,
}) {
  const c = TONES[tone] || TONES.primary

  function handleClick(e) {
    if (disabled) return
    try { hapticFn && hapticFn() } catch {}
    onClick && onClick(e)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className="pos3-touch-btn"
      style={{
        minHeight: 48,
        background: c.bg,
        color: c.fg,
        border: 'none',
        borderRadius: 14,
        padding: '12px 18px',
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform 0.08s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.95)' }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}
