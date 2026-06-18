import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useGuestSession } from './context/GuestSessionContext.jsx'
import { DemoModeProvider } from './context/DemoModeContext.jsx'
import Layout from './components/Layout.jsx'
import DemoBanner from './components/demo/DemoBanner.jsx'

// ── Critical boot-path pages — eager loaded ───────────────────
import Home             from './pages/Home.jsx'
import Boot             from './pages/Boot.jsx'
import CraftHub         from './pages/CraftHub.jsx'
import POS3             from './pages/POS3.jsx'
import EATCommand       from './pages/EATCommand.jsx'

// ── SmokeCraft guest flow — eager (guest-accessible, core journey) ─
import SmokeCraft       from './pages/SmokeCraft.jsx'
import Enroll           from './pages/smokecraft/Enroll.jsx'
import GoldenBox        from './pages/smokecraft/GoldenBox.jsx'
import GoldenBoxStatus  from './pages/smokecraft/GoldenBoxStatus.jsx'
import Art              from './pages/smokecraft/Art.jsx'
import Mentor           from './pages/smokecraft/Mentor.jsx'
import Format           from './pages/smokecraft/Format.jsx'
import Origins          from './pages/smokecraft/Origins.jsx'
import Curation         from './pages/smokecraft/Curation.jsx'
import Leaves           from './pages/smokecraft/Leaves.jsx'
import LeafChallenge            from './pages/smokecraft/LeafChallenge.jsx'
import LeafChallengeCalculating from './pages/smokecraft/LeafChallengeCalculating.jsx'
import LeafChallengeResult      from './pages/smokecraft/LeafChallengeResult.jsx'
import Cultivation      from './pages/smokecraft/Cultivation.jsx'
import Blend            from './pages/smokecraft/Blend.jsx'
import FlavorDNA        from './pages/smokecraft/FlavorDNA.jsx'
import Pairing          from './pages/smokecraft/Pairing.jsx'
import Available        from './pages/smokecraft/Available.jsx'
import Assistant        from './pages/smokecraft/Assistant.jsx'
import SessionComplete  from './pages/smokecraft/SessionComplete.jsx'
import Terroir          from './pages/smokecraft/Terroir.jsx'
import PairingMastery   from './pages/smokecraft/PairingMastery.jsx'
import Vitola           from './pages/smokecraft/Vitola.jsx'
import Identity         from './pages/smokecraft/Identity.jsx'
import Leaderboard      from './pages/smokecraft/Leaderboard.jsx'
import PassportStamp    from './pages/smokecraft/PassportStamp.jsx'
import SeedSoil         from './pages/smokecraft/SeedSoil.jsx'
import HumidorMatch     from './pages/smokecraft/HumidorMatch.jsx'
import RequestPurchase  from './pages/smokecraft/RequestPurchase.jsx'
import CutToastLight    from './pages/smokecraft/CutToastLight.jsx'
import FirstThird       from './pages/smokecraft/FirstThird.jsx'
import SecondThird      from './pages/smokecraft/SecondThird.jsx'
import FinalThird       from './pages/smokecraft/FinalThird.jsx'
import Scorecard        from './pages/smokecraft/Scorecard.jsx'
import Connections      from './pages/smokecraft/Connections.jsx'
import ManagementSync   from './pages/smokecraft/ManagementSync.jsx'

// ── Passport — guest-accessible, eager ───────────────────────
import PassportHome        from './pages/passport/PassportHome.jsx'
import PassportConnection  from './pages/PassportConnection.jsx'
import PassportProfile     from './pages/passport/PassportProfile.jsx'
import PassportStamps      from './pages/passport/PassportStamps.jsx'
import PassportDirectory   from './pages/passport/PassportDirectory.jsx'
import PassportConnections from './pages/passport/PassportConnections.jsx'
import PassportEvents      from './pages/passport/PassportEvents.jsx'
import PassportBenefits    from './pages/passport/PassportBenefits.jsx'
import PassportScan        from './pages/passport/PassportScan.jsx'
import PassportHowItWorks  from './pages/passport/PassportHowItWorks.jsx'

