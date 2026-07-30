import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGuestSession } from './context/GuestSessionContext.jsx'
import { DemoModeProvider } from './context/DemoModeContext.jsx'
import Layout from './components/Layout.jsx'
import DemoBanner from './components/demo/DemoBanner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PublicSessionNotice from './components/PublicSessionNotice.jsx'
import BuildDiagnosticFooter from './components/system/BuildDiagnosticFooter.jsx'
import BuildInfo from './pages/system/BuildInfo.jsx'

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
import POS360TableManagement from './pages/pos3/POS360TableManagement.jsx'
import POS360VenueSystemsSetup from './pages/pos3/POS360VenueSystemsSetup.jsx'
import POS360VisualProof from './pages/pos3/POS360VisualProof.jsx'

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
import EATSmokeCraftPanel from './pages/eat/EATSmokeCraftPanel.jsx'
import StaffPinScreen from './pages/staff/StaffPinScreen.jsx'
import POS360SmokeCraftCheckout from './pages/pos360/POS360SmokeCraftCheckout.jsx'
import POS360FloorManagement from './pages/pos360/POS360FloorManagement.jsx'
import POS360VenueMenuBuilder from './pages/pos360/POS360VenueMenuBuilder.jsx'
import POS360HandheldPOS from './pages/pos360/POS360HandheldPOS.jsx'
import POS360ProductionDisplay from './pages/pos360/POS360ProductionDisplay.jsx'
import POS360OrderLifecycle from './pages/pos360/POS360OrderLifecycle.jsx'
import POS360OfflineSync from './pages/pos360/POS360OfflineSync.jsx'
import POS360Payments from './pages/pos360/POS360Payments.jsx'
import POS360CustomerLoyalty from './pages/pos360/POS360CustomerLoyalty.jsx'
import POS360ReservationsGuestFlow from './pages/pos360/POS360ReservationsGuestFlow.jsx'
import POS360EventPackagesMonetization from './pages/pos360/POS360EventPackagesMonetization.jsx'
import POS360PaymentsCloseout from './pages/pos360/POS360PaymentsCloseout.jsx'
import POS360StaffLaborGovernance from './pages/pos360/POS360StaffLaborGovernance.jsx'
import POS360ReportsAnalyticsDecision from './pages/pos360/POS360ReportsAnalyticsDecision.jsx'
import POS360SettingsVenueAdmin from './pages/pos360/POS360SettingsVenueAdmin.jsx'
import POS360ExternalIntegrations from './pages/pos360/POS360ExternalIntegrations.jsx'
import POS360FulfillmentKds from './pages/pos360/POS360FulfillmentKds.jsx'
import POS360SelfOrdering from './pages/pos360/POS360SelfOrdering.jsx'
import POS360ProductionReadiness from './pages/pos360/POS360ProductionReadiness.jsx'
import NoveeOSModuleRegistry    from './pages/noveeOS/NoveeOSModuleRegistry.jsx'
import NoveeOSTenantGovernance  from './pages/noveeOS/NoveeOSTenantGovernance.jsx'
import NoveeOSBillingGovernance  from './pages/noveeOS/NoveeOSBillingGovernance.jsx'
import NoveeOSSecurityGovernance from './pages/noveeOS/NoveeOSSecurityGovernance.jsx'
import CraftHubDashboard         from './pages/crafthub/CraftHubDashboard.jsx'
import CraftHubOnboardingWizard  from './pages/crafthub/CraftHubOnboardingWizard.jsx'
import NoveeOSFinalReadiness     from './pages/noveeOS/NoveeOSFinalReadiness.jsx'
import PhaseDProviderActivation  from './pages/phaseD/PhaseDProviderActivation.jsx'
import PhaseDPaymentProviderActivation from './pages/phaseD/PhaseDPaymentProviderActivation.jsx'
import PhaseDExternalPOSActivation from './pages/phaseD/PhaseDExternalPOSActivation.jsx'
import PhaseDInventoryActivation from './pages/phaseD/PhaseDInventoryActivation.jsx'
import PhaseDCommunicationActivation from './pages/phaseD/PhaseDCommunicationActivation.jsx'
import SecurityActivation            from './pages/phaseD/SecurityActivation.jsx'
import DeploymentActivation          from './pages/phaseD/DeploymentActivation.jsx'
import LivePilotReadiness            from './pages/phaseD/LivePilotReadiness.jsx'
import RemoteModuleDistribution      from './pages/noveeOS/RemoteModuleDistribution.jsx'
import OnboardingTrainingCenter      from './pages/noveeOS/OnboardingTrainingCenter.jsx'
import AMBIFoundation               from './pages/noveeOS/AMBIFoundation.jsx'
import DocumentationPortal          from './pages/noveeOS/DocumentationPortal.jsx'
import NoveeOSCommandCenter          from './pages/noveeOS/NoveeOSCommandCenter.jsx'
import NoveeOS360PlatformRegistry    from './pages/noveeOS/NoveeOS360PlatformRegistry.jsx'
import ModulePlaceholderReserved     from './pages/ModulePlaceholderReserved.jsx'

