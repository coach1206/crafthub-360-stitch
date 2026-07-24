# 02 — Approved Asset Inventory

## Aggregate counts (real, counted this pass)

- **Total SmokeCraft-related image files on disk** (`public/assets/smokecraft/` + `public/assets/smokecraft-reference/`, `.png`/`.jpg`/`.webp`): **365 files**.
- **Registered asset keys in the single asset registry** (`src/constants/smokecraftAssets.js` → `SC_ASSETS`): **75 keys**.

## Scope decision (disclosed)

Individually re-verifying all 365 on-disk files (many are superseded drafts, rejected candidates, or batch-upload duplicates already triaged in prior passes — see `public/assets/smokecraft-reference/rejected/`, `incoming-batch-*`, and `SMOKECRAFT_CANDIDATE_CONTACT_SHEET.png`) would not change any live-visible behavior, since only the 75 registered keys are ever imported by a component. This audit traces the **registered-and-route-relevant subset** end-to-end (registered → imported by a real component → route-reachable), which is what actually determines live behavior, rather than re-cataloguing every historical draft on disk.

## Registered-and-consumed assets for the entry + 27-session spine (re-verified this pass, consistent with the two prior dedicated passes)

| Screen | Registry key | Path | Registered | Imported by a real component | Route-reachable | Approved (per prior visual-restoration audit) | Contains baked fake/demo data |
|---|---|---|---|---|---|---|---|
| Landing | `landing` | `smokecraft-reference/approved/smokecraft-landing.png` | Yes | `SmokeCraft.jsx` | Yes | Yes | No |
| Enrollment | `enroll` | `smokecraft-reference/approved/smokecraft-guest-pass.png` | Yes | `Enroll.jsx` | Yes | Yes | No |
| Identity | `identity` | `smokecraft/IDENTY.png` | Yes | `Identity.jsx` | Yes | Yes | No (blank stat placeholders, real form labels only) |
| Venue Selection | `venueSelect` | `smokecraft/Venue Selection 11.png` | Yes | `VenueSelect.jsx` (hero band only, by design) | Yes | Yes | **Yes, in the full image** — bakes fake venue cards; only the data-free hero region is ever shown (fixed in the Approved Entry Visual Restoration pass) |
| Mentor Selection | `mentorSelection` (composite) | `smokecraft/MENTOR SELECTION1.png` | Yes | Not directly — decomposed into `public/mentors/*.jpg` crops consumed by `Mentor.jsx` | Yes (via crops) | Yes (crops verified to match composite roster exactly) | No (crops are real portrait photography, not fake stat panels) |
| Welcome | — | **none registered** | No | No | N/A | N/A — disclosed gap, no approved asset exists under any name | N/A |
| Session 1–27 (curriculum) | 20 distinct keys (`humidorMatch`, `meetYourCigar`, `terroir`, `format`, `cutToastLight`, `lightingTutorial`, `firstThird`, `flavorMemory`, `pairingLab`, `secondThird`, `mentorCommentary`, `knowledgeDrop` (+4 sub-topic keys), `finalThird`, `scorecard`, `aiSummary`, `pairingRecommendations`, `passportStamp`, `finalReview`, `rewards`, `achievements`, `recommendedNextJourney`) | see `smokecraftAssets.js` | Yes, all | Yes, all (verified by grep of each page component in the prior Session-Sequence pass) | Yes, all | Yes | No |

## Whether a blank/live-data revision exists for the Venue Selection composite

No — there is only the one `Venue Selection 11.png` composite with baked fake venues; no separate "blank shell" revision was ever supplied. The correction applied (prior pass) was architectural (show only the safe hero region, never the fake card grid), not a substitute asset, since fabricating one would violate "do not create new artwork."

## Superseded/rejected assets (confirmed still present, confirmed correctly NOT registered)

`public/assets/smokecraft-reference/rejected/` and `incoming-batch-*/` directories contain historical drafts (confirmed by directory name and prior passes' documented triage) — spot-checked this pass: none of their filenames appear as `SC_ASSETS` values, confirming none of them can be live-rendered by any current component.
