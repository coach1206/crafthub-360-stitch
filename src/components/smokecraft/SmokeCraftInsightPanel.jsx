const FALLBACK_DESCRIPTION = 'More details coming soon for this SmokeCraft profile tag.'

/**
 * Small detail panel shown when a profile-tag chip is selected on a cigar
 * recommendation card. Renders inline near the grid rather than a full
 * blocking modal, so it never covers the cigar image or card stats.
 */
export default function SmokeCraftInsightPanel({ cigarName, chip, onClose }) {
  if (!chip) return null

  return (
    <div className="smokecraft-insight-panel" role="dialog" aria-label={`${chip.label} detail`}>
      <div className="smokecraft-insight-panel__header">
        <span className="smokecraft-insight-panel__eyebrow">{cigarName}{chip.category ? ` · ${chip.category}` : ''}</span>
        <button
          type="button"
          className="smokecraft-insight-panel__close"
          onClick={onClose}
          aria-label="Close detail"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>
      <h3 className="smokecraft-insight-panel__title">{chip.label}</h3>
      {chip.value && <div className="smokecraft-insight-panel__value">{chip.value}</div>}
      <p className="smokecraft-insight-panel__description">{chip.description || FALLBACK_DESCRIPTION}</p>
    </div>
  )
}
