import { triggerHaptic } from '../../utils/haptics.js'

/**
 * Single interactive profile-tag chip used on SmokeCraft cigar recommendation
 * cards. Always a real <button> — never a styled <span> — so it is clickable,
 * tappable, and keyboard accessible by default.
 */
export default function SmokeCraftInsightChip({ chip, isSelected, onSelect }) {
  function handleActivate(e) {
    e.stopPropagation()
    triggerHaptic('light')
    onSelect(chip)
  }

  return (
    <button
      type="button"
      className={`smokecraft-insight-chip${isSelected ? ' is-selected' : ''}`}
      onClick={handleActivate}
      aria-pressed={isSelected}
      aria-label={`${chip.label}${chip.category ? `, ${chip.category}` : ''}`}
    >
      {chip.label}
    </button>
  )
}
