import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGuestSession } from './context/GuestSessionContext.jsx'
import { DemoModeProvider } from './context/DemoModeContext.jsx'
import Layout from './components/Layout.jsx'
import DemoBanner from './components/demo/DemoBanner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PublicSessionNotice from './components/PublicSessionNotice.jsx'

// ── Critical boot-path pages — eager loaded ───────────────────
import Home             from './pages/Home.jsx'
import Boot             from './pages/Boot.jsx'
import NoveeHome        from './pages/NoveeHome.jsx'
import CraftHub         from './pages/CraftHub.jsx'
import PublicCraftHubLanding from './pages/PublicCraftHubLanding.jsx'
import POS3             from './pages/POS3.jsx'
import EATCommand       from './pages/EATCommand.jsx'

// ── NEW POS 3 system (/pos3/*) ────────────────────────────────
import POS3Home     from './pages/pos3/POS3Home.jsx'
import POS3Handheld from './pages/pos3/POS3Handheld.jsx'
import POS3Tables   from './pages/pos3/POS3Tables.jsx'
import POS3Orders   from './pages/pos3/POS3Orders.jsx'
import POS3Checkout from './pages/pos3/POS3Checkout.jsx'
import POS3Settings from './pages/pos3/POS3Settings.jsx'
import KitchenDisplay from './pages/pos3/KitchenDisplay.jsx'
import BarDisplay from './pages/pos3/BarDisplay.jsx'
import HumidorControl from './pages/pos3/HumidorControl.jsx'
import InventoryControl from './pages/pos3/InventoryControl.jsx'
import POSIntegrationHub from './pages/pos3/POSIntegrationHub.jsx'

// ── NEW E.A.T. management system (/eat/*) ─────────────────────
import EATCommandHub from './pages/eat/EATCommandHub.jsx'
import EATPosControl from './pages/eat/EATPosControl.jsx'
import EATMediaLibrary from './pages/EATMediaLibrary.jsx'
import EATInventory from './pages/eat/EATInventory.jsx'
import EATReorders from './pages/eat/EATReorders.jsx'
import EATStaff from './pages/eat/EATStaff.jsx'
import EATSections from './pages/eat/EATSections.jsx'
import EATKitchen from './pages/eat/EATKitchen.jsx'
import EATBar from './pages/eat/EATBar.jsx'
import EATHumidor from './pages/eat/EATHumidor.jsx'
import EATData from './pages/eat/EATData.jsx'
import EATReports from './pages/eat/EATReports.jsx'
import EATDeviceMode from './pages/eat/EATDeviceMode.jsx'
import EATSettings from './pages/eat/EATSettings.jsx'
import EATOperations from './pages/eat/EATOperations.jsx'

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
import EventChallenge   from './pages/smokecraft/EventChallenge.jsx'
import Connections      from './pages/smokecraft/Connections.jsx'
import ManagementSync   from './pages/smokecraft/ManagementSync.jsx'
import WrapperStrength     from './pages/smokecraft/WrapperStrength.jsx'
import PairingLab          from './pages/smokecraft/PairingLab.jsx'
import FlavorMemory        from './pages/smokecraft/FlavorMemory.jsx'
import SmokeCraftChallenge from './pages/smokecraft/SmokeCraftChallenge.jsx'
import SecondHumidorMatch  from './pages/smokecraft/SecondHumidorMatch.jsx'
import MiniTastingRound    from './pages/smokecraft/MiniTastingRound.jsx'
import FinalReview         from './pages/smokecraft/FinalReview.jsx'
import VisitLockGuard      from './components/smokecraft/VisitLockGuard.jsx'
import HowItWorks       from './pages/smokecraft/HowItWorks.jsx'
import GuestPass        from './pages/smokecraft/GuestPass.jsx'
import Demo             from './pages/smokecraft/Demo.jsx'
import Scan             from './pages/smokecraft/Scan.jsx'
import SignIn           from './pages/SignIn.jsx'

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
const BootConsole   = lazy(() => import('./pages/BootConsole.jsx'))
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
const ModuleDeploymentCenter = lazy(() => import('./pages/novi/ModuleDeploymentCenter.jsx'))

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

/**
 * Silently records the current route in session state for refresh recovery.
 * Every route is reachable unconditionally — no boot flag, auth state, or
 * demo state gates rendering here. Per-route access control (staff/admin/etc)
 * is handled by ProtectedRoute on the individual routes that need it.
 */
