# 01 — Executive Product Overview

## The platform in one paragraph

SmokeCraft POS360-EAT360 is a connected, premium cigar-lounge platform
inside CraftHub 360. A guest plays through a **27-session, 7-phase**
cigar-education game (SmokeCraft 360), can order real cigars from a
venue's live inventory (**Venue Humidor**), earns XP/rank/Passport
stamps/rewards as they go, and can compete in a flagship "build your own
cigar" competition (**Golden Box**). On the business side, venue staff
work Humidor and (aspirationally, floor/table) orders through **POS360**,
and venue managers/owners get oversight, inventory, staffing, and
reporting through **E.A.T. 360**.

## The four systems

1. **SmokeCraft 360** — the customer education game. 27 sessions across
   7 phases (enroll → identity → mentor → 21 curriculum sessions →
   scorecard/challenge → passport/rewards → session complete). Real,
   server-graded interactions for a documented subset of sessions (see
   `smokecraftRequiredInteractions.js`); every session issues XP/completion
   through one real, idempotent, server-authoritative endpoint.
2. **Venue Humidor** — customer-facing cigar catalog, cart, checkout,
   order tracking, pickup, and a full venue-admin back office (product
   CRUD, inventory events, media management, order queue, handoff,
   payments, fulfillment history, assisted selling).
3. **POS360** — staff-facing floor/order system, mounted at `/pos3/*`.
   Real screens for tables, handheld ordering, checkout, kitchen/bar
   display, humidor control, inventory control, floor management, menu
   builder, production display, offline sync, payments, reservations,
   event packages, staff/labor governance, reporting, settings, external
   integrations, and fulfillment/KDS — 20+ routed screens. **No dedicated
   proof/verification package exists for POS360 in this repo** — treat as
   implemented UI, not verified end-to-end behavior.
4. **E.A.T. 360** — management oversight system, mounted at `/eat/*`.
   Command hub, POS control, operations, inventory, reorders, staff,
   sections, kitchen, bar, humidor, data, reports, device mode, media
   library, settings, and a SmokeCraft panel — 15 routed screens.
   Adjacent higher-tier surfaces (NOVEE OS Ultra Command Center, NOVEE
   Vault, Remote Software Control, Venue Mirror Command Hub) are
   explicitly unbuilt `ModulePlaceholder` stubs gated behind
   founder/admin roles — **not** part of the built E.A.T. 360 surface.

## Why this platform exists (product framing)

- Turn a cigar purchase into an **educational, gamified experience**
  (SmokeCraft) that increases dwell time, repeat visits, and average
  spend.
- Let the same guest **order real product** from the venue's live
  humidor inventory without leaving the experience (Venue Humidor).
- Give staff a **single operational surface** to receive, fulfill, and
  hand off both education-driven and walk-in orders (POS360).
- Give management **cross-venue oversight** — inventory authority,
  staffing, reporting, reorder signals — without touching the guest
  experience (E.A.T. 360).

## Brand tone

Premium cigar-lounge: deep navy/charcoal base, champagne-gold accent,
serif display type (Playfair Display) paired with a clean sans body
(Montserrat). See `13-DESIGN-SYSTEM.md` for exact tokens pulled from
`tailwind.config.js`. Note: POS360/E.A.T. 360's actual command-shell
implementation (`CommandAppShell.jsx`) currently uses a *different*,
lighter ivory/navy/gold palette than SmokeCraft's dark
charcoal/gold Material palette — documented as a real, disclosed
inconsistency in `13-DESIGN-SYSTEM.md` and `17-KNOWN-LIMITATIONS...md`.

## What "done" looks like for this platform

A guest completes the SmokeCraft journey, orders a cigar through Venue
Humidor, that order is received and fulfilled by a staff member in
POS360 with full status visibility back to the guest, and a manager can
see the whole thing — inventory drawn down, payment settled, order
audited — in E.A.T. 360. Today, the SmokeCraft→Venue Humidor→customer
loop is proven live end-to-end. The Venue Humidor→POS360 staff handoff
exists as real code (`ManualPOS360HandoffPanel`, `VenueHumidorHandoff`
screen, `smokecraftHandoffService.js`) but is **explicitly labeled
"manual" and "not_persisted"** in its own UI copy — see
`05-CUSTOMER-TO-POS360-HANDOFF.md`. The staff-mode-switch dissolve
transition (`StaffPinScreen` → `/eat` or `/pos3`) is real and live; its
use for customer order-tracking status changes specifically is not — see
`06-SCREEN-DISSOLVE-AND-TRACKING-STANDARD.md`. The POS360→E.A.T. 360
escalation loop is UI-present but not proof-verified.
