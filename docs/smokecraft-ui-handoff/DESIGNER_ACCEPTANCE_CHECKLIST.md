# Designer Acceptance Checklist

Before calling a screen "done," verify:

- [ ] Every control is real DOM (button/input/select), not baked into an image — run `node scripts/detectSmokecraftStaticGameplay.mjs`, must stay 85/85 or higher.
- [ ] Visible selected/active state equals real saved state (click it, refresh, confirm it persists; the SC-D076 defect class).
- [ ] Session/phase labels come from real data, not hardcoded text.
- [ ] Continue is disabled/blocked with a clear message when required state is missing, and never silently bypasses.
- [ ] No horizontal overflow at any of the 5 supported viewports.
- [ ] All touch targets ≥44×44 CSS px.
- [ ] Bottom nav never covers content.
- [ ] Images resolve through `resolveSmokeCraftAsset()`, never a hardcoded/external URL — run `node scripts/verifySmokecraftNoExternalImageUrls.mjs`.
- [ ] `npm run prebuild` passes clean (runs every build-blocking validator in this package).
- [ ] A real Playwright click-through (not a screenshot mockup) confirms the screen's Continue/Back actually navigate to the correct canonical next/previous screen.
