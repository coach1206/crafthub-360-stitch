# Responsive and Touch Spec

## Supported viewports (verified this pass via real Playwright captures)

| Name | Width×Height | Touch |
|---|---|---|
| desktop | 1440×900 | no |
| laptop | 1180×820 | no |
| tablet-landscape | 1024×768 | yes |
| tablet-portrait | 768×1024 | yes |
| kiosk | 1920×1080 | no |

## Hard rules

- 44×44 CSS px minimum touch target on every interactive element, all viewports.
- No horizontal overflow (`scrollWidth` must not exceed `innerWidth`) at any supported viewport.
- The bottom nav bar (`SmokeCraftNavBar`, Continue/Back) must never cover screen content — screens using it reserve bottom padding (~110px) for this.
- No console errors, no HTTP failures during a real page load at any viewport (verified by `scripts/captureSmokecraftViewportTouchProof.mjs`, currently 55/55).

## Known exception — do not "fix" without a dedicated pass

Image-shell screens (screens built on `SmokeCraftImageBoundsOverlay` — most of the entry layer and supporting-module screens, e.g. Golden Box Rules) use a fixed-aspect-ratio "contain" fit so percentage-positioned hotspots stay aligned to the underlying approved artwork. On viewports whose aspect ratio diverges significantly from the source image (notably tablet-portrait, 768×1024 against typically-landscape ~1.7:1 source art), this produces large top/bottom letterbox bars. This is a **shared-component, cross-screen characteristic**, not a single-screen bug — changing the fit algorithm without also re-deriving every affected screen's hotspot percentage coordinates would misalign real controls on ~20 other screens. Documented as a known defect in `CURRENT_VISUAL_DEFECTS.md`; recommended as its own dedicated "image-shell portrait behavior" engineering pass, not a UI-only fix.
