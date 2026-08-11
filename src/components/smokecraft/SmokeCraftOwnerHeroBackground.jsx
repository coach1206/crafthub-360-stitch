import { useState } from 'react'
import { resolveSmokeCraftAsset } from '../../services/smokecraft/assetResolver.js'

/**
 * SmokeCraftOwnerHeroBackground — owner-rebuild visual pass, full-height
 * treatment.
 *
 * Replaces the earlier SmokeCraftHeroCrop pattern (a short, hard-edged,
 * bordered "window" showing only a thin strip of the image, with the
 * rest of the screen scrolling over the shell's flat #0b0f18 background)
 * with a real full-viewport backdrop: the owner's image is pinned behind
 * the entire screen via position:fixed, with a controlled dark gradient
 * on top for text/control readability. It never re-crops the image into
 * a strip and never gets covered by an opaque panel — every card on the
 * screen already uses a translucent GLASS background
 * (rgba(233,193,118,0.06)), so the image now genuinely continues
 * visually behind the lower sections instead of cutting off.
 *
 * Purely decorative: role="img" + aria-label describing the scene, the
 * actual <img> is aria-hidden (used only so onError can suppress this
 * layer if the asset 404s — decorative absence never blocks gameplay).
 * pointerEvents: 'none' throughout — this is never a surface any control
 * is drawn on top of as a hotspot; every real control on the screen
 * remains ordinary DOM, unaffected by this layer.
 */
export default function SmokeCraftOwnerHeroBackground({
  assetKey,
  label,
  bgPosition = 'center',
  bgSize = 'cover',
}) {
  const [errored, setErrored] = useState(false)
  const resolved = resolveSmokeCraftAsset(assetKey)
  const src = resolved.ok ? resolved.url : null

  if (!src || errored) return null // decorative-only — absence never blocks gameplay

  return (
    <>
      <div
        role="img"
        aria-label={label}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: bgSize,
          backgroundPosition: bgPosition,
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
        }}
      >
        {/* Controlled dark gradient. Several owner source photos have a
            large decorative title baked directly into the top band of the
            image (e.g. "FINAL THIRD", "SCOREBOARD", "PAIRING
            RECOMMENDATIONS"). Left at the original light top-opacity, that
            baked text showed through and duplicated the real on-screen
            title — a rule-9 violation ("do not duplicate titles or
            controls from the baked image"). The top of the gradient is
            therefore deepened enough to bury that baked text everywhere,
            while the image is still never fully opaque anywhere — it
            keeps continuing visually behind the whole screen, just as a
            genuine backdrop rather than a solid fill. */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(6,8,12,0.74) 0%, rgba(6,8,12,0.68) 14%, rgba(6,8,12,0.6) 30%, rgba(6,8,12,0.7) 55%, rgba(6,8,12,0.88) 100%)',
        }} />
      </div>
      <img
        src={src} alt="" aria-hidden="true" loading="lazy" onError={() => setErrored(true)}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
    </>
  )
}
