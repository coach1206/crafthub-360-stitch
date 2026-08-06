// SmokeCraft unified image-surface system (Phase 11).
//
// A small set of named, reusable surface presets so every screen that shows
// an approved raster asset uses the same aspect-ratio/object-fit/loading/
// error/alt-text contract instead of each page hand-rolling its own inline
// background-image math. Layout controls the image (fixed container +
// object-fit), never the other way around — the image never dictates page
// height or pushes surrounding content.
//
// This does NOT replace SmokeCraftImageBoundsOverlay (used by hotspot-driven
// full-bleed screens like Humidor Match, where the image genuinely *is* the
// interactive canvas and buttons are pixel-registered to it) or
// SmokeCraftScreenShell's `image-shell` mode (used by Welcome/Session 1 and
// other whole-screen hero shells). Those two are themselves already real,
// working image-surface implementations for their specific use cases. This
// component covers the remaining, more common case: a bounded card/tile
// showing an approved asset inside an otherwise-live-React layout (venue
// hero card, cigar/profile card, support thumbnail, educational
// illustration) — the gap this repo did not yet have a shared component for.
//
// Presets (aspect-ratio / typical use):
//   'page-hero'        16 / 9   full-width page banner
//   'venue-hero'        16 / 9   venue selection hero card
//   'session-environment' 4 / 3  in-session environment/setting image
//   'cigar-profile'      4 / 3   cigar / profile reference card
//   'support-thumbnail'   1 / 1  small supporting thumbnail
//   'educational'        4 / 3   educational illustration panel
//
// Every surface: has a fixed aspect-ratio container (never image-driven
// height), a real loading state, a real error state (never a silent blank
// image), a mandatory alt text (decorative images must pass alt="" plus
// aria-hidden explicitly, not omit it), and lazy loading by default.

import { useState } from 'react'

export const SURFACE_ASPECT_RATIOS = {
  'page-hero': '16 / 9',
  'venue-hero': '16 / 9',
  'session-environment': '4 / 3',
  'cigar-profile': '4 / 3',
  'support-thumbnail': '1 / 1',
  'educational': '4 / 3',
}

const GOLD_DIM = 'rgba(233,193,118,0.55)'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

export default function SmokeCraftImageSurface({
  surface = 'cigar-profile',
  src,
  alt,
  decorative = false,
  objectFit = 'cover',
  objectPosition = '50% 50%',
  maxWidth,
  borderRadius = 12,
  className,
  style,
  children,
}) {
  const [status, setStatus] = useState('loading')
  const aspectRatio = SURFACE_ASPECT_RATIOS[surface] || SURFACE_ASPECT_RATIOS['cigar-profile']

  if (!decorative && !alt) {
    // Fail loudly in dev rather than ship a silently-inaccessible image —
    // matches this repo's "never fabricate/never silently degrade" rule.
    // eslint-disable-next-line no-console
    console.error('SmokeCraftImageSurface: alt text is required unless decorative={true}')
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative', width: '100%', maxWidth: maxWidth || '100%',
        aspectRatio, overflow: 'hidden', borderRadius,
        background: GLASS, border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {status !== 'error' && src && (
        <img
          src={src}
          alt={decorative ? '' : alt}
          aria-hidden={decorative || undefined}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{
            width: '100%', height: '100%',
            objectFit, objectPosition, display: 'block',
            opacity: status === 'loaded' ? 1 : 0.15,
            transition: 'opacity 0.25s',
          }}
        />
      )}
      {status === 'loading' && src && (
        <div aria-live="polite" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'rgba(229,226,225,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Loading…
        </div>
      )}
      {(status === 'error' || !src) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 24, color: GOLD_DIM }} aria-hidden="true">⚠</span>
          <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>Image unavailable</span>
        </div>
      )}
      {children}
    </div>
  )
}
