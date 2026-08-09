import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'

const ENRICHMENT_24 = getEducationalEnrichment(24)

const GOLD   = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const CREAM  = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS  = 'rgba(233,193,118,0.06)'
const NAVY_DEEP = '#060810'

// 6 readiness-check items — real, persisted, gates nothing (informational
// self-check before the passport stamp), same ids/labels as before the
// rebuild so `journey.finalReview.checked` stays compatible.
const READINESS_ITEMS = [
  { id: 'r1', label: 'Journey foundations reviewed' },
  { id: 'r2', label: 'Flavor memory captured' },
  { id: 'r3', label: 'Pairing preference confirmed' },
  { id: 'r4', label: 'Mentor guidance acknowledged' },
  { id: 'r5', label: 'Burn & draw quality noted' },
  { id: 'r6', label: 'Ready to receive passport stamp' },
]

/**
 * Final Review — /smokecraft/final-review (S24)
 *
 * SC-D085 rebuild — the previous version was an image-shell built entirely
 * on the approved FINAL REVIEW.png composite: every section (Journey Review
 * Foundations, the 12-card Journey Recap grid, What Stood Out, Review
 * Notes, Readiness Check's own labels, Experience Snapshot, Final
 * Reflection) was baked into that single image, with only 6 transparent
 * checkbox hotspots as real DOM. A real player saw dozens of empty-looking
 * value fields under those baked labels with zero live data behind them.
 *
 * Rebuilt as real live DOM (same pattern as the Golden Box Rules rebuild,
 * SC-D079): every section below reads real, already-collected journey data
 * from SmokeCraftJourneyContext — nothing is fabricated. A step that the
 * player genuinely skipped or that recorded no notes shows an honest
 * "Not recorded this journey" line, never invented content.
 */
