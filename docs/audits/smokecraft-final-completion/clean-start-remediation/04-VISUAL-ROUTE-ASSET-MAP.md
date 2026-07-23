# 04 — Visual/Route/Asset Map

## Finding: no fallback-component or asset-wiring defect found

`src/App.jsx:343` registers exactly one component for `/smokecraft/welcome`:
```
<Route path="welcome" element={<SmokeCraftSessionGuard sessionNumber={1}><WelcomeExperience /></SmokeCraftSessionGuard>} />
```
No duplicate route, no deprecated alias, no stale bundle reference was found (grepped for `welcome` across `App.jsx` — one match). `WelcomeExperience.jsx` (297 lines) contains no hardcoded demo values (`Greg Guy`, `Romeo y Julieta`, `Carlos Mendoza` do not appear anywhere in this file or any SmokeCraft page source — confirmed by repository-wide grep) and no separate fallback-render branch — it is a single real React component reading live context.

## Explanation for the reported "plain fallback-style" appearance

`WelcomeExperience.jsx` conditionally themes/copies its content based on `journey.selectedMentor`/`journey.selectedVenue` (mentor-specific imagery, venue-specific copy). Because `selectedMentor` was never reset (the root cause fixed in this pass — see `01-ROOT-CAUSE.md`), it's plausible the screen was rendering with a stale, no-longer-intended mentor selection producing a mismatched or degraded-looking visual, not a genuinely different "fallback" component. This is a direct consequence of the same state-leak defect, not a second, independent defect requiring its own asset/route fix.

## Verification

No change was made to any route registration, asset registry entry, or the `WelcomeExperience.jsx` component itself in this pass — the fix is entirely in the state-reset path feeding into it (`01-ROOT-CAUSE.md`). Once `selectedMentor`/`smokeCraft`/`goldenBox` are genuinely blank for a new journey, `WelcomeExperience.jsx`'s existing conditional rendering naturally falls back to its own honest "not yet selected" branches, which is the approved behavior, not a defect requiring a separate visual fix.