import DayOneTravel from './pages/DayOneTravel.jsx'
import ModulePlaceholder from './pages/ModulePlaceholder.jsx'

// ── Craft modules — moderate size, eager ─────────────────────
import PourCraft from './pages/PourCraft.jsx'
import BeerCraft from './pages/BeerCraft.jsx'
import WineCraft from './pages/WineCraft.jsx'

// ── Auth screens — lazy ───────────────────────────────────────
const StaffLogin   = lazy(() => import('./pages/StaffLogin.jsx'))
const AdminLogin   = lazy(() => import('./pages/AdminLogin.jsx'))
const FounderLogin = lazy(() => import('./pages/FounderLogin.jsx'))
const MentorLogin  = lazy(() => import('./pages/MentorLogin.jsx'))
const DevLogin     = lazy(() => import('./pages/DevLogin.jsx'))

// ── Protected heavy pages — lazy loaded ──────────────────────
const Admin          = lazy(() => import('./pages/Admin.jsx'))
const FounderControl = lazy(() => import('./pages/FounderControl.jsx'))
const MentorConsole  = lazy(() => import('./pages/MentorConsole.jsx'))
const DevDiagnostics = lazy(() => import('./pages/DevDiagnostics.jsx'))

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

// ── Phase 13: Founder demo / investor / pilot — lazy ──────────
const FounderDemo    = lazy(() => import('./pages/FounderDemo.jsx'))
const InvestorDemo   = lazy(() => import('./pages/InvestorDemo.jsx'))
const VenueOwnerDemo = lazy(() => import('./pages/VenueOwnerDemo.jsx'))
const PilotOnboarding = lazy(() => import('./pages/PilotOnboarding.jsx'))
const SystemOverview = lazy(() => import('./pages/SystemOverview.jsx'))

/** Premium loading fallback shown while lazy chunks load. */
function NOVEELoader() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0603',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        width: '28px', height: '28px',
        border: '2px solid rgba(201,168,76,0.15)',
        borderTop: '2px solid rgba(201,168,76,0.6)',
        borderRadius: '50%', animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{
        color: 'rgba(201,168,76,0.4)', fontSize: '10px',
        letterSpacing: '0.25em', textTransform: 'uppercase',
      }}>
        Loading NOVEE OS module…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Routes reachable without first playing the boot intro.
const NO_BOOT_REQUIRED = new Set(['/', '/boot', '/staff-login', '/admin-login', '/founder-login', '/mentor-login', '/dev-login'])

