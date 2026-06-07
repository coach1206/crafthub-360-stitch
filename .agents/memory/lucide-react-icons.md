---
name: Lucide-react icon validation
description: Non-existent named imports from lucide-react silently crash React with a blank white page and no console errors.
---

## Rule
Always verify lucide-react icon names exist before using them. Non-existent named ESM exports cause the module to fail silently, preventing React from mounting.

**Why:** ES module named imports that don't exist evaluate to `undefined`. When React tries to render `undefined` as a component, the error boundary may catch it before any console output appears, leaving a completely blank white page.

**How to apply:** Run `node -e "const l = require('./node_modules/lucide-react'); console.log(typeof l.IconName)"` to verify. Known non-existent names found in CraftHub 360: `CloudDone` (use `Cloud`), confirmed existing: `Martini`, `Badge`, `GlassWater`, `Beer`, `Wine`, `Flame`, `LayoutDashboard`.
