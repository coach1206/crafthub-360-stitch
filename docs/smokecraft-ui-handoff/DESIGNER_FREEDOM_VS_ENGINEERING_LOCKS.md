# Designer Freedom vs. Engineering Locks — Quick Reference

| Element | Designer freedom | Engineering-locked |
|---|---|---|
| Card layout/spacing/shadow | Full | — |
| Color tokens | Use as-is | Values locked (`VISUAL_DESIGN_SYSTEM.md`) |
| Typography scale/weight | Full within Georgia-serif-for-headings convention | Font family for headings |
| Copy/microcopy wording | Mostly free | Validation/error message text tied to test assertions in a few places (e.g. Humidor Match's guard message) — check `scripts/verifySmokecraftHumidorMatchRegression.mjs` before changing |
| Button/control DOM structure | Visual styling free | `role`, `aria-pressed`/`aria-checked`, `data-testid` attributes — locked |
| Image treatment/crop | Full within approved assets | Asset IDs, resolution order |
| Screen order | — | Fully locked (canonical journey) |
| Route paths | — | Fully locked |
| Animation/transitions | Full | Must not delay/obstruct real completion state |
| Mentor card content | Portrait/copy styling free | Mentor data model, selection persistence |
| Progress/session labels | Styling free | Values must come from `TOTAL_SESSIONS`/`TOTAL_VISITS`/session number — never baked/hardcoded text |
