import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import EducationalDetailPanel from '../../components/smokecraft/goldenBox/EducationalDetailPanel.jsx'
import { fromCatalogRow } from '../../components/smokecraft/goldenBox/educationalContentContract.js'
import { ensureIdentity } from '../../hooks/useGoldenBox.js'
import * as ssApi from '../../services/smokecraft/seedSoilApiClient.js'
import * as fpApi from '../../services/smokecraft/flavorPairingApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'

// Package 6 — Cigar Anatomy, Vitola & Ring Gauge, Strength vs. Body,
// Burn/Draw Troubleshooting, Flavor Wheel, and Pairing Builder, built into
// the existing `vitola` legacy route (previously a ComingSoon stub — same
// reuse pattern as Package 5's wrapper-strength). No new session ID, no
// new route, no change to the locked 27-session spine. Cutting
// (CutToastLight.jsx) and Lighting (LightingTutorial.jsx) already have
// real, verified dedicated screens and are NOT rebuilt here.
const STAGES = [
  { key: 'cold_aroma', label: 'Cold Aroma' },
  { key: 'cold_draw', label: 'Cold Draw' },
  { key: 'first_third', label: 'First Third' },
  { key: 'second_third', label: 'Second Third' },
  { key: 'final_third', label: 'Final Third' },
  { key: 'finish', label: 'Finish' },
]

const CARD = {
  minHeight: 60, borderRadius: 10, border: '1px solid rgba(233,193,118,0.35)',
  background: 'rgba(255,255,255,0.03)', color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
  padding: '8px 10px', fontSize: 13,
}

function Chip({ row, active, onPress, onLearnMore }) {
  return (
    <div style={{ ...CARD, borderColor: active ? GOLD : 'rgba(233,193,118,0.35)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button type="button" onClick={onPress} aria-pressed={active} aria-label={`${row.display_name}${active ? ' (selected)' : ''}`}
        style={{ background: 'transparent', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
        {active && <span style={{ color: GOLD, marginRight: 6 }}>✓</span>}{row.display_name}
      </button>
      <button type="button" onClick={onLearnMore} aria-label={`Learn more about ${row.display_name}`}
        style={{ alignSelf: 'flex-start', fontSize: 10, color: GOLD, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '2px 8px', cursor: 'pointer', minHeight: 28 }}>
        Learn More
      </button>
    </div>
  )
}

function ChipRow({ title, rows, selectedId, onToggle, onLearnMore }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 8px' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {rows.map(row => (
          <Chip key={row.id} row={row} active={selectedId === row.id} onPress={() => onToggle(row)} onLearnMore={() => onLearnMore(row)} />
        ))}
        {rows.length === 0 && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Content not yet curated.</div>}
      </div>
    </div>
  )
}

