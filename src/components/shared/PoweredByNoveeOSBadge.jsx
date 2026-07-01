/**
 * Global "Powered by NOVEE OS" brand badge. Used across POS3, E.A.T.,
 * Venue Command Hub, and Integrations screens per the NOVEE OS branding
 * rollout. Respects reduced-motion (no glow pulse) automatically via the
 * `animated` prop, which callers should wire to a reducedMotion setting
 * once a global accessibility store exists — defaults to on.
 */
const VARIANT_STYLE = {
  header:  { fontSize: 11, padding: '5px 10px' },
  footer:  { fontSize: 10, padding: '6px 12px' },
  sidebar: { fontSize: 10, padding: '6px 10px', width: '100%', justifyContent: 'center' },
  card:    { fontSize: 11, padding: '8px 14px' },
}

export default function PoweredByNoveeOSBadge({ variant = 'footer', compact = false, showSubtitle = false, animated = true, style }) {
  const v = VARIANT_STYLE[variant] || VARIANT_STYLE.footer
  return (
    <div
      style={{
        display: 'inline-flex', flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? 6 : 1, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(201,149,44,0.28)', borderRadius: 999, color: '#13294b',
        boxShadow: '0 1px 4px rgba(19,41,75,0.08)', ...v, ...style,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, letterSpacing: '0.02em' }}>
        <span
          aria-hidden
          style={{
            width: 7, height: 7, borderRadius: '50%', background: '#c9952c', flexShrink: 0,
            boxShadow: animated ? '0 0 0 0 rgba(201,149,44,0.6)' : 'none',
            animation: animated ? 'noveeBadgePulse 2.6s ease-in-out infinite' : 'none',
          }}
        />
        Powered by NOVEE OS
      </span>
      {showSubtitle && !compact && (
        <span style={{ fontSize: 9, color: '#6b7385', fontWeight: 600 }}>Intelligent. Secure. Seamless.</span>
      )}
      <style>{`@keyframes noveeBadgePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,149,44,0.5); } 50% { box-shadow: 0 0 0 4px rgba(201,149,44,0.12); } }`}</style>
    </div>
  )
}
