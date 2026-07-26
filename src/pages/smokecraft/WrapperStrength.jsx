import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import EducationalDetailPanel from '../../components/smokecraft/goldenBox/EducationalDetailPanel.jsx'
import { fromCatalogRow } from '../../components/smokecraft/goldenBox/educationalContentContract.js'
import { ensureIdentity } from '../../hooks/useGoldenBox.js'
import * as ssApi from '../../services/smokecraft/seedSoilApiClient.js'
import * as lcApi from '../../services/smokecraft/leafConstructionApiClient.js'
import MediaSlot from '../../components/smokecraft/goldenBox/MediaSlot.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

// Phase 2 image integration — real uploaded step thumbnails, keyed by the
// same backend step_key values RollingProcess already renders. Purely
// decorative additions; no rolling-process state or logic changed.
const ROLLING_STEP_ASSET_KEY = {
  'prepare-leaves': 'rollingStepPrepareLeaves',
  'arrange-filler': 'rollingStepArrangeFiller',
  'select-bunching-method': 'rollingStepSelectBunching',
  'apply-binder': 'rollingStepApplyBinder',
  'mold-or-press': 'rollingStepMoldOrPress',
  'apply-wrapper': 'rollingStepApplyWrapper',
  'construct-cap': 'rollingStepConstructCap',
  'finish-foot': 'rollingStepFinishFoot',
  'inspect-and-draw-test': 'rollingStepInspectAndDrawTest',
  'rest-and-box-age': 'rollingStepRestAndBoxAge',
}

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'

const ROLLING_STEP_LABELS = {
  'prepare-leaves': 'Prepare Leaves', 'arrange-filler': 'Arrange Filler', 'select-bunching-method': 'Select Bunching Method',
  'apply-binder': 'Apply Binder', 'mold-or-press': 'Mold or Press', 'apply-wrapper': 'Apply Wrapper',
  'construct-cap': 'Construct Cap', 'finish-foot': 'Finish Foot', 'inspect-and-draw-test': 'Inspect and Draw Test',
  'rest-and-box-age': 'Rest and Box Age',
}
const QC_ITEM_LABELS = {
  'draw-test': 'Draw Test', 'weight-check': 'Weight Check', 'ring-gauge-check': 'Ring Gauge Check', 'length-check': 'Length Check',
  'wrapper-inspection': 'Wrapper Inspection', 'cap-inspection': 'Cap Inspection', 'foot-inspection': 'Foot Inspection',
  'density': 'Density', 'soft-spots': 'Soft Spots', 'hard-spots': 'Hard Spots', 'moisture': 'Moisture',
}
const QC_ITEM_WHY = {
  'draw-test': 'Confirms air pulls through with moderate, even resistance — too tight or too loose both ruin the smoking experience.',
  'weight-check': 'An unusually light or heavy cigar for its vitola can signal inconsistent filler density.',
  'ring-gauge-check': 'Verifies the cigar matches its intended diameter — affects burn time and body.',
  'length-check': 'Verifies the cigar matches its intended length — affects smoking time and flavor progression.',
  'wrapper-inspection': 'Checks for tears, wrinkles, or uneven tension that would affect burn and appearance.',
  'cap-inspection': 'Confirms the cap is securely applied and will not unravel when cut.',
  'foot-inspection': 'Confirms the foot matches its intended style and is not damaged.',
  'density': 'Even density across the bunch is central to a good draw and even burn.',
  'soft-spots': 'A soft spot usually means under-filled tobacco in that area — a common cause of burn problems.',
  'hard-spots': 'A hard spot usually means over-filled, over-dense tobacco — restricts draw.',
  'moisture': 'Incorrect moisture affects burn, draw, and long-term storage stability.',
}

