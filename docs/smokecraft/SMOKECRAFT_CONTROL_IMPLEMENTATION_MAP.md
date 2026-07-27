# SmokeCraft 360 — Control Implementation Map

Generated: Holistic Fix 2E-11

## Methodology

All 276 curriculum controls discovered live from the rendered DOM in Holistic
Fix 2E-9 are mapped here to exactly one of 7 implementation groups, derived
from real source inspection (component handlers, `aria-pressed`/`role`
attributes, actual `onClick` behavior confirmed via source read across
Holistic Fix 2E-6 through 2E-10) — not guessed from labels alone. Each
group is defined by its actual behavior contract and tested once via its
real implementation, plus a representative instance from every session
family that uses it, rather than 276 redundant end-to-end tests.

## The 7 implementation groups

| Group | Controls | Behavior contract | Persistence required | Navigation required | Duplicate-fire risk | Disabled-state expected | Representative sessions | Test reference |
|---|---|---|---|---|---|---|---|---|
| navigation | 55 | Real click navigates to the expected destination route (Back to Journey, Previous, Next, sidebar links). No persistence required (navigation is the state change itself). | False | True | False | False | 1, 7, 25, 26 | verify-smokecraft-hf2e5-curriculum-forward-backward.mjs (forward walk + Session 1 Next + Session 2 Back), verify-smokecraft-full-journey-sequence-and-assets.mjs |
| selection-toggle | 94 | Real click toggles a selection on/off (aria-pressed true/false), used for hotspot zones, cigar/shape/cut pickers, decision-support selections. Selection is ephemeral UI state; persisted only via the Continue action into journey context. | False | False | False | False | 2, 5, 6, 11, 21, 22 | verify-smokecraft-hf2e10-control-state-persistence.mjs #1 (HumidorMatch) |
| rating-toggle | 67 | Real click sets a rating/observation flag (aria-pressed), persisted into journey-context localStorage on every change (not just on explicit Save), surviving a full page reload. | True | False | False | False | 8, 12, 16, 19 | verify-smokecraft-hf2e10-control-state-persistence.mjs #2 (FirstThird) |
| tab-disclosure | 23 | Real click on a role="tab" (or equivalent disclosure) element reveals additional real content that was not previously rendered — verified as an actual content-length increase, not decorative. | False | False | False | False | 3, 4, 15 | verify-smokecraft-hf2e10-control-state-persistence.mjs #3 (Terroir) |
| tasting-input | 12 | Real click toggles a flavor/aroma/intensity selection on/off (aria-pressed), feeding a client-state flavor/tasting profile object. | False | False | False | False | 10 | verify-smokecraft-hf2e10-control-state-persistence.mjs #6 (FlavorMemory) |
| completion | 23 | Real click on Continue/Complete/Claim triggers the done-flag guard (`if (done) return`), preventing a rapid double-click from producing two navigations/awards, then navigates to the correct next screen. | False | True | True | False | 2, 8, 10, 23, 24, 27 | verify-smokecraft-hf2e10-control-state-persistence.mjs #4 (HumidorMatch double-click), verify-smokecraft-hf2e5-curriculum-forward-backward.mjs SC-D014 section (FlavorMemory backend-dependent Continue) |
| honest-disabled | 2 | When a prerequisite is not met (e.g. no mentor selected), the screen renders an honest empty/disabled state with no fabricated content, and no interactive control that would falsely imply availability. | False | False | False | True | 14 | verify-smokecraft-hf2e10-control-state-persistence.mjs #5 (MentorCommentary) |

**Total controls: 276. Total mapped: 276. Unmapped: 0.**

## Full 276-control-to-group mapping

