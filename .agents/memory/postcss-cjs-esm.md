---
name: PostCSS CJS vs ESM config
description: When package.json has "type":"module", PostCSS config must use .cjs extension.
---

## Rule
When a project has `"type": "module"` in package.json, name the PostCSS config `postcss.config.cjs` with `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`.

**Why:** postcss-load-config uses `require()` internally to load the config. A `.js` file is treated as ESM under `"type":"module"`, which breaks `require()` resolution and throws "Cannot find module 'tailwindcss'" even when the package is installed.

**How to apply:** Delete `postcss.config.js`, create `postcss.config.cjs` with CommonJS syntax. Tailwind config (`tailwind.config.js`) can remain as ESM since Vite loads it differently.
