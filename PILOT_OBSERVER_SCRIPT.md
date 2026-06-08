# NOVEE OS — Pilot Observer Script
## Phase 12: Real-World Venue Testing

> PROTOTYPE SYSTEM. No live payments. No live POS credentials. Tasting education only.
> Venue must follow local tobacco and alcohol laws.
> NOVEE OS provides guidance, not legal or health advice.

---

## Who This Is For

You are the **observer** — the person watching, not demonstrating. Your job is to record what the participant does, not to guide them.

This script tells you what to watch, when to stay quiet, when to step in, and how to score the experience.

---

## 1. Before the Test Begins

**Set up:**
- Device is on, charged, in landscape orientation
- Boot screen has cleared to the Home screen
- SmokeCraft is accessible from CraftHub
- If testing kiosk mode: kiosk lock is active before participant arrives

**Do NOT:**
- Pre-explain the UI
- Point to any elements
- Tell them what to tap next

**DO:**
- Tell them the setup line (from the Guest Test Script)
- Have your notepad or ObserverNotePanel ready
- Start the participant session timer in VenueTestControl

---

## 2. What to Watch

**Guest Journey:**
- Do they understand where to start without being told?
- Do they tap randomly before finding a pattern?
- Do they read the mentor descriptions, or skip straight to tapping?
- Does voice audio play and feel appropriate for the environment?
- Do they mute unprompted, or ask if they can?
- Do they understand the progress structure (how many steps remain)?
- Do they react to the Passport stamp moment — surprise, delight, confusion?
- Do they find the leaderboard meaningful or irrelevant?

**Key confusion signals to capture:**
- Pausing for more than 5 seconds with no action
- Saying "what do I do now?" or "how do I go back?"
- Tapping the same element more than once expecting a different result
- Backing out of a flow unexpectedly
- Laughing nervously (polite confusion)

**Key excitement signals to capture:**
- Leaning in, reading the content carefully
- "Oh, that's cool" or similar unprompted
- Showing the screen to a friend or staff member
- Returning to a screen voluntarily

---

## 3. What Not to Explain Too Early

Do not explain these during the test — they are what you are testing:
- How to start SmokeCraft (observe if they find it)
- What the mentor voice does (observe if it's clear)
- What the Passport stamp means (observe if it feels rewarding)
- How to return home (observe if they find the button)
- What kiosk mode does (observe if it prevents confusion or creates it)

If they ask directly, say: **"Just do whatever feels natural."**
If they are genuinely stuck for more than 90 seconds, you may offer one hint.

---

## 4. When to Intervene

Intervene if:
- The participant looks distressed or confused for more than 90 seconds with no progress
- A technical error (crash, blank screen, loop) prevents continuation
- The participant asks to stop
- A staff member accidentally disrupts the session

When you intervene, note it as an observer note with severity `high` and event type `task_failed`.

---

## 5. What to Record

Use the **ObserverNotePanel** in VenueTestControl during the session:

| Event Type | When to Use |
|---|---|
| `observation` | Anything worth noting — behavior, reaction, pause |
| `confusion` | Participant hesitates, looks lost, or asks for help |
| `excitement` | Unprompted positive reaction |
| `question` | Participant asks a question |
| `task_failed` | Participant could not complete a flow |
| `task_completed` | Participant completed a key step |

**For each note, include:**
- Screen name (e.g. `Mentor`, `Origins`, `PassportStamp`)
- What happened, in specific terms
- What the participant said or did

---

## 6. How to Score Confusion

After the session, use these guidelines when reviewing notes:

| Confusion Level | Signal |
|---|---|
| None | Participant navigated continuously without pausing |
| Low | 1–2 brief pauses (under 10 seconds), self-resolved |
| Medium | 3–5 pauses or asked 1 question |
| High | Multiple pauses, asked for help, needed intervention |
| Failed | Could not complete a core step without guidance |

Log medium/high/failed as issues with the appropriate severity level.

---

## 7. How to Score Excitement

| Excitement Level | Signal |
|---|---|
| None | Neutral, completed the task, moved on |
| Low | Smiled, engaged quietly |
| Medium | Commented positively, re-read content, asked a follow-up question |
| High | Showed someone else, expressed genuine surprise or delight |
| Exceptional | Requested to go through it again, asked "when is this live?" |

Add a `excitement` observer note with this context.

---

## 8. How to Score Staff Usability

Staff test is scored separately. Key signals:

- Did they find POS 3 without being directed? (`observation`)
- Did they understand the active orders feed immediately? (`observation`)
- Did they try to access manager-only panels? If so, was the block clear? (`observation` or `task_failed`)
- Did they use the recommendation preview? (`task_completed`)
- Did they ask "what does this number mean?" about any metric? (`confusion`)

---

## 9. After the Session

1. End the participant session in VenueTestControl (Completed / Partial / Abandoned)
2. Review your notes — add any you missed
3. Log any issues discovered
4. If testing multiple participants: use **Reset Demo Data** to clear prototype data between runs
5. After all sessions: run **Export JSON** and **Summary CSV** from VenueTestControl

---

## 10. Readiness Score Guide

The summary calculates a readiness score 0–100:

| Score | Meaning |
|---|---|
| 90–100 | Pilot-Ready — schedule venue dates |
| 75–89 | Pilot-Ready with Caution — address noted issues first |
| 60–74 | Needs Fixes Before Pilot — do not proceed to live venue yet |
| 0–59 | Not Ready — significant issues require resolution |
