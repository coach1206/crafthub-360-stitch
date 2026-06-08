import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useGuestSession } from './context/GuestSessionContext.jsx'
import Layout from './components/Layout.jsx'

// ── Critical boot-path pages — eager loaded ───────────────────
import Home             from './pages/Home.jsx'
import Boot             from './pages/Boot.jsx'
import CraftHub         from './pages/CraftHub.jsx'

// ── SmokeCraft guest flow — eager (guest-accessible, core journey) ─
import SmokeCraft       from './pages/SmokeCraft.jsx'
import Enroll           from './pages/smokecraft/Enroll.jsx'
import GoldenBox        from './pages/smokecraft/GoldenBox.jsx'
import GoldenBoxStatus  from './pages/smokecraft/GoldenBoxStatus.jsx'
import Art              from './pages/smokecraft/Art.jsx'
import Mentor           from './pages/smokecraft/Mentor.jsx'
import Origins          from './pages/smokecraft/Origins.jsx'
import Leaves           from './pages/smokecraft/Leaves.jsx'
import LeafChallenge    from './pages/smokecraft/LeafChallenge.jsx'
import Cultivation      from './pages/smokecraft/Cultivation.jsx'
import Blend            from './pages/smokecraft/Blend.jsx'
import FlavorDNA        from './pages/smokecraft/FlavorDNA.jsx'
import Pairing          from './pages/smokecraft/Pairing.jsx'
import Available        from './pages/smokecraft/Available.jsx'
import SessionComplete  from './pages/smokecraft/SessionComplete.jsx'
import Terroir          from './pages/smokecraft/Terroir.jsx'
import PairingMastery   from './pages/smokecraft/PairingMastery.jsx'
import Vitola           from './pages/smokecraft/Vitola.jsx'
import Identity         from './pages/smokecraft/Identity.jsx'
import Leaderboard      from './pages/smokecraft/Leaderboard.jsx'
import PassportStamp    from './pages/smokecraft/PassportStamp.jsx'

// ── Passport — guest-accessible, eager ───────────────────────
import PassportConnection from './pages/PassportConnection.jsx'
import PassportProfile    from './pages/passport/PassportProfile.jsx'
import PassportStamps     from './pages/passport/PassportStamps.jsx'

// ── Craft modules — moderate size, eager ─────────────────────
import PourCraft from './pages/PourCraft.jsx'
import BeerCraft from './pages/BeerCraft.jsx'
import WineCraft from './pages/WineCraft.jsx'

// ── Auth screens — lazy (only reached after choosing to log in) ─
const StaffLogin   = lazy(() => import('./pages/StaffLogin.jsx'))
const AdminLogin   = lazy(() => import('./pages/AdminLogin.jsx'))
const FounderLogin = lazy(() => import('./pages/FounderLogin.jsx'))

// ── Protected heavy pages — lazy loaded ──────────────────────
const POS3          = lazy(() => import('./pages/POS3.jsx'))
const EATCommand    = lazy(() => import('./pages/EATCommand.jsx'))
const Admin         = lazy(() => import('./pages/Admin.jsx'))
const FounderControl= lazy(() => import('./pages/FounderControl.jsx'))

import ProtectedRoute  from './components/security/ProtectedRoute.jsx'
import DevRoleSwitcher from './components/security/DevRoleSwitcher.jsx'
import KioskShell      from './components/kiosk/KioskShell.jsx'

// ── Phase 11: Kiosk / deployment pages — lazy ─────────────────
const KioskSetup   = lazy(() => import('./pages/KioskSetup.jsx'))
const DeviceStatus = lazy(() => import('./pages/DeviceStatus.jsx'))
const OfflineMode  = lazy(() => import('./pages/OfflineMode.jsx'))
const InstallHelp  = lazy(() => import('./pages/InstallHelp.jsx'))

// ── Phase 12: Venue testing — lazy ────────────────────────────
const VenueTestControl = lazy(() => import('./pages/VenueTestControl.jsx'))