function RouteTracker() {
  const location = useLocation()
  const { trackRoute } = useGuestSession()

  useEffect(() => {
    if (location.pathname !== '/boot') trackRoute(location.pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <DemoModeProvider>
      <BrowserRouter>
        <RouteTracker />
        {/* Persistent Demo Mode banner — renders on top of all routes */}
        <DemoBanner />
        <PublicSessionNotice />
        <KioskShell>
        <ErrorBoundary>
        <Suspense fallback={<NOVEELoader />}>
          <Routes>
            {/* ── Boot — public NOVEE OS boot screen at root and /boot ── */}
            <Route path="/" element={<Boot />} />
            <Route path="boot" element={<Boot />} />
            <Route path="boot/console" element={<BootConsole />} />

            {/* ── Login screens — lazy, accessible without boot ─── */}
            <Route path="staff-login"   element={<StaffLogin />} />
            <Route path="admin-login"   element={<AdminLogin />} />
            <Route path="founder-login" element={<FounderLogin />} />
            <Route path="mentor-login"  element={<MentorLogin />} />
            <Route path="dev-login"     element={<DevLogin />} />

            {/* ── All app routes — public, gated per-route where needed ── */}
            <Route element={<Layout />}>
              <Route path="home"     element={<NoveeHome />} />
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
              <Route path="system-explained" element={<PublicCraftHubLanding />} />

              {/* SmokeCraft 360 — guest-accessible + demo-allowed */}
              <Route path="smokecraft">
                <Route index element={<SmokeCraft />} />
                <Route path="enroll"           element={<Enroll />} />
                <Route path="intake"           element={<Navigate to="/smokecraft/enroll" replace />} />
                <Route path="entry"            element={<Navigate to="/smokecraft" replace />} />
                <Route path="profile"          element={<Navigate to="/smokecraft/identity" replace />} />
                <Route path="education"        element={<Navigate to="/smokecraft/format" replace />} />
                <Route path="mentors"          element={<Navigate to="/smokecraft/mentor-selection" replace />} />
                <Route path="humidor"          element={<Navigate to="/smokecraft/humidor-match" replace />} />
                <Route path="light"            element={<Navigate to="/smokecraft/cut-toast-light" replace />} />
                <Route path="complete"         element={<Navigate to="/smokecraft/session-complete" replace />} />
                <Route path="golden-box">
                  <Route index             element={<GoldenBox />} />
                  <Route path="status"     element={<GoldenBoxStatus />} />
                </Route>
                <Route path="art"            element={<Art />} />
                <Route path="mentor-selection" element={<Mentor />} />
                <Route path="mentor"         element={<Navigate to="/smokecraft/mentor-selection" replace />} />
                <Route path="format"         element={<VisitLockGuard stepId="format"><Format /></VisitLockGuard>} />
                <Route path="wrapper-strength" element={<VisitLockGuard stepId="wrapper-strength"><WrapperStrength /></VisitLockGuard>} />
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
                <Route path="session-complete" element={<VisitLockGuard stepId="session-complete"><SessionComplete /></VisitLockGuard>} />
                <Route path="terroir"        element={<Terroir />} />
                <Route path="pairing-mastery" element={<PairingMastery />} />
                <Route path="vitola"         element={<Vitola />} />
                <Route path="identity"       element={<Identity />} />
                <Route path="leaderboard"    element={<Leaderboard />} />
                <Route path="passport-stamp"   element={<VisitLockGuard stepId="passport-stamp"><PassportStamp /></VisitLockGuard>} />
                <Route path="seed-soil"        element={<VisitLockGuard stepId="seed-soil"><SeedSoil /></VisitLockGuard>} />
                <Route path="pairing-lab"      element={<VisitLockGuard stepId="pairing-lab"><PairingLab /></VisitLockGuard>} />
                <Route path="humidor-match"    element={<VisitLockGuard stepId="humidor-match"><HumidorMatch /></VisitLockGuard>} />
                <Route path="request-purchase" element={<VisitLockGuard stepId="request-purchase"><RequestPurchase /></VisitLockGuard>} />
                <Route path="cut-toast-light"  element={<VisitLockGuard stepId="cut-toast-light"><CutToastLight /></VisitLockGuard>} />
                <Route path="first-third"      element={<VisitLockGuard stepId="first-third"><FirstThird /></VisitLockGuard>} />
                <Route path="second-third"     element={<VisitLockGuard stepId="second-third"><SecondThird /></VisitLockGuard>} />
                <Route path="flavor-memory"    element={<VisitLockGuard stepId="flavor-memory"><FlavorMemory /></VisitLockGuard>} />
                <Route path="final-third"      element={<VisitLockGuard stepId="final-third"><FinalThird /></VisitLockGuard>} />
                <Route path="scorecard"        element={<VisitLockGuard stepId="scorecard"><Scorecard /></VisitLockGuard>} />
                <Route path="smokecraft-challenge"  element={<VisitLockGuard stepId="smokecraft-challenge"><SmokeCraftChallenge /></VisitLockGuard>} />
                <Route path="second-humidor-match"  element={<VisitLockGuard stepId="second-humidor-match"><SecondHumidorMatch /></VisitLockGuard>} />
                <Route path="mini-tasting"          element={<VisitLockGuard stepId="mini-tasting"><MiniTastingRound /></VisitLockGuard>} />
                <Route path="final-review"          element={<VisitLockGuard stepId="final-review"><FinalReview /></VisitLockGuard>} />
                <Route path="event-challenge"  element={<EventChallenge />} />
                <Route path="connections"      element={<VisitLockGuard stepId="connections"><Connections /></VisitLockGuard>} />
                <Route path="management-sync"  element={<VisitLockGuard stepId="management-sync"><ManagementSync /></VisitLockGuard>} />
                <Route path="how-it-works"     element={<HowItWorks />} />
                <Route path="challenge"        element={<Navigate to="/smokecraft/leaf-challenge" replace />} />
                <Route path="session/start"    element={<Navigate to="/smokecraft/enroll" replace />} />
                <Route path="guest-pass"       element={<GuestPass />} />
                <Route path="demo"             element={<Demo />} />
                <Route path="scan"             element={<Scan />} />
                <Route path="passport"         element={<Navigate to="/passport" replace />} />
              </Route>

              <Route path="signin" element={<SignIn />} />

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

              {/* ── Legacy E.A.T. Command (older surface) — moved to /eat-legacy
                   so the NEW E.A.T. management system can own /eat. ───── */}
              <Route path="eat-legacy" element={
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

              {/* ── NEW POS 3 system — nested route tree ───────────── */}
              {/* ── Protected: staff+ — BLOCKED in demo mode ────── */}
              <Route path="pos3" element={
                <ProtectedRoute
                  requiredPermission="access_pos3_staff"
                  loginRoute="/staff-login"
                  loginLabel="Staff Login"
                  lockedMessage="POS 3 requires staff-level access. Please sign in with your staff PIN."
                  demoBlocked
                >
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route index            element={<POS3Home />} />
                <Route path="handheld"  element={<POS3Handheld />} />
                <Route path="tables"    element={<POS3Tables />} />
                <Route path="orders"    element={<POS3Orders />} />
                <Route path="checkout"  element={<POS3Checkout />} />
                <Route path="kitchen"   element={<KitchenDisplay />} />
                <Route path="bar"       element={<BarDisplay />} />
                <Route path="humidor"   element={<HumidorControl />} />
                <Route path="inventory" element={<InventoryControl />} />
                <Route path="integrations" element={<POSIntegrationHub />} />
                <Route path="settings"  element={<POS3Settings />} />
              </Route>

              {/* ── NEW E.A.T. management system — nested route tree ── */}
              {/* ── Protected: manager+ — BLOCKED in demo mode ────── */}
              <Route path="eat" element={
                <ProtectedRoute
                  requiredPermission="access_eat_command"
                  loginRoute="/admin-login"
                  loginLabel="Manager / Admin Login"
                  lockedMessage="E.A.T. Command requires manager-level access or higher."
                  demoBlocked
                >
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route index              element={<EATCommandHub />} />
                <Route path="command-hub" element={<EATCommandHub />} />
                <Route path="pos-control" element={<EATPosControl />} />
                <Route path="operations"  element={<EATOperations />} />
                <Route path="inventory"   element={<EATInventory />} />
                <Route path="reorders"    element={<EATReorders />} />
                <Route path="staff"       element={<EATStaff />} />
                <Route path="sections"    element={<EATSections />} />
                <Route path="kitchen"     element={<EATKitchen />} />
                <Route path="bar"         element={<EATBar />} />
                <Route path="humidor"     element={<EATHumidor />} />
                <Route path="data"        element={<EATData />} />
                <Route path="reports"     element={<EATReports />} />
                <Route path="device-mode" element={<EATDeviceMode />} />
                <Route path="media"       element={<EATMediaLibrary />} />
                <Route path="settings"    element={<EATSettings />} />
              </Route>

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

              {/* ── Protected: admin+ — Novi module deployment center (read-only) ── */}
              <Route path="admin/deployment-center" element={
                <ProtectedRoute
                  allowedRoles={['admin', 'founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Admin Login"
                  lockedMessage="Module Deployment Center requires Novi admin-level access or higher."
                  demoBlocked
                >
                  <ModuleDeploymentCenter />
                </ProtectedRoute>
              } />

              {/* ── Public, no login: temporary read-only review copy of the
                   Deployment Center. Renders the same screen with readOnly
                   forced true — no vendor assignment, disable, restore, or
                   deploy actions are reachable from this route. Does not
                   touch /admin/deployment-center, which remains protected. ── */}
              <Route path="review/deployment-center" element={
                <ModuleDeploymentCenter readOnly />
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
              {/* command-center / eat-command now resolve to the NEW /eat hub */}
              <Route path="command-center" element={<Navigate to="/eat" replace />} />
              <Route path="eat-command"  element={<Navigate to="/eat" replace />} />
              {/* NOTE: pos3 -> /pos redirect removed; /pos3 is now a real route tree */}
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
        </ErrorBoundary>

        {/* Dev-only floating role switcher */}
        <DevRoleSwitcher />
        </KioskShell>
      </BrowserRouter>
    </DemoModeProvider>
  )
}