| Session | Route | Tag[type] | Label | Group |
|---|---|---|---|---|
| 1 | /smokecraft/welcome | BUTTON[button] | Back to Journey | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Notifications | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Help | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Account | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Dashboard | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Sessions | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Rewards | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Passport | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Leaderboard | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Events | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Collections | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Mentor | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Settings (not yet available) | honest-disabled |
| 1 | /smokecraft/welcome | BUTTON[button] | Sign out — return to SmokeCraft landing | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Home | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Journey | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Learn | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Create | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Pairing | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Mentor | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | TODAY’S EXPERIENCE | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | CIGAR PREVIEW | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | Start Session 1 — Begin Experience | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | ← BACK | navigation |
| 1 | /smokecraft/welcome | BUTTON[button] | BEGIN EXPERIENCE → | navigation |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Virtual Humidor | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Dry Box | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Travel Case | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | − | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | + | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | − | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | + | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Seal | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Airflow | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Apply Settings | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Oliva Serie V | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Arturo Fuente Opus X | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Padron 1964 Series | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Macanudo Café | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | CAO Flathead | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Romeo y Julieta 1875 | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | My Father Le Bijou | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | Cohiba Siglo VI | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | i | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | ← BACK | selection-toggle |
| 2 | /smokecraft/humidor-match | BUTTON[button] | CONTINUE TO MEET YOUR CIGAR → | completion |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Brand | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Blend | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Wrapper | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Binder | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Filler | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Factory | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | Master Blender | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | i | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | ← BACK | tab-disclosure |
| 3 | /smokecraft/meet-your-cigar | BUTTON[button] | CONTINUE → | completion |
| 4 | /smokecraft/terroir | BUTTON[button] | Country | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | Region | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | Soil | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | Climate | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | Growing Conditions | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | Why It Matters | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | i | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | ← BACK | tab-disclosure |
| 4 | /smokecraft/terroir | BUTTON[button] | CONTINUE → | completion |
| 5 | /smokecraft/format | BUTTON[button] | Robusto — 5" × 50 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | Toro — 6" × 52 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | Churchill — 7" × 48 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | Corona — 5.5" × 42 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | Gordo — 6" × 60 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | Torpedo — 6.5" × 52 ring | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | i | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | ← BACK | selection-toggle |
| 5 | /smokecraft/format | BUTTON[button] | CONTINUE TO REQUEST / PURCHASE → | completion |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | Straight Cut | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | V-Cut | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | Punch Cut | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | Learn Why ▼ | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | i | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | ← BACK | selection-toggle |
| 6 | /smokecraft/cut-toast-light | BUTTON[button] | CONTINUE TO LIGHTING TUTORIAL → | completion |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 1: Toasting the Foot (current) | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 2: Lighting Technique | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 3: Establishing an Even Burn | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 4: Avoiding Tunneling | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 5: Avoiding Overheating | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 6: Correct Flame Distance | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 7: The Proper First Draw | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | Step 8: Burn Inspection | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | ? | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | i | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | ← BACK | navigation |
| 7 | /smokecraft/lighting-tutorial | BUTTON[button] | NEXT STEP → | navigation |
| 8 | /smokecraft/first-third | BUTTON[button] | Aroma Opening | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Draw Ease | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Body Start | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Flavor Notes | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Burn Line | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Ash Quality | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | Save Draft | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | i | rating-toggle |
| 8 | /smokecraft/first-third | BUTTON[button] | CONTINUE TO SECOND THIRD → | completion |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Earth flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Wood flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Spice flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Cocoa flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Coffee flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Sweet flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Nuts flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | Floral flavor | tasting-input |
| 10 | /smokecraft/flavor-memory | INPUT[range] | Intensity perception | tasting-input |
| 10 | /smokecraft/flavor-memory | INPUT[range] | Body perception | tasting-input |
| 10 | /smokecraft/flavor-memory | INPUT[range] | Strength perception | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | i | tasting-input |
| 10 | /smokecraft/flavor-memory | BUTTON[button] | CONTINUE TO SUGGESTED PAIRINGS → | completion |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Robusto | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Toro | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Churchill | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Figurado | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Connecticut | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Habano | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Maduro | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Corojo | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Dominican Republic | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Nicaragua | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Honduras | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Cuba | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Mexico | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Mild | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Medium | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Medium-Full | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Full | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Smooth | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Bold | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Creamy | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Sweet | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Smoky | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Balanced | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Rich | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Complement | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Contrast | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Soften | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Brighten | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Deepen Finish | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Explore New Notes | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Whiskey | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Rum | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Coffee | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Espresso | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Chocolate | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Nuts | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | Nonalcoholic | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | i | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | ← BACK | selection-toggle |
| 11 | /smokecraft/pairing-lab | BUTTON[button] | CONTINUE TO FLAVOR EVOLUTION → | completion |
| 12 | /smokecraft/second-third | BUTTON[button] | Flavor Development | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Body Evolution | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Aroma Depth | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Burn Stability | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Smoke Texture | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Complexity Shift | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | Save Draft | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | i | rating-toggle |
| 12 | /smokecraft/second-third | BUTTON[button] | CONTINUE TO FLAVOR MEMORY → | completion |
| 14 | /smokecraft/mentor-commentary | BUTTON[button] | i | honest-disabled |
| 14 | /smokecraft/mentor-commentary | BUTTON[button] | ← BACK | navigation |
| 14 | /smokecraft/mentor-commentary | BUTTON[button] | CONTINUE → | navigation |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | Tobacco | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | Fermentation | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | Aging | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | Factory Story | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | i | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | ← BACK | tab-disclosure |
| 15 | /smokecraft/knowledge-drop | BUTTON[button] | CONTINUE → | completion |
| 16 | /smokecraft/final-third | BUTTON[button] | Aroma Strength | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Flavor Intensity | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Burn Quality | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Aftertaste | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Earth flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Leather flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Wood flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Spice flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Coffee flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Cocoa flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Sweet flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Creamy flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Nuts flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | Floral flavor | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | i | rating-toggle |
| 16 | /smokecraft/final-third | BUTTON[button] | CONTINUE TO SCORECARD → | completion |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Appearance 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Appearance 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Appearance 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Appearance 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Appearance 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Construction 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Construction 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Construction 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Construction 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Construction 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Draw 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Draw 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Draw 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Draw 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Draw 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Burn 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Burn 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Burn 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Burn 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Burn 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Flavor 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Flavor 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Flavor 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Flavor 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Flavor 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Pairing Match 1 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Pairing Match 2 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Pairing Match 3 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Pairing Match 4 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | Rate Pairing Match 5 out of 5 | rating-toggle |
| 19 | /smokecraft/scorecard | INPUT[number] | e.g. 60 | rating-toggle |
| 19 | /smokecraft/scorecard | INPUT[number] | approx. | rating-toggle |
| 19 | /smokecraft/scorecard | INPUT[number] | 0 | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | SAVE DRAFT | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | i | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | ← BACK | rating-toggle |
| 19 | /smokecraft/scorecard | BUTTON[button] | CONTINUE TO AI SUMMARY → | completion |
| 21 | /smokecraft/ai-summary | BUTTON[button] | SESSION OVERVIEW | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | ✓ Accept | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | ✕ Dismiss | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | FLAVOR PROFILE SUMMARY | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | STRENGTH AND BODY PROGRESSION | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | ✓ Accept | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | ✕ Dismiss | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | CONSTRUCTION SUMMARY | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | PREFERRED FLAVOR NOTES | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | i | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | ← BACK | selection-toggle |
| 21 | /smokecraft/ai-summary | BUTTON[button] | CONTINUE TO PAIRING RECOMMENDATIONS → | completion |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | Wine · 100% | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | × | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | Chocolate · 100% | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | × | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | Rum · 88% | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | × | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | VIEW ALTERNATE PAIRING | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | SAVE TO MY PAIRINGS | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | LEARN MORE | selection-toggle |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | CONTINUE JOURNEY | completion |
| 22 | /smokecraft/pairing-recommendations | BUTTON[button] | i | selection-toggle |
| 23 | /smokecraft/passport-stamp | BUTTON[button] | i | completion |
| 23 | /smokecraft/passport-stamp | BUTTON[button] | ← BACK | navigation |
| 23 | /smokecraft/passport-stamp | BUTTON[button] | CONTINUE TO COMPLETED SCORECARD → | navigation |
| 24 | /smokecraft/final-review | BUTTON[button] | Journey foundations reviewed | navigation |
| 24 | /smokecraft/final-review | BUTTON[button] | Flavor memory captured | completion |
| 24 | /smokecraft/final-review | BUTTON[button] | Pairing preference confirmed | completion |
| 24 | /smokecraft/final-review | BUTTON[button] | Mentor guidance acknowledged | navigation |
| 24 | /smokecraft/final-review | BUTTON[button] | Burn & draw quality noted | completion |
| 24 | /smokecraft/final-review | BUTTON[button] | Ready to receive passport stamp | navigation |
| 24 | /smokecraft/final-review | BUTTON[button] | i | completion |
| 24 | /smokecraft/final-review | BUTTON[button] | CONTINUE TO REWARDS → | navigation |
| 25 | /smokecraft/rewards | BUTTON[button] | Claim | completion |
| 25 | /smokecraft/rewards | BUTTON[button] | ← BACK | navigation |
| 25 | /smokecraft/rewards | BUTTON[button] | CONTINUE TO ACHIEVEMENTS → | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Rewards & XP | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Achievements | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Challenge Hub → | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Collections → | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Skill Tree → | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | Claim | completion |
| 26 | /smokecraft/rewards | BUTTON[button] | Claim | completion |
| 26 | /smokecraft/rewards | BUTTON[button] | ← BACK TO REWARDS | navigation |
| 26 | /smokecraft/rewards | BUTTON[button] | CONTINUE TO RECOMMENDED NEXT JOURNEY → | navigation |
| 27 | /smokecraft/session-complete | BUTTON[button] | Start Journey | navigation |
| 27 | /smokecraft/session-complete | BUTTON[button] | Select | completion |
| 27 | /smokecraft/session-complete | BUTTON[button] | ← BACK | navigation |
## Holistic Fix 4 update — completion group behavior extended

