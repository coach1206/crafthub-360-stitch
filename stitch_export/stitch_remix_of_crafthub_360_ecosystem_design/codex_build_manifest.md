# CraftHub 360: Codex-Compatible Build Package

## 🛠️ Build Configuration (No-Drift)
This package is engineered for absolute visual fidelity. To prevent 'Plain Jane' drift, all styles are pre-compiled and dependencies are strictly locked.

## 📂 Directory Structure (Preserved Hierarchy)
- `/public` - Asset Manifest (Logos, Obsidian Textures, Icons)
- `/dist` - Production-Ready Build
  - `/assets`
    - `styles.min.css` (Minified, pre-compiled Tailwind output)
    - `bundle.js` (Compiled logic)
- `package.json` (Locked dependency environment)
- `codex-config.json` (Rendering engine override)

## 🚀 Export Protocol
1. **Asset Manifest**: All visual assets have been moved to the `/public` root. Relative paths are now absolute `{{IMAGE_URL}}` references within the build.
2. **Environment Lock**: `package.json` contains fixed versions to prevent auto-updates.
3. **Compiled CSS**: Stylings are bundled into `dist/assets/styles.min.css`.
4. **ZIP Archive**: Download the `dist/` directory as a ZIP to maintain the hierarchy.

## 🛡️ Governance
**BUILD_STATUS**: COMPATIBLE
**VERSION**: 3.60.0-CODEX
**AUTHORITY**: FOUNDER LEVEL 0