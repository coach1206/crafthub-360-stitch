import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import CraftHub from './pages/CraftHub.jsx'
import PourCraft from './pages/PourCraft.jsx'
import BeerCraft from './pages/BeerCraft.jsx'
import WineCraft from './pages/WineCraft.jsx'
import PassportConnection from './pages/PassportConnection.jsx'
import PassportProfile from './pages/passport/PassportProfile.jsx'
import PassportStamps from './pages/passport/PassportStamps.jsx'
import POS3 from './pages/POS3.jsx'
import EATCommand from './pages/EATCommand.jsx'

import Boot from './pages/Boot.jsx'
import SmokeCraft from './pages/SmokeCraft.jsx'
import Enroll from './pages/smokecraft/Enroll.jsx'
import GoldenBox from './pages/smokecraft/GoldenBox.jsx'
import GoldenBoxStatus from './pages/smokecraft/GoldenBoxStatus.jsx'
import Art from './pages/smokecraft/Art.jsx'
import Mentor from './pages/smokecraft/Mentor.jsx'
import Origins from './pages/smokecraft/Origins.jsx'
import Leaves from './pages/smokecraft/Leaves.jsx'
import LeafChallenge from './pages/smokecraft/LeafChallenge.jsx'
import Cultivation from './pages/smokecraft/Cultivation.jsx'
import Blend from './pages/smokecraft/Blend.jsx'
import FlavorDNA from './pages/smokecraft/FlavorDNA.jsx'
import Pairing from './pages/smokecraft/Pairing.jsx'
import Available from './pages/smokecraft/Available.jsx'
import SessionComplete from './pages/smokecraft/SessionComplete.jsx'
import Terroir from './pages/smokecraft/Terroir.jsx'
import PairingMastery from './pages/smokecraft/PairingMastery.jsx'
import Vitola from './pages/smokecraft/Vitola.jsx'
import Identity from './pages/smokecraft/Identity.jsx'
import Leaderboard from './pages/smokecraft/Leaderboard.jsx'
import PassportStamp from './pages/smokecraft/PassportStamp.jsx'

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
      <Routes>
        {/* Boot screen — outside BootGuard so it's always accessible */}
        <Route path="boot" element={<Boot />} />

        {/* All app routes — guarded by boot + pass-through Layout */}
        <Route
          element={
            <BootGuard>
              <Layout />
            </BootGuard>
          }
        >
          <Route index           element={<Home />} />
          <Route path="crafthub" element={<CraftHub />} />

          {/* SmokeCraft 360 journey */}
          <Route path="smokecraft">
            <Route index element={<SmokeCraft />} />
            <Route path="enroll"          element={<Enroll />} />
            <Route path="golden-box">
              <Route index              element={<GoldenBox />} />
              <Route path="status"      element={<GoldenBoxStatus />} />
            </Route>
            <Route path="art"             element={<Art />} />
            <Route path="mentor"          element={<Mentor />} />
            <Route path="origins"         element={<Origins />} />
            <Route path="leaves"          element={<Leaves />} />
            <Route path="leaf-challenge"  element={<LeafChallenge />} />
            <Route path="cultivation"     element={<Cultivation />} />
            <Route path="blend"           element={<Blend />} />
            <Route path="flavor-dna"      element={<FlavorDNA />} />
            <Route path="pairing"         element={<Pairing />} />
            <Route path="available"       element={<Available />} />
            <Route path="session-complete"element={<SessionComplete />} />
            <Route path="terroir"         element={<Terroir />} />
            <Route path="pairing-mastery" element={<PairingMastery />} />
            <Route path="vitola"          element={<Vitola />} />
            <Route path="identity"        element={<Identity />} />
            <Route path="leaderboard"     element={<Leaderboard />} />
            <Route path="passport-stamp"  element={<PassportStamp />} />
          </Route>

          {/* 360 Passport */}
          <Route path="passport">
            <Route index           element={<PassportConnection />} />
            <Route path="profile"  element={<PassportProfile />} />
            <Route path="stamps"   element={<PassportStamps />} />
          </Route>

          {/* Passport Networking — QR / kiosk entry alias */}
          <Route path="passport-networking" element={<PassportConnection />} />

          <Route path="pourcraft"  element={<PourCraft />} />
          <Route path="beercraft"  element={<BeerCraft />} />
          <Route path="winecraft"  element={<WineCraft />} />
          <Route path="pos"        element={<POS3 />} />
          <Route path="eat"        element={<EATCommand />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
