import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import EducationalDetailPanel from '../../components/smokecraft/goldenBox/EducationalDetailPanel.jsx'
import { fromCatalogRow, notYetConfigured } from '../../components/smokecraft/goldenBox/educationalContentContract.js'
import { ensureIdentity } from '../../hooks/useGoldenBox.js'
import * as ssApi from '../../services/smokecraft/seedSoilApiClient.js'
import {
  GOLD,
  GOLD_DIM,
  CREAM,
  BORDER,
  GLASS,
  heroBannerStyle,
  pageShellStyle,
  cardStyle,
  sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'

const SEEDS = [
  { id: 'Criollo', key: 'criollo', description: 'Classic Cuban-origin genetics known for complexity and aroma.' },
  { id: 'Corojo', key: 'corojo', description: 'Aromatic, spicy genetics with a long history in premium cigar tobacco.' },
  { id: 'Habano', key: 'habano', description: 'Rich, flavorful tobacco genetics associated with fuller expression.' },
  { id: 'Connecticut', key: 'connecticut-shade', description: 'Silky, lighter wrapper genetics prized for smoothness and balance.' },
]

const SOILS = [
  { id: 'Sandy Loam', key: 'sandy-loam', description: 'Free-draining soil that can encourage concentrated tobacco character.' },
  { id: 'Clay Loam', key: 'clay-loam', description: 'Moisture-retentive, mineral-rich soil with strong agricultural structure.' },
  { id: 'Volcanic', key: 'volcanic', description: 'Mineral-rich growing conditions often associated with distinctive terroir.' },
  { id: 'Limestone', key: 'limestone', description: 'Alkaline mineral influence that can shape leaf structure and flavor.' },
]

export default function SeedSoil() {
  const navigate = useNavigate()
  const { awardSessionRewards } = useGuestSession()
  const { journey, setSeedSoil } = useSmokeCraftJourney()

  const [seedType, setSeedType] = useState(() => journey.seedSoil?.seedType || null)
  const [soilType, setSoilType] = useState(() => journey.seedSoil?.soilType || null)
  const [notes, setNotes] = useState(() => journey.seedSoil?.notes || '')
  const [catalogByKey, setCatalogByKey] = useState({})
  const [terroirRows, setTerroirRows] = useState([])
  const [anatomyRows, setAnatomyRows] = useState([])
  const [detailContent, setDetailContent] = useState(null)
  const [showAnatomy, setShowAnatomy] = useState(false)
  const [showTerroir, setShowTerroir] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
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
      for (const row of [...(seedRes.components || []), ...(soilRes.components || [])]) {
        map[row.component_key] = row
      }
      setCatalogByKey(map)
      setTerroirRows(terroirRes.components || [])
      setAnatomyRows(anatomyRes.components || [])
      if (notesRes.ok && notesRes.notes?.[0]) setNotes(prev => prev || notesRes.notes[0].note_text)

      const criollo = map.criollo
      if (criollo) {
        const detailRes = await fetch(`/api/smokecraft/golden-box-content/components/${criollo.id}`, { credentials: 'include' })
          .then(r => r.json())
          .catch(() => null)
        if (!cancelled && detailRes?.success && detailRes.quiz?.length) setQuiz(detailRes.quiz[0])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setSeedSoil(seedType || soilType || notes ? {
      seedType: seedType || null,
      soilType: soilType || null,
      notes,
    } : null)
  }, [seedType, soilType, notes, setSeedSoil])

  function handleSelect(group, id) {
    triggerHaptic('light')
    if (group === 'seed') setSeedType(prev => prev === id ? null : id)
    else setSoilType(prev => prev === id ? null : id)
  }

  const openDetail = useCallback((row, category) => {
    setDetailContent(row ? fromCatalogRow(row) : notYetConfigured(category))
    if (row?.id) ssApi.recordProgress(row.id)
  }, [])

  function handleNotesChange(value) {
    setNotes(value)
    clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(() => ssApi.saveNote({ noteText: value }), 1200)
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

  function optionCard(item, group, selected) {
    const row = catalogByKey[item.key]
    return (
      <article key={item.id} style={{
        background: selected ? 'rgba(233,193,118,0.12)' : GLASS,
        border: `1px solid ${selected ? GOLD : BORDER}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => handleSelect(group, item.id)}
          style={{
            minHeight: 48,
            width: '100%',
            border: `1px solid ${selected ? GOLD : BORDER}`,
            borderRadius: 9,
            background: selected ? 'rgba(233,193,118,0.14)' : '#0d1420',
            color: CREAM,
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {selected ? '✓ ' : ''}{item.id}
        </button>
        <p style={{ margin: 0, color: 'rgba(229,226,225,.64)', fontSize: 12.5, lineHeight: 1.5 }}>
          {item.description}
        </p>
        <button
          type="button"
          onClick={() => openDetail(row, group === 'seed' ? 'seed_genetics' : 'soil')}
          style={{
            alignSelf: 'flex-start',
            minHeight: 40,
            padding: '0 12px',
            borderRadius: 8,
            border: `1px solid ${BORDER}`,
            background: 'transparent',
            color: GOLD,
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
          }}
        >
          Learn More
        </button>
      </article>
    )
  }

  return (
    <>
      <SmokeCraftScreenShell mode="live" status="ready">
        <div style={pageShellStyle}>
          <div style={heroBannerStyle}>
            <div aria-hidden="true" style={{ fontSize: 40, lineHeight: 1 }}>🌱</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                SmokeCraft 360 — Origin & Terroir
              </div>
              <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Seed & Soil</h1>
              <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
                Explore how tobacco genetics and growing conditions shape the cigar before fermentation, aging, blending, and rolling ever begin.
              </p>
            </div>
          </div>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>1. Choose a seed family</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 14 }}>
              {SEEDS.map(item => optionCard(item, 'seed', seedType === item.id))}
            </div>
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>2. Choose a soil profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 14 }}>
              {SOILS.map(item => optionCard(item, 'soil', soilType === item.id))}
            </div>
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Tasting Notes</div>
            <textarea
              value={notes}
              onChange={event => handleNotesChange(event.target.value)}
              placeholder="Record what you want to remember about seed variety, soil, terroir, and expected flavor influence…"
              aria-label="Seed and soil tasting notes"
              style={{
                width: '100%',
                minHeight: 120,
                resize: 'vertical',
                boxSizing: 'border-box',
                marginTop: 12,
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: '#0d1420',
                color: CREAM,
                fontFamily: 'Georgia, serif',
                fontSize: 14,
                lineHeight: 1.55,
              }}
            />
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <button
              type="button"
              onClick={() => setShowLearnMore(v => !v)}
              aria-expanded={showLearnMore}
              style={{
                minHeight: 48,
                padding: '0 16px',
                borderRadius: 9,
                border: `1px solid ${GOLD}`,
                background: 'rgba(233,193,118,.08)',
                color: GOLD,
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showLearnMore ? 'Hide Terroir, Anatomy & Quiz' : 'Explore Terroir, Anatomy & Quiz'}
            </button>

            {showLearnMore && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                <div>
                  <button type="button" onClick={() => setShowTerroir(v => !v)} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, padding: 0 }}>
                    {showTerroir ? '▾' : '▸'} Explore Terroir Factors ({terroirRows.length})
                  </button>
                  {showTerroir && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {terroirRows.map(row => (
                        <button key={row.id} type="button" onClick={() => openDetail(row, 'terroir')} style={{ minHeight: 40, padding: '0 12px', borderRadius: 18, border: `1px solid ${BORDER}`, background: GLASS, color: GOLD, cursor: 'pointer' }}>
                          {row.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button type="button" onClick={() => setShowAnatomy(v => !v)} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, padding: 0 }}>
                    {showAnatomy ? '▾' : '▸'} Explore Plant Anatomy ({anatomyRows.length})
                  </button>
                  {showAnatomy && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {anatomyRows.map(row => (
                        <button key={row.id} type="button" onClick={() => openDetail(row, 'plant_anatomy')} style={{ minHeight: 40, padding: '0 12px', borderRadius: 18, border: `1px solid ${BORDER}`, background: GLASS, color: GOLD, cursor: 'pointer' }}>
                          {row.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {quiz && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
                    <div style={sectionLabelStyle}>Knowledge Check</div>
                    <p style={{ color: CREAM, lineHeight: 1.5 }}>{quiz.question}</p>
                    {!quizResult ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(quiz.answer_choices || []).map(choice => (
                            <label key={choice} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'rgba(229,226,225,.75)', cursor: 'pointer', minHeight: 38 }}>
                              <input type="radio" name="seed-soil-quiz" value={choice} checked={quizSelected === choice} onChange={() => setQuizSelected(choice)} />
                              {choice}
                            </label>
                          ))}
                        </div>
                        <button type="button" onClick={handleQuizSubmit} disabled={!quizSelected} style={{ minHeight: 44, marginTop: 12, padding: '0 14px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: quizSelected ? 'pointer' : 'not-allowed', opacity: quizSelected ? 1 : .5 }}>
                          Submit Answer
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: quizResult.isCorrect ? '#8fd19e' : '#e2a6a6' }}>
                        {quizResult.isCorrect ? 'Correct! ' : 'Not quite. '}{quizResult.explanation}
                        {quizResult.xpAwarded && <span style={{ color: GOLD }}> (+15 XP)</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <div style={{ height: 90 }} aria-hidden="true" />
        </div>

        <SmokeCraftNavBar
          primary="Continue to Humidor Match →"
          onPrimary={handleContinue}
          secondary="← Back"
          onSecondary={() => navigate(-1)}
        />
      </SmokeCraftScreenShell>

      {detailContent && <EducationalDetailPanel content={detailContent} onClose={() => setDetailContent(null)} />}
    </>
  )
}
