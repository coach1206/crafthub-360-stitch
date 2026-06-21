/**
 * InventoryWarningBadge — small badge showing ok/low/out stock state for a SKU.
 */
import { Pill } from '../../eat/ui.jsx'

export default function InventoryWarningBadge({ status }) {
  if (status === 'out') return <Pill label="Out of Stock" tone="critical" />
  if (status === 'low') return <Pill label="Low Stock" tone="warning" />
  return <Pill label="In Stock" tone="open" />
}
