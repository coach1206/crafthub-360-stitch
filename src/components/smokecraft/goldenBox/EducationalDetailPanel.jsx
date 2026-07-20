import { useEffect, useRef } from 'react'
import MediaSlot from './MediaSlot.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.28)'

const ROW = (label, value) => value ? (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(229,226,225,0.55)', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{value}</div>
  </div>
) : null

/**
 * One reusable modal for every educational interaction in Golden Box —
 * wrapper, binder, filler, leaf priming, soil, terroir, origin, seed,
 * curing, fermentation, aging, vitola, flavor note, strength target,
 * construction option, mentor insight, image hotspot, badge, reward.
 * Content is always the shared educationalContentContract shape.
 */
export default function EducationalDetailPanel({ content, onClose }) {
  const closeBtnRef = useRef(null)
  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!content) return null

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="gb-edu-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: NAVY, border: `1px solid ${BORDER}`, borderRadius: 14, maxWidth: 560, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 24, color: CREAM, fontFamily: 'Georgia, serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: GOLD, letterSpacing: '0.05em' }}>{content.category}</div>
            <h2 id="gb-edu-title" style={{ margin: '4px 0 0', fontSize: 22, color: GOLD }}>{content.title}</h2>
          </div>
          <button
            ref={closeBtnRef} type="button" onClick={onClose} aria-label="Close educational detail"
            style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontSize: 18 }}
          >×</button>
        </div>

        {content.mediaAssetKey && <MediaSlot assetKey={content.mediaAssetKey} alt={content.title} caption={content.title} style={{ marginBottom: 14, borderRadius: 10, height: 160 }} />}

        {content.sourceStatus === 'not_yet_available' && (
          <div style={{ fontSize: 12, color: 'rgba(255,200,140,0.9)', border: `1px solid rgba(255,200,140,0.3)`, borderRadius: 8, padding: 8, marginBottom: 12 }}>
            Educational content for this item has not been curated yet — this is an honest not-yet-available state, not an error.
          </div>
        )}

        {ROW('What it is', content.definition)}
        {ROW('Why it matters', content.whyItMatters)}
        {ROW('Quality impact', content.qualityImpact)}
        {ROW('Flavor impact', content.flavorImpact)}
        {ROW('Construction impact', content.constructionImpact)}
        {ROW('Performance impact', content.performanceImpact)}
        {ROW('Decision guidance', content.decisionGuidance)}
        {ROW('Compatibility considerations', content.compatibilityNotes)}
        {ROW('Mentor guidance', content.mentorGuidance)}

        <button
          type="button" onClick={onClose}
          style={{ marginTop: 12, minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}
        >Close</button>
      </div>
    </div>
  )
}
