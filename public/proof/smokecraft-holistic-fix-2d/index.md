# Holistic Fix 2D — Proof Index

Starting commit `79ee6cb4`. Pairing-adjacent family: 5 real routes.

## Route purposes and relationship to other pairing systems (investigated this pass)

| Route | Component | Purpose | Reachable from live app? |
|---|---|---|---|
| `/smokecraft/pairing` | `Pairing.jsx` | "Your Blend Pairing Guide" — an approved-image reference screen with real Back/Continue hotspots, Continue resolves through `resolveSmokeCraftLandingAction` | **Yes** — Landing's PAIRING action, Welcome's bottom-strip "Pairing" link, `CommandHub` ticker, `venueHomeContent.js` |
| `/smokecraft/available` | `Available.jsx` | "Curated Selection" — a cigar-recommendation catalog screen (own header: "Step 10") | No — orphaned |
| `/smokecraft/assistant` | `Assistant.jsx` | Honest `ComingSoon` placeholder ("SmokeCraft Assistant") | No — orphaned |
| `/smokecraft/pairing-mastery` | `PairingMastery.jsx` | Honest `ComingSoon` placeholder ("Spirit Pairing Mastery") | No — orphaned |
| `/smokecraft/vitola` | `Vitola.jsx` | Real "Cigar Anatomy, Vitola & Sensory Practice" reference tool, backend-integrated (`seedSoilApiClient`, `flavorPairingApiClient`) | No — orphaned |

**Confirmed via grep across `src/pages/` and `src/components/`**: `available`,
`assistant`, `pairing-mastery`, and `vitola` have zero live `navigate()`/
`to=`/`href=` references anywhere in the app. Their only references are in
`src/constants/session.js`'s `SMOKECRAFT_FLOW` array — explicitly commented
`// Legacy / supplemental steps (not in main flow order)` — which is
consumed only by `src/modules/smokecraft/smokeCraftModule.config.js` →
`src/modules/moduleRegistry.js` → `NoveeOSModuleRegistry.jsx`, an
**admin-only platform module listing page**, never live guest navigation.
`/smokecraft/pairing` is the one exception — genuinely reachable.

## Relationship to Pairing Lab, Personalized Pairing Recommendations, Humidor Match

**No merge or redirect performed — confirmed distinct, not the same
feature:**
- **Pairing Lab** (`/smokecraft/pairing-lab`, S11, `SmokeCraftSessionGuard
  sessionNumber={11}`) — a guarded curriculum spine screen.
- **Personalized Pairing Recommendations** (`/smokecraft/pairing-recommendations`,
  S22, `SmokeCraftSessionGuard sessionNumber={22}`) — a guarded curriculum
  spine screen.
- **Humidor Match** (`/smokecraft/humidor-match`, S2, `SmokeCraftSessionGuard
  sessionNumber={2}`) — a guarded curriculum spine screen.
- **`/smokecraft/pairing`** — ungated, standalone, a different component
  (`Pairing.jsx`) entirely.

`scripts/validateSmokecraftShellAdoption.mjs`'s new collision guard
confirms programmatically (by resolving each route's registered component
in `App.jsx`) that all 5 resolve to 5 distinct components — 0 collisions.
It also confirms `smokecraftNavigationRegistry`'s `PAIRING` (`pairing-lab`)
and `PAIRING_STANDALONE` (`pairing`) keys remain distinct values.

## Relationship to the 27-session spine

None of the 5 target routes has a `SmokeCraftSessionGuard` or a
`SMOKECRAFT_SCREEN_MANIFEST` entry — none is part of the spine.
`/smokecraft/pairing` is landing-reachable but session-independent (same
architecture pattern as CraftHub/Leaderboard/Rewards Center — a
supporting destination, not a curriculum step).

## Dead controls found and repaired: 0

## Honest unavailable states confirmed (not defects)

- **Available.jsx**: the "drink pairing suggestions" button on all 4
  cigar cards is a real, focusable, `disabled` `<button>` with the
  accessible title `"Drink pairing suggestions are not yet available —
  ask staff for a recommendation"` — confirmed via direct DOM inspection
  (`$$eval('button', ...)`), not fabricated availability.
- **Assistant.jsx / PairingMastery.jsx**: both render the existing,
  honest `ComingSoon` component (not a fabricated feature).

## Pairing-engine gaps recorded for the gameplay-engine package (confirmed absent, not built this pass)

None of the following exist as a real backend engine anywhere in this
module or its API clients — confirmed via source read of
`Available.jsx`, `Vitola.jsx`, and their imports:
- Cigar strength/body/wrapper/vitola scoring beyond static display values
  in `Available.jsx`'s hardcoded `CIGARS` catalog (real display data, not
  a computed matching engine).
- Liquor proof/sweetness/oak/spice/finish attributes — no liquor catalog
  exists anywhere in this module.
- Complement/contrast pairing rules — no rules engine exists; `Available.jsx`'s
  drink-pairing button is honestly disabled for exactly this reason.
- Palate history / explainable recommendations / alternatives — no
  persistence or explanation layer exists.
- Mentor guidance specific to pairing — not integrated into any of these
  5 screens (Vitola.jsx uses Golden Box's `EducationalDetailPanel` for
  general cigar-anatomy education, not pairing-specific mentor guidance).
- Persistence: `Available.jsx` does call real `addFavorite`/`addXP`/
  `completeStep` (shared guest-session writes), so cigar *selection* is
  persisted; pairing *recommendations* are not, since none are computed.

## Five-viewport result

25/25 clean (no horizontal overflow, no console error) across all 5
routes × 5 viewports (handheld-portrait, tablet-10in, tablet-12in,
display-15in, desktop). Keyboard focus reached a real control in 25/25.

## Connected flow result

Pairing (real Back/Continue hotspots, confirmed present) → Available
(4 real cigar cards with real Select buttons + 4 honestly-disabled
drink-pairing buttons + a real gated Continue) → Assistant (honest
ComingSoon) → Pairing Mastery (honest ComingSoon) → Vitola (real
84-element interactive reference tool with a real Continue to
`/smokecraft/identity`). All screens render real content; no fabricated
pairing results, mentor guidance, cigar/liquor profiles, or backend
availability found anywhere.

## Test references

`scripts/validateSmokecraftShellAdoption.mjs` (extended to 34 files, plus
2 new pairing-collision checks), `scripts/validateSmokecraftManifest.mjs`
(fullyMigratedScreens cross-check now covers 37 routes: 7 + 16 + 9 + 5),
`verify-smokecraft-hf2d-pairing-adjacent.mjs` (this directory's raw
results).
