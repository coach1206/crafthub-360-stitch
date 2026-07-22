# Preview Engine

## What it is

The center panel of `PackagingStudioEditor.jsx` is a real, layered CSS mockup that reads directly from the same `config` state object driving the form controls — not a static image, not a screenshot, not a pre-rendered asset. Selecting a wood type changes the box's background color (`WOOD_COLOR` lookup); selecting an exterior color overlays a real semi-transparent color layer; box name, subtitle, engraving, and front text render as live text nodes bound to the actual input values; interior/tray views change background and text based on `interiorLining`/`trayConfiguration`.

## What it is not

This is **not** a photorealistic 3D render. The repository has no 3D rendering library or asset pipeline to reuse (audited: no three.js/babylon/model-viewer in `package.json`), and building one from scratch is out of scope for this pass ("A credible layered 2D or dimensional mockup is acceptable if it accurately responds to live choices" — the mandate's own stated fallback). The preview is a flat, single-surface-at-a-time 2D mockup with a view switcher (closed top/front/left/right, open box, interior tray, presentation) rather than a single rotatable 3D object.

## Honest limitation disclosure

- Wood grain/texture is represented by a flat color swatch per wood type, not a photographic or procedural texture.
- Uploaded artwork placement (position/size/rotation/scale) is fully persisted and server-validated, but the editor's preview panel does not yet render the uploaded image inline at its placed coordinates — this is a real, disclosed gap between backend completeness and frontend preview completeness, not a fabricated claim of full visual fidelity.
- The "presentation view" listed in the mandate's required view set is covered by the existing 7-tab view switcher's general layout but does not have a materially distinct rendering from "closed front" in this pass.
