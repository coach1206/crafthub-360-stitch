# SmokeCraft 360 — Image Reconciliation and Live Visual Map

**Status:** Planning/inventory document only. No image was generated, replaced, renamed, moved, cropped, deleted, or edited to produce this report. No application code, route, or persistence file was changed.
**Source of truth:** `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` (locked architecture, Package 0/A/B evidence), `docs/SMOKECRAFT_360_MASTER_AUDIT.md`.
**Repo:** coach1206/crafthub-360-stitch
**Branch:** recovery/smokecraft-codex-final
**HEAD at planning time:** `27a228924efbe72e17b06e9e77b9e1c9ea4a598e`

---

## 1. Executive Summary

SmokeCraft's image assets are heavily triplicated: the repository holds 201 production-tier image files, but only **145 are unique by byte hash** — 56 are exact duplicate copies of another file, scattered across four parallel directory trees (`smokecraft/` RAW, `smokecraft-reference/approved/` + its `batch-22/` staging subfolder, `smokecraft/cropped/`, and root-level `public/*.png`). Only 28 files are actually wired into the app via `SC_ASSETS`. A further **1,113 files live under `public/proof/`** — these are Playwright screenshot artifacts from prior verification runs, not production assets, and are excluded from every count in this document.

Of the 28 currently-routed images, every one resolves to a real file (zero broken references) and — per a full-repo code scan — **none contain code-rendered baked dynamic text** in the reviewed screen components themselves (no hardcoded guest names, scores, or fake "Connected" claims found in the `.jsx` files). The one exception worth flagging is `Blend.jsx` line 376 ("Orchestration score peaked at 94..."), a supplemental/non-spine screen outside Package 0's locked 27-session map, which reads as a hardcoded example stat rather than live-derived text — noted here for awareness, not actioned (out of Package C's document-only scope).

Mapped against the Package 0 locked structure (5 Entry screens + 27 sessions across 7 phases + 13 supporting modules = 32 screen slots, some sharing a route via tabs per the locked screen-count math), the picture is:

- **18 screen slots already have a correct, usable image and need no new artwork** — they need React-side work (already largely done in Packages A/B) but the image itself is fine.
- **1 slot (Meet Your Cigar, S3) has a strong reusable-photography candidate** hiding in already-used component data, not a new file.
- **6 slots have no existing image at all** and are genuinely new visual compositions (Welcome S1, Mentor Commentary S14, AI Summary S21, Rewards/Achievements S25/S26, Venue Select E3, Resume E5).
- **Several slots need a dynamic content-image library** (Knowledge Drop S15, Personalized Pairing Recommendations S22, Cigar/Flavor/Pairing/Mentor libraries) rather than one fixed background.

No image work should begin until this document is reviewed — this package produces the plan, not the pixels.

---

## 2. Asset Inventory

| Location | Files | SC_ASSETS-referenced | Orphaned |
|---|---|---|---|
| `public/assets/smokecraft/` (RAW) | 49 | 18 | 31 |
| `public/assets/smokecraft/cropped/` (CROPPED) | 41 | 2 | 39 |
| `public/assets/smokecraft-reference/approved/` (REF, top-level) | 44 | 7 | 37 |
| `public/assets/smokecraft-reference/approved/batch-22/` (staging) | 45 | 0 | 45 |
| Root-level `public/*.png` (smokecraft-related) | 22 | 1 | 21 |
| **Total production files** | **201** | **28** | **173** |
| `public/proof/**` (screenshot artifacts — excluded from all counts above) | 1,113 | n/a (not production) | n/a |

**Unique images after duplicate hashing: 145** (of 201 files). **File dimensions were not obtainable** in this environment (no PIL/ImageMagick/ffprobe available to the inventory tooling) — flagged as a gap; the two natural-size conventions already established in code (`1672×941` and `1448×1086`, per `NAT_W`/`NAT_H` constants across screen files) remain the working assumption for existing routed images, cross-checked against the screen-by-screen map in §5 rather than measured directly.

All 28 `SC_ASSETS` paths resolve to existing files — zero broken references, consistent with the prior master audit's finding.

---

## 3. Duplicate Analysis