/** Silently records the current route in session state for refresh recovery. */
function RouteTracker() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { trackRoute } = useGuestSession()

  useEffect(() => {
    if (location.pathname !== '/boot') trackRoute(location.pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Deep-linking straight into any app route (e.g. /crafthub) on a fresh
  // session would skip the boot intro entirely. Funnel through "/" first;
  // Boot.jsx reads sessionStorage('novee_boot_return') to send the user
  // back here once the intro finishes. Only runs once per session, since
  // novee_booted gets set right after the intro completes.
  useEffect(() => {
    if (NO_BOOT_REQUIRED.has(location.pathname)) return
    if (sessionStorage.getItem('novee_booted')) return
    sessionStorage.setItem('novee_boot_return', location.pathname + location.search)
    navigate('/', { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  return null
}

export default function App() {
  return (
    <DemoModeProvider>
      <BrowserRouter>
        <RouteTracker />
        {/* Persistent Demo Mode banner — renders on top of all routes */}
        <DemoBanner />
        <KioskShell>
        <Suspense fallback={<NOVEELoader />}>
          <Routes>
            {/* ── Boot — accessible at root and /boot ─────────────── */}
            <Route path="/"    element={<Boot />} />
            <Route path="boot" element={<Boot />} />

            {/* ── Login screens — lazy, accessible without boot ─── */}
            <Route path="staff-login"   element={<StaffLogin />} />
            <Route path="admin-login"   element={<AdminLogin />} />
            <Route path="founder-login" element={<FounderLogin />} />
            <Route path="mentor-login"  element={<MentorLogin />} />
            <Route path="dev-login"     element={<DevLogin />} />

            {/* ── All app routes — public, gated per-route where needed ── */}
            <Route element={<Layout />}>
              <Route path="home"     element={<Navigate to="/crafthub" replace />} />
              <Route path="novee-home" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0', 'developer']}
                  loginRoute="/admin-login"
                  loginLabel="Admin / Founder Login"
                  lockedMessage="NOVEE OS Command Hub requires founder, admin, or developer access."
                  demoBlocked
                >
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="crafthub" element={<CraftHub />} />

              {/* SmokeCraft 360 — guest-accessible + demo-allowed */}
              <Route path="smokecraft">
                <Route index element={<SmokeCraft />} />
                <Route path="enroll"           element={<Enroll />} />
                <Route path="golden-box">
                  <Route index             element={<GoldenBox />} />
                  <Route path="status"     element={<GoldenBoxStatus />} />
                </Route>
                <Route path="art"            element={<Art />} />
                <Route path="mentor-selection" element={<Mentor />} />
                <Route path="mentor"         element={<Navigate to="/smokecraft/mentor-selection" replace />} />
                <Route path="format"         element={<Format />} />
                <Route path="shape-size-burn" element={<Navigate to="/smokecraft/format" replace />} />
                <Route path="gold-box"       element={<Navigate to="/smokecraft/golden-box" replace />} />
                <Route path="origins"        element={<Origins />} />
                <Route path="curation"       element={<Curation />} />
                <Route path="leaves"         element={<Leaves />} />
                <Route path="leaf-challenge"             element={<LeafChallenge />} />
                <Route path="leaf-challenge-calculating" element={<LeafChallengeCalculating />} />
                <Route path="leaf-challenge-result"      element={<LeafChallengeResult />} />
                <Route path="cultivation"    element={<Cultivation />} />
                <Route path="blend"          element={<Blend />} />
                <Route path="flavor-dna"     element={<FlavorDNA />} />
                <Route path="pairing"        element={<Pairing />} />
                <Route path="available"      element={<Available />} />
                <Route path="assistant"      element={<Assistant />} />
                <Route path="session-complete" element={<SessionComplete />} />
                <Route path="terroir"        element={<Terroir />} />
                <Route path="pairing-mastery" element={<PairingMastery />} />
                <Route path="vitola"         element={<Vitola />} />
                <Route path="identity"       element={<Identity />} />
                <Route path="leaderboard"    element={<Leaderboard />} />
                <Route path="passport-stamp"   element={<PassportStamp />} />
                <Route path="seed-soil"        element={<SeedSoil />} />
                <Route path="humidor-match"    element={<HumidorMatch />} />
                <Route path="request-purchase" element={<RequestPurchase />} />
                <Route path="cut-toast-light"  element={<CutToastLight />} />
                <Route path="first-third"      element={<FirstThird />} />
                <Route path="second-third"     element={<SecondThird />} />
                <Route path="final-third"      element={<FinalThird />} />
                <Route path="scorecard"        element={<Scorecard />} />
                <Route path="connections"      element={<Connections />} />
                <Route path="management-sync"  element={<ManagementSync />} />
              </Route>

              {/* 360 Passport — guest-accessible + demo-allowed */}
              <Route path="passport">
                <Route index                  element={<PassportHome />} />
                <Route path="profile"         element={<PassportProfile />} />
                <Route path="stamps"          element={<PassportStamps />} />
                <Route path="directory"       element={<PassportDirectory />} />
                <Route path="connections"     element={<PassportConnections />} />
                <Route path="events"          element={<PassportEvents />} />
                <Route path="benefits"        element={<PassportBenefits />} />
                <Route path="scan"            element={<PassportScan />} />
                <Route path="how-it-works"    element={<PassportHowItWorks />} />
                <Route path="ceremony"        element={<Navigate to="/smokecraft/passport-stamp" replace />} />
                <Route path="leaderboard"     element={<Navigate to="/smokecraft/leaderboard" replace />} />
              </Route>

              <Route path="passport-networking" element={<PassportConnection />} />
              <Route path="grand-lounge-ranking" element={<Leaderboard />} />
              <Route path="dayone360-travel"    element={<DayOneTravel />} />
              <Route path="dayone360"           element={<DayOneTravel />} />
              <Route path="leaderboard"         element={<Leaderboard />} />
              <Route path="pourcraft"  element={<PourCraft />} />
              <Route path="beercraft"  element={<BeerCraft />} />
              <Route path="winecraft"  element={<WineCraft />} />
              <Route path="demo" element={
                <ModulePlaceholder
                  title="Demo Mode"
                  purpose="Safe preview mode is available from the NOVEE OS home screen. It previews guest-facing modules without real server calls, payments, inventory changes, audit events, or role changes."
                  phases={['Keep safe preview routing visible', 'Expand guided demo scripts', 'Add operator-specific walkthrough presets']}
                />
              } />
              <Route path="ultra-command-center" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0', 'developer']}
                  loginRoute="/admin-login"
                  loginLabel="Admin / Founder Login"
                  lockedMessage="NOVEE OS Ultra Command Center requires founder, admin, or developer access."
                  demoBlocked
                >
                  <ModulePlaceholder
                    title="NOVEE OS Ultra Command Center"
                    purpose="Master control system for venues, licenses, modules, deployments, vault data, diagnostics, users, roles, security, analytics, and remote updates."
                    phases={['Connect global venue registry', 'Wire deployment and vault APIs', 'Add founder-only control actions']}
                  />
                </ProtectedRoute>
              } />
              <Route path="novee-vault" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0', 'developer']}
                  loginRoute="/admin-login"
                  loginLabel="Admin / Founder Login"
                  lockedMessage="NOVEE Vault requires elevated system access."
                  demoBlocked
                >
                  <ModulePlaceholder
                    title="NOVEE Vault"
                    purpose="Secure system of record for venue accounts, licenses, identities, profiles, E.A.T., POS, assets, legal, deployments, audit logs, support, and release records."
                    phases={['Create vault domain browser', 'Attach tenant-safe record filters', 'Add audit and legal document controls']}
                  />
                </ProtectedRoute>
              } />
              <Route path="remote-software-control" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0', 'developer']}
                  loginRoute="/admin-login"
                  loginLabel="Admin / Founder Login"
                  lockedMessage="Remote Software Control requires authorized master system access."
                  demoBlocked
                >
                  <ModulePlaceholder
                    title="Remote Software Control"
                    purpose="Deployment control for UI updates, module releases, content pushes, E.A.T., POS 3, ticker, legal, demo mode, and role access updates."
                    phases={['Wire deployment queue', 'Add rollback and maintenance actions', 'Connect venueId-scoped release history']}
                  />
                </ProtectedRoute>
              } />
              <Route path="venue-mirror" element={
                <ProtectedRoute
                  allowedRoles={['manager', 'admin', 'founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Venue Manager Login"
                  lockedMessage="Venue Mirror Command Hub requires venue owner, manager, admin, or founder access."
                  demoBlocked
                >
                  <ModulePlaceholder
                    title="Venue Mirror Command Hub"
                    purpose="Establishment-level command hub for local E.A.T., POS 3, CraftHub, Passport members, staff activity, events, specials, ticker, reports, and venue settings scoped by venueId."
                    phases={['Bind selected venueId', 'Connect local E.A.T. and POS 3 data', 'Add tenant-safe manager actions']}
                  />
                </ProtectedRoute>
              } />

              {/* ── Mentor Console — sidecar role (access_mentor_console) ─ */}
              <Route path="mentor-console" element={
                <ProtectedRoute
                  requiredPermission="access_mentor_console"
                  loginRoute="/mentor-login"
                  loginLabel="Mentor Login"
                  lockedMessage="Mentor Console requires Human Mentor access. Contact an admin to request this role."
                  demoBlocked={false}
                >
                  <MentorConsole />
                </ProtectedRoute>
              } />

              {/* ── Developer Diagnostics — sidecar role (view_diagnostics) ─ */}
              <Route path="dev-diagnostics" element={
                <ProtectedRoute
                  requiredPermission="view_diagnostics"
                  loginRoute="/dev-login"
                  loginLabel="Developer Login"
                  lockedMessage="Developer Diagnostics requires an active developer access grant issued by Founder Level 0."
                  demoBlocked
                >
                  <DevDiagnostics />
                </ProtectedRoute>
              } />

              {/* ── Protected: staff+ — BLOCKED in demo mode ────── */}
              <Route path="pos" element={
                <ProtectedRoute
                  requiredPermission="access_pos3_staff"
                  loginRoute="/staff-login"
                  loginLabel="Staff Login"
                  lockedMessage="POS 3 requires staff-level access. Please sign in with your staff PIN."
                  demoBlocked
                >
                  <POS3 />
                </ProtectedRoute>
              } />
              <Route path="pos/table/:tableId" element={
                <ProtectedRoute
                  requiredPermission="access_pos3_staff"
                  loginRoute="/staff-login"
                  loginLabel="Staff Login"
                  lockedMessage="POS 3 requires staff-level access. Please sign in with your staff PIN."
                  demoBlocked
                >
                  <POS3 />
                </ProtectedRoute>
              } />

              {/* ── Protected: manager+ — BLOCKED in demo mode ───── */}
              <Route path="eat" element={
                <ProtectedRoute
                  requiredPermission="access_eat_command"
                  loginRoute="/admin-login"
                  loginLabel="Manager / Admin Login"
                  lockedMessage="E.A.T. Command requires manager-level access or higher."
                  demoBlocked
                >
                  <EATCommand />
                </ProtectedRoute>
              } />

              {/* ── Protected: admin+ — BLOCKED in demo mode ──────── */}
              <Route path="admin" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Admin Login"
                  lockedMessage="NOVEE OS Admin requires admin-level access or higher."
                  demoBlocked
                >
                  <Admin />
                </ProtectedRoute>
              } />

              {/* ── Protected: founder only — BLOCKED in demo mode ── */}
              <Route path="founder" element={
                <ProtectedRoute
                  allowedRoles={['founder_level_0']}
                  loginRoute="/founder-login"
                  loginLabel="Founder Login"
                  lockedMessage="Founder Level 0 access required. This area cannot be delegated."
                  demoBlocked
                >
                  <FounderControl />
                </ProtectedRoute>
              } />

              {/* /offline — public */}
              <Route path="offline" element={<OfflineMode />} />

              {/* /device-status — BLOCKED in demo mode */}
              <Route path="device-status" element={
                <ProtectedRoute
                  allowedRoles={['staff','manager','admin','founder_level_0']}
                  loginRoute="/staff-login"
                  loginLabel="Staff Login"
                  lockedMessage="Device status requires staff-level access or higher."
                  demoBlocked
                >
                  <DeviceStatus />
                </ProtectedRoute>
              } />

              {/* /kiosk-setup — BLOCKED in demo mode */}
              <Route path="kiosk-setup" element={
                <ProtectedRoute
                  allowedRoles={['manager','admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Manager Login"
                  lockedMessage="Kiosk setup requires manager-level access or higher."
                  demoBlocked
                >
                  <KioskSetup />
                </ProtectedRoute>
              } />

              {/* /install-help — BLOCKED in demo mode */}
              <Route path="install-help" element={
                <ProtectedRoute
                  allowedRoles={['manager','admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Manager Login"
                  lockedMessage="Install help requires manager-level access or higher."
                  demoBlocked
                >
                  <InstallHelp />
                </ProtectedRoute>
              } />

              {/* /venue-test — BLOCKED in demo mode */}
              <Route path="venue-test" element={
                <ProtectedRoute
                  allowedRoles={['manager','admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Manager Login"
                  lockedMessage="Venue testing requires manager-level access or higher."
                  demoBlocked
                >
                  <VenueTestControl />
                </ProtectedRoute>
              } />

              {/* ── Phase 13: Founder demo / investor / pilot ────── */}
              <Route path="founder-demo" element={
                <ProtectedRoute
                  allowedRoles={['founder_level_0']}
                  loginRoute="/founder-login"
                  loginLabel="Founder Login"
                  lockedMessage="Founder demo requires founder-level access."
                  demoBlocked
                >
                  <FounderDemo />
                </ProtectedRoute>
              } />
              <Route path="investor-demo" element={
                <ProtectedRoute
                  allowedRoles={['founder_level_0']}
                  loginRoute="/founder-login"
                  loginLabel="Founder Login"
                  lockedMessage="Investor demo requires founder-level access."
                  demoBlocked
                >
                  <InvestorDemo />
                </ProtectedRoute>
              } />
              <Route path="venue-demo" element={
                <ProtectedRoute
                  allowedRoles={['manager','admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Manager Login"
                  lockedMessage="Venue demo requires manager-level access or higher."
                  demoBlocked={false}
                >
                  <VenueOwnerDemo />
                </ProtectedRoute>
              } />
              <Route path="pilot-onboarding" element={
                <ProtectedRoute
                  allowedRoles={['admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Admin Login"
                  lockedMessage="Pilot onboarding requires admin-level access or higher."
                  demoBlocked
                >
                  <PilotOnboarding />
                </ProtectedRoute>
              } />
              <Route path="system-overview" element={
                <ProtectedRoute
                  allowedRoles={['manager','admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Manager Login"
                  lockedMessage="System overview requires manager-level access or higher."
                  demoBlocked
                >
                  <SystemOverview />
                </ProtectedRoute>
              } />

              {/* Route aliases */}
              <Route path="management"   element={<Navigate to="/venue-mirror" replace />} />
              <Route path="novee"        element={<Navigate to="/ultra-command-center" replace />} />
              <Route path="system"       element={<Navigate to="/system-overview" replace />} />
              <Route path="diagnostics"  element={<Navigate to="/dev-diagnostics" replace />} />
              <Route path="craft-hub"    element={<Navigate to="/crafthub" replace />} />
              <Route path="craft-modules" element={<Navigate to="/crafthub" replace />} />
              <Route path="dashboard"    element={<Navigate to="/crafthub" replace />} />
              <Route path="command-center" element={<Navigate to="/eat" replace />} />
              <Route path="eat-command"  element={<Navigate to="/eat" replace />} />
              <Route path="pos3"         element={<Navigate to="/pos" replace />} />
              <Route path="founder-command" element={<Navigate to="/founder" replace />} />
              <Route path="admin-command" element={<Navigate to="/admin" replace />} />
              <Route path="smokecraft/session-1" element={<Navigate to="/smokecraft" replace />} />
              <Route path="smokecraft/session-2" element={<Navigate to="/smokecraft" replace />} />
              <Route path="smokecraft/session-3" element={<Navigate to="/smokecraft" replace />} />
              <Route path="smokecraft/session-4" element={<Navigate to="/smokecraft" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>

        {/* Dev-only floating role switcher */}
        <DevRoleSwitcher />
        </KioskShell>
      </BrowserRouter>
    </DemoModeProvider>
  )
}
