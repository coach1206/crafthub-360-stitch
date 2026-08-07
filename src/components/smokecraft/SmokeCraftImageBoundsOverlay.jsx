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
export default function SmokeCraftImageBoundsOverlay({ src, naturalW, naturalH, alt, children, bottomOffset = NAV_BAR_HEIGHT }) {
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

  // Letterboxing fix (Full Real Browser Journey closure pass): when the
  // container's aspect ratio diverges sharply from the source image's
  // (chiefly tablet-portrait, 768x1024, against typically-landscape
  // ~1.7:1 approved art), the contain-fit `scale` above is width-bound
  // and leaves large flat-black top/bottom bars. Hotspot children are
  // positioned as percentages of `bounds` (the exact rendered image
  // rect) — so ANY change to the scale/offset math above would require
  // re-deriving every existing hotspot's percentage coordinates across
  // every image-shell screen, which is the real risk that made this
  // defect deliberately deferred in the prior pass.
  //
  // This fix does not touch that math at all. It adds a second, purely
  // decorative copy of the same image as a full-bleed, blurred,
  // cover-fit backdrop UNDER the sharp contain-fit image — the same
  // "blurred extension" treatment media players use for mismatched
  // aspect content. The letterbox bars are no longer flat black; they
  // show a soft, darkened continuation of the real photography. Zero
  // hotspot coordinates change. Zero risk of misalignment.
  const hasLetterbox = bounds && (bounds.offsetX > 4 || bounds.offsetY > 4)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        bottom: bottomOffset,
        background: '#050505',
        overflow: 'hidden',
      }}
    >
      {hasLetterbox && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'blur(28px) brightness(0.45) saturate(1.1)',
            transform: 'scale(1.15)', // hides the blur's own soft edge
            display: 'block', userSelect: 'none', pointerEvents: 'none',
          }}
        />
      )}
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
          boxShadow: hasLetterbox ? '0 0 40px 8px rgba(0,0,0,0.6)' : 'none',
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