/** Premium loading fallback shown while lazy chunks load. */
function NOVEELoader() {
  return (
    <div style={{
      minHeight:   '100vh',
      background:  '#0a0603',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
      fontFamily:  'Georgia, serif',
      flexDirection: 'column',
      gap:         '0.75rem',
    }}>
      <div style={{
        width:        '28px',
        height:       '28px',
        border:       '2px solid rgba(201,168,76,0.15)',
        borderTop:    '2px solid rgba(201,168,76,0.6)',
        borderRadius: '50%',
        animation:    'spin 0.9s linear infinite',
      }} />
      <div style={{
        color:         'rgba(201,168,76,0.4)',
        fontSize:      '10px',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
      }}>
        Loading NOVEE OS module…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/** Silently records the current route in session state for refresh recovery. */
function RouteTracker() {
  const location = useLocation()
  const { trackRoute } = useGuestSession()
  useEffect(() => {
    if (location.pathname !== '/boot') trackRoute(location.pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])
  return null
}

function BootGuard({ children }) {
  const booted = sessionStorage.getItem('novee_booted')
  if (!booted) {
    const intended = window.location.pathname + window.location.search
    if (intended !== '/boot' && intended !== '/') {
      sessionStorage.setItem('novee_boot_return', intended)
    }
    return <Navigate to="/boot" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <KioskShell>
      <Suspense fallback={<NOVEELoader />}>
        <Routes>
          {/* ── Boot — always accessible ─────────────────────── */}
          <Route path="boot" element={<Boot />} />

          {/* ── Login screens — lazy, accessible without boot ─── */}
          <Route path="staff-login"   element={<StaffLogin />} />
          <Route path="admin-login"   element={<AdminLogin />} />
          <Route path="founder-login" element={<FounderLogin />} />

          {/* ── All app routes — guarded by boot + Layout ─────── */}
          <Route
            element={
              <BootGuard>
                <Layout />
              </BootGuard>
            }
          >
            <Route index           element={<Home />} />
            <Route path="crafthub" element={<CraftHub />} />

            {/* SmokeCraft 360 — guest-accessible */}
            <Route path="smokecraft">
              <Route index element={<SmokeCraft />} />
              <Route path="enroll"           element={<Enroll />} />
              <Route path="golden-box">
                <Route index             element={<GoldenBox />} />
                <Route path="status"     element={<GoldenBoxStatus />} />
              </Route>
              <Route path="art"            element={<Art />} />
              <Route path="mentor"         element={<Mentor />} />
              <Route path="origins"        element={<Origins />} />
              <Route path="leaves"         element={<Leaves />} />
              <Route path="leaf-challenge" element={<LeafChallenge />} />
              <Route path="cultivation"    element={<Cultivation />} />
              <Route path="blend"          element={<Blend />} />
              <Route path="flavor-dna"     element={<FlavorDNA />} />
              <Route path="pairing"        element={<Pairing />} />
              <Route path="available"      element={<Available />} />
              <Route path="session-complete" element={<SessionComplete />} />
              <Route path="terroir"        element={<Terroir />} />
              <Route path="pairing-mastery" element={<PairingMastery />} />
              <Route path="vitola"         element={<Vitola />} />
              <Route path="identity"       element={<Identity />} />
              <Route path="leaderboard"    element={<Leaderboard />} />
              <Route path="passport-stamp" element={<PassportStamp />} />
            </Route>

            {/* 360 Passport — guest-accessible */}
            <Route path="passport">
              <Route index              element={<PassportConnection />} />
              <Route path="profile"     element={<PassportProfile />} />
              <Route path="stamps"      element={<PassportStamps />} />
              <Route path="ceremony"    element={<Navigate to="/smokecraft/passport-stamp" replace />} />
              <Route path="leaderboard" element={<Navigate to="/smokecraft/leaderboard" replace />} />
            </Route>

            <Route path="passport-networking" element={<PassportConnection />} />
            <Route path="pourcraft"  element={<PourCraft />} />
            <Route path="beercraft"  element={<BeerCraft />} />
            <Route path="winecraft"  element={<WineCraft />} />

            {/* ── Protected: staff+ ────────────────────────────── */}
            <Route path="pos" element={
              <ProtectedRoute
                requiredPermission="access_pos3_staff"
                loginRoute="/staff-login"
                loginLabel="Staff Login"
                lockedMessage="POS 3 requires staff-level access. Please sign in with your staff PIN."
              >
                <POS3 />
              </ProtectedRoute>
            } />

            {/* ── Protected: manager+ ──────────────────────────── */}
            <Route path="eat" element={
              <ProtectedRoute
                requiredPermission="access_eat_command"
                loginRoute="/admin-login"
                loginLabel="Manager / Admin Login"
                lockedMessage="E.A.T. Command requires manager-level access or higher."
              >
                <EATCommand />
              </ProtectedRoute>
            } />

            {/* ── Protected: admin+ ────────────────────────────── */}
            <Route path="admin" element={
              <ProtectedRoute
                allowedRoles={['admin', 'founder_level_0']}
                loginRoute="/admin-login"
                loginLabel="Admin Login"
                lockedMessage="NOVEE OS Admin requires admin-level access or higher."
              >
                <Admin />
              </ProtectedRoute>
            } />

            {/* ── Protected: founder_level_0 only ──────────────── */}
            <Route path="founder" element={
              <ProtectedRoute
                allowedRoles={['founder_level_0']}
                loginRoute="/founder-login"
                loginLabel="Founder Login"
                lockedMessage="Founder Level 0 access required. This area cannot be delegated."
              >
                <FounderControl />
              </ProtectedRoute>
            } />

            {/* ── Phase 11: Kiosk / Deployment pages ──────────── */}

            {/* /offline — public, no boot required */}
            <Route path="offline" element={<OfflineMode />} />

            {/* /device-status — staff+ */}
            <Route path="device-status" element={
              <ProtectedRoute
                allowedRoles={['staff','manager','admin','founder_level_0']}
                loginRoute="/staff-login"
                loginLabel="Staff Login"
                lockedMessage="Device status requires staff-level access or higher."
              >
                <DeviceStatus />
              </ProtectedRoute>
            } />

            {/* /kiosk-setup — manager+ */}
            <Route path="kiosk-setup" element={
              <ProtectedRoute
                allowedRoles={['manager','admin','founder_level_0']}
                loginRoute="/admin-login"
                loginLabel="Manager Login"
                lockedMessage="Kiosk setup requires manager-level access or higher."
              >
                <KioskSetup />
              </ProtectedRoute>
            } />

            {/* /install-help — manager+ */}
            <Route path="install-help" element={
              <ProtectedRoute
                allowedRoles={['manager','admin','founder_level_0']}
                loginRoute="/admin-login"
                loginLabel="Manager Login"
                lockedMessage="Install help requires manager-level access or higher."
              >
                <InstallHelp />
              </ProtectedRoute>
            } />

            {/* /venue-test — Phase 12: Venue Test Control, manager+ */}
            <Route path="venue-test" element={
              <ProtectedRoute
                allowedRoles={['manager','admin','founder_level_0']}
                loginRoute="/admin-login"
                loginLabel="Manager Login"
                lockedMessage="Venue testing requires manager-level access or higher."
              >
                <VenueTestControl />
              </ProtectedRoute>
            } />

            {/* Route aliases */}
            <Route path="craft-hub"    element={<Navigate to="/crafthub" replace />} />
            <Route path="craft-modules" element={<Navigate to="/crafthub" replace />} />
            <Route path="dashboard"    element={<Navigate to="/crafthub" replace />} />
            <Route path="command-center" element={<Navigate to="/eat" replace />} />
            <Route path="eat-command"  element={<Navigate to="/eat" replace />} />
            <Route path="smokecraft/session-1" element={<Navigate to="/smokecraft" replace />} />
            <Route path="smokecraft/session-2" element={<Navigate to="/smokecraft" replace />} />
            <Route path="smokecraft/session-3" element={<Navigate to="/smokecraft" replace />} />
            <Route path="smokecraft/session-4" element={<Navigate to="/smokecraft" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Dev-only floating role switcher — stripped in production by import.meta.env.DEV */}
      <DevRoleSwitcher />
      </KioskShell>
    </BrowserRouter>
  )
}
