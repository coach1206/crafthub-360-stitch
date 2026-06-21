/**
 * TouchCard — product/ticket card. Whole card is the tap target, supports a
 * selected-state ring/glow and a one-shot success-pulse animation.
 */
import { useEffect, useState } from 'react'
import { PANEL, LINE, GOLD } from '../eat/ui.jsx'
import { successTap } from '../../services/shared/haptics.js'

export default function TouchCard({ children, onClick, selected = false, pulse = false, style }) {
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    if (!pulse) return
    setPulsing(true)
    try { successTap() } catch {}
    const t = setTimeout(() => setPulsing(false), 360)
    return () => clearTimeout(t)
  }, [pulse])

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={{
        background: PANEL,
        border: selected ? `2px solid ${GOLD}` : `1px solid ${LINE}`,
        boxShadow: selected ? '0 0 0 4px rgba(212,168,67,0.18)' : pulsing ? '0 0 0 6px rgba(80,200,120,0.35)' : 'none',
        borderRadius: 16,
        padding: 12,
        minHeight: 48,
        cursor: onClick ? 'pointer' : 'default',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'box-shadow 0.25s ease, border-color 0.2s ease, transform 0.08s ease',
        ...style,
      }}
      onPointerDown={(e) => { if (onClick) e.currentTarget.style.transform = 'scale(0.97)' }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </div>
  )
}
