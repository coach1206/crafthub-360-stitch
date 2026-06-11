import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const G = '#C9A84C', GL = '#E8D5A3'
const BORDER = 'rgba(201,168,76,0.22)'

const hapTap = () => navigator.vibrate?.(25)

export default function TicketTicker({ craft = 'all', muted = false, items: propItems }) {
  const navigate    = useNavigate()
  const trackRef    = useRef(null)
  const animRef     = useRef(null)
  const pausedRef   = useRef(false)
  const posRef      = useRef(0)
  const [items, setItems] = useState([])
  const [detail, setDetail] = useState(null)
  const [error, setError]   = useState(false)

  useEffect(() => {
    if (propItems) {
      setItems([...propItems, ...propItems])
      return
    }
    const params = new URLSearchParams({ limit: 30 })
    if (craft !== 'all') params.set('craft', craft)
    fetch(`/api/ticker?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error('API error')
        const feed = json.data?.items || []
        setItems([...feed, ...feed])
        setError(false)
      })
      .catch(() => setError(true))
  }, [craft, propItems])

  useEffect(() => {
    if (!items.length || !trackRef.current) return
    const speed = 0.6
    const halfW = trackRef.current.scrollWidth / 2

    function step() {
      if (!pausedRef.current && trackRef.current) {
        posRef.current += speed
        if (posRef.current >= halfW) posRef.current = 0
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [items])

  function handleItemTap(item) {
    hapTap()
    try { navigate(item.route) } catch { setDetail(item) }
  }

  const pause  = () => { pausedRef.current = true }
  const resume = () => { pausedRef.current = false }

  if (error || !items.length) return null

  return (
    <>
      <div style={{
        position: 'relative', minHeight: 58, overflow: 'hidden',
        background: 'rgba(10,8,5,0.92)', backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        cursor: 'pointer', userSelect: 'none', display: 'grid',
        gridTemplateColumns: 'minmax(168px, 230px) 1fr',
      }}
        onMouseEnter={pause} onMouseLeave={resume}
        onTouchStart={pause} onTouchEnd={resume}
      >
        {/* glow strip */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,rgba(10,8,5,0.95) 0%,transparent 4%,transparent 96%,rgba(10,8,5,0.95) 100%)`, zIndex: 2, pointerEvents: 'none' }} />

        <div style={{
          position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '8px 14px 8px clamp(14px, 4vw, 28px)',
          borderRight: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.25)',
        }}>
          <span style={{
            color: G, fontSize: 10, lineHeight: 1.1, fontWeight: 900,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            Live Venue Ticker
          </span>
          <span style={{
            color: 'rgba(232,213,163,0.72)', fontSize: 10, lineHeight: 1.35,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4,
          }}>
            Live from E.A.T. Command Center
          </span>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden', minWidth: 0 }}>
        <div ref={trackRef} style={{ display: 'flex', alignItems: 'center', minHeight: 58, willChange: 'transform', gap: 0 }}>
          {items.map((item, i) => (
            <button key={`${item.id}-${i}`}
              onClick={() => handleItemTap(item)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
                padding: '0 20px', minHeight: 58, background: 'none', border: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: item.sourceColor || G,
                border: `1px solid ${(item.sourceColor || G)}55`,
                background: `${(item.sourceColor || G)}14`,
                padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              }}>{item.source}</span>
              <span style={{ color: GL, fontSize: 12, fontWeight: 500 }}>{item.title}</span>
              <span style={{ color: 'rgba(200,184,154,0.6)', fontSize: 12 }}>·</span>
              <span style={{ color: 'rgba(200,184,154,0.75)', fontSize: 12 }}>{item.message}</span>
              <span style={{ color: 'rgba(201,168,76,0.25)', fontSize: 14, marginLeft: 8 }}>◆</span>
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* detail fallback modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setDetail(null)}>
          <div style={{ background: '#181410', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, maxWidth: 340, width: '90%' }}>
            <div style={{ color: detail.sourceColor || G, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>{detail.source}</div>
            <div style={{ color: GL, fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{detail.title}</div>
            <div style={{ color: 'rgba(200,184,154,0.8)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{detail.message}</div>
            {detail.ctaLabel && (
              <button onClick={() => { hapTap(); navigate(detail.route); setDetail(null) }}
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${G}55`, background: `${G}22`, color: G, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                {detail.ctaLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
