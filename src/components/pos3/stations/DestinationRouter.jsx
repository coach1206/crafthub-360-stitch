/**
 * DestinationRouter — small visual summary of where a ticket's items will
 * route (kitchen/bar/humidor/retail counts), shown above the readiness
 * panel on the handheld ordering screen.
 */
import { Pill } from '../../eat/ui.jsx'

export default function DestinationRouter({ groups }) {
  const dests = Object.keys(groups || {}).filter((d) => groups[d]?.length)
  if (!dests.length) return null
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {dests.map((d) => (
        <Pill key={d} label={`${d}: ${groups[d].length} item${groups[d].length > 1 ? 's' : ''}`} tone={d} />
      ))}
    </div>
  )
}
