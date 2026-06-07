---
name: Vite dep cache dual-React issue
description: Mid-session dep optimization in Vite 4 creates mismatched React version hashes, causing useContext null errors.
---

## Rule
When adding new deps (framer-motion, lucide-react) to a running Vite 4 dev server, it re-optimizes mid-session and creates new cache entries. If the browser has cached old module hashes, React hooks fail with "Cannot read properties of null (reading 'useContext')".

**Why:** Vite's dep optimizer creates versioned bundles (e.g. `react.js?v=abc123`). If some modules were compiled with the old version hash and others with the new one, React ends up as two instances — hooks fail because they can't find the React context.

**How to apply:**
1. Add `optimizeDeps: { include: ['react','react-dom','react-dom/client','react-router-dom','framer-motion','lucide-react'] }` to `vite.config.js` so all deps pre-bundle at startup.
2. If the issue occurs mid-session: `rm -rf node_modules/.vite`, restart the workflow. The browser then gets fresh consistent hashes.
