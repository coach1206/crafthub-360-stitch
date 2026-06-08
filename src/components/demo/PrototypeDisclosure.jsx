/**
 * PrototypeDisclosure — Phase 13
 * Clean, non-scary prototype disclosure banner.
 * Used on InvestorDemo, VenueOwnerDemo, PilotOnboarding, FounderDemo (when toggle active).
 */

import { PROTOTYPE_DISCLOSURE_TEXT } from '../../config/demoModeConfig.js'

export default function PrototypeDisclosure({ compact = false }) {
  return (
    <div style={{
      background:   'rgba(201,168,76,0.05)',
      border:       '1px solid rgba(201,168,76,0.18)',
      borderRadius: '8px',
      padding:      compact ? '0.6rem 0.875rem' : '0.875rem 1.1rem',
      display:      'flex',
      gap:          '0.6rem',
      alignItems:   'flex-start',
    }}>
      <span style={{ fontSize: compact ? '0.7rem' : '0.75rem', color: 'rgba(201,168,76,0.5)', flexShrink: 0, marginTop: '0.05rem' }}>⚙</span>
      <p style={{
        margin:      0,
        fontSize:    compact ? '0.7rem' : '0.75rem',
        color:       'rgba(201,168,76,0.65)',
        lineHeight:  1.55,
        fontFamily:  'Georgia, serif',
        letterSpacing: '0.01em',
      }}>
        {PROTOTYPE_DISCLOSURE_TEXT}
      </p>
    </div>
  )
}
