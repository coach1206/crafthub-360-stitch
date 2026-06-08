---
name: lh3 URL truncation breaks images
description: lh3.googleusercontent.com/aida-public/ image URLs can be silently truncated when copy-pasted, causing broken img tags.
---

# Rule
Verify full URL length before using any lh3.googleusercontent.com/aida-public/ URL. Compare its length to a confirmed-working URL in the same context.

**Why:** Honduras and Mexico mentor card URLs were truncated/copy-pasted incorrectly. Working URLs in this project are ~200–300 chars long after `aida-public/`. Truncated ones were ~120 chars. The browser silently shows alt text — no console error, no React crash.

**How to apply:**
- When adding new lh3 URLs, paste the full raw URL from the original source
- If an image renders as alt text in a screenshot, measure URL length vs a working peer
- Mexico mentor was fixed using the Broadleaf Maduro leaf image (`AB6AXuC7N47z...`)
- Honduras mentor was fixed using the Habano Colorado leaf image (`AB6AXuAMxHg5...`)
- Both are tobacco leaf macro shots — cinematic and appropriate for the dark premium aesthetic