function FlavorWheel({ flavorGroups, selectedStage, onStageChange, observation, onSaved }) {
  const [selectedNotes, setSelectedNotes] = useState([])
  const [intensity, setIntensity] = useState('')
  const [personalNotes, setPersonalNotes] = useState('')
  const saveTimer = useRef(null)

  useEffect(() => {
    setSelectedNotes(observation?.flavor_notes || [])
    setIntensity(observation?.intensity || '')
    setPersonalNotes(observation?.personal_notes || '')
  }, [observation, selectedStage])

  function toggleNote(slug) {
    triggerHaptic('light')
    const next = selectedNotes.includes(slug) ? selectedNotes.filter(s => s !== slug) : [...selectedNotes, slug]
    setSelectedNotes(next)
    scheduleSave({ flavorNotes: next, intensity, personalNotes })
  }
  function scheduleSave(fields) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await fpApi.saveFlavorStage(selectedStage, fields)
      onSaved()
    }, 900)
  }

  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 8px' }}>Complete Flavor Wheel</h3>
      <div role="group" aria-label="Smoking stage" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {STAGES.map(s => (
          <button key={s.key} type="button" aria-pressed={selectedStage === s.key} onClick={() => { triggerHaptic('light'); onStageChange(s.key) }}
            style={{ minHeight: 36, padding: '4px 12px', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${selectedStage === s.key ? GOLD : 'rgba(233,193,118,0.3)'}`,
              background: selectedStage === s.key ? 'rgba(233,193,118,0.15)' : 'transparent', color: selectedStage === s.key ? GOLD : CREAM }}>
            {s.label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Flavor notes for this stage" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {flavorGroups.map(g => (
          <button key={g.slug} type="button" aria-pressed={selectedNotes.includes(g.slug)} onClick={() => toggleNote(g.slug)}
            aria-label={`${g.name} flavor note${selectedNotes.includes(g.slug) ? ' (selected)' : ''}`}
            style={{ minHeight: 36, padding: '4px 12px', borderRadius: 14, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${selectedNotes.includes(g.slug) ? GOLD : 'rgba(233,193,118,0.3)'}`,
              background: selectedNotes.includes(g.slug) ? 'rgba(233,193,118,0.15)' : 'transparent', color: selectedNotes.includes(g.slug) ? GOLD : CREAM }}>
            {selectedNotes.includes(g.slug) && '✓ '}{g.name}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', display: 'block', marginBottom: 4 }} htmlFor="flavor-personal-notes">
        Personal notes for this stage
      </label>
      <textarea
        id="flavor-personal-notes"
        value={personalNotes}
        onChange={e => { setPersonalNotes(e.target.value); scheduleSave({ flavorNotes: selectedNotes, intensity, personalNotes: e.target.value }) }}
        style={{ width: '100%', minHeight: 60, resize: 'vertical', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(233,193,118,0.3)', borderRadius: 8, color: CREAM, fontSize: 13, fontFamily: 'Georgia, serif', padding: 8 }}
      />
      <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
        Flavor perception is personal — these notes describe your own impressions, not an objective measurement.
      </div>
    </div>
  )
}

function PairingBuilder({ drafts, onSave }) {
  const [editingId, setEditingId] = useState(null) // null = new draft; else revising this draft's id
  const [category, setCategory] = useState('')
  const [item, setItem] = useState('')
  const [strategy, setStrategy] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [revisions, setRevisions] = useState([])
  const [showHistoryFor, setShowHistoryFor] = useState(null)

  function resetForm() {
    setEditingId(null); setCategory(''); setItem(''); setStrategy(''); setReasoning(''); setSavedMsg('')
  }

  function startRevise(draft) {
    triggerHaptic('light')
    setEditingId(draft.id)
    setCategory(draft.pairing_category || '')
    setItem(draft.pairing_item || '')
    setStrategy(draft.strategy || '')
    setReasoning(draft.reasoning || '')
    setSavedMsg('')
  }

  async function handleSave() {
    if (!category) return
    triggerHaptic('medium')
    const payload = { pairingCategory: category, pairingItem: item || null, strategy: strategy || null, reasoning: reasoning || null }
    const result = editingId ? await fpApi.reviseDraft(editingId, payload) : await fpApi.savePairingDraft(payload)
    if (result.ok) {
      setSavedMsg(editingId ? `Revision ${result.draft?.current_revision ?? ''} saved` : (result.firstSave ? 'Saved (+15 XP)' : 'Saved'))
      triggerHaptic('success')
      onSave()
      // Note: intentionally does NOT reset the form fields after a fresh
      // save — an earlier version called resetForm() here, which cleared
      // savedMsg in the same render batch and silently hid the just-set
      // confirmation message (caught by a failing test, not by inspection).
      setEditingId(null)
    }
  }

  async function viewHistory(draftId) {
    if (showHistoryFor === draftId) { setShowHistoryFor(null); return }
    const result = await fpApi.getDraftRevisions(draftId)
    if (result.ok) { setRevisions(result.revisions || []); setShowHistoryFor(draftId) }
  }

  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 8px' }}>Perfect Pairing Builder</h3>
      <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', margin: '0 0 10px' }}>
        Practice building a pairing rationale. There is no single perfect pairing — this is about reasoning, not a guaranteed match.
      </p>
      {editingId && (
        <div style={{ fontSize: 12, color: GOLD, marginBottom: 6 }}>Revising a saved draft — save creates a new revision without losing the original.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12 }}>
          Pairing category
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Pairing category"
            style={{ display: 'block', width: '100%', marginTop: 4, minHeight: 40, background: NAVY, color: CREAM, border: '1px solid rgba(233,193,118,0.3)', borderRadius: 8, padding: 8 }}>
            <option value="">Choose…</option>
            <option value="coffee">Coffee</option>
            <option value="spirit">Spirit</option>
            <option value="dessert">Dessert</option>
            <option value="non_alcoholic">Non-alcoholic beverage</option>
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          Specific item (optional)
          <input value={item} onChange={e => setItem(e.target.value)} aria-label="Specific pairing item"
            style={{ display: 'block', width: '100%', marginTop: 4, minHeight: 40, background: NAVY, color: CREAM, border: '1px solid rgba(233,193,118,0.3)', borderRadius: 8, padding: 8, boxSizing: 'border-box' }} />
        </label>
        <div role="group" aria-label="Pairing strategy" style={{ display: 'flex', gap: 6 }}>
          {['complement', 'contrast'].map(s => (
            <button key={s} type="button" aria-pressed={strategy === s} onClick={() => { triggerHaptic('light'); setStrategy(s) }}
              style={{ minHeight: 40, padding: '4px 14px', borderRadius: 14, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit',
                border: `1px solid ${strategy === s ? GOLD : 'rgba(233,193,118,0.3)'}`, background: strategy === s ? 'rgba(233,193,118,0.15)' : 'transparent', color: strategy === s ? GOLD : CREAM }}>
              {s}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 12 }}>
          Reasoning
          <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} aria-label="Pairing reasoning"
            style={{ display: 'block', width: '100%', marginTop: 4, minHeight: 60, resize: 'vertical', boxSizing: 'border-box', background: NAVY, color: CREAM, border: '1px solid rgba(233,193,118,0.3)', borderRadius: 8, padding: 8, fontFamily: 'Georgia, serif' }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleSave} disabled={!category}
            style={{ minHeight: 44, padding: '8px 16px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: category ? 'pointer' : 'not-allowed', opacity: category ? 1 : 0.5, fontFamily: 'inherit' }}>
            {editingId ? 'Save Revision' : 'Save Pairing Draft'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              style={{ minHeight: 44, padding: '8px 16px', borderRadius: 14, border: '1px solid rgba(233,193,118,0.3)', background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          )}
        </div>
        {savedMsg && <div role="status" style={{ fontSize: 12, color: GOLD }}>{savedMsg}</div>}
      </div>

      {drafts.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>Saved Drafts ({drafts.length})</div>
          {drafts.map(d => (
            <div key={d.id} style={{ fontSize: 12, borderBottom: '1px solid rgba(233,193,118,0.12)', padding: '8px 0' }}>
              <div>
                <b style={{ color: GOLD, textTransform: 'capitalize' }}>{d.pairing_category}</b>{d.pairing_item ? ` — ${d.pairing_item}` : ''}
                {d.strategy ? ` (${d.strategy})` : ''}
                <span style={{ color: 'rgba(229,226,225,0.5)' }}> · revision {d.current_revision} · saved {new Date(d.updated_at).toLocaleTimeString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button type="button" onClick={() => startRevise(d)} aria-label={`Revise pairing draft ${d.pairing_category}`}
                  style={{ fontSize: 11, minHeight: 30, padding: '3px 10px', borderRadius: 10, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
                  Revise
                </button>
                <button type="button" onClick={() => viewHistory(d.id)} aria-label={`View revision history for ${d.pairing_category}`}
                  style={{ fontSize: 11, minHeight: 30, padding: '3px 10px', borderRadius: 10, border: '1px solid rgba(233,193,118,0.3)', background: 'transparent', color: CREAM, cursor: 'pointer' }}>
                  {showHistoryFor === d.id ? 'Hide History' : 'View History'}
                </button>
              </div>
              {showHistoryFor === d.id && (
                <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${GOLD}` }}>
                  {revisions.map(r => (
                    <div key={r.id} style={{ fontSize: 11, color: 'rgba(229,226,225,0.7)', marginBottom: 4 }}>
                      Revision {r.revision_number}: <i>{r.snapshot.pairing_category}</i>{r.snapshot.pairing_item ? ` — ${r.snapshot.pairing_item}` : ''} ({new Date(r.created_at).toLocaleString()})
                    </div>
                  ))}
                  {revisions.length === 0 && <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>No revisions yet.</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SmokingTechnique({ rows, onLearnMore, cadence, onStartCadence, onEvent, onStopCadence }) {
  const active = cadence?.status === 'in_progress'
  const overheatWarn = active && cadence.puff_count > 0 && cadence.puff_count % 5 === 0 && cadence.overheating_warnings < Math.floor(cadence.puff_count / 5)
  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 6px' }}>Smoking Technique</h3>
      <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', margin: '0 0 10px' }}>
        Cigar smoke is meant to be tasted and released, not inhaled into the lungs like cigarette smoke.
        This is a pacing exercise, not a medical or physical measurement — no device detects your actual smoke temperature.
      </p>

      <ChipRow title="Technique Topics" rows={rows} selectedId={null} onToggle={() => {}} onLearnMore={onLearnMore} />

      <div style={{ borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', marginBottom: 8 }}>Cadence Exercise (manual, educational)</div>
        {!cadence || cadence.status !== 'in_progress' ? (
          <button type="button" onClick={onStartCadence}
            style={{ minHeight: 44, padding: '8px 16px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cadence?.status === 'completed' ? 'Start Again' : 'Start Cadence Exercise'}
          </button>
        ) : (
          <>
            <div style={{ fontSize: 12, marginBottom: 8 }}>Puffs recorded: {cadence.puff_count} · Ash checks: {cadence.ash_checks}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <button type="button" onClick={() => onEvent('puff')} aria-label="Record a puff (wait ~45-60 seconds between puffs)"
                style={{ minHeight: 44, padding: '8px 14px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
                Record Puff
              </button>
              <button type="button" onClick={() => onEvent('ash_check')} aria-label="Record an ash check"
                style={{ minHeight: 44, padding: '8px 14px', borderRadius: 14, border: '1px solid rgba(233,193,118,0.4)', background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>
                Check Ash
              </button>
              <button type="button" onClick={onStopCadence} aria-label="Finish cadence exercise"
                style={{ minHeight: 44, padding: '8px 14px', borderRadius: 14, border: '1px solid rgba(233,193,118,0.4)', background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>
                Finish
              </button>
            </div>
            {overheatWarn && (
              <div role="status" style={{ fontSize: 12, color: '#e2a6a6', border: '1px solid rgba(226,166,166,0.4)', borderRadius: 8, padding: 8 }}>
                Overheating warning (manual pacing check) — you've recorded several puffs in a row. Consider resting the cigar before continuing.
              </div>
            )}
          </>
        )}
        {cadence?.status === 'completed' && (
          <div role="status" style={{ fontSize: 12, color: GOLD, marginTop: 8 }}>Cadence exercise complete.</div>
        )}
      </div>
    </div>
  )
}

function PersonalizedRecommendations({ data }) {
  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 8px' }}>Personalized Pairing Recommendations</h3>
      {!data && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Loading…</div>}
      {data?.state === 'not_enough_data' && (
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>
          Not enough data yet — record some flavor notes in the Flavor Wheel above (any smoking stage) to unlock personalized recommendations.
        </div>
      )}
      {data?.state === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.recommendations.map((r, i) => (
            <div key={i} style={{ border: '1px solid rgba(233,193,118,0.2)', borderRadius: 8, padding: 10, fontSize: 12 }}>
              <div style={{ color: GOLD, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
              <div><b>Why it may work:</b> {r.why}</div>
              {r.complements.length > 0 && <div><b>Complements:</b> {r.complements.join(', ')}</div>}
              {r.contrasts.length > 0 && <div><b>Contrasts:</b> {r.contrasts.join(', ')}</div>}
              <div><b>Confidence:</b> {r.confidence} · <b>Source:</b> rule-based platform suggestion (not mentor or AI review)</div>
              <div style={{ color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>{r.limitation}</div>
              <div style={{ color: 'rgba(229,226,225,0.5)', fontSize: 11, marginTop: 2 }}>
                Based on: {r.dataUsed.flavorNote} observed {r.dataUsed.timesObserved}× across {r.dataUsed.totalStagesRecorded} recorded stage(s).
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>No recommendation here is objectively perfect — these are starting points for your own tasting, not a guarantee.</div>
        </div>
      )}
    </div>
  )
}

export default function Vitola() {
  const { awardSessionRewards } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading')
  const [byCategory, setByCategory] = useState({})
  const [selected, setSelected] = useState({})
  const [detailContent, setDetailContent] = useState(null)
  const [flavorGroups, setFlavorGroups] = useState([])
  const [stageObservations, setStageObservations] = useState({})
  const [selectedStage, setSelectedStage] = useState('cold_aroma')
  const [pairingDrafts, setPairingDrafts] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [quizSelected, setQuizSelected] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [cadence, setCadence] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [techniqueQuiz, setTechniqueQuiz] = useState(null)
  const [techniqueQuizSelected, setTechniqueQuizSelected] = useState('')
  const [techniqueQuizResult, setTechniqueQuizResult] = useState(null)

  const mentor = Array.isArray(journey?.mentor) ? journey.mentor[0] : null

  useEffect(() => {
    let cancelled = false
    async function load() {
      await ensureIdentity()
      const categories = ['cigar_anatomy', 'vitola', 'ring_gauge', 'length', 'sensory_category', 'burn_troubleshooting', 'smoking_technique']
      const results = await Promise.all(categories.map(c => ssApi.listSeedSoilComponents(c)))
      if (cancelled) return
      const map = {}
      categories.forEach((c, i) => { map[c] = results[i].ok ? (results[i].components || []) : [] })
      setByCategory(map)

      const flavorRes = await fetch('/api/smokecraft/golden-box-content/flavor-notes', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!cancelled && flavorRes?.success) setFlavorGroups(flavorRes.notes || [])

      const stagesRes = await fpApi.getFlavorStages()
      if (!cancelled && stagesRes.ok) {
        const byStage = {}
        for (const s of stagesRes.stages || []) byStage[s.stage] = s
        setStageObservations(byStage)
      }
      const draftsRes = await fpApi.listPairingDrafts()
      if (!cancelled && draftsRes.ok) setPairingDrafts(draftsRes.drafts || [])

      const cadenceRes = await fpApi.getCadenceSession()
      if (!cancelled && cadenceRes.ok) setCadence(cadenceRes.session)

      const recRes = await fpApi.getRecommendations()
      if (!cancelled && recRes.ok) setRecommendations(recRes)

      const capRow = (map.cigar_anatomy || []).find(r => r.component_key === 'cap')
      if (capRow) {
        const detailRes = await fetch(`/api/smokecraft/golden-box-content/components/${capRow.id}`, { credentials: 'include' }).then(r => r.json()).catch(() => null)
        if (!cancelled && detailRes?.success && detailRes.quiz?.length) setQuiz(detailRes.quiz[0])
      }
      const retrohaleRow = (map.smoking_technique || []).find(r => r.component_key === 'retrohale')
      if (retrohaleRow) {
        const detailRes = await fetch(`/api/smokecraft/golden-box-content/components/${retrohaleRow.id}`, { credentials: 'include' }).then(r => r.json()).catch(() => null)
        if (!cancelled && detailRes?.success && detailRes.quiz?.length) setTechniqueQuiz(detailRes.quiz[0])
      }
      setStatus('ready')
    }
    load().catch(() => !cancelled && setStatus('error'))
    return () => { cancelled = true }
  }, [])

  const openDetail = useCallback(async (row) => {
    triggerHaptic('light')
    setDetailContent(fromCatalogRow(row))
    await ssApi.recordProgress(row.id)
  }, [])

  function handleToggleSelect(sectionId, row) {
    triggerHaptic('light')
    setSelected(prev => ({ ...prev, [sectionId]: prev[sectionId] === row.id ? null : row.id }))
  }

  const refreshStages = useCallback(async () => {
    const stagesRes = await fpApi.getFlavorStages()
    if (stagesRes.ok) {
      const byStage = {}
      for (const s of stagesRes.stages || []) byStage[s.stage] = s
      setStageObservations(byStage)
    }
    const recRes = await fpApi.getRecommendations()
    if (recRes.ok) setRecommendations(recRes)
  }, [])
  const refreshDrafts = useCallback(async () => {
    const draftsRes = await fpApi.listPairingDrafts()
    if (draftsRes.ok) setPairingDrafts(draftsRes.drafts || [])
  }, [])

  async function handleQuizSubmit() {
    if (!quiz || !quizSelected) return
    const result = await ssApi.submitQuizAnswer(quiz.id, quizSelected)
    if (result.ok) { setQuizResult(result); triggerHaptic(result.isCorrect ? 'success' : 'warning') }
  }

  async function handleTechniqueQuizSubmit() {
    if (!techniqueQuiz || !techniqueQuizSelected) return
    const result = await ssApi.submitQuizAnswer(techniqueQuiz.id, techniqueQuizSelected)
    if (result.ok) { setTechniqueQuizResult(result); triggerHaptic(result.isCorrect ? 'success' : 'warning') }
  }

  async function handleStartCadence() {
    triggerHaptic('medium')
    const result = await fpApi.startCadence()
    if (result.ok) setCadence(result.session)
  }
  async function handleCadenceEvent(eventType) {
    triggerHaptic('light')
    const result = await fpApi.recordCadenceEvent(eventType)
    if (result.ok) setCadence(result.session)
  }
  async function handleStopCadence() {
    triggerHaptic('success')
    const result = await fpApi.stopCadence()
    if (result.ok) setCadence(result.session)
  }

  function handleContinue() {
    awardSessionRewards('vitola')
    navigate('/smokecraft/identity')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ minHeight: '100vh', paddingBottom: 100, background: NAVY, color: CREAM, fontFamily: 'Georgia, serif' }}>
        <div style={{ padding: '20px 16px 8px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(233,193,118,0.7)' }}>SmokeCraft</div>
          <h1 style={{ fontSize: 22, color: GOLD, margin: '4px 0 6px' }}>Cigar Anatomy, Vitola &amp; Sensory Practice</h1>
          <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.75)', maxWidth: 640, lineHeight: 1.5 }}>
            Explore the parts of a finished cigar, compare shapes and ring
            gauges, practice reading flavor across every stage of a smoke,
            troubleshoot common burn issues, and build a pairing rationale.
          </p>
          {mentor ? (
            <div style={{ fontSize: 12, color: GOLD, marginTop: 8 }}>Mentor guidance from {mentor.name || 'your selected mentor'} available in each detail panel.</div>
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 8 }}>No mentor selected yet — guidance will be general until one is chosen.</div>
          )}
        </div>

        <div style={{ padding: '8px 16px' }}>
          {status === 'loading' && <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>Loading real educational content…</div>}
          {status === 'error' && <div style={{ fontSize: 13, color: '#e2a6a6' }}>Could not load content — please try again.</div>}

          {status === 'ready' && (
            <>
              <ChipRow title="Cigar Anatomy" rows={byCategory.cigar_anatomy || []} selectedId={selected.anatomy}
                onToggle={(row) => handleToggleSelect('anatomy', row)} onLearnMore={openDetail} />

              <ChipRow title="Vitola &amp; Shape" rows={byCategory.vitola || []} selectedId={selected.vitola}
                onToggle={(row) => handleToggleSelect('vitola', row)} onLearnMore={openDetail} />

              <ChipRow title="Ring Gauge &amp; Length" rows={[...(byCategory.ring_gauge || []), ...(byCategory.length || [])]} selectedId={selected.dims}
                onToggle={(row) => handleToggleSelect('dims', row)} onLearnMore={openDetail} />

              <ChipRow title="Strength vs. Body" rows={byCategory.sensory_category || []} selectedId={selected.sensory}
                onToggle={(row) => handleToggleSelect('sensory', row)} onLearnMore={openDetail} />

              <ChipRow title="Burn &amp; Draw Troubleshooting" rows={byCategory.burn_troubleshooting || []} selectedId={selected.troubleshoot}
                onToggle={(row) => handleToggleSelect('troubleshoot', row)} onLearnMore={openDetail} />

              <SmokingTechnique
                rows={byCategory.smoking_technique || []}
                onLearnMore={openDetail}
                cadence={cadence}
                onStartCadence={handleStartCadence}
                onEvent={handleCadenceEvent}
                onStopCadence={handleStopCadence}
              />

              {techniqueQuiz && (
                <div style={{ marginBottom: 20, borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Smoking Technique Knowledge Check</div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>{techniqueQuiz.question}</div>
                  {!techniqueQuizResult ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {(techniqueQuiz.answer_choices || []).map(choice => (
                          <label key={choice} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', minHeight: 32 }}>
                            <input type="radio" name="technique-quiz" value={choice} checked={techniqueQuizSelected === choice} onChange={() => setTechniqueQuizSelected(choice)} />
                            {choice}
                          </label>
                        ))}
                      </div>
                      <button type="button" onClick={handleTechniqueQuizSubmit} disabled={!techniqueQuizSelected}
                        style={{ fontSize: 12, minHeight: 40, padding: '6px 14px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: techniqueQuizSelected ? 'pointer' : 'not-allowed', opacity: techniqueQuizSelected ? 1 : 0.5 }}>
                        Submit Answer
                      </button>
                    </>
                  ) : (
                    <div role="status" style={{ fontSize: 12, color: techniqueQuizResult.isCorrect ? '#8fd19e' : '#e2a6a6' }}>
                      {techniqueQuizResult.isCorrect ? 'Correct! ' : 'Not quite. '}{techniqueQuizResult.explanation}
                      {techniqueQuizResult.xpAwarded && <span style={{ color: GOLD }}> (+15 XP)</span>}
                    </div>
                  )}
                </div>
              )}

              <FlavorWheel
                flavorGroups={flavorGroups}
                selectedStage={selectedStage}
                onStageChange={setSelectedStage}
                observation={stageObservations[selectedStage]}
                onSaved={refreshStages}
              />

              <PersonalizedRecommendations data={recommendations} />

              <PairingBuilder drafts={pairingDrafts} onSave={refreshDrafts} />

              {quiz && (
                <div style={{ marginBottom: 20, borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Knowledge Check</div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>{quiz.question}</div>
                  {!quizResult ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {(quiz.answer_choices || []).map(choice => (
                          <label key={choice} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', minHeight: 32 }}>
                            <input type="radio" name="vitola-quiz" value={choice} checked={quizSelected === choice} onChange={() => setQuizSelected(choice)} />
                            {choice}
                          </label>
                        ))}
                      </div>
                      <button type="button" onClick={handleQuizSubmit} disabled={!quizSelected}
                        style={{ fontSize: 12, minHeight: 40, padding: '6px 14px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: quizSelected ? 'pointer' : 'not-allowed', opacity: quizSelected ? 1 : 0.5 }}>
                        Submit Answer
                      </button>
                    </>
                  ) : (
                    <div role="status" style={{ fontSize: 12, color: quizResult.isCorrect ? '#8fd19e' : '#e2a6a6' }}>
                      {quizResult.isCorrect ? 'Correct! ' : 'Not quite. '}{quizResult.explanation}
                      {quizResult.xpAwarded && <span style={{ color: GOLD }}> (+15 XP)</span>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginBottom: 24 }}>
                Flavor and pairing selections here are practice only — they
                connect to the same real catalog Golden Box uses, but do
                not create or submit a competition entry.
              </div>
            </>
          )}
        </div>
      </div>

      {detailContent && <EducationalDetailPanel content={detailContent} onClose={() => setDetailContent(null)} />}

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
