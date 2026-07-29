import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoldenBoxEntry } from '../../../hooks/useGoldenBox.js'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import EducationalDetailPanel from '../../../components/smokecraft/goldenBox/EducationalDetailPanel.jsx'
import MentorGuidancePanel from '../../../components/smokecraft/goldenBox/MentorGuidancePanel.jsx'
import { notYetConfigured, fromCatalogRow } from '../../../components/smokecraft/goldenBox/educationalContentContract.js'
import * as contentApi from '../../../services/goldenBox/goldenBoxContentApiClient.js'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'
import * as packagingApi from '../../../services/goldenBox/packagingStudioApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const REQUIRED_COMPONENTS = [
  { type: 'wrapper', label: 'Wrapper' },
  { type: 'binder', label: 'Binder' },
  { type: 'filler', label: 'Filler' },
  { type: 'vitola', label: 'Vitola' },
]
const OPTIONAL_COMPONENTS = [
  { type: 'seed_genetics', label: 'Seed Genetics' }, { type: 'origin', label: 'Origin' },
  { type: 'region', label: 'Region' }, { type: 'soil', label: 'Soil' }, { type: 'terroir', label: 'Terroir' },
  { type: 'leaf_priming', label: 'Leaf Priming' }, { type: 'curing_method', label: 'Curing Method' },
  { type: 'fermentation_method', label: 'Fermentation Method' }, { type: 'aging_method', label: 'Aging Method' },
  { type: 'ring_gauge', label: 'Ring Gauge' }, { type: 'strength', label: 'Strength Target' }, { type: 'body', label: 'Body Target' },
]

const ENTRY_STATUS_COPY = {
  draft: { label: 'Draft', explanation: 'Still being built — nothing has been submitted yet.' },
  incomplete: { label: 'Incomplete', explanation: 'Some required components are still missing.' },
  eligible: { label: 'Eligible', explanation: 'You are eligible to submit this entry.' },
  ineligible: { label: 'Ineligible', explanation: 'You do not currently meet this competition\'s requirements.' },
  submitted: { label: 'Submitted', explanation: 'Your entry has been submitted and is awaiting review.' },
  locked: { label: 'Locked', explanation: 'Your entry is locked and can no longer be edited.' },
  under_review: { label: 'Under Review', explanation: 'Judges are currently reviewing your entry.' },
  finalist: { label: 'Finalist', explanation: 'Your entry has advanced to the finalist round.' },
  winner: { label: 'Winner', explanation: 'Congratulations — your entry won this competition.' },
  not_selected: { label: 'Not Selected', explanation: 'Your entry was not selected this round. Review the results for feedback.' },
  withdrawn: { label: 'Withdrawn', explanation: 'You withdrew this entry.' },
  disqualified: { label: 'Disqualified', explanation: 'This entry was disqualified.' },
}

