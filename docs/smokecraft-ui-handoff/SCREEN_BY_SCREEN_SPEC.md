# Screen-by-Screen Spec

One record per canonical screen. Machine-readable equivalents: `SCREEN_MANIFEST.json` (full manifest), `ROUTE_TO_COMPONENT_MAP.json` (route→component→phase/session), `ASSET_MAP.json` (every approved image key→path). This file adds the human-authored fields (purpose, player instruction, mentor behavior) the JSON doesn't carry.

Full 27-session table with route/component/prev/next/XP/badge/status: **`docs/SMOKECRAFT_FULL_GAME_INVENTORY.md`** (generated, always current — do not duplicate that table by hand here; read it alongside this file).

For each screen below: purpose, player instruction, required interaction, mentor behavior, desktop/tablet/kiosk expectation.

## Welcome (S1)
Purpose: orientation, set expectations for the session ahead. Instruction: read the welcome copy, press Begin Experience. Interaction: one real Continue action (no form). Mentor: none at this screen (mentor is chosen next, in the recovered opening chain). Desktop/tablet/kiosk: image-shell layout, sidebar/bottom-nav persist at all sizes — verify no clipping (see `RESPONSIVE_AND_TOUCH_SPEC.md`).

## Golden Box Rules (opening chain, supporting)
Purpose: house rules/etiquette before real gameplay begins. Instruction: read the 5 Golden Principles, acknowledge via the real checkbox. Interaction: checkbox (real, gates Continue) + Continue button. Mentor: none. Known issue: severe top/bottom letterboxing on tablet-portrait — see `CURRENT_VISUAL_DEFECTS.md`.

## Mentor Selection (opening chain, supporting)
Purpose: pick up to 2 mentors whose voice/philosophy will color later commentary. Instruction: browse cards, tap to select (up to 2), Continue. Interaction: real `aria-pressed` selectable cards + voice preview buttons. Mentor: this **is** the mentor system's entry point — every card is a real mentor profile, not decoration.

## Seed & Soil (opening chain, supporting)
Purpose: origin/cultivation education bridging Mentor Selection into gameplay. Interaction: real selectable options + Continue to Humidor Match.

## Humidor Match (S2)
Purpose: teach storage fundamentals via a real, stateful choice. Instruction block (PURPOSE/ACTION/GOAL) at top explains temperature/humidity/airflow/sealing purpose and lists the 4 actions (choose, adjust, apply, continue). Interaction: environment radiogroup, temp/humidity steppers, seal/airflow toggles, Apply Settings, cigar picker (optional), Continue. Visible "ACTIVE" state must always equal the real selected environment — this was a real production defect (SC-D076), now structurally impossible to regress (build-blocking test covers it). Real decorative hero photo at top (`humidorMatchHero`), never a surface controls sit on.

## Meet Your Cigar (S3) → Terroir (S4) → Format (S5) → Cut, Toast & Light (S6) → Lighting Tutorial (S7)
Standard pattern: real selectable cards/steppers, instructional copy, Continue/Back. See `SCREEN_MANIFEST.json` for exact routes/components.

## First Third (S8/9) → Flavor Memory (S10) → Pairing Lab (S11)
Tasting-observation pattern (notes-selected chips + personal notes) for First Third; Flavor Memory is a hotspot/selection exercise; Pairing Lab calls the real pairing-recommendation engine and lets the player save a pairing.

## Second Third (S12/13) → Mentor Commentary (S14) → Knowledge Drop (S15)
Mentor Commentary is a **required canonical mentor moment** mid-game — the mentor selected earlier should visibly react/comment here. Knowledge Drop is an objectively-graded quiz.

## Final Third (S16/17/18) → Scorecard (S19/20)
See `FULL_SUBSTEP_SEQUENCE.md` for the merged-session detail.

## AI Summary (S21) → Pairing Recommendations (S22) → Passport Stamp (S23) → Final Review (S24) → Rewards (S25/26) → Session Complete (S27)
Results phase — server-computed summary, a second pairing recommendation, the real Passport-360 stamp claim, the completed scorecard read-back, XP/achievement reveal, and a recommended-next-journey close screen.

## Golden Box (post-game)
Real multi-step competition entry (see `FULL_SUBSTEP_SEQUENCE.md`) culminating in judged results and awards.