export default function FinalReview({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey, setFinalReview } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [checked, setChecked] = useState(() => new Set(journey.finalReview?.checked || []))
  const [reviewNotes, setReviewNotes] = useState(journey.finalReview?.reviewNotes || '')
  const [reflection, setReflection] = useState(journey.finalReview?.reflection || '')

  useEffect(() => {
    setFinalReview({ checked: [...checked], reviewNotes, reflection })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, reviewNotes, reflection])

  function toggle(id) {
    triggerHaptic('light')
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleContinue() {
    triggerHaptic('medium')
    if (onComplete) { onComplete(); return }
    awardSessionRewards('final-review')
    navigate('/smokecraft/rewards')
  }

  // ── Real journey recap — every entry reads actual recorded data; a step
  // with nothing recorded shows an honest empty line, never a fake value. ──
  const cigar = journey.selectedCigar
  const recap = [
    { title: 'Golden Box Rules',   detail: journey.golden_box_acknowledged || journey.goldenBoxAcknowledged ? 'Acknowledged' : null },
    { title: 'Mentor Selection',   detail: journey.mentor?.name || null },
    { title: 'Seed & Soil',        detail: journey.seedSoil?.viewedSections?.length ? `${journey.seedSoil.viewedSections.length} topic(s) explored` : null },
    { title: 'Humidor Match',      detail: journey.selectedEnvironment?.name || cigar?.name ? [journey.selectedEnvironment?.name, cigar?.name].filter(Boolean).join(' · ') : null },
    { title: 'Meet Your Cigar',    detail: journey.meetYourCigar?.viewedSections?.length ? `${journey.meetYourCigar.viewedSections.length} section(s) viewed` : null },
    { title: 'Request / Purchase', detail: journey.requestPurchase?.orderPath || null },
    { title: 'Cut, Toast & Light', detail: journey.cutToastLight?.completedAt ? 'Completed' : null },
    { title: 'First Third',        detail: journey.firstThird?.notes || (journey.firstThird?.selectedNotes?.length ? journey.firstThird.selectedNotes.join(', ') : null) },
    { title: 'Flavor Memory',      detail: journey.flavorMemory?.selectedFlavors?.length ? journey.flavorMemory.selectedFlavors.join(', ') : null },
    { title: 'Pairing Lab',        detail: journey.pairing?.recommendation || null },
    { title: 'Second Third',       detail: journey.secondThird?.notes || null },
    { title: 'Final Third',        detail: journey.finalThird?.notes || null },
    { title: 'Scorecard',          detail: journey.scorecard?.overall != null ? `Overall ${journey.scorecard.overall}/5` : null },
  ]
  const recordedCount = recap.filter(r => r.detail).length

  const standoutFlavors = journey.flavorMemory?.selectedFlavors || []
  const standoutNotes = journey.flavorMemory?.personalNotes || journey.finalThird?.notes || null

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Georgia, serif' }}>

        <div style={{
          borderRadius: 14, border: `1px solid ${BORDER}`, padding: 'clamp(20px,3.4vw,32px)',
          background: 'radial-gradient(120% 140% at 15% 20%, rgba(233,193,118,0.14), rgba(6,8,12,0.4) 60%), linear-gradient(135deg, rgba(233,193,118,0.06), rgba(11,15,24,0.9))',
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <span style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">📖</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              SmokeCraft 360 — Final Review
            </div>
            <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(24px,3.4vw,34px)', color: CREAM }}>Review the journey before the final stamp</h1>
            <p style={{ margin: 0, fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.55, maxWidth: 680 }}>
              Take a moment to revisit your key insights, reflections, and experience. Confirm everything feels right before you stamp your passport and continue this chapter.
            </p>
          </div>
        </div>

        {/* Journey Recap — real per-step data, honest when a step recorded nothing. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Journey Recap
          </div>
          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)', marginBottom: 12 }}>
            {recordedCount} of {recap.length} steps recorded real data this journey.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {recap.map(item => (
              <div key={item.title} style={{
                background: NAVY_DEEP, border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12.5, color: item.detail ? CREAM : 'rgba(229,226,225,0.35)', fontStyle: item.detail ? 'normal' : 'italic', lineHeight: 1.4 }}>
                  {item.detail || 'Not recorded this journey'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Snapshot — real selected cigar summary. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Experience Snapshot
          </div>
          {cigar ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: CREAM }}>
              <div>Cigar: <span style={{ color: GOLD_DIM }}>{cigar.name}</span></div>
              {cigar.wrapper && <div>Wrapper: <span style={{ color: GOLD_DIM }}>{cigar.wrapper}</span></div>}
              {journey.mentor?.name && <div>Mentor: <span style={{ color: GOLD_DIM }}>{journey.mentor.name}</span></div>}
              <div>XP earned: <span style={{ color: GOLD_DIM }}>{session?.xp || 0}</span></div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No cigar selected this journey.</div>
          )}
        </section>

        {/* What Stood Out — real flavor-memory data. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            What Stood Out
          </div>
          {standoutFlavors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: standoutNotes ? 10 : 0 }}>
              {standoutFlavors.map(f => (
                <span key={f} style={{ background: 'rgba(233,193,118,0.1)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '3px 10px', fontSize: 12, color: GOLD }}>{f}</span>
              ))}
            </div>
          )}
          {standoutNotes && <p style={{ margin: 0, fontSize: 13, color: CREAM, lineHeight: 1.55 }}>{standoutNotes}</p>}
          {!standoutFlavors.length && !standoutNotes && (
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No flavor notes recorded this journey.</div>
          )}
        </section>

        {/* Readiness Check — real, persisted, same 6 items as before. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Readiness Check
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {READINESS_ITEMS.map(item => {
              const active = checked.has(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    background: active ? 'rgba(233,193,118,0.08)' : 'transparent',
                    border: `1.5px solid ${active ? GOLD : BORDER}`, borderRadius: 8,
                    padding: '10px 14px', cursor: 'pointer', minHeight: 44,
                    fontFamily: 'Georgia, serif', fontSize: 13, color: CREAM,
                  }}
                >
                  <span aria-hidden="true" style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${active ? GOLD : BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD, fontSize: 12, fontWeight: 700,
                  }}>{active ? '✓' : ''}</span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Review Notes + Final Reflection — real, persisted, honest empty state. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Review Notes</div>
          <textarea
            aria-label="Review notes"
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            placeholder="Anything to revisit before the final stamp…"
            rows={3}
            style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, color: CREAM, fontFamily: 'Georgia, serif', fontSize: 13, padding: 10, minHeight: 60, outline: 'none', boxSizing: 'border-box' }}
          />
        </section>

        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Final Reflection</div>
          <textarea
            aria-label="Final reflection"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="How would you sum up this journey?"
            rows={3}
            style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, color: CREAM, fontFamily: 'Georgia, serif', fontSize: 13, padding: 10, minHeight: 60, outline: 'none', boxSizing: 'border-box' }}
          />
        </section>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={24} totalSessions={TOTAL_SESSIONS} phase={6} totalPhases={TOTAL_VISITS}
        title="Completed Scorecard" whyItMatters={ENRICHMENT_24?.whyItMatters} goldenBox={ENRICHMENT_24?.goldenBox}
      />

      <SmokeCraftNavBar
        primary="Continue to Rewards →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
