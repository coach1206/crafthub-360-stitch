# SmokeCraft 360 — Ticket Tapper Identification (Evidence File)

**Status: CORRECTED — REAL IMPLEMENTATION FOUND. Prior verdicts in this
file and in this session's earlier package reports ("TICKET TAPPER — NEEDS
USER IDENTIFICATION") were wrong and are retracted below.**

## Correction notice

Earlier passes in this session searched for terms including `Ticket
Tapper`, `tapper`, `ticker`, full git history, and all branches, and
concluded no implementation existed anywhere in the repository. That
conclusion was incorrect — a complete, real, production-quality Ticket
Tapper implementation exists. It was missed because those searches
targeted `src/components/`, `src/pages/`, approved image assets, and git
history, but never enumerated `server/db/migrations/` filenames or
`server/routes/` directly for the term "tapper", which is where it was
ultimately found (`071_ticket_tapper_promotions.sql`, discovered
incidentally during an unrelated backend architecture audit). This was a
genuine research gap, not an ambiguous naming judgment call.

## What actually exists (verified by direct file reads, not inferred)

### Backend
- `server/db/migrations/017_ticket_tapper_specials.sql` — tables:
  `ticket_tapper_specials`, `ticket_tapper_special_events`,
  `ticket_tapper_inventory`, `money_bridge_partner_food_events`,
  `venue_tax_config`, `venue_feature_settings`.
- `server/db/migrations/071_ticket_tapper_promotions.sql` — tables:
  `ticket_tapper_promotions`, `ticket_tapper_promotion_rules`,
  `ticket_tapper_promotion_redemptions`,
  `ticket_tapper_management_audit_log`. UUID PKs, `venue_id` scoping
  throughout, CHECK constraints on `promotion_type`/`status`/
  `promoted_by_role`/`approval_status`, indexes on venue+status,
  promotion, and audit timestamp.
- `server/controllers/smokecraftTicketTapperSpecialsController.js`,
  `server/controllers/ticketTapperPromotionController.js`.
- `server/services/ticketTapper/ticketTapperPromotionService.js`.
- `server/routes/ticketTapperPromotionRoutes.js` — real REST endpoints:
  `GET /health`, `GET /`, `POST /`, `GET /smokecraft/active`,
  `GET /audit-log`, `POST /redemption`, `POST /audit/event`,
  `GET/PATCH /:promotionId`, `POST /:promotionId/activate`,
  `POST /:promotionId/deactivate`.
- `server/routes/smokecraftTicketTapperSpecialsRoutes.js`.

### Frontend
- `src/components/smokecraft/TicketTapperSpecialsStrip.jsx` (345 lines,
  full file read) — a complete auto-scrolling marquee ticker: real API
  tracking calls (`trackTicketTapperSpecialTap`,
  `trackTicketTapperSpecialAdd`, from
  `src/services/smokeCraftTicketTapperSpecialsApi.js`), inventory-aware
  `InventoryBadge` (SOLD OUT / ONLY N LEFT), CSS keyframe marquee
  animation that pauses on hover, an honest empty state ("Specials coming
  soon" with no fabricated data when there are zero specials),
  partner-special venue opt-in filtering
  (`venueFeatureSettings?.partnerSpecialsAllowed`), a "LOCAL PREVIEW"
  honesty badge, role labels (Manager Pick/Bartender Pick/etc.), real
  pricing with discount calculation, and a one-tap "Add Special" ordering
  flow.
- `src/components/smokecraft/StaffSpecialsControlPanel.jsx`.
- `src/pages/ticketTapper/TicketTapperManagement.jsx` — registered in
  `App.jsx` at route `ticket-tapper/management`.
- `src/data/smokeCraftTicketTapperSpecials.js`,
  `src/utils/smokeCraftSpecialsEngine.js`,
  `src/utils/venueFeatureSettings.js`.

### Confirmed wired into the live app
`src/pages/smokecraft/SmokeCraftVenueCommerce.jsx` line 19 imports
`TicketTapperSpecialsStrip`; line 579 renders it.

## Scope

Ticket Tapper is used **only** on the commerce/menu-ordering screen
(`SmokeCraftVenueCommerce.jsx`) — it is not present on any of the 33
educational-journey routes (Golden Box, Mentor Selection, Seed & Soil,
etc.) that were the subject of this session's route-by-route visual
acceptance review. That is why it never surfaced during that review; it
does not explain why the earlier dedicated searches missed it.

## Prior sections retracted

Everything below the "Correction notice" heading in the previous version
of this file — the "NEEDS USER IDENTIFICATION" status, the claim that
`TicketTicker.jsx` was "the only ticker/tapper-type component anywhere in
the repository," and the request for the user to supply a reference — is
superseded by the findings above and should be disregarded.

## Open question for the user — resolved

The user approved extending Ticket Tapper scope to
`/smokecraft/venue-select` (compact) and `/smokecraft/session-complete`
(compact), in addition to its existing full presentation on SmokeCraft
Venue Commerce. All other 30 full-bleed journey routes remain excluded.
See `docs/SMOKECRAFT_TICKET_TAPPER_FOCUSED_INTEGRATION.md` for the
implementation delivered under that approval.