// ── SmokeCraft guest flow — eager (guest-accessible, core journey) ─
import SmokeCraft       from './pages/SmokeCraft.jsx'
import SmokeCraftVisualProof from './pages/smokecraft/SmokeCraftVisualProof.jsx'
import SmokeCraftImageDiagnostic from './pages/smokecraft/SmokeCraftImageDiagnostic.jsx'
import SmokeCraftVenuePilotPackage from './pages/smokecraft/SmokeCraftVenuePilotPackage.jsx'
import Enroll           from './pages/smokecraft/Enroll.jsx'
import VenueSelect      from './pages/smokecraft/VenueSelect.jsx'
import GoldenBox        from './pages/smokecraft/GoldenBox.jsx'
import GoldenBoxStatus  from './pages/smokecraft/GoldenBoxStatus.jsx'
const GoldenBoxHub = lazy(() => import('./pages/smokecraft/goldenBox/GoldenBoxHub.jsx'))
const VenueHumidorBrowser = lazy(() => import('./pages/smokecraft/venueHumidor/VenueHumidorBrowser.jsx'))
const VenueHumidorCigarDetail = lazy(() => import('./pages/smokecraft/venueHumidor/VenueHumidorCigarDetail.jsx'))
const VenueHumidorCheckout = lazy(() => import('./pages/smokecraft/venueHumidor/VenueHumidorCheckout.jsx'))
const VenueHumidorOrderConfirmation = lazy(() => import('./pages/smokecraft/venueHumidor/VenueHumidorOrderConfirmation.jsx'))
const GoldenBoxCompetitionDetail = lazy(() => import('./pages/smokecraft/goldenBox/CompetitionDetail.jsx'))
const GoldenBoxEntryWorkspace = lazy(() => import('./pages/smokecraft/goldenBox/EntryWorkspace.jsx'))
const GoldenBoxResultsExperience = lazy(() => import('./pages/smokecraft/goldenBox/ResultsExperience.jsx'))
const GoldenBoxJudgeDashboard = lazy(() => import('./pages/smokecraft/goldenBox/JudgeDashboard.jsx'))
const GoldenBoxJudgeEntryReview = lazy(() => import('./pages/smokecraft/goldenBox/JudgeEntryReview.jsx'))
const GoldenBoxMentorReview = lazy(() => import('./pages/smokecraft/goldenBox/MentorReview.jsx'))
const PackagingStudioDashboard = lazy(() => import('./pages/smokecraft/goldenBox/PackagingStudioDashboard.jsx'))
const PackagingStudioEditor = lazy(() => import('./pages/smokecraft/goldenBox/PackagingStudioEditor.jsx'))
const PackagingStudioVersions = lazy(() => import('./pages/smokecraft/goldenBox/PackagingStudioVersions.jsx'))
const PackagingStudioShare = lazy(() => import('./pages/smokecraft/goldenBox/PackagingStudioShare.jsx'))
const PackagingReview = lazy(() => import('./pages/smokecraft/goldenBox/PackagingReview.jsx'))
import Art              from './pages/smokecraft/Art.jsx'
import Mentor           from './pages/smokecraft/Mentor.jsx'
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
import KnowledgeCheckDemo from './pages/smokecraft/KnowledgeCheckDemo.jsx'
import MiniTasting from './pages/smokecraft/MiniTasting.jsx'
import PairingMastery   from './pages/smokecraft/PairingMastery.jsx'
import Vitola           from './pages/smokecraft/Vitola.jsx'
import Identity         from './pages/smokecraft/Identity.jsx'
import ResumeJourney    from './pages/smokecraft/ResumeJourney.jsx'
import Leaderboard      from './pages/smokecraft/Leaderboard.jsx'
import RewardsCenter    from './pages/smokecraft/RewardsCenter.jsx'
import Account          from './pages/smokecraft/Account.jsx'
import SmokeCraftPassport from './pages/smokecraft/SmokeCraftPassport.jsx'
import SmokeCraftCraftHub from './pages/smokecraft/SmokeCraftCraftHub.jsx'
import SmokeCraftScreenRenderer from './components/smokecraft/SmokeCraftScreenRenderer.jsx'
import SeedSoil         from './pages/smokecraft/SeedSoil.jsx'
import RequestPurchase  from './pages/smokecraft/RequestPurchase.jsx'
import EventChallenge   from './pages/smokecraft/EventChallenge.jsx'
import Connections      from './pages/smokecraft/Connections.jsx'
import ManagementSync   from './pages/smokecraft/ManagementSync.jsx'
import ManagementSyncAnalytics from './pages/smokecraft/ManagementSyncAnalytics.jsx'
import WrapperStrength     from './pages/smokecraft/WrapperStrength.jsx'
import CigarGaugeGuide     from './pages/smokecraft/CigarGaugeGuide.jsx'
import SmokeCraftChallenge from './pages/smokecraft/SmokeCraftChallenge.jsx'
import SecondHumidorMatch  from './pages/smokecraft/SecondHumidorMatch.jsx'
import MiniTastingRound    from './pages/smokecraft/MiniTastingRound.jsx'
import SkillTree           from './pages/smokecraft/SkillTree.jsx'
import CollectionsCenter   from './pages/smokecraft/CollectionsCenter.jsx'
import ChallengeHub        from './pages/smokecraft/ChallengeHub.jsx'
import BlendFaultChallenge from './pages/smokecraft/BlendFaultChallenge.jsx'
import FillerArrangement   from './pages/smokecraft/FillerArrangement.jsx'
import VisitLockGuard      from './components/smokecraft/VisitLockGuard.jsx'
import SmokeCraftSessionGuard from './components/smokecraft/SmokeCraftSessionGuard.jsx'
import { SmokeCraftProgressProvider } from './context/SmokeCraftProgressContext.jsx'
import { SmokeCraftOrderProvider }   from './context/SmokeCraftOrderContext.jsx'
import { SmokeCraftJourneyProvider } from './context/SmokeCraftJourneyContext.jsx'
import SmokeCraftMenu          from './pages/smokecraft/SmokeCraftMenu.jsx'
import SmokeCraftVenueCommerce from './pages/smokecraft/SmokeCraftVenueCommerce.jsx'
import SmokeCraftCart          from './pages/smokecraft/SmokeCraftCart.jsx'
import SmokeCraftCheckout      from './pages/smokecraft/SmokeCraftCheckout.jsx'
import SmokeCraftPaymentSuccess from './pages/smokecraft/SmokeCraftPaymentSuccess.jsx'
import SmokeCraftOrderStatus   from './pages/smokecraft/SmokeCraftOrderStatus.jsx'
import VisitComplete        from './pages/smokecraft/VisitComplete.jsx'
import HowItWorks       from './pages/smokecraft/HowItWorks.jsx'
import SmokeCraftDemoReset from './components/smokecraft/SmokeCraftDemoReset.jsx'
import GuestPass        from './pages/smokecraft/GuestPass.jsx'
import Demo             from './pages/smokecraft/Demo.jsx'
import Scan             from './pages/smokecraft/Scan.jsx'
import FeatureFlagAdmin from './pages/smokecraft/FeatureFlagAdmin.jsx'
import ErrorLogViewer  from './pages/smokecraft/ErrorLogViewer.jsx'
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
import TicketTapperManagement from './pages/ticketTapper/TicketTapperManagement.jsx'
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
const VenueManagementCommandHub = lazy(() => import('./pages/venueManagement/VenueManagementCommandHub.jsx'))
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
        <BuildDiagnosticFooter />
        <KioskShell>
        <ErrorBoundary>
        <Suspense fallback={<NOVEELoader />}>
          <Routes>
            {/* ── Boot — public NOVEE OS boot screen at root and /boot ── */}
            <Route path="/" element={<Boot />} />
            <Route path="boot" element={<Boot />} />
            <Route path="boot/console" element={<BootConsole />} />
            {/* Production Build Identity pass — non-sensitive deployment diagnostics, public (no dashboard/CLI needed to prove what Railway is serving) */}
            <Route path="system/build-info" element={<BuildInfo />} />

            {/* ── Login screens — lazy, accessible without boot ─── */}
            <Route path="staff-login"   element={<StaffLogin />} />
            <Route path="staff/pin"     element={<StaffPinScreen />} />
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
              <Route path="smokecraft" element={<SmokeCraftJourneyProvider><SmokeCraftProgressProvider><SmokeCraftOrderProvider><Outlet /></SmokeCraftOrderProvider></SmokeCraftProgressProvider></SmokeCraftJourneyProvider>}>
                {/* Entry-layer Launch — always unlocked (SmokeCraft landing, distinct from S1 Welcome below).
                    enforceEntryReadiness=false: this is the intentionally-public
                    informational landing page a guest sees BEFORE enrollment —
                    it must remain reachable to show the Start CTA, unlike
                    Welcome below which is the real first protected session. */}
                <Route index element={<SmokeCraftSessionGuard sessionNumber={1} enforceEntryReadiness={false}><SmokeCraft /></SmokeCraftSessionGuard>} />

                {/* S1 — welcome (Welcome to Today's Experience) — Package N */}
                <Route path="welcome"          element={<SmokeCraftSessionGuard sessionNumber={1}><SmokeCraftScreenRenderer screenId="session-1" /></SmokeCraftSessionGuard>} />

                {/* E2 — Sign In / Guest Mode (entry-layer, outside the 27-session spine) */}
                <Route path="enroll"           element={<SmokeCraftSessionGuard requires="entry"><Enroll /></SmokeCraftSessionGuard>} />

                {/* E4 — Select Venue or Lounge (entry-layer, outside the 27-session spine).
                    Canonical order: Enroll -> Identity -> Venue -> Welcome, so this now
                    requires "identity" (not "enroll") — Identity is a real, required
                    entry step between Guest Pass and Venue Selection. */}
                <Route path="venue-select"     element={<SmokeCraftSessionGuard requires="identity"><VenueSelect /></SmokeCraftSessionGuard>} />
                <Route path="intake"           element={<Navigate to="/smokecraft/enroll" replace />} />
                <Route path="entry"            element={<Navigate to="/smokecraft" replace />} />
                {/* profile → identity (alias per spec) */}
                <Route path="profile"          element={<Navigate to="/smokecraft/identity" replace />} />
                <Route path="education"        element={<Navigate to="/smokecraft/format" replace />} />
                <Route path="mentors"          element={<Navigate to="/smokecraft/mentor-selection" replace />} />
                <Route path="humidor"          element={<Navigate to="/smokecraft/humidor-match" replace />} />
                <Route path="light"            element={<Navigate to="/smokecraft/cut-toast-light" replace />} />
                <Route path="complete"         element={<Navigate to="/smokecraft/session-complete" replace />} />

                {/* Golden Box — supporting module (outside the 27-session spine), reachable from S1 */}
                <Route path="golden-box">
                  <Route index             element={<SmokeCraftSessionGuard requires="entry"><GoldenBox /></SmokeCraftSessionGuard>} />
                  <Route path="status"     element={<GoldenBoxStatus />} />
                  {/* Package 2 — live Golden Box competition flow (Package 1's
                      real backend). No route-level session guard: the server
                      itself enforces identity/eligibility/ownership on every
                      call, matching the ManagementSyncAnalytics pattern. */}
                  <Route path="competitions" element={<GoldenBoxHub />} />
                  <Route path="competitions/:competitionId" element={<GoldenBoxCompetitionDetail />} />
                  <Route path="entries/:entryId/blend" element={<GoldenBoxEntryWorkspace />} />
                  <Route path="results/:competitionId" element={<GoldenBoxResultsExperience />} />
                  <Route path="judge" element={<GoldenBoxJudgeDashboard />} />
                  <Route path="judge/entries/:entryId" element={<GoldenBoxJudgeEntryReview />} />
                  <Route path="mentor/entries/:entryId" element={<GoldenBoxMentorReview />} />
                  {/* Packaging Studio — Golden Box competition feature, not
                      a new core learning session (27-session count
                      unchanged). Positioned between blend/build and
                      presentation/defense per the entry workflow. */}
                  <Route path="packaging-studio" element={<PackagingStudioDashboard />} />
                  <Route path="packaging-studio/new" element={<PackagingStudioDashboard />} />
                  <Route path="packaging-studio/:designId" element={<PackagingStudioEditor />} />
                  <Route path="packaging-studio/:designId/preview" element={<PackagingStudioEditor />} />
                  <Route path="packaging-studio/:designId/versions" element={<PackagingStudioVersions />} />
                  <Route path="packaging-studio/:designId/share" element={<PackagingStudioShare />} />
                  <Route path="packaging-review/:shareToken" element={<PackagingReview />} />
                </Route>
                {/* gold-box → golden-box alias per spec */}
                <Route path="gold-box"       element={<Navigate to="/smokecraft/golden-box" replace />} />

                {/* Venue Humidor 1B-1 — customer browsing/detail only (no
                    session guard: the server itself enforces venue
                    validity/isolation on every call, matching Golden Box's
                    pattern). */}
                <Route path="venue-humidor"                element={<VenueHumidorBrowser />} />
                <Route path="venue-humidor/checkout"       element={<VenueHumidorCheckout />} />
                <Route path="venue-humidor/order/:orderId" element={<VenueHumidorOrderConfirmation />} />
                <Route path="venue-humidor/:cigarId"       element={<VenueHumidorCigarDetail />} />

                {/* Mentor Selection — supporting module (outside the 27-session spine).
                    Not yet folded into Meet Your Cigar (S3) as an internal tab per the
                    locked plan's longer-term note — that consolidation is a screen
                    redesign, explicitly out of scope for Package J. */}
                <Route path="art"            element={<Art />} />
                <Route path="mentor-selection" element={<SmokeCraftSessionGuard requires="entry"><Mentor /></SmokeCraftSessionGuard>} />
                <Route path="mentor"         element={<Navigate to="/smokecraft/mentor-selection" replace />} />

                {/* S2 — humidor-match (Choose Your Cigar) */}
                <Route path="humidor-match"    element={<SmokeCraftSessionGuard sessionNumber={2}><SmokeCraftScreenRenderer screenId="session-2" /></SmokeCraftSessionGuard>} />

                {/* S3 — meet-your-cigar (Meet Your Cigar) */}
                <Route path="meet-your-cigar"  element={<SmokeCraftSessionGuard sessionNumber={3}><SmokeCraftScreenRenderer screenId="session-3" /></SmokeCraftSessionGuard>} />

                {/* S4 — terroir (Terroir) */}
                <Route path="terroir"        element={<SmokeCraftSessionGuard sessionNumber={4}><SmokeCraftScreenRenderer screenId="session-4" /></SmokeCraftSessionGuard>} />

                {/* S5 — format (Construction Inspection) */}
                <Route path="format"         element={<SmokeCraftSessionGuard sessionNumber={5}><SmokeCraftScreenRenderer screenId="session-5" /></SmokeCraftSessionGuard>} />
                {/* shape-size-burn is a backward-compatible alias for format, not an independent route */}
                <Route path="shape-size-burn" element={<Navigate to="/smokecraft/format" replace />} />
                <Route path="cigar-gauge-guide" element={<SmokeCraftSessionGuard sessionNumber={5}><CigarGaugeGuide /></SmokeCraftSessionGuard>} />

                {/* Wrapper/Strength Education — supporting module, reachable from S5 */}
                <Route path="wrapper-strength" element={<SmokeCraftSessionGuard requires="format"><WrapperStrength /></SmokeCraftSessionGuard>} />

                {/* Seed & Soil — supporting module. Package 0 eventually merges this
                    content into Terroir (S4) as a tab; that merge is a screen redesign,
                    explicitly out of scope for Package J, so the route remains standalone. */}
                <Route path="seed-soil"        element={<SmokeCraftSessionGuard requires="mentor"><SeedSoil /></SmokeCraftSessionGuard>} />

                {/* S6 — cut-toast-light (Choose Your Cut) */}
                <Route path="cut-toast-light"  element={<SmokeCraftSessionGuard sessionNumber={6}><SmokeCraftScreenRenderer screenId="session-6" /></SmokeCraftSessionGuard>} />
                {/* S7 — lighting-tutorial (Lighting Tutorial) */}
                <Route path="lighting-tutorial" element={<SmokeCraftSessionGuard sessionNumber={7}><SmokeCraftScreenRenderer screenId="session-7" /></SmokeCraftSessionGuard>} />

                {/* S8/S9 — first-third (First Draw / Flavor Discovery, merged — see session.js) */}
                <Route path="first-third"      element={<SmokeCraftSessionGuard sessionNumber={8}><SmokeCraftScreenRenderer screenId="session-8" /></SmokeCraftSessionGuard>} />

                {/* S10 — flavor-memory (Flavor Memory Exercise) */}
                <Route path="flavor-memory"    element={<SmokeCraftSessionGuard sessionNumber={10}><SmokeCraftScreenRenderer screenId="session-10" /></SmokeCraftSessionGuard>} />

                {/* S11 — pairing-lab (Suggested Pairings) */}
                <Route path="pairing-lab"      element={<SmokeCraftSessionGuard sessionNumber={11}><SmokeCraftScreenRenderer screenId="session-11" /></SmokeCraftSessionGuard>} />

                {/* Request/Purchase — supporting module (an embedded drawer per the
                    locked plan; kept as a standalone route since folding it into S2 as
                    a drawer is a screen redesign, out of scope for Package J) */}
                <Route path="request-purchase" element={<SmokeCraftSessionGuard requires="humidor-match"><RequestPurchase /></SmokeCraftSessionGuard>} />

                {/* S12/S13 — second-third (Flavor Evolution / Construction Check, merged — see session.js) */}
                <Route path="second-third"     element={<SmokeCraftSessionGuard sessionNumber={12}><SmokeCraftScreenRenderer screenId="session-12" /></SmokeCraftSessionGuard>} />

                {/* S14 — mentor-commentary (Mentor Commentary) */}
                <Route path="mentor-commentary" element={<SmokeCraftSessionGuard sessionNumber={14}><SmokeCraftScreenRenderer screenId="session-14" /></SmokeCraftSessionGuard>} />

                {/* S15 — knowledge-drop (Knowledge Drop) */}
                <Route path="knowledge-drop"   element={<SmokeCraftSessionGuard sessionNumber={15}><SmokeCraftScreenRenderer screenId="session-15" /></SmokeCraftSessionGuard>} />

                {/* Knowledge Check / Text Quiz — reusable supporting module QA harness
                    (Package O). Not part of the numbered spine or any educational
                    screen; exists only to render/test the reusable component. */}
                <Route path="knowledge-check-demo" element={<SmokeCraftSessionGuard requires="entry"><KnowledgeCheckDemo /></SmokeCraftSessionGuard>} />

                {/* Mini Tasting — live supporting module (Package Q). Separate from the
                    numbered-spine "mini-tasting" completion step (MiniTastingRound.jsx,
                    S19 unlock), which is left untouched. No route previously existed for
                    this standalone module, so one permissive route is added here, per
                    the same necessary-exception pattern used for Package O's QA harness. */}
                <Route path="mini-tasting-module" element={<SmokeCraftSessionGuard requires="entry"><MiniTasting /></SmokeCraftSessionGuard>} />

                {/* S16/S17/S18 — final-third (Flavor Finish / Strength Progression / Overall Experience Notes, merged — see session.js) */}
                <Route path="final-third"      element={<SmokeCraftSessionGuard sessionNumber={16}><SmokeCraftScreenRenderer screenId="session-16" /></SmokeCraftSessionGuard>} />

                {/* S19/S20 — scorecard (Rate Every Category / Personal Notes, merged — see session.js) */}
                <Route path="scorecard"        element={<SmokeCraftSessionGuard sessionNumber={19}><SmokeCraftScreenRenderer screenId="session-19" /></SmokeCraftSessionGuard>} />

                {/* SmokeCraft Challenge — supporting module, reachable from S19/S20 */}
                <Route path="smokecraft-challenge"  element={<SmokeCraftSessionGuard requires="scorecard"><SmokeCraftChallenge /></SmokeCraftSessionGuard>} />
                {/* challenge now points to smokecraft-challenge per spec (not leaf-challenge) */}
                <Route path="challenge"        element={<Navigate to="/smokecraft/smokecraft-challenge" replace />} />

                {/* Second Humidor Match — supporting module, reachable from S19/S20 */}
                <Route path="second-humidor-match"  element={<SmokeCraftSessionGuard requires="scorecard"><SecondHumidorMatch /></SmokeCraftSessionGuard>} />

                {/* Mini Tasting Round — supporting module, reachable from S19/S20 */}
                <Route path="mini-tasting"          element={<SmokeCraftSessionGuard requires="scorecard"><MiniTastingRound /></SmokeCraftSessionGuard>} />
                <Route path="mini-tasting-round"    element={<Navigate to="/smokecraft/mini-tasting" replace />} />

                {/* S21 — ai-summary (AI Summary) */}
                {/* Canonical Runtime pass — migrated through SmokeCraftScreenRenderer (screenId="session-21"), the one representative screen proving the new manifest/registry/data-selector/completion-service layer. See docs/audits/smokecraft-final-completion/canonical-runtime/ for scope. */}
                <Route path="ai-summary"       element={<SmokeCraftSessionGuard sessionNumber={21}><SmokeCraftScreenRenderer screenId="session-21" /></SmokeCraftSessionGuard>} />

                {/* S22 — pairing-recommendations (Personalized Pairing Recommendations) */}
                <Route path="pairing-recommendations" element={<SmokeCraftSessionGuard sessionNumber={22}><SmokeCraftScreenRenderer screenId="session-22" /></SmokeCraftSessionGuard>} />

                {/* S23 — passport-stamp (Passport Stamp Animation) */}
                <Route path="passport-stamp"   element={<SmokeCraftSessionGuard sessionNumber={23}><SmokeCraftScreenRenderer screenId="session-23" /></SmokeCraftSessionGuard>} />

                {/* Connections — supporting module, reachable from S23 */}
                <Route path="connections"      element={<SmokeCraftSessionGuard requires="passport-stamp"><Connections /></SmokeCraftSessionGuard>} />

                {/* Management Sync — supporting module (admin-facing), reachable from S23 */}
                <Route path="management-sync"  element={<SmokeCraftSessionGuard requires="passport-stamp"><ManagementSync /></SmokeCraftSessionGuard>} />
                {/* Venue-manager-only real analytics destination (Package D) —
                    no guest session guard: the server itself enforces
                    requireAuth + requireVenueMembership; a guest hitting
                    this URL sees the page's own "Unauthorized" state. */}
                <Route path="management-sync/analytics" element={<ManagementSyncAnalytics />} />

                {/* S24 — final-review (Completed Scorecard) */}
                <Route path="final-review"          element={<SmokeCraftSessionGuard sessionNumber={24}><SmokeCraftScreenRenderer screenId="session-24" /></SmokeCraftSessionGuard>} />

                {/* S25 Rewards and XP / S26 Achievements — one shared route/component
                    (see session.js `sharedComponent`); S26's own gate is enforced
                    inside Rewards.jsx (same route, can't have two <Route> entries). */}
                <Route path="rewards"          element={<SmokeCraftSessionGuard sessionNumber={25}><SmokeCraftScreenRenderer screenId="session-25" /></SmokeCraftSessionGuard>} />

                {/* Supporting gamification screens — outside the locked 27-session
                    numbered sequence per the visual-closure-continuation pass;
                    only requires enrollment, not a specific session number. */}
                <Route path="skill-tree"     element={<SmokeCraftSessionGuard requires="entry"><SkillTree /></SmokeCraftSessionGuard>} />
                <Route path="collections"    element={<SmokeCraftSessionGuard requires="entry"><CollectionsCenter /></SmokeCraftSessionGuard>} />
                <Route path="challenge-hub"  element={<SmokeCraftSessionGuard requires="entry"><ChallengeHub /></SmokeCraftSessionGuard>} />
                <Route path="challenges/blend-fault-identification" element={<SmokeCraftSessionGuard requires="entry"><BlendFaultChallenge /></SmokeCraftSessionGuard>} />
                <Route path="filler-arrangement" element={<SmokeCraftSessionGuard requires="entry"><FillerArrangement /></SmokeCraftSessionGuard>} />

                {/* S25/S26 — Rewards and XP / Achievements are honestly deferred (no
                    screen exists, no route registered) per Package J's deferred-session
                    rule — explicitly not built this package. */}

                {/* S27 — session-complete (Recommended Next Journey) */}
                <Route path="session-complete" element={<SmokeCraftSessionGuard sessionNumber={27}><SmokeCraftScreenRenderer screenId="session-27" /></SmokeCraftSessionGuard>} />

                {/* Visit complete interstitial */}
                <Route path="visit-complete"   element={<VisitComplete />} />

                {/* Supplemental / unguarded pages */}
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
                <Route path="pairing-mastery" element={<PairingMastery />} />
                <Route path="vitola"         element={<Vitola />} />
                {/* E4 — Personal Dashboard (entry-layer, outside the 27-session spine).
                    Identity's own useEffect gate already requires 'enroll' complete
                    (Package B); requires="entry" here is a permissive outer guard. */}
                {/* E3 — Personal Identity (entry-layer, outside the 27-session spine).
                    Canonical order: Enroll -> Identity -> Venue -> Welcome. */}
                <Route path="identity"       element={<SmokeCraftSessionGuard requires="enroll"><Identity /></SmokeCraftSessionGuard>} />

                {/* E5 — Resume or Start New Journey (entry-layer, outside the 27-session spine) */}
                <Route path="resume"         element={<SmokeCraftSessionGuard requires="enroll"><ResumeJourney /></SmokeCraftSessionGuard>} />

                <Route path="leaderboard"    element={<Leaderboard />} />
                {/* Landing "Rewards" destination card — landing-accessible Reward
                    Center (approved Reward Center.png), distinct from the in-
                    journey S25 Rewards flow at /smokecraft/rewards. Unguarded so
                    the approved visual is actually reachable from Landing. */}
                <Route path="rewards-center"   element={<RewardsCenter />} />
                <Route path="account"          element={<Account />} />
                <Route path="event-challenge"  element={<EventChallenge />} />
                <Route path="how-it-works"     element={<HowItWorks />} />
                <Route path="demo-reset"       element={<SmokeCraftDemoReset />} />
                <Route path="session/start"    element={<Navigate to="/smokecraft/enroll" replace />} />
                <Route path="guest-pass"       element={<GuestPass />} />
                <Route path="demo"             element={<Demo />} />
                <Route path="scan"             element={<Scan />} />
                {/* Approved-Asset Control Plane pass: this was a <Navigate>
                    alias out to the unrelated top-level /passport module, so
                    the SmokeCraft Landing had no approved Passport destination
                    at all and its Passport control pointed at the session-23
                    guarded passport-stamp screen (which bounced guests to
                    enroll). It is now the real landing-accessible approved
                    Passport visual. No session guard: this is a destination
                    screen, not a curriculum session. */}
                <Route path="passport"         element={<SmokeCraftPassport />} />

                {/* Approved-Asset Control Plane pass: new landing-accessible
                    CraftHub destination. The Landing's CRAFTHUB tile previously
                    navigated to the scorecard-guarded smokecraft-challenge
                    screen and never showed a CraftHub visual. */}
                <Route path="crafthub"         element={<SmokeCraftCraftHub />} />
                {/* Venue commerce flow */}
                <Route path="menu"             element={<SmokeCraftMenu />} />
                <Route path="venue-commerce"                    element={<SmokeCraftVenueCommerce />} />
                <Route path="order"                           element={<SmokeCraftVenueCommerce />} />
                <Route path="ticket-tapper/staff-specials"    element={<SmokeCraftVenueCommerce />} />
                <Route path="cart"             element={<SmokeCraftCart />} />
                <Route path="checkout"         element={<SmokeCraftCheckout />} />
                <Route path="payment-success"  element={<SmokeCraftPaymentSuccess />} />
                <Route path="order-status"     element={<SmokeCraftOrderStatus />} />
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
              <Route path="ticket-tapper/management" element={<TicketTapperManagement />} />
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

              {/* ── Visual proof routes — no auth required ── */}
              <Route path="pos360-visual-proof" element={<POS360VisualProof />} />
              <Route path="smokecraft-visual-proof" element={<SmokeCraftVisualProof />} />
              <Route path="smokecraft-image-diagnostic" element={<SmokeCraftImageDiagnostic />} />
              {/* Staff/admin facing — not part of guest journey */}
              <Route path="smokecraft/venue-pilot-package" element={<SmokeCraftVenuePilotPackage />} />

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
                <Route path="venue-tables" element={<POS360TableManagement />} />
                <Route path="venue-systems" element={<POS360VenueSystemsSetup />} />
                <Route path="orders"    element={<POS3Orders />} />
                <Route path="checkout"  element={<POS3Checkout />} />
                <Route path="kitchen"   element={<KitchenDisplay />} />
                <Route path="bar"       element={<BarDisplay />} />
                <Route path="humidor"   element={<HumidorControl />} />
                <Route path="inventory" element={<InventoryControl />} />
                <Route path="integrations" element={<POSIntegrationHub />} />
                <Route path="settings"  element={<POS3Settings />} />
                <Route path="smokecraft-checkout" element={<POS360SmokeCraftCheckout />} />
                <Route path="floor-management"  element={<POS360FloorManagement />} />
                <Route path="menu-builder"      element={<POS360VenueMenuBuilder />} />
                <Route path="handheld"          element={<POS360HandheldPOS />} />
                <Route path="production"        element={<POS360ProductionDisplay />} />
                <Route path="orders"           element={<POS360OrderLifecycle />} />
                <Route path="sync"             element={<POS360OfflineSync />} />
                <Route path="payments"         element={<POS360Payments />} />
                <Route path="guests"           element={<POS360CustomerLoyalty />} />
                <Route path="reservations"    element={<POS360ReservationsGuestFlow />} />
                <Route path="event-packages"  element={<POS360EventPackagesMonetization />} />
                <Route path="payments-closeout" element={<POS360PaymentsCloseout />} />
                <Route path="staff-labor-governance" element={<POS360StaffLaborGovernance />} />
                <Route path="reports-analytics-decision" element={<POS360ReportsAnalyticsDecision />} />
                <Route path="settings-venue-admin" element={<POS360SettingsVenueAdmin />} />
                <Route path="external-integrations" element={<POS360ExternalIntegrations />} />
                <Route path="fulfillment-kds" element={<POS360FulfillmentKds />} />
                <Route path="self-ordering" element={<POS360SelfOrdering />} />
                <Route path="production-readiness" element={<POS360ProductionReadiness />} />
              </Route>

              {/* ── NOVEE OS — module registry ─────────────────────── */}
              <Route path="novee-os/modules" element={<NoveeOSModuleRegistry />} />
              <Route path="novee-os/tenants" element={<NoveeOSTenantGovernance />} />
              <Route path="novee-os/billing" element={<NoveeOSBillingGovernance />} />
              <Route path="novee-os/security" element={<NoveeOSSecurityGovernance />} />
              <Route path="crafthub/dashboard" element={<CraftHubDashboard />} />
              <Route path="crafthub/onboarding" element={<CraftHubOnboardingWizard />} />
              <Route path="novee-os/final-readiness" element={<NoveeOSFinalReadiness />} />
              <Route path="phase-d/provider-activation" element={<PhaseDProviderActivation />} />
              <Route path="phase-d/payment-provider-activation" element={<PhaseDPaymentProviderActivation />} />
              <Route path="phase-d/external-pos-activation" element={<PhaseDExternalPOSActivation />} />
              <Route path="phase-d/inventory-activation" element={<PhaseDInventoryActivation />} />
              <Route path="phase-d/communication-activation" element={<PhaseDCommunicationActivation />} />
              <Route path="phase-d/security-activation"      element={<SecurityActivation />} />
              <Route path="phase-d/deployment-activation"    element={<DeploymentActivation />} />
              <Route path="phase-d/live-pilot-readiness"     element={<LivePilotReadiness />} />
              <Route path="novee-os/remote-distribution"    element={<RemoteModuleDistribution />} />
              <Route path="novee-os/onboarding-training"   element={<OnboardingTrainingCenter />} />
              <Route path="novee-os/ambi-foundation"       element={<AMBIFoundation />} />
              <Route path="novee-os/documentation-portal"  element={<DocumentationPortal />} />
              <Route path="novee-os/command-center"         element={<NoveeOSCommandCenter />} />
              <Route path="novee-os/360-platforms"          element={<NoveeOS360PlatformRegistry />} />
              <Route path="placeholder/*"                   element={<ModulePlaceholderReserved />} />

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
                <Route path="smokecraft-panel" element={<EATSmokeCraftPanel />} />
              </Route>

              {/* Venue Management Command Hub (Package 6B) — no route-level
                  guard: the server enforces requireAuth + requireVenueMembership
                  on every endpoint; a guest/unauthorized user sees the page's
                  own permission-denied state, same pattern as
                  ManagementSyncAnalytics. */}
              <Route path="venue-management" element={<VenueManagementCommandHub />} />

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

              {/* ── Protected: admin+ — Error log viewer (R19) ── */}
              <Route path="smokecraft/error-log" element={
                <ProtectedRoute
                  allowedRoles={['admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Admin Login"
                  lockedMessage="Error log viewer requires admin-level access or higher."
                  demoBlocked
                >
                  <ErrorLogViewer />
                </ProtectedRoute>
              } />

              {/* ── Protected: admin+ — Feature flag administration (R18) ── */}
              <Route path="smokecraft/feature-flag-admin" element={
                <ProtectedRoute
                  allowedRoles={['admin','founder_level_0']}
                  loginRoute="/admin-login"
                  loginLabel="Admin Login"
                  lockedMessage="Feature flag administration requires admin-level access or higher."
                  demoBlocked
                >
                  <FeatureFlagAdmin />
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
              {/* Legacy per-session URLs — each redirects to its actual Session N route, not the index */}
              <Route path="smokecraft/session-1" element={<Navigate to="/smokecraft" replace />} />
              <Route path="smokecraft/session-2" element={<Navigate to="/smokecraft/enroll" replace />} />
              <Route path="smokecraft/session-3" element={<Navigate to="/smokecraft/golden-box" replace />} />
              <Route path="smokecraft/session-4" element={<Navigate to="/smokecraft/mentor-selection" replace />} />

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
