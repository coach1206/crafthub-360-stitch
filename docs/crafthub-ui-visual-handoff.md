# CraftHub 360 UI / Visual Design Handoff

Functional baseline is locked. Designer scope is visual polish, responsive quality, accessibility, interaction clarity, and brand consistency.

## Functional baseline

- Repository: `coach1206/crafthub-360-stitch`
- Base branch: `recovery/smokecraft-codex-final`
- Functional closure PR: #45
- Merge commit: `f6a95c884feb2fce70f1764d073c7eb5f498321a`

Do not work from an older Coming Soon or screenshot-only branch.

## Locked architecture

- SmokeCraft remains the mature reference academy.
- PourCraft, BeerCraft, and WineCraft are active functional academies using shared server-authoritative gamification.
- Quizzes, pass gates, XP, ranks, badges, lesson completion, academy completion, and Passport-style awards must remain server-backed.
- SmokeCraft canonical scoring, Passport, Skill Tree, Collections, Challenge Hub, Golden Box, and related gameplay cannot be replaced with client-only logic.
- Every UI needs a visible entry path and an exit/back path.
- Material CraftHub activity remains connected to NOVEE OS event/governance flow.
- Authentication, signed guest identity, tenant boundaries, persistence, idempotency, API routes, and migrations are protected contracts.

## Visual direction

- Deep navy / near-black base with champagne-gold accents.
- Premium hospitality academy feel; refined, not flashy.
- Large, readable typography suitable for adults roughly 45-75.
- High contrast and visible focus states.
- Clear clickable controls; no mystery hotspots.
- No prefilled quiz answers, sliders, or form choices unless restoring saved state.
- Use a consistent professional icon system; no emoji/glyph substitutions.
- Reuse approved repository imagery where available.
- Diverse mentor representation and global hospitality tone.

## Main screens

### CraftHub /crafthub
- Active cards for SmokeCraft, PourCraft, WineCraft, BeerCraft, Passport, Staff Handoff, DayOne360.
- Remove any residual Coming Soon treatment for the three sibling academies.
- Preserve Back to NOVEE OS and Home.
- Desktop premium card grid; responsive tablet/mobile layout.

### SmokeCraft /smokecraft
Visual-polish scope includes:
- 27-session / 7-phase learning journey
- quizzes and educational visuals
- XP / ranks / badges / stamps
- Skill Tree / Collections / Challenge Hub
- tasting, pairing, blend-fault, filler-arrangement and other skill activities
- mentor selection/guidance
- Golden Box and Packaging Studio
- Passport
- Venue Humidor / commerce / staff-admin surfaces

Do not re-architect these flows.

### PourCraft /pourcraft
Shared academy shell with subject-specific visual content:
- cocktail craft
- measured pours
- classic builds
- pairing/service
- responsible pour

### BeerCraft /beercraft
- style fundamentals
- draft quality
- flight tasting
- pairing

### WineCraft /winecraft
- wine structure
- tasting method
- cellar/service
- pairing

## Shared academy layout

- Header: academy title + descriptor
- Back to CraftHub
- Exit to NOVEE OS
- XP / Rank / Lessons / Awards status cards
- lesson navigator with Open / Quiz Passed / Complete states
- educational lesson body
- knowledge check
- visible Working / Passed / Not Passed / Complete / Error messaging
- completion reward feedback
- mobile layout must collapse the two-column lesson-nav pattern cleanly

## Required states

Design all of these:
- loading
- empty
- locked prerequisite
- quiz ready
- quiz submitting
- quiz passed
- quiz not passed
- lesson complete
- badge/rank reward
- API/network error
- session recovery

Never leave a wait state visually silent.

## Responsive acceptance

- Mobile: 375-430px class devices
- Tablet: 768-1024px
- Desktop: 1280-1440px+
- no horizontal scrolling
- no clipped labels/images/buttons
- comfortable touch targets
- no hidden primary actions
- visible entry and exit controls at every breakpoint

## Do not change

- route names/guards
- API contracts
- server scoring or reward authority
- idempotency / duplicate-submit protection
- signed guest/account identity
- database schema or migrations for visual convenience
- NOVEE OS connectivity
- required entry/exit navigation
- approved SmokeCraft assets without owner direction

## Designer deliverables

1. High-fidelity CraftHub home.
2. Shared responsive academy shell for PourCraft / BeerCraft / WineCraft.
3. SmokeCraft consistency/polish pass.
4. Component state library.
5. Mobile/tablet/desktop core-flow screens.
6. Design-token sheet: typography, spacing, radii, borders, shadows, gold/navy/status/focus tokens.
7. Asset map.
8. Developer handoff with exact responsive and interaction rules.

## Owner visual acceptance

Visual work is accepted only when functionality, responsiveness, entry/exit paths, gamification persistence, Passport behavior, authentication, and NOVEE OS connectivity remain intact.
