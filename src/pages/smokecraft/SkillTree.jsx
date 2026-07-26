import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import * as api from '../../services/smokecraft/skillTreeApiClient.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

const STATE_COLOR = {
  locked: 'rgba(229,226,225,0.35)',
  available: GOLD,
  in_progress: '#e2c07f',
  completed: '#7fd0a3',
}
const STATE_LABEL = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function SkillTree() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error | offline
  const [nodes, setNodes] = useState([])
  const [summary, setSummary] = useState(null)
  const [activeNodeKey, setActiveNodeKey] = useState(null)
  const [activeNodeDetail, setActiveNodeDetail] = useState(null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function load() {
    setStatus('loading')
    const res = await api.getSkillTree()
    if (!res.ok) { setStatus(res.error === 'offline' ? 'offline' : 'error'); return }
    setNodes(res.nodes); setSummary(res.summary); setStatus('ready')
  }

  useEffect(() => { load() }, [])

  async function openNode(nodeKey) {
    triggerHaptic('light')
    setActiveNodeKey(nodeKey)
    setActiveNodeDetail(null)
    const res = await api.getNode(nodeKey)
    if (res.ok) setActiveNodeDetail(res.node)
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/rewards') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Rewards
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.skillTreeBackground} alt="SmokeCraft Skill Tree" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>SmokeCraft Skill Tree</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 6px' }}>
          Build knowledge, earn mastery, create excellence. Every node below reflects your real progress
          — nothing is marked complete until the backend confirms it.
        </p>

        {isOffline && <div role="status" style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>Offline — showing your last loaded state.</div>}

        {status === 'loading' && (
          <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center', marginBottom: 20 }}>
            <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin-st 0.9s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading your Skill Tree…</p>
            <style>{'@keyframes sc-spin-st { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {(status === 'error' || status === 'offline') && (
          <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center', marginBottom: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
              {status === 'offline' ? "You're offline — can't load your Skill Tree right now." : 'Something went wrong loading your Skill Tree.'}
            </p>
            <button type="button" onClick={load} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && nodes.length === 0 && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 20 }}>
            No Skill Tree nodes are configured yet.
          </div>
        )}

        {status === 'ready' && nodes.length > 0 && (
          <>
            {summary && (
              <div style={{ fontSize: 11, color: GOLD, marginBottom: 12 }}>
                {summary.completedNodes} / {summary.totalNodes} nodes completed ({summary.completionPercent}%)
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
              {nodes.map(node => {
                const color = STATE_COLOR[node.state]
                // Every node — including locked ones — opens a real detail
                // view explaining its state (a locked node must explain
                // what's missing, not act as a dead control).
                return (
                  <button key={node.nodeKey} type="button"
                    onClick={() => openNode(node.nodeKey)}
                    aria-pressed={activeNodeKey === node.nodeKey}
                    aria-label={`${node.title} — ${STATE_LABEL[node.state]}`}
                    style={{
                      textAlign: 'left', minHeight: 72, padding: 14, borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit', color: CREAM,
                      background: activeNodeKey === node.nodeKey ? 'rgba(233,193,118,0.14)' : GLASS,
                      border: `1.5px solid ${activeNodeKey === node.nodeKey ? GOLD : color}`,
                      opacity: node.state === 'locked' ? 0.7 : 1,
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{node.title}</div>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color }}>{STATE_LABEL[node.state]}</div>
                  </button>
                )
              })}
            </div>

            {activeNodeKey && activeNodeDetail && (
              <div role="region" aria-live="polite" style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 4 }}>{activeNodeDetail.title}</div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: STATE_COLOR[activeNodeDetail.state], marginBottom: 10 }}>{STATE_LABEL[activeNodeDetail.state]}</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{activeNodeDetail.description}</p>
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', margin: '0 0 10px' }}>{activeNodeDetail.reason}</p>
                {activeNodeDetail.goldenBoxRelevance && (
                  <p style={{ fontSize: 12, color: 'rgba(233,193,118,0.75)', margin: '0 0 10px' }}>
                    Golden Box relevance: {activeNodeDetail.goldenBoxRelevance}
                  </p>
                )}
                {activeNodeDetail.completedAt && (
                  <p style={{ fontSize: 11, color: 'rgba(127,208,163,0.85)', margin: 0 }}>
                    Completed {new Date(activeNodeDetail.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <DynamicMentorPanel guidance="Every category above traces back to a real lesson — start with Foundation if you're new." />
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
