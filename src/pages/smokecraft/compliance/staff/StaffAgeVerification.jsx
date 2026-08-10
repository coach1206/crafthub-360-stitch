import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { page, wrap, card, h1Style, h2Style, backBtn, primaryBtn, secondaryBtn, draftBanner, statusBadge, DANGER, OK } from '../complianceUiKit.js'

/**
 * Staff age-verification UI (Production Package 6 Correction). Records a
 * real, server-authoritative age_verification_records row with
 * method='staff_verified' and the AUTHENTICATED staff user as the actor —
 * enforced server-side (complianceController.submitAgeVerification requires
 * req.user to be a real staff-role actor; never trusts a client-claimed
 * role). No government-ID image is captured or stored — out of scope per
 * the mandate. This screen exists to make explicit that verification is a
 * legal responsibility, not a formality.
 */
export default function StaffAgeVerification() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const venueId = searchParams.get('venueId') || ''

  const [subjectId, setSubjectId] = useState('')
  const [jurisdictionCode, setJurisdictionCode] = useState('US-DEFAULT')
  const [decision, setDecision] = useState(null) // 'approve' | 'deny'
  const [reason, setReason] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!subjectId) {
      api.whoAmI().then((who) => { if (who) { setSubjectId(who.subjectId); setSubjectType(who.subjectType) } })
    }
  }, [subjectId])

  async function submit() {
    if (!decision || !subjectId) return
    setBusy(true); setError(null)
    const r = await api.submitAgeVerification({
      subjectType: 'guest', subjectId, jurisdictionCode, method: 'staff_verified',
      staffApproved: decision === 'approve',
    })
    setBusy(false)
    if (!r.ok) { setError(r.error); return }
    setResult(r.record)
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page}>
        <div style={wrap}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← Back</button>
          <h1 style={h1Style}>Staff Age Verification</h1>
          <div role="note" style={draftBanner}>DRAFT — PENDING QUALIFIED LEGAL COUNSEL REVIEW. Verification is a legal responsibility, not optional.</div>

          <section style={card} aria-labelledby="sv-h">
            <h2 id="sv-h" style={h2Style}>Order / Venue Association</h2>
            <p style={{ fontSize: 12 }}>Order: {orderId || '(none — direct verification)'} · Venue: {venueId || '(unspecified)'}</p>

            <label htmlFor="sv-subject" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>Customer subject ID</label>
            <input id="sv-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ minHeight: 44, width: '100%', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#e5e2e1', border: '1px solid rgba(233,193,118,0.22)' }} />

            <label htmlFor="sv-jurisdiction" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>Jurisdiction code</label>
            <input id="sv-jurisdiction" value={jurisdictionCode} onChange={(e) => setJurisdictionCode(e.target.value)} style={{ minHeight: 44, width: '100%', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#e5e2e1', border: '1px solid rgba(233,193,118,0.22)' }} />

            <fieldset style={{ border: 'none', padding: 0, margin: '12px 0' }}>
              <legend style={{ fontSize: 12 }}>Inspect ID in person, then record the outcome:</legend>
              <button type="button" style={{ ...secondaryBtn, borderColor: OK, color: OK, marginRight: 8 }} aria-pressed={decision === 'approve'} onClick={() => setDecision('approve')}>Approve</button>
              <button type="button" style={{ ...secondaryBtn, borderColor: DANGER, color: DANGER }} aria-pressed={decision === 'deny'} onClick={() => setDecision('deny')}>Deny</button>
            </fieldset>

            {decision === 'deny' && (
              <>
                <label htmlFor="sv-reason" style={{ display: 'block', fontSize: 12 }}>Reason</label>
                <input id="sv-reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 44, width: '100%', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#e5e2e1', border: '1px solid rgba(233,193,118,0.22)' }} />
              </>
            )}

            {error && <p role="alert" style={{ color: DANGER, fontSize: 12 }}>{error}</p>}
            {result && (
              <div role="status" style={{ marginTop: 10 }}>
                <span style={statusBadge(result.result === 'approved' ? 'ok' : 'danger')}>{result.result}</span>
                <p style={{ fontSize: 11 }}>Expires: {result.expires_at} · Staff actor recorded server-side · Audit event recorded.</p>
              </div>
            )}

            <button type="button" style={primaryBtn(!!decision && !!subjectId)} disabled={!decision || !subjectId || busy} onClick={submit}>
              {busy ? 'Recording…' : 'Record verification'}
            </button>
          </section>
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
