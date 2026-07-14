import { useRef, useState, useEffect } from 'react'

/**
 * Renders an approved NOVEE OS image with object-fit:contain inside a fixed
 * full-viewport container. Exposes the rendered image rectangle as a
 * positioned overlay so children can place hotspots at percentage coordinates
 * relative to the natural image dimensions.
 *
 * No nav-bar offset — used only on the root route which has no bottom nav.
 */
export default function NoveeImageBoundsOverlay({ src, naturalW, naturalH, alt, children }) {
  const containerRef = useRef(null)
  const [bounds, setBounds] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function compute() {
      const containerW = el.clientWidth
      const containerH = el.clientHeight
      const scale = Math.min(containerW / naturalW, containerH / naturalH)
      const renderedW = naturalW * scale
      const renderedH = naturalH * scale
      const offsetX = (containerW - renderedW) / 2
      const offsetY = (containerH - renderedH) / 2
      setBounds({ renderedW, renderedH, offsetX, offsetY })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [naturalW, naturalH])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: '#050505',
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          position: 'absolute',
          left: bounds ? bounds.offsetX : 0,
          top: bounds ? bounds.offsetY : 0,
          width: bounds ? bounds.renderedW : '100%',
          height: bounds ? bounds.renderedH : 'auto',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      {bounds && (
        <div
          style={{
            position: 'absolute',
            left: bounds.offsetX,
            top: bounds.offsetY,
            width: bounds.renderedW,
            height: bounds.renderedH,
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
