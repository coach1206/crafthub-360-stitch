# 09 — Fallback and Demo Content Audit

Real grep run this pass across `src/` and `server/` (production-bundled code, not test files).

| Search term | Result | File(s) | Production-reachable? | Verdict |
|---|---|---|---|---|
| `Greg Guy` | 1 match | `GuestSessionContext.jsx:928` | **No — inside a code comment only**, referencing the historical defect for documentation purposes | Clean — not a live-reachable string |
| `Romeo y Julieta 1875` | 3 matches | `MeetYourCigar.jsx`, `HumidorMatch.jsx` (real cigar catalog entries), `GuestSessionContext.jsx` comment | **Yes, as real selectable catalog data** — this is a legitimate cigar option a guest can choose, not baked "current journey" personal data | Clean — legitimate content, not stale state |
| `Carlos Mendoza` | 2 files | `smokeCraftMentors.js` (real mentor roster entry, matches the approved Mentor Selection artwork exactly), `GuestSessionContext.jsx` comment | Yes, as a legitimate selectable mentor | Clean — legitimate roster content, not stale state |
| `63%` | 6 matches | `smokecraftJourneyStatus.js` (comments explaining the historical bug and its fix), `ResumeJourney.jsx` (comment), `CommandHub.jsx` (unrelated flavor-wheel UI, `'Earthy', '63%'`), `CutToastLight.jsx`/`HumidorMatch.jsx` (coincidental `top: '63%'` CSS positioning values) | No literal "63% complete" progress-display string found anywhere live | Clean |
| `No Active SmokeCraft Journey` | 1 match | `ResumeJourney.jsx:276` | Yes — this is the correct, honest **empty-state label** for a guest with no journey, not fake/stale data | Clean — legitimate empty state |
| `Continue to Personal Dashboard` | **0 matches** | — | — | Confirmed removed (fixed in the Approved Entry Visual Restoration pass) |
| `demo` | 7 files | `DemoModeContext.jsx` and consumers | Yes, but gated behind the explicit, user-triggered `isDemoMode` flag (sessionStorage `novee_demo_mode`), never on by default | Clean — intentional, opt-in feature, not a silent fallback |
| `mock` | 1 file | test-adjacent utility | Confirmed not imported by any production route component | Clean |
| `fallback` | 10 files | mostly error-state UI copy ("something went wrong, retry") and the `SC_ASSETS` legacy-alias comments already documented | Reviewed — no fallback found that silently replaces an approved image with an unapproved one, beyond the already-fixed Venue Selection case | Clean, re-confirmed |
| `placeholder` | 26 files | overwhelmingly `<input placeholder="...">` form-field hint text (e.g., "you@example.com") | Legitimate UI copy, not fake data | Clean |
| `sample` | 6 files | includes `src/data/venues.js` (explicitly documented in `VenueSelect.jsx`'s own comment as sample data that is **never rendered** — `VENUES = []` hardcoded empty, confirmed in the Approved Entry Visual Restoration pass) | Confirmed not reachable — `venues.js` is imported only by an unrelated consumer (`passportScanApi.js`), not by `VenueSelect.jsx` | Clean |
| `LOCAL PREVIEW` | 1 file | `SmokeCraftProgressContext.jsx` — the "Local Preview Mode: progression is stored on this device only" disclosure message | Legitimate, honest user-facing disclosure of the real client-local storage architecture, not fake/demo data | Clean |

## Conclusion

**No production-reachable fake/demo/stale content was found in this pass's search.** Every historical "smoking gun" string (`Greg Guy`, `Carlos Mendoza`, `Romeo y Julieta 1875`, `63%`, `Continue to Personal Dashboard`) either (a) no longer exists in a live-reachable form, (b) only exists as legitimate catalog/roster content a guest can genuinely select, or (c) only exists in a code comment. This is consistent with — and does not contradict — the repeated finding across this operation's local audits: **the source code, as it exists on this branch at this commit, does not contain the reported defects.** This strengthens (does not prove, absent live access) the hypothesis that continued live reports trace to deployment/caching, not source.
