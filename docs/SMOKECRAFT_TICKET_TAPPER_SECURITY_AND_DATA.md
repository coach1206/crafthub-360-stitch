# SmokeCraft Ticket Tapper — Security & Data Findings

No backend code was modified this package (Phase 8/Task 8 of the mandate
— backend security changes were only in scope if a proven defect existed;
none was found requiring a backend change).

## Findings

1. **Venue scoping**: server-side tables (`ticket_tapper_specials`,
   `ticket_tapper_promotions`, etc.) are `venue_id`-scoped per the
   migrations audited in the Ticket Tapper identification correction.
   Not re-verified line-by-line this pass (out of scope — no backend
   files touched), but no client-side change in this package can leak
   another venue's data, since the only value passed to the venue-scoped
   endpoints is `journey.selectedVenue.id` or `null` (no default/fallback
   venue).
2. **Authentication**: the strip's fetches
   (`fetchTicketTapperSpecials`/`Inventory`, tap/add tracking) are
   unauthenticated `fetch()` calls — same as before this package. This is
   an existing condition, not introduced here. Documented as a known
   backend weakness, not fixed (per instruction: "Do not modify backend
   security unless a proven defect exists" combined with "Document any
   existing backend authentication weakness separately" — this is that
   documentation).
3. **Guest access to management endpoints**: `TicketTapperManagement.jsx`
   / `ticketTapperPromotionController.js` were not touched this package;
   no new guest-facing code in this pass calls any create/update/approve/
   publish endpoint — only `fetchTicketTapperSpecials`,
   `fetchTicketTapperInventory`, `trackTicketTapperSpecialTap`, and
   `trackTicketTapperSpecialAdd` are used from guest-facing routes.
4. **HTML injection / unsafe URLs**: the new `CompactSpecialChip`
   component renders `special.title`/pricing as React text content only
   (no `dangerouslySetInnerHTML`, no raw HTML), consistent with the
   existing full-mode `SpecialCard`. Image `src` values go through the
   same existing fallback-on-error handling as the full mode (`onError`
   swaps to a local static asset), not user-supplied HTML.
5. **Inventory status**: compact mode reuses the existing
   `InventoryBadge` component and `canOneTapOrderSpecial` util unchanged
   — real inventory data only, no new fabricated status.

## Not verified this pass (explicitly out of scope)

Live multi-venue isolation could not be demonstrated with two distinct
real venues in the running app because `/smokecraft/venue-select` has no
connected venue directory (`VENUES = []`) — see
`public/proof/smokecraft-ticket-tapper-focused-integration/no-cross-venue-leakage.txt`
for the full disclosure. Server-side enforcement of venue scoping was
audited by file/schema read in the earlier identification correction,
not re-tested against a live database this pass (no backend code changed).
