/**
 * SmokeCraft 360 — shared visual tokens for `mode="live"` (pure real-DOM,
 * no baked-composite) canonical screens.
 *
 * ROOT-CAUSE CONTEXT (solution-first engineering pass): SmokeCraft's 43
 * canonical screens are built on two coexisting, both-legitimate screen
 * generations:
 *
 *   (A) ~16 screens on `SmokeCraftImageBoundsOverlay` / `SmokeCraftAssetScreen`
 *       / `SmokeCraftScreenShell mode="image-shell"` — real DOM controls
 *       layered as percentage-positioned hotspots over one approved,
 *       professionally-composed reference image (Format, Cut/Toast/Light,
 *       First/Second/Final Third, Scorecard, Pairing Recommendations,
 *       Passport Stamp, Connections, Identity, Seed & Soil, Request/
 *       Purchase, Rewards, and others). These are visually rich because
 *       the approved artwork itself carries the composition — this is
 *       correct, working, and must NOT be rewritten or discarded.
 *
 *   (B) The remaining screens on `SmokeCraftScreenShell mode="live"` —
 *       pure hand-authored real DOM with no baked composite, several of
 *       which were rebuilt THIS session to fix real defects (baked-fake-
 *       UI, blank panels, wrong images). These necessarily look sparser
 *       than generation (A) unless deliberately composed with the same
 *       visual weight — there is no reference-image density to lean on.
 *
 * The owner's "inconsistent screens" finding is explained by a content-
 * density gap between these two generations, not by 43 unrelated
 * architectures. Rewriting generation (A) into a new shared shell would
 * mean discarding approved, working, already-dense artwork for no visual
 * gain — pure regression risk. The correct, lowest-risk fix is to bring
 * generation (B)'s screens up to the same premium density using a SHARED
 * token set (this file) instead of each screen locally re-declaring its
 * own slightly different GOLD/BORDER/spacing constants — which is the
 * actual mechanism enforced here.
 */

export const GOLD      = '#E9C176'
export const GOLD_DIM  = 'rgba(233,193,118,0.55)'
export const CREAM     = '#e5e2e1'
export const BORDER    = 'rgba(233,193,118,0.22)'
export const GLASS     = 'rgba(233,193,118,0.06)'
export const NAVY_DEEP = '#060810'
export const CARD_BG   = '#0b0f18'

export const CONTENT_MAX_WIDTH = 1000
export const SECTION_GAP = 18
export const CARD_RADIUS = 12
export const CARD_PADDING = 'clamp(14px,2vw,20px)'
export const PAGE_PADDING = 'clamp(16px,3vw,32px)'

export const heroBannerStyle = {
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  padding: 'clamp(20px,3.4vw,32px)',
  background: 'radial-gradient(120% 140% at 15% 20%, rgba(233,193,118,0.14), rgba(6,8,12,0.4) 60%), linear-gradient(135deg, rgba(233,193,118,0.06), rgba(11,15,24,0.9))',
  display: 'flex',
  alignItems: 'center',
  gap: 18,
}

export const cardStyle = {
  background: GLASS,
  border: `1px solid ${BORDER}`,
  borderRadius: CARD_RADIUS,
  padding: CARD_PADDING,
}

export const eyebrowStyle = {
  fontSize: 11, fontWeight: 700, color: GOLD_DIM,
  letterSpacing: '0.12em', textTransform: 'uppercase',
}

export const sectionLabelStyle = {
  fontSize: 11, fontWeight: 700, color: GOLD,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
}

export const pageShellStyle = {
  maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto', padding: PAGE_PADDING,
  display: 'flex', flexDirection: 'column', gap: SECTION_GAP, fontFamily: 'Georgia, serif',
}
