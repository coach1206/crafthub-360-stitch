# SmokeCraft Investor Demo Guide

**Version:** MVP2 · **Audience:** Founders and venue administrators running investor demonstrations

---

## What to Show

The investor demo showcases the full 24-session SmokeCraft journey in demo mode. All session locks are bypassed; no real data is created; no orders are placed.

**Key moments to highlight:**

1. **Golden Box reveal** — the premium unboxing moment that opens the journey
2. **Flavor DNA selection** — guest builds their personal cigar taste profile
3. **Humidor Match** — AI-style cigar recommendation based on flavor profile
4. **Request Purchase** — seamless in-session cigar ordering (demo mode shows the flow without placing a real order)
5. **Scorecard** — structured tasting evaluation
6. **Passport Stamp** — reward mechanic and loyalty loop
7. **Leaderboard** — social proof and gamification layer

## Before the Demo

1. Log in with a `founder_level_0` or `admin` account.
2. Navigate to **Admin** → **Demo Controls** → **Reset Demo Defaults** to clear any previous demo data.
3. Activate Demo Mode.
4. Hand the device to the investor at the SmokeCraft home screen (`/smokecraft`).

## During the Demo

- Demo mode badge is visible in the top bar — do not hide it. It indicates the data is not real.
- All integration status labels will show honest fallback language ("Not configured", "Demo data") because no live integrations are active.
- Passport stamps earned in demo mode are not added to any real guest profile.

## After the Demo

1. Navigate to **Admin** → **Demo Controls** → **Reset Demo Defaults**.
2. Confirm the reset.
3. Exit demo mode.

The reset does not affect any real guest sessions on this device.

## Key Technical Talking Points

- **Image-first design:** Every session opens with a full-viewport premium photograph. No placeholders.
- **Session-gated progress:** The journey cannot be skipped. Each session unlocks only after the prior one is completed.
- **Real gate enforcement:** The Continue button is disabled until the guest satisfies the session's requirement (tasting note selection, acknowledgment, scoring).
- **Honest integrations:** The platform never shows "Connected" or "Ordered" without verified evidence from the integration.
- **Audit trail:** Every admin action, flag change, and role event is logged with actor, timestamp, and reason.
- **Rate limiting:** Production deployments enforce request-rate limits on all API endpoints.
