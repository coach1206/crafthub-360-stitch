# SmokeCraft Phase 12 / Phase 13 Implementation Notes

This pass strengthened **Phase 12 (360 Passport Stamp)** and **Phase 13 (360
Passport Connections / Networking)** per `docs/smokecraft-protocol-audit.md`.
No other phase, route, or system (POS3, E.A.T., Admin, Founder) was touched.

## What was added

### Phase 12 — Passport Stamp payload enrichment
- `src/utils/passportProgress.js`: `awardPassportStamp(session, stampId, source, extra)`
  now accepts an `extra` payload object. On first award it's spread onto the
  new stamp; on re-award (e.g. revisiting the page) it merges onto the
  existing stamp rather than no-op'ing, so the stamp stays up to date.
- `src/pages/smokecraft/PassportStamp.jsx`: `buildStampPayload(session)` derives
  the full payload from real session state — `userId/guestId`, `smokeCraftSessionId`,
  `smokeCraftPassportId`, `userName`, `venue`, `eventName`, `date`, `cigarName`,
  `cigarType`, `burnTime`, `mentorNames`/`mentorIds`, `score`, `rankingLevel`,
  `badgeEarned`/`badgesEarned`, `pairingCompleted`, `seedRegion`,
  `soilSelections`, `networkingStatus`, `shareConsent`, `createdAt`.
- A new "Stamp Detail Card" renders this payload (Venue, Event, Date, Cigar,
  Mentors, Score, Badge/Ranking, Pairing Completed, Networking Status,
  Privacy/Share Status), each field falling back to an honest "Backend
  pending" label rather than inventing data.
- `src/pages/smokecraft/Scorecard.jsx`: `handleContinue()` now persists
  `{ scores, total, maxTotal }` to `session.smokeCraft.scorecard` before
  navigating — previously this was computed only in local component state
  and never saved, so Phase 12's `score` field had nothing real to read.

### Phase 13 — Connections / Networking consent + honest actions
- `src/services/sessionStorageService.js`: added
  `session.smokeCraft.passportConnections` (array), `networkingStatus`
  (string), and `networkingConsent` (8 named boolean fields) to
  `BLANK_SMOKE_CRAFT`, plus an additive migration top-up so existing v4
  sessions gain these fields without data loss.
- `src/context/GuestSessionContext.jsx`: added `setNetworkingConsent(fields)`
  and `recordPassportConnectionAction(actionId, status)`, exposed via the
  context provider.
- `src/pages/smokecraft/Connections.jsx`: rewritten to add —
  - A consent panel with the 8 spec'd fields (`allowShareStamp`,
    `allowShareName`, `allowShareContact`, `allowShareBusinessLinks`,
    `allowShareSmokeCraftLevel`, `allowShareFavoriteCigarStyle`,
    `allowShareEventStamp`, `allowVenueFollowUp`), shown with the required
    copy: *"Your SmokeCraft Passport details are only shared when you
    choose to share them."*
  - 9 honest networking actions (share stamp, exchange contact card, connect
    with another guest, use networking QR code, join leaderboard, follow
    venue, save mentor recommendation [private, no consent needed], join
    cigar circle, send a tasting note), each gated by the consent field it
    actually requires.
  - Status tracking per action using the spec'd status vocabulary
    (`consent_required`, `ready_to_share`, `shared_locally` are reachable
    from this page; `not_started`, `connection_pending`, `backend_pending`
    are supported by the model but not currently produced here).
  - Local/demo XP (`addXP(10)`) per completed action, clearly distinct from
    the existing flat 50 XP on Continue — no duplicate scoring system.

### Gamification loop closure
- `smokeWinnerService.js`'s existing `evalPassportConnector()` reads
  `session.smokeCraft.passportConnections` to evaluate the "Passport
  Connector" winner category. Before this pass nothing ever wrote to that
  field, so the category was unreachable. `recordPassportConnectionAction()`
  now writes to it, closing the loop without inventing a new scoring system.

## What is still local/demo only
- All Phase 13 actions in `Connections.jsx` only ever write `shared_locally`
  to session state — no real send, connection, SMS, or email occurs.
- The local XP awarded for networking actions is explicitly local/demo, not
  backend-verified (matches the pattern already used elsewhere in
  SmokeCraft, e.g. Passport stamp XP).

## What is backend pending
- `cigarCountry`, `wrapper`, and `strength` on the stamp payload are
  honestly `null` — Phase 3 (Seed & Soil) only stores a seed-region id in
  session state today, not country/wrapper/strength as distinct fields.
  Fixing this requires a Phase 3 data-shape change, out of scope here.
- `/passport/connections` (`PassportConnections.jsx`) and `/passport/events`
  (`PassportEvents.jsx`) were **not** touched in this pass. They still call
  fully mocked APIs with no real backend route, and still have no consent
  layer of their own.

## What is privacy/consent protected
- Every Phase 13 action with a `consentField` is blocked from completing
  (shows a lock icon, opens the consent panel) until the user explicitly
  grants that specific consent field. `mentor-rec` is the one exception —
  it's a private, on-device-only bookmark, not a share, so it requires no
  consent by design.
- Consent state (`networkingConsent`) and the resulting `shareConsent`
  snapshot are also carried onto the Phase 12 stamp payload, so the stamp
  honestly reflects what the guest has actually agreed to share.

## What still needs production backend later
- Real send/connect implementations for each of the 9 Phase 13 actions
  (SMS/email/contact exchange/QR/leaderboard sync/venue follow-up/etc.).
- A real backend route for stamp storage (`smokeCraftPassportId` persistence
  beyond local session storage).
- Wiring `/passport/connections` and `/passport/events` to real APIs, with
  their own consent layer matching the one now in `Connections.jsx`.
- A Phase 3 data-shape update to carry `cigarCountry`/`wrapper`/`strength`
  through to the stamp payload.
