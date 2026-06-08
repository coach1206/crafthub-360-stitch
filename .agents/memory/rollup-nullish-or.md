---
name: Rollup nullish-coalesce vs logical-or mixing
description: Mixing ?? and || in the same expression without parentheses causes a hard Rollup build error in this project.
---

## Rule
Never write `a ?? b || c` in a single expression. Rollup (the bundler behind Vite build) rejects mixing nullish coalesce (`??`) and logical-or (`||`) without explicit grouping parentheses.

**Why:** The ES spec requires explicit disambiguation because `??` and `||` have different short-circuit semantics and equal precedence — engines and bundlers both reject ambiguous expressions at parse time.

**How to apply:**
- Replace `a ?? b || null` → `a ?? b ?? null` (if the intent is "first non-null")
- Or group explicitly: `(a ?? b) || c` / `a ?? (b || c)` depending on semantics
- The dev server (`vite dev`) may not catch this; `vite build` always does — always run a production build after writing migration / service files.