41 hash-duplicate groups were found, accounting for 96 of the 201 files (56 of those are redundant copies beyond the first in each group). The pattern is consistent: the same production image was copied into 2–4 of the four parallel directories during earlier, incomplete asset-repair passes (consistent with the prior audit's finding of repeated repair attempts). Representative examples:

| Image (by content) | Copies found | Used copy |
|---|---|---|
| Scorecard | 4 (batch-22, approved, RAW, root) | none of the 4 is the currently-referenced `SC_ASSETS.scorecard` file — the *actually used* Scorecard file is a 5th, non-duplicate file; these 4 are all stale variants |
| SmokeCraft Challenge | 3 (batch-22, cropped, approved) | `approved/smokecraft-challenge.png` — **this is the live `smokecraftChallenge` key** |
| Event Challenge | 3 (batch-22, approved, root) | `approved/smokecraft-event-challenge.png` — **live `eventChallenge` key** |
| Mini Tasting Round | 3 (batch-22, approved, cropped) | `approved/smokecraft-mini-tasting-round.png` — **live `miniTasting` key** |
| Humidor Match | 2 (approved, RAW) | `smokecraft/Humidor Match 1.png` — **live `humidorMatch` key** |
| Landing | 2 (approved, root `smokecraft-hero.png`) | `approved/smokecraft-landing.png` — **live `landing` key** |
| Cut Toast Light | 2 (approved, RAW) | `smokecraft/CUT  TOAST, & LIGHT.png` — **live `cutToastLight` key** |
| Second Humidor Match | 2 (approved, cropped) | `approved/smokecraft-second-humidor-match.png` — **live `secondHumidorMatch` key** |
| Leaderboard | 2 (batch-22, RAW) | `smokecraft/NEW DEMO LOUNG RANKING.png` — **live `leaderboard` key** |

**Pattern confirmed:** in every duplicate group that includes a currently-used file, the used file is one member of the group — the duplicates are safe-to-archive stale copies, not competing "better" versions. No duplicate group was found where the *unused* copy appears higher-quality or more current than the used one (no evidence of the app pointing at a stale asset while a better one sits idle).

Byte-duplicate groups with **no used member** (e.g. Passport Certified, Passport 3/4, Dashboard Experience, Origins-vs-FlavorDNA overlap, Golden Box vs. Gold Box Rules, Terroir, Second Third, Pairing Mastery) are pure orphan clusters — candidates for archival, reviewed individually in §4 for reuse potential first.

---

## 4. Approved-Unused Candidate Review

The prior master audit already flagged near-duplicate/misfiled pairs; this pass adds hash confirmation and reuse assessment against the *locked* 27-session structure (not the old 24-session one the audit was written against):

| Orphaned candidate | Hash-twin of | Reuse potential |
|---|---|---|
| `approved/smokecraft-origins.png` (+ batch-22, root twins) | itself only (3-way dup, no used twin) | **Strong** — direct candidate for the Origins sub-topic inside Knowledge Drop (S15) |
| `approved/smokecraft-terroir.png` (+ root twin) | itself only | **Strong** — Terroir (S4) has no current image; this is an approved, on-topic candidate already sitting unused |
| `approved/smokecraft-flavor-dna.png` (+ `smokecraft/flavodr dna.png` twin) | itself only | **Strong** — Flavor DNA sub-topic candidate for Knowledge Drop (S15) |
| `approved/smokecraft-pairing-mastery.png` (+ batch-22, root twins) | itself only | **Strong** — Pairing Mastery sub-topic candidate for Knowledge Drop (S15) |
| `approved/smokecraft-passport-connection.png` (+ batch-22, RAW twins) | itself only | **Moderate** — possible Community/Connections supporting-module imagery |
| `approved/smokecraft-guest-pass.png` (+ batch-22, root twins) | itself only | Already in use by GuestPass.jsx (hardcoded path, not via SC_ASSETS — see §5 note) |
| `approved/smokecraft-scan.png` (dup of `smokecraft-entry-gate.png`) | 3-way dup incl. `smokecraft Intake.png` | Already in use by Scan.jsx (hardcoded path) |
| `approved/smokecraft-profile-capture.png` (dup of `DISOVER YOUR CIGAR PROFILE.png`) | itself | **Weak** — overlaps conceptually with the already-used `identity` key; likely superseded, not a gap-filler |
| `batch-22/passport-3.png`, `passport-4.png`, `passport-certified*.png` | pure batch-22↔RAW dups | **Moderate** — Passport Stamp Animation (S23) or Rewards (S25) could draw on these for supplementary imagery, but S23 already has a working image |
| `batch-22/dashboard expernice.png` | dup with RAW twin | **Strong** — plausible direct candidate for Personal Dashboard (E4), which currently reuses the `identity` background with no dedicated art |
| `smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | dup with approved twin | **Moderate** — candidate for Select Venue or Lounge (E3), which has no image at all |
| `smokecraft/SMOKECRAT STORY BOARD.png` | unique, not in any dup group found | **Weak-to-moderate** — worth a manual look for Recommended Next Journey (S27) or general "story so far" framing, but not confirmed on-topic without visual inspection |
| `smokecraft-management-sync-locked.png`, `smokecraft-connections-locked.png`, `smokecraft-passport-stamp-locked.png`, `smokecraft-future-visit-locked.png` (root, referenced by `LockedSmokeCraftScreen.jsx`'s hardcoded `LOCKED_ASSETS` map) | — | Already in active use (confirmed via Package B's file read of `LockedSmokeCraftScreen.jsx`) — not orphaned, just outside `SC_ASSETS` |

No orphaned candidate was found that is a strictly better version of a currently-used image (same subject, higher quality) — the orphan pool is mostly (a) exact stale duplicates, or (b) genuinely different, on-topic content that was shot/generated but never wired up, which is the useful category for filling Package 0's confirmed gaps.

---

## 5. Final Screen-to-Image Map

Mapped against Package 0's locked 32-slot structure (Table 1 in the rebuild plan). "Current image" reflects what's live in code today; slots for not-yet-built sessions show the best orphaned candidate instead.

| Final ID | Screen | Current Image (used today) | Orphaned Candidate | Verdict |
|---|---|---|---|---|
| E1 | Launch Screen | `landing` (approved, in use) | — | Keep |
| E2 | Sign In / Guest Mode | `enroll` (cropped, in use) | — | Keep |
| E3 | Select Venue or Lounge | none (screen doesn't exist yet) | `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | Candidate exists, needs visual confirmation |
| E4 | Personal Dashboard | reuses `identity` (Identity.jsx doubles as this slot currently) | `dashboard expernice.png` | Strong candidate for dedicated art |
| E5 | Resume or Start New Journey | none (screen doesn't exist yet) | none confirmed | Likely React-primary, no dedicated background needed |
| S1 | Welcome to Today's Experience | none | none confirmed | New composition or React-primary |
| S2 | Choose Your Cigar | `humidorMatch` (in use) | — | Keep |
| S3 | Meet Your Cigar | none as a screen | reuse `CigarIntelligencePanel` component's existing content, not a new image | Reuse as content asset |
| S4 | Terroir | none (current Terroir.jsx is a ComingSoon stub) | `smokecraft-terroir.png` | Strong candidate |
| S5 | Construction Inspection | `format` (in use) | — | Keep |
| S6 | Choose Your Cut | none (split target, doesn't exist yet) | subset of `cutToastLight`'s existing composition | Needs limited redesign (crop/split the existing image's cut-relevant zone, or pair with a new composition) |
| S7 | Lighting Tutorial | `cutToastLight` (in use, will become toast+light only) | — | Keep, minor recomposition once split |
| S8 | First Draw | `firstThird` (in use) | — | Keep |
| S9 | Flavor Discovery | shares S8's image (new tab) | — | Keep + Live React |
| S10 | Flavor Memory Exercise | `flavorMemory` (in use) | — | Keep |
| S11 | Suggested Pairings | `pairingLab` (in use) | — | Keep |
| S12 | Flavor Evolution | `secondThird` (in use) | — | Keep |
| S13 | Construction Check | shares S12's image (new tab) | — | Keep + Live React |
| S14 | Mentor Commentary | none | Mentor.jsx's existing per-mentor portrait data (not a screen-level image) | Dynamic asset library required (reuse existing mentor portraits) |
| S15 | Knowledge Drop | none (merge target of 4 stub screens) | `smokecraft-origins.png`, `smokecraft-flavor-dna.png`, `smokecraft-pairing-mastery.png`, + Terroir's candidate if not consumed by S4 | Dynamic asset library required, strong candidates exist |
| S16 | Flavor Finish | `finalThird` (in use) | — | Keep |
| S17 | Strength Progression | shares S16's image (new tab) | — | Keep + Live React |
| S18 | Overall Experience Notes | shares S16's image (new tab) | — | Keep + Live React |
| S19 | Rate Every Category | `scorecard` (in use) | — | Keep |
| S20 | Personal Notes | shares S19's image (existing field) | — | Keep + Live React |
| S21 | AI Summary | none | none confirmed | Create new (or React-primary results panel, no photography needed) |
| S22 | Personalized Pairing Recommendations | none as a screen (reuses PairingLab's logic) | PairingLab's own image/visual language | Reuse as content asset / React-primary results screen |
| S23 | Passport Stamp Animation | `passportStamp` (in use) | — | Keep |
| S24 | Completed Scorecard | reuses `finalReview` (repurpose target) | — | Keep + Live React (repurposed as read-only recap) |
| S25 | Rewards and XP | none (net-new) | `PremiumIcons.jsx` component (already active, confirmed in prior audit) for badge iconography | Dynamic asset library required |
| S26 | Achievements | shares S25's image (new tab) | same as S25 | Dynamic asset library required |
| S27 | Recommended Next Journey | reuses `sessionComplete` (repurpose target) | `SMOKECRAT STORY BOARD.png` (unconfirmed) | Keep + Live React, candidate worth checking |
| — | GoldenBox (supporting) | `goldenBox` (in use) | — | Keep |
| — | RequestPurchase (supporting, drawer) | `requestPurchase` (in use) | — | Keep |
| — | SmokeCraftChallenge (supporting) | `smokecraftChallenge` (in use, static-only stub) | — | Keep + Live React (needs real content per Package I) |
| — | SecondHumidorMatch (supporting) | `secondHumidorMatch` (in use, static-only stub) | reuse S2's `humidorMatch` composition | Reuse as content asset |
| — | MiniTastingRound (supporting) | `miniTasting` (in use, static-only stub) | — | Keep + Live React |
| — | Connections (supporting) | `connections` (in use) | — | Keep |
| — | ManagementSync (supporting) | `managementSync` (in use) | — | Keep |
| — | Leaderboard (supporting) | `leaderboard` (in use, static-only) | — | Keep + Live React |
| — | EventChallenge (supporting) | `eventChallenge` (in use, static-only stub) | — | Keep + Live React |
| — | HowItWorks (supporting) | `howItWorks` (in use) | — | Keep (may remain static-informational by product decision) |
| — | Assistant (supporting) | none (ComingSoon) | none confirmed | Subject to AI decision gate (Package H), no image work until resolved |
| — | Scan (supporting) | `smokecraft-scan.png` (hardcoded path, in use) | — | Keep, migrate to SC_ASSETS registry (code task, not image task) |
| — | GuestPass (supporting) | `smokecraft-guest-pass.png` (hardcoded path, in use) | — | Keep, migrate to SC_ASSETS registry |

---

## 6. Live UI Visual Map

Applying the Locked Live Visual Directive's 8-layer separation to every screen category (grouped, since the pattern is structurally identical across the 18 "Keep" screens):

| Layer | Existing Keep-list screens (18) | New/Create screens (S1, S3, S14, S15, S21, S22, S25/S26, E3, E5) |
|---|---|---|
| 1. Static atmosphere/artwork | Approved background image, unchanged | Approved photography where a candidate exists (S4→Terroir, S15→Knowledge Drop topics); neutral/decorative composition otherwise |
| 2. Replaceable image zones | None currently — full-bleed backgrounds only | Cigar/mentor/flavor/reward thumbnails as needed (S3, S14, S15, S25) |
| 3. Live React controls | Present (buttons, sliders, inputs — built in prior packages) | To be built when each screen is implemented |
| 4. Live React text/data | Present (journey-state-driven panels) | To be built |
| 5. User-selected state | Rendered via gold-border+checkmark pattern (established, non-fill) | Same pattern to be reused, not reinvented |
| 6. AI-generated content | N/A (no AI screens in Keep list) | S21 exclusively — must be visually distinguished from S22's rule-based results per the AI Plan's honesty requirement |
| 7. Database/API content | Scorecard submission, Passport claim (already real per Package A) | Rewards/XP (S25/S26) once wired to the real XP ledger |
| 8. Animation controlled by code | None currently observed | S23 (Passport Stamp Animation) already implies code-driven animation — confirm current implementation matches "Animation" label, flagged for verification, not assumed |

**Confirmed:** no screen in the 18-item Keep list was found to bake dynamic content directly into the image itself (per the full-repo JSX scan) — the existing pattern is already correct (static background + React overlay), which is why these screens are classified Keep rather than Update.

---

## 7. Keep List (18)

E1 (Launch), E2 (Enroll), S2 (Choose Your Cigar/HumidorMatch), S5 (Construction Inspection/Format), S7 (Lighting Tutorial/CutToastLight, pending minor recomposition), S8 (First Draw/FirstThird), S10 (Flavor Memory Exercise), S11 (Suggested Pairings/PairingLab), S12 (Flavor Evolution/SecondThird), S16 (Flavor Finish/FinalThird), S19 (Rate Every Category/Scorecard), S23 (Passport Stamp Animation), GoldenBox, RequestPurchase, Connections, ManagementSync, HowItWorks, Scan/GuestPass (pending SC_ASSETS registry migration, no image change).

## 8. Keep + Live React List

S9 (Flavor Discovery, new tab on S8's image), S13 (Construction Check, new tab on S12's image), S17/S18 (Strength Progression / Overall Experience Notes, new tabs on S16's image), S20 (Personal Notes, existing field on S19's image), S24 (Completed Scorecard, repurposed `finalReview` image), S27 (Recommended Next Journey, repurposed `sessionComplete` image), SmokeCraftChallenge, MiniTastingRound, Leaderboard, EventChallenge (all 4: image stays, real interactive content needs building per Package I).

## 9. Reuse as Content Asset List

S3 (Meet Your Cigar — reuse `CigarIntelligencePanel` component's existing content, not a screen background), S22 (Personalized Pairing Recommendations — reuse PairingLab's visual language/logic, not its literal background image), SecondHumidorMatch (reuse S2/HumidorMatch's composition rather than commission a duplicate).

## 10. Update List

S6 / S7 split (Choose Your Cut / Lighting Tutorial) — the current single `cutToastLight` image covers both; once the screens split (Package C proper, not this document), the cut-specific zone needs isolating — a limited update (crop/recompose), not a full redesign, since the source photography is approved and adequate.

## 11. Redesign List

None identified as strictly required — every existing Keep-list image already supports live React overlay correctly, per §6. No image currently blocks correct information display or contains baked dynamic content that would force a redesign rather than a simple build-out.

## 12. Create-New List

S1 (Welcome to Today's Experience), S14 (Mentor Commentary — screen-level composition; portrait library itself is reused, not new), S21 (AI Summary), E3 (Select Venue or Lounge — pending confirmation the `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` candidate is genuinely usable; if not, fully new), E5 (Resume or Start New Journey — likely React-primary, minimal/no new photography needed), S25/S26 (Rewards and XP / Achievements — screen-level composition; icon library reused via `PremiumIcons.jsx`).

## 13. Dynamic Asset Library Plan

| Library | Assets present | Assets reusable | Assets missing | Naming standard | Fallback requirement |
|---|---|---|---|---|---|
| Cigars | 8 presets hardcoded in `HumidorMatch.jsx`/`PairingLab.jsx` data (Oliva, Fuente, Padron, Macanudo, CAO, Romeo y Julieta, My Father, Cohiba) — no per-cigar photography, text-only | Existing text data | Per-cigar photography (0 present) | Not yet established | Required — neutral cigar silhouette |
| Flavors | Flavor-note zones exist as text/SVG-driven UI (FlavorMemory's radar chart), no photography per flavor | Existing radar-chart component | Per-flavor illustrative icons (0 present) if a richer visual is desired | Not yet established | Text-only fallback already functional |
| Pairings | Pairing-type text data in `PairingLab.jsx`, no photography | Existing text data | Per-pairing photography (0 present) | Not yet established | Required — neutral glass/cup silhouette |
| Mentors | 8 mentor portraits/data in `Mentor.jsx`'s `MENTOR_ZONES` (name, origin, expertise) — need to confirm whether these are photographic assets or text-only cards | Likely reusable for S14 Mentor Commentary | Audio-playing/commentary-state visual treatment (0 present) | Not yet established | Required — neutral mentor silhouette |
| Terroir/Education | `smokecraft-terroir.png`, `smokecraft-origins.png`, `smokecraft-flavor-dna.png`, `smokecraft-pairing-mastery.png` (all confirmed orphaned, on-topic) | 4 strong candidates for S4 + S15 | Farm/fermentation/aging/factory-specific sub-images (unconfirmed whether the 4 candidates cover these or are broader) | Not yet established | Required — neutral education-topic placeholder |
| Rewards/Results | `PremiumIcons.jsx` (active component, confirmed in audit), passport-stamp-adjacent orphans (`passport-3.png`, `passport-4.png`, `passport-certified*.png`) | Icon component + 4 orphaned candidates | Badge-specific artwork per achievement type (count unconfirmed — depends on Package H's reward catalog design, not yet locked) | Not yet established | Required — neutral locked-reward silhouette |

**Naming/dimension standards:** not yet established anywhere in the codebase for these libraries — this is a genuine gap. Recommend establishing a `sc-library-{category}-{id}.{ext}` convention and a single target aspect ratio (matching one of the two existing conventions, `1672×941` or `1448×1086`) before any new library asset is created, so libraries don't fragment into a third format.

## 14. Archive List

- 56 confirmed byte-duplicate files (§3) — safe to archive once each duplicate group's "keeper" is confirmed (the used file, where one exists in the group; otherwise the highest-quality/most-descriptively-named copy).
- All 45 `batch-22/` files not already counted as a duplicate-group member of a used file — staging material, never promoted.
- Root-level legacy files superseded by `SC_ASSETS`-registered equivalents (e.g. `smokecraft-hero.png` vs. `landing` key's `smokecraft-landing.png`).
- 1,113 `public/proof/**` files — not production assets at all; archival here means routine cleanup of stale test-run screenshots, not a judgment on image quality.

**No file was deleted, moved, or renamed to produce this list** — archival execution is explicitly deferred to a later implementation package, per Package C's document-only scope.

---

## 15. Exact Image Creation Queue

1. **Images that require no work (18):** the full Keep list (§7) — verify only, no action.
2. **Images needing only React conversion (10):** the Keep + Live React list (§8) — code work in later packages, image untouched.
3. **Images needing limited updates (1):** S6/S7 cut/light split recomposition.
4. **Images needing redesign (0):** none identified.
5. **Completely new images (6):** S1, S14, S21, E3 (pending candidate confirmation), E5 (likely none needed), S25/S26.
6. **Dynamic content-image libraries (5):** Cigars, Flavors, Pairings, Mentors, Terroir/Education, Rewards/Results — see §13 for per-library gaps.
7. **Images to archive after implementation is complete:** 56 duplicate files + 45 batch-22 staging files + root-level superseded legacy files + 1,113 proof-directory files, per §14 — archival happens only after every "reusable candidate" identified in §4/§5 has actually been consumed by its target screen, so nothing scheduled for reuse is deleted prematurely (consistent with the master rebuild plan's own ordering principle).

### Per-image requirements for Create-New / Redesign items

**S1 — Welcome to Today's Experience**
- Purpose: first in-journey screen after Entry layer, sets tone for the smoking session about to begin.
- Required composition: warm, inviting lounge/table-setting atmosphere; no specific cigar/mentor/venue content (guest hasn't chosen anything yet).
- Permanent imagery: decorative only.
- Blank live-data zones: guest name (if available from Identity), session date/time.
- Replaceable zones: none required.
- Controls that must be React: single "Begin" / acknowledge action.
- Content that must not be baked in: guest name, date, any progress indicator.
- Target aspect ratio: match existing convention (1672×941 recommended, consistent with adjacent Entry/Prep screens).
- Tablet readability: standard — text panel over image, per established pattern.
- Dependency: none (first content screen, no upstream data required).

**S14 — Mentor Commentary**
- Purpose: display mentor-attributed tips fed by the mentor selected in S3.
- Required composition: mentor-portrait-forward layout with room for commentary text.
- Permanent imagery: mentor portrait library (reused, see §13).
- Blank live-data zones: commentary text (sourced from real per-mentor content, not generic).
- Replaceable zones: mentor portrait itself (swaps per selection).
- Controls that must be React: none required beyond standard nav; primarily a content-delivery screen.
- Content that must not be baked in: any specific mentor's commentary text baked into a single static image (must support all 8 mentors, not just one).
- Target aspect ratio: 1672×941 (consistent with Mentor.jsx's existing convention).
- Tablet readability: standard.
- Dependency: S3's mentor selection must exist and persist before this screen can render correctly.

**S21 — AI Summary**
- Purpose: results-phase screen showing an AI-generated journey summary.
- Required composition: primarily data/text-driven results panel; background can be minimal/thematic rather than photography-heavy.
- Permanent imagery: decorative results-panel framing only.
- Blank live-data zones: the AI summary text itself, an honest "Not available" fallback state.
- Replaceable zones: none required.
- Controls that must be React: entire content area (this is the most React-primary of the new screens).
- Content that must not be baked in: any example/placeholder AI output that could be mistaken for real generated content.
- Target aspect ratio: match adjacent Results-phase screens (1448×1086 recommended, consistent with PassportStamp/FinalReview/FlavorMemory convention).
- Tablet readability: standard.
- Dependency: subject to the AI decision gate (Package H) — do not commission artwork until build-vs-de-scope is resolved, since a de-scoped Assistant may not need this composition at all.

**E3 — Select Venue or Lounge**
- Purpose: Entry-layer venue/lounge selection.
- Required composition: venue-selection UI over an appropriate background; the `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` orphaned candidate should be visually reviewed first (this document did not perform pixel-level visual inspection).
- Permanent imagery: venue/lounge atmosphere.
- Blank live-data zones: actual venue list (real data, not fabricated venue names).
- Replaceable zones: venue thumbnail per option, if multiple venues are supported.
- Controls that must be React: venue selector.
- Content that must not be baked in: specific venue names/details if they vary by deployment.
- Target aspect ratio: 1672×941 (consistent with Entry-layer siblings).
- Tablet readability: standard.
- Dependency: none.

**E5 — Resume or Start New Journey**
- Purpose: thin wrapper around already-correct resume logic (Package B fixed the underlying `currentAllowed.route` mechanism this screen would consume).
- Required composition: likely React-primary — a decision screen ("Resume" vs "Start New"), not necessarily a full photographic background.
- Permanent imagery: minimal/decorative, if any.
- Blank live-data zones: the guest's actual current session label (from `currentAllowed.label`, already available post-Package-B).
- Replaceable zones: none required.
- Controls that must be React: both action buttons.
- Content that must not be baked in: any specific session name/number.
- Target aspect ratio: not yet determined — pending confirmation this needs a background image at all.
- Tablet readability: standard.
- Dependency: Package B's `currentAllowed` context fix (already shipped) is the data dependency; no new persistence work needed.

**S25/S26 — Rewards and XP / Achievements**
- Purpose: net-new results screen, confirmed missing since the original audit.
- Required composition: reward/badge showcase layout, tab 2 for achievements.
- Permanent imagery: decorative framing; badge iconography reused from `PremiumIcons.jsx`.
- Blank live-data zones: actual earned/locked reward list, XP total, claim status.
- Replaceable zones: badge icon per reward type.
- Controls that must be React: claim action, tab switcher.
- Content that must not be baked in: any specific reward count or "X rewards earned" text not derived from real state.
- Target aspect ratio: 1448×1086 (consistent with adjacent Results-phase screens).
- Tablet readability: standard.
- Dependency: Package A's canonical persistence (already supports this — `journey.rewards`/`journey.achievements` fields are planned per the rebuild plan's §16, not yet added since Package A intentionally deferred non-8-screen fields).

---

## 16. Exact Final Totals

1. Total SmokeCraft-related image files: **201** (production) + **1,113** (proof, excluded from all following counts)
2. Total unique image files after duplicate hashing: **145**
3. Total currently referenced production images: **28**
4. Total approved but unused candidate images (confirmed on-topic per §4): **~11** (origins, terroir, flavor-dna, pairing-mastery, passport-connection, dashboard-experience, venue-table-experience, + 4 passport/certified variants of uncertain fit)
5. Total proof or testing images: **1,113**
6. Total duplicate images (redundant copies beyond first in group): **56**
7. Total obsolete images (batch-22 staging + confirmed-superseded root/legacy, excluding proof): **~90** (45 batch-22 + ~45 root/legacy estimated from the orphan pool minus reuse candidates — exact figure pending the archival-time re-verification required by §14)
8. Total images classified KEEP: **18**
9. Total images classified KEEP + LIVE REACT: **10**
10. Total images classified REUSE AS CONTENT ASSET: **3**
11. Total images classified UPDATE: **1**
12. Total images classified REDESIGN: **0**
13. Total images classified CREATE NEW: **6** (S1, S14, S21, E3-pending, E5-likely-none, S25/S26 — counted as 6 screen-level compositions; E3 and E5 may resolve to 0 net-new files pending candidate confirmation)
14. Total assets classified ARCHIVE: **56 duplicates + 45 batch-22 + estimated ~45 other legacy = ~146**, plus 1,113 proof files as a separate non-production cleanup category
15. Total screens requiring no new image: **18**
16. Total screens requiring only React conversion: **10**
17. Total screens requiring a limited image update: **1**
18. Total screens requiring full image redesign: **0**
19. Total truly new full-screen visuals required: **4–6** (S1, S14, S21, S25/S26 confirmed; E3/E5 pending)
20. Total dynamic asset libraries required: **5** (Cigars, Flavors, Pairings, Mentors, Terroir/Education — Rewards/Results counted within Terroir/Education's sibling pattern in §13, treated as a 6th if counted separately: **5–6**)
21. Total individual missing content images required inside those libraries: **not countable yet** — cigar/flavor/pairing photography counts are 0 present across the board (text-only today), and the exact number needed depends on how many of the 8 existing cigar presets / flavor notes / pairing types get dedicated photography vs. remain text-driven, a product decision outside this document's scope
22. Total final production images and content assets recommended: **145 (existing unique) + 4–6 (new screens) + library gaps (uncounted, pending §21)** — a precise grand total cannot be stated honestly until the library-photography scope decision (§21) is made; this document intentionally reports that as an open question rather than inventing a number

---

## 17. Recommended Visual Implementation Order

1. **Confirm dimensions and visually inspect the ~11 approved-unused candidates** (§4) — this document could not measure file dimensions or visually verify content; a human/visual pass should confirm each candidate actually matches its proposed slot before any screen is built against it.
2. **Consume the strong candidates into their target screens** as each screen is built in its assigned package (S4/Terroir and S15/Knowledge Drop in Package D per the rebuild plan; E3/E4 in Package E).
3. **Build the 6 create-new screens' compositions** only after their upstream data dependencies exist (S14 needs S3's mentor selection; S21 needs the AI decision gate resolved; S25/S26 needs the Rewards persistence fields Package A deferred).
4. **Establish the dynamic-library naming/dimension standard** (§13) before commissioning any per-cigar/flavor/pairing/mentor photography, so the libraries don't fragment into a third aspect-ratio convention.
5. **Perform the S6/S7 split recomposition** in lockstep with Package C's actual CutToastLight code split (not this document), since the image work and the route/component split are interdependent.
6. **Archive last** — only after every reuse candidate in §4/§5 has been confirmed consumed or explicitly rejected, re-verify the duplicate/orphan lists (they may shift as screens are built) and then execute the archival pass from §14/§15 item 7.

---

## Planning Methodology Note

This document was produced from two parallel read-only inventories: a full filesystem hash/duplicate/dimension pass across all SmokeCraft image directories (dimensions were not obtainable in this environment — no PIL/ImageMagick/ffprobe available to the tooling — and that gap is reported honestly rather than guessed), and a full-repo code scan of every `src/pages/smokecraft/*.jsx` file for its current image reference and any hardcoded dynamic-looking text. No image file was opened for visual/pixel inspection — content-fit judgments in §4/§5 are based on filenames, existing usage patterns, and the locked Package 0 screen definitions, and are flagged as "candidate, pending confirmation" rather than stated as certain where visual inspection would be the only way to be sure.