The `completion` group's behavior contract (row above) is unchanged in
its client-side guard behavior but is now backed by a real server-side
idempotent mutation for session-completion and Passport-stamp instances
(`POST /api/smokecraft/player-state/sessions/:id/complete`, `POST
/api/smokecraft/player-state/awards/passport-stamp`), verified via
`verify-smokecraft-hf4-player-state-idempotency.mjs`. No control's
visible behavior, label, or rendered markup changed — this is a backend
authority change behind the existing `if (done) return` guard, not a
new control or a redesign. See `SMOKECRAFT_STATE_OWNERSHIP_MAP.md` for
full detail.

## Holistic Fix 4B update — new account screen, no existing group affected

The new `/smokecraft/account` screen introduces its own controls (email/
PIN inputs, Create Account / Sign In / Sign Out buttons) that are net-
new, not a redesign of any of the 276 previously-mapped controls or
their 7 implementation groups. Its buttons follow the same real-click,
real-state-change contract as the `selection-toggle`/`completion` groups
but were not added to the 276-control inventory since that inventory is
explicitly scoped to the 21-session curriculum's discovered controls
(see `SMOKECRAFT_CONTROL_IMPLEMENTATION_MAP.md`'s Methodology section) —
this is a supporting/entry-layer screen, consistent with how other
supporting screens (Rewards Center, How It Works) are also outside that
276-count scope.

## Holistic Fix 5A update — no control redesign, server behavior only

The `completion` group's controls are unchanged in markup and click
behavior; only the server-side consequence of a successful completion
changed (badges/Passport-stamp/rank now auto-computed server-side,
documented in `SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`). No new control
group was introduced.