function FillerArrangement({ primingRows, arrangement, onArrangementChange, onLearnMore, pendingId }) {
  const placed = arrangement.filter(Boolean)
  const available = primingRows.filter(r => !arrangement.some(a => a?.id === r.id))

  function place(row) {
    if (arrangement.length >= 4) return
    triggerHaptic('light')
    onArrangementChange([...arrangement, row])
  }
  function remove(index) {
    triggerHaptic('light')
    onArrangementChange(arrangement.filter((_, i) => i !== index))
  }
  function move(index, dir) {
    const next = [...arrangement]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    triggerHaptic('light')
    onArrangementChange(next)
  }

  const hasLigeroFirst = placed[0]?.component_key === 'ligero'
  const hasVolado = placed.some(r => r.component_key === 'volado')
  const feedback = []
  if (placed.length > 0) {
    if (hasLigeroFirst) feedback.push('High-strength concentration at the center — Ligero placed first concentrates strength there; consider whether that matches your intended progression.')
    if (!hasVolado && placed.length === 4) feedback.push('Potential airflow concern — no Volado included; an all-stronger-priming blend can burn hot and dense without a milder leaf to aid combustion.')
    if (placed.length === 4 && hasVolado && !hasLigeroFirst) feedback.push('Balanced distribution — a mix of primings with an easy-burning leaf present tends to support even combustion, though real bunching technique still matters most.')
    if (placed.length > 0 && placed.length < 4) feedback.push('Depends on leaf thickness and moisture — an incomplete arrangement cannot be fully evaluated yet.')
  }

  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 6px' }}>Filler Arrangement Practice</h3>
      <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', margin: '0 0 10px' }}>
        Tap a leaf below to place it into the arrangement (in order from
        center outward). Use the arrows to reorder, or the × to remove.
        There is no single guaranteed-winning arrangement.
      </p>
      <Link to="/smokecraft/filler-arrangement" style={{ fontSize: 11.5, color: GOLD, display: 'inline-block', marginBottom: 10 }}>
        Learn the full Filler Arrangement lesson →
      </Link>

      <div role="list" aria-label="Current filler arrangement" style={{ display: 'flex', gap: 8, marginBottom: 10, minHeight: 60, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map(i => {
          const row = arrangement[i]
          return (
            <div key={i} role="listitem" style={{
              width: 90, minHeight: 56, border: `1.5px dashed ${row ? GOLD : 'rgba(233,193,118,0.3)'}`, borderRadius: 8,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4, gap: 2,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.5)' }}>Position {i + 1}</div>
              {row ? (
                <>
                  <div style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>{row.display_name}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" aria-label={`Move ${row.display_name} earlier`} onClick={() => move(i, -1)} disabled={i === 0}
                      style={{ minWidth: 28, minHeight: 28, fontSize: 11, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 6, color: GOLD, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                    <button type="button" aria-label={`Move ${row.display_name} later`} onClick={() => move(i, 1)} disabled={i === placed.length - 1}
                      style={{ minWidth: 28, minHeight: 28, fontSize: 11, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 6, color: GOLD, cursor: i === placed.length - 1 ? 'not-allowed' : 'pointer', opacity: i === placed.length - 1 ? 0.4 : 1 }}>↓</button>
                    <button type="button" aria-label={`Remove ${row.display_name} from arrangement`} onClick={() => remove(i)}
                      style={{ minWidth: 28, minHeight: 28, fontSize: 11, background: 'transparent', border: '1px solid rgba(226,166,166,0.6)', borderRadius: 6, color: '#e2a6a6', cursor: 'pointer' }}>×</button>
                  </div>
                </>
              ) : <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.35)' }}>Empty</div>}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {available.map(row => (
          <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button type="button" onClick={() => place(row)} aria-label={`Place ${row.display_name} into the arrangement`}
              style={{ minHeight: 44, minWidth: 88, padding: '8px 10px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'rgba(255,255,255,0.03)', color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>
              {row.display_name}
            </button>
            <button type="button" onClick={() => onLearnMore(row)} disabled={pendingId === row.id} aria-label={`Learn more about ${row.display_name}`}
              style={{ fontSize: 10, color: GOLD, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '2px 8px', cursor: 'pointer', minHeight: 24 }}>
              Learn More
            </button>
          </div>
        ))}
        {available.length === 0 && placed.length > 0 && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>All four primings placed.</div>}
      </div>

      {feedback.length > 0 && (
        <div role="status" style={{ fontSize: 12, color: 'rgba(229,226,225,0.85)', borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 8 }}>
          {feedback.map((f, i) => <div key={i} style={{ marginBottom: 4 }}>• {f}</div>)}
        </div>
      )}
    </div>
  )
}

function RollingProcess({ steps, onComplete, pendingKey }) {
  const nextIncompleteIdx = steps.findIndex(s => s.status !== 'completed')
  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 10px' }}>The Rolling Process — Step by Step</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => {
          const isNext = i === nextIncompleteIdx
          const locked = i > nextIncompleteIdx
          const completed = step.status === 'completed'
          return (
            <li key={step.stepKey} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              border: `1px solid ${completed ? GOLD : 'rgba(233,193,118,0.2)'}`, borderRadius: 8, padding: '8px 10px',
              opacity: locked ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MediaSlot assetKey={ROLLING_STEP_ASSET_KEY[step.stepKey]} alt={ROLLING_STEP_LABELS[step.stepKey]} decorative style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: completed ? GOLD : CREAM }}>
                    {i + 1}. {ROLLING_STEP_LABELS[step.stepKey]} {completed && '✓'}
                  </div>
                  {locked && <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>Locked — complete "{ROLLING_STEP_LABELS[steps[i - 1]?.stepKey]}" first.</div>}
                </div>
              </div>
              {isNext && (
                <button
                  type="button"
                  aria-label={`Complete step: ${ROLLING_STEP_LABELS[step.stepKey]}`}
                  disabled={pendingKey === step.stepKey}
                  onClick={() => onComplete(step.stepKey)}
                  style={{ minHeight: 40, padding: '6px 14px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: pendingKey === step.stepKey ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                >
                  {pendingKey === step.stepKey ? 'Saving…' : 'Complete Step'}
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {nextIncompleteIdx === -1 && <div role="status" style={{ marginTop: 10, fontSize: 13, color: GOLD }}>Rolling sequence complete.</div>}
    </div>
  )
}

function QualityControl({ items, decisions, onDecide }) {
  const byItem = {}
  for (const d of decisions) byItem[d.item_key] = d.decision
  return (
    <div style={{ marginBottom: 24, border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 10, padding: 12 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 10px' }}>Quality Control Checklist</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <div key={item} style={{ borderBottom: '1px solid rgba(233,193,118,0.12)', paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{QC_ITEM_LABELS[item]}</div>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', marginBottom: 6 }}>{QC_ITEM_WHY[item]}</div>
            <div style={{ display: 'flex', gap: 6 }} role="group" aria-label={`${QC_ITEM_LABELS[item]} decision`}>
              {['accept', 'rework', 'reject'].map(d => (
                <button
                  key={d} type="button" aria-pressed={byItem[item] === d}
                  onClick={() => onDecide(item, d)}
                  style={{
                    minHeight: 36, padding: '4px 12px', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${byItem[item] === d ? GOLD : 'rgba(233,193,118,0.3)'}`,
                    background: byItem[item] === d ? 'rgba(233,193,118,0.15)' : 'transparent',
                    color: byItem[item] === d ? GOLD : CREAM,
                    textTransform: 'capitalize',
                  }}
                >
                  {byItem[item] === d && '✓ '}{d}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Package 5 — Leaf-to-Cigar construction & craft, built into the existing
// wrapper-strength supporting-module route (previously a dead redirect).
// No new session ID, no new route. Content and quizzes are real, seeded
// in Package 3/5 (see server/db/seeds/seedSmokecraftEducationalContent.mjs).
const SECTIONS = [
  { id: 'primings', title: 'Leaf Primings', category: 'leaf_priming' },
  { id: 'roles', title: 'Wrapper, Binder & Filler', category: null, categories: ['wrapper', 'binder', 'filler'] },
  { id: 'construction', title: 'Rolling the Cigar', category: 'construction_step' },
  { id: 'processing', title: 'Curing, Fermentation & Aging', category: 'processing_method' },
]

const CARD_BASE = {
  minHeight: 72, minWidth: 72, borderRadius: 12, border: `1px solid rgba(233,193,118,0.35)`,
  background: 'rgba(255,255,255,0.03)', color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
  padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4,
}

function Card({ row, active, onPress, onLearnMore, pending }) {
  return (
    <div style={{ ...CARD_BASE, borderColor: active ? GOLD : 'rgba(233,193,118,0.35)', position: 'relative', opacity: pending ? 0.6 : 1 }}>
      <button
        type="button"
        onClick={onPress}
        aria-pressed={active}
        aria-label={`${row.display_name}${active ? ' (selected)' : ''}`}
        disabled={pending}
        style={{ background: 'transparent', border: 'none', color: 'inherit', textAlign: 'left', cursor: pending ? 'wait' : 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}
      >
        {active && <span style={{ color: GOLD, marginRight: 6 }}>✓</span>}
        {row.display_name}
      </button>
      <button
        type="button"
        onClick={onLearnMore}
        aria-label={`Learn more about ${row.display_name}`}
        style={{ alignSelf: 'flex-start', fontSize: 11, color: GOLD, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 12, padding: '3px 10px', cursor: 'pointer', minHeight: 30 }}
      >
        Learn More
      </button>
    </div>
  )
}

function Section({ title, rows, selected, onToggle, onLearnMore, comparable, compareIds, onToggleCompare }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {rows.map(row => (
          <div key={row.id}>
            <Card row={row} active={selected === row.id} onPress={() => onToggle(row)} onLearnMore={() => onLearnMore(row)} />
            {comparable && (
              <label style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <input type="checkbox" checked={compareIds.includes(row.id)} onChange={() => onToggleCompare(row.id)} disabled={!compareIds.includes(row.id) && compareIds.length >= 3} />
                Compare
              </label>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Content for this category has not been curated yet.</div>
        )}
      </div>
    </div>
  )
}

export default function WrapperStrength() {
  const { awardSessionRewards } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // loading|ready|error
  const [byCategory, setByCategory] = useState({}) // category -> rows[]
  const [selected, setSelected] = useState({}) // sectionId -> component id
  const [detailContent, setDetailContent] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [notes, setNotes] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [quizSelected, setQuizSelected] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const [arrangement, setArrangement] = useState([])
  const [rollingSteps, setRollingSteps] = useState([])
  const [rollingPendingKey, setRollingPendingKey] = useState(null)
  const [qcDecisions, setQcDecisions] = useState([])
  const noteSaveTimer = useRef(null)

  const mentor = Array.isArray(journey?.mentor) ? journey.mentor[0] : null

  useEffect(() => {
    let cancelled = false
    async function load() {
      await ensureIdentity()
      const categories = ['leaf_priming', 'wrapper', 'binder', 'filler', 'construction_step', 'curing_method', 'fermentation_method', 'aging_method', 'processing_method']
      const results = await Promise.all(categories.map(c => ssApi.listSeedSoilComponents(c)))
      if (cancelled) return
      const map = {}
      categories.forEach((c, i) => { map[c] = results[i].ok ? (results[i].components || []) : [] })
      // "Curing, Fermentation & Aging" section merges 4 real catalog types —
      // the original Package 3 rows use curing_method/fermentation_method/
      // aging_method, Package 5 additions (sorting/grading, box aging) use
      // the more general processing_method.
      map.processing_all = [...map.curing_method, ...map.fermentation_method, ...map.aging_method, ...map.processing_method]
      setByCategory(map)

      const notesRes = await ssApi.getNotes()
      if (!cancelled && notesRes.ok && notesRes.notes?.[0]) setNotes(notesRes.notes[0].note_text)

      const [arrRes, rollRes, qcRes] = await Promise.all([lcApi.getArrangement(), lcApi.getRollingProgress(), lcApi.getQualityControl()])
      if (!cancelled) {
        if (arrRes.ok && arrRes.arrangement?.arrangement) {
          const savedIds = arrRes.arrangement.arrangement.map(a => a.id)
          const primingRows = map.leaf_priming || []
          setArrangement(savedIds.map(id => primingRows.find(r => String(r.id) === String(id))).filter(Boolean))
        }
        if (rollRes.ok) setRollingSteps(rollRes.progress || [])
        if (qcRes.ok) setQcDecisions(qcRes.decisions || [])
      }

      const wrapperRow = (map.wrapper || []).find(r => r.component_key === 'wrapper-role')
      if (wrapperRow) {
        const detailRes = await fetch(`/api/smokecraft/golden-box-content/components/${wrapperRow.id}`, { credentials: 'include' }).then(r => r.json()).catch(() => null)
        if (!cancelled && detailRes?.success && detailRes.quiz?.length) setQuiz(detailRes.quiz[0])
      }
      setStatus('ready')
    }
    load().catch(() => !cancelled && setStatus('error'))
    return () => { cancelled = true }
  }, [])

  const openDetail = useCallback(async (row) => {
    setPendingId(row.id)
    triggerHaptic('light')
    setDetailContent(fromCatalogRow(row))
    await ssApi.recordProgress(row.id)
    setPendingId(null)
  }, [])

  function handleToggleSelect(sectionId, row) {
    triggerHaptic('light')
    setSelected(prev => ({ ...prev, [sectionId]: prev[sectionId] === row.id ? null : row.id }))
  }

  function handleToggleCompare(id) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < 3 ? [...prev, id] : prev))
  }

  function handleNotesChange(value) {
    setNotes(value)
    setNoteSaved(false)
    clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(async () => {
      await ssApi.saveNote({ noteText: value })
      setNoteSaved(true)
    }, 1200)
  }

  async function handleArrangementChange(next) {
    setArrangement(next)
    await lcApi.saveArrangement(next.map((row, i) => ({ id: row.id, position: i })))
  }

  async function handleCompleteRollingStep(stepKey) {
    setRollingPendingKey(stepKey)
    triggerHaptic('medium')
    const result = await lcApi.completeRollingStep(stepKey)
    if (result.ok) {
      const refreshed = await lcApi.getRollingProgress()
      if (refreshed.ok) setRollingSteps(refreshed.progress || [])
      if (result.xpAwarded) triggerHaptic('success')
    }
    setRollingPendingKey(null)
  }

  async function handleQcDecide(itemKey, decision) {
    triggerHaptic('light')
    const result = await lcApi.saveQualityControlDecision(itemKey, decision)
    if (result.ok) {
      const refreshed = await lcApi.getQualityControl()
      if (refreshed.ok) setQcDecisions(refreshed.decisions || [])
    }
  }

  async function handleQuizSubmit() {
    if (!quiz || !quizSelected) return
    const result = await ssApi.submitQuizAnswer(quiz.id, quizSelected)
    if (result.ok) { setQuizResult(result); triggerHaptic(result.isCorrect ? 'success' : 'warning') }
  }

  function handleContinue() {
    awardSessionRewards('wrapper-strength')
    navigate('/smokecraft/seed-soil')
  }

  const allRows = Object.values(byCategory).flat()
  const compareRows = allRows.filter(r => compareIds.includes(r.id))

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ minHeight: '100vh', paddingBottom: 100, background: NAVY, color: CREAM, fontFamily: 'Georgia, serif' }}>
        <div style={{ padding: '20px 16px 8px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(233,193,118,0.7)' }}>Leaf to Cigar</div>
          <h1 style={{ fontSize: 22, color: GOLD, margin: '4px 0 6px' }}>Construction &amp; Craft</h1>
          <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.75)', maxWidth: 640, lineHeight: 1.5 }}>
            Explore how a cigar is actually built — from leaf priming through
            rolling, curing, fermentation, and aging. Tap any card to learn
            more; select up to three items to compare side by side.
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
              <Section title="Leaf Primings" rows={byCategory.leaf_priming || []} selected={selected.primings}
                onToggle={(row) => handleToggleSelect('primings', row)} onLearnMore={openDetail}
                comparable compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              <Section title="Wrapper" rows={byCategory.wrapper || []} selected={selected.wrapper}
                onToggle={(row) => handleToggleSelect('wrapper', row)} onLearnMore={openDetail}
                comparable compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              <Section title="Binder" rows={byCategory.binder || []} selected={selected.binder}
                onToggle={(row) => handleToggleSelect('binder', row)} onLearnMore={openDetail}
                comparable compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              <Section title="Filler (including Long vs. Short)" rows={byCategory.filler || []} selected={selected.filler}
                onToggle={(row) => handleToggleSelect('filler', row)} onLearnMore={openDetail}
                comparable compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              <FillerArrangement
                primingRows={byCategory.leaf_priming || []}
                arrangement={arrangement}
                onArrangementChange={handleArrangementChange}
                onLearnMore={openDetail}
                pendingId={pendingId}
              />

              <Section title="Rolling Process — Bunching, Application, Cap & Foot" rows={byCategory.construction_step || []}
                selected={selected.construction} onToggle={(row) => handleToggleSelect('construction', row)} onLearnMore={openDetail}
                comparable={false} compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                <MediaSlot assetKey="processingCuring" alt="Curing" caption="Curing" style={{ height: 70, borderRadius: 6 }} />
                <MediaSlot assetKey="processingFermentation" alt="Fermentation" caption="Fermentation" style={{ height: 70, borderRadius: 6 }} />
                <MediaSlot assetKey="processingAging" alt="Final resting and aging" caption="Aging" style={{ height: 70, borderRadius: 6 }} />
                <MediaSlot assetKey="processingGrading" alt="Sorting and grading" caption="Grading" style={{ height: 70, borderRadius: 6 }} />
              </div>
              <Section title="Curing, Fermentation, Aging & Grading" rows={byCategory.processing_all || []}
                selected={selected.processing} onToggle={(row) => handleToggleSelect('processing', row)} onLearnMore={openDetail}
                comparable={false} compareIds={compareIds} onToggleCompare={handleToggleCompare} />

              {rollingSteps.length > 0 && (
                <RollingProcess steps={rollingSteps} onComplete={handleCompleteRollingStep} pendingKey={rollingPendingKey} />
              )}

              <QualityControl items={Object.keys(QC_ITEM_LABELS)} decisions={qcDecisions} onDecide={handleQcDecide} />

              {compareRows.length >= 2 && (
                <div style={{ marginTop: 8, marginBottom: 20, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 12, overflowX: 'auto' }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 8px' }}>Comparing {compareRows.length} items</h3>
                  <div style={{ display: 'flex', gap: 12, minWidth: compareRows.length * 180 }}>
                    {compareRows.map(row => (
                      <div key={row.id} style={{ flex: '0 0 170px', fontSize: 12, lineHeight: 1.5 }}>
                        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 4 }}>{row.display_name}</div>
                        <div><b>Why it matters:</b> {row.why_it_matters || '—'}</div>
                        <div><b>Flavor:</b> {row.flavor_impact || '—'}</div>
                        <div><b>Strength:</b> {row.strength_impact || '—'}</div>
                        <div><b>Construction:</b> {row.construction_impact || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', marginTop: 8 }}>
                    No item here is universally "best" — each plays a different role in a blend.
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 8px' }}>Your Notes</h3>
                <textarea
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Impressions about construction, rolling technique, curing and fermentation…"
                  aria-label="Leaf to cigar construction notes"
                  style={{
                    width: '100%', minHeight: 90, resize: 'vertical', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 8,
                    color: CREAM, fontSize: 13, fontFamily: 'Georgia, serif', padding: 10,
                  }}
                />
                {noteSaved && <div style={{ fontSize: 11, color: GOLD, marginTop: 4 }}>Saved</div>}
              </div>

              {quiz && (
                <div style={{ marginBottom: 20, borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Knowledge Check</div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>{quiz.question}</div>
                  {!quizResult ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {(quiz.answer_choices || []).map(choice => (
                          <label key={choice} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', minHeight: 32 }}>
                            <input type="radio" name="wrapper-strength-quiz" value={choice} checked={quizSelected === choice} onChange={() => setQuizSelected(choice)} />
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
                Selections made here are practice only — they connect to your
                Golden Box entry's own blend picker (using the same real
                catalog), but do not create or submit a competition entry.
              </div>
            </>
          )}
        </div>
      </div>

      {detailContent && <EducationalDetailPanel content={detailContent} onClose={() => setDetailContent(null)} />}

      <SmokeCraftNavBar
        primary="Continue to Seed & Soil →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
