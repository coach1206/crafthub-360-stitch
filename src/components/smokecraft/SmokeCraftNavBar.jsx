import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const baseBtn = {
  display: 'block',
  border: 'none',
  borderRadius: 24,
  padding: '13px 22px',
  fontSize: 'clamp(11px, 1.4vw, 14px)',
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 48,
  lineHeight: 1.2,
}

/**
 * Bottom action bar — always real React buttons, never transparent hotspots.
 * Compact, centered, single row (wraps to two lines only if the viewport is
 * too narrow for both buttons side by side) — sized to its own controls
 * rather than stretching edge-to-edge, so it no longer covers page content
 * above it (confirmed defect on Mentor Selection / Seed & Soil: a tall,
 * full-width two-row bar covered the bottom of long scrollable content).
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
        padding: '10px 16px max(env(safe-area-inset-bottom, 10px), 14px)',
        background: 'linear-gradient(to top, rgba(5,5,5,0.97) 55%, rgba(5,5,5,0))',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          maxWidth: 560,
        }}
      >
        {secondary && onSecondary && (
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); onSecondary() }}
            style={{
              ...baseBtn,
              flexBasis: primary ? '30%' : '100%',
              pointerEvents: 'auto',
              background: 'transparent',
              color: GOLD,
              border: `1.5px solid ${GOLD}`,
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
            flexBasis: secondary ? '65%' : '100%',
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
    </div>
  )
}
