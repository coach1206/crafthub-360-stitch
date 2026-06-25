import { Outlet, useLocation } from 'react-router-dom'
import TicketTicker from './common/TicketTicker.jsx'

const systemTickerItems = [
  {
    id: 'system-live-1',
    source: 'LIVE VENUE TICKER',
    sourceColor: '#E9C176',
    title: 'Tonight',
    message: 'Maduro + Bourbon Pairing',
    route: '/smokecraft/pairing',
    ctaLabel: 'Start Pairing',
  },
  {
    id: 'system-live-2',
    source: 'E.A.T. COMMAND CENTER',
    sourceColor: '#D8B86F',
    title: 'Featured cocktail',
    message: 'Wine Cellar Flight at 8 PM',
    route: '/winecraft',
    ctaLabel: 'Open Cellar',
  },
  {
    id: 'system-live-3',
    source: 'HUMIDOR',
    sourceColor: '#E6C98D',
    title: 'Humidor spotlight',
    message: 'Member-only experience now broadcasting',
    route: '/smokecraft',
    ctaLabel: 'Open SmokeCraft',
  },
  {
    id: 'system-live-4',
    source: 'DAYONE360',
    sourceColor: '#F0D8A0',
    title: 'Travel feature',
    message: 'Dominican Escape Preview',
    route: '/dayone360',
    ctaLabel: 'Explore Travel',
  },
  {
    id: 'system-live-5',
    source: 'PASSPORT',
    sourceColor: '#D7BD7A',
    title: 'Passport challenge',
    message: 'VIP tasting alert: Passport Members Earn Double XP Tonight',
    route: '/passport',
    ctaLabel: 'Open Passport',
  },
]

export default function Layout() {
  const { pathname } = useLocation()
  // The SmokeCraft game entrance is a cinematic first-viewport experience — the
  // venue ticker competes with the hero for attention, so it is hidden on that route.
  const hideTicker = pathname === '/smokecraft' || pathname.startsWith('/smokecraft/')

  return (
    <>
      {!hideTicker && (
        <div style={{ position: 'sticky', top: 0, zIndex: 60 }}>
          <TicketTicker items={systemTickerItems} />
        </div>
      )}
      <Outlet />
    </>
  )
}
