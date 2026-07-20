# SmokeCraft Image Integration — Post-Integration Gap Audit

Honest audit of what remains after this pass. This pass wired the Golden Box production image set
(8 assets) into the 5 Package 7A screens (Judge Dashboard, Judge Entry Review, Mentor Review, Results
Experience, EntryWorkspace presentation step) via the existing `MediaSlot`/`SC_ASSETS` pattern. It did
**not** attempt the full 27-session lesson-art rewire — that is a much larger scope than what "place
the newly uploaded images and audit the rest" can honestly cover in one controlled pass, and doing it
shallowly (wiring 59 remaining images across a dozen protected/near-protected screens without per-screen
verification) would risk exactly the kind of fake-completion this whole session has been built to avoid.

| # | Category | Severity | Route/Component | What's wrong | Why it matters | Recommended fix | Dependency |
|---|---|---|---|---|---|---|---|
| 1 | IMAGE_UPLOADED_NOT_WIRED | Medium | Leaf-to-Cigar construction screens (no dedicated route found — content currently lives inside FirstThird/SecondThird supporting modules) | 24 construction images (APPLYING THE BINDER/WRAPPER, BUNCHING METHODS, MOLDING & PRESSING, FORMING THE CAP, CIGAR ANTOMY, RING GAUGE GUIDE, VITOLA & SHAPE GUIDE, SOIL TYPES, TERROIR & GROWING REGION MAP, Tobacco Plant/Seed images, etc.) are uploaded and inventoried but not wired to any screen or `SC_ASSETS` key | Learners get no visual for the leaf/construction educational content these were clearly commissioned for | Map each image 1:1 to its matching educational panel inside the locked session sequence, register `SC_ASSETS` keys, wire via `MediaSlot` | Requires identifying the exact panel per image — a dedicated pass |
| 2 | IMAGE_UPLOADED_NOT_WIRED | Medium | Tasting/sensory screens (Scorecard.jsx, FlavorMemory.jsx, FinalThird.jsx) | 13 tasting images (Palate Calibration, Blend Fault Identification, Blind Tasting Challenge/Round, Draw And Burn Prediction, Pre-light evaluation, Burn Problems, Complete Flavor Wheel, Smoking Techniques) uploaded, not wired | Same as above for the tasting/judging-calibration educational arc | Same approach as #1 | Same |
| 3 | IMAGE_UPLOADED_NOT_WIRED | Low | Construction challenge screens (LeafChallenge*.jsx family) | 4 challenge images (Filler Placement, Virtual Rolling, Wrapper Application, Choose Your Cut) uploaded, not wired | Challenge screens currently text/data-only | Wire per-challenge hero art via `MediaSlot` | None — safe follow-up |
| 4 | IMAGE_UPLOADED_NOT_WIRED | Low | Mentor selection/profile screens | `MARCO RODRIGUEZ MENTOR.png`, `MEET YOUR MENTORS.png` uploaded, not wired | Mentor roster already has its own approved-portrait mechanism (`directSrc` on `MediaSlot`) that these weren't checked against | Confirm whether these are meant to replace/extend the existing mentor roster art before wiring, to avoid a conflicting second source of truth | Needs a decision, not just wiring |
| 5 | DUPLICATE_ASSET_CONFLICT | Low | `public/assets/smokecraft/golden-box/` | `golden-box-challenge.png` and `golden-box-challenge-alt.png` are near-duplicate Golden Box challenge card art; only the first is registered/wired | Two candidate images for the same visual slot | Human pick of primary; register the other as an explicit alternate or archive it, don't silently keep both live | None blocking |
| 6 | DUPLICATE_ASSET_CONFLICT | Low | `public/assets/smokecraft/session-visuals/` (14 files) | Byte- or filename-duplicate of already-live top-level production assets (ACHIEVMENTS, AI SUMMARY, KNOWLEDGE CHECK/DROP, LEADERBOARD, LIGHTING TUTORIAL, MENTOR COMMENTARY, MINI TASTING, REWARDS, RECOMMEND NEXT JOURNEY, SMOKECRAFT CHALLENGE, VENUE SELECTION, PERSONALIZED PAIRING, SMOKECRAFT BADGES) | Redundant files sitting in `session-visuals/`, not registered, not referenced — dead weight, easy to confuse with the real production copy later | Flag as `LEGACY_REFERENCE`/`DUPLICATE_REPLACED` (done in inventory doc); a future cleanup pass can archive them once confirmed byte-identical to the live copies | Low priority |
| 7 | BAD_NAMING | Low | `public/assets/smokecraft/session-visuals/` and top-level | Most uploaded filenames are raw camera-case with spaces, typos ("FERMINATION", "FILLEW", "Juding", "ligh evaluation", "Predition", "Indentification"/"Identifacaton") | Not production-clean, awkward as URL paths (must stay percent-encoded), typos would propagate into any `alt` text copied verbatim | Normalize (lowercase-hyphenated) at the same time each image is actually wired into a screen, as done for the Golden Box set this pass — renaming 59 files with nothing yet pointing at them ahead of that decision risks renaming things twice | Tied to #1/#2/#3 |
| 8 | WIRED_BUT_NONINTERACTIVE | Low | The 6 new `MediaSlot` instances added this pass (Judge Dashboard, Judge Entry Review, Mentor Review, Results Experience, EntryWorkspace) | These are decorative header images, not click-to-expand hotspots | Matches the existing `MediaSlot` pattern used everywhere else in SmokeCraft (headers are decorative, hotspots are a separate, deliberate mechanism used only on true anatomy/diagram screens) — not a regression, an intentional consistency choice | None needed unless a future pass wants dedicated construction-diagram hotspots (see #1) | None |
| 9 | STILL_MISSING_SYSTEM | Info | N/A | Package 7B/7C/7D visuals (Rewards Center, Skill Tree, Challenge Hub) still don't exist as screens, so their images (if any were uploaded) have nowhere to go yet | Expected — those systems are explicitly out of scope until their own passes | N/A | Package 7B/7C/7D |

## What is genuinely done vs. still needed

**Done, tested, real**: Golden Box production folder created and normalized (9 files moved/renamed);
8 new `SC_ASSETS` keys registered; 6 screens now show real, non-placeholder header art via the existing
`MediaSlot` fallback-safe component; build passes; Package 7A's 33/33 suite re-confirmed green with the
new imagery present; no regression introduced.

**Still needed** (explicitly not claimed complete): wiring the remaining ~59 discovered images into the
locked 27-session construction/tasting/challenge/mentor screens. This is real, substantial follow-up
work — each image needs to be matched to its exact intended panel inside protected/near-protected
screens, which the 12-step image-integration mandate itself flags as requiring per-screen responsive
and accessibility verification. Attempting all of it in this single pass would mean either shipping
unverified wiring across a dozen screens or silently skipping the verification steps the mandate itself
requires — both are the shallow-completion failure mode this entire session has been built to avoid.
