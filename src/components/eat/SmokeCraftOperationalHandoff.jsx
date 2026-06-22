/**
 * SmokeCraftOperationalHandoff — E.A.T. visibility into SmokeCraft's POS3
 * purchase handoff. Local/session-only: a real multi-guest operational view
 * requires a backend or shared event store, which is honestly disclosed
 * rather than faked.
 */
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { Card, Pill } from './ui.jsx'
import { getSmokeEATHandoffSummary, getSmokeInventoryImpactPreview, getSmokePOSHandoff } from '../../services/smokecraft/smokePOSHandoffService.js'

export default function SmokeCraftOperationalHandoff() {
  const { session } = useGuestSession()
  const posHandoff = getSmokePOSHandoff(session)
  const summary = getSmokeEATHandoffSummary(session)
  const inventory = getSmokeInventoryImpactPreview(session)

  const verifiedCount = posHandoff.status === 'verified' ? 1 : 0
  const pendingCount = posHandoff.status === 'pending_pos_verification' || posHandoff.status === 'intent_created' ? 1 : 0

  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>SmokeCraft Operational Handoff</div>
      <div style={{ fontSize: 11, color: '#8b95a3', marginBottom: 12 }}>{summary.backendRequiredReason}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Pill label={summary.visibleToManagement ? 'visible to management' : 'no active handoff'} tone={summary.visibleToManagement ? 'open' : 'info'} />
        <Pill label={'POS3: ' + posHandoff.status} tone={posHandoff.status === 'verified' ? 'open' : posHandoff.status === 'rejected' ? 'critical' : 'pending'} />
        <Pill label="backend required" tone="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#8b95a3' }}>Verified purchases (this session)</div>
          <div style={{ fontWeight: 700 }}>{verifiedCount}</div>
        </div>
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#8b95a3' }}>Pending reward (this session)</div>
          <div style={{ fontWeight: 700 }}>{pendingCount}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 6 }}>Inventory impact preview</div>
      <div style={{ fontSize: 13, marginBottom: 12 }}>{inventory.reason}</div>

      <div style={{ fontSize: 12, color: '#8b95a3' }}>Management note: this panel reflects only the current browser's guest session. A venue-wide SmokeCraft operational view requires a backend or shared event store.</div>
    </Card>
  )
}
