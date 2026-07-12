import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const baseBtn = {
  display: 'block',
  width: '100%',
  border: 'none',
  borderRadius: 28,
  padding: '16px 24px',
  fontSize: 16,
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 52,
}

/**
 * Bottom action bar — always real React buttons, never transparent hotspots.
 * Sits at the bottom of SmokeCraftAppShell or fixed on legacy pages.
 */
export default function SmokeCraftNavBar({
  primary,
  onPrimary,
  primaryDisabled,
  secondary,
  onSecondary,
  fixed = true,
}) {
  const wrapper = fixed
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 500,
      }
    : {}

  return (
    <div
      role="navigation"
      aria-label="Screen navigation"
      style={{
        ...wrapper,
        padding: '14px 20px max(env(safe-area-inset-bottom, 16px), 20px)',
        background: 'linear-gradient(to top, rgba(5,5,5,0.97) 60%, rgba(5,5,5,0))',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {secondary && onSecondary && (
        <button
          type="button"
          onClick={() => { triggerHaptic('light'); onSecondary() }}
          style={{
            ...baseBtn,
            pointerEvents: 'auto',
            background: 'transparent',
            color: GOLD,
            border: `1.5px solid ${GOLD}`,
            fontSize: 15,
            padding: '14px 24px',
          }}
        >
          {secondary}
        </button>
      )}
      <button
        type="button"
        disabled={!!primaryDisabled}
        onClick={() => { if (!primaryDisabled) { triggerHaptic('medium'); onPrimary() } }}
        style={{
          ...baseBtn,
          pointerEvents: 'auto',
          background: primaryDisabled ? 'rgba(233,193,118,0.2)' : GOLD,
          color: primaryDisabled ? 'rgba(10,6,3,0.35)' : DARK,
          boxShadow: primaryDisabled ? 'none' : '0 4px 24px rgba(233,193,118,0.45)',
          cursor: primaryDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {primary}
      </button>
    </div>
  )
}
