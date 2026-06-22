# SmokeCraft Phase 6 — Cigar Recommendation / Humidor Match

## Coverage note: how Phase 6 connects to the rest of the protocol

- **Phase 1 (User Profile Capture)** — `session.profile` (`experienceLevel`, `strengthPreference`, `occasion`, `budgetRange`, `flavorPreferences`) is read directly by the new recommendation engine to score every cigar.
- **Phase 2 (Cigar Shape/Size/Burn Time Education)** — `session.smokeCraft.selectedFormat.category` (one of `quick-smoke`/`standard-smoke`/`long-session`/`vip-slow-burn`) is matched against each cigar's `formatCategories`.
- **Phase 3 (Seed & Soil Pairing)** — `session.smokecraftSeedSoil.seedRegionId` is mapped to its real country (the same Phase 3 data-shape gap already documented for Phase 12 — only the region id is persisted) and matched against each cigar's origin country.
- **Phase 4 (Mentor Selection)** — `session.mentors[]` countries are matched against cigar origin for a small score bonus, and surfaced as an honest `mentorNote` on any card where a selected mentor's country matches.
- **Phase 5 (Gold Box Rules)** — no direct data dependency; Phase 6 runs after Gold Box in the flow, unchanged.
- **Phase 11 (Scorecard/Ranking/Badges)** — no scoring formula changes in this pass (out of scope); `selectedHumidorRecommendation` is available in session state for future Phase 11 enhancements.
- **Phase 12 (Passport Stamp)** — `PassportStamp.jsx`'s `buildStampPayload()` now prefers `selectedHumidorRecommendation` fields (`selectedCigarCountry`, `selectedWrapper`, `selectedStrength`, `selectedCigarName`, `selectedBurnTime`) over the previous honest `null` placeholders.
- **Phase 13 (Passport Connections)** — does not yet read these fields directly; the data is available in session state for future cross-referencing.

## What was added

- `src/utils/smokecraftHumidorMatch.js` — new pure recommendation engine, `computeHumidorRecommendations(session)`.
- `src/pages/smokecraft/HumidorMatch.jsx` — renders the Best Match / Step-Up Pick / Venue Featured Pick cards above the existing (unchanged) storage-condition selector; Continue now requires both a recommendation and a storage condition to be selected.
- `src/context/GuestSessionContext.jsx` — new `setSelectedHumidorRecommendation()` setter, persisting the exact spec'd field set to `session.smokeCraft.selectedHumidorRecommendation`.
- `src/pages/smokecraft/PassportStamp.jsx` — `buildStampPayload()` now fills `cigarCountry`/`wrapper`/`strength`/`cigarName`/`burnTime` from the selected recommendation when present.

## Recommendation triad behavior

- **Best Match** — the highest-scoring cigar across strength fit, format-category fit, Seed & Soil origin fit, flavor-note overlap, and mentor-country fit.
- **Step-Up Pick** — among the remaining cigars, the highest-scoring one with a strictly higher strength tier than the Best Match (a genuine "grow into this" pick); if none is more full-bodied, falls back to the next-best alternative with an honest reason instead of inventing a stronger option that doesn't exist in the catalog.
- **Venue Featured Pick** — a designated venue-promoted cigar (`isVenueFeatured: true` in the catalog); its card always shows its real computed match score and an honest reason, including saying explicitly when it's a lower fit for the guest's current profile rather than hiding that fact.

## Data used for matching

Real session data only: `session.profile`, `session.smokeCraft.selectedFormat`, `session.smokecraftSeedSoil.seedRegionId`, `session.mentors`. When any of these are missing, the affected scoring component is simply skipped (not faked), lowering the match score and the UI displays a note prompting the guest to complete earlier steps for a stronger match.

## Local/demo inventory behavior

Recommendations are scored against 4 real cigar SKUs already present in the app's POS3 inventory catalog (`src/data/pos3/inventoryCatalog.js`): `SKU-CIG-PAD64MAD`, `SKU-CIG-OPUSXROB`, `SKU-CIG-CHURCHRES`, `SKU-CIG-OLIVAVMEL`. Availability is read via the existing `inventoryAvailabilityService.checkAvailability()` — read-only, no stock is ever decremented from this screen. Brand/country/wrapper/strength/flavor/pairing descriptions are editorial cigar-catalog content (the same kind of descriptive text already used in `Format.jsx`/`SeedSoil.jsx`), not user-progress or inventory data.

## POS/backend pending behavior

- "Request from Staff" emits a `POS_HANDOFF_CREATED` / `CIGAR_RECOMMENDATION_REQUEST` event on the existing local `opsEventBus` and flips the button to "Requested — Pending Staff." No staff member is actually notified by this call.
- "Add to POS" emits a `POS_ADD_TO_TICKET_REQUESTED` / `ADD_CIGAR_TO_POS` event and flips the button to "Add to POS — Backend Pending." No real POS ticket is created.
- Every recommendation's `posActionStatus` field is explicitly `'Backend Pending'`.
- Price is shown as `null` with `priceStatus: 'Price pending POS sync'` — the inventory catalog only has a wholesale `unitCost`, not a real retail price field, so no price is fabricated.

## Demo Mode safety

The entire flow reads only `session` (local/in-memory guest session) and the local inventory-levels snapshot in `localStorage`. No real order is created, no real inventory is changed, and POS3/E.A.T. are never called beyond the existing local `opsEventBus` pending-event pattern already used by `RequestPurchase.jsx`.

## Scope

No POS3, E.A.T., CraftHub, Admin, or Founder system code was modified — only the existing local `opsEventBus`/`inventoryAvailabilityService` read/emit functions already used elsewhere in SmokeCraft were called from the new code.
