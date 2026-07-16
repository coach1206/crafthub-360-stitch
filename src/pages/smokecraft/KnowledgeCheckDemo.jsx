import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KnowledgeCheck from '../../components/smokecraft/KnowledgeCheck.jsx'
import { KNOWLEDGE_CHECK_SETS } from '../../data/knowledgeCheckQuestions.js'

const GOLD = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const NAVY = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'

/**
 * Knowledge Check demo/QA harness (Package O).
 *
 * This page exists solely to render the reusable KnowledgeCheck component
 * for manual QA and automated testing in isolation. It is NOT wired into
 * any educational session screen and is not part of the numbered 27-session
 * spine or Entry layer — see the Package O rebuild-plan evidence for why
 * this one small, clearly-labeled harness route was necessary despite the
 * package's otherwise strict file scope.
 */
export default function KnowledgeCheckDemo() {
  const navigate = useNavigate()
  const moduleIds = Object.keys(KNOWLEDGE_CHECK_SETS)
  const [moduleId, setModuleId] = useState(moduleIds[0])
  const [key, setKey] = useState(0)

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'auto',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif', padding: 'clamp(16px,4vw,40px)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/smokecraft')} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 16, color: 'rgba(229,226,225,0.6)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', marginBottom: 16 }}>
          ← Back to SmokeCraft
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Knowledge Check — QA Harness (not a spine screen)
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, color: CREAM }}>Reusable Knowledge Check Demo</h1>

        <div role="group" aria-label="Select Knowledge Check module" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {moduleIds.map(id => (
            <button
              key={id} type="button" aria-pressed={moduleId === id}
              onClick={() => { setModuleId(id); setKey(k => k + 1) }}
              style={{
                padding: '6px 12px', borderRadius: 14,
                border: `1.5px solid ${moduleId === id ? GOLD : BORDER}`,
                background: moduleId === id ? 'rgba(233,193,118,0.15)' : 'transparent',
                color: moduleId === id ? GOLD : 'rgba(229,226,225,0.7)',
                fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer',
              }}
            >
              {id}
            </button>
          ))}
        </div>

        <KnowledgeCheck key={key} moduleId={moduleId} allowSkip completionStepId={moduleId} />
      </div>
    </div>
  )
}
