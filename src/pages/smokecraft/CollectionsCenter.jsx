import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import * as api from '../../services/smokecraft/collectionsApiClient.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

export default function CollectionsCenter() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error | offline
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [activeKey, setActiveKey] = useState(null)
  const [activeDetail, setActiveDetail] = useState(null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function load() {
    setStatus('loading')
    const res = await api.getCollections()
    if (!res.ok) { setStatus(res.error === 'offline' ? 'offline' : 'error'); return }
    setItems(res.items); setSummary(res.summary); setStatus('ready')
  }

  useEffect(() => { load() }, [])

  async function openItem(itemKey) {
    triggerHaptic('light')
    setActiveKey(itemKey)
    setActiveDetail(null)
    const res = await api.getItem(itemKey)
    if (res.ok) setActiveDetail(res.item)
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
          <img src={SC_ASSETS.collectionsCenterBackground} alt="Collections Center" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>Collections Center</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 6px' }}>
          Explore, earn, collect, and showcase your journey. Every item below reflects real backend
          evidence — nothing is unlocked until you actually earn it.
        </p>

        {isOffline && <div role="status" style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>Offline — showing your last loaded state.</div>}

        {status === 'loading' && (
          <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center', marginBottom: 20 }}>
            <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin-cc 0.9s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading your collection…</p>
            <style>{'@keyframes sc-spin-cc { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {(status === 'error' || status === 'offline') && (
          <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center', marginBottom: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
              {status === 'offline' ? "You're offline — can't load your collection right now." : 'Something went wrong loading your collection.'}
            </p>
            <button type="button" onClick={load} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 20 }}>
            No collection items are configured yet.
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            {summary && (
              <div style={{ fontSize: 11, color: GOLD, marginBottom: 12 }}>
                {summary.ownedItems} / {summary.totalActiveItems} items owned ({summary.completionPercent}%)
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
              {items.map(it => {
                const owned = it.state === 'earned'
                return (
                  <button key={it.itemKey} type="button"
                    onClick={() => openItem(it.itemKey)}
                    aria-pressed={activeKey === it.itemKey}
                    aria-label={`${it.title} — ${owned ? 'Earned' : 'Locked'}`}
                    style={{
                      textAlign: 'left', minHeight: 80, padding: 14, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: CREAM,
                      background: activeKey === it.itemKey ? 'rgba(233,193,118,0.14)' : GLASS,
                      border: `1.5px solid ${activeKey === it.itemKey ? GOLD : (owned ? 'rgba(127,208,163,0.5)' : BORDER)}`,
                      opacity: owned ? 1 : 0.65,
                    }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)', marginBottom: 4 }}>{it.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{it.title}</div>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: owned ? '#7fd0a3' : 'rgba(229,226,225,0.4)' }}>{owned ? 'Earned' : 'Locked'}</div>
                  </button>
                )
              })}
            </div>

            {summary && summary.categories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {summary.categories.map(c => (
                  <div key={c.category} style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '4px 10px' }}>
                    {c.category}: {c.owned}/{c.total}
                  </div>
                ))}
              </div>
            )}

            {activeKey && activeDetail && (
              <div role="region" aria-live="polite" style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 4 }}>{activeDetail.title}</div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: activeDetail.state === 'earned' ? '#7fd0a3' : 'rgba(229,226,225,0.4)', marginBottom: 10 }}>
                  {activeDetail.state === 'earned' ? 'Earned' : 'Locked'}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{activeDetail.description}</p>
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', margin: '0 0 10px' }}>How to earn: {activeDetail.earnCondition}</p>
                {activeDetail.goldenBoxRelevance && (
                  <p style={{ fontSize: 12, color: 'rgba(233,193,118,0.75)', margin: '0 0 10px' }}>Golden Box relevance: {activeDetail.goldenBoxRelevance}</p>
                )}
                {activeDetail.state === 'earned' && activeDetail.earnedAt && (
                  <p style={{ fontSize: 11, color: 'rgba(127,208,163,0.85)', margin: 0 }}>
                    Earned {new Date(activeDetail.earnedAt).toLocaleString()}{activeDetail.evidence ? ` — ${activeDetail.evidence}` : ''}
                  </p>
                )}
                {activeDetail.state === 'locked' && activeDetail.reason && (
                  <p style={{ fontSize: 11, color: 'rgba(229,170,100,0.85)', margin: 0 }}>{activeDetail.reason}</p>
                )}
              </div>
            )}
          </>
        )}

        <DynamicMentorPanel guidance="Complete lessons and challenges to start unlocking collectible items in each category." />
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
