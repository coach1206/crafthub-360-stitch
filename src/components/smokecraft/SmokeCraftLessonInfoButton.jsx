import { useState } from 'react'

const GOLD = '#E9C176'
const BORDER = 'rgba(233,193,118,0.4)'
const GLASS = 'rgba(8,10,16,0.97)'

/**
 * Holistic Fix 2E-7 — a small, safe way to surface lesson title/phase/
 * progress and the Golden Box relevance / Why It Matters content
 * (smokecraftEducationalEnrichment.js) on approved-image curriculum
 * screens WITHOUT risking the always-visible-overlay regression found in
 * Holistic Fix 2E-6 (several screens' approved artwork has baked UI-chrome
 * text at the exact top-of-viewport position a full banner would cover).
 *
 * Rendered as a SIBLING of the screen's SmokeCraftImageBoundsOverlay (or
 * any other approved-image wrapper), never as a CHILD of it — the overlay
 * renders its children inside a bounds-relative coordinate space clipped
 * to the rendered image rect, which silently breaks a plain
 * position:absolute child (confirmed via live testing during Holistic Fix
 * 2E-7: the button rendered but its popover panel was invisible/clipped).
 * As a sibling, `position: fixed` places it in real viewport coordinates.
 */
export default function SmokeCraftLessonInfoButton({
  sessionNumber, totalSessions, phase, totalPhases, title, whyItMatters, goldenBox,
  top = 12, right = 12,
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide lesson info' : 'Show lesson info: why this matters and Golden Box relevance'}
        data-smokecraft-lesson-info-button=""
        style={{
          position: 'fixed', top, right, zIndex: 40,
          width: 34, height: 34, borderRadius: '50%',
          background: GLASS, border: `1.5px solid ${BORDER}`, color: GOLD,
          fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        i
      </button>
      {open && (
        <div
          role="region"
          aria-label="Lesson info"
          data-smokecraft-lesson-info-panel=""
          style={{
            position: 'fixed', top: top + 42, right, zIndex: 40,
            width: 'min(320px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto',
            background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '14px 16px', fontFamily: 'Georgia, serif', color: '#e5e2e1',
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', marginBottom: 4 }}>
            Session {sessionNumber} of {totalSessions} &middot; Phase {phase} of {totalPhases}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 8 }}>{title}</div>
          {whyItMatters && (
            <div data-smokecraft-why-it-matters="" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              <strong style={{ color: 'rgba(233,193,118,0.85)' }}>Why it matters: </strong>{whyItMatters}
            </div>
          )}
          {goldenBox && (
            <div data-smokecraft-golden-box-relevance="" style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: 'rgba(233,193,118,0.85)' }}>Golden Box relevance: </strong>{goldenBox}
            </div>
          )}
        </div>
      )}
    </>
  )
}
