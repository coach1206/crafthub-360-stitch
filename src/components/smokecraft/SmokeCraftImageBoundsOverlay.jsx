import { useRef, useState, useEffect } from 'react'

const NAV_BAR_HEIGHT = 80

/**
 * Renders an approved SmokeCraft image with object-fit:contain inside a fixed
 * container (viewport minus nav bar). Exposes the rendered image rectangle as a
 * positioned overlay so children can place hotspots at percentage coordinates
 * relative to the natural image dimensions.
 *
 * Children receive a positioned <div> whose size exactly matches the rendered
 * image, so a child at `left:'10%', top:'20%'` maps to 10% / 20% of the image.
 */
export default function SmokeCraftImageBoundsOverlay({ src, naturalW, naturalH, alt, children }) {
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
        top: 0, left: 0, right: 0,
        bottom: NAV_BAR_HEIGHT,
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