function ComponentPicker({ type, label, options, selected, onSelect, onEducate }) {
  const isSelected = !!selected
  const hasOptions = options && options.length > 0
  return (
    <div style={{ background: GLASS, border: `1px solid ${isSelected ? OK : BORDER}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={`gb-picker-${type}`} style={{ fontSize: 13, fontWeight: 700 }}>{label}</label>
        {isSelected && <span style={{ fontSize: 11, color: OK }}>Selected</span>}
      </div>
      {hasOptions ? (
        <select
          id={`gb-picker-${type}`}
          value={selected?.id || ''}
          onChange={(e) => onSelect(type, e.target.value || null)}
          style={{ width: '100%', minHeight: 40, margin: '6px 0 8px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, padding: '6px 8px' }}
        >
          <option value="">Choose {label.toLowerCase()}…</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.display_name}</option>)}
        </select>
      ) : (
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', margin: '6px 0 8px' }}>Not yet configured — no catalog content exists for this category yet.</div>
      )}
      <button
        type="button"
        onClick={() => onEducate(type)}
        aria-label={`Learn about ${label}`}
        style={{ minHeight: 36, padding: '6px 12px', borderRadius: 14, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
      >Learn More</button>
    </div>
  )
}

// Real, database-backed content when a selection exists for the category
// being educated about; an honest "choose one first" hint when real
// options exist but none is selected yet; an honest not_yet_available
// state only when the category has zero seeded catalog rows.
function buildEducationContent(educating, components, catalogByType, required, optional) {
  if (!educating) return null
  const label = required.concat(optional).find(c => c.type === educating)?.label || educating
  if (components[educating]) return fromCatalogRow(components[educating])
  const options = catalogByType[educating]
  if (options && options.length > 0) {
    return { id: `${educating}:choose-first`, title: label, category: educating, definition: `Choose a ${label.toLowerCase()} option above to see its full educational detail.`, sourceStatus: 'database_backed' }
  }
  return notYetConfigured(label)
}

export default function EntryWorkspace() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const { state, entry, load, saveState, save, submit, savedComponents, currentVersion } = useGoldenBoxEntry(entryId)

  const [step, setStep] = useState('blend') // blend | review | presentation | confirm
  const [components, setComponents] = useState({}) // { [type]: catalogRow }
  const [catalogByType, setCatalogByType] = useState({}) // { [type]: catalogRow[] }
  const [catalogState, setCatalogState] = useState('loading') // loading|ready|error
  const [cigarName, setCigarName] = useState('')
  const [educating, setEducating] = useState(null)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [hydrated, setHydrated] = useState(false) // rehydration guard — only run once per entry load
  // Package 7 — Blend Story, Presentation & Defense. Uses the existing
  // golden_box_entry_versions.presentation_payload/pairing_selection/
  // pairing_defense columns (Package 1 schema, never exposed in the UI
  // until now) — no new migration required for this piece.
  const [blendStory, setBlendStory] = useState('')
  const [pairingItem, setPairingItem] = useState('')
  const [pairingDefense, setPairingDefense] = useState('')
  const [mentorReviews, setMentorReviews] = useState([])
  // Journey-amendment: real, server-derived Packaging Studio readiness for
  // this entry — never inferred client-side. See docs/audits/
  // smokecraft-final-completion/gate-reconciliation/
  // 09A-PACKAGING-STUDIO-JOURNEY-AMENDMENT.md for the full integration
  // rationale and scope disclosure.
  const [packagingReadiness, setPackagingReadiness] = useState(null)
  const [submittedPackage, setSubmittedPackage] = useState(null)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!entryId) return
    api.getMentorReviewsForEntry(entryId).then(result => { if (result.ok) setMentorReviews(result.reviews || []) })
    packagingApi.getPackagingReadiness(entryId).then(result => { if (result.ok) setPackagingReadiness(result.readiness) })
  }, [entryId])

  useEffect(() => {
    if (!entryId || packagingReadiness?.status !== 'submitted') return
    packagingApi.getFinalSubmission(entryId).then(result => { if (result.ok) setSubmittedPackage(result.submission) })
  }, [entryId, packagingReadiness])

  // Package 4 fix: rehydrate saved component selections + cigar name once
  // both the entry (with its saved components) and the real catalog are
  // loaded. Guarded by `hydrated` so it never overwrites in-progress
  // local edits on a later re-render — this only runs once per mount.
  useEffect(() => {
    if (hydrated || state !== 'ready' || catalogState !== 'ready' || !entry) return
    if (entry.cigar_name) setCigarName(entry.cigar_name)
    if (currentVersion?.presentation_payload?.story) setBlendStory(currentVersion.presentation_payload.story)
    if (currentVersion?.pairing_selection?.item) setPairingItem(currentVersion.pairing_selection.item)
    if (currentVersion?.pairing_defense) setPairingDefense(currentVersion.pairing_defense)
    if (savedComponents.length > 0) {
      const restored = {}
      for (const saved of savedComponents) {
        const catalogId = saved.component_value?.catalogId
        const options = catalogByType[saved.component_type] || []
        const row = catalogId ? options.find(r => String(r.id) === String(catalogId)) : null
        if (row) restored[saved.component_type] = row
      }
      setComponents(restored)
    }
    setHydrated(true)
  }, [hydrated, state, catalogState, entry, savedComponents, catalogByType, currentVersion])

  useEffect(() => {
    // Package 3 — real, database-backed catalog. Options are fetched
    // once; each type's dropdown shows only its real published rows.
    // No default selection is applied — the learner must explicitly choose.
    contentApi.listComponents({ selectableOnly: 'true' }).then((result) => {
      if (!result.ok) { setCatalogState('error'); return }
      const grouped = {}
      for (const row of result.components) {
        grouped[row.component_type] = grouped[row.component_type] || []
        grouped[row.component_type].push(row)
      }
      setCatalogByType(grouped)
      setCatalogState('ready')
    })
  }, [])

  const handleSelect = (type, catalogId) => {
    // Postgres BIGSERIAL ids serialize as strings over JSON — compare as
    // strings throughout rather than coercing to Number (a real bug
    // found and fixed this pass: numeric coercion never matched).
    if (!catalogId) {
      setComponents(prev => { const next = { ...prev }; delete next[type]; return next })
      return
    }
    const row = (catalogByType[type] || []).find(r => String(r.id) === String(catalogId))
    if (row) setComponents(prev => ({ ...prev, [type]: row }))
  }

  const handleSaveDraft = async () => {
    await save({
      cigarName: cigarName || undefined,
      presentationPayload: {
        description: `Draft blend with ${Object.keys(components).length} components selected.`,
        story: blendStory || undefined,
      },
      pairingSelection: pairingItem ? { item: pairingItem } : undefined,
      pairingDefense: pairingDefense || undefined,
      components: Object.values(components).map(row => ({
        componentType: row.component_type, componentKey: row.component_key,
        componentValue: { name: row.display_name, catalogId: row.id },
      })),
    })
  }

  const handleSubmit = async () => {
    const result = await submit()
    setSubmitResult(result)
    if (result.ok) setStep('status')
  }

  if (state === 'loading' || state === 'idle') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading entry…" />
  if (state === 'not-found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Entry not found." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this entry." onRetry={load} />

  const locked = ['submitted', 'locked', 'under_review', 'finalist', 'winner', 'not_selected', 'disqualified'].includes(entry.status)
  const requiredMet = REQUIRED_COMPONENTS.every(c => components[c.type])
  const statusCopy = ENTRY_STATUS_COPY[entry.status] || { label: entry.status, explanation: '' }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate(`/smokecraft/golden-box/competitions/${entry.competition_id}`)} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Competition</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)', margin: 0 }}>Your Blend Entry</h1>
          <span style={{ fontSize: 11, textTransform: 'uppercase', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '3px 10px' }}>{statusCopy.label}</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>{statusCopy.explanation}</p>

        {locked && step !== 'status' ? (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            This entry is {statusCopy.label.toLowerCase()} and can no longer be edited.
          </div>
        ) : (
          <>
            {step === 'blend' && (
              <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                <MentorGuidancePanel guidance="Start with your required components — wrapper, binder, filler, and vitola — then round out the blend with optional refinements." />

                <div>
                  <label htmlFor="gb-cigar-name" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.6)', marginBottom: 6 }}>Cigar Name</label>
                  <input id="gb-cigar-name" value={cigarName} onChange={e => setCigarName(e.target.value)} placeholder="Name your blend"
                    style={{ minHeight: 44, width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit' }} />
                </div>

                <h2 style={{ fontSize: 14, color: GOLD, textTransform: 'uppercase', margin: '8px 0 0' }}>Required Components</h2>
                {catalogState === 'loading' && <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Loading real component catalog…</p>}
                {catalogState === 'error' && <p style={{ fontSize: 12, color: DANGER }}>Unable to load the component catalog right now.</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
                  {REQUIRED_COMPONENTS.map(c => (
                    <ComponentPicker key={c.type} type={c.type} label={c.label} options={catalogByType[c.type]} selected={components[c.type]} onSelect={handleSelect} onEducate={setEducating} />
                  ))}
                </div>

                <h2 style={{ fontSize: 14, color: GOLD, textTransform: 'uppercase', margin: '8px 0 0' }}>Optional Refinements</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
                  {OPTIONAL_COMPONENTS.map(c => (
                    <ComponentPicker key={c.type} type={c.type} label={c.label} options={catalogByType[c.type]} selected={components[c.type]} onSelect={handleSelect} onEducate={setEducating} />
                  ))}
                </div>

                <div role="status" aria-live="polite" aria-atomic="true">
                  {saveState === 'saving' && <span style={{ color: GOLD }}>Saving…</span>}
                  {saveState === 'saved' && <span style={{ color: OK }}>✓ Draft saved</span>}
                  {saveState === 'failed' && <span style={{ color: DANGER }}>Save failed. <button type="button" onClick={handleSaveDraft}>Retry</button></span>}
                  {saveState === 'stale' && <span style={{ color: DANGER }}>This draft was updated elsewhere (another tab or device) since you loaded it. <button type="button" onClick={load}>Reload the latest version</button> before saving again.</span>}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={handleSaveDraft} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Save Draft</button>
                  <button type="button" disabled={!requiredMet} onClick={() => setStep('review')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${requiredMet ? OK : BORDER}`, background: 'transparent', color: requiredMet ? OK : 'rgba(229,226,225,0.35)', cursor: requiredMet ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Continue to Review</button>
                </div>
                {!requiredMet && <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Select all required components to continue.</p>}
              </div>
            )}

            {step === 'review' && (
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                <h2 style={{ fontSize: 15, color: GOLD }}>Draft Review</h2>
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}><strong>{cigarName || '(unnamed blend)'}</strong></div>
                  {Object.values(components).map(c => (
                    <div key={c.component_type} style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', padding: '3px 0' }}>{c.component_type.replace(/_/g, ' ')}: {c.display_name}</div>
                  ))}
                  <div style={{ fontSize: 12, color: requiredMet ? OK : DANGER, marginTop: 8 }}>
                    {requiredMet ? 'All required components present.' : 'Missing required components.'}
                  </div>
                </div>
                <MentorGuidancePanel guidance="Review your selections carefully — once submitted, your entry locks and can't be edited." />

                {mentorReviews.length > 0 && (
                  <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 13, color: GOLD, margin: '0 0 8px' }}>Mentor Feedback</h3>
                    {mentorReviews.map(r => (
                      <div key={r.id} style={{ fontSize: 12, marginBottom: 10 }}>
                        {r.readiness_status && <div style={{ color: OK, textTransform: 'capitalize', marginBottom: 4 }}>Readiness: {r.readiness_status.replace('_', ' ')}</div>}
                        {r.strengths && <div><b>Strengths:</b> {r.strengths}</div>}
                        {r.improvement_areas && <div><b>Improvement Areas:</b> {r.improvement_areas}</div>}
                        {r.final_guidance && <div><b>Final Guidance:</b> {r.final_guidance}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {requiredMet && (
                  <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 13, color: GOLD, margin: '0 0 8px' }}>Packaging Design</h3>
                    <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', margin: '0 0 10px' }}>
                      Design the physical presentation box for this entry — optional, but part of your full Golden Box presentation.
                    </p>
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      Status: <strong style={{ color: packagingReadiness?.status === 'submitted' || packagingReadiness?.status === 'ready_to_submit' ? OK : 'rgba(229,226,225,0.6)' }}>
                        {packagingReadiness ? packagingReadiness.status.replace(/_/g, ' ') : 'checking…'}
                      </strong>
                    </div>
                    <button type="button" onClick={() => navigate(`/smokecraft/golden-box/packaging-studio${packagingReadiness?.designId ? `/${packagingReadiness.designId}` : `?entryId=${entryId}`}`)}
                      style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {packagingReadiness?.status === 'submitted' ? 'View Submitted Packaging Design' : packagingReadiness?.designId ? 'Continue Packaging Design' : 'Start Packaging Design'}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('blend')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Return to Edit</button>
                  <button type="button" onClick={() => setStep('presentation')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Continue to Presentation &amp; Defense</button>
                </div>
              </div>
            )}

            {step === 'presentation' && (
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                <MediaSlot assetKey="goldenBoxPairingDefense" alt="Golden Box pairing defense" caption="Presentation & Defense" style={{ height: 140, borderRadius: 10 }} />

                {submittedPackage && (
                  <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 13, color: GOLD, margin: '0 0 8px' }}>Submitted Packaging Design</h3>
                    <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', margin: '0 0 8px' }}>
                      This is the locked, submitted snapshot (version {submittedPackage.version_number}) — not your latest draft.
                    </p>
                    {['boxName', 'woodType', 'finish', 'lidStyle', 'interiorLining', 'trayConfiguration'].map(f => (
                      submittedPackage.snapshot?.[f] ? <div key={f} style={{ fontSize: 12, padding: '2px 0' }}><strong>{f.replace(/([A-Z])/g, ' $1')}:</strong> {submittedPackage.snapshot[f]}</div> : null
                    ))}
                  </div>
                )}
                {!submittedPackage && packagingReadiness && packagingReadiness.status !== 'submitted' && packagingReadiness.status !== 'not_started' && (
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                    Packaging design in progress — not yet submitted. It will not appear here until you submit it from the Packaging Studio.
                  </div>
                )}

                <h2 style={{ fontSize: 15, color: GOLD }}>Blend Story, Presentation &amp; Defense</h2>
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>
                  Explain your choices in your own words. This is what a
                  human judge or mentor will read alongside your recipe —
                  there is no single correct answer, only how well you can
                  explain your reasoning.
                </p>
                <div>
                  <label htmlFor="gb-blend-story" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.6)', marginBottom: 6 }}>Blend Story</label>
                  <textarea id="gb-blend-story" value={blendStory} onChange={e => setBlendStory(e.target.value)}
                    placeholder="Why did you choose this seed genetics, origin, soil, and leaf structure? What flavor journey are you aiming for?"
                    style={{ width: '100%', minHeight: 100, resize: 'vertical', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
                </div>
                <div>
                  <label htmlFor="gb-pairing-item" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.6)', marginBottom: 6 }}>Suggested Pairing</label>
                  <input id="gb-pairing-item" value={pairingItem} onChange={e => setPairingItem(e.target.value)} placeholder="e.g. a dark roast coffee or an aged rum"
                    style={{ minHeight: 44, width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
                </div>
                <div>
                  <label htmlFor="gb-pairing-defense" style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.6)', marginBottom: 6 }}>Defend Your Choices</label>
                  <textarea id="gb-pairing-defense" value={pairingDefense} onChange={e => setPairingDefense(e.target.value)}
                    placeholder="Why this pairing? Why this construction, curing, and aging approach? What should a judge notice?"
                    style={{ width: '100%', minHeight: 100, resize: 'vertical', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
                </div>
                <MentorGuidancePanel guidance="A strong defense explains the 'why' behind every choice — genetics, soil, construction, and pairing — not just what you picked." />
                <div role="status" aria-live="polite" aria-atomic="true">
                  {saveState === 'saving' && <span style={{ color: GOLD }}>Saving…</span>}
                  {saveState === 'saved' && <span style={{ color: OK }}>✓ Saved</span>}
                  {saveState === 'stale' && <span style={{ color: DANGER }}>This draft was updated elsewhere since you loaded it. <button type="button" onClick={load}>Reload the latest version</button> before saving again.</span>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('review')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Review</button>
                  <button type="button" onClick={handleSaveDraft} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Save Draft</button>
                  <button type="button" onClick={async () => { await handleSaveDraft(); setStep('confirm') }} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Continue to Submission</button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                <h2 style={{ fontSize: 15, color: GOLD }}>Confirm Submission</h2>
                <div style={{ background: GLASS, border: `1px solid ${DANGER}`, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.6 }}>
                  <p>Once submitted, your entry will be <strong>locked</strong> and can no longer be edited.</p>
                  <p>Your recipe stays private to you, assigned judges, and administrators until judging closes.</p>
                  <p>Final scoring is <strong>human-judged</strong>. Any AI feedback is educational only and never determines placement.</p>
                  <p>Submission does not guarantee placement or a win.</p>
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} style={{ width: 20, height: 20 }} />
                  I understand and want to submit this entry.
                </label>
                {submitResult && !submitResult.ok && <p style={{ color: DANGER }}>Submission failed: {submitResult.error}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('presentation')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Return to Draft</button>
                  <button type="button" disabled={!confirmChecked} onClick={handleSubmit} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${confirmChecked ? OK : BORDER}`, background: 'transparent', color: confirmChecked ? OK : 'rgba(229,226,225,0.35)', cursor: confirmChecked ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Submit Entry</button>
                </div>
              </div>
            )}
          </>
        )}

        {(locked || step === 'status') && (
          <div style={{ marginTop: 20 }}>
            <button type="button" onClick={() => navigate(`/smokecraft/golden-box/results/${entry.competition_id}?entryId=${entry.entry_id}`)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Results / Status
            </button>
          </div>
        )}

        <EducationalDetailPanel content={buildEducationContent(educating, components, catalogByType, REQUIRED_COMPONENTS, OPTIONAL_COMPONENTS)} onClose={() => setEducating(null)} />
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
