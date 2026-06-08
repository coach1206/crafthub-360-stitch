# NOVEE OS — Kiosk Setup Guide

For venue staff and deployment coordinators.

---

## iPad Install (Safari)

1. Open the NOVEE OS URL in Safari.
2. Tap the **Share** button (box + arrow, bottom center).
3. Scroll down and tap **"Add to Home Screen"**.
4. Edit the name if desired, then tap **Add**.
5. Find the NOVEE icon on your home screen and tap to launch.
6. The app opens full-screen without the browser bar.

**Tip:** Use Guided Access (Settings → Accessibility → Guided Access) to lock the iPad to a single app in kiosk environments.

---

## Android Tablet Install (Chrome)

1. Open the NOVEE OS URL in Chrome.
2. Tap the **⋮** menu (top right).
3. Tap **"Add to Home Screen"** or **"Install App"**.
4. Confirm the installation.
5. Launch from the home screen icon.

---

## Kiosk Browser Setup

### Option A — Chrome Kiosk Mode
```bash
chrome --kiosk https://your-novee-url.com --disable-infobars
```

### Option B — Chromium Kiosk
```bash
chromium-browser --kiosk https://your-novee-url.com
```

### Option C — Full-Screen Browser
Press **F11** to toggle full-screen in most browsers.

---

## Device Assignment

1. Log in as **manager** or above.
2. Navigate to **`/kiosk-setup`**.
3. Set a **Device ID** (e.g. `ipad-bar-01`, `kiosk-lobby`).
4. Set the **Venue ID** (e.g. `novee-grand-lounge`).
5. Choose **Device Type**:
   - `Guest Kiosk` — SmokeCraft + Passport only
   - `Staff Terminal` — POS 3 access
   - `Manager Terminal` — E.A.T. Command + POS 3
   - `Founder Terminal` — Full OS access
   - `Demo Browser` — No restrictions
6. Toggle **Kiosk Mode** to restrict the device to its assigned routes.
7. Tap **Save Configuration**.

---

## Staff / Admin Unlock

When a device is in kiosk mode and a staff member needs to access a restricted area:

1. A **"Staff Unlock"** button appears on the locked route screen.
2. Enter a valid **staff, manager, or admin PIN**.
3. The device unlocks for that navigation.
4. To fully disable kiosk mode: go to `/kiosk-setup` → **Disable Kiosk Mode**.

---

## Route Locking Reference

| Device Type | Allowed Routes |
|---|---|
| Guest Kiosk | `/`, `/boot`, `/crafthub`, `/smokecraft/*`, `/passport/*`, `/leaderboard` |
| Staff Terminal | `/staff-login`, `/pos`, `/device-status` |
| Manager Terminal | `/admin-login`, `/eat`, `/pos`, `/device-status` |
| Founder Terminal | `/founder-login`, `/founder`, `/admin`, `/device-status` |
| Tablet / Demo | No restrictions |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Blank screen on launch | Hard-refresh (Cmd+Shift+R) or clear browser cache |
| Stuck on boot screen | Wait 8 seconds — a **Continue** button will appear |
| Backend offline | Go to `/offline` to see what still works locally |
| PIN not accepted | Confirm PIN is active; check lockout status with manager |
| Can't disable kiosk mode | Use Staff Unlock → navigate to `/kiosk-setup` |
| PWA icon missing | Re-add via Safari/Chrome (not a third-party browser) |
| No voice audio | Check if device volume is on; Web Speech API requires browser support |

---

*NOVEE OS v4.2.0 — Phase 11 Kiosk/Tablet Deployment*
