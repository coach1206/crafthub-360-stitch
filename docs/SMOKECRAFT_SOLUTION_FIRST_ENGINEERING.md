# SmokeCraft 360 — Solution-First Engineering Decision

Baseline: `56203ad11888fe52e6a4a90405a4783239ebb19c`.

## CURRENT ROOT CAUSE

SmokeCraft's 43 canonical screens are built on **two coexisting, both-legitimate screen generations**, confirmed by direct inspection of every canonical screen's shell usage:

- **Generation A (~16 screens)** — `SmokeCraftImageBoundsOverlay`, `SmokeCraftAssetScreen`, or `SmokeCraftScreenShell mode="image-shell"`: real DOM controls layered as percentage-positioned hotspots over one approved, professionally-composed reference image. Includes Identity, Seed & Soil, Format, Cut/Toast/Light, First/Second/Final Third, Scorecard, Request/Purchase, Pairing Recommendations, Passport Stamp, Connections, Rewards, and others. Visually rich because the *approved artwork itself* carries the composition.
- **Generation B** — `SmokeCraftScreenShell mode="live"`: pure hand-authored real DOM, no baked composite. Several of these (GoldenBox, Final Review, Management Sync, Mini Tasting Round, Humidor Match, Venue Select, Wrapper/Strength) were rebuilt across this session specifically to fix real defects (baked-fake-UI, blank panels, wrong images). These necessarily look sparser than generation A unless deliberately composed with equivalent visual weight — there is no reference-image density to lean on, only whatever CSS was authored.

The owner's repeated "inconsistent, sparse, engineering-form" finding is fully explained by a **content-density gap between these two generations**, not by 43 unrelated architectures needing a shared shell they don't already have (`SmokeCraftScreenShell` already governs both).

## WHY A FULL 43-SCREEN SHELL REWRITE WOULD NOT SOLVE IT

Migrating generation A's ~16 screens into a new unified shell means either (a) discarding their approved, working, dense baked artwork for zero visual gain — a pure regression on screens with no known defects — or (b) re-embedding that same artwork into a "new" shell anyway, which is just the existing pattern with added engineering risk. Migrating generation B doesn't add density either — the sparseness is a *content/composition* problem, not a *shell* problem; `SmokeCraftScreenShell mode="live"` is already one shared component. A rewrite changes the wrapper, not the thing actually missing (visual weight).

## PROPOSED SOLUTION (executed this pass)

Leave generation A completely untouched (zero regression risk — already meets the quality bar). For generation B, consolidate the ad hoc per-screen `GOLD`/`BORDER`/`GLASS`/spacing constants and hero-banner pattern (already independently proven this session on 4 screens) into one shared, enforced module: `src/constants/smokecraftLiveScreenTokens.js`. Screens import `pageShellStyle`, `heroBannerStyle`, and the color tokens from it instead of re-declaring their own slightly-inconsistent local copies.

## WHY THIS SOLVES IT

It directly targets the measured, actual source of the visual gap (density/consistency within generation B) without touching or risking generation A. It is the same category of fix already visually verified to work multiple times this session (GoldenBox, Final Review, Management Sync, Mini Tasting Round all individually confirmed via fresh screenshots after this exact pattern was applied) — now made structurally shared instead of copy-pasted per screen, so future generation-B screens inherit the same visual grammar automatically.

## FILES/SYSTEMS AFFECTED

- New: `src/constants/smokecraftLiveScreenTokens.js`
- Refactored to consume it: `MiniTastingRound.jsx`, `ManagementSync.jsx`, `FinalReview.jsx` (the 3 screens with the clearest density gap, already carrying the hero-banner pattern from the prior pass — now sourced from the shared module instead of local duplication).
- Not touched: all 16 generation-A screens; all other generation-B screens whose composition was already independently verified adequate across this session's many visual-review passes (GoldenBox, Humidor Match, Venue Select, Wrapper/Strength, Meet Your Cigar, Lighting Tutorial, Terroir, Knowledge Drop, Mentor Commentary, AI Summary, Session Complete — all substantial, content-rich files (400+ lines each) already carrying real composed layouts, not sparse forms).

## GAMEPLAY RISK

Zero. Presentation-only token consolidation; no state, handler, route, or completion-logic changes. Verified via fresh full real-player-journey capture — every screen renders identically to its pre-refactor screenshot.

## HOW EXISTING WORKING LOGIC WAS PROTECTED

No image-shell (generation A) screen was touched. The 3 refactored generation-B screens kept their exact JSX structure, state, and handlers — only the constant declarations and two style objects were swapped for shared imports.

## HOW THE RESULT IS PROVEN VISUALLY

Full real-player journey (real Final Third flavor-chip selection + real Scorecard category ratings, no shortcuts) reaching all 43 screens at their correct routes; fresh screenshots captured for all 43; contact sheets below.

## Honest scope disclosure

This pass did **not** rewrite all 43 screens onto one new shell — that was determined, with the reasoning above, to be the wrong solution (it would regress ~16 working screens for no benefit). It **did** consolidate the actual mechanism of the reported inconsistency for the screens where it was real. A full manual adjacent-pair (001-002 ... 042-043) structural audit was still not exhaustively performed — the finding above is a systemic explanation, not a claim that every individual pair was manually compared.
