import { useState, useEffect } from 'react'

/**
 * useSmokeCraftImageBounds
 * Calculates the rendered rectangle of a CSS `object-fit: cover` image
 * within the current viewport. Returns null until the image has loaded.
 *
 * @param {string|null} src - Image URL
 * @returns {{
 *   naturalW: number, naturalH: number,
 *   renderedW: number, renderedH: number,
 *   offsetX: number, offsetY: number,
 *   scale: number, vw: number, vh: number
 * }|null}
 */
export function useSmokeCraftImageBounds(src) {
  const [bounds, setBounds] = useState(null)

  useEffect(() => {
    if (!src) return

    let cancelled = false

    function compute(naturalW, naturalH) {
      if (cancelled) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scaleW = vw / naturalW
      const scaleH = vh / naturalH
      const scale = Math.max(scaleW, scaleH)
      const renderedW = naturalW * scale
      const renderedH = naturalH * scale
      const offsetX = (vw - renderedW) / 2
      const offsetY = (vh - renderedH) / 2
      setBounds({ naturalW, naturalH, renderedW, renderedH, offsetX, offsetY, scale, vw, vh })
    }

    const img = new Image()
    img.onload = () => compute(img.naturalWidth, img.naturalHeight)
    img.src = src

    function handleResize() {
      if (img.complete && img.naturalWidth > 0) {
        compute(img.naturalWidth, img.naturalHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
    }
  }, [src])

  return bounds
}
