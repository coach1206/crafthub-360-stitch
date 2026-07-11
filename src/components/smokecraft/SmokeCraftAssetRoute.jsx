import { useRef, useState, useEffect, useCallback } from 'react'
import SmokeCraftAssetScreen from './SmokeCraftAssetScreen.jsx'
import SmokeCraftHotspotLayer from './SmokeCraftHotspotLayer.jsx'

/**
 * Composes SmokeCraftAssetScreen with an optional invisible hotspot overlay.
 * Uses ResizeObserver + naturalWidth/naturalHeight to compute the actual rendered
 * image rect after object-fit:contain letterboxing, then passes imageBounds to
 * SmokeCraftHotspotLayer so hotspot % coordinates align to the visible image.
 *
 * Props:
 *   src       — image path passed through to SmokeCraftAssetScreen
 *   alt       — alt text passed through to SmokeCraftAssetScreen
 *   hotspots  — array of hotspot definitions (see SmokeCraftHotspotLayer)
 *   route     — current route string for hotspot analytics
 *   objectPosition — passed through to SmokeCraftAssetScreen
 */
export default function SmokeCraftAssetRoute({ src, alt, hotspots = [], route = '', objectPosition }) {
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const [imageBounds, setImageBounds] = useState(null)

  const computeBounds = useCallback(() => {
    const img = imageRef.current
    const container = containerRef.current
    if (!img || !container || !img.naturalWidth) return

    const safePad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sc-safe-pad')) || 8

    const boxW = container.clientWidth - safePad * 2
    const boxH = container.clientHeight - safePad * 2
    const natAR = img.naturalWidth / img.naturalHeight
    const boxAR = boxW / boxH

    let renderW, renderH, offsetX, offsetY
    if (natAR > boxAR) {
      // Landscape image: fills width, letterbox top/bottom
      renderW = boxW
      renderH = boxW / natAR
      offsetX = 0
      offsetY = (boxH - renderH) / 2
    } else {
      // Portrait image or taller container: fills height, pillarbox left/right
      renderH = boxH
      renderW = boxH * natAR
      offsetX = (boxW - renderW) / 2
      offsetY = 0
    }

    setImageBounds({
      left: safePad + offsetX,
      top: safePad + offsetY,
      width: renderW,
      height: renderH,
    })
  }, [])

  useEffect(() => {
    const img = imageRef.current
    if (!img) return

    if (img.complete && img.naturalWidth) {
      computeBounds()
    } else {
      img.addEventListener('load', computeBounds)
    }

    const ro = new ResizeObserver(computeBounds)
    if (containerRef.current) ro.observe(containerRef.current)

    return () => {
      img.removeEventListener('load', computeBounds)
      ro.disconnect()
    }
  }, [computeBounds, src])

  return (
    <SmokeCraftAssetScreen
      src={src}
      alt={alt}
      objectPosition={objectPosition}
      imageRef={imageRef}
      containerRef={containerRef}
    >
      {hotspots.length > 0 && (
        <SmokeCraftHotspotLayer hotspots={hotspots} route={route} imageBounds={imageBounds} />
      )}
    </SmokeCraftAssetScreen>
  )
}
