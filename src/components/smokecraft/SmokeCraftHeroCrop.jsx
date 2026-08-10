import { useState } from 'react'
import { resolveSmokeCraftAsset } from '../../services/smokecraft/assetResolver.js'
import { GOLD_DIM, BORDER } from '../../constants/smokecraftLiveScreenTokens.js'

/**
 * SmokeCraftHeroCrop — Block 6, Part C.
 *
 * Restores approved SmokeCraft imagery as PURELY DECORATIVE supporting
 * visual content, never as the functional interface. Every one of the 14
 * approved assets this renders is a Category B "baked UI mockup" (full
 * composition with its own baked text/buttons/data fields) — this
 * component never displays the full composition. It uses a fixed-height,
 * overflow-hidden CSS "window" with an oversized, positioned background
 * image to show ONLY the clean top photographic band of each composition
 * (the same practical crop-without-a-file-edit technique already
 * established and approved for HumidorMatch.jsx's `humidorMatchHero`),
 * with a heavy gradient scrim on top so no residual baked text is
 * mistaken for live UI. Every real control on the screen remains ordinary
 * DOM below/around this element — nothing is ever drawn on top of the
 * image as a hotspot.
 *
 * Decorative only: role="img" + a real aria-label describing the scene
 * (not the baked screen mockup), the <img> itself is aria-hidden so
 * screen readers get one clean description instead of duplicated/baked
 * label noise.
 */
export default function SmokeCraftHeroCrop({
  assetKey,
  label,
  bgPosition = '78% 0%',
  bgSize = '260%',
  height = 'clamp(84px, 13vw, 150px)',
}) {
  const [errored, setErrored] = useState(false)
  const resolved = resolveSmokeCraftAsset(assetKey)
  const src = resolved.ok ? resolved.url : null

  if (!src || errored) return null // decorative-only — absence never blocks gameplay

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: '100%', height, borderRadius: 14, marginBottom: 16,
        overflow: 'hidden', position: 'relative', border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
        backgroundImage: `url(${src})`,
        backgroundSize: bgSize,
        backgroundPosition: bgPosition,
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Load-error detector — an invisible real <img> so onError still fires
          and the whole element can be suppressed if the asset 404s. */}
      <img
        src={src} alt="" aria-hidden="true" loading="lazy" onError={() => setErrored(true)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,8,12,0.05) 0%, rgba(6,8,12,0.55) 70%, rgba(6,8,12,0.85) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: GOLD_DIM, opacity: 0.7 }} aria-hidden="true">
        SmokeCraft 360
      </div>
    </div>
  )
}
