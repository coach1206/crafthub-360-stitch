import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import EducationalDetailPanel from '../../components/smokecraft/goldenBox/EducationalDetailPanel.jsx'
import { fromCatalogRow, notYetConfigured } from '../../components/smokecraft/goldenBox/educationalContentContract.js'
import { ensureIdentity } from '../../hooks/useGoldenBox.js'
import * as ssApi from '../../services/smokecraft/seedSoilApiClient.js'

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

// Zone id -> real golden_box_component_catalog component_key (Package 3
// seeded seed_genetics/soil rows deliberately using these exact keys).
const SEED_ZONES = [
  { id: 'Criollo',     group: 'seed', key: 'criollo',               x:  7.77, y: 43.0, w: 32.9, h: 6.9 },
  { id: 'Corojo',      group: 'seed', key: 'corojo',                x:  7.77, y: 50.2, w: 32.9, h: 6.9 },
  { id: 'Habano',      group: 'seed', key: 'habano',                x:  7.77, y: 57.4, w: 32.9, h: 6.9 },
  // "Connecticut" maps to connecticut-shade — the more common wrapper
  // genetic for this label; connecticut-broadleaf exists as a separate
  // catalog record, reachable via its own Learn More once a distinct zone
  // is warranted by an approved image update.
  { id: 'Connecticut', group: 'seed', key: 'connecticut-shade',     x:  7.77, y: 64.6, w: 32.9, h: 8.5 },
]
const SOIL_ZONES = [
  { id: 'Sandy Loam', group: 'soil', key: 'sandy-loam', x: 41.9, y: 43.0, w: 44.7, h: 6.9 },
  { id: 'Clay Loam',  group: 'soil', key: 'clay-loam',  x: 41.9, y: 50.2, w: 44.7, h: 6.9 },
  { id: 'Volcanic',   group: 'soil', key: 'volcanic',   x: 41.9, y: 57.4, w: 44.7, h: 6.9 },
  { id: 'Limestone',  group: 'soil', key: 'limestone',  x: 41.9, y: 64.6, w: 44.7, h: 8.5 },
]
const ALL_ZONES = [...SEED_ZONES, ...SOIL_ZONES]

