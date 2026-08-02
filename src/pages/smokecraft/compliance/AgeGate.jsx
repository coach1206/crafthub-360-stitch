import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { GOLD, page, wrap, card, h1Style, h2Style, backBtn, primaryBtn, secondaryBtn, inputStyle, labelStyle, draftBanner, errorSummary, statusBadge, DANGER, DICT, useLocale, setLocalePref } from './complianceUiKit.js'

/**
 * Customer-facing age-gate UI (Production Package 6 Correction). Real,
 * backend-connected — every state below reflects the server-authoritative
 * age_verification_records evaluator in complianceController.js. No
 * eligibility decision is ever computed client-side or stored in
 * localStorage as authority; the client only ever submits an attestation
 * method and displays the server's resulting state.
 */
export default function AgeGate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/smokecraft'
  const jurisdictionCode = searchParams.get('jurisdiction') || 'US-DEFAULT'

  const [locale, setLocale] = useState(useLocale())
  const t = DICT[locale]
  function toggleLocale() { const next = locale === 'en' ? 'es' : 'en'; setLocale(next); setLocalePref(next) }

  const [subjectId, setSubjectId] = useState(null)
  const [subjectType, setSubjectType] = useState('guest')
  const [jurisdictions, setJurisdictions] = useState([])
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(jurisdictionCode)
  const [method, setMethod] = useState('self_attestation')
  const [dob, setDob] = useState('')
  const [status, setStatus] = useState('idle') // idle | checking | pending | approved | denied | expired | error
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    api.whoAmI().then((who) => { if (who) { setSubjectId(who.subjectId); setSubjectType(who.subjectType) } })
    api.getJurisdictions().then((r) => { if (r.ok) setJurisdictions(r.jurisdictions.filter((j) => j.status === 'active')) })
  }, [])

  useEffect(() => {
    if (!subjectId) return
    checkExisting()
  }, [subjectId, selectedJurisdiction]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkExisting() {
    setStatus('checking')
    const r = await api.checkPurchaseEligibility(subjectType, subjectId, selectedJurisdiction)
    if (!r.ok) { setStatus('idle'); return }
    if (r.eligible) setStatus('approved')
    else if (r.reason === 'no_valid_age_verification') setStatus('idle')
    else setStatus('idle')
  }

  async function submit(e) {
    e?.preventDefault()
    setErrorMsg(null)
    if (!subjectId) { setErrorMsg('No verified session yet — please reload and try again.'); return }
    if (method === 'self_attestation' && !dob) { setErrorMsg(locale === 'en' ? 'Please enter your date of birth.' : 'Ingrese su fecha de nacimiento.'); return }
    setStatus('checking')
    const r = await api.submitAgeVerification({
      subjectType, subjectId, jurisdictionCode: selectedJurisdiction, method,
      declaredBirthdate: method === 'self_attestation' ? dob : undefined,
      providerResult: method === 'provider_adapter' ? 'approved' : undefined,
    })
    if (!r.ok) { setStatus('error'); setErrorMsg(r.error); return }
    setStatus(r.record.result === 'approved' ? 'approved' : 'denied')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page} lang={locale}>
        <div style={wrap}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← {locale === 'en' ? 'Back' : 'Atras'}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={h1Style}>{t.ageGateTitle}</h1>
            <button type="button" onClick={toggleLocale} style={secondaryBtn} aria-label="Toggle language">{t.langToggle}</button>
          </div>
          <div role="note" style={draftBanner}>{t.draftNotice}</div>

          <p style={{ fontSize: 14, lineHeight: 1.5 }}>{t.ageGateIntro}</p>

          {status === 'approved' && (
            <div style={card}>
              <span style={statusBadge('ok')} data-age-gate-state="approved">{t.approved}</span>
              <p style={{ fontSize: 13 }}>{locale === 'en' ? 'You are verified for tobacco purchases in this jurisdiction.' : 'Esta verificado para compras de tabaco en esta jurisdiccion.'}</p>
              <button type="button" style={secondaryBtn} onClick={() => navigate(returnTo)}>{locale === 'en' ? 'Continue' : 'Continuar'}</button>
            </div>
          )}

          {status !== 'approved' && (
            <form onSubmit={submit} style={card} data-age-gate-state={status} noValidate>
              <h2 style={h2Style}>{locale === 'en' ? 'Verify now' : 'Verificar ahora'}</h2>

              <label style={labelStyle} htmlFor="ag-jurisdiction">{t.jurisdiction}</label>
              <select id="ag-jurisdiction" style={inputStyle} value={selectedJurisdiction} onChange={(e) => setSelectedJurisdiction(e.target.value)}>
                {jurisdictions.length ? jurisdictions.map((j) => <option key={j.code} value={j.code}>{j.label}</option>) : <option value="US-DEFAULT">United States — default</option>}
              </select>

              <fieldset style={{ border: 'none', padding: 0, margin: '12px 0' }}>
                <legend style={labelStyle}>{locale === 'en' ? 'Verification method' : 'Metodo de verificacion'}</legend>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, minHeight: 44 }}>
                  <input type="radio" name="method" value="self_attestation" checked={method === 'self_attestation'} onChange={() => setMethod('self_attestation')} /> {t.selfAttest}
                </label>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, minHeight: 44 }}>
                  <input type="radio" name="method" value="provider_adapter" checked={method === 'provider_adapter'} onChange={() => setMethod('provider_adapter')} /> {locale === 'en' ? 'Third-party verification' : 'Verificacion de terceros'} <span style={{ opacity: 0.6, fontSize: 11 }}>{t.providerNote}</span>
                </label>
                <p style={{ fontSize: 12, opacity: 0.7, minHeight: 44, display: 'flex', alignItems: 'center' }}>{t.staffAssist} — {locale === 'en' ? 'ask a staff member in person' : 'consulte a un miembro del personal en persona'}</p>
              </fieldset>

              {method === 'self_attestation' && (
                <>
                  <label style={labelStyle} htmlFor="ag-dob">{t.dob} <span aria-hidden="true" style={{ color: DANGER }}>*</span><span className="sr-only"> {locale === 'en' ? '(required)' : '(obligatorio)'}</span></label>
                  <input id="ag-dob" type="date" required aria-required="true" style={inputStyle} value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </>
              )}

              <p style={{ fontSize: 11, opacity: 0.65, marginTop: 10 }}>{t.privacyNote}</p>

              {errorMsg && (
                <div role="alert" style={errorSummary}>
                  <strong style={{ fontSize: 13 }}>{locale === 'en' ? 'There was a problem' : 'Hubo un problema'}</strong>
                  <p style={{ fontSize: 12, margin: '4px 0 0' }}>{errorMsg}</p>
                </div>
              )}

              {status === 'denied' && (
                <div role="alert" style={errorSummary} data-age-gate-state="denied">
                  <strong style={{ fontSize: 13, color: DANGER }}>{t.denied}</strong>
                  <p style={{ fontSize: 12 }}>{locale === 'en' ? 'You do not currently meet the minimum age requirement, or the submitted information could not be verified.' : 'Actualmente no cumple con el requisito de edad minima, o la informacion enviada no pudo verificarse.'}</p>
                  <button type="button" style={secondaryBtn} onClick={() => setStatus('idle')}>{t.retry}</button>
                  <a href="mailto:support@smokecraft360.example" style={{ ...secondaryBtn, display: 'inline-block', textDecoration: 'none', marginLeft: 8 }}>{t.support}</a>
                </div>
              )}

              <button type="submit" style={primaryBtn(true)} disabled={status === 'checking'}>
                {status === 'checking' ? (locale === 'en' ? 'Checking…' : 'Verificando…') : t.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
