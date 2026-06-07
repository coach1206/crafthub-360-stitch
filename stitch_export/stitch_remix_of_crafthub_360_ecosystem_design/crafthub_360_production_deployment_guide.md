# CraftHub 360: Production Deployment Guide

## 🚀 The Best Transfer Approach: GitHub-to-Replit Sync
To maintain 100% visual integrity and prevent "code drift," the most robust method is to use **GitHub as your Source of Truth** and **Replit as your Live Environment**.

### Step 1: Initialize your GitHub Repository
1. Create a new repository on GitHub (e.g., `crafthub-360-ecosystem`).
2. Upload the files provided in the manifest below, preserving the folder structure (`/src`, `/public`, etc.).
3. **Why?** GitHub handles version control, ensuring your "Obsidian Glass" styling never degrades.

### Step 2: Import to Replit
1. Open [Replit](https://replit.com) and click **"Import from GitHub."**
2. Paste your repository URL.
3. Replit will automatically detect the `package.json` and `replit.nix` files I've provided to set up the environment.

### Step 3: Verify the "Airy" Visuals
1. Once imported, run `npm install` then `npm run dev` in the Replit terminal.
2. The `src/styles.css` file contains the specific backdrop-blur and gold-shadow tokens that create the premium look you see on the canvas.

---

## 📦 Production File Manifest

### 1. Root Configuration
- `index.html`: Main entry point.
- `package.json`: Dependency lock (React, Framer Motion, Tailwind).
- `tailwind.config.js`: Design system token mapping.
- `replit.nix`: Replit environment configuration.

### 2. Core Logic (`/src`)
- `main.jsx`: React initialization.
- `App.jsx`: Main routing & NOVEE OS state.
- `styles.css`: THE MOST IMPORTANT FILE. Contains the glass-morphism and "Airy" background logic.

### 3. Page Modules (`/src/pages`)
- `Home.jsx`: The Master Dashboard.
- `CraftHub.jsx`: The Module Selection Hub.
- `SmokeCraft.jsx`: Sensory Journey (Step 1).
- `PassportConnection.jsx`: QR Networking Terminal.
- `POS3.jsx`: Transaction Orchestration.

### 4. Shared Components (`/src/components`)
- `Layout.jsx`: The persistent frame with gold navigation.
- `Card.jsx`: The glass-morphism container.

---

**Ready to start?** I can print the code for any specific file above, or we can move to the next set of page modules.