# SmokeCraft 360 — AI Workflow Rules

## Visual Authority
The approved SmokeCraft image library is the sole visual authority.
No screen may deviate from its approved asset without founder approval.

## Asset Assignment
| Route | Approved Asset |
|-------|---------------|
| /smokecraft | /assets/smokecraft-reference/approved/smokecraft-landing.png |
| /smokecraft/enroll | /assets/smokecraft-reference/approved/smokecraft-entry-gate.png |
| /smokecraft/identity | /assets/smokecraft/IDENTY.png |
| /smokecraft/golden-box | /assets/smokecraft/GOLDEN BOX RULES.png |
| /smokecraft/mentor-selection | /assets/smokecraft/MENTOR SELECTION1.png |
| /smokecraft/format | /assets/smokecraft-reference/approved/smokecraft-vitola.png |
| /smokecraft/wrapper-strength | (redirect → seed-soil) |
| /smokecraft/seed-soil | /assets/smokecraft/SEED & SOIL.png |
| /smokecraft/pairing-lab | /assets/smokecraft/PAIRING LAB1.png |
| /smokecraft/humidor-match | /assets/smokecraft/humidor match 111.png |
| /smokecraft/request-purchase | /assets/smokecraft/REQUEST PURCHASE.png |
| /smokecraft/cut-toast-light | /assets/smokecraft/CUT, TOAST,& LIGHT22.png |
| /smokecraft/first-third | /assets/smokecraft/FIRST  THIRD1.png |
| /smokecraft/second-third | /assets/smokecraft/SECOND THIRD.png |
| /smokecraft/flavor-memory | /assets/smokecraft/FLAVOR MEMORY.png |
| /smokecraft/final-third | /assets/smokecraft/FINAL THIRD.png |
| /smokecraft/scorecard | /assets/smokecraft/Scorecard.png |
| /smokecraft/final-review | /assets/smokecraft/FINAL REVIEW.png |
| /smokecraft/passport-stamp | /assets/smokecraft/PASSPORT STAMP.png |
| /smokecraft/connections | /assets/smokecraft/CONNECTIONS.png |
| /smokecraft/management-sync | /assets/smokecraft/MANAGEMENT SYNC.png |
| /smokecraft/session-complete | /assets/smokecraft/SESSION COMPLETE.png |
| /smokecraft/leaderboard | /assets/smokecraft-reference/approved/smokecraft-leaderboard.png |
| /smokecraft/event-challenge | /assets/smokecraft-reference/approved/smokecraft-event-challenge.png |
| /smokecraft/how-it-works | /assets/smokecraft-reference/approved/smokecraft-how-it-works.png |

## Implementation Pattern

### Standard Screen
```jsx
<SmokeCraftAssetScreen src={APPROVED_ASSET} alt="..." />
{/* Fixed control panel at bottom above NavBar */}
<div style={{ position:'fixed', bottom:110, ... zIndex:400 }}>
  {/* Real React controls in blank zones */}
</div>
<SmokeCraftNavBar primary="Continue →" onPrimary={handleContinue} secondary="← Back" onSecondary={() => navigate(-1)} />
```

### Complex Form Screen
Same pattern but with a scrollable fixed panel that occupies bottom portion of viewport.

## Prohibited Actions
1. Adding rgba overlay/mask over any background image
2. Replacing approved image with generic card/layout
3. Adding floating navigation menus not part of approved composition
4. Adding giant bottom bars ("CONTINUE PREVIOUS SESSION", "START NEW SMOKECRAFT SESSION") to image-display screens
5. Showing duplicate controls (React + printed image buttons both visible)
6. Making printed image controls appear functional
7. Using `background-size: contain` on any LIVE_REACT_PAGE_ARTWORK
8. Adding controls outside the approved visual composition
9. Substituting artwork silently

## Control Rules
- All real interactive controls must be React DOM elements
- No transparent invisible hotspot overlays
- Printed image buttons are visual-only decoration
- React controls should be in clearly-delineated dark semi-transparent panels within the composition
- Minimum 44×44 touch targets
- Minimum 14px interactive label text
- Minimum 16px body text

## Session Guard Rules
- Session 1 (landing): No hideHeader — approved state shows progress header
- Session guards lock routes based on completedSessions array
- Demo mode (`sessionStorage.novee_demo_mode = '1'`) bypasses all locks
- WrapperStrength (S6) is a redirect — Format awards both format + wrapper-strength

## Journey Sequence (Canonical)
1. /smokecraft (landing)
2. /smokecraft/enroll
3. /smokecraft/identity
4. /smokecraft/golden-box
5. /smokecraft/mentor-selection
6. /smokecraft/format (awards S5 + S6/wrapper-strength)
7. /smokecraft/seed-soil
8. /smokecraft/pairing-lab
9. /smokecraft/humidor-match
10. /smokecraft/request-purchase
11. /smokecraft/cut-toast-light
12. /smokecraft/first-third
13. /smokecraft/second-third
14. /smokecraft/flavor-memory
15. /smokecraft/final-third
16. /smokecraft/scorecard
17. /smokecraft/final-review
18. /smokecraft/passport-stamp
19. /smokecraft/connections
20. /smokecraft/management-sync
21. /smokecraft/session-complete

Side routes (no session lock): leaderboard, event-challenge, how-it-works, smokecraft-challenge
