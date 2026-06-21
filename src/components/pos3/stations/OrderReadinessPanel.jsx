/**
 * OrderReadinessPanel — shown before "Send Ticket" is pressed. Renders the
 * result of orderReadinessService.checkReadiness(ticket): per-item checks,
 * warnings, and the overall verdict (ready/warning/blocked/manager_review).
 */
import { Card, Pill, GOLD } from '../../eat/ui.jsx'
import TouchButton from '../TouchButton.jsx'

const STATUS_TONE = { ready: 'open', warning: 'warning', blocked: 'critical', manager_review: 'critical' }
const STATUS_LABEL = {
  ready: 'Ready to Send', warning: 'Send With Warnings', blocked: 'Blocked — Manager Override Required', manager_review: 'Needs Manager Review',
}

export default function OrderReadinessPanel({ readiness, onConfirmSend, onManagerOverride, onCancel }) {
  if (!readiness) return null
  const { overallStatus, perItemChecks, warnings } = readiness

  return (
    <Card className={overallStatus === 'ready' ? 'checkout-ready' : ''} style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>Order Readiness</div>
        <Pill label={STATUS_LABEL[overallStatus] || overallStatus} tone={STATUS_TONE[overallStatus] || 'info'} />
      </div>

      {perItemChecks.map((c) => (
        <div key={c.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12 }}>{c.name} <span style={{ color: '#8b95a3' }}>({c.destination})</span></span>
          <Pill label={c.status} tone={STATUS_TONE[c.status] || 'info'} />
        </div>
      ))}

      {warnings.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: GOLD }}>
          {warnings.map((w, i) => <div key={i}>• {w}</div>)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <TouchButton tone="neutral" onClick={onCancel} style={{ flex: 1 }}>Cancel</TouchButton>
        {(overallStatus === 'blocked' || overallStatus === 'manager_review') && onManagerOverride && (
          <TouchButton tone="warning" onClick={onManagerOverride} style={{ flex: 1 }}>Manager Override</TouchButton>
        )}
        {overallStatus !== 'blocked' && (
          <TouchButton tone={overallStatus === 'warning' ? 'warning' : 'success'} onClick={onConfirmSend} style={{ flex: 2 }}>
            {overallStatus === 'warning' ? 'Send Anyway' : 'Confirm Send'}
          </TouchButton>
        )}
      </div>
    </Card>
  )
}
