# SmokeCraft Image Integration — Proof Screenshot Index

`public/proof/smokecraft-image-integration/`

| File | Route | Viewport | State | Data source | Result |
|---|---|---|---|---|---|
| 01-golden-box-hub-hero.png | /smokecraft/golden-box | 1280x900 | Golden Box hub with existing production hero art (protected, unchanged) | Live server | PASS |
| 02-judge-dashboard-media-slot.png | /smokecraft/golden-box/judge | 1280x900 | New `goldenBoxJudgingCriteria` header image live via `MediaSlot` | Live server | PASS |
| 03-golden-box-hub-handheld.png | /smokecraft/golden-box | 390x844 | Handheld viewport, no overflow | Live server | PASS |

Additional Package 7A screens carrying the new imagery (Judge Entry Review, Mentor Review, Results
Experience, EntryWorkspace presentation step) were exercised end-to-end by the re-run
`verify-golden-box-package-7a.mjs` suite (33/33 passed) in the same session as these screenshots — the
same live data, same server, same browser engine — rather than re-captured separately, since that suite
already asserts the screens render correctly with real data.