export default function SeedSoil() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setSeedSoil } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [seedType, setSeedType] = useState(() => journey.seedSoil?.seedType || null)
  const [soilType, setSoilType] = useState(() => journey.seedSoil?.soilType || null)
  const [notes,    setNotes]    = useState(() => journey.seedSoil?.notes || '')

  // Real, database-backed content (Package 3 catalog + Package 4 wiring)
  const [catalogByKey, setCatalogByKey] = useState({}) // component_key -> row
  const [terroirRows, setTerroirRows] = useState([])
  const [anatomyRows, setAnatomyRows] = useState([])
  const [detailContent, setDetailContent] = useState(null)
  const [showAnatomy, setShowAnatomy] = useState(false)
  const [showTerroir, setShowTerroir] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [quiz, setQuiz] = useState(null) // { id, question, answer_choices }
  const [quizResult, setQuizResult] = useState(null) // { isCorrect, explanation, xpAwarded }
  const [quizSelected, setQuizSelected] = useState('')
  const noteSaveTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      await ensureIdentity()
      const [seedRes, soilRes, terroirRes, anatomyRes, notesRes] = await Promise.all([
        ssApi.listSeedSoilComponents('seed_genetics'),
        ssApi.listSeedSoilComponents('soil'),
        ssApi.listSeedSoilComponents('terroir'),
        ssApi.listSeedSoilComponents('plant_anatomy'),
        ssApi.getNotes(),
      ])
      if (cancelled) return
      const map = {}
      for (const row of [...(seedRes.components || []), ...(soilRes.components || [])]) map[row.component_key] = row
      setCatalogByKey(map)
      setTerroirRows(terroirRes.components || [])
      setAnatomyRows(anatomyRes.components || [])
      if (notesRes.ok && notesRes.notes?.[0]) setNotes(prev => prev || notesRes.notes[0].note_text)

      // Load one Seed and Soil knowledge check, if seeded (honest — none
      // shown if not yet configured for this screen's components).
      const criollo = map['criollo']
      if (criollo) {
        const detailRes = await fetch(`/api/smokecraft/golden-box-content/components/${criollo.id}`, { credentials: 'include' }).then(r => r.json()).catch(() => null)
        if (!cancelled && detailRes?.success && detailRes.quiz?.length) setQuiz(detailRes.quiz[0])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setSeedSoil(
      seedType || soilType || notes
        ? { seedType: seedType || null, soilType: soilType || null, notes }
        : null
    )
  }, [seedType, soilType, notes, setSeedSoil])

  function handleToggle(zone) {
    triggerHaptic('light')
    if (zone.group === 'seed') {
      setSeedType(prev => prev === zone.id ? null : zone.id)
    } else {
      setSoilType(prev => prev === zone.id ? null : zone.id)
    }
  }

  const openDetail = useCallback((row, category) => {
    const content = row ? fromCatalogRow(row) : notYetConfigured(category)
    setDetailContent(content)
    if (row?.id) ssApi.recordProgress(row.id)
  }, [])

  function handleNotesChange(value) {
    setNotes(value)
    clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(() => {
      ssApi.saveNote({ noteText: value })
    }, 1200)
  }

  async function handleQuizSubmit() {
    if (!quiz || !quizSelected) return
    const result = await ssApi.submitQuizAnswer(quiz.id, quizSelected)
    if (result.ok) setQuizResult(result)
  }

  function handleContinue() {
    awardSessionRewards('seed-soil')
    navigate('/smokecraft/humidor-match')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.seedSoil}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Seed & Soil — The Origin of Your Cigar"
      >
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '4%',
          background: 'linear-gradient(to bottom, transparent, #050505 60%)', pointerEvents: 'none', zIndex: 2 }} />

        {ALL_ZONES.map(zone => {
          const active = zone.group === 'seed' ? seedType === zone.id : soilType === zone.id
          const row = catalogByKey[zone.key]
          return (
            <div key={zone.id} style={{ position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}>
              <button
                type="button"
                aria-label={`${zone.id}${active ? ' (selected)' : ''}`}
                aria-pressed={active}
                onClick={() => handleToggle(zone)}
                style={{
                  position: 'absolute', inset: 0,
                  pointerEvents: 'auto', background: 'transparent',
                  border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                  borderRadius: 3, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
                }}
              >
                {active && (
                  <span style={{ position: 'absolute', top: 3, right: 6, fontSize: 'clamp(9px,1.2vw,14px)', fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => openDetail(row, zone.group === 'seed' ? 'seed_genetics' : 'soil')}
                aria-label={`Learn more about ${zone.id}`}
                style={{
                  position: 'absolute', bottom: 2, right: 2, minWidth: 20, minHeight: 20,
                  fontSize: 'clamp(8px,1vw,11px)', color: GOLD, background: 'rgba(5,5,5,0.7)',
                  border: `1px solid ${GOLD}`, borderRadius: '50%', cursor: 'pointer', pointerEvents: 'auto', zIndex: 3,
                }}
              >i</button>
            </div>
          )
        })}

        <div style={{
          position: 'absolute', left: '7%', top: '76%', width: '86%', height: '18%',
          background: '#050505', border: '1px solid rgba(233,193,118,0.22)', borderRadius: 6, boxSizing: 'border-box',
          padding: 'clamp(5px,0.8vw,10px)', display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'auto',
        }}>
          <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>
            Tasting Notes
          </span>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Impressions about seed variety and growing soil…"
            aria-label="Seed and soil tasting notes"
            style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(229,226,225,0.8)', fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}
          />
        </div>
        {/* Fixed toggle trigger, inside the image overlay's own pointer-events-auto
            layer, so it isn't ever covered by the overlay's own fixed positioning. */}
        <button
          type="button"
          onClick={() => setShowLearnMore(v => !v)}
          aria-expanded={showLearnMore}
          style={{
            position: 'absolute', top: '2%', right: '2%', zIndex: 4, pointerEvents: 'auto',
            fontSize: 'clamp(9px,1vw,12px)', padding: '6px 12px', borderRadius: 16,
            border: `1px solid ${GOLD}`, background: 'rgba(5,5,5,0.75)', color: GOLD, cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          {showLearnMore ? 'Close Learn More ▴' : 'Terroir, Anatomy & Quiz ▾'}
        </button>
      </SmokeCraftImageBoundsOverlay>

      {/* Terroir, plant anatomy, and knowledge check — real database-backed
          content without new hotspot images (honest, future-ready per
          smokecraft_hotspots, not yet populated). Fixed drawer above the
          nav bar, own z-index, so it is always reachable regardless of the
          image overlay's fixed positioning. */}
      {showLearnMore && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 80, maxHeight: '55vh', overflowY: 'auto',
          background: '#050505', borderTop: `1px solid ${GOLD}`, padding: '14px 16px',
          fontFamily: 'Georgia, serif', color: '#e5e2e1', zIndex: 50, boxShadow: '0 -6px 20px rgba(0,0,0,0.6)',
        }}>
          <button type="button" onClick={() => setShowTerroir(v => !v)}
            style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: showTerroir ? 8 : 0 }}>
            {showTerroir ? '▾' : '▸'} Explore Terroir Factors ({terroirRows.length})
          </button>
          {showTerroir && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {terroirRows.map(row => (
                <button key={row.id} type="button" onClick={() => openDetail(row, 'terroir')}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
                  {row.display_name}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setShowAnatomy(v => !v)}
            style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 13, padding: 0, margin: '10px 0 0', marginBottom: showAnatomy ? 8 : 0 }}>
            {showAnatomy ? '▾' : '▸'} Explore Plant Anatomy ({anatomyRows.length})
          </button>
          {showAnatomy && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {anatomyRows.map(row => (
                <button key={row.id} type="button" onClick={() => openDetail(row, 'plant_anatomy')}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
                  {row.display_name}
                </button>
              ))}
            </div>
          )}

          {quiz && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(233,193,118,0.18)', paddingTop: 10 }}>
              <div style={{ fontSize: 12, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Knowledge Check</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>{quiz.question}</div>
              {!quizResult ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {(quiz.answer_choices || []).map(choice => (
                      <label key={choice} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                        <input type="radio" name="seed-soil-quiz" value={choice} checked={quizSelected === choice} onChange={() => setQuizSelected(choice)} />
                        {choice}
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={handleQuizSubmit} disabled={!quizSelected}
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: quizSelected ? 'pointer' : 'not-allowed', opacity: quizSelected ? 1 : 0.5 }}>
                    Submit Answer
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: quizResult.isCorrect ? '#8fd19e' : '#e2a6a6' }}>
                  {quizResult.isCorrect ? 'Correct! ' : 'Not quite. '}{quizResult.explanation}
                  {quizResult.xpAwarded && <span style={{ color: GOLD }}> (+15 XP)</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {detailContent && <EducationalDetailPanel content={detailContent} onClose={() => setDetailContent(null)} />}

      <SmokeCraftNavBar
        primary="Continue to Humidor Match →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
