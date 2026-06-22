# CraftHub 360 / SmokeCraft / NOVEE OS — Marketing & Venue Handoff

Audit date: 2026-06-22. Latest main commit: `1662de3d` ("Merge pull request #3
from coach1206/claude/mentor-flag-badges"). Build verified passing
(`npm run build`).

This document explains the platform to a marketing venue, launch partner,
venue owner, investor, or demo reviewer in plain language — what it is, what
works today, what is demo/local, and what is still backend pending. Nothing
in this document changes runtime behavior; it is a description of the
existing build only.

## A. Project Overview

**CraftHub 360** is a hospitality experience platform built around premium,
ritual-driven guest journeys — currently fully built out for cigars
(**SmokeCraft**), with sibling verticals (wine, beer, coffee, spirits) staged
as "Coming Soon" using the same proven engine. **NOVEE OS** is the
operations/command layer underneath it — staff login, role permissions, POS
(point-of-sale) screens, and a member "Passport" that tracks a guest's
journey across visits.

**What problem it solves:** Premium lounges and clubs (cigar lounges, wine
bars, private clubs) currently have no digital layer connecting a guest's
in-venue experience to their identity, history, and preferences. Guests don't
get a personalized journey; staff don't get a unified operational view; the
venue doesn't get a retention or loyalty mechanism beyond a punch card.

**Who it is for:** Cigar lounges, private members' clubs, and experiential
hospitality venues that want a premium, technology-forward guest experience
plus a staff/management operations layer — and venue owners or investors
evaluating whether this platform is ready to discuss for their venue.

**Why a venue would care:** It turns a single visit into a structured,
guided journey (intake → preference discovery → pairing → mentor selection →
a passport "stamp" of the experience) and gives staff a single place to run
the floor — table/order/kitchen/bar/humidor workflows — while building a
long-term member record that can support retention and loyalty programs.

## B. Current Working Features

All of the following render, navigate, and behave correctly in the live
front-end build today:

- **CraftHub shell** — the top-level hub (`/crafthub`) linking to SmokeCraft
  and the other (Coming Soon) verticals.
- **SmokeCraft experience flow** — the full guided guest journey, ~20 steps,
  from enrollment through session completion.
- **SmokeCraft Intake** (`Enroll.jsx`) — guest identity/profile capture that
  seeds the rest of the session.
- **SmokeCraft Passport** — passport profile, stamps, directory, connections,
  events, benefits, and "How It Works" screens (`/passport/*`).
- **Cigar education/recommendation screens** — Origins, Curation, Leaves,
  Leaf Challenge (+ calculating/result), Cultivation, Blend, Flavor DNA,
  Terroir, Vitola.
- **Live cigar chips/cards** — Format, Available, Pairing, Pairing Mastery
  screens rendering real session-driven cigar data (no flat illustration or
  stock-photo fallbacks by design — missing photography renders an honest
  "Image pending" placeholder instead).
- **Wrapper/session interaction** — Cut/Toast/Light, First/Second/Final
  Third, Scorecard, Event Challenge.
- **Seed & Soil Pairing** (`SeedSoil.jsx`) — the soil/terroir pairing step of
  the journey.
- **Mentor Selection with country flags** (`Mentor.jsx`) — 8 mentor cards
  (Dominican Republic, Nicaragua, Honduras, Mexico, Cuba, Peru, USA, Brazil),
  each with a visible country flag badge, exact-two-mentor selection rule,
  and selected-state styling.
- **Passport Media Upload** (`SmokeCraftPassportUploadCard.jsx`) — guest media
  capture tied to the session, with upload status states.
- **POS3 route structure** — 11 management pages under `/pos3/*` (Home,
  Handheld, Tables, Orders, Checkout, Kitchen Display, Bar Display, Humidor
  Control, Inventory Control, Integration Hub, Settings), fully navigable and
  interactive on local data.
- **E.A.T. command structure** — 14 pages under `/eat/*` (Command Hub, POS
  Control, Operations, Inventory, Reorders, Staff, Sections, Kitchen, Bar,
  Humidor, Data, Reports, Device Mode, Media Library, Settings), fully
  navigable and interactive on local data.
- **Role protection** — server-side role/permission middleware
  (`requireRole`, `requirePermission`, `canAccessPOS3`, `canAccessEAT`) gates
  real backend routes; frontend `ProtectedRoute` gates page access by
  role/permission with a styled "Access Restricted" screen and a request
  -access flow.
- **Demo mode blocking** — `DemoModeContext` + `ProtectedRoute` block
  restricted internal routes (`/pos3`, `/eat`, `/admin`, `/founder`, etc.)
  from ever being reachable in a public demo session, regardless of any
  client-side role state.
- **Backend Pending disclosures** — a shared "Backend Pending" pill renders
  on every POS3 and E.A.T. page (via the shared `TopBar`), so local-only
  pages never imply they are talking to a live backend.

## C. Venue Demo Flow

A simple, repeatable walkthrough for a live demo:

1. User enters SmokeCraft from the CraftHub shell.
2. User completes intake (identity/profile capture).
3. User explores cigar profiles (Origins, Curation, Leaves, Vitola).
4. User selects preferences (Flavor DNA, Format, Pairing).
5. User experiences Seed & Soil Pairing.
6. User selects two mentors (with country flags) to shape their journey.
7. User uploads passport/mentor media via the Passport Upload Card.
8. User connects to Passport — stamps, directory, connections, benefits.
9. Staff/POS3/E.A.T. systems are shown as operational command layers —
   table management, kitchen/bar/humidor displays, inventory, reorders,
   staff/sections, reports.
10. Backend Pending areas are explained honestly using the disclosure pill
    already visible on those screens — this is a deliberate, built-in part
    of the demo, not something to hide.

## D. What Is Real vs Pending

**Real working front-end** (fully built UI/UX, navigable, no dead links):
- The entire SmokeCraft guest journey (intake through completion).
- Passport screens, Mentor Selection, Seed & Soil Pairing.
- All 11 POS3 pages and all 14 E.A.T. pages.
- Role-gated Admin/Founder screens, demo-mode blocking screens.

**Real local/session/demo behavior:**
- POS3 (`/pos3/*`) and E.A.T. (`/eat/*`) run entirely on `localStorage`,
  seeded from static sample data — tables, tickets, kitchen/bar queues,
  inventory levels, receipts, integrations all persist locally per browser,
  not across devices or staff.
- Demo Mode sessions are tracked and isolated by dedicated backend tables.

**Real backend services that exist today:**
- Staff PIN / admin / founder authentication (JWT-based) with real
  database-backed credentials and sessions.
- Server-side role/permission middleware enforcing access on real API
  routes (independent of, and stronger than, the frontend UI gating).
- SmokeCraft session/leaderboard/handoff data, with a real database path
  and an automatic local-storage fallback if the database is unreachable.
- Passport ranking and badges, via authenticated API routes.
- Ticket Ticker, with a real route — currently file-backed rather than
  database-backed.
- Demo session tracking, in dedicated, isolated database tables.
- POS3 third-party provider sync (Clover/Toast/Square) — built and working,
  but currently only used by the legacy `/pos` page, not the new `/pos3/*`
  page set.

**Backend Pending areas:**
- All 11 `/pos3/*` pages and all 14 `/eat/*` pages — local-only, not yet
  connected to the database tables that already exist for several of these
  areas (see `docs/backend-readiness-map.md` for the full per-table audit).
- Passport Connections and Passport Events — currently simulated responses,
  not live data.
- Card/split payment processing — explicitly returns "not configured";
  no real payment processor is connected anywhere in the product today.
- Kiosk/device login sessions — not implemented; handheld/kiosk screens
  currently require the same staff PIN login as everything else.

**Future database/storage/payment/SMS/email integrations** (not built yet):
- Production Postgres deployment with all migrations applied and
  `DATABASE_URL` set in the real deployment environment.
- First-party POS3 tables/tickets/queue/receipt persistence (the tables for
  some of this already exist; others would need to be designed).
- A real payment/POS processor integration.
- SMS/email provider integration for passport/media upload delivery links.
- Secure (non-local) image/media storage for guest uploads.
- E.A.T. staff/section assignment and reorder-request persistence.

## E. Marketing Positioning

CraftHub 360 / SmokeCraft is a **luxury cigar lounge intelligence platform**
— a personalized guest journey wrapped in a premium, cinematic, dark-and-gold
visual language, paired with a staff/POS management command layer:

- **Personalized guest journey** — intake, preference discovery, pairing,
  mentor selection, and a passport record of the experience.
- **Passport-based member experience** — a guest identity that persists
  across visits, with stamps, connections, and benefits.
- **Staff/POS/management command layer** — a full floor-operations system
  (tables, kitchen, bar, humidor, inventory, reports) built for staff, not
  just guests.
- **Venue engagement and retention tool** — a structured way to turn a
  single visit into an ongoing member relationship.
- **Premium hospitality tech experience** — built specifically for cigar
  lounges and private clubs, not a generic retail POS skinned for cigars.

## F. Demo Talking Points

1. "This isn't a generic POS with a cigar skin — it's a guided guest
   journey built specifically for the cigar lounge ritual."
2. "Every guest gets a personalized path: intake, preference discovery,
   pairing, mentor selection — ending in a Passport record of their visit."
3. "The Mentor Selection screen connects guests to real tobacco-growing
   regions and traditions — Dominican Republic, Nicaragua, Cuba, and more."
4. "The Passport is the member layer — it's what turns a single visit into
   an ongoing relationship with the venue."
5. "Behind the guest experience is a full staff operations layer — table
   management, kitchen and bar displays, humidor and inventory control."
6. "We're honest about where we are: every screen that isn't talking to a
   live backend yet says so, right on the screen — no guessing."
7. "The authentication and role-permission system is already real and
   server-enforced — staff, admin, and founder access are genuinely
   separated today."
8. "The SmokeCraft guest journey itself already has a real backend for
   sessions, leaderboards, and passport ranking."
9. "The architecture is proven — POS3 and E.A.T. are built the same way
   SmokeCraft was, so wiring them to the database is replication of a
   working pattern, not new invention."
10. "This build is ready to demo today, with a clear, honest map of what's
    live versus what's the next phase of work."

## G. Known Limitations

- Some POS3/E.A.T. surfaces are local/static until backend tables are wired.
- SMS/email upload links are pending provider integration.
- Some cigar images use temporary fallback "Image pending" states until
  final licensed photos are added (the product deliberately never shows a
  stock-photo or cartoon substitute).
- Image uploads are local/session-based unless secure storage is connected.
- Production deployment still needs final backend/database/storage
  configuration (e.g. applying server migrations and setting
  `DATABASE_URL` in the live environment).

## H. Next Build Phase

- Wire POS3/E.A.T. to backend tables (several of the needed tables already
  exist — see `docs/backend-readiness-map.md` §4).
- Add device/kiosk login sessions (a `device_sessions` design is already
  documented, not yet implemented).
- Add secure image storage for guest/passport media uploads.
- Connect SMS/email providers for upload delivery links.
- Add final licensed cigar images where "Image pending" placeholders
  currently render.
- Complete venue admin workflows (staff/section assignment, reorder
  persistence, events/specials).
- Production QA — re-verify the full route map and mobile layout against a
  deployed (not local) build.

## I. Handoff Summary

This build is ready for marketing/venue demo review, with backend-pending
areas clearly disclosed.
