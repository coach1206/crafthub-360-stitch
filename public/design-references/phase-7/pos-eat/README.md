# Phase 7D/7E Reference Images — E.A.T. System Update

Image binaries were not available in the repo during this run. These references are preserved here as text-described visual direction only.

The two images were shared inline in the chat session (not as repo file uploads), and no matching binary was found anywhere in the repository or scratchpad after an exhaustive search across `attached_assets/`, `public/assets/eat/`, `public/assets/pos3/`, `public/`, and all ~100 `stitch_export/.../screen.png` design-exploration exports. They are documented below from direct visual inspection and are the authoritative direction for these two screens, overriding the older dark/navy-black E.A.T. mockups for these two screens specifically.

## Image 1 — `eat-system-mobile-update` (E.A.T. handheld/mobile, staff-facing)

**Screen purpose:** Staff (server/bartender) mobile home screen for table service, ordering, and payment — the day-to-day handheld workflow.

**Layout structure (top to bottom):**
- Header bar: hamburger menu icon, "EAT System" wordmark (navy) with "Powered by NOVEE OS" subtitle in gold underneath, greeting "Good Evening, Alex! 👋" with date/time/online status, bell notification icon with red badge count.
- Staff identity card (navy background band): staff photo, name "Alex Morgan", role "Server", "On Duty" status dot, two pill buttons "Scan Table" and "Quick Actions".
- "MY TABLES" section header with "View All" link — horizontal scroll of table cards (photo thumbnail, table number badge, guest count, time seated, running total).
- "ACTIVE ORDERS" section header with "View All" link — list rows (dish photo, table + dish name, status pill "In Progress"/"Ready", elapsed time, price).
- Full-width navy "+ New Order" button.
- Category tile grid (2 rows x 3 columns): Cigars, Drinks, Food, Humidor, Pairings, Hookah — each a photo tile with a circular icon badge and label.
- Two side-by-side panels: "PAYMENT" (total amount, Card/Cash/EAT Pay buttons) and "HUMIDOR" (low-stock badge, item thumbnail, "View Humidor" link).
- Fixed bottom navigation bar (navy): Home, Tables (badge), Orders (badge), Messages (badge), More.

**Color direction:** White/off-white page background; navy blue for header text, staff card band, and bottom nav; gold/amber accents for the "Powered by NOVEE OS" subtitle and pricing highlights; blue circular icon badges on category tiles; status colors (green = on duty/ready, blue = in progress).

**Key modules:** table roster, live order queue, quick-order categories, payment capture, humidor low-stock alert.

**Major buttons:** Scan Table, Quick Actions, View All (tables), View All (orders), + New Order, 6 category tiles, Card/Cash/EAT Pay, View Humidor, 5 bottom-nav tabs.

**Functional intent:** This is the staff handheld's primary dashboard — every tile should deep-link into a real workflow (table detail, order builder, category-filtered menu, payment sheet) rather than being decorative.

**Audience:** Staff-facing (servers/bartenders), not guest-facing, not admin-facing.

## Image 2 — `eat-system-command-center-update` (E.A.T. desktop/management command center)

**Screen purpose:** Manager/admin desktop dashboard for venue floor management — table layout, staff/section assignment, reservations, and live order/inventory oversight.

**Layout structure:**
- Top bar: "E.A.T. SYSTEM" wordmark with "POS 3" sub-label, "VENUE COMMAND CENTER" label and green "Online" status, system chips (Sync Status "All Systems Operational", wifi %, battery 100%, "Secure" lock, "Switch Mode"), notification bell with badge.
- Tab row: Floor Plan (active), Table Assignment, Sections & Zones, Reservations, Staff Assignment.
- Left sidebar (navy): Dashboard, Tables, Orders (badge), Reservations, Humidor, Payments, Inventory, Staff, Reports, Messages (badge), Settings — plus a manager identity card (Alex Morgan, Manager, On Duty) and a "COMMAND CENTER / Management Portal" callout card.
- Center: "FLOOR PLAN EDITOR" — drag/drop canvas with numbered table shapes color-coded by status (Available/Occupied/Reserved/Cleaning/Other legend), a "TABLE TOOLS" tray of draggable shapes (2 Top, 4 Top, 6 Top, Booth, High Top, Banquet, Lounge, Custom) with Quick Edit / Snap to Grid toggles.
- Right-side stacked panels: "TABLE DETAILS" (status/server/section/zone/seats/reservation/time/notes form with Save/Cancel), "QUICK ACTIONS" (Add Table, Remove Table, Move Table, Merge Tables, Split Table, Clear Area), "MY TABLES" (list with totals/times), "UNASSIGNED ORDERS" (count + list), "NEW ORDER" (category tabs, line items, Send Order), "HUMIDOR" (Popular/Premium/Rare tabs, featured item, quantity stepper, Add to Order).
- Bottom summary row: "TODAY'S SUMMARY" (sales/orders/avg check/guests), "STAFF PERFORMANCE" (per-staff sales), "INVENTORY ALERTS" (low-stock items), "SYSTEM CONTROLS" (Sound/Lighting/Music/Security toggles), "SYSTEM STATUS" (POS Terminals/Kitchen Display/Bar Display/Humidor Monitor/Security Cameras — each "Online").
- Bottom command navigation bar (navy): Dashboard, Tables, Orders (badge), Reservations, Messages (badge), Reports, Inventory, Staff, More, plus a gold "COMMAND CENTER / Management Portal" tile and "LOG OUT / End Session".

**Color direction:** White/off-white management canvas; navy for header, left sidebar, and bottom command bar; gold accent for the active tab, "Command Center" branding tile, and price/total highlights; status-color legend dots (green/red/amber/blue/grey) on the floor plan; blue accent on a few table markers.

**Key modules:** floor plan editor, table assignment, sections & zones, reservations, staff assignment, quick actions, my tables, unassigned orders, new order builder, humidor side panel, today's summary, staff performance, inventory alerts, system controls, system status.

**Major buttons/actions:** 5 top tabs, sidebar nav items, floor-plan table-tool tray, table-details Save/Cancel, 6 quick actions, new-order category tabs + Send Order, humidor Add to Order, system control toggles, bottom command nav, Log Out.

**Functional intent:** This is the manager/admin floor-management surface — table state changes, assignment edits, and new-order entry should reflect in local app state honestly (no fake live sync claims unless backed by real state); anything not yet wired (e.g., physical Sound/Lighting/Music/Security hardware controls) must be disabled with an honest reason rather than faked.

**Audience:** Management/admin-facing (E.A.T. command hub) — must remain gated behind `requiredPermission="access_eat_command"`, never exposed on guest routes.
