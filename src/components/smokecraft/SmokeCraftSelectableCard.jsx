import { triggerHaptic } from '../../utils/haptics.js'

/**
 * Larger selectable card used for wrapper-profile and session-comparison
 * items on the SmokeCraft Format page — same interaction contract as
 * SmokeCraftInsightChip (real button, selected state, haptic feedback)
 * but sized for a full row/card rather than a small pill.
 */
export default function SmokeCraftSelectableCard({
  isSelected,
  isHighlighted,
  onSelect,
  className = '',
  ariaLabel,
  children,
}) {
  function handleActivate() {
    triggerHaptic('light')
    onSelect()
  }

  return (
    <button
      type="button"
      className={`smokecraft-selectable-card${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''} ${className}`}
      onClick={handleActivate}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
