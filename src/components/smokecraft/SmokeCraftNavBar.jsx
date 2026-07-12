import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const baseBtn = {
  display: 'block',
  width: '100%',
  border: 'none',
  borderRadius: 28,
  padding: '14px 24px',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  pointerEvents: 'auto',
}

/**
 * Fixed bottom navigation bar — always a real React button, never a transparent hotspot.
 * Screen remains operable when the background image is hidden or fails to load.
 */
export default function SmokeCraftNavBar({ primary, onPrimary, primaryDisabled, secondary, onSecondary }) {
  return (
    <div
      role="navigation"
      aria-label="Screen navigation"
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 500,
        padding: '16px 20px 32px',
        background: 'linear-gradient(to top, rgba(5,5,5,1) 55%, rgba(5,5,5,0))',
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
            background: 'transparent',
            color: GOLD,
            border: `1px solid ${GOLD}`,
            padding: '12px 24px',
            fontSize: 14,
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
          background: primaryDisabled ? 'rgba(233,193,118,0.25)' : GOLD,
          color: primaryDisabled ? 'rgba(10,6,3,0.4)' : DARK,
          boxShadow: primaryDisabled ? 'none' : '0 4px 20px rgba(233,193,118,0.4)',
          cursor: primaryDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {primary}
      </button>
    </div>
  )
}
