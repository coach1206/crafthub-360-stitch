import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import CraftHub from './pages/CraftHub.jsx'
import SmokeCraft from './pages/SmokeCraft.jsx'
import PourCraft from './pages/PourCraft.jsx'
import BeerCraft from './pages/BeerCraft.jsx'
import WineCraft from './pages/WineCraft.jsx'
import PassportConnection from './pages/PassportConnection.jsx'
import POS3 from './pages/POS3.jsx'
import EATCommand from './pages/EATCommand.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index           element={<Home />} />
          <Route path="crafthub"   element={<CraftHub />} />
          <Route path="smokecraft" element={<SmokeCraft />} />
          <Route path="pourcraft"  element={<PourCraft />} />
          <Route path="beercraft"  element={<BeerCraft />} />
          <Route path="winecraft"  element={<WineCraft />} />
          <Route path="passport"   element={<PassportConnection />} />
          <Route path="pos"        element={<POS3 />} />
          <Route path="eat"        element={<EATCommand />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
